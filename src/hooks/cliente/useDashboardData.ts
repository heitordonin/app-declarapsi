import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClientId } from './useClientId';

interface DashboardData {
  kpis: {
    totalRevenue: number;
    consultationsCount: number;
    totalExpenses: number;
    averageTicket: number;
  };
  profitMargin: number;
  isLoading: boolean;
}

export function useDashboardData(startDate: Date, endDate: Date): DashboardData {
  const { clientId } = useClientId();
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Query para receitas (cobranças pagas no período)
  const { data: chargesData, isLoading: chargesLoading } = useQuery({
    queryKey: ['dashboard-charges', clientId, startDateStr, endDateStr],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('charges')
        .select('amount, sessions_count')
        .eq('client_id', clientId)
        .eq('status', 'paid')
        .gte('payment_date', startDateStr)
        .lte('payment_date', endDateStr);

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

  // Query para despesas no período
  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['dashboard-expenses', clientId, startDateStr, endDateStr],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('expenses')
        .select('deductible_amount')
        .eq('client_id', clientId)
        .gte('payment_date', startDateStr)
        .lte('payment_date', endDateStr);

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

  // Calcular KPIs
  const totalRevenue = chargesData?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
  const consultationsCount = chargesData?.reduce((sum, c) => sum + (c.sessions_count || 1), 0) || 0;
  const totalExpenses = expensesData?.reduce((sum, e) => sum + Number(e.deductible_amount), 0) || 0;
  const averageTicket = consultationsCount > 0 ? totalRevenue / consultationsCount : 0;
  const profitMargin = totalRevenue > 0 
    ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 
    : 0;

  return {
    kpis: {
      totalRevenue,
      consultationsCount,
      totalExpenses,
      averageTicket,
    },
    profitMargin,
    isLoading: chargesLoading || expensesLoading,
  };
}
