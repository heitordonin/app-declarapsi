import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MonthSelector } from '@/components/relatorios/MonthSelector';
import { ObrigacaoDonutChart } from '@/components/relatorios/ObrigacaoDonutChart';
import { KPICard } from '@/components/relatorios/KPICard';
import { StatusEvolutionChart } from '@/components/relatorios/StatusEvolutionChart';
import { ClientComparisonChart } from '@/components/relatorios/ClientComparisonChart';
import { InstancesTable } from '@/components/relatorios/InstancesTable';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';

export default function Relatorios() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Estatísticas gerais
  const { data: generalStats, isLoading: loadingGeneral } = useQuery({
    queryKey: ['general-stats', selectedMonth],
    queryFn: async () => {
      // Calcular range de datas para o mês selecionado
      const [year, month] = selectedMonth.split('-');
      const firstDay = `${year}-${month}-01`;
      const nextMonthDate = new Date(parseInt(year), parseInt(month), 1);
      const lastDay = format(nextMonthDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('obligation_instances')
        .select(`
          status,
          client:clients!inner(org_id)
        `)
        .gte('due_at', firstDay)
        .lt('due_at', lastDay);

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

  // Evolução temporal (últimos 6 meses)
  const { data: evolutionData } = useQuery({
    queryKey: ['evolution-stats'],
    queryFn: async () => {
      const months = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(new Date(), 5 - i);
        const [year, month] = format(date, 'yyyy-MM').split('-');
        const firstDay = `${year}-${month}-01`;
        const nextMonthDate = new Date(parseInt(year), parseInt(month), 1);
        const lastDay = format(nextMonthDate, 'yyyy-MM-dd');
        
        return {
          value: format(date, 'yyyy-MM'),
          firstDay,
          lastDay,
          display: format(date, "MMM/yy", { locale: ptBR }),
        };
      });

      const results = await Promise.all(
        months.map(async (month) => {
          const { data, error } = await supabase
            .from('obligation_instances')
            .select(`
              status,
              client:clients!inner(org_id)
            `)
            .gte('due_at', month.firstDay)
            .lt('due_at', month.lastDay);

          if (error) throw error;

          const grouped = data.reduce((acc: Record<string, number>, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          }, {});

          return {
            month: month.display,
            ...grouped,
          };
        })
      );

      return results;
    },
  });

  // Comparação por cliente
  const { data: clientComparison } = useQuery({
    queryKey: ['client-comparison', selectedMonth],
    queryFn: async () => {
      const [year, month] = selectedMonth.split('-');
      const firstDay = `${year}-${month}-01`;
      const nextMonthDate = new Date(parseInt(year), parseInt(month), 1);
      const lastDay = format(nextMonthDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('obligation_instances')
        .select(`
          status,
          client:clients!inner(id, name, org_id)
        `)
        .gte('due_at', firstDay)
        .lt('due_at', lastDay);

      if (error) throw error;

      const grouped = data.reduce((acc: Record<string, any>, item) => {
        const clientId = item.client.id;
        const clientName = item.client.name;

        if (!acc[clientId]) {
          acc[clientId] = {
            clientName,
            completed: 0,
            pending: 0,
            overdue: 0,
          };
        }

        if (item.status === 'on_time_done' || item.status === 'late_done') {
          acc[clientId].completed++;
        } else if (item.status === 'pending' || item.status === 'due_48h') {
          acc[clientId].pending++;
        } else if (item.status === 'overdue') {
          acc[clientId].overdue++;
        }

        return acc;
      }, {});

      return Object.values(grouped);
    },
  });

  // Instâncias detalhadas
  const { data: instances } = useQuery({
    queryKey: ['instances-detail', selectedMonth],
    queryFn: async () => {
      const [year, month] = selectedMonth.split('-');
      const firstDay = `${year}-${month}-01`;
      const nextMonthDate = new Date(parseInt(year), parseInt(month), 1);
      const lastDay = format(nextMonthDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('obligation_instances')
        .select(`
          id,
          competence,
          due_at,
          status,
          client:clients!inner(name, org_id),
          obligation:obligations(name)
        `)
        .gte('due_at', firstDay)
        .lt('due_at', lastDay)
        .order('due_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Estatísticas por obrigação
  const { data: obligationStats, isLoading: loadingObligations } = useQuery({
    queryKey: ['obligation-stats', selectedMonth],
    queryFn: async () => {
      // Calcular range de datas para o mês selecionado
      const [year, month] = selectedMonth.split('-');
      const firstDay = `${year}-${month}-01`;
      const nextMonthDate = new Date(parseInt(year), parseInt(month), 1);
      const lastDay = format(nextMonthDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('obligation_instances')
        .select(`
          status,
          obligation:obligations(id, name),
          client:clients!inner(org_id)
        `)
        .gte('due_at', firstDay)
        .lt('due_at', lastDay);

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

      {/* Gráfico de Evolução Temporal */}
      <StatusEvolutionChart data={evolutionData || []} />

      {/* Gráfico de Comparação entre Clientes */}
      <ClientComparisonChart data={(clientComparison as any) || []} />

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

      {/* Tabela Detalhada de Instâncias */}
      <InstancesTable data={(instances as any) || []} />

      {(!obligationStats || obligationStats.length === 0) && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma obrigação encontrada para este período.
        </div>
      )}
    </div>
  );
}
