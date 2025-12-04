export interface Expense {
  id: string;
  category: string;
  value: number;
  originalValue: number;
  paymentDate: string;
}

const mockExpenses: Expense[] = [
  {
    id: '1',
    category: 'Contador',
    value: 150.00,
    originalValue: 150.00,
    paymentDate: '2025-08-12',
  },
  {
    id: '2',
    category: 'Energia',
    value: 40.00,
    originalValue: 200.00,
    paymentDate: '2025-08-12',
  },
  {
    id: '3',
    category: 'Gás',
    value: 16.00,
    originalValue: 80.00,
    paymentDate: '2025-08-04',
  },
  {
    id: '4',
    category: 'Internet',
    value: 99.90,
    originalValue: 99.90,
    paymentDate: '2025-08-15',
  },
  {
    id: '5',
    category: 'Aluguel',
    value: 1200.00,
    originalValue: 1500.00,
    paymentDate: '2025-08-01',
  },
];

export function useExpensesData() {
  return {
    expenses: mockExpenses,
    isLoading: false,
  };
}
