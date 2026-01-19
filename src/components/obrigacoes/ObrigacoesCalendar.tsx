import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ObligationStatus } from '@/lib/obligation-status-utils';
import { STATUS_CONFIG } from '@/lib/obligation-status-utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

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

  const statusOrder: ObligationStatus[] = ['overdue', 'due_48h', 'pending', 'on_time_done', 'late_done'];

  return (
    <TooltipProvider>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle>Calendário de Obrigações</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={onSelectDate}
            locale={ptBR}
            showOutsideDays={false}
            className="p-2 pointer-events-auto"
            classNames={{
              months: "flex flex-col",
              month: "space-y-2",
              caption: "flex justify-center pt-1 relative items-center mb-4",
              caption_label: "text-base font-semibold capitalize",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                buttonVariants({ variant: "outline" }),
                "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse",
              head_row: "flex",
              head_cell: "text-muted-foreground font-medium text-xs flex-1 text-center py-2 uppercase",
              row: "flex w-full",
              cell: cn(
                "relative flex-1 min-h-[72px] md:min-h-[88px] border border-border/50 p-1",
                "focus-within:relative focus-within:z-20",
                "[&:has([aria-selected])]:bg-accent/30"
              ),
              day: cn(
                "h-full w-full p-0 font-normal",
                "hover:bg-accent/50 rounded-md transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
              ),
              day_selected: "bg-primary/10 rounded-md",
              day_today: "[&>div>span]:bg-primary [&>div>span]:text-primary-foreground [&>div>span]:rounded-full [&>div>span]:px-1.5",
              day_outside: "text-muted-foreground opacity-30",
              day_disabled: "text-muted-foreground opacity-50",
            }}
            components={{
              IconLeft: () => <ChevronLeft className="h-4 w-4" />,
              IconRight: () => <ChevronRight className="h-4 w-4" />,
              DayContent: ({ date }) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const counts = getStatusCounts(dateStr);
                const hasObligations = Object.values(counts).some(c => c > 0);
                const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

                return (
                  <div className="w-full h-full flex flex-col min-h-[64px] md:min-h-[80px]">
                    {/* Day number */}
                    <div className="text-right pr-1 pt-0.5">
                      <span className="text-sm font-medium">{date.getDate()}</span>
                    </div>
                    
                    {/* Status dots */}
                    {hasObligations && (
                      <div className="flex-1 flex items-end pb-1.5 px-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-wrap gap-1 cursor-pointer">
                              {statusOrder
                                .filter(status => counts[status] > 0)
                                .map((status) => (
                                  <div
                                    key={status}
                                    className={cn(
                                      "h-2.5 w-2.5 md:h-3 md:w-3 rounded-full shadow-sm",
                                      STATUS_CONFIG[status].badge
                                    )}
                                  />
                                ))}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[200px]">
                            <div className="space-y-1">
                              <p className="font-medium text-xs border-b pb-1 mb-1">
                                {totalCount} obrigação(ões)
                              </p>
                              {statusOrder
                                .filter(status => counts[status] > 0)
                                .map((status) => (
                                  <div key={status} className="flex items-center gap-2 text-xs">
                                    <div className={cn("h-2 w-2 rounded-full", STATUS_CONFIG[status].badge)} />
                                    <span>{STATUS_CONFIG[status].label}:</span>
                                    <span className="font-medium">{counts[status]}</span>
                                  </div>
                                ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                );
              },
            }}
          />

          {/* Legend */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {statusOrder.map((status) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className={cn("h-3 w-3 rounded-full", STATUS_CONFIG[status].badge)} />
                  <span className="text-xs text-muted-foreground">{STATUS_CONFIG[status].label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
