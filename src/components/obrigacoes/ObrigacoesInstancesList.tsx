import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ObrigacaoInstanceCard } from './ObrigacaoInstanceCard';
import { format } from 'date-fns';

interface ObrigacoesInstancesListProps {
  selectedDate: Date | undefined;
}

export function ObrigacoesInstancesList({ selectedDate }: ObrigacoesInstancesListProps) {
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
        .order('status', { ascending: true })
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

  // Sort by priority: overdue > due_48h > pending > late_done > on_time_done
  const statusPriority: Record<string, number> = {
    overdue: 1,
    due_48h: 2,
    pending: 3,
    late_done: 4,
    on_time_done: 5,
  };

  const sortedInstances = [...instances].sort((a, b) => {
    const priorityA = statusPriority[a.status] || 999;
    const priorityB = statusPriority[b.status] || 999;
    return priorityA - priorityB;
  });

  return (
    <div className="space-y-3">
      {sortedInstances.map((instance) => (
        <ObrigacaoInstanceCard key={instance.id} instance={instance} />
      ))}
    </div>
  );
}
