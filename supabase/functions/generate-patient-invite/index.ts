import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_ACTIVE_TOKENS = 10;
const TOKEN_EXPIRY_HOURS = 24;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // Get client_id for this user
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      console.error('Client error:', clientError);
      return new Response(
        JSON.stringify({ error: 'Cliente não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientId = client.id;
    console.log('Client ID:', clientId);

    // Check active tokens count using service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { count, error: countError } = await supabaseAdmin
      .from('patient_invite_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString());

    if (countError) {
      console.error('Count error:', countError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar tokens ativos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if ((count ?? 0) >= MAX_ACTIVE_TOKENS) {
      return new Response(
        JSON.stringify({ error: `Limite de ${MAX_ACTIVE_TOKENS} links ativos atingido. Aguarde a expiração ou uso dos links existentes.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate secure token
    const token = crypto.randomUUID() + '-' + crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    // Insert token using service role to bypass RLS
    const { error: insertError } = await supabaseAdmin
      .from('patient_invite_tokens')
      .insert({
        client_id: clientId,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the registration URL
    const appUrl = Deno.env.get('SUPABASE_URL')?.includes('localhost')
      ? 'http://localhost:5173'
      : 'https://app.declarapsi.com.br';
    
    const registrationUrl = `${appUrl}/cadastro-paciente?token=${token}`;

    console.log('Token generated successfully for client:', clientId);

    return new Response(
      JSON.stringify({ url: registrationUrl, expiresAt: expiresAt.toISOString() }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
