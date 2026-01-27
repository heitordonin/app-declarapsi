import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmailStats } from '@/hooks/contador/useEmailStats';
import { KPICard } from '@/components/relatorios/KPICard';
import { EmailDeliveryChart } from './EmailDeliveryChart';
import { EmailEvolutionChart } from './EmailEvolutionChart';
import { Mail, CheckCircle, Eye, AlertTriangle, Loader2 } from 'lucide-react';

export function EmailStatsTab() {
  const [period, setPeriod] = useState<string>('30');
  const { data: stats, isLoading } = useEmailStats(Number(period));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex justify-end">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Enviados"
          value={stats?.totalSent || 0}
          icon={Mail}
          description={`Nos últimos ${period} dias`}
        />
        <KPICard
          title="Taxa de Entrega"
          value={`${(stats?.deliveryRate || 0).toFixed(1)}%`}
          icon={CheckCircle}
          description="Entregues / Enviados"
        />
        <KPICard
          title="Taxa de Abertura"
          value={`${(stats?.openRate || 0).toFixed(1)}%`}
          icon={Eye}
          description="Abertos / Entregues"
        />
        <KPICard
          title="Taxa de Falha"
          value={`${(stats?.failureRate || 0).toFixed(1)}%`}
          icon={AlertTriangle}
          description="Bounced + Spam / Enviados"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <EmailDeliveryChart data={stats?.statusDistribution || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução Diária</CardTitle>
          </CardHeader>
          <CardContent>
            <EmailEvolutionChart data={stats?.dailyEvolution || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
