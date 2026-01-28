import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseCurrencyToNumber } from '@/lib/expense-utils';
import { useClientId } from './useClientId';

export interface Expense {
  id: string;
  category: string;
  categoryId: string;
  value: number;           // deductible_amount (valor considerado)
  originalValue: number;   // amount (valor original)
  paymentDate: string;
  penalty: number;
  description: string | null;
  isResidentialExpense: boolean;
  competencyMonth: number | null;
  competencyYear: number | null;
}

export interface ExpenseFormData {
  categoryId: string;
  value: string;
  paymentDate: string;
  penalty?: string;
  description?: string;
  isResidentialExpense: boolean;
  competencyMonth?: number;
  competencyYear?: number;
}

export function useExpensesData() {
  const queryClient = useQueryClient();
  const { clientId } = useClientId();

  const { data: expenses = [], isLoading, error } = useQuery({
    queryKey: ['expenses', clientId],
    queryFn: async (): Promise<Expense[]> => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id,
          amount,
          deductible_amount,
          payment_date,
          penalty,
          description,
          is_residential_expense,
          competency_month,
          competency_year,
          category_id,
          expense_categories!inner(id, name)
        `)
        .eq('client_id', clientId)
        .order('payment_date', { ascending: false });

      if (error) throw error;

      return (data || []).map((expense) => ({
        id: expense.id,
        category: (expense.expense_categories as { id: string; name: string }).name,
        categoryId: expense.category_id,
        value: expense.deductible_amount,
        originalValue: expense.amount,
        paymentDate: expense.payment_date,
        penalty: expense.penalty || 0,
        description: expense.description,
        isResidentialExpense: expense.is_residential_expense,
        competencyMonth: expense.competency_month,
        competencyYear: expense.competency_year,
      }));
    },
    enabled: !!clientId,
  });

  const createExpense = useMutation({
    mutationFn: async (formData: ExpenseFormData) => {
      if (!clientId) throw new Error('Cliente não encontrado');
      
      const amount = parseCurrencyToNumber(formData.value);
      const penalty = formData.penalty ? parseCurrencyToNumber(formData.penalty) : 0;
      
      // Calcular deductible_amount: 20% para residenciais, 100% para demais
      const deductibleAmount = formData.isResidentialExpense 
        ? amount * 0.20 
        : amount;

      const { error } = await supabase.from('expenses').insert({
        client_id: clientId,
        category_id: formData.categoryId,
        amount,
        deductible_amount: deductibleAmount,
        penalty,
        payment_date: formData.paymentDate,
        is_residential_expense: formData.isResidentialExpense,
        competency_month: formData.competencyMonth || null,
        competency_year: formData.competencyYear || null,
        description: formData.description || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-expenses'] });
      toast.success('Despesa registrada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating expense:', error);
      toast.error('Erro ao registrar despesa. Tente novamente.');
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, data: formData }: { id: string; data: ExpenseFormData }) => {
      if (!clientId) throw new Error('Cliente não encontrado');
      
      const amount = parseCurrencyToNumber(formData.value);
      const penalty = formData.penalty ? parseCurrencyToNumber(formData.penalty) : 0;
      
      // Calcular deductible_amount: 20% para residenciais, 100% para demais
      const deductibleAmount = formData.isResidentialExpense 
        ? amount * 0.20 
        : amount;

      const { error } = await supabase
        .from('expenses')
        .update({
          category_id: formData.categoryId,
          amount,
          deductible_amount: deductibleAmount,
          penalty,
          payment_date: formData.paymentDate,
          is_residential_expense: formData.isResidentialExpense,
          competency_month: formData.competencyMonth || null,
          competency_year: formData.competencyYear || null,
          description: formData.description || null,
        })
        .eq('id', id)
        .eq('client_id', clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-expenses'] });
      toast.success('Despesa atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating expense:', error);
      toast.error('Erro ao atualizar despesa. Tente novamente.');
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      if (!clientId) throw new Error('Cliente não encontrado');
      
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('client_id', clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-expenses'] });
      toast.success('Despesa excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting expense:', error);
      toast.error('Erro ao excluir despesa. Tente novamente.');
    },
  });

  return {
    expenses,
    isLoading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
