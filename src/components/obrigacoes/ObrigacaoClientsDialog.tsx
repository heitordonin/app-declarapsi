import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getStatusStyles, type ObligationStatus } from '@/lib/obligation-status-utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';
import { CompleteObligationDialog } from './CompleteObligationDialog';

interface ClientInstance {
  instance_id: string;
  client_id: string;
  client_name: string;
  status: ObligationStatus;
  completed_at: string | null;
}

interface ObrigacaoClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obligation_name: string;
  competence: string;
  internal_target_at: string;
  clients: ClientInstance[];
}

export function ObrigacaoClientsDialog({
  open,
  onOpenChange,
  obligation_name,
  competence,
  internal_target_at,
  clients,
}: ObrigacaoClientsDialogProps) {
  const queryClient = useQueryClient();
  const [completingInstanceId, setCompletingInstanceId] = useState<string | null>(null);
  const [unmarkingInstanceId, setUnmarkingInstanceId] = useState<string | null>(null);

  const completeMutation = useMutation({
    mutationFn: async ({ instanceId, notes }: { instanceId: string; notes: string }) => {
      const now = new Date();
      const dueDate = new Date(internal_target_at);
      const isLate = now > dueDate;
      const newStatus = isLate ? 'late_done' : 'on_time_done';

      const { error } = await supabase
        .from('obligation_instances')
        .update({
          status: newStatus,
          completed_at: now.toISOString(),
          completion_notes: notes,
        })
        .eq('id', instanceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligation-instances'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-instances'] });
      toast.success('Obrigação marcada como concluída');
      setCompletingInstanceId(null);
    },
    onError: (error) => {
      console.error('Erro ao concluir obrigação:', error);
      toast.error('Erro ao concluir obrigação');
      setCompletingInstanceId(null);
    },
  });

  const unmarkMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      const now = new Date();
      const targetDate = new Date(internal_target_at);
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
        .eq('id', instanceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligation-instances'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-instances'] });
      toast.success('Conclusão desmarcada');
      setUnmarkingInstanceId(null);
    },
    onError: (error) => {
      console.error('Erro ao desmarcar obrigação:', error);
      toast.error('Erro ao desmarcar obrigação');
      setUnmarkingInstanceId(null);
    },
  });

  // Ordenar: pendentes primeiro (overdue no topo), depois concluídas
  const sortedClients = [...clients].sort((a, b) => {
    const statusPriority: Record<ObligationStatus, number> = {
      overdue: 1,
      due_48h: 2,
      pending: 3,
      late_done: 4,
      on_time_done: 5,
    };
    return statusPriority[a.status] - statusPriority[b.status];
  });

  const completedCount = clients.filter(
    c => c.status === 'on_time_done' || c.status === 'late_done'
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {obligation_name}
          </DialogTitle>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" className="text-sm">
              <Calendar className="h-3 w-3 mr-1" />
              {competence}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              Prazo Interno: {format(new Date(internal_target_at), 'dd/MM/yyyy', { locale: ptBR })}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground pt-2">
            {completedCount} de {clients.length} clientes concluídos
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          <div className="space-y-2">
            {sortedClients.map((client) => {
              const statusStyles = getStatusStyles(client.status);
              const StatusIcon = statusStyles.icon;
              const isDone = client.status === 'on_time_done' || client.status === 'late_done';

              return (
                <div
                  key={client.instance_id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      style={{ backgroundColor: statusStyles.chart }}
                      className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                    >
                      <StatusIcon className="h-4 w-4 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {client.client_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          style={{
                            backgroundColor: statusStyles.chart + '20',
                            color: statusStyles.chart,
                            borderColor: statusStyles.chart,
                          }}
                          className="text-xs border"
                        >
                          {statusStyles.label}
                        </Badge>
                        {isDone && client.completed_at && (
                          <span className="text-xs text-muted-foreground">
                            Concluída em {format(new Date(client.completed_at), 'dd/MM/yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isDone && (
                    <Button
                      size="sm"
                      onClick={() => setCompletingInstanceId(client.instance_id)}
                      disabled={completeMutation.isPending}
                    >
                      Concluir
                    </Button>
                  )}
                  {isDone && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setUnmarkingInstanceId(client.instance_id)}
                      disabled={unmarkMutation.isPending}
                    >
                      Desmarcar
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <CompleteObligationDialog
          open={!!completingInstanceId}
          onOpenChange={(open) => !open && setCompletingInstanceId(null)}
          onConfirm={(notes) => {
            if (completingInstanceId) {
              completeMutation.mutate({ instanceId: completingInstanceId, notes });
            }
          }}
          isLoading={completeMutation.isPending}
          obligationName={obligation_name}
          clientName={
            completingInstanceId
              ? clients.find((c) => c.instance_id === completingInstanceId)?.client_name
              : undefined
          }
        />

        <AlertDialog
          open={!!unmarkingInstanceId}
          onOpenChange={(open) => !open && setUnmarkingInstanceId(null)}
        >
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
                onClick={() => {
                  if (unmarkingInstanceId) {
                    unmarkMutation.mutate(unmarkingInstanceId);
                  }
                }}
                disabled={unmarkMutation.isPending}
              >
                {unmarkMutation.isPending ? 'Processando...' : 'Desmarcar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
