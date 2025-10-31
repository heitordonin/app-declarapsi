import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface PagamentosData {
  vencidos: number;
  aVencer: number;
  pagos: number;
  totalAPagar: number;
}

const data: PagamentosData = {
  vencidos: 0,
  aVencer: 1,
  pagos: 0,
  totalAPagar: 1,
};

const chartData = [
  { name: 'A Vencer', value: data.aVencer, color: 'hsl(48, 96%, 53%)' }, // warning yellow
  { name: 'Vencidos', value: data.vencidos, color: 'hsl(0, 84%, 60%)' }, // destructive red
  { name: 'Pagos', value: data.pagos, color: 'hsl(142, 71%, 45%)' }, // success green
];

// Filtrar dados com valor > 0 para o gráfico
const activeChartData = chartData.filter(item => item.value > 0);

export function PagamentosCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pagamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          {/* Lado Esquerdo: Lista de Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="w-6 justify-center">{data.vencidos}</Badge>
              <span className="text-sm font-medium">Vencidos</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning" className="w-6 justify-center">{data.aVencer}</Badge>
              <span className="text-sm font-medium">A Vencer</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="w-6 justify-center">{data.pagos}</Badge>
              <span className="text-sm font-medium">Pagos</span>
            </div>
          </div>

          {/* Lado Direito: Gráfico de Rosca */}
          <div className="w-24 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeChartData.length > 0 ? activeChartData : [{ name: 'Empty', value: 1, color: 'hsl(var(--muted))' }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={45}
                  paddingAngle={activeChartData.length > 1 ? 5 : 0}
                  dataKey="value"
                >
                  {activeChartData.length > 0 ? (
                    activeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
                    ))
                  ) : (
                    <Cell fill="hsl(var(--muted))" stroke="hsl(var(--muted))" />
                  )}
                  
                  {data.totalAPagar > 0 && (
                     <Label
                      value={data.totalAPagar}
                      position="center"
                      dy={-5}
                      className="text-2xl font-bold fill-foreground"
                    />
                  )}
                   {data.totalAPagar > 0 && (
                    <Label
                      value="a Pagar"
                      position="center"
                      dy={15}
                      className="text-xs fill-muted-foreground"
                    />
                  )}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
