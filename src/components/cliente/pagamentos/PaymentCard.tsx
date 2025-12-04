import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import type { Payment } from '@/hooks/cliente/usePaymentsData';
import { cn } from '@/lib/utils';

interface PaymentCardProps {
  payment: Payment;
}

const statusConfig = {
  paid: { label: 'Pago', className: 'text-green-600' },
  pending: { label: 'Pendente', className: 'text-yellow-600' },
  overdue: { label: 'Vencido', className: 'text-red-600' },
};

export function PaymentCard({ payment }: PaymentCardProps) {
  const config = statusConfig[payment.status];
  const timeAgo = formatDistanceToNow(new Date(payment.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Card className="border-l-4 border-l-muted-foreground/20">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-medium text-foreground">{payment.title}</h3>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Valor:</p>
            <p className="font-semibold text-foreground">
              {payment.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Vencimento:</p>
            <p className="text-foreground">
              {format(new Date(payment.dueDate), 'dd/MM/yyyy')}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Status:</p>
            <p className={cn('font-semibold', config.className)}>
              {config.label}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
