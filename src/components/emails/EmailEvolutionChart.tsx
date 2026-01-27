import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmailEvolutionChartProps {
  data: {
    date: string;
    sent: number;
    delivered: number;
    bounced: number;
    failed: number;
  }[];
}

const CHART_COLORS = {
  sent: '#3b82f6',
  delivered: '#06b6d4',
  bounced: '#ef4444',
  failed: '#dc2626',
};

const STATUS_LABELS: Record<string, string> = {
  sent: 'Enviado',
  delivered: 'Entregue',
  bounced: 'Bounced',
  failed: 'Falhou',
};

export function EmailEvolutionChart({ data }: EmailEvolutionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Nenhum dado disponível
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    dateLabel: format(parseISO(item.date), 'dd/MM', { locale: ptBR }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="dateLabel" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: number, name: string) => [value, STATUS_LABELS[name] || name]}
        />
        <Legend formatter={(value) => STATUS_LABELS[value] || value} />
        <Bar dataKey="sent" fill={CHART_COLORS.sent} name="sent" stackId="a" />
        <Bar dataKey="delivered" fill={CHART_COLORS.delivered} name="delivered" stackId="a" />
        <Bar dataKey="bounced" fill={CHART_COLORS.bounced} name="bounced" stackId="a" />
        <Bar dataKey="failed" fill={CHART_COLORS.failed} name="failed" stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  );
}
