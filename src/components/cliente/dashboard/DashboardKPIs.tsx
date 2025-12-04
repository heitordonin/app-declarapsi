import { TrendingUp, Users, TrendingDown, Calculator } from 'lucide-react';
import { KPICard } from '@/components/relatorios/KPICard';

interface DashboardKPIsProps {
  data: {
    totalRevenue: number;
    consultationsCount: number;
    totalExpenses: number;
    averageTicket: number;
  };
}

export function DashboardKPIs({ data }: DashboardKPIsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Receita Total"
        value={formatCurrency(data.totalRevenue)}
        icon={TrendingUp}
        description="Total de receitas no período"
      />
      <KPICard
        title="Consultas Recebidas"
        value={data.consultationsCount}
        icon={Users}
        description="Quantidade de consultas"
      />
      <KPICard
        title="Despesas Totais"
        value={formatCurrency(data.totalExpenses)}
        icon={TrendingDown}
        description="Total de despesas no período"
      />
      <KPICard
        title="Ticket Médio"
        value={formatCurrency(data.averageTicket)}
        icon={Calculator}
        description="Valor médio por consulta"
      />
    </div>
  );
}
