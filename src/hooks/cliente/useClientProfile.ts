import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  display_name: z.string().max(50, 'Nome de exibição muito longo').optional().nullable(),
  cpf: z.string(),
  phone: z.string().max(20, 'Telefone inválido').optional().nullable(),
  birth_date: z.string().optional().nullable(),
  crp_number: z.string().max(20, 'CRP inválido').optional().nullable(),
  cep: z.string().max(9, 'CEP inválido').optional().nullable(),
  address: z.string().max(200, 'Endereço muito longo').optional().nullable(),
  number: z.string().max(20, 'Número inválido').optional().nullable(),
  complement: z.string().max(100, 'Complemento muito longo').optional().nullable(),
  neighborhood: z.string().max(100, 'Bairro muito longo').optional().nullable(),
  city: z.string().max(100, 'Cidade inválida').optional().nullable(),
  state: z.string().max(2, 'Estado inválido').optional().nullable(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export interface ClientProfile {
  id: string;
  name: string;
  display_name: string | null;
  email: string;
  cpf: string;
  phone: string | null;
  birth_date: string | null;
  crp_number: string | null;
  cep: string | null;
  address: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
}

export function useClientProfile() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['client-profile'],
    queryFn: async (): Promise<ClientProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('clients')
        .select('id, name, display_name, email, cpf, phone, birth_date, crp_number, cep, address, number, complement, neighborhood, city, state')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (formData: ProfileFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('clients')
        .update({
          name: formData.name,
          display_name: formData.display_name || null,
          phone: formData.phone || null,
          birth_date: formData.birth_date || null,
          crp_number: formData.crp_number || null,
          cep: formData.cep || null,
          address: formData.address || null,
          number: formData.number || null,
          complement: formData.complement || null,
          neighborhood: formData.neighborhood || null,
          city: formData.city || null,
          state: formData.state || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-profile'] });
      queryClient.invalidateQueries({ queryKey: ['client-info'] });
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro ao atualizar perfil',
        description: 'Não foi possível salvar suas informações. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile,
  };
}
