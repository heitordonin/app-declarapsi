import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExpensesList } from '@/components/cliente/despesas/ExpensesList';
import { useExpensesData } from '@/hooks/cliente/useExpensesData';

export default function Despesas() {
  const [searchQuery, setSearchQuery] = useState('');
  const { expenses } = useExpensesData();

  const filteredExpenses = expenses.filter((expense) => {
    const query = searchQuery.toLowerCase();
    return (
      expense.category.toLowerCase().includes(query) ||
      expense.value.toString().includes(query)
    );
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Botão Nova Despesa */}
      <div className="flex justify-start">
        <Button>
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

      {/* Lista de Despesas */}
      <ExpensesList expenses={filteredExpenses} />
    </div>
  );
}
