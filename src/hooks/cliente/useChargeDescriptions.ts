import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChargeDescription {
  id: string;
  client_id: string;
  description: string;
  created_at: string;
  updated_at: string;
}

async function fetchClientId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user.id)
    .single();

  return client?.id || null;
}

async function fetchDescriptions(): Promise<ChargeDescription[]> {
  const clientId = await fetchClientId();
  if (!clientId) return [];

  const { data, error } = await supabase
    .from('charge_descriptions')
    .select('*')
    .eq('client_id', clientId)
    .order('description', { ascending: true });

  if (error) {
    console.error('Error fetching charge descriptions:', error);
    throw error;
  }

  return data || [];
}

export function useChargeDescriptions() {
  const queryClient = useQueryClient();

  const { data: descriptions = [], isLoading, error } = useQuery({
    queryKey: ['charge-descriptions'],
    queryFn: fetchDescriptions,
  });

  const createMutation = useMutation({
    mutationFn: async (description: string) => {
      const clientId = await fetchClientId();
      if (!clientId) throw new Error('Cliente não encontrado');

      const { error } = await supabase
        .from('charge_descriptions')
        .insert({ client_id: clientId, description });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-descriptions'] });
      toast.success('Descrição criada com sucesso');
    },
    onError: (error) => {
      console.error('Error creating description:', error);
      toast.error('Erro ao criar descrição');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, description }: { id: string; description: string }) => {
      const { error } = await supabase
        .from('charge_descriptions')
        .update({ description })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-descriptions'] });
      toast.success('Descrição atualizada');
    },
    onError: (error) => {
      console.error('Error updating description:', error);
      toast.error('Erro ao atualizar descrição');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('charge_descriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-descriptions'] });
      toast.success('Descrição removida');
    },
    onError: (error) => {
      console.error('Error deleting description:', error);
      toast.error('Erro ao remover descrição');
    },
  });

  return {
    descriptions,
    isLoading,
    error,
    createDescription: createMutation.mutateAsync,
    updateDescription: updateMutation.mutateAsync,
    deleteDescription: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
