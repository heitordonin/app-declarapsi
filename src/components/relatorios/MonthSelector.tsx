import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MonthSelector({ value, onChange }: MonthSelectorProps) {
  // Gerar 24 meses: 12 passados + mês atual + 11 futuros
  const now = new Date();
  const months = Array.from({ length: 24 }, (_, i) => {
    // i=0 é 12 meses atrás, i=12 é o mês atual, i=23 é 11 meses no futuro
    const date = addMonths(now, i - 12);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
    };
  }).reverse(); // Reverter para mostrar meses mais recentes primeiro

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Período:</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Selecione o mês" />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
