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

export function useChargesData() {
  return {
    charges: mockCharges,
    isLoading: false,
  };
}
