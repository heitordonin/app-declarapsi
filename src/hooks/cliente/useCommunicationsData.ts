import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

  const { data: communications = [], isLoading, error } = useQuery({
    queryKey: ['client-communications'],
    queryFn: async () => {
      // 1. Buscar user logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // 2. Buscar client_id do usuário
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (clientError || !clientData) return [];

      // 3. Buscar comunicados via communication_recipients
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
        .eq('client_id', clientData.id)
        .order('sent_at', { foreignTable: 'communications', ascending: false });

      if (error) throw error;

      // 4. Mapear para interface Communication
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
    },
  });

  return {
    communications,
    isLoading,
    error,
    markAsViewed: markAsViewedMutation.mutate,
  };
}
