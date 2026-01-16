import { useState } from 'react';
import { X, CalendarDays, DollarSign, Tag, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useExpenseCategories } from '@/hooks/cliente/useExpenseCategories';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 3 + i);
const months = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export interface ExpenseFiltersValues {
  dateStart: string;
  dateEnd: string;
  valueMin: string;
  valueMax: string;
  categoryId: string;
  competencyMonth: string;
  competencyYear: string;
}

interface ExpenseFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ExpenseFiltersValues;
  onFiltersChange: (filters: ExpenseFiltersValues) => void;
  onClearFilters: () => void;
}

export const initialFilters: ExpenseFiltersValues = {
  dateStart: '',
  dateEnd: '',
  valueMin: '',
  valueMax: '',
  categoryId: '',
  competencyMonth: '',
  competencyYear: '',
};

export function ExpenseFilters({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onClearFilters,
}: ExpenseFiltersProps) {
  const { categories } = useExpenseCategories();

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  const updateFilter = (key: keyof ExpenseFiltersValues, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="md:w-auto w-full relative">
          <span className="flex items-center">
            <span className="hidden md:inline">Filtros avançados</span>
            <span className="md:hidden">Filtros</span>
          </span>
          {activeFiltersCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-4">
        <div className="p-4 rounded-lg border bg-card space-y-6">
          {/* Header com botão limpar */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-muted-foreground">Filtros avançados</h4>
            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearFilters}
                className="h-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro de Data */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                Data de Pagamento
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">De</Label>
                  <Input
                    type="date"
                    value={filters.dateStart}
                    onChange={(e) => updateFilter('dateStart', e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Até</Label>
                  <Input
                    type="date"
                    value={filters.dateEnd}
                    onChange={(e) => updateFilter('dateEnd', e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Filtro de Valor */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Valor (R$)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Mínimo</Label>
                  <CurrencyInput
                    value={filters.valueMin}
                    onValueChange={(values) => updateFilter('valueMin', values.formattedValue)}
                    placeholder="0,00"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Máximo</Label>
                  <CurrencyInput
                    value={filters.valueMax}
                    onValueChange={(values) => updateFilter('valueMax', values.formattedValue)}
                    placeholder="0,00"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Filtro de Categoria */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Categoria
              </Label>
              <Select
                value={filters.categoryId}
                onValueChange={(value) => updateFilter('categoryId', value === 'all' ? '' : value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Competência */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Competência
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={filters.competencyMonth}
                  onValueChange={(value) => updateFilter('competencyMonth', value === 'all' ? '' : value)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.competencyYear}
                  onValueChange={(value) => updateFilter('competencyYear', value === 'all' ? '' : value)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
