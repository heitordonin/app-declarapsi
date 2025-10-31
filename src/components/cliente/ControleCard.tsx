import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart } from "lucide-react";

interface ControleData {
  atendimentos: number;
  rendimento: number;
}

const data: ControleData = {
  atendimentos: 8,
  rendimento: 6500.00,
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function ControleCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Controle</CardTitle>
        <BarChart className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm">
          Atendimentos:{" "}
          <span className="text-2xl font-bold">{data.atendimentos}</span>
        </div>
        <div className="text-sm">
          Rendimento:{" "}
          <span className="text-2xl font-bold">{formatCurrency(data.rendimento)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
