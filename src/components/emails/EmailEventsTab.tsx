import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEmailEvents } from '@/hooks/contador/useEmailEvents';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronLeft, ChevronRight, ChevronDown, Loader2, Search } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type EmailEventType = Database['public']['Enums']['email_event_type'];

const EVENT_TYPE_OPTIONS: { value: EmailEventType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'sent', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'opened', label: 'Aberto' },
  { value: 'clicked', label: 'Clicado' },
  { value: 'bounced', label: 'Bounced' },
  { value: 'spam', label: 'Spam' },
];

const EVENT_TYPE_COLORS: Record<EmailEventType, string> = {
  sent: 'bg-blue-500 text-white',
  delivered: 'bg-cyan-500 text-white',
  opened: 'bg-green-500 text-white',
  clicked: 'bg-violet-500 text-white',
  bounced: 'bg-red-500 text-white',
  spam: 'bg-orange-500 text-white',
};

const EVENT_TYPE_LABELS: Record<EmailEventType, string> = {
  sent: 'Enviado',
  delivered: 'Entregue',
  opened: 'Aberto',
  clicked: 'Clicado',
  bounced: 'Bounced',
  spam: 'Spam',
};

export function EmailEventsTab() {
  const [eventType, setEventType] = useState<EmailEventType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data, isLoading } = useEmailEvents({
    eventType: eventType === 'all' ? undefined : eventType,
    search: search || undefined,
    page,
    pageSize: 20,
  });

  const toggleRowExpanded = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por e-mail..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={eventType}
          onValueChange={(value) => {
            setEventType(value as EmailEventType | 'all');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de evento" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead className="hidden md:table-cell">Email ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum evento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.events.map((event) => (
                    <Collapsible key={event.id} asChild>
                      <>
                        <TableRow>
                          <TableCell>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleRowExpanded(event.id)}
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${
                                    expandedRows.has(event.id) ? 'rotate-180' : ''
                                  }`}
                                />
                              </Button>
                            </CollapsibleTrigger>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(event.received_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge className={EVENT_TYPE_COLORS[event.event_type]}>
                              {EVENT_TYPE_LABELS[event.event_type]}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{event.recipient}</TableCell>
                          <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground truncate max-w-[150px]">
                            {event.email_id}
                          </TableCell>
                        </TableRow>
                        <CollapsibleContent asChild>
                          <TableRow className="bg-muted/50">
                            <TableCell colSpan={5}>
                              <div className="p-4">
                                <h4 className="font-medium mb-2">Metadados</h4>
                                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                                  {JSON.stringify(event.metadata, null, 2) || 'Nenhum metadado'}
                                </pre>
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Página {data.currentPage} de {data.totalPages} ({data.totalCount} eventos)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
