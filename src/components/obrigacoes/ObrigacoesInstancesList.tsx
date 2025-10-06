import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ObrigacaoInstanceCard } from './ObrigacaoInstanceCard';
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

  const { data: instances, isLoading, error } = useQuery({
    queryKey: ['obligation-instances', selectedDate?.toISOString()],
    retry: false,
    queryFn: async () => {
      let query = supabase
        .from('obligation_instances')
        .select(`
          *,
          obligation:obligations(name),
          client:clients(name)
        `)
        .order('due_at', { ascending: true });

      if (selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        query = query.eq('due_at', dateStr);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

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

  if (!instances || instances.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {selectedDate
          ? 'Nenhuma obrigação encontrada para esta data.'
          : 'Nenhuma obrigação cadastrada.'}
      </div>
    );
  }

  // Filtrar instâncias baseado no toggle
  const filteredInstances = showCompleted 
    ? instances 
    : instances.filter(inst => inst.status !== 'on_time_done' && inst.status !== 'late_done');

  // Agrupar por data
  const groupedByDate: Record<string, typeof instances> = {};
  filteredInstances.forEach(instance => {
    const dateKey = instance.due_at;
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(instance);
  });

  // Ordenar datas
  const sortedDates = Object.keys(groupedByDate).sort();

  // Prioridade de status para ordenação
  const statusPriority: Record<ObligationStatus, number> = {
    overdue: 1,
    due_48h: 2,
    pending: 3,
    late_done: 4,
    on_time_done: 5,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Switch
          id="show-completed"
          checked={showCompleted}
          onCheckedChange={setShowCompleted}
        />
        <Label htmlFor="show-completed" className="text-sm cursor-pointer">
          Exibir concluídas
        </Label>
      </div>

      {sortedDates.map(dateKey => {
        const dateInstances = groupedByDate[dateKey];
        
        // Separar pendentes e concluídas
        const pending = dateInstances.filter(inst => 
          inst.status === 'overdue' || inst.status === 'due_48h' || inst.status === 'pending'
        ).sort((a, b) => statusPriority[a.status as ObligationStatus] - statusPriority[b.status as ObligationStatus]);
        
        const completed = dateInstances.filter(inst => 
          inst.status === 'on_time_done' || inst.status === 'late_done'
        );

        const totalCount = dateInstances.length;
        const completedCount = completed.length;

        return (
          <div key={dateKey} className="space-y-3">
            <div className="flex items-baseline justify-between border-b pb-2">
              <h3 className="text-lg font-semibold uppercase">
                {format(new Date(dateKey), "EEE, dd/MM/yyyy", { locale: ptBR })}
              </h3>
              <span className="text-sm text-muted-foreground">
                {completedCount}/{totalCount}
              </span>
            </div>
            
            {pending.length > 0 && (
              <div className="space-y-2">
                {pending.map((instance) => (
                  <ObrigacaoInstanceCard key={instance.id} instance={instance} />
                ))}
              </div>
            )}
            
            {completed.length > 0 && showCompleted && (
              <div className="space-y-2">
                {completed.map((instance) => (
                  <ObrigacaoInstanceCard key={instance.id} instance={instance} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
