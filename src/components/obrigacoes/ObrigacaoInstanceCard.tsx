import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusStyles, STATUS_CONFIG, type ObligationStatus } from '@/lib/obligation-status-utils';
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
    <Card className="p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div 
          style={{ backgroundColor: STATUS_CONFIG[instance.status].chart }}
          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
        >
          <StatusIcon className="h-4 w-4 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-base leading-tight">
            {instance.obligation.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {instance.client.name}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
              {instance.competence}
            </Badge>
            <Badge 
              style={{ 
                backgroundColor: STATUS_CONFIG[instance.status].chart + '20',
                color: STATUS_CONFIG[instance.status].chart,
                borderColor: STATUS_CONFIG[instance.status].chart
              }}
              className="text-[10px] py-0 px-1.5 border"
            >
              {statusStyles.label}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {!isDone && (
            <Button
              size="sm"
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="h-7 text-xs"
            >
              {completeMutation.isPending ? 'Salvando...' : 'Concluir'}
            </Button>
          )}
          {isDone && instance.completed_at && (
            <p className="text-[10px] text-muted-foreground text-right">
              Concluída em<br/>{format(new Date(instance.completed_at), 'dd/MM/yyyy')}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
