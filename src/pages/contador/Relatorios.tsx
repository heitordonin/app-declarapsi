import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MonthSelector } from '@/components/relatorios/MonthSelector';
import { ObrigacaoDonutChart } from '@/components/relatorios/ObrigacaoDonutChart';
import { KPICard } from '@/components/relatorios/KPICard';
import { StatusEvolutionChart } from '@/components/relatorios/StatusEvolutionChart';
import { InstancesTable } from '@/components/relatorios/InstancesTable';
import { format, subMonths, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getEffectiveStatus, ObligationStatus } from '@/lib/obligation-status-utils';

// Helper function to get date range for a month
function getMonthRange(yearMonth: string) {
  const [year, month] = yearMonth.split('-').map(Number);
  const firstDayDate = new Date(year, month - 1, 1); // month is 0-indexed in JS Date
  const lastDayDate = endOfMonth(firstDayDate);
  
  return {
    firstDay: format(firstDayDate, 'yyyy-MM-dd'),
    lastDay: format(lastDayDate, 'yyyy-MM-dd'),
  };
}

function ReportsSkeleton() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-48" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function Relatorios() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Estatísticas gerais - usando internal_target_at com cálculo de status em tempo real
  const { data: generalStats, isLoading: loadingGeneral } = useQuery({
    queryKey: ['general-stats', selectedMonth],
    queryFn: async () => {
      const { firstDay, lastDay } = getMonthRange(selectedMonth);

      const { data, error } = await supabase
        .from('obligation_instances')
        .select(`
          status,
          internal_target_at,
          client:clients!inner(org_id)
        `)
        .gte('internal_target_at', firstDay)
        .lte('internal_target_at', lastDay);

      if (error) throw error;

      // Agrupar por status EFETIVO (calculado em tempo real)
      const grouped = data.reduce((acc: Record<string, number>, item) => {
        const effectiveStatus = getEffectiveStatus(
          item.status as ObligationStatus,
          item.internal_target_at
        );
        acc[effectiveStatus] = (acc[effectiveStatus] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(grouped).map(([status, count]) => ({
        status,
        count: count as number,
      }));
    },
  });

  // Evolução temporal (últimos 6 meses a partir do mês selecionado)
  const { data: evolutionData } = useQuery({
    queryKey: ['evolution-stats', selectedMonth],
    queryFn: async () => {
      const [year, month] = selectedMonth.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, 1);
      
      const months = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(selectedDate, 5 - i);
        const monthStr = format(date, 'yyyy-MM');
        const { firstDay, lastDay } = getMonthRange(monthStr);
        
        return {
          value: monthStr,
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
              internal_target_at,
              client:clients!inner(org_id)
            `)
            .gte('internal_target_at', month.firstDay)
            .lte('internal_target_at', month.lastDay);

          if (error) throw error;

          // Usar status efetivo calculado em tempo real
          const grouped = data.reduce((acc: Record<string, number>, item) => {
            const effectiveStatus = getEffectiveStatus(
              item.status as ObligationStatus,
              item.internal_target_at
            );
            acc[effectiveStatus] = (acc[effectiveStatus] || 0) + 1;
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

  // Instâncias detalhadas
  const { data: instances } = useQuery({
    queryKey: ['instances-detail', selectedMonth],
    queryFn: async () => {
      const { firstDay, lastDay } = getMonthRange(selectedMonth);

      const { data, error } = await supabase
        .from('obligation_instances')
        .select(`
          id,
          competence,
          due_at,
          internal_target_at,
          status,
          client:clients!inner(name, org_id),
          obligation:obligations(name)
        `)
        .gte('internal_target_at', firstDay)
        .lte('internal_target_at', lastDay)
        .order('internal_target_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Estatísticas por obrigação
  const { data: obligationStats, isLoading: loadingObligations } = useQuery({
    queryKey: ['obligation-stats', selectedMonth],
    queryFn: async () => {
      const { firstDay, lastDay } = getMonthRange(selectedMonth);

      const { data, error } = await supabase
        .from('obligation_instances')
        .select(`
          status,
          internal_target_at,
          obligation:obligations(id, name),
          client:clients!inner(org_id)
        `)
        .gte('internal_target_at', firstDay)
        .lte('internal_target_at', lastDay);

      if (error) throw error;

      // Agrupar por obrigação e status EFETIVO
      const grouped = data.reduce((acc: Record<string, any>, item) => {
        const obligationId = item.obligation.id;
        const obligationName = item.obligation.name;
        const effectiveStatus = getEffectiveStatus(
          item.status as ObligationStatus,
          item.internal_target_at
        );

        if (!acc[obligationId]) {
          acc[obligationId] = {
            name: obligationName,
            stats: {},
          };
        }

        acc[obligationId].stats[effectiveStatus] =
          (acc[obligationId].stats[effectiveStatus] || 0) + 1;

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
    return <ReportsSkeleton />;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

      <Separator />

      {/* Gráfico de Distribuição por Status */}
      <div className="max-w-xl">
        <ObrigacaoDonutChart
          title="Distribuição por Status"
          data={generalStats || []}
        />
      </div>

      {/* Gráfico de Evolução Temporal - largura total */}
      <StatusEvolutionChart data={evolutionData || []} />

      <Separator />

      {/* Gráficos por Obrigação */}
      {obligationStats && obligationStats.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Detalhamento por Obrigação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      <Separator />

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
