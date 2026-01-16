import { useState } from 'react';
import { Plus, Search, Receipt, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExpensesList } from '@/components/cliente/despesas/ExpensesList';
import { AddExpensePanel } from '@/components/cliente/despesas/AddExpensePanel';
import { EditExpensePanel } from '@/components/cliente/despesas/EditExpensePanel';
import { ExpenseFilters, initialFilters, type ExpenseFiltersValues } from '@/components/cliente/despesas/ExpenseFilters';
import { EmptyState } from '@/components/cliente/EmptyState';
import { useExpensesData, type Expense, type ExpenseFormData } from '@/hooks/cliente/useExpensesData';
import { parseCurrencyToNumber } from '@/lib/expense-utils';

export default function Despesas() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ExpenseFiltersValues>(initialFilters);
  
  const { 
    expenses, 
    isLoading, 
    createExpense, 
    updateExpense, 
    deleteExpense 
  } = useExpensesData();

  const filteredExpenses = expenses.filter((expense) => {
    // Text search
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || (
      expense.category.toLowerCase().includes(query) ||
      expense.value.toString().includes(query) ||
      expense.description?.toLowerCase().includes(query) ||
      (expense.competencyMonth && expense.competencyYear && 
        `${expense.competencyMonth}/${expense.competencyYear}`.includes(query))
    );

    if (!matchesSearch) return false;

    // Date filter
    if (filters.dateStart) {
      const expenseDate = new Date(expense.paymentDate);
      const filterDate = new Date(filters.dateStart);
      if (expenseDate < filterDate) return false;
    }
    if (filters.dateEnd) {
      const expenseDate = new Date(expense.paymentDate);
      const filterDate = new Date(filters.dateEnd);
      if (expenseDate > filterDate) return false;
    }

    // Value filter
    if (filters.valueMin) {
      const minValue = parseCurrencyToNumber(filters.valueMin);
      if (expense.originalValue < minValue) return false;
    }
    if (filters.valueMax) {
      const maxValue = parseCurrencyToNumber(filters.valueMax);
      if (expense.originalValue > maxValue) return false;
    }

    // Category filter
    if (filters.categoryId && expense.categoryId !== filters.categoryId) {
      return false;
    }

    // Competency filter
    if (filters.competencyMonth) {
      const filterMonth = parseInt(filters.competencyMonth);
      if (expense.competencyMonth !== filterMonth) return false;
    }
    if (filters.competencyYear) {
      const filterYear = parseInt(filters.competencyYear);
      if (expense.competencyYear !== filterYear) return false;
    }

    return true;
  });

  const handleAddExpense = async (data: ExpenseFormData) => {
    await createExpense.mutateAsync(data);
    setShowAddPanel(false);
  };

  const handleEditExpense = async (id: string, data: ExpenseFormData) => {
    await updateExpense.mutateAsync({ id, data });
    setShowEditPanel(false);
    setEditingExpense(null);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowEditPanel(true);
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense.mutateAsync(id);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Botão Nova Despesa */}
      <div className="flex justify-start">
        <Button onClick={() => setShowAddPanel(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por categoria, descrição, competência ou valor..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <ExpenseFilters
          open={showFilters}
          onOpenChange={setShowFilters}
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && expenses.length === 0 && !searchQuery && !hasActiveFilters && (
        <EmptyState
          icon={Receipt}
          title="Nenhuma despesa registrada"
          description="Registre sua primeira despesa clicando no botão acima."
        />
      )}

      {/* Empty Search/Filter Results */}
      {!isLoading && filteredExpenses.length === 0 && (searchQuery || hasActiveFilters) && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhuma despesa encontrada com os filtros aplicados.</p>
          {hasActiveFilters && (
            <Button 
              variant="link" 
              onClick={handleClearFilters}
              className="mt-2"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      )}

      {/* Lista de Despesas */}
      {!isLoading && filteredExpenses.length > 0 && (
        <ExpensesList 
          expenses={filteredExpenses} 
          onEdit={handleOpenEdit}
          onDelete={handleDeleteExpense}
        />
      )}

      {/* Painéis */}
      <AddExpensePanel
        open={showAddPanel}
        onOpenChange={setShowAddPanel}
        onSubmit={handleAddExpense}
      />

      <EditExpensePanel
        open={showEditPanel}
        onOpenChange={(open) => {
          setShowEditPanel(open);
          if (!open) setEditingExpense(null);
        }}
        expense={editingExpense}
        onSubmit={handleEditExpense}
      />
    </div>
  );
}