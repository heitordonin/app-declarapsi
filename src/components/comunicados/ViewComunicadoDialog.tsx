import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Check, X, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSanitizedHTML } from '@/hooks/useSanitizedHTML';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ViewComunicadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comunicado: any;
}

export function ViewComunicadoDialog({
  open,
  onOpenChange,
  comunicado,
}: ViewComunicadoDialogProps) {
  const { toast } = useToast();

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

  const attachments = Array.isArray(comunicado.attachments) ? comunicado.attachments : [];
  
  // Sanitizar HTML para prevenir XSS
  const sanitizedMessage = useSanitizedHTML(comunicado.message);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{comunicado.subject}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Enviado em {format(new Date(comunicado.sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </div>

          <div className="prose prose-sm max-w-none border rounded-lg p-4 bg-muted/30">
            <div dangerouslySetInnerHTML={{ __html: sanitizedMessage }} />
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Anexos</h3>
              <div className="space-y-2">
                {attachments.map((attachment: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <span className="text-sm">{attachment.name}</span>
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

          <div className="space-y-2">
            <h3 className="font-semibold">
              Destinatários ({comunicado.recipients?.length || 0})
            </h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-center">Visualizado na Plataforma</TableHead>
                    <TableHead className="text-center">Status Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comunicado.recipients?.map((recipient: any) => (
                    <TableRow key={recipient.id}>
                      <TableCell>{recipient.client?.name}</TableCell>
                      <TableCell className="text-center">
                        {recipient.viewed_at ? (
                          <div className="flex items-center justify-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(recipient.viewed_at), 'dd/MM/yyyy HH:mm', {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{recipient.email_status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
