import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const systemPrompt = `Você é um especialista em leitura de documentos fiscais brasileiros (DARF e GPS).
Analise a imagem do documento e extraia os campos de forma PRECISA.

PARA DARF (Documento de Arrecadação de Receitas Federais - Carnê Leão):
- CPF do contribuinte (apenas números, 11 dígitos)
- Código da Receita (campo "Código" no corpo, ex: 0190 para Carnê Leão)
- Período de Apuração → extrair apenas MM/YYYY (ignorar o dia)
- Data de Vencimento: buscar "Pagar este documento até" (topo) ou "Pagar até" (final), formato YYYY-MM-DD
- Valor Total

PARA GPS (Guia da Previdência Social - INSS):
- Campo 1: NIT/PIS/PASEP (apenas números, 11 dígitos)
- Campo 3: Código de Pagamento (ex: 1163, 1007)
- Campo 4: Competência no formato MM/YYYY
- Campo 2: Data de Vencimento, formato YYYY-MM-DD
- Campo 11: Valor Total

IMPORTANTE:
- Para competência, SEMPRE retorne no formato MM/YYYY (dois dígitos para mês, barra, quatro dígitos para ano)
- Para vencimento, SEMPRE retorne no formato YYYY-MM-DD
- Para valor, retorne apenas o número decimal (ex: 173.35)
- Se o documento for GPS, o código estará no campo 3
- Se não conseguir identificar algum campo, retorne null

Responda APENAS com JSON válido, sem markdown:
{
  "document_type": "darf" | "gps" | "unknown",
  "confidence": 0.0-1.0,
  "extracted_data": {
    "cpf": "apenas números ou null",
    "nit_nis": "apenas números ou null",
    "codigo": "código da receita/pagamento",
    "competencia": "MM/YYYY",
    "vencimento": "YYYY-MM-DD",
    "valor": número decimal
  },
  "raw_text": "texto relevante extraído do documento"
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { uploadId } = await req.json();
    
    if (!uploadId) {
      return new Response(
        JSON.stringify({ error: 'uploadId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the upload record
    const { data: upload, error: uploadError } = await supabase
      .from('staging_uploads')
      .select('*')
      .eq('id', uploadId)
      .single();

    if (uploadError || !upload) {
      throw new Error(`Upload not found: ${uploadError?.message}`);
    }

    // Update status to processing
    await supabase
      .from('staging_uploads')
      .update({ ocr_status: 'processing' })
      .eq('id', uploadId);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(upload.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Determine mime type
    const fileName = upload.file_name.toLowerCase();
    let mimeType = 'application/pdf';
    if (fileName.endsWith('.png')) mimeType = 'image/png';
    else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) mimeType = 'image/jpeg';

    // Call Lovable AI with vision
    const aiResponse = await fetch(LOVABLE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64}`
                }
              },
              {
                type: 'text',
                text: 'Analise este documento fiscal brasileiro e extraia os dados conforme instruído.'
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add credits.');
      }
      throw new Error(`AI processing failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let extractedData;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse OCR response');
    }

    // Perform client matching
    let clientMatch = {
      client_id: null as string | null,
      client_name: null as string | null,
      client_code: null as string | null,
      client_found: false,
      client_error: null as string | null,
    };

    const orgId = upload.org_id;

    if (extractedData.document_type === 'darf' && extractedData.extracted_data?.cpf) {
      const cpf = extractedData.extracted_data.cpf.replace(/\D/g, '');
      const { data: client } = await supabase
        .from('clients')
        .select('id, name, code, cpf')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .or(`cpf.eq.${cpf},cpf.eq.${formatCpf(cpf)}`)
        .maybeSingle();

      if (client) {
        clientMatch = {
          client_id: client.id,
          client_name: client.name,
          client_code: client.code,
          client_found: true,
          client_error: null,
        };
      } else {
        clientMatch.client_error = `CPF ${formatCpfDisplay(cpf)} não encontrado`;
      }
    } else if (extractedData.document_type === 'gps' && extractedData.extracted_data?.nit_nis) {
      const nitNis = extractedData.extracted_data.nit_nis.replace(/\D/g, '');
      const { data: client } = await supabase
        .from('clients')
        .select('id, name, code, nit_nis')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .or(`nit_nis.eq.${nitNis},nit_nis.eq.${formatNitNis(nitNis)}`)
        .maybeSingle();

      if (client) {
        clientMatch = {
          client_id: client.id,
          client_name: client.name,
          client_code: client.code,
          client_found: true,
          client_error: null,
        };
      } else {
        clientMatch.client_error = `NIT/NIS ${formatNitNisDisplay(nitNis)} não encontrado`;
      }
    } else {
      clientMatch.client_error = 'Identificador do cliente não detectado no documento';
    }

    // Perform obligation matching
    let obligationMatch = {
      obligation_id: null as string | null,
      obligation_name: null as string | null,
      obligation_found: false,
      obligation_error: null as string | null,
    };

    const codigo = extractedData.extracted_data?.codigo;
    if (codigo) {
      const { data: obligation } = await supabase
        .from('obligations')
        .select('id, name, fiscal_code')
        .eq('org_id', orgId)
        .eq('fiscal_code', codigo)
        .maybeSingle();

      if (obligation) {
        obligationMatch = {
          obligation_id: obligation.id,
          obligation_name: obligation.name,
          obligation_found: true,
          obligation_error: null,
        };
      } else {
        // Try to match by name pattern
        const codeNameMap: Record<string, string> = {
          '0190': 'Carnê Leão',
          '1163': '1163',
          '1007': '1007',
        };
        
        const searchTerm = codeNameMap[codigo];
        if (searchTerm) {
          const { data: obligationByName } = await supabase
            .from('obligations')
            .select('id, name')
            .eq('org_id', orgId)
            .ilike('name', `%${searchTerm}%`)
            .maybeSingle();

          if (obligationByName) {
            obligationMatch = {
              obligation_id: obligationByName.id,
              obligation_name: obligationByName.name,
              obligation_found: true,
              obligation_error: null,
            };
          } else {
            obligationMatch.obligation_error = `Código ${codigo} não mapeado para nenhuma obrigação`;
          }
        } else {
          obligationMatch.obligation_error = `Código ${codigo} desconhecido`;
        }
      }
    } else {
      obligationMatch.obligation_error = 'Código da obrigação não detectado no documento';
    }

    // Build OCR data
    const ocrData = {
      document_type: extractedData.document_type,
      confidence: extractedData.confidence || 0,
      extracted_data: extractedData.extracted_data,
      matching: {
        ...clientMatch,
        ...obligationMatch,
      },
      raw_text: extractedData.raw_text,
    };

    // Determine final status
    let ocrStatus = 'success';
    let ocrError = null;

    if (!clientMatch.client_found || !obligationMatch.obligation_found) {
      ocrStatus = 'needs_review';
      const errors = [];
      if (clientMatch.client_error) errors.push(clientMatch.client_error);
      if (obligationMatch.obligation_error) errors.push(obligationMatch.obligation_error);
      ocrError = errors.join('; ');
    }

    if (extractedData.confidence < 0.7) {
      ocrStatus = 'needs_review';
      ocrError = ocrError ? `${ocrError}; Confiança baixa` : 'Confiança baixa na leitura';
    }

    if (extractedData.document_type === 'unknown') {
      ocrStatus = 'error';
      ocrError = 'Tipo de documento não reconhecido';
    }

    // Format competence if needed
    let competence = extractedData.extracted_data?.competencia;
    if (competence && !competence.includes('/')) {
      // Try to format as MM/YYYY
      const match = competence.match(/(\d{2})(\d{4})/);
      if (match) {
        competence = `${match[1]}/${match[2]}`;
      }
    }

    // Update staging upload with OCR results
    const { error: updateError } = await supabase
      .from('staging_uploads')
      .update({
        ocr_status: ocrStatus,
        ocr_data: ocrData,
        ocr_error: ocrError,
        document_type: extractedData.document_type,
        client_id: clientMatch.client_id,
        obligation_id: obligationMatch.obligation_id,
        competence: competence,
        amount: extractedData.extracted_data?.valor || null,
        due_at: extractedData.extracted_data?.vencimento || null,
      })
      .eq('id', uploadId);

    if (updateError) {
      throw new Error(`Failed to update staging upload: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: ocrStatus,
        data: ocrData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('OCR processing error:', error);

    // Try to update status to error if we have the uploadId
    try {
      const { uploadId } = await req.clone().json();
      if (uploadId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('staging_uploads')
          .update({
            ocr_status: 'error',
            ocr_error: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', uploadId);
      }
    } catch (updateErr) {
      console.error('Failed to update error status:', updateErr);
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper functions
function formatCpf(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

function formatCpfDisplay(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

function formatNitNis(nitNis: string): string {
  const cleaned = nitNis.replace(/\D/g, '');
  if (cleaned.length !== 11) return nitNis;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 8)}.${cleaned.slice(8, 10)}-${cleaned.slice(10)}`;
}

function formatNitNisDisplay(nitNis: string): string {
  const cleaned = nitNis.replace(/\D/g, '');
  if (cleaned.length !== 11) return nitNis;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 8)}.${cleaned.slice(8, 10)}-${cleaned.slice(10)}`;
}
