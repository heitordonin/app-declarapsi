import { useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, Paperclip } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSanitizedHTML } from '@/hooks/useSanitizedHTML';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Communication, CommunicationAttachment } from '@/hooks/cliente/useCommunicationsData';

interface ViewCommunicationDialogProps {
  communication: Communication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkAsViewed?: (id: string) => void;
}

export function ViewCommunicationDialog({ 
  communication, 
  open, 
  onOpenChange,
  onMarkAsViewed,
}: ViewCommunicationDialogProps) {
  const sanitizedMessage = useSanitizedHTML(communication?.message || '');
  const { toast } = useToast();

  // Marca como lido quando abrir (se ainda não lido)
  useEffect(() => {
    if (open && communication && !communication.viewedAt && onMarkAsViewed) {
      onMarkAsViewed(communication.id);
    }
  }, [open, communication, onMarkAsViewed]);

  const downloadAttachment = async (attachment: CommunicationAttachment) => {
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
        description: error.message || 'Não foi possível baixar o arquivo.',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!communication) return null;

  const hasAttachments = communication.attachments && communication.attachments.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{communication.subject}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Enviado em {format(new Date(communication.sentAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </DialogHeader>

        {/* Mensagem */}
        <div 
          className="prose prose-sm dark:prose-invert max-w-none mt-4"
          dangerouslySetInnerHTML={{ __html: sanitizedMessage }}
        />

        {/* Anexos */}
        {hasAttachments && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Paperclip className="h-4 w-4" />
              <span>Anexos ({communication.attachments.length})</span>
            </div>
            <div className="space-y-2">
              {communication.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">
                      {attachment.name}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
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
      </DialogContent>
    </Dialog>
  );
}
