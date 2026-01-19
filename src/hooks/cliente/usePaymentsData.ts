import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isBefore, startOfDay } from 'date-fns';

export type PaymentStatus = 'pending' | 'viewed' | 'overdue';

export interface Payment {
  id: string;
  title: string;
  value: number | null;
  dueDate: string;
  status: PaymentStatus;
  deliveredAt: string;
  isNew: boolean;
  filePath: string;
  fileName: string;
  competence: string;
  viewedAt: string | null;
}

const getPaymentStatus = (dueAt: Date, viewedAt: string | null): PaymentStatus => {
  const today = startOfDay(new Date());
  if (isBefore(dueAt, today)) return 'overdue';
  if (viewedAt) return 'viewed';
  return 'pending';
};

export function usePaymentsData(clientId?: string) {
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ['client-payments', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          file_name,
          file_path,
          amount,
          due_at,
          delivered_at,
          delivery_state,
          competence,
          viewed_at,
          obligation:obligations(name)
        `)
        .eq('client_id', clientId)
        .is('deleted_at', null)
        .order('due_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((doc): Payment => {
        const dueDate = new Date(doc.due_at);
        
        return {
          id: doc.id,
          title: doc.obligation?.name || doc.file_name,
          value: doc.amount,
          dueDate: doc.due_at,
          status: getPaymentStatus(dueDate, doc.viewed_at),
          deliveredAt: doc.delivered_at,
          isNew: doc.delivery_state === 'sent' && !doc.viewed_at,
          filePath: doc.file_path,
          fileName: doc.file_name,
          competence: doc.competence,
          viewedAt: doc.viewed_at,
        };
      });
    },
    enabled: !!clientId,
  });

  const markAsViewedMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('documents')
        .update({ 
          delivery_state: 'delivered',
          viewed_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-payments'] });
      queryClient.invalidateQueries({ queryKey: ['new-documents-count'] });
    },
  });

  const downloadDocument = async (payment: Payment) => {
    try {
      // Mark as viewed first
      if (payment.isNew) {
        await markAsViewedMutation.mutateAsync(payment.id);
      }

      // Download the file
      const { data, error } = await supabase.storage
        .from('documents')
        .download(payment.filePath);

      if (error) throw error;

      // Create blob and download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = payment.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  };

  return {
    payments,
    isLoading,
    error,
    downloadDocument,
    markAsViewed: markAsViewedMutation.mutate,
  };
}
