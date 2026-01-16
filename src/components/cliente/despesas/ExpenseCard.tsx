import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { ExpenseActionsMenu } from './ExpenseActionsMenu';
import type { Expense } from '@/hooks/cliente/useExpensesData';

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formattedDate = format(parseISO(expense.paymentDate), 'dd/MM/yyyy', { locale: ptBR });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">{expense.category}</p>
            <div className="mt-1">
              <span className="text-primary font-semibold">{formatCurrency(expense.value)}</span>
              {expense.originalValue !== expense.value && (
                <span className="text-xs text-muted-foreground ml-2">
                  Original: {formatCurrency(expense.originalValue)}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Pago em: {formattedDate}
            </p>
          </div>
          <ExpenseActionsMenu 
            expense={expense}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </CardContent>
    </Card>
  );
}
