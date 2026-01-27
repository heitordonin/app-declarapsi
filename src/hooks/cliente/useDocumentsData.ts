import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Document {
  id: string;
  name: string;
  file_path: string;
  file_name: string;
  uploaded_at: string;
  viewed_at: string | null;
}

export function useDocumentsData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get client ID for the current user
  const { data: clientData } = useQuery({
    queryKey: ['client-id', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const clientId = clientData?.id;

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['permanent-documents', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permanent_documents')
        .select('id, name, file_path, file_name, uploaded_at, viewed_at')
        .eq('client_id', clientId!)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
    enabled: !!clientId,
  });

  // Mark document as viewed
  const markAsViewedMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('permanent_documents')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', documentId)
        .is('viewed_at', null); // Only update if not already viewed

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permanent-documents', clientId] });
    },
  });

  // Download document
  const downloadDocument = async (document: Document) => {
    try {
      // Mark as viewed
      if (!document.viewed_at) {
        markAsViewedMutation.mutate(document.id);
      }

      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Download error:', error);
      return false;
    }
  };

  return {
    documents,
    isLoading,
    downloadDocument,
  };
}
