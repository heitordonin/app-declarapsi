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
            return (
              <div className="relative w-full h-full flex flex-col items-center justify-center gap-0.5 py-1">
                <span className="text-sm">{date.getDate()}</span>
                {statusCounts && (
                  <div className="flex gap-0.5 flex-wrap justify-center">
                    {statusCounts.slice(0, 3).map(({ status, count }) => (
                      <div
                        key={status}
                        style={{ backgroundColor: STATUS_CONFIG[status].chart }}
                        className="w-4 h-4 rounded-sm flex items-center justify-center text-[8px] text-white font-bold"
                      >
                        {count}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          },
        }}
      />
      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium">Legenda:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div style={{ backgroundColor: STATUS_CONFIG.overdue.chart }} className="h-3 w-3 rounded-full" />
            <span>Vencida</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ backgroundColor: STATUS_CONFIG.due_48h.chart }} className="h-3 w-3 rounded-full" />
            <span>Vence em 48h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ backgroundColor: STATUS_CONFIG.pending.chart }} className="h-3 w-3 rounded-full" />
            <span>No prazo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ backgroundColor: STATUS_CONFIG.on_time_done.chart }} className="h-3 w-3 rounded-full" />
            <span>Concluída</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
