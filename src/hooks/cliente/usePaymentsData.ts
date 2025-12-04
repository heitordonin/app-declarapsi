export type PaymentStatus = 'pending' | 'paid' | 'overdue';

export interface Payment {
  id: string;
  title: string;
  value: number;
  dueDate: string;
  status: PaymentStatus;
  createdAt: string;
}

const mockPayments: Payment[] = [
  {
    id: '1',
    title: 'Honorário Mensal',
    value: 289.00,
    dueDate: '2025-11-28',
    status: 'paid',
    createdAt: '2025-11-05',
  },
  {
    id: '2',
    title: 'Darf 0190 Carnê-leão',
    value: 2506.60,
    dueDate: '2025-11-28',
    status: 'paid',
    createdAt: '2025-11-21',
  },
  {
    id: '3',
    title: 'Honorário Mensal',
    value: 289.00,
    dueDate: '2025-10-28',
    status: 'paid',
    createdAt: '2025-10-05',
  },
  {
    id: '4',
    title: 'Darf 0190 Carnê-leão',
    value: 1850.30,
    dueDate: '2025-10-28',
    status: 'paid',
    createdAt: '2025-10-20',
  },
  {
    id: '5',
    title: 'Honorário Mensal',
    value: 289.00,
    dueDate: '2025-12-28',
    status: 'pending',
    createdAt: '2025-12-01',
  },
  {
    id: '6',
    title: 'Darf 0190 Carnê-leão',
    value: 3200.00,
    dueDate: '2025-12-15',
    status: 'overdue',
    createdAt: '2025-12-01',
  },
];

export function usePaymentsData() {
  return {
    payments: mockPayments,
    isLoading: false,
  };
}
