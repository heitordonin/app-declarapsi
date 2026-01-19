import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting obligation status update based on internal_target_at...');

    const now = new Date();
    const nowStr = now.toISOString().split('T')[0];
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const in48HoursStr = in48Hours.toISOString().split('T')[0];

    // 1. Atualizar pending → due_48h 
    // Quando prazo interno está a 48h ou menos (mas ainda não passou)
    const { data: updatedToDue48h, error: error1 } = await supabase
      .from('obligation_instances')
      .update({ status: 'due_48h' })
      .eq('status', 'pending')
      .lte('internal_target_at', in48HoursStr)
      .gt('internal_target_at', nowStr)
      .select();

    if (error1) {
      console.error('Error updating to due_48h:', error1);
      throw error1;
    }

    console.log(`Updated ${updatedToDue48h?.length || 0} instances to due_48h`);

    // 2. Atualizar pending/due_48h → overdue 
    // Quando prazo interno já passou e não foi concluída
    const { data: updatedToOverdue, error: error2 } = await supabase
      .from('obligation_instances')
      .update({ status: 'overdue' })
      .in('status', ['pending', 'due_48h'])
      .lt('internal_target_at', nowStr)
      .select();

    if (error2) {
      console.error('Error updating to overdue:', error2);
      throw error2;
    }

    console.log(`Updated ${updatedToOverdue?.length || 0} instances to overdue`);

    const totalUpdated = (updatedToDue48h?.length || 0) + (updatedToOverdue?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${totalUpdated} obligation instances`,
        details: {
          due_48h: updatedToDue48h?.length || 0,
          overdue: updatedToOverdue?.length || 0,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in update-obligation-statuses:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
