import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
  isResidential: boolean;
  requiresCompetency: boolean;
}

export function useExpenseCategories() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('id, code, name, is_residential, requires_competency')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      return data.map(cat => ({
        id: cat.id,
        code: cat.code,
        name: cat.name,
        isResidential: cat.is_residential,
        requiresCompetency: cat.requires_competency,
      }));
    },
  });

  return { categories, isLoading };
}
