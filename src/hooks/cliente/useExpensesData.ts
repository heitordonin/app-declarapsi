export interface Expense {
  id: string;
  category: string;
  categoryId?: string;
  value: number;
  originalValue: number;
  paymentDate: string;
  penalty?: number;
  description?: string;
  isResidentialExpense?: boolean;
  professionalUsePercentage?: number;
  competencyMonth?: number;
  competencyYear?: number;
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
    isResidentialExpense: true,
    professionalUsePercentage: 20,
  },
  {
    id: '3',
    category: 'Gás',
    value: 16.00,
    originalValue: 80.00,
    paymentDate: '2025-08-04',
    isResidentialExpense: true,
    professionalUsePercentage: 20,
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
    isResidentialExpense: true,
    professionalUsePercentage: 80,
  },
  {
    id: '6',
    category: 'INSS - Previdência Social',
    value: 300.00,
    originalValue: 300.00,
    paymentDate: '2025-08-15',
    competencyMonth: 7,
    competencyYear: 2025,
  },
];

export function useExpensesData() {
  return {
    expenses: mockExpenses,
    isLoading: false,
  };
}
