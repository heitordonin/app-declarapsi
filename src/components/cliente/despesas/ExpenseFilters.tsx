import { useState } from 'react';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from '@/components/ui/drawer';
import { useExpenseCategories } from '@/hooks/cliente/useExpenseCategories';
import { useIsMobile } from '@/hooks/use-mobile';

// Generate competency options (last 24 months)
const generateCompetencyOptions = () => {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const monthName = format(date, 'MMMM', { locale: ptBR });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    
    options.push({
      value: `${month}/${year}`,
      label: `${capitalizedMonth}/${year}`,
    });
  }
  
  return options;
};

const competencyOptions = generateCompetencyOptions();

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
  const isMobile = useIsMobile();

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  const updateFilter = (key: keyof ExpenseFiltersValues, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleCompetencyChange = (value: string) => {
    if (value === 'all') {
      updateFilter('competencyMonth', '');
      onFiltersChange({ ...filters, competencyMonth: '', competencyYear: '' });
    } else {
      const [month, year] = value.split('/');
      onFiltersChange({ ...filters, competencyMonth: month, competencyYear: year });
    }
  };

  const getCompetencyValue = () => {
    if (filters.competencyMonth && filters.competencyYear) {
      return `${filters.competencyMonth}/${filters.competencyYear}`;
    }
    return '';
  };

  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    try {
      return parse(dateStr, 'yyyy-MM-dd', new Date());
    } catch {
      return undefined;
    }
  };

  const handleDateSelect = (key: 'dateStart' | 'dateEnd', date: Date | undefined) => {
    if (date) {
      updateFilter(key, format(date, 'yyyy-MM-dd'));
    }
  };

  const handleApply = () => {
    onOpenChange(false);
  };

  const handleClear = () => {
    onClearFilters();
    onOpenChange(false);
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Período de Pagamento */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Data de Pagamento</Label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <DatePicker
              date={parseDate(filters.dateStart)}
              onDateChange={(date) => handleDateSelect('dateStart', date)}
              placeholder="Data inicial"
            />
          </div>
          <span className="text-muted-foreground text-sm">até</span>
          <div className="flex-1">
            <DatePicker
              date={parseDate(filters.dateEnd)}
              onDateChange={(date) => handleDateSelect('dateEnd', date)}
              placeholder="Data final"
            />
          </div>
        </div>
      </div>

      {/* Valor */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Valor (R$)</Label>
        <div className="flex items-center gap-2">
          <CurrencyInput
            value={filters.valueMin}
            onValueChange={(values) => updateFilter('valueMin', values.formattedValue)}
            placeholder="Mínimo"
            className="flex-1"
          />
          <span className="text-muted-foreground text-sm">até</span>
          <CurrencyInput
            value={filters.valueMax}
            onValueChange={(values) => updateFilter('valueMax', values.formattedValue)}
            placeholder="Máximo"
            className="flex-1"
          />
        </div>
      </div>

      {/* Categoria */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Categoria</Label>
        <Select
          value={filters.categoryId || 'all'}
          onValueChange={(value) => updateFilter('categoryId', value === 'all' ? '' : value)}
        >
          <SelectTrigger>
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

      {/* Competência */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Competência</Label>
        <Select
          value={getCompetencyValue() || 'all'}
          onValueChange={handleCompetencyChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas as competências" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as competências</SelectItem>
            {competencyOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const FilterActions = () => (
    <div className="flex items-center justify-between gap-3 pt-4 border-t">
      <Button 
        variant="ghost" 
        onClick={handleClear}
        disabled={activeFiltersCount === 0}
        className="text-muted-foreground"
      >
        <X className="h-4 w-4 mr-1" />
        Limpar
      </Button>
      <Button onClick={handleApply}>
        Aplicar filtros
      </Button>
    </div>
  );

  const TriggerButton = (
    <Button variant="outline" className="md:w-auto w-full relative">
      <Filter className="h-4 w-4 mr-2" />
      <span>Filtros</span>
      {activeFiltersCount > 0 && (
        <Badge 
          variant="secondary" 
          className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground"
        >
          {activeFiltersCount}
        </Badge>
      )}
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>
          {TriggerButton}
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Filtros avançados</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 overflow-y-auto flex-1">
            <FiltersContent />
          </div>
          <DrawerFooter className="pt-2">
            <FilterActions />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {TriggerButton}
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filtros avançados</h4>
          </div>
          <FiltersContent />
          <FilterActions />
        </div>
      </PopoverContent>
    </Popover>
  );
}
