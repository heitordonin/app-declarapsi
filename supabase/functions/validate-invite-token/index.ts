import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'missing_token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to validate token (public endpoint)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: tokenData, error } = await supabase
      .from('patient_invite_tokens')
      .select('id, client_id, expires_at, used_at')
      .eq('token', token)
      .single();

    if (error || !tokenData) {
      console.log('Token not found:', token);
      return new Response(
        JSON.stringify({ valid: false, reason: 'invalid' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token was already used
    if (tokenData.used_at) {
      console.log('Token already used:', token);
      return new Response(
        JSON.stringify({ valid: false, reason: 'used' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token expired
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      console.log('Token expired:', token);
      return new Response(
        JSON.stringify({ valid: false, reason: 'expired' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Token valid for client:', tokenData.client_id);
    return new Response(
      JSON.stringify({ valid: true, clientId: tokenData.client_id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error validating token:', error);
    return new Response(
      JSON.stringify({ valid: false, reason: 'error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
