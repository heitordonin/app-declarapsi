import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEmailQueue, useReprocessEmail, useCancelEmail } from '@/hooks/contador/useEmailQueue';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, X, AlertCircle } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendente' },
  { value: 'processing', label: 'Processando' },
  { value: 'sent', label: 'Enviado' },
  { value: 'failed', label: 'Falhou' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500 text-white',
  processing: 'bg-blue-500 text-white',
  sent: 'bg-green-500 text-white',
  failed: 'bg-red-500 text-white',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  sent: 'Enviado',
  failed: 'Falhou',
};

export function EmailQueueTab() {
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useEmailQueue({
    status: status === 'all' ? undefined : status,
    page,
    pageSize: 20,
  });

  const reprocessMutation = useReprocessEmail();
  const cancelMutation = useCancelEmail();

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex justify-end">
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
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
                  <TableHead>Status</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead className="hidden lg:table-cell">Próx. Tentativa</TableHead>
                  <TableHead className="hidden md:table-cell">Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum item na fila
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge className={STATUS_COLORS[item.status] || 'bg-gray-500'}>
                          {STATUS_LABELS[item.status] || item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[200px]">
                            {item.document?.file_name || 'N/A'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.document?.competence}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[150px]">{item.document?.client?.name || 'N/A'}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {item.document?.client?.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={item.attempts >= item.max_attempts ? 'text-destructive font-medium' : ''}>
                          {item.attempts} / {item.max_attempts}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell whitespace-nowrap">
                        {item.next_retry_at
                          ? format(new Date(item.next_retry_at), "dd/MM 'às' HH:mm", { locale: ptBR })
                          : '-'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell whitespace-nowrap">
                        {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <div className="flex justify-end gap-1">
                            {item.status === 'failed' && (
                              <>
                                {item.error_message && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                        <AlertCircle className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-[300px]">
                                      <p className="text-sm">{item.error_message}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => reprocessMutation.mutate(item.id)}
                                      disabled={reprocessMutation.isPending}
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Reprocessar</TooltipContent>
                                </Tooltip>
                              </>
                            )}
                            {item.status === 'pending' && (
                              <AlertDialog>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>Cancelar</TooltipContent>
                                </Tooltip>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancelar envio?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      O e-mail será removido da fila e não será enviado. Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => cancelMutation.mutate(item.id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Cancelar envio
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Página {data.currentPage} de {data.totalPages} ({data.totalCount} itens)
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
