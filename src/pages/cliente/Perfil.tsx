import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileInfoForm } from '@/components/cliente/perfil/ProfileInfoForm';
import { AddressInfoForm } from '@/components/cliente/perfil/AddressInfoForm';
import { useClientProfile, profileSchema, ProfileFormData } from '@/hooks/cliente/useClientProfile';

export default function Perfil() {
  const { profile, isLoading, updateProfile } = useClientProfile();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      display_name: '',
      cpf: '',
      phone: '',
      birth_date: '',
      crp_number: '',
      cep: '',
      address: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || '',
        display_name: profile.display_name || '',
        cpf: profile.cpf || '',
        phone: profile.phone || '',
        birth_date: profile.birth_date || '',
        crp_number: profile.crp_number || '',
        cep: profile.cep || '',
        address: profile.address || '',
        number: profile.number || '',
        complement: profile.complement || '',
        neighborhood: profile.neighborhood || '',
        city: profile.city || '',
        state: profile.state || '',
      });
    }
  }, [profile, form]);

  const onSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Perfil</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ProfileInfoForm form={form} email={profile?.email || ''} />
        <AddressInfoForm form={form} />

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={updateProfile.isPending}
            className="w-full md:w-auto"
          >
            {updateProfile.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
