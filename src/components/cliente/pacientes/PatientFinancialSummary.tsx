import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientDisplayModel } from '@/hooks/cliente/usePatientsData';

interface PatientFinancialSummaryProps {
  patient: PatientDisplayModel;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function PatientFinancialSummary({ patient }: PatientFinancialSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Resumo Financeiro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">A receber</span>
          <span className="font-medium text-accent">
            {formatCurrency(patient.financial.toReceive)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Vencidas</span>
          <span className="font-medium text-destructive">
            {formatCurrency(patient.financial.overdue)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Recebido</span>
          <span className="font-medium text-foreground">
            {formatCurrency(patient.financial.received)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
