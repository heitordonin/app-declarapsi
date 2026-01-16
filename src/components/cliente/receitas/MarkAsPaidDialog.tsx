import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { canMarkAsPaidOnDate, getRestrictionMessage, getAllowedPeriodDescription } from '@/lib/charge-period-utils';
import type { Charge } from '@/hooks/cliente/useChargesData';

interface MarkAsPaidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  charge: Charge | null;
  onConfirm: (chargeId: string, paymentDate: Date) => Promise<void>;
}

export function MarkAsPaidDialog({ 
  open, 
  onOpenChange, 
  charge, 
  onConfirm 
}: MarkAsPaidDialogProps) {
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!charge) return null;

  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(charge.amount);

  const formattedDueDate = format(parseISO(charge.due_date), 'dd/MM/yyyy', { locale: ptBR });

  const handleConfirm = async () => {
    // Validação do período de apuração
    if (!canMarkAsPaidOnDate(paymentDate)) {
      toast.error('Fora do período de apuração', {
        description: getRestrictionMessage(),
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(charge.id, paymentDate);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allowedPeriod = getAllowedPeriodDescription();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Marcar como Pago</AlertDialogTitle>
          <AlertDialogDescription>
            Informe a data em que o pagamento foi recebido.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Data do Pagamento *</Label>
            <DatePicker
              date={paymentDate}
              onDateChange={(date) => date && setPaymentDate(date)}
              placeholder="Selecione uma data"
            />
            <p className="text-xs text-muted-foreground">
              Período permitido: {allowedPeriod}
            </p>
          </div>

          <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
            <p><span className="text-muted-foreground">Paciente:</span> {charge.patient_name}</p>
            <p><span className="text-muted-foreground">Valor:</span> {formattedValue}</p>
            <p><span className="text-muted-foreground">Vencimento:</span> {formattedDueDate}</p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Confirmando...' : 'Confirmar Pagamento'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
