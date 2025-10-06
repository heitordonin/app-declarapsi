import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatusEvolutionChartProps {
  data: Array<{
    month: string;
    [key: string]: string | number;
  }>;
}

const statusColors = {
  pending: '#94a3b8',
  due_48h: '#fbbf24',
  on_time_done: '#22c55e',
  overdue: '#ef4444',
  late_done: '#f97316',
};

const statusLabels = {
  pending: 'Pendente',
  due_48h: 'Vence em 48h',
  on_time_done: 'Concluída no Prazo',
  overdue: 'Vencida',
  late_done: 'Concluída com Atraso',
};

export function StatusEvolutionChart({ data }: StatusEvolutionChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução dos Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhum dado disponível para exibir evolução
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução dos Status ao Longo do Tempo</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value: any, name: string) => [
                value,
                statusLabels[name as keyof typeof statusLabels] || name
              ]}
            />
            <Legend 
              formatter={(value) => statusLabels[value as keyof typeof statusLabels] || value}
            />
            {Object.keys(statusColors).map((status) => (
              <Line
                key={status}
                type="monotone"
                dataKey={status}
                stroke={statusColors[status as keyof typeof statusColors]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
