import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface EmailDeliveryChartProps {
  data: {
    status: string;
    count: number;
    color: string;
  }[];
}

const STATUS_LABELS: Record<string, string> = {
  sent: 'Enviado',
  delivered: 'Entregue',
  opened: 'Aberto',
  bounced: 'Bounced',
  failed: 'Falhou',
  clicked: 'Clicado',
  spam: 'Spam',
};

export function EmailDeliveryChart({ data }: EmailDeliveryChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Nenhum dado disponível
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    name: STATUS_LABELS[item.status] || item.status,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={formattedData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="count"
          nameKey="name"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {formattedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [value, name]}
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
