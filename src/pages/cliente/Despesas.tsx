import { useState } from 'react';
import { Plus, Search, Filter, Receipt, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExpensesList } from '@/components/cliente/despesas/ExpensesList';
import { AddExpensePanel } from '@/components/cliente/despesas/AddExpensePanel';
import { EditExpensePanel } from '@/components/cliente/despesas/EditExpensePanel';
import { EmptyState } from '@/components/cliente/EmptyState';
import { useExpensesData, type Expense, type ExpenseFormData } from '@/hooks/cliente/useExpensesData';

export default function Despesas() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const { 
    expenses, 
    isLoading, 
    createExpense, 
    updateExpense, 
    deleteExpense 
  } = useExpensesData();

  const filteredExpenses = expenses.filter((expense) => {
    const query = searchQuery.toLowerCase();
    return (
      expense.category.toLowerCase().includes(query) ||
      expense.value.toString().includes(query) ||
      expense.description?.toLowerCase().includes(query) ||
      (expense.competencyMonth && expense.competencyYear && 
        `${expense.competencyMonth}/${expense.competencyYear}`.includes(query))
    );
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
        <Button variant="outline" className="md:w-auto w-full">
          <Filter className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">Filtros avançados</span>
          <span className="md:hidden">Filtros</span>
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && expenses.length === 0 && !searchQuery && (
        <EmptyState
          icon={Receipt}
          title="Nenhuma despesa registrada"
          description="Registre sua primeira despesa clicando no botão acima."
        />
      )}

      {/* Empty Search Results */}
      {!isLoading && filteredExpenses.length === 0 && searchQuery && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma despesa encontrada para "{searchQuery}"
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
