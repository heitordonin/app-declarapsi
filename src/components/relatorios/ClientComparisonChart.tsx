import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
interface ClientComparisonChartProps {
  data: Array<{
    clientName: string;
    completed: number;
    pending: number;
    overdue: number;
  }>;
}
export function ClientComparisonChart({
  data
}: ClientComparisonChartProps) {
  if (!data || data.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>Comparação por Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhum dado disponível
          </p>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle>Comparação por Cliente</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="clientName" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" fill="#22c55e" name="Concluídas" />
            <Bar dataKey="pending" fill="#94a3b8" name="Pendentes" />
            <Bar dataKey="overdue" fill="#ef4444" name="Vencidas" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>;
}