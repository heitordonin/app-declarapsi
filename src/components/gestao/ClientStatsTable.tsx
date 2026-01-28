import { useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Check, X, Eye, ArrowUpDown, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ClientMonthlyStats } from '@/hooks/contador/useClientMonthlyStats';
import type { ClientMonthlyStatus } from '@/hooks/contador/useClientMonthlyStatus';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientStatsTableProps {
  stats: ClientMonthlyStats[];
  statusMap: Record<string, ClientMonthlyStatus>;
  onMarkExported: (clientId: string, type: 'charges' | 'expenses') => void;
  onViewDetails: (clientId: string) => void;
  isLoading?: boolean;
  isMarking?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

type SortKey = 'name' | 'revenue' | 'charges' | 'expenses' | 'rate';
type SortOrder = 'asc' | 'desc';

export function ClientStatsTable({
  stats,
  statusMap,
  onMarkExported,
  onViewDetails,
  isLoading,
  isMarking,
  selectedIds = new Set(),
  onSelectionChange,
}: ClientStatsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  // Filtrar por termo de busca
  const filteredStats = stats.filter((client) =>
    client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.clientCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Seleção de clientes
  const handleSelectAll = useCallback((checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      const allIds = new Set(filteredStats.map(c => c.clientId));
      onSelectionChange(allIds);
    } else {
      onSelectionChange(new Set());
    }
  }, [filteredStats, onSelectionChange]);

  const handleSelectOne = useCallback((clientId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(clientId);
    } else {
      newSet.delete(clientId);
    }
    onSelectionChange(newSet);
  }, [selectedIds, onSelectionChange]);

  const allSelected = filteredStats.length > 0 && filteredStats.every(c => selectedIds.has(c.clientId));
  const someSelected = filteredStats.some(c => selectedIds.has(c.clientId)) && !allSelected;

  const sortedStats = [...filteredStats].sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    switch (sortKey) {
      case 'name':
        aVal = a.clientName.toLowerCase();
        bVal = b.clientName.toLowerCase();
        break;
      case 'revenue':
        aVal = a.totalRevenue;
        bVal = b.totalRevenue;
        break;
      case 'charges':
        aVal = a.chargesCount;
        bVal = b.chargesCount;
        break;
      case 'expenses':
        aVal = a.expensesCount;
        bVal = b.expensesCount;
        break;
      case 'rate':
        aVal = a.effectiveRate;
        bVal = b.effectiveRate;
        break;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const SortableHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 font-medium"
      onClick={() => handleSort(sortKeyName)}
    >
      {label}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." className="pl-10" disabled />
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Faturamento</TableHead>
                <TableHead>Rec</TableHead>
                <TableHead>Desp</TableHead>
                <TableHead>Alíq.</TableHead>
                <TableHead>Status Exp.</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        Nenhum cliente ativo encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Campo de busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredStats.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          Nenhum cliente encontrado para "{searchTerm}".
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
        <TableHeader>
          <TableRow>
            {onSelectionChange && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someSelected;
                    }
                  }}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todos"
                />
              </TableHead>
            )}
            <TableHead><SortableHeader label="Cliente" sortKeyName="name" /></TableHead>
            <TableHead><SortableHeader label="Faturamento" sortKeyName="revenue" /></TableHead>
            <TableHead className="text-center"><SortableHeader label="Rec" sortKeyName="charges" /></TableHead>
            <TableHead className="text-center"><SortableHeader label="Desp" sortKeyName="expenses" /></TableHead>
            <TableHead className="text-center"><SortableHeader label="Alíq." sortKeyName="rate" /></TableHead>
            <TableHead className="text-center">Status Exp.</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStats.map((client) => {
            const status = statusMap[client.clientId];
            const chargesExported = !!status?.charges_exported_at;
            const expensesExported = !!status?.expenses_exported_at;
            const isSelected = selectedIds.has(client.clientId);

            return (
              <TableRow key={client.clientId} data-selected={isSelected}>
                {onSelectionChange && (
                  <TableCell className="w-10">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectOne(client.clientId, !!checked)}
                      aria-label={`Selecionar ${client.clientName}`}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div>
                    <p className="font-medium">{client.clientName}</p>
                    <p className="text-xs text-muted-foreground">{client.clientCode}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.totalRevenue)}
                </TableCell>
                <TableCell className="text-center">{client.chargesCount}</TableCell>
                <TableCell className="text-center">{client.expensesCount}</TableCell>
                <TableCell className="text-center">
                  {client.effectiveRate > 0 ? `${client.effectiveRate.toFixed(1)}%` : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          disabled={isMarking}
                          onClick={() => onMarkExported(client.clientId, 'charges')}
                        >
                          <Badge
                            variant={chargesExported ? 'default' : 'outline'}
                            className={`cursor-pointer ${chargesExported ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                          >
                            R {chargesExported ? <Check className="h-3 w-3 ml-1" /> : <X className="h-3 w-3 ml-1" />}
                          </Badge>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {chargesExported 
                          ? `Receitas exportadas em ${format(new Date(status.charges_exported_at!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                          : 'Clique para marcar receitas como exportadas'}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          disabled={isMarking}
                          onClick={() => onMarkExported(client.clientId, 'expenses')}
                        >
                          <Badge
                            variant={expensesExported ? 'default' : 'outline'}
                            className={`cursor-pointer ${expensesExported ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                          >
                            D {expensesExported ? <Check className="h-3 w-3 ml-1" /> : <X className="h-3 w-3 ml-1" />}
                          </Badge>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {expensesExported 
                          ? `Despesas exportadas em ${format(new Date(status.expenses_exported_at!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                          : 'Clique para marcar despesas como exportadas'}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewDetails(client.clientId)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          </TableBody>
        </Table>
      </div>
      )}
    </div>
  );
}
