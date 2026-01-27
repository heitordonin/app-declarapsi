import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Payment } from '@/hooks/cliente/usePaymentsData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PaymentCardProps {
  payment: Payment;
  onDownload: (payment: Payment) => Promise<boolean>;
  onMarkAsPaid: (payment: Payment) => void;
}

const statusConfig = {
  pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  viewed: { label: 'Visualizado', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  overdue: { label: 'Vencido', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  paid: { label: 'Pago', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
};

export function PaymentCard({ payment, onDownload, onMarkAsPaid }: PaymentCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const config = statusConfig[payment.status];
  const isPaid = payment.status === 'paid';
  
  const deliveredDate = payment.deliveredAt ? new Date(payment.deliveredAt) : null;
  const isValidDate = deliveredDate && !isNaN(deliveredDate.getTime());
  
  const timeAgo = isValidDate
    ? formatDistanceToNow(deliveredDate, { addSuffix: true, locale: ptBR })
    : '';

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload(payment);
      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Erro ao baixar documento');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className={cn(
      "border-l-4 transition-all",
      payment.isNew 
        ? "border-l-accent bg-accent/5 shadow-md" 
        : isPaid
          ? "border-l-green-500"
          : "border-l-muted-foreground/20"
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {payment.isNew && (
              <Badge variant="default" className="bg-accent text-accent-foreground text-xs">
                Novo
              </Badge>
            )}
            <h3 className="font-medium text-foreground">{payment.title}</h3>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{timeAgo}</span>
        </div>
        
        {/* Info Grid - Mobile optimized */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Valor:</span>
            <span className="font-semibold text-foreground">
              {payment.value 
                ? payment.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : '-'
              }
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Vencimento:</span>
            <span className="text-foreground">
              {format(new Date(payment.dueDate), 'dd/MM/yyyy')}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Status:</span>
            {isPaid && payment.paidAt ? (
              <Badge variant="secondary" className={cn("text-xs", config.className)}>
                Pago em {format(new Date(payment.paidAt), 'dd/MM/yyyy')}
              </Badge>
            ) : (
              <Badge variant="secondary" className={cn("text-xs", config.className)}>
                {config.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={cn(
          "flex gap-2",
          isPaid ? "justify-center" : "justify-between"
        )}>
          <Button 
            size="default"
            variant="outline"
            onClick={handleDownload}
            disabled={isDownloading}
            className={cn("h-11 flex-1", isPaid && "max-w-[200px]")}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="ml-2">Baixar</span>
          </Button>
          
          {!isPaid && (
            <Button 
              size="default"
              onClick={() => onMarkAsPaid(payment)}
              className="h-11 flex-1"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="ml-2">Pagar</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
