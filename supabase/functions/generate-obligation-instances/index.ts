import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClientObligation {
  id: string;
  client_id: string;
  obligation_id: string;
  active: boolean;
  created_at: string;
  obligation: {
    name: string;
    frequency: 'weekly' | 'monthly' | 'annual';
    internal_target_day: number;
    legal_due_rule: number | null;
  };
  client: {
    created_at: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting instance generation...');

    // Buscar todos os vínculos ativos com suas obrigações e clientes
    const { data: clientObligations, error: fetchError } = await supabase
      .from('client_obligations')
      .select(`
        id,
        client_id,
        obligation_id,
        active,
        created_at,
        obligation:obligations!inner(
          name,
          frequency,
          internal_target_day,
          legal_due_rule
        ),
        client:clients!inner(
          created_at
        )
      `)
      .eq('active', true);

    if (fetchError) {
      console.error('Error fetching client obligations:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${clientObligations?.length || 0} active client obligations`);

    const instancesToCreate = [];
    const today = new Date();
    const monthsAhead = 12;

    for (const co of (clientObligations as any as ClientObligation[])) {
      const startDate = new Date(co.created_at);
      
      // Gerar competências baseadas na frequência
      const competences = generateCompetences(
        startDate,
        co.obligation.frequency,
        monthsAhead
      );

      for (const competence of competences) {
        // Verificar se já existe instância para essa competência
        const { data: existingInstance } = await supabase
          .from('obligation_instances')
          .select('id')
          .eq('client_id', co.client_id)
          .eq('obligation_id', co.obligation_id)
          .eq('competence', competence)
          .maybeSingle();

        if (existingInstance) {
          console.log(`Instance already exists for ${competence}`);
          continue;
        }

        // Calcular datas
        const dueAt = calculateDueDate(competence, co.obligation.legal_due_rule);
        const internalTargetAt = calculateInternalTargetDate(
          competence,
          co.obligation.internal_target_day
        );

        // Não criar instâncias com vencimento no passado
        if (new Date(dueAt) < today) {
          continue;
        }

        instancesToCreate.push({
          client_id: co.client_id,
          obligation_id: co.obligation_id,
          competence,
          due_at: dueAt,
          internal_target_at: internalTargetAt,
          status: 'pending',
          notified_due_day: false,
        });
      }
    }

    console.log(`Creating ${instancesToCreate.length} new instances`);

    // Inserir instâncias em lote
    if (instancesToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('obligation_instances')
        .insert(instancesToCreate);

      if (insertError) {
        console.error('Error inserting instances:', insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        instancesCreated: instancesToCreate.length,
        message: `Successfully created ${instancesToCreate.length} obligation instances`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in generate-obligation-instances:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Gera competências baseadas na frequência
function generateCompetences(
  startDate: Date,
  frequency: 'weekly' | 'monthly' | 'annual',
  monthsAhead: number
): string[] {
  const competences: string[] = [];
  const today = new Date();
  
  // Começar a partir do mês atual ou mês de criação do vínculo
  let currentDate = new Date(Math.max(startDate.getTime(), today.getTime()));
  currentDate.setDate(1); // Primeiro dia do mês
  
  const endDate = new Date(currentDate);
  endDate.setMonth(endDate.getMonth() + monthsAhead);

  while (currentDate <= endDate) {
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    
    if (frequency === 'monthly') {
      competences.push(`${month}/${year}`);
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else if (frequency === 'annual') {
      // Gerar apenas para o mesmo mês a cada ano
      if (currentDate.getMonth() === startDate.getMonth()) {
        competences.push(`${month}/${year}`);
      }
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else if (frequency === 'weekly') {
      // Para semanal, geramos todas as semanas do período
      competences.push(`${month}/${year}`);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  return competences;
}

// Calcula data de vencimento baseada na regra legal
function calculateDueDate(competence: string, legalDueRule: number | null): string {
  const [month, year] = competence.split('/').map(Number);
  
  if (!legalDueRule) {
    // Se não tem regra, vence no último dia do mês seguinte
    const dueDate = new Date(year, month, 0); // Último dia do mês seguinte
    return dueDate.toISOString().split('T')[0];
  }

  // Vencimento é no dia especificado do mês seguinte
  const dueDate = new Date(year, month, legalDueRule);
  return dueDate.toISOString().split('T')[0];
}

// Calcula data da meta interna
function calculateInternalTargetDate(competence: string, targetDay: number): string {
  const [month, year] = competence.split('/').map(Number);
  
  // Meta interna é no dia especificado do mês seguinte ao da competência
  const targetDate = new Date(year, month, targetDay);
  return targetDate.toISOString().split('T')[0];
}
