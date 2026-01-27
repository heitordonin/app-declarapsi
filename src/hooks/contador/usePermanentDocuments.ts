import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface PermanentDocument {
  id: string;
  org_id: string;
  client_id: string;
  name: string;
  file_path: string;
  file_name: string;
  uploaded_by: string;
  uploaded_at: string;
  viewed_at: string | null;
  created_at: string;
}

export function usePermanentDocuments(clientId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: ['permanent-documents', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permanent_documents')
        .select('*')
        .eq('client_id', clientId!)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as PermanentDocument[];
    },
    enabled: !!clientId,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({
      clientId,
      name,
      file,
      orgId,
    }: {
      clientId: string;
      name: string;
      file: File;
      orgId: string;
    }) => {
      // Generate unique file name to avoid conflicts
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `permanent/${orgId}/${clientId}/${timestamp}_${sanitizedFileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(path, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { error: insertError } = await supabase
        .from('permanent_documents')
        .insert({
          org_id: orgId,
          client_id: clientId,
          name,
          file_path: path,
          file_name: file.name,
          uploaded_by: user!.id,
        });

      if (insertError) {
        // Clean up uploaded file if insert fails
        await supabase.storage.from('documents').remove([path]);
        throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permanent-documents', clientId] });
      toast.success('Documento enviado com sucesso!');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar documento');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('permanent_documents')
        .update({ name })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permanent-documents', clientId] });
      toast.success('Documento atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar documento');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) {
        console.warn('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('permanent_documents')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permanent-documents', clientId] });
      toast.success('Documento excluído!');
    },
    onError: () => {
      toast.error('Erro ao excluir documento');
    },
  });

  return {
    documents: documentsQuery.data ?? [],
    isLoading: documentsQuery.isLoading,
    upload: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    delete: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
