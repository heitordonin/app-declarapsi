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
      
      
    </Card>;
}