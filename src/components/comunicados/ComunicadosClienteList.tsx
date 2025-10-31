import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ViewComunicadoClienteDialog } from './ViewComunicadoClienteDialog';
import { useSanitizedHTML } from '@/hooks/useSanitizedHTML';

export function ComunicadosClienteList() {
  const [selectedComunicado, setSelectedComunicado] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: comunicados, isLoading } = useQuery({
    queryKey: ['client-communications'],
    queryFn: async () => {
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!clientData) return [];

      const { data, error } = await supabase
        .from('communication_recipients')
        .select(`
          *,
          communication:communications(*)
        `)
        .eq('client_id', clientData.id)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleView = (item: any) => {
    setSelectedComunicado(item);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : comunicados?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum comunicado recebido
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {comunicados?.map((item) => {
            const communication = item.communication;
            const attachments = Array.isArray(communication.attachments) ? communication.attachments : [];
            const hasAttachments = attachments.length > 0;
            const isNew = !item.viewed_at;
            
            // Sanitizar preview para prevenir XSS
            const preview = communication.message.substring(0, 150) + '...';
            const sanitizedPreview = useSanitizedHTML(preview);

            return (
              <Card
                key={item.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleView(item)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{communication.subject}</h3>
                        {isNew && (
                          <Badge variant="default" className="text-xs">
                            Novo
                          </Badge>
                        )}
                        {hasAttachments && (
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(communication.sent_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: sanitizedPreview }}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedComunicado && (
        <ViewComunicadoClienteDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          recipient={selectedComunicado}
        />
      )}
    </div>
  );
}
