import { useState } from 'react';
import { format } from 'date-fns';

export type ChargeStatus = 'pending' | 'overdue' | 'paid';

export interface Charge {
  id: string;
  patientId: string;
  patientName: string;
  description: string;
  status: ChargeStatus;
  value: number;
  dueDate: string;
  paymentDate: string | null;
  isPatientPayer?: boolean;
  payerCpf?: string | null;
}

export interface ChargeFormData {
  patientId: string;
  isPatientPayer: boolean;
  payerCpf?: string;
  dueDate: Date;
  description: string;
  value: string;
}

const mockCharges: Charge[] = [
  {
    id: '1',
    patientId: '2',
    patientName: 'Paciente Exterior',
    description: 'Consulta individual',
    status: 'overdue',
    value: 15.09,
    dueDate: '2025-08-30',
    paymentDate: null,
  },
  {
    id: '2',
    patientId: '2',
    patientName: 'Paciente Exterior',
    description: 'Sessão de terapia',
    status: 'paid',
    value: 150.00,
    dueDate: '2025-08-07',
    paymentDate: '2025-07-10',
  },
  {
    id: '3',
    patientId: '2',
    patientName: 'Paciente Exterior',
    description: 'Avaliação psicológica',
    status: 'paid',
    value: 300.00,
    dueDate: '2025-08-20',
    paymentDate: '2025-08-08',
  },
  {
    id: '4',
    patientId: '1',
    patientName: 'Paciente Adm',
    description: 'Consulta mensal',
    status: 'overdue',
    value: 500.00,
    dueDate: '2025-08-15',
    paymentDate: null,
  },
  {
    id: '5',
    patientId: '1',
    patientName: 'Paciente Adm',
    description: 'Sessão avulsa',
    status: 'pending',
    value: 200.00,
    dueDate: '2025-12-20',
    paymentDate: null,
  },
];

// Helper to parse currency string to number
function parseCurrencyToNumber(value: string): number {
  // Remove R$, spaces, dots (thousands separator) and convert comma to dot
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export function useChargesData(getPatientName?: (patientId: string) => string) {
  const [charges, setCharges] = useState<Charge[]>(mockCharges);

  const createCharge = async (data: ChargeFormData): Promise<void> => {
    const patientName = getPatientName?.(data.patientId) || 'Paciente';
    
    const newCharge: Charge = {
      id: crypto.randomUUID(),
      patientId: data.patientId,
      patientName,
      description: data.description,
      status: 'pending',
      value: parseCurrencyToNumber(data.value),
      dueDate: format(data.dueDate, 'yyyy-MM-dd'),
      paymentDate: null,
      isPatientPayer: data.isPatientPayer,
      payerCpf: data.payerCpf?.replace(/\D/g, '') || null,
    };

    setCharges(prev => [newCharge, ...prev]);
  };

  return {
    charges,
    createCharge,
    isLoading: false,
  };
}
