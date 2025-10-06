import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentNotificationRequest {
  documentId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { documentId }: DocumentNotificationRequest = await req.json();

    console.log('Fetching document data for notification:', documentId);

    // Buscar dados do documento, obrigação e cliente
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select(`
        *,
        client:clients (
          name,
          email
        ),
        obligation:obligations (
          name
        )
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('Error fetching document:', docError);
      throw new Error('Documento não encontrado');
    }

    const { client, obligation, competence, due_at, amount } = document;

    console.log('Sending notification to:', client.email);

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

    // Enviar email
    const { error: emailError } = await resend.emails.send({
      from: 'Declara Psi <onboarding@resend.dev>',
      to: [client.email],
      subject: `Novo documento disponível - ${obligation.name}`,
      html,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw emailError;
    }

    console.log('Document notification sent successfully to:', client.email);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Notificação enviada com sucesso' 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-document-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
