import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const [completingId, setCompletingId] = useState<string | null>(null);

  const completeMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      const now = new Date();
      const dueDate = new Date(internal_target_at);
      const isLate = now > dueDate;
      const newStatus = isLate ? 'late_done' : 'on_time_done';

      const { error } = await supabase
        .from('obligation_instances')
        .update({
          status: newStatus,
          completed_at: now.toISOString(),
        })
        .eq('id', instanceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligation-instances'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-instances'] });
      toast.success('Obrigação marcada como concluída');
      setCompletingId(null);
    },
    onError: (error) => {
      console.error('Erro ao concluir obrigação:', error);
      toast.error('Erro ao concluir obrigação');
      setCompletingId(null);
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
              const isCompleting = completingId === client.instance_id;

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
                      onClick={() => {
                        setCompletingId(client.instance_id);
                        completeMutation.mutate(client.instance_id);
                      }}
                      disabled={isCompleting || completeMutation.isPending}
                    >
                      {isCompleting ? 'Salvando...' : 'Concluir'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
