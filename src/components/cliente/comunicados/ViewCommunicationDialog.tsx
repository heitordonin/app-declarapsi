import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSanitizedHTML } from '@/hooks/useSanitizedHTML';
import type { Communication } from '@/hooks/cliente/useCommunicationsData';

interface ViewCommunicationDialogProps {
  communication: Communication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewCommunicationDialog({ 
  communication, 
  open, 
  onOpenChange 
}: ViewCommunicationDialogProps) {
  const sanitizedMessage = useSanitizedHTML(communication?.message || '');

  if (!communication) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{communication.subject}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Enviado em {format(new Date(communication.sentAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </DialogHeader>
        <div 
          className="prose prose-sm dark:prose-invert max-w-none mt-4"
          dangerouslySetInnerHTML={{ __html: sanitizedMessage }}
        />
      </DialogContent>
    </Dialog>
  );
}
