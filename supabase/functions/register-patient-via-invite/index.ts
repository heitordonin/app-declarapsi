import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CPF validation
function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

// CNPJ validation
function isValidCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;
  
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleanCNPJ.charAt(13))) return false;
  
  return true;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, patientData } = await req.json();

    if (!token || !patientData) {
      return new Response(
        JSON.stringify({ error: 'Token e dados do paciente são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for all operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('patient_invite_tokens')
      .select('id, client_id, expires_at, used_at')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token not found:', token);
      return new Response(
        JSON.stringify({ error: 'Link inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (tokenData.used_at) {
      return new Response(
        JSON.stringify({ error: 'Este link já foi utilizado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Este link expirou' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate patient data
    const { name, type, is_foreign_payment, document, email, phone } = patientData;

    if (!name || name.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Nome deve ter pelo menos 3 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['pf', 'pj'].includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Tipo de cadastro inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!is_foreign_payment && document) {
      if (type === 'pf' && !isValidCPF(document)) {
        return new Response(
          JSON.stringify({ error: 'CPF inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (type === 'pj' && !isValidCNPJ(document)) {
        return new Response(
          JSON.stringify({ error: 'CNPJ inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!is_foreign_payment && !document) {
      return new Response(
        JSON.stringify({ error: type === 'pf' ? 'CPF é obrigatório' : 'CNPJ é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return new Response(
        JSON.stringify({ error: 'Telefone inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate financial responsible CPF if provided
    if (patientData.has_financial_responsible && patientData.financial_responsible_cpf) {
      if (!isValidCPF(patientData.financial_responsible_cpf)) {
        return new Response(
          JSON.stringify({ error: 'CPF do responsável inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Insert patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert({
        client_id: tokenData.client_id,
        name: patientData.name,
        type: patientData.type,
        is_foreign_payment: patientData.is_foreign_payment,
        document: patientData.document || null,
        email: patientData.email,
        phone: patientData.phone,
        cep: patientData.cep || null,
        address: patientData.address || null,
        number: patientData.number || null,
        complement: patientData.complement || null,
        neighborhood: patientData.neighborhood || null,
        city: patientData.city || null,
        state: patientData.state || null,
        has_financial_responsible: patientData.has_financial_responsible,
        financial_responsible_cpf: patientData.financial_responsible_cpf || null,
        created_via: 'invite_link',
      })
      .select()
      .single();

    if (patientError) {
      console.error('Error inserting patient:', patientError);
      return new Response(
        JSON.stringify({ error: 'Erro ao cadastrar paciente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark token as used
    const { error: updateError } = await supabase
      .from('patient_invite_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    if (updateError) {
      console.error('Error marking token as used:', updateError);
      // Don't fail the request, patient was already created
    }

    console.log('Patient registered successfully:', patient.id);

    return new Response(
      JSON.stringify({ success: true, patientId: patient.id }),
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
