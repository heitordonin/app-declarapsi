import { useState } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { QuickActions } from '@/components/cliente/dashboard/QuickActions';
import { PeriodFilter } from '@/components/cliente/dashboard/PeriodFilter';
import { DashboardKPIs } from '@/components/cliente/dashboard/DashboardKPIs';
import { RevenueExpenseChart } from '@/components/cliente/dashboard/RevenueExpenseChart';
import { ProfitMarginGauge } from '@/components/cliente/dashboard/ProfitMarginGauge';
import { DashboardSkeleton } from '@/components/cliente/dashboard/DashboardSkeleton';
import { useDashboardData } from '@/hooks/cliente/useDashboardData';

export default function Dashboard() {
  const [period, setPeriod] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });

  const dashboardData = useDashboardData(period.start, period.end);

  const handlePeriodChange = (start: Date, end: Date) => {
    setPeriod({ start, end });
  };

  return (
    <div className="space-y-6">
      <QuickActions />
      
      <PeriodFilter onPeriodChange={handlePeriodChange} />
      
      {dashboardData.isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <DashboardKPIs data={dashboardData.kpis} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueExpenseChart 
              totalRevenue={dashboardData.kpis.totalRevenue} 
              totalExpenses={dashboardData.kpis.totalExpenses} 
            />
            <ProfitMarginGauge value={dashboardData.profitMargin} />
          </div>
        </>
      )}
    </div>
  );
}
