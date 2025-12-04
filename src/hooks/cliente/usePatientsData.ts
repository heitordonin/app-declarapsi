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

export interface Patient {
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

const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Paciente Adm',
    cpf: '14673948742',
    email: 'suporte@psiclo.com.br',
    phone: null,
    type: 'pf',
    tags: [],
    financial: {
      toReceive: 0,
      overdue: 0,
      received: 1200.00,
    },
    pendingCharges: [],
    receivedCharges: [
      { id: '1', description: 'Consulta', paymentDate: '2025-07-10', value: 150.00 },
      { id: '2', description: 'Consulta', paymentDate: '2025-08-08', value: 300.00 },
    ],
  },
  {
    id: '2',
    name: 'Paciente Exterior',
    cpf: '',
    email: 'suporte@psiclo.com.br',
    phone: null,
    type: 'pf',
    tags: ['Pagamento do exterior'],
    financial: {
      toReceive: 15.09,
      overdue: 15.09,
      received: 450.00,
    },
    pendingCharges: [
      { id: '1', description: 'Aaa', dueDate: '2025-08-30', value: 15.09 },
    ],
    receivedCharges: [
      { id: '1', description: 'aaaa', paymentDate: '2025-07-10', value: 150.00 },
      { id: '2', description: 'aaaa', paymentDate: '2025-08-08', value: 300.00 },
    ],
  },
];

export function usePatientsData() {
  return {
    patients: mockPatients,
    isLoading: false,
  };
}
