import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 10; // Processar 10 emails por vez
const DELAY_BETWEEN_EMAILS_MS = 500; // 500ms entre cada envio

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Processing email queue...');

    // Buscar emails pendentes que podem ser processados
    const { data: pendingEmails, error: fetchError } = await supabaseClient
      .from('email_queue')
      .select(`
        id,
        document_id,
        attempts,
        max_attempts,
        documents (
          id,
          competence,
          due_at,
          amount,
          client:clients (
            id,
            name,
            email
          ),
          obligation:obligations (
            id,
            name
          )
        )
      `)
      .eq('status', 'pending')
      .lte('next_retry_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error('Error fetching pending emails:', fetchError);
      throw fetchError;
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('No pending emails to process');
      return new Response(
        JSON.stringify({ message: 'No pending emails', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${pendingEmails.length} emails...`);

    let successCount = 0;
    let failedCount = 0;

    for (const queueItem of pendingEmails) {
      try {
        // Marcar como processando
        await supabaseClient
          .from('email_queue')
          .update({ status: 'processing' })
          .eq('id', queueItem.id);

        const document = queueItem.documents as any;
        if (!document?.client?.email) {
          throw new Error('Documento ou cliente não encontrado');
        }

        const { client, obligation, competence, due_at, amount } = document;

        // Formatar data de vencimento
        const dueDate = new Date(due_at);
        const formattedDueDate = dueDate.toLocaleDateString('pt-BR');

        // Formatar valor (se existir)
        const formattedAmount = amount ? parseFloat(amount).toFixed(2) : undefined;

        // URL da área do cliente
        const appUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || '';
        const clientAreaLink = `${appUrl}/cliente/documentos`;

        // Criar HTML do email
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
                <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Novo Documento Disponível</h1>
                <p style="color: #333; font-size: 16px; line-height: 1.5;">
                  Olá <strong>${client.name}</strong>,
                </p>
                <p style="color: #333; font-size: 16px; line-height: 1.5;">
                  Um novo documento foi disponibilizado na sua área do cliente:
                </p>
                <div style="background-color: #f8f9fa; border-radius: 5px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 8px 0;"><strong>Obrigação:</strong> ${obligation.name}</p>
                  <p style="margin: 8px 0;"><strong>Competência:</strong> ${competence}</p>
                  <p style="margin: 8px 0;"><strong>Vencimento:</strong> ${formattedDueDate}</p>
                  ${formattedAmount ? `<p style="margin: 8px 0;"><strong>Valor:</strong> R$ ${formattedAmount}</p>` : ''}
                </div>
                <a href="${clientAreaLink}" style="display: inline-block; background-color: #5469d4; color: white; text-decoration: none; padding: 14px 30px; border-radius: 5px; margin: 20px 0;">
                  Acessar Área do Cliente
                </a>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  Declara Psi - Gestão de Obrigações
                </p>
              </div>
            </body>
          </html>
        `;

        // Enviar email com tracking habilitado
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'Declara Psi <onboarding@resend.dev>',
          to: [client.email],
          subject: `Novo documento disponível - ${obligation.name}`,
          html,
          headers: {
            'X-Document-Id': document.id,
          },
        });

        if (emailError) {
          throw emailError;
        }

        // Marcar como enviado e salvar email_id para tracking
        await supabaseClient
          .from('email_queue')
          .update({
            status: 'sent',
            email_id: emailData?.id || null,
            processed_at: new Date().toISOString(),
            attempts: queueItem.attempts + 1,
          })
          .eq('id', queueItem.id);

        // Atualizar delivery_state do documento para 'delivered'
        // (será atualizado para 'opened' quando o webhook receber o evento)
        await supabaseClient
          .from('documents')
          .update({ delivery_state: 'delivered' })
          .eq('id', document.id);

        console.log(`Email sent successfully to ${client.email} for document ${document.id}`);
        successCount++;

        // Delay entre envios para respeitar rate limits
        if (pendingEmails.indexOf(queueItem) < pendingEmails.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_EMAILS_MS));
        }
      } catch (error: any) {
        console.error(`Error processing queue item ${queueItem.id}:`, error);

        const newAttempts = queueItem.attempts + 1;
        const shouldRetry = newAttempts < queueItem.max_attempts;

        // Calcular próxima tentativa com backoff exponencial (1min, 5min, 15min)
        const retryDelays = [60, 300, 900]; // segundos
        const nextRetryDelay = retryDelays[Math.min(newAttempts - 1, retryDelays.length - 1)] * 1000;
        const nextRetryAt = new Date(Date.now() + nextRetryDelay).toISOString();

        await supabaseClient
          .from('email_queue')
          .update({
            status: shouldRetry ? 'pending' : 'failed',
            attempts: newAttempts,
            error_message: error?.message || 'Unknown error',
            next_retry_at: shouldRetry ? nextRetryAt : null,
            processed_at: shouldRetry ? null : new Date().toISOString(),
          })
          .eq('id', queueItem.id);

        failedCount++;
      }
    }

    console.log(`Email queue processed: ${successCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        message: 'Email queue processed',
        processed: pendingEmails.length,
        success: successCount,
        failed: failedCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in process-email-queue:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
