import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface ViewComunicadoClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: any;
}

export function ViewComunicadoClienteDialog({
  open,
  onOpenChange,
  recipient,
}: ViewComunicadoClienteDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const communication = recipient?.communication;

  const markAsViewedMutation = useMutation({
    mutationFn: async (recipientId: string) => {
      const { error } = await supabase
        .from('communication_recipients')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', recipientId)
        .is('viewed_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-communications'] });
    },
  });

  useEffect(() => {
    if (open && recipient && !recipient.viewed_at) {
      markAsViewedMutation.mutate(recipient.id);
    }
  }, [open, recipient]);

  const downloadAttachment = async (attachment: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('communication_attachments')
        .download(attachment.path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: 'Erro ao baixar anexo',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!communication) return null;

  const attachments = Array.isArray(communication.attachments) ? communication.attachments : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{communication.subject}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Enviado em{' '}
            {format(new Date(communication.sent_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </div>

          <div className="prose prose-sm max-w-none border rounded-lg p-4 bg-muted/30">
            <div dangerouslySetInnerHTML={{ __html: communication.message }} />
          </div>

          {attachments.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Anexos</h3>
              <div className="space-y-2">
                {attachments.map((attachment: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <span className="text-sm font-medium">{attachment.name}</span>
                      <p className="text-xs text-muted-foreground">
                        {(attachment.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadAttachment(attachment)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
