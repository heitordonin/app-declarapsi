import { useMemo } from 'react';

interface DashboardData {
  kpis: {
    totalRevenue: number;
    consultationsCount: number;
    totalExpenses: number;
    averageTicket: number;
  };
  revenueExpense: Array<{
    period: string;
    receitas: number;
    despesas: number;
  }>;
  profitMargin: number;
}

export function useDashboardData(startDate: Date, endDate: Date): DashboardData {
  return useMemo(() => {
    // Dados mockados para desenvolvimento do frontend
    const totalRevenue = 15000;
    const totalExpenses = 5200;
    const consultationsCount = 45;
    
    return {
      kpis: {
        totalRevenue,
        consultationsCount,
        totalExpenses,
        averageTicket: consultationsCount > 0 ? totalRevenue / consultationsCount : 0,
      },
      revenueExpense: [
        { period: 'Semana 1', receitas: 4000, despesas: 1500 },
        { period: 'Semana 2', receitas: 3500, despesas: 1200 },
        { period: 'Semana 3', receitas: 4200, despesas: 1300 },
        { period: 'Semana 4', receitas: 3300, despesas: 1200 },
      ],
      profitMargin: totalRevenue > 0 
        ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 
        : 0,
    };
  }, [startDate, endDate]);
}
