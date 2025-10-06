import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusStyles, type ObligationStatus } from '@/lib/obligation-status-utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ObligacaoInstanceCardProps {
  instance: {
    id: string;
    competence: string;
    due_at: string;
    status: ObligationStatus;
    completed_at: string | null;
    obligation: {
      name: string;
    };
    client: {
      name: string;
    };
  };
}

export function ObrigacaoInstanceCard({ instance }: ObligacaoInstanceCardProps) {
  const queryClient = useQueryClient();
  const statusStyles = getStatusStyles(instance.status);
  const StatusIcon = statusStyles.icon;

  const completeMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const dueDate = new Date(instance.due_at);
      const isLate = now > dueDate;
      const newStatus = isLate ? 'late_done' : 'on_time_done';

      const { error } = await supabase
        .from('obligation_instances')
        .update({
          status: newStatus,
          completed_at: now.toISOString(),
        })
        .eq('id', instance.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligation-instances'] });
      toast.success('Obrigação marcada como concluída');
    },
    onError: (error) => {
      console.error('Erro ao concluir obrigação:', error);
      toast.error('Erro ao concluir obrigação');
    },
  });

  const isDone = instance.status === 'on_time_done' || instance.status === 'late_done';

  return (
    <Card className={`p-4 ${statusStyles.bg} ${statusStyles.border} border-l-4`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <StatusIcon className={`h-5 w-5 ${statusStyles.text} mt-1`} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">{instance.obligation.name}</h3>
            <p className="text-sm text-muted-foreground">{instance.client.name}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                Competência: {instance.competence}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Vencimento: {format(new Date(instance.due_at), "dd 'de' MMMM", { locale: ptBR })}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className={`${statusStyles.badge} text-white`}>
            {statusStyles.label}
          </Badge>
          {!isDone && (
            <Button
              size="sm"
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? 'Salvando...' : 'Concluir'}
            </Button>
          )}
          {isDone && instance.completed_at && (
            <p className="text-xs text-muted-foreground">
              Concluída em {format(new Date(instance.completed_at), 'dd/MM/yyyy')}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
