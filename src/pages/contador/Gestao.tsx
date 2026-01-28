import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MonthSelector } from '@/components/relatorios/MonthSelector';
import { GestaoKPIs } from '@/components/gestao/GestaoKPIs';
import { ClientStatsTable } from '@/components/gestao/ClientStatsTable';
import { ClientDetailPanel } from '@/components/gestao/ClientDetailPanel';
import { BatchExportDialog } from '@/components/gestao/BatchExportDialog';
import { useClientMonthlyStats } from '@/hooks/contador/useClientMonthlyStats';
import { useClientMonthlyStatus } from '@/hooks/contador/useClientMonthlyStatus';
import { ExportClientDataDialog } from '@/components/clientes/ExportClientDataDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileDown } from 'lucide-react';

export default function Gestao() {
  const [selectedPeriod, setSelectedPeriod] = useState(() => format(new Date(), 'yyyy-MM'));
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [exportClientId, setExportClientId] = useState<string | null>(null);
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [batchExportOpen, setBatchExportOpen] = useState(false);

  const [year, month] = selectedPeriod.split('-').map(Number);

  const { data: stats = [], isLoading: isLoadingStats } = useClientMonthlyStats({ year, month });
  const { 
    data: statusMap = {}, 
    isLoading: isLoadingStatus,
    markExported,
    unmarkExported,
    isMarking,
    isUnmarking,
  } = useClientMonthlyStatus({ year, month });

  // Calcular clientes completamente exportados (receitas E despesas)
  const exportedCount = useMemo(() => {
    return stats.filter(client => {
      const status = statusMap[client.clientId];
      return status?.charges_exported_at && status?.expenses_exported_at;
    }).length;
  }, [stats, statusMap]);

  // Identificar clientes com pendências
  const clientsWithPending = useMemo(() => {
    return stats.filter(client => {
      const status = statusMap[client.clientId];
      const hasData = client.chargesCount > 0 || client.expensesCount > 0;
      const notFullyExported = !status?.charges_exported_at || !status?.expenses_exported_at;
      return hasData && notFullyExported;
    });
  }, [stats, statusMap]);

  // Clientes sem lançamentos no mês
  const clientsWithoutEntries = useMemo(() => {
    return stats.filter(client => client.chargesCount === 0 && client.expensesCount === 0);
  }, [stats]);

  // Map de nomes de clientes para o BatchExportDialog
  const clientNames = useMemo(() => {
    const map = new Map<string, string>();
    stats.forEach(s => map.set(s.clientId, s.clientName));
    return map;
  }, [stats]);

  // Limpar seleção ao mudar período
  const handlePeriodChange = useCallback((newPeriod: string) => {
    setSelectedPeriod(newPeriod);
    setSelectedClientIds(new Set());
  }, []);

  const selectedClient = stats.find(c => c.clientId === selectedClientId) || null;
  const selectedStatus = selectedClientId ? statusMap[selectedClientId] || null : null;

  const formattedMonth = format(new Date(year, month - 1), "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestão Mensal</h1>
          <p className="text-muted-foreground">
            Controle de processos e exportações para o Carnê Leão
          </p>
        </div>
        <MonthSelector value={selectedPeriod} onChange={handlePeriodChange} />
      </div>

      {/* KPIs */}
      <GestaoKPIs 
        stats={stats} 
        exportedCount={exportedCount} 
        isLoading={isLoadingStats} 
      />

      {/* Alertas de Pendências */}
      {!isLoadingStats && (clientsWithPending.length > 0 || clientsWithoutEntries.length > 0) && (
        <div className="space-y-2">
          {clientsWithPending.length > 0 && (
            <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>{clientsWithPending.length}</strong> cliente(s) com exportação pendente para {formattedMonth}.
              </AlertDescription>
            </Alert>
          )}
          {clientsWithoutEntries.length > 0 && (
            <Alert variant="default" className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>{clientsWithoutEntries.length}</strong> cliente(s) sem lançamentos em {formattedMonth}.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Barra de ações de seleção */}
      {selectedClientIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedClientIds.size} cliente(s) selecionado(s)
          </span>
          <Button onClick={() => setBatchExportOpen(true)}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar {selectedClientIds.size} cliente(s)
          </Button>
          <Button variant="ghost" onClick={() => setSelectedClientIds(new Set())}>
            Limpar seleção
          </Button>
        </div>
      )}

      {/* Tabela de Clientes */}
      <ClientStatsTable
        stats={stats}
        statusMap={statusMap}
        onMarkExported={(clientId, type) => markExported({ clientId, type })}
        onViewDetails={setSelectedClientId}
        isLoading={isLoadingStats || isLoadingStatus}
        isMarking={isMarking || isUnmarking}
        selectedIds={selectedClientIds}
        onSelectionChange={setSelectedClientIds}
      />

      {/* Painel de Detalhes */}
      <ClientDetailPanel
        open={!!selectedClientId}
        onOpenChange={(open) => !open && setSelectedClientId(null)}
        client={selectedClient}
        status={selectedStatus}
        onMarkExported={(clientId, type) => markExported({ clientId, type })}
        onUnmarkExported={(clientId, type) => unmarkExported({ clientId, type })}
        onExportCSV={(clientId) => {
          setSelectedClientId(null);
          setExportClientId(clientId);
        }}
        isMarking={isMarking || isUnmarking}
        selectedMonth={formattedMonth}
      />

      {/* Dialog de Exportação Individual */}
      {exportClientId && (
        <ExportClientDataDialog
          open={!!exportClientId}
          onOpenChange={(open) => !open && setExportClientId(null)}
          clientId={exportClientId}
          clientName={stats.find(c => c.clientId === exportClientId)?.clientName || ''}
        />
      )}

      {/* Dialog de Exportação em Lote */}
      <BatchExportDialog
        open={batchExportOpen}
        onOpenChange={(open) => {
          setBatchExportOpen(open);
          if (!open) setSelectedClientIds(new Set());
        }}
        selectedClientIds={Array.from(selectedClientIds)}
        clientNames={clientNames}
        month={month}
        year={year}
        formattedMonth={formattedMonth}
      />
    </div>
  );
}
