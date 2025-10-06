import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MonthSelector } from '@/components/relatorios/MonthSelector';
import { ObrigacaoDonutChart } from '@/components/relatorios/ObrigacaoDonutChart';
import { KPICard } from '@/components/relatorios/KPICard';
import { format } from 'date-fns';
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';

export default function Relatorios() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Estatísticas gerais
  const { data: generalStats, isLoading: loadingGeneral } = useQuery({
    queryKey: ['general-stats', selectedMonth],
    queryFn: async () => {
      // Converter formato YYYY-MM para MM/YYYY
      const [year, month] = selectedMonth.split('-');
      const competencePattern = `${month}/${year}`;

      const { data, error } = await supabase
        .from('obligation_instances')
        .select(`
          status,
          client:clients!inner(org_id)
        `)
        .eq('competence', competencePattern);

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
      // Converter formato YYYY-MM para MM/YYYY
      const [year, month] = selectedMonth.split('-');
      const competencePattern = `${month}/${year}`;

      const { data, error } = await supabase
        .from('obligation_instances')
        .select(`
          status,
          obligation:obligations(id, name),
          client:clients!inner(org_id)
        `)
        .eq('competence', competencePattern);

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

  // Calcular KPIs
  const kpis = useMemo(() => {
    if (!generalStats || generalStats.length === 0) {
      return {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        completionRate: 0,
      };
    }

    const total = generalStats.reduce((sum, item) => sum + item.count, 0);
    const completed = generalStats
      .filter(item => item.status === 'on_time_done' || item.status === 'late_done')
      .reduce((sum, item) => sum + item.count, 0);
    const pending = generalStats
      .filter(item => item.status === 'pending' || item.status === 'due_48h')
      .reduce((sum, item) => sum + item.count, 0);
    const overdue = generalStats
      .filter(item => item.status === 'overdue')
      .reduce((sum, item) => sum + item.count, 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, overdue, completionRate };
  }, [generalStats]);

  if (loadingGeneral || loadingObligations) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Relatórios</h1>
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Obrigações"
          value={kpis.total}
          icon={TrendingUp}
          description="Obrigações no período"
        />
        <KPICard
          title="Taxa de Cumprimento"
          value={`${kpis.completionRate}%`}
          icon={CheckCircle2}
          description={`${kpis.completed} concluídas`}
        />
        <KPICard
          title="Pendentes"
          value={kpis.pending}
          icon={Clock}
          description="Aguardando conclusão"
        />
        <KPICard
          title="Vencidas"
          value={kpis.overdue}
          icon={AlertCircle}
          description="Atrasadas"
        />
      </div>

      {/* Gráfico Geral */}
      <ObrigacaoDonutChart
        title="Geral - Todas as Obrigações"
        data={generalStats || []}
      />

      {/* Gráficos por Obrigação */}
      {obligationStats && obligationStats.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Detalhamento por Obrigação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {obligationStats.map((obligation) => (
              <ObrigacaoDonutChart
                key={obligation.id}
                title={obligation.name}
                data={obligation.data}
              />
            ))}
          </div>
        </div>
      )}

      {(!obligationStats || obligationStats.length === 0) && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma obrigação encontrada para este período.
        </div>
      )}
    </div>
  );
}
