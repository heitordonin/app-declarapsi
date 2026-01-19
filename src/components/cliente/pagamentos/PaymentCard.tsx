import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, Loader2 } from 'lucide-react';
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
}

const statusConfig = {
  pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  overdue: { label: 'Vencido', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

export function PaymentCard({ payment, onDownload }: PaymentCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const config = statusConfig[payment.status];
  
  const timeAgo = formatDistanceToNow(new Date(payment.deliveredAt), {
    addSuffix: true,
    locale: ptBR,
  });

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
        : "border-l-muted-foreground/20"
    )}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {payment.isNew && (
              <Badge variant="default" className="bg-accent text-accent-foreground text-xs">
                Novo
              </Badge>
            )}
            <h3 className="font-medium text-foreground">{payment.title}</h3>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
        </div>
        
        <div className="flex items-end justify-between">
          <div className="grid grid-cols-3 gap-4 text-sm flex-1">
            <div>
              <p className="text-muted-foreground text-xs">Valor:</p>
              <p className="font-semibold text-foreground">
                {payment.value 
                  ? payment.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : '-'
                }
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
              <Badge variant="secondary" className={cn("text-xs", config.className)}>
                {config.label}
              </Badge>
            </div>
          </div>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleDownload}
            disabled={isDownloading}
            className="ml-4"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="ml-1 hidden sm:inline">Baixar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
