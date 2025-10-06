import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MonthSelector } from '@/components/relatorios/MonthSelector';
import { ObrigacaoDonutChart } from '@/components/relatorios/ObrigacaoDonutChart';
import { format } from 'date-fns';

export default function Relatorios() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Estatísticas gerais
  const { data: generalStats, isLoading: loadingGeneral } = useQuery({
    queryKey: ['general-stats', selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obligation_instances')
        .select('status')
        .like('competence', `${selectedMonth}%`);

      if (error) throw error;

      // Agrupar por status
      const grouped = data.reduce((acc: Record<string, number>, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(grouped).map(([status, count]) => ({
        status,
        count: count as number,
      }));
    },
  });

  // Estatísticas por obrigação
  const { data: obligationStats, isLoading: loadingObligations } = useQuery({
    queryKey: ['obligation-stats', selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obligation_instances')
        .select(`
          status,
          obligation:obligations(id, name)
        `)
        .like('competence', `${selectedMonth}%`);

      if (error) throw error;

      // Agrupar por obrigação e status
      const grouped = data.reduce((acc: Record<string, any>, item) => {
        const obligationId = item.obligation.id;
        const obligationName = item.obligation.name;

        if (!acc[obligationId]) {
          acc[obligationId] = {
            name: obligationName,
            stats: {},
          };
        }

        acc[obligationId].stats[item.status] =
          (acc[obligationId].stats[item.status] || 0) + 1;

        return acc;
      }, {});

      return Object.entries(grouped).map(([id, data]: [string, any]) => ({
        id,
        name: data.name,
        data: Object.entries(data.stats).map(([status, count]) => ({
          status,
          count: count as number,
        })),
      }));
    },
  });

  if (loadingGeneral || loadingObligations) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Relatórios</h1>
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="space-y-6">
        <ObrigacaoDonutChart
          title="Geral - Todas as Obrigações"
          data={generalStats || []}
        />

        {obligationStats && obligationStats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {obligationStats.map((obligation) => (
              <ObrigacaoDonutChart
                key={obligation.id}
                title={obligation.name}
                data={obligation.data}
              />
            ))}
          </div>
        )}

        {(!obligationStats || obligationStats.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma obrigação encontrada para este período.
          </div>
        )}
      </div>
    </div>
  );
}
