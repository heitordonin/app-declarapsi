import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface EmailQueueItem {
  id: string;
  document_id: string;
  email_id: string | null;
  status: string;
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  next_retry_at: string | null;
  processed_at: string | null;
  created_at: string;
  document?: {
    id: string;
    file_name: string;
    competence: string;
    client?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

interface UseEmailQueueOptions {
  status?: string;
  page?: number;
  pageSize?: number;
}

export function useEmailQueue(options: UseEmailQueueOptions = {}) {
  const { status, page = 1, pageSize = 20 } = options;

  return useQuery({
    queryKey: ['email-queue', status, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('email_queue')
        .select(`
          *,
          document:documents!document_id (
            id,
            file_name,
            competence,
            client:clients!client_id (
              id,
              name,
              email
            )
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        items: (data || []) as unknown as EmailQueueItem[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page,
      };
    },
  });
}

export function useEmailQueueFailedCount() {
  return useQuery({
    queryKey: ['email-queue-failed-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('email_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed');

      if (error) throw error;
      return count || 0;
    },
  });
}

export function useReprocessEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (queueId: string) => {
      const { error } = await supabase
        .from('email_queue')
        .update({
          status: 'pending',
          attempts: 0,
          error_message: null,
          next_retry_at: new Date().toISOString(),
        })
        .eq('id', queueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-queue'] });
      queryClient.invalidateQueries({ queryKey: ['email-queue-failed-count'] });
      toast({
        title: 'E-mail reagendado',
        description: 'O e-mail foi adicionado novamente à fila de envio.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível reagendar o e-mail.',
        variant: 'destructive',
      });
    },
  });
}

export function useCancelEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (queueId: string) => {
      const { error } = await supabase
        .from('email_queue')
        .delete()
        .eq('id', queueId)
        .eq('status', 'pending');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-queue'] });
      queryClient.invalidateQueries({ queryKey: ['email-queue-failed-count'] });
      toast({
        title: 'E-mail cancelado',
        description: 'O e-mail foi removido da fila de envio.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar o e-mail.',
        variant: 'destructive',
      });
    },
  });
}
