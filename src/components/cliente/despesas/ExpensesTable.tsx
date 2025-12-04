import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExpenseActionsMenu } from './ExpenseActionsMenu';
import type { Expense } from '@/hooks/cliente/useExpensesData';

interface ExpensesTableProps {
  expenses: Expense[];
}

export function ExpensesTable({ expenses }: ExpensesTableProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (dateStr: string) =>
    format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>CATEGORIA</TableHead>
            <TableHead>VALOR</TableHead>
            <TableHead>DATA PAGAMENTO</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium">{expense.category}</TableCell>
              <TableCell>
                <div>
                  <span className="text-primary font-semibold">
                    {formatCurrency(expense.value)}
                  </span>
                  {expense.originalValue !== expense.value && (
                    <p className="text-xs text-muted-foreground">
                      Original: {formatCurrency(expense.originalValue)}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>{formatDate(expense.paymentDate)}</TableCell>
              <TableCell>
                <ExpenseActionsMenu expenseId={expense.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
