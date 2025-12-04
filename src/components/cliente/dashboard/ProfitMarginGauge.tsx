import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

interface ProfitMarginGaugeProps {
  value: number;
}

export function ProfitMarginGauge({ value }: ProfitMarginGaugeProps) {
  // Se prejuízo, mostrar 0%
  const displayValue = Math.max(0, Math.min(100, value));
  
  // Determinar cor baseada na faixa
  const getColor = (val: number): string => {
    if (val < 20) return '#ef4444'; // Vermelho
    if (val < 40) return '#fbbf24'; // Amarelo
    if (val < 60) return '#86efac'; // Verde pastel
    return '#22c55e'; // Verde vivo
  };

  const color = getColor(displayValue);

  const data = [
    {
      name: 'Margem',
      value: displayValue,
      fill: color,
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Margem de Lucro</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex flex-col items-center justify-center">
          <div className="relative w-full h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                barSize={20}
                data={data}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  background={{ fill: 'hsl(var(--muted))' }}
                  dataKey="value"
                  cornerRadius={10}
                  angleAxisId={0}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            
            {/* Valor central */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center mt-4">
                <span 
                  className="text-4xl font-bold"
                  style={{ color }}
                >
                  {displayValue.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Legenda de cores */}
          <div className="flex flex-wrap justify-center gap-3 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
              <span className="text-muted-foreground">0-20%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fbbf24' }} />
              <span className="text-muted-foreground">20-40%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#86efac' }} />
              <span className="text-muted-foreground">40-60%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
              <span className="text-muted-foreground">60-100%</span>
            </div>
          </div>
          
          {/* Indicador de prejuízo */}
          {value < 0 && (
            <p className="text-destructive text-sm mt-2 font-medium">
              Prejuízo de {Math.abs(value).toFixed(1)}%
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
