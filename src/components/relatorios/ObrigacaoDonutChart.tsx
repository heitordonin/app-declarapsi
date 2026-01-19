import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { STATUS_CONFIG, ObligationStatus } from '@/lib/obligation-status-utils';

interface ChartData {
  status: string;
  count: number;
}

interface ObrigacaoDonutChartProps {
  title: string;
  data: ChartData[];
}

// Cores para os status
const statusColors: Record<string, string> = {
  pending: '#94a3b8',     // slate-400
  due_48h: '#facc15',     // yellow-400
  on_time_done: '#22c55e', // green-500
  overdue: '#ef4444',      // red-500
  late_done: '#fca5a5',    // red-300
};

export function ObrigacaoDonutChart({ title, data }: ObrigacaoDonutChartProps) {
  // Transformar dados para o formato do Recharts
  const chartData = data.map((item) => {
    const statusInfo = STATUS_CONFIG[item.status as ObligationStatus];
    return {
      name: statusInfo?.label || item.status,
      value: item.count,
      color: statusColors[item.status] || '#888888',
      status: item.status,
    };
  });

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhum dado disponível
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => {
                const percentage = ((value / total) * 100).toFixed(1);
                return [`${value} (${percentage}%)`, name];
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => {
                // Encontrar o item correspondente pelo nome
                const item = chartData.find(d => d.name === value);
                if (item && total > 0) {
                  const percentage = ((item.value / total) * 100).toFixed(0);
                  return `${value}: ${item.value} (${percentage}%)`;
                }
                return value;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
