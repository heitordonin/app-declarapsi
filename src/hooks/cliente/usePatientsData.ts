import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Database Patient type
export interface Patient {
  id: string;
  name: string;
  type: 'pf' | 'pj';
  is_foreign_payment: boolean;
  document: string | null;
  email: string;
  phone: string;
  cep: string | null;
  address: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  has_financial_responsible: boolean;
  financial_responsible_cpf: string | null;
  created_via: 'manual' | 'invite_link';
  created_at: string;
  updated_at: string;
}

// Display model for components (includes computed fields)
export interface PendingCharge {
  id: string;
  description: string;
  dueDate: string;
  value: number;
}

export interface ReceivedCharge {
  id: string;
  description: string;
  paymentDate: string;
  value: number;
}

export interface PatientDisplayModel {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string | null;
  type: 'pf' | 'pj';
  tags: string[];
  financial: {
    toReceive: number;
    overdue: number;
    received: number;
  };
  pendingCharges: PendingCharge[];
  receivedCharges: ReceivedCharge[];
}

interface PatientFormData {
  name: string;
  type: 'pf' | 'pj';
  isForeignPayment: boolean;
  document?: string;
  email: string;
  phone: string;
  cep?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  hasFinancialResponsible: boolean;
  financialResponsibleCpf?: string;
}

// Transform database patient to display model
function toDisplayModel(patient: Patient): PatientDisplayModel {
  return {
    id: patient.id,
    name: patient.name,
    cpf: patient.document || '',
    email: patient.email,
    phone: patient.phone,
    type: patient.type,
    tags: patient.is_foreign_payment ? ['Pagamento do exterior'] : [],
    financial: {
      toReceive: 0,
      overdue: 0,
      received: 0,
    },
    pendingCharges: [],
    receivedCharges: [],
  };
}

export function usePatientsData() {
  const queryClient = useQueryClient();

  const { data: rawPatients = [], isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching patients:', error);
        throw error;
      }

      return data as Patient[];
    },
  });

  // Transform to display models
  const patients = rawPatients.map(toDisplayModel);

  const createPatientMutation = useMutation({
    mutationFn: async (formData: PatientFormData) => {
      // Get client_id for current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!client) throw new Error('Cliente não encontrado');

      const { data, error } = await supabase
        .from('patients')
        .insert({
          client_id: client.id,
          name: formData.name,
          type: formData.type,
          is_foreign_payment: formData.isForeignPayment,
          document: formData.isForeignPayment ? null : formData.document?.replace(/\D/g, '') || null,
          email: formData.email,
          phone: formData.phone.replace(/\D/g, ''),
          cep: formData.cep?.replace(/\D/g, '') || null,
          address: formData.address || null,
          number: formData.number || null,
          complement: formData.complement || null,
          neighborhood: formData.neighborhood || null,
          city: formData.city || null,
          state: formData.state || null,
          has_financial_responsible: formData.hasFinancialResponsible,
          financial_responsible_cpf: formData.hasFinancialResponsible
            ? formData.financialResponsibleCpf?.replace(/\D/g, '')
            : null,
          created_via: 'manual' as const,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: async ({ id, data: formData }: { id: string; data: PatientFormData }) => {
      const { data, error } = await supabase
        .from('patients')
        .update({
          name: formData.name,
          type: formData.type,
          is_foreign_payment: formData.isForeignPayment,
          document: formData.isForeignPayment ? null : formData.document?.replace(/\D/g, '') || null,
          email: formData.email,
          phone: formData.phone.replace(/\D/g, ''),
          cep: formData.cep?.replace(/\D/g, '') || null,
          address: formData.address || null,
          number: formData.number || null,
          complement: formData.complement || null,
          neighborhood: formData.neighborhood || null,
          city: formData.city || null,
          state: formData.state || null,
          has_financial_responsible: formData.hasFinancialResponsible,
          financial_responsible_cpf: formData.hasFinancialResponsible
            ? formData.financialResponsibleCpf?.replace(/\D/g, '')
            : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });

  const generateInviteLinkMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-patient-invite');

      if (error) throw new Error(error.message || 'Erro ao gerar link');
      if (data.error) throw new Error(data.error);

      return data.url as string;
    },
  });

  return {
    patients,
    rawPatients,
    isLoading,
    createPatient: createPatientMutation.mutateAsync,
    isCreating: createPatientMutation.isPending,
    updatePatient: updatePatientMutation.mutateAsync,
    isUpdating: updatePatientMutation.isPending,
    generateInviteLink: generateInviteLinkMutation.mutateAsync,
    isGeneratingLink: generateInviteLinkMutation.isPending,
    getPatientById: (id: string) => rawPatients.find(p => p.id === id),
  };
}
