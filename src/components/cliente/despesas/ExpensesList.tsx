import { ExpensesTable } from './ExpensesTable';
import { ExpenseCard } from './ExpenseCard';
import type { Expense } from '@/hooks/cliente/useExpensesData';

interface ExpensesListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpensesList({ expenses, onEdit, onDelete }: ExpensesListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma despesa encontrada
      </div>
    );
  }

  return (
    <>
      {/* Desktop: Table */}
      <div className="hidden md:block">
        <ExpensesTable expenses={expenses} onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {expenses.map((expense) => (
          <ExpenseCard 
            key={expense.id} 
            expense={expense} 
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </>
  );
}
