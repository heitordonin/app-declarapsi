import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthOption {
  value: string;
  label: string;
  year: string;
}

interface MonthSelectorProps {
  selectedMonth: string | null;
  onSelectMonth: (month: string | null) => void;
}

export function MonthSelector({ selectedMonth, onSelectMonth }: MonthSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate months: 3 past + current + 2 future
  const months: MonthOption[] = [];
  const now = new Date();
  
  for (let i = 3; i >= -2; i--) {
    const date = i > 0 ? subMonths(now, i) : i < 0 ? addMonths(now, Math.abs(i)) : now;
    months.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMM', { locale: ptBR }).toUpperCase(),
      year: format(date, 'yyyy'),
    });
  }

  // Scroll to selected month on mount
  useEffect(() => {
    if (scrollRef.current && selectedMonth) {
      const selectedElement = scrollRef.current.querySelector(`[data-month="${selectedMonth}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, []);

  return (
    <div 
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {months.map((month) => (
        <button
          key={month.value}
          data-month={month.value}
          onClick={() => onSelectMonth(month.value)}
          className={cn(
            'flex-shrink-0 px-5 py-3 rounded-lg text-center min-w-[80px] transition-colors',
            selectedMonth === month.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          <div className="font-semibold text-sm">{month.label}</div>
          <div className="text-xs opacity-80">{month.year}</div>
        </button>
      ))}
      <button
        onClick={() => onSelectMonth(null)}
        className={cn(
          'flex-shrink-0 px-5 py-3 rounded-lg text-center min-w-[80px] transition-colors',
          selectedMonth === null
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        )}
      >
        <div className="font-semibold text-sm">Todos</div>
        <div className="text-xs opacity-80">&nbsp;</div>
      </button>
    </div>
  );
}
