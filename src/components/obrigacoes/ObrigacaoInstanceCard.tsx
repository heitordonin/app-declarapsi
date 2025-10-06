import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getStatusStyles, STATUS_CONFIG, type ObligationStatus } from '@/lib/obligation-status-utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CompleteObligationDialog } from './CompleteObligationDialog';

interface ObrigacaoInstanceCardProps {
  instance: {
    id: string;
    competence: string;
    due_at: string;
    internal_target_at: string;
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

export function ObrigacaoInstanceCard({ instance }: ObrigacaoInstanceCardProps) {
  const queryClient = useQueryClient();
  const statusStyles = getStatusStyles(instance.status);
  const StatusIcon = statusStyles.icon;
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showUnmarkDialog, setShowUnmarkDialog] = useState(false);

  const completeMutation = useMutation({
    mutationFn: async (notes: string) => {
      const now = new Date();
      const dueDate = new Date(instance.internal_target_at);
      const isLate = now > dueDate;
      const newStatus = isLate ? 'late_done' : 'on_time_done';

      const { error } = await supabase
        .from('obligation_instances')
        .update({
          status: newStatus,
          completed_at: now.toISOString(),
          completion_notes: notes,
        })
        .eq('id', instance.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligation-instances'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-instances'] });
      toast.success('Obrigação marcada como concluída');
      setShowCompleteDialog(false);
    },
    onError: (error) => {
      console.error('Erro ao concluir obrigação:', error);
      toast.error('Erro ao concluir obrigação');
    },
  });

  const unmarkMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const targetDate = new Date(instance.internal_target_at);
      const diffTime = targetDate.getTime() - now.getTime();
      const diffHours = diffTime / (1000 * 60 * 60);

      let newStatus: ObligationStatus = 'pending';
      if (now > targetDate) {
        newStatus = 'overdue';
      } else if (diffHours <= 48) {
        newStatus = 'due_48h';
      }

      const { error } = await supabase
        .from('obligation_instances')
        .update({
          status: newStatus,
          completed_at: null,
          completion_notes: null,
        })
        .eq('id', instance.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligation-instances'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-instances'] });
      toast.success('Conclusão desmarcada');
      setShowUnmarkDialog(false);
    },
    onError: (error) => {
      console.error('Erro ao desmarcar obrigação:', error);
      toast.error('Erro ao desmarcar obrigação');
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
              onClick={() => setShowCompleteDialog(true)}
              disabled={completeMutation.isPending}
              className="h-7 text-xs"
            >
              Concluir
            </Button>
          )}
          {isDone && (
            <div className="flex flex-col items-end gap-2">
              {instance.completed_at && (
                <p className="text-[10px] text-muted-foreground text-right">
                  Concluída em<br/>{format(new Date(instance.completed_at), 'dd/MM/yyyy')}
                </p>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowUnmarkDialog(true)}
                disabled={unmarkMutation.isPending}
                className="h-7 text-xs"
              >
                Desmarcar
              </Button>
            </div>
          )}
        </div>
      </div>

      <CompleteObligationDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        onConfirm={(notes) => completeMutation.mutate(notes)}
        isLoading={completeMutation.isPending}
        obligationName={instance.obligation.name}
        clientName={instance.client.name}
      />

      <AlertDialog open={showUnmarkDialog} onOpenChange={setShowUnmarkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desmarcar conclusão?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta obrigação será marcada como não concluída e voltará ao status pendente.
              A justificativa será removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unmarkMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unmarkMutation.mutate()}
              disabled={unmarkMutation.isPending}
            >
              {unmarkMutation.isPending ? 'Processando...' : 'Desmarcar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
