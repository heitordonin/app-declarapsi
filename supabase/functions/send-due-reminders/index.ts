import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting due reminders job...');

    // Data de hoje
    const today = new Date().toISOString().split('T')[0];

    console.log('Searching for documents due today:', today);

    // Buscar documentos que vencem hoje
    const { data: documents, error: docsError } = await supabaseClient
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
      .eq('due_at', today)
      .is('deleted_at', null);

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      throw docsError;
    }

    console.log(`Found ${documents?.length || 0} documents due today`);

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Nenhum documento vencendo hoje',
          count: 0
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Enviar email para cada documento
    const results = [];
    for (const document of documents) {
      try {
        const { client, obligation, competence, due_at, amount } = document;

        console.log('Sending reminder to:', client.email, 'for obligation:', obligation.name);

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
                <h1 style="color: #dc3545; font-size: 24px; margin-bottom: 20px;">⚠️ Documento Vencendo Hoje</h1>
                <p style="color: #333; font-size: 16px; line-height: 1.5;">
                  Olá <strong>${client.name}</strong>,
                </p>
                <p style="color: #dc3545; font-size: 16px; font-weight: bold; line-height: 1.5;">
                  Este é um lembrete de que o seguinte documento vence <strong>hoje</strong>:
                </p>
                <div style="background-color: #fff3cd; border-left: 4px solid #dc3545; border-radius: 5px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 8px 0;"><strong>Obrigação:</strong> ${obligation.name}</p>
                  <p style="margin: 8px 0;"><strong>Competência:</strong> ${competence}</p>
                  <p style="margin: 8px 0;"><strong>Vencimento:</strong> ${formattedDueDate}</p>
                  ${formattedAmount ? `<p style="margin: 8px 0;"><strong>Valor:</strong> R$ ${formattedAmount}</p>` : ''}
                </div>
                <p style="color: #333; font-size: 16px; line-height: 1.5;">
                  Não se esqueça de acessar sua área do cliente para baixar e processar este documento antes do vencimento.
                </p>
                <a href="${clientAreaLink}" style="display: inline-block; background-color: #dc3545; color: white; text-decoration: none; padding: 14px 30px; border-radius: 5px; margin: 20px 0;">
                  Acessar Área do Cliente
                </a>
                <p style="color: #8898aa; font-size: 12px; margin-top: 30px;">
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
          subject: `⚠️ Documento vencendo hoje - ${obligation.name}`,
          html,
        });

        if (emailError) {
          console.error('Error sending reminder to', client.email, ':', emailError);
          results.push({ email: client.email, success: false, error: emailError.message });
        } else {
          console.log('Reminder sent successfully to:', client.email);
          results.push({ email: client.email, success: true });
        }
      } catch (error: any) {
        console.error('Error processing document:', error);
        results.push({ 
          email: document.client?.email || 'unknown', 
          success: false, 
          error: error.message 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Sent ${successCount}/${documents.length} reminders successfully`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `${successCount} lembretes enviados com sucesso`,
        total: documents.length,
        results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-due-reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
