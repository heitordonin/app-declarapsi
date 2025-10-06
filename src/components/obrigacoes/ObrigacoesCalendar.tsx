import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ObligationStatus } from '@/lib/obligation-status-utils';
import { STATUS_CONFIG } from '@/lib/obligation-status-utils';
import { format } from 'date-fns';

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
  const getStatusCounts = (dateStr: string) => {
    const statuses = instancesByDate[dateStr] || [];
    const counts: Record<ObligationStatus, number> = {
      overdue: 0,
      due_48h: 0,
      pending: 0,
      on_time_done: 0,
      late_done: 0,
    };

    statuses.forEach((status) => {
      counts[status]++;
    });

    return counts;
  };

  const modifiers = {
    hasObrigacoes: (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return instancesByDate[dateStr] && instancesByDate[dateStr].length > 0;
    },
  };

  const modifiersClassNames = {
    hasObrigacoes: 'font-bold',
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Calendário de Obrigações</CardTitle>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelectDate}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          components={{
            DayContent: ({ date }) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const counts = getStatusCounts(dateStr);
              
              const statusesWithCounts = (Object.entries(counts) as [ObligationStatus, number][])
                .filter(([_, count]) => count > 0)
                .sort(([a], [b]) => {
                  const order: ObligationStatus[] = ['overdue', 'due_48h', 'pending', 'on_time_done', 'late_done'];
                  return order.indexOf(a) - order.indexOf(b);
                });

              const visibleBadges = statusesWithCounts.slice(0, 4);
              const remainingCount = statusesWithCounts.slice(4).reduce((acc, [_, count]) => acc + count, 0);

              return (
                <div className="relative w-full h-full flex flex-col p-2 overflow-hidden select-none">
                  <div className="text-sm font-semibold leading-none mb-1">
                    {date.getDate()}
                  </div>
                  
                  {statusesWithCounts.length > 0 && (
                    <div className="grid grid-cols-2 gap-1 justify-items-center content-start auto-rows-[24px]">
                      {visibleBadges.map(([status, count]) => (
                        <div
                          key={status}
                          className={`${STATUS_CONFIG[status].badge} rounded-full flex items-center justify-center text-white font-bold shadow-sm w-6 h-6 text-[10px]`}
                          title={`${STATUS_CONFIG[status].label}: ${count}`}
                        >
                          {count}
                        </div>
                      ))}
                      {remainingCount > 0 && (
                        <div
                          className="bg-gray-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm w-6 h-6 text-[10px]"
                          title={`Mais ${remainingCount} obrigações`}
                        >
                          +{remainingCount}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            },
          }}
        />

        <div className="mt-6 pt-6 border-t">
          <h3 className="text-sm font-semibold mb-3">Legenda</h3>
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(STATUS_CONFIG) as [ObligationStatus, typeof STATUS_CONFIG[ObligationStatus]][]).map(
              ([status, config]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={`${config.badge} h-5 w-5 rounded-full flex-shrink-0`} />
                  <span className="text-xs text-muted-foreground">{config.label}</span>
                </div>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
