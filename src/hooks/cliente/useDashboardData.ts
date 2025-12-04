import { useMemo } from 'react';

interface DashboardData {
  kpis: {
    totalRevenue: number;
    consultationsCount: number;
    totalExpenses: number;
    averageTicket: number;
  };
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
      profitMargin: totalRevenue > 0 
        ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 
        : 0,
    };
  }, [startDate, endDate]);
}
