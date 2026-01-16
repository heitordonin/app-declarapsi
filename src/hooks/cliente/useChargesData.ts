import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export type ChargeStatus = 'pending' | 'overdue' | 'paid';

export interface Charge {
  id: string;
  client_id: string;
  patient_id: string;
  patient_cpf: string;
  payer_cpf: string;
  patient_name: string;
  description: string;
  status: ChargeStatus;
  amount: number;
  sessions_count: number;
  due_date: string;
  payment_date: string | null;
  health_receipt_issued: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChargeFormData {
  patientId: string;
  patientCpf: string;
  isPatientPayer: boolean;
  payerCpf?: string;
  dueDate: Date;
  description: string;
  value: string;
  sessionsCount: number;
}

// Helper to parse currency string to number
function parseCurrencyToNumber(value: string): number {
  // Remove R$, spaces, dots (thousands separator) and convert comma to dot
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

async function fetchClientId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: client, error } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (!client) throw new Error('Cliente não encontrado');

  return client.id;
}

async function fetchCharges(): Promise<Charge[]> {
  const clientId = await fetchClientId();

  const { data, error } = await supabase
    .from('charges')
    .select(`
      id,
      client_id,
      patient_id,
      patient_cpf,
      payer_cpf,
      description,
      status,
      amount,
      sessions_count,
      due_date,
      payment_date,
      health_receipt_issued,
      created_at,
      updated_at,
      patients!inner(name)
    `)
    .eq('client_id', clientId)
    .order('due_date', { ascending: false });

  if (error) throw error;

  return (data || []).map((charge: any) => ({
    id: charge.id,
    client_id: charge.client_id,
    patient_id: charge.patient_id,
    patient_cpf: charge.patient_cpf,
    payer_cpf: charge.payer_cpf,
    patient_name: charge.patients?.name || 'Paciente',
    description: charge.description,
    status: charge.status as ChargeStatus,
    amount: Number(charge.amount),
    sessions_count: charge.sessions_count,
    due_date: charge.due_date,
    payment_date: charge.payment_date,
    health_receipt_issued: charge.health_receipt_issued,
    created_at: charge.created_at,
    updated_at: charge.updated_at,
  }));
}

interface CreateChargeParams {
  clientId: string;
  data: ChargeFormData;
}

async function createChargeInDb({ clientId, data }: CreateChargeParams): Promise<void> {
  const payerCpf = data.isPatientPayer 
    ? data.patientCpf.replace(/\D/g, '') 
    : (data.payerCpf?.replace(/\D/g, '') || '');

  const { error } = await supabase
    .from('charges')
    .insert({
      client_id: clientId,
      patient_id: data.patientId,
      patient_cpf: data.patientCpf.replace(/\D/g, ''),
      payer_cpf: payerCpf,
      due_date: format(data.dueDate, 'yyyy-MM-dd'),
      description: data.description,
      amount: parseCurrencyToNumber(data.value),
      sessions_count: data.sessionsCount,
      status: 'pending',
      health_receipt_issued: false,
    });

  if (error) throw error;
}

export interface ChargeEditData {
  patientId: string;
  patientCpf: string;
  isPatientPayer: boolean;
  payerCpf?: string;
  dueDate: Date;
  description: string;
  value: string;
  sessionsCount: number;
}

interface UpdateChargeParams {
  chargeId: string;
  clientId: string;
  data: ChargeEditData;
}

async function updateChargeInDb({ chargeId, clientId, data }: UpdateChargeParams): Promise<void> {
  const payerCpf = data.isPatientPayer 
    ? data.patientCpf.replace(/\D/g, '') 
    : (data.payerCpf?.replace(/\D/g, '') || '');

  const { error } = await supabase
    .from('charges')
    .update({
      patient_id: data.patientId,
      patient_cpf: data.patientCpf.replace(/\D/g, ''),
      payer_cpf: payerCpf,
      due_date: format(data.dueDate, 'yyyy-MM-dd'),
      description: data.description,
      amount: parseCurrencyToNumber(data.value),
      sessions_count: data.sessionsCount,
    })
    .eq('id', chargeId)
    .eq('client_id', clientId);

  if (error) throw error;
}

async function markChargeAsPaidInDb(chargeId: string, paymentDate: Date): Promise<void> {
  const clientId = await fetchClientId();
  
  const { error } = await supabase
    .from('charges')
    .update({
      status: 'paid',
      payment_date: format(paymentDate, 'yyyy-MM-dd'),
    })
    .eq('id', chargeId)
    .eq('client_id', clientId);

  if (error) throw error;
}

async function deleteChargeInDb(chargeId: string): Promise<void> {
  const clientId = await fetchClientId();
  
  const { error } = await supabase
    .from('charges')
    .delete()
    .eq('id', chargeId)
    .eq('client_id', clientId);

  if (error) throw error;
}

async function markChargeAsUnpaidInDb(chargeId: string): Promise<void> {
  const clientId = await fetchClientId();
  
  const { error } = await supabase
    .from('charges')
    .update({
      status: 'pending',
      payment_date: null,
    })
    .eq('id', chargeId)
    .eq('client_id', clientId);

  if (error) throw error;
}

export function useChargesData() {
  const queryClient = useQueryClient();

  const { data: charges = [], isLoading, error } = useQuery({
    queryKey: ['charges'],
    queryFn: fetchCharges,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ChargeFormData) => {
      const clientId = await fetchClientId();
      return createChargeInDb({ clientId, data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ chargeId, data }: { chargeId: string; data: ChargeEditData }) => {
      const clientId = await fetchClientId();
      return updateChargeInDb({ chargeId, clientId, data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async ({ chargeId, paymentDate }: { chargeId: string; paymentDate: Date }) => {
      return markChargeAsPaidInDb(chargeId, paymentDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (chargeId: string) => {
      return deleteChargeInDb(chargeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
    },
  });

  const markAsUnpaidMutation = useMutation({
    mutationFn: async (chargeId: string) => {
      return markChargeAsUnpaidInDb(chargeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
    },
  });

  const createCharge = async (data: ChargeFormData): Promise<void> => {
    await createMutation.mutateAsync(data);
  };

  const updateCharge = async (chargeId: string, data: ChargeEditData): Promise<void> => {
    await updateMutation.mutateAsync({ chargeId, data });
  };

  const markAsPaid = async (chargeId: string, paymentDate: Date): Promise<void> => {
    await markAsPaidMutation.mutateAsync({ chargeId, paymentDate });
  };

  const deleteCharge = async (chargeId: string): Promise<void> => {
    await deleteMutation.mutateAsync(chargeId);
  };

  const markAsUnpaid = async (chargeId: string): Promise<void> => {
    await markAsUnpaidMutation.mutateAsync(chargeId);
  };

  return {
    charges,
    createCharge,
    updateCharge,
    markAsPaid,
    markAsUnpaid,
    deleteCharge,
    isLoading,
    error,
  };
}
