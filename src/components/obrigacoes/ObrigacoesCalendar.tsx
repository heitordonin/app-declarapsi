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
              <div className="relative w-full h-full flex flex-col items-center justify-start p-1.5 overflow-hidden">
                <span className="text-sm font-bold mb-0.5">{date.getDate()}</span>
                {visibleBadges.length > 0 && (
                  <div className="grid grid-cols-2 gap-1">
                    {visibleBadges.map(({ status, count }) => (
                      <div
                        key={status}
                        style={{ backgroundColor: STATUS_CONFIG[status].chart }}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm"
                      >
                        {count}
                      </div>
                    ))}
                    {remainingCount > 0 && (
                      <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-[9px] text-white font-bold shadow-sm">
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
            <div style={{ backgroundColor: STATUS_CONFIG.overdue.chart }} className="h-5 w-5 rounded-full shadow-sm" />
            <span>Vencida</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ backgroundColor: STATUS_CONFIG.due_48h.chart }} className="h-5 w-5 rounded-full shadow-sm" />
            <span>Vence em 48h</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ backgroundColor: STATUS_CONFIG.pending.chart }} className="h-5 w-5 rounded-full shadow-sm" />
            <span>No prazo</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ backgroundColor: STATUS_CONFIG.on_time_done.chart }} className="h-5 w-5 rounded-full shadow-sm" />
            <span>Concluída</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
