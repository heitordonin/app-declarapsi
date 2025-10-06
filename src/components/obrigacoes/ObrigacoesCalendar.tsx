import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { ptBR } from 'date-fns/locale';
import { getStatusStyles, STATUS_CONFIG, type ObligationStatus } from '@/lib/obligation-status-utils';

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
    const statuses = instancesByDate[dateStr];
    if (!statuses || statuses.length === 0) return null;

    const counts: Partial<Record<ObligationStatus, number>> = {};
    statuses.forEach(status => {
      counts[status] = (counts[status] || 0) + 1;
    });

    // Retornar na ordem de prioridade
    const priorityOrder: ObligationStatus[] = ['overdue', 'due_48h', 'pending', 'late_done', 'on_time_done'];
    return priorityOrder
      .filter(status => counts[status])
      .map(status => ({ status, count: counts[status]! }));
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
            const statusCounts = getStatusCounts(dateStr);
            const visibleBadges = statusCounts?.slice(0, 4) || [];
            const remainingCount = statusCounts && statusCounts.length > 4 ? statusCounts.length - 4 : 0;
            
            return (
              <div className="relative w-full h-full flex flex-col items-center justify-start p-2 md:p-2.5 xl:p-3 overflow-hidden select-none">
                <span className="leading-none font-semibold text-[10px] md:text-xs xl:text-sm mb-0.5">{date.getDate()}</span>
                {visibleBadges.length > 0 && (
                  <div className="mt-1 grid grid-cols-2 gap-1 justify-items-center content-start auto-rows-[1.125rem] md:auto-rows-[1.25rem] xl:auto-rows-[1.5rem]">
                    {visibleBadges.map(({ status, count }) => (
                      <div
                        key={status}
                        title={`${status} - ${count}`}
                        style={{ backgroundColor: STATUS_CONFIG[status].chart }}
                        className="rounded-full flex items-center justify-center text-white font-bold shadow-sm w-4 h-4 md:w-5 md:h-5 xl:w-6 xl:h-6 text-[9px] md:text-[10px] xl:text-[11px]"
                      >
                        {count}
                      </div>
                    ))}
                    {remainingCount > 0 && (
                      <div
                        className="rounded-full bg-muted-foreground flex items-center justify-center text-white font-bold shadow-sm w-4 h-4 md:w-5 md:h-5 xl:w-6 xl:h-6 text-[8px] md:text-[9px] xl:text-[10px]"
                        title={`+${remainingCount} mais`}
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
      <div className="mt-6 space-y-3">
        <p className="text-sm font-semibold">Legenda:</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div style={{ backgroundColor: STATUS_CONFIG.overdue.chart }} className="h-4 w-4 md:h-5 md:w-5 rounded-full shadow-sm" />
            <span>Vencida</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ backgroundColor: STATUS_CONFIG.due_48h.chart }} className="h-4 w-4 md:h-5 md:w-5 rounded-full shadow-sm" />
            <span>Vence em 48h</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ backgroundColor: STATUS_CONFIG.pending.chart }} className="h-4 w-4 md:h-5 md:w-5 rounded-full shadow-sm" />
            <span>No prazo</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ backgroundColor: STATUS_CONFIG.on_time_done.chart }} className="h-4 w-4 md:h-5 md:w-5 rounded-full shadow-sm" />
            <span>Concluída</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
