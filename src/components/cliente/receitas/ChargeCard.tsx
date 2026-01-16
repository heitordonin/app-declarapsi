import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { ChargeStatusBadge } from './ChargeStatusBadge';
import { ChargeActionsMenu } from './ChargeActionsMenu';
import type { Charge } from '@/hooks/cliente/useChargesData';

interface ChargeCardProps {
  charge: Charge;
}

export function ChargeCard({ charge }: ChargeCardProps) {
  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(charge.amount);

  const formattedDueDate = format(parseISO(charge.due_date), 'dd/MM/yyyy', { locale: ptBR });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{charge.patient_name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-primary font-semibold">{formattedValue}</span>
              <ChargeStatusBadge status={charge.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Venc: {formattedDueDate}
            </p>
          </div>
          <ChargeActionsMenu chargeId={charge.id} />
        </div>
      </CardContent>
    </Card>
  );
}
