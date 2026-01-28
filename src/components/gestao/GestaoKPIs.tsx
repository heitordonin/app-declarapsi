import { Card, CardContent } from '@/components/ui/card';
import { Users, DollarSign, FileText, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ClientMonthlyStats } from '@/hooks/contador/useClientMonthlyStats';

interface GestaoKPIsProps {
  stats: ClientMonthlyStats[];
  exportedCount: number;
  isLoading?: boolean;
}

export function GestaoKPIs({ stats, exportedCount, isLoading }: GestaoKPIsProps) {
  const totalClients = stats.length;
  const totalRevenue = stats.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalEntries = stats.reduce((sum, s) => sum + s.chargesCount + s.expensesCount, 0);

  const kpis = [
    {
      label: 'Clientes Ativos',
      value: totalClients.toString(),
      icon: Users,
      color: 'text-primary',
    },
    {
      label: 'Faturamento Total',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue),
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      label: 'Total Lançamentos',
      value: totalEntries.toString(),
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      label: 'Clientes Exportados',
      value: `${exportedCount}/${totalClients}`,
      icon: CheckCircle2,
      color: exportedCount === totalClients ? 'text-green-600' : 'text-amber-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
              </div>
              <kpi.icon className={`h-8 w-8 ${kpi.color} opacity-80`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
