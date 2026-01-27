import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import { validateAccess } from '../_shared/middleware.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeEmailRequest {
  clientId: string;
  clientName: string;
  email: string;
  appUrl: string;
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

    // Validar autenticação e role de admin
    const { user } = await validateAccess(req, supabaseClient, 'admin', 'send-welcome-email');
    console.log('Admin user validated:', user.id);

    const { clientId, clientName, email, appUrl }: WelcomeEmailRequest = await req.json();

    console.log('Creating auth user for client:', { clientId, email });

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: clientName,
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw authError;
    }

    console.log('Auth user created:', authData.user.id);

    // Vincular user_id ao cliente
    const { error: updateError } = await supabaseClient
      .from('clients')
      .update({ user_id: authData.user.id })
      .eq('id', clientId);

    if (updateError) {
      console.error('Error updating client with user_id:', updateError);
      throw updateError;
    }

    // Criar role 'client' para o usuário
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'client',
        org_id: (await supabaseClient.from('clients').select('org_id').eq('id', clientId).single()).data?.org_id,
      });

    if (roleError) {
      console.error('Error creating user role:', roleError);
      throw roleError;
    }

    // Gerar link de recuperação para definir senha
    const { data: magicLinkData, error: magicLinkError } = await supabaseClient.auth.admin
      .generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: `${appUrl}/auth/callback`,
        },
      });

    if (magicLinkError) {
      console.error('Error generating magic link:', magicLinkError);
      throw magicLinkError;
    }

    console.log('Recovery link generated');

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
            <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Bem-vindo ao Declara Psi!</h1>
            <p style="color: #333; font-size: 16px; line-height: 1.5;">
              Olá <strong>${clientName}</strong>,
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.5;">
              Seu cadastro foi realizado com sucesso no sistema Declara Psi. 
              Para acessar sua área do cliente e definir sua senha, clique no link abaixo:
            </p>
            <a href="${magicLinkData.properties.action_link}" style="display: inline-block; background-color: #5469d4; color: white; text-decoration: none; padding: 14px 30px; border-radius: 5px; margin: 20px 0;">
              Definir Minha Senha
            </a>
            <p style="color: #666; font-size: 14px;">
              Este link é válido por 24 horas e pode ser usado apenas uma vez.
            </p>
            <p style="color: #666; font-size: 14px;">
              Se você não solicitou este cadastro, pode ignorar este email com segurança.
            </p>
            <p style="color: #8898aa; font-size: 12px; margin-top: 30px;">
              Declara Psi - Gestão de Obrigações
            </p>
          </div>
        </body>
      </html>
    `;

    // Enviar email
    const { error: emailError } = await resend.emails.send({
      from: 'Declara Psi <noreply@declarapsi.com.br>',
      to: [email],
      subject: 'Bem-vindo ao Declara Psi - Configure sua senha',
      html,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw emailError;
    }

    console.log('Welcome email sent successfully to:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: authData.user.id,
        message: 'Email de boas-vindas enviado com sucesso' 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-welcome-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
