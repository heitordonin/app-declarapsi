import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { getStatusColor, getStatusLabel } from '@/lib/obligation-status-utils';

interface ChartData {
  status: string;
  count: number;
}

interface ObrigacaoDonutChartProps {
  title: string;
  data: ChartData[];
}

export function ObrigacaoDonutChart({ title, data }: ObrigacaoDonutChartProps) {
  const chartData = data.map((item) => ({
    name: getStatusLabel(item.status as any),
    value: item.count,
    color: getStatusColor(item.status as any),
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Nenhum dado disponível para este período
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => {
              const percentage = ((value / total) * 100).toFixed(1);
              return `${value} (${percentage}%)`;
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => {
              const percentage = ((entry.value / total) * 100).toFixed(1);
              return `${value}: ${entry.value} (${percentage}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
