import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClientMonthlyStatus {
  id: string;
  client_id: string;
  year: number;
  month: number;
  charges_exported_at: string | null;
  charges_exported_by: string | null;
  expenses_exported_at: string | null;
  expenses_exported_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface UseClientMonthlyStatusParams {
  year: number;
  month: number;
}

export function useClientMonthlyStatus({ year, month }: UseClientMonthlyStatusParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['client-monthly-status', year, month],
    queryFn: async (): Promise<Record<string, ClientMonthlyStatus>> => {
      const { data, error } = await supabase
        .from('client_monthly_status')
        .select('*')
        .eq('year', year)
        .eq('month', month);

      if (error) throw error;

      // Converter array para objeto indexado por client_id
      return (data || []).reduce((acc, status) => {
        acc[status.client_id] = status;
        return acc;
      }, {} as Record<string, ClientMonthlyStatus>);
    },
    staleTime: 1000 * 60 * 5,
  });

  const markExportedMutation = useMutation({
    mutationFn: async ({
      clientId,
      type,
    }: {
      clientId: string;
      type: 'charges' | 'expenses';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const updateField = type === 'charges' 
        ? { charges_exported_at: new Date().toISOString(), charges_exported_by: user.id }
        : { expenses_exported_at: new Date().toISOString(), expenses_exported_by: user.id };

      // Tentar atualizar primeiro
      const { data: existing } = await supabase
        .from('client_monthly_status')
        .select('id')
        .eq('client_id', clientId)
        .eq('year', year)
        .eq('month', month)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('client_monthly_status')
          .update(updateField)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('client_monthly_status')
          .insert({
            client_id: clientId,
            year,
            month,
            ...updateField,
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, { type }) => {
      queryClient.invalidateQueries({ queryKey: ['client-monthly-status', year, month] });
      toast({
        title: 'Exportação marcada',
        description: `${type === 'charges' ? 'Receitas' : 'Despesas'} marcadas como exportadas.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar como exportado.',
        variant: 'destructive',
      });
      console.error(error);
    },
  });

  const unmarkExportedMutation = useMutation({
    mutationFn: async ({
      clientId,
      type,
    }: {
      clientId: string;
      type: 'charges' | 'expenses';
    }) => {
      const updateField = type === 'charges' 
        ? { charges_exported_at: null, charges_exported_by: null }
        : { expenses_exported_at: null, expenses_exported_by: null };

      const { error } = await supabase
        .from('client_monthly_status')
        .update(updateField)
        .eq('client_id', clientId)
        .eq('year', year)
        .eq('month', month);

      if (error) throw error;
    },
    onSuccess: (_, { type }) => {
      queryClient.invalidateQueries({ queryKey: ['client-monthly-status', year, month] });
      toast({
        title: 'Marcação removida',
        description: `${type === 'charges' ? 'Receitas' : 'Despesas'} desmarcadas.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Não foi possível desmarcar.',
        variant: 'destructive',
      });
      console.error(error);
    },
  });

  return {
    ...query,
    markExported: markExportedMutation.mutate,
    unmarkExported: unmarkExportedMutation.mutate,
    isMarking: markExportedMutation.isPending,
    isUnmarking: unmarkExportedMutation.isPending,
  };
}
