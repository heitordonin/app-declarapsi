import { format, parse } from 'date-fns';
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
import { useIsMobile } from '@/hooks/use-mobile';

export interface ChargeFiltersValues {
  dueDateStart: string;
  dueDateEnd: string;
  valueMin: string;
  valueMax: string;
  status: string;
  patientId: string;
}

interface ChargeFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ChargeFiltersValues;
  onFiltersChange: (filters: ChargeFiltersValues) => void;
  onClearFilters: () => void;
  patients: { id: string; name: string }[];
}

export const initialChargeFilters: ChargeFiltersValues = {
  dueDateStart: '',
  dueDateEnd: '',
  valueMin: '',
  valueMax: '',
  status: '',
  patientId: '',
};

const statusOptions = [
  { value: 'pending', label: 'Pendente' },
  { value: 'overdue', label: 'Vencida' },
  { value: 'paid', label: 'Paga' },
];

export function ChargeFilters({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onClearFilters,
  patients,
}: ChargeFiltersProps) {
  const isMobile = useIsMobile();

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  const updateFilter = (key: keyof ChargeFiltersValues, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    try {
      return parse(dateStr, 'yyyy-MM-dd', new Date());
    } catch {
      return undefined;
    }
  };

  const handleDateSelect = (key: 'dueDateStart' | 'dueDateEnd', date: Date | undefined) => {
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
      {/* Data de Vencimento */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Data de Vencimento</Label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <DatePicker
              date={parseDate(filters.dueDateStart)}
              onDateChange={(date) => handleDateSelect('dueDateStart', date)}
              placeholder="Data inicial"
            />
          </div>
          <span className="text-muted-foreground text-sm">até</span>
          <div className="flex-1">
            <DatePicker
              date={parseDate(filters.dueDateEnd)}
              onDateChange={(date) => handleDateSelect('dueDateEnd', date)}
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

      {/* Status */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Status</Label>
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => updateFilter('status', value === 'all' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Paciente */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Paciente</Label>
        <Select
          value={filters.patientId || 'all'}
          onValueChange={(value) => updateFilter('patientId', value === 'all' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os pacientes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os pacientes</SelectItem>
            {patients.map((patient) => (
              <SelectItem key={patient.id} value={patient.id}>
                {patient.name}
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
        className="text-muted-foreground h-11"
      >
        <X className="h-4 w-4 mr-1" />
        Limpar
      </Button>
      <Button onClick={handleApply} className="h-11">
        Aplicar filtros
      </Button>
    </div>
  );

  const TriggerButton = (
    <Button variant="outline" className="md:w-auto w-full relative">
      <Filter className="h-4 w-4 mr-2" />
      <span className="hidden md:inline">Filtros avançados</span>
      <span className="md:hidden">Filtros</span>
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
      <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
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
