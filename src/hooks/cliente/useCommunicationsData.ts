import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClientId } from './useClientId';

export interface CommunicationAttachment {
  name: string;
  path: string;
  size: number;
}

export interface Communication {
  id: string;                    // id do communication_recipient
  communicationId: string;       // id do communication
  subject: string;
  message: string;
  sentAt: string;
  viewedAt: string | null;
  attachments: CommunicationAttachment[];
}

export function useCommunicationsData() {
  const queryClient = useQueryClient();
  const { clientId } = useClientId();

  const { data: communications = [], isLoading, error } = useQuery({
    queryKey: ['client-communications', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      // Buscar comunicados via communication_recipients
      const { data, error } = await supabase
        .from('communication_recipients')
        .select(`
          id,
          viewed_at,
          communication:communications(
            id,
            subject,
            message,
            sent_at,
            attachments
          )
        `)
        .eq('client_id', clientId)
        .order('sent_at', { foreignTable: 'communications', ascending: false });

      if (error) throw error;

      // Mapear para interface Communication
      return (data || [])
        .filter((item) => item.communication) // Filtra itens sem comunicação
        .map((item) => {
          const comm = item.communication as unknown as {
            id: string;
            subject: string;
            message: string;
            sent_at: string;
            attachments: unknown;
          };
          
          // Parseia attachments de forma segura
          let attachments: CommunicationAttachment[] = [];
          if (Array.isArray(comm.attachments)) {
            attachments = comm.attachments as CommunicationAttachment[];
          }
          
          return {
            id: item.id,
            communicationId: comm.id,
            subject: comm.subject,
            message: comm.message,
            sentAt: comm.sent_at,
            viewedAt: item.viewed_at,
            attachments,
          };
        });
    },
    enabled: !!clientId,
  });

  // Mutation para marcar como lido
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
      queryClient.invalidateQueries({ queryKey: ['unread-communications-count'] });
    },
  });

  return {
    communications,
    isLoading,
    error,
    markAsViewed: markAsViewedMutation.mutate,
  };
}
