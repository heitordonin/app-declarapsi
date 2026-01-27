import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { canMarkAsPaidOnDate, getRestrictionMessage, getAllowedPeriodDescription } from '@/lib/charge-period-utils';
import { cn } from '@/lib/utils';
import type { Payment } from '@/hooks/cliente/usePaymentsData';

interface MarkPaymentAsPaidDialogProps {
  payment: Payment | null;
  expenseCategoryName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (paymentDate: Date, registerAsExpense: boolean) => Promise<void>;
  isLoading?: boolean;
}

export function MarkPaymentAsPaidDialog({
  payment,
  expenseCategoryName,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: MarkPaymentAsPaidDialogProps) {
  const isMobile = useIsMobile();
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [registerAsExpense, setRegisterAsExpense] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const isDateAllowed = paymentDate ? canMarkAsPaidOnDate(paymentDate) : false;
  const hasValue = payment?.value !== null && payment?.value !== undefined && payment?.value > 0;
  const canRegisterAsExpense = hasValue && !!expenseCategoryName;

  const handleConfirm = async () => {
    if (!paymentDate || !isDateAllowed) return;
    await onConfirm(paymentDate, registerAsExpense && hasValue);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setPaymentDate(date);
    setCalendarOpen(false);
  };

  const content = (
    <div className="space-y-6">
      {/* Document Summary */}
      {payment && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-foreground">{payment.title}</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Valor:</span>
              <span className="ml-2 font-medium">
                {payment.value 
                  ? payment.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : 'Não informado'
                }
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Vencimento:</span>
              <span className="ml-2 font-medium">
                {format(new Date(payment.dueDate), 'dd/MM/yyyy')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Date */}
      <div className="space-y-2">
        <Label htmlFor="payment-date">Data do pagamento</Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              id="payment-date"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-11",
                !paymentDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {paymentDate ? format(paymentDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={paymentDate}
              onSelect={handleDateSelect}
              locale={ptBR}
              disabled={(date) => date > new Date()}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Período permitido: {getAllowedPeriodDescription()}
        </p>
      </div>

      {/* Period Restriction Alert */}
      {paymentDate && !isDateAllowed && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {getRestrictionMessage()}
          </AlertDescription>
        </Alert>
      )}

      {/* Register as Expense Checkbox */}
      {hasValue && (
        <div className="flex items-start space-x-3 pt-2">
          <Checkbox
            id="register-expense"
            checked={registerAsExpense && canRegisterAsExpense}
            onCheckedChange={(checked) => setRegisterAsExpense(checked === true)}
            disabled={!isDateAllowed || !canRegisterAsExpense}
          />
          <div className="space-y-1">
            <Label 
              htmlFor="register-expense" 
              className={cn(
                "text-sm font-medium leading-none",
                canRegisterAsExpense ? "cursor-pointer" : "text-muted-foreground"
              )}
            >
              Registrar como despesa
            </Label>
            <p className="text-xs text-muted-foreground">
              {expenseCategoryName 
                ? `O valor será registrado na categoria "${expenseCategoryName}"`
                : 'Categoria não identificada - não é possível registrar como despesa'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer 
        open={open} 
        onOpenChange={onOpenChange}
        shouldScaleBackground={false}
      >
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="bg-primary text-primary-foreground rounded-t-[10px]">
            <DrawerTitle>Confirmar pagamento</DrawerTitle>
            <DrawerDescription className="text-primary-foreground/80">
              Informe quando o pagamento foi realizado
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto">
            {content}
          </div>
          <DrawerFooter className="border-t pt-4">
            <Button
              onClick={handleConfirm}
              disabled={!paymentDate || !isDateAllowed || isLoading}
              className="w-full h-11"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                'Confirmar pagamento'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full h-11"
            >
              Cancelar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar pagamento</DialogTitle>
          <DialogDescription>
            Informe quando o pagamento foi realizado
          </DialogDescription>
        </DialogHeader>
        {content}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!paymentDate || !isDateAllowed || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirmando...
              </>
            ) : (
              'Confirmar pagamento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
