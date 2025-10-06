import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ObrigacaoGroupedCard } from './ObrigacaoGroupedCard';
import { ObrigacaoClientsDialog } from './ObrigacaoClientsDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { ObligationStatus } from '@/lib/obligation-status-utils';

interface ObrigacoesInstancesListProps {
  selectedDate: Date | undefined;
}

export function ObrigacoesInstancesList({ selectedDate }: ObrigacoesInstancesListProps) {
  const [showCompleted, setShowCompleted] = useState(true);
  
  // Estado para o dialog
  const [selectedObligation, setSelectedObligation] = useState<{
    obligation_name: string;
    obligation_id: string;
    competence: string;
    internal_target_at: string;
    total: number;
    completed: number;
    overdue_count: number;
    clients: Array<{
      instance_id: string;
      client_id: string;
      client_name: string;
      status: ObligationStatus;
      completed_at: string | null;
    }>;
  } | null>(null);

  const { data: instances, isLoading, error } = useQuery({
    queryKey: ['obligation-instances', selectedDate],
    queryFn: async () => {
      let query = supabase
        .from('obligation_instances')
        .select(`
        *,
        obligation:obligations(name),
        client:clients(name)
      `)
        .order('internal_target_at', { ascending: true });

      if (selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        query = query.eq('internal_target_at', dateStr);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Agrupar por data e obrigação usando useMemo (ANTES dos returns condicionais)
  const groupedData = useMemo(() => {
    if (!instances || instances.length === 0) return {};

    // Filtrar instâncias baseado no toggle
    const filteredInstances = showCompleted 
      ? instances 
      : instances.filter(inst => 
          inst.status !== 'on_time_done' && inst.status !== 'late_done'
        );

    interface GroupedStructure {
      [date: string]: {
        [obligationId: string]: {
          obligation_name: string;
          obligation_id: string;
          competence: string;
          internal_target_at: string;
          clients: Array<{
            instance_id: string;
            client_id: string;
            client_name: string;
            status: ObligationStatus;
            completed_at: string | null;
          }>;
          total: number;
          completed: number;
          overdue_count: number;
        };
      };
    }

    const grouped: GroupedStructure = {};

    filteredInstances.forEach((instance) => {
      const dateKey = instance.internal_target_at;
      const obligationKey = `${instance.obligation_id}-${instance.competence}`;

      if (!grouped[dateKey]) {
        grouped[dateKey] = {};
      }

      if (!grouped[dateKey][obligationKey]) {
        grouped[dateKey][obligationKey] = {
          obligation_name: instance.obligation.name,
          obligation_id: instance.obligation_id,
          competence: instance.competence,
          internal_target_at: instance.internal_target_at,
          clients: [],
          total: 0,
          completed: 0,
          overdue_count: 0,
        };
      }

      const group = grouped[dateKey][obligationKey];

      group.clients.push({
        instance_id: instance.id,
        client_id: instance.client_id,
        client_name: instance.client.name,
        status: instance.status as ObligationStatus,
        completed_at: instance.completed_at,
      });

      group.total++;

      if (instance.status === 'on_time_done' || instance.status === 'late_done') {
        group.completed++;
      }

      if (instance.status === 'overdue') {
        group.overdue_count++;
      }
    });

    return grouped;
  }, [instances, showCompleted]);

  // Ordenar datas
  const sortedDates = Object.keys(groupedData).sort();

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Erro ao carregar obrigações. Tente novamente.
      </div>
    );
  }

  if (sortedDates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {selectedDate
          ? 'Nenhuma obrigação encontrada para esta data.'
          : 'Nenhuma obrigação cadastrada.'}
      </div>
    );
  }

  return (
    <>
      <div className="max-h-[600px] overflow-y-auto pr-2 space-y-6">
        <div className="flex items-center gap-2 sticky top-0 bg-background pb-4 z-10">
          <Switch
            id="show-completed"
            checked={showCompleted}
            onCheckedChange={setShowCompleted}
          />
          <Label htmlFor="show-completed" className="text-sm cursor-pointer">
            Exibir concluídas
          </Label>
        </div>

        {sortedDates.map((dateKey) => {
          const obligationsForDate = groupedData[dateKey];
          const obligationsList = Object.values(obligationsForDate);

          // Calcular totais para o header da data
          const totalCompleted = obligationsList.reduce((sum, obl) => sum + obl.completed, 0);
          const totalInstances = obligationsList.reduce((sum, obl) => sum + obl.total, 0);

          return (
            <div key={dateKey} className="space-y-3 min-w-0">
              <div className="flex items-baseline justify-between border-b pb-2 gap-2">
                <h3 className="text-lg font-semibold uppercase">
                  {format(new Date(dateKey), "EEE, dd/MM/yyyy", { locale: ptBR })}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {totalCompleted}/{totalInstances} concluídas
                </span>
              </div>
              
              <div className="space-y-3">
                {obligationsList.map((obligation) => (
                  <ObrigacaoGroupedCard
                    key={obligation.obligation_id}
                    obligation_name={obligation.obligation_name}
                    obligation_id={obligation.obligation_id}
                    competence={obligation.competence}
                    internal_target_at={obligation.internal_target_at}
                    total={obligation.total}
                    completed={obligation.completed}
                    overdue_count={obligation.overdue_count}
                    onClick={() => setSelectedObligation(obligation)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedObligation && (
        <ObrigacaoClientsDialog
          open={!!selectedObligation}
          onOpenChange={(open) => !open && setSelectedObligation(null)}
          obligation_name={selectedObligation.obligation_name}
          competence={selectedObligation.competence}
          internal_target_at={selectedObligation.internal_target_at}
          clients={selectedObligation.clients}
        />
      )}
    </>
  );
}