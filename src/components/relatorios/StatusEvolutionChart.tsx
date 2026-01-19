import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { STATUS_CONFIG, ObligationStatus } from '@/lib/obligation-status-utils';

interface StatusEvolutionChartProps {
  data: Array<{
    month: string;
    [key: string]: string | number;
  }>;
}

// Cores para os status (matching STATUS_CONFIG)
const statusColors: Record<string, string> = {
  pending: '#94a3b8',     // slate-400
  due_48h: '#facc15',     // yellow-400
  on_time_done: '#22c55e', // green-500
  overdue: '#ef4444',      // red-500
  late_done: '#fca5a5',    // red-300
};

export function StatusEvolutionChart({ data }: StatusEvolutionChartProps) {
  // Descobrir quais status existem nos dados
  const existingStatuses = useMemo(() => {
    const statuses = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'month' && item[key] !== undefined && item[key] !== null && typeof item[key] === 'number') {
          statuses.add(key);
        }
      });
    });
    return Array.from(statuses);
  }, [data]);

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
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              formatter={(value: any, name: string) => {
                const statusInfo = STATUS_CONFIG[name as ObligationStatus];
                return [value, statusInfo?.label || name];
              }}
            />
            <Legend 
              formatter={(value) => {
                const statusInfo = STATUS_CONFIG[value as ObligationStatus];
                return statusInfo?.label || value;
              }}
            />
            {existingStatuses.map((status) => (
              <Line
                key={status}
                type="monotone"
                dataKey={status}
                stroke={statusColors[status] || '#888'}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
