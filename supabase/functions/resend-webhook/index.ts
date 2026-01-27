import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
};

// Mapeamento de eventos do Resend para delivery_state
const eventToState: Record<string, string> = {
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.bounced': 'bounced',
  'email.complained': 'failed', // spam complaint
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

    const body = await req.json();
    console.log('Received webhook event:', JSON.stringify(body, null, 2));

    const { type, data } = body;

    if (!type || !data) {
      console.log('Invalid webhook payload');
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Registrar evento na tabela email_events
    await supabaseClient
      .from('email_events')
      .insert({
        email_id: data.email_id || data.id,
        event_type: type.replace('email.', ''),
        recipient: data.to?.[0] || data.email || '',
        received_at: new Date().toISOString(),
        metadata: data,
      });

    // Buscar item na fila pelo email_id
    const { data: queueItem, error: queueError } = await supabaseClient
      .from('email_queue')
      .select('document_id')
      .eq('email_id', data.email_id || data.id)
      .maybeSingle();

    if (queueError) {
      console.error('Error fetching queue item:', queueError);
    }

    // Se encontrou o documento, atualizar o estado de entrega
    if (queueItem?.document_id && eventToState[type]) {
      const newState = eventToState[type];
      
      // Para 'opened', só atualiza se o estado atual não é 'opened' (primeira abertura)
      if (type === 'email.opened') {
        const { data: currentDoc } = await supabaseClient
          .from('documents')
          .select('delivery_state')
          .eq('id', queueItem.document_id)
          .single();

        // Só atualiza para 'opened' se ainda não foi aberto
        if (currentDoc?.delivery_state !== 'opened') {
          await supabaseClient
            .from('documents')
            .update({ delivery_state: newState })
            .eq('id', queueItem.document_id);

          console.log(`Document ${queueItem.document_id} marked as ${newState}`);
        }
      } else {
        // Para outros eventos, apenas atualiza se for "pior" ou igual
        // delivered -> bounced/failed é válido, opened -> delivered não é
        const stateOrder = ['sent', 'delivered', 'opened', 'bounced', 'failed'];
        const { data: currentDoc } = await supabaseClient
          .from('documents')
          .select('delivery_state')
          .eq('id', queueItem.document_id)
          .single();

        const currentIndex = stateOrder.indexOf(currentDoc?.delivery_state || 'sent');
        const newIndex = stateOrder.indexOf(newState);

        // Só atualiza se for progresso ou erro
        if (newIndex > currentIndex || ['bounced', 'failed'].includes(newState)) {
          await supabaseClient
            .from('documents')
            .update({ delivery_state: newState })
            .eq('id', queueItem.document_id);

          console.log(`Document ${queueItem.document_id} marked as ${newState}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in resend-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
