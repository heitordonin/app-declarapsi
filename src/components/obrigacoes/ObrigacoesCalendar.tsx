import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ptBR } from 'date-fns/locale';
import { getStatusStyles, type ObligationStatus } from '@/lib/obligation-status-utils';

interface ObrigacoesCalendarProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  instancesByDate: Record<string, ObligationStatus[]>;
}

export function ObrigacoesCalendar({
  selectedDate,
  onSelectDate,
  instancesByDate,
}: ObrigacoesCalendarProps) {
  const getDayBadgeColor = (dateStr: string) => {
    const statuses = instancesByDate[dateStr];
    if (!statuses || statuses.length === 0) return null;

    // Prioridade: overdue > due_48h > pending > late_done > on_time_done
    if (statuses.includes('overdue')) return getStatusStyles('overdue').badge;
    if (statuses.includes('due_48h')) return getStatusStyles('due_48h').badge;
    if (statuses.includes('pending')) return getStatusStyles('pending').badge;
    if (statuses.includes('late_done')) return getStatusStyles('late_done').badge;
    if (statuses.includes('on_time_done')) return getStatusStyles('on_time_done').badge;

    return null;
  };

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Calendário de Obrigações</h2>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelectDate}
        locale={ptBR}
        className="rounded-md border pointer-events-auto"
        modifiers={{
          hasObligations: (date) => {
            const dateStr = date.toISOString().split('T')[0];
            return !!instancesByDate[dateStr];
          },
        }}
        modifiersClassNames={{
          hasObligations: 'font-bold',
        }}
        components={{
          DayContent: ({ date }) => {
            const dateStr = date.toISOString().split('T')[0];
            const badgeColor = getDayBadgeColor(dateStr);
            return (
              <div className="relative w-full h-full flex items-center justify-center">
                <span>{date.getDate()}</span>
                {badgeColor && (
                  <Badge
                    className={`absolute -bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 p-0 rounded-full ${badgeColor}`}
                  />
                )}
              </div>
            );
          },
        }}
      />
      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium">Legenda:</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className={`h-3 w-3 rounded-full ${getStatusStyles('overdue').badge}`} />
            <span>Vencida</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`h-3 w-3 rounded-full ${getStatusStyles('due_48h').badge}`} />
            <span>Vence em 48h</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`h-3 w-3 rounded-full ${getStatusStyles('pending').badge}`} />
            <span>No prazo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`h-3 w-3 rounded-full ${getStatusStyles('on_time_done').badge}`} />
            <span>Concluída</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
