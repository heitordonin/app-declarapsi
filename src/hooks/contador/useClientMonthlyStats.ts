import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateEffectiveRate } from '@/lib/irpf-utils';
import { startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

export interface ClientMonthlyStats {
  clientId: string;
  clientName: string;
  clientCode: string;
  totalRevenue: number;
  chargesCount: number;
  expensesCount: number;
  totalExpenses: number;
  netProfit: number;
  effectiveRate: number;
}

interface UseClientMonthlyStatsParams {
  year: number;
  month: number;
}

export function useClientMonthlyStats({ year, month }: UseClientMonthlyStatsParams) {
  return useQuery({
    queryKey: ['client-monthly-stats', year, month],
    queryFn: async (): Promise<ClientMonthlyStats[]> => {
      // Buscar clientes ativos com suas receitas e despesas
      const { data: clients, error } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          code,
          charges(amount, status, payment_date),
          expenses(amount, deductible_amount, payment_date)
        `)
        .eq('status', 'active');

      if (error) throw error;
      if (!clients) return [];

      // Definir intervalo do mês
      const monthStart = startOfMonth(new Date(year, month - 1));
      const monthEnd = endOfMonth(new Date(year, month - 1));

      // Processar estatísticas por cliente
      return clients.map((client) => {
        // Filtrar receitas pagas no mês
        const paidCharges = (client.charges || []).filter((charge) => {
          if (charge.status !== 'paid' || !charge.payment_date) return false;
          const paymentDate = parseISO(charge.payment_date);
          return isWithinInterval(paymentDate, { start: monthStart, end: monthEnd });
        });

        // Filtrar despesas no mês
        const monthExpenses = (client.expenses || []).filter((expense) => {
          if (!expense.payment_date) return false;
          const paymentDate = parseISO(expense.payment_date);
          return isWithinInterval(paymentDate, { start: monthStart, end: monthEnd });
        });

        const totalRevenue = paidCharges.reduce((sum, c) => sum + Number(c.amount), 0);
        const totalExpenses = monthExpenses.reduce((sum, e) => sum + Number(e.deductible_amount), 0);
        const netProfit = totalRevenue - totalExpenses;
        const effectiveRate = calculateEffectiveRate(totalRevenue);

        return {
          clientId: client.id,
          clientName: client.name,
          clientCode: client.code,
          totalRevenue,
          chargesCount: paidCharges.length,
          expensesCount: monthExpenses.length,
          totalExpenses,
          netProfit,
          effectiveRate,
        };
      }).sort((a, b) => b.totalRevenue - a.totalRevenue); // Ordenar por faturamento desc
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
