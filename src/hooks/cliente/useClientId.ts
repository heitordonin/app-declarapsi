import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useClientId() {
  const { user } = useAuth();

  const { data: clientId, isLoading, error } = useQuery({
    queryKey: ['client-id', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      return data.id;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30, // 30 minutos - client_id não muda durante sessão
    gcTime: 1000 * 60 * 60,    // 1 hora no cache
  });

  return {
    clientId,
    isLoading,
    error,
  };
}
