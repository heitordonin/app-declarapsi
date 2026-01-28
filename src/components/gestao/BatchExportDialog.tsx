import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertTriangle, FileDown, CheckCircle2 } from 'lucide-react';
import { useBatchExport } from '@/hooks/contador/useBatchExport';
import { useClientMonthlyStatus } from '@/hooks/contador/useClientMonthlyStatus';
import { validarCPFsParaExportacao } from '@/lib/cpf-validator';
import {
  gerarArquivoRendimentos,
  gerarArquivoPagamentos,
  type RendimentoData,
  type PagamentoData,
} from '@/lib/carne-leao-export';
import type { ChargeExportData, ExpenseExportData } from '@/hooks/contador/useClientExport';
import { downloadCsv } from '@/lib/csv-utils';
import { toast } from '@/hooks/use-toast';

interface BatchExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClientIds: string[];
  clientNames: Map<string, string>;
  month: number;
  year: number;
  formattedMonth: string;
}

interface ExportProgress {
  current: number;
  total: number;
  currentClient: string;
}

export function BatchExportDialog({
  open,
  onOpenChange,
  selectedClientIds,
  clientNames,
  month,
  year,
  formattedMonth,
}: BatchExportDialogProps) {
  const [exportCharges, setExportCharges] = useState(true);
  const [exportExpenses, setExportExpenses] = useState(true);
  const [markAsExported, setMarkAsExported] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);

  const { data: batchData, isLoading } = useBatchExport(
    open ? { clientIds: selectedClientIds, month, year } : null,
    clientNames
  );

  const { markExported } = useClientMonthlyStatus({ year, month });

  // Calcular totais e validações
  const summary = useMemo(() => {
    if (!batchData) return null;

    let totalCharges = 0;
    let totalExpenses = 0;
    const clientsWithErrors: string[] = [];
    const clientsWithInvalidCpf: string[] = [];
    const clientsWithData: string[] = [];

    batchData.forEach(result => {
      if (result.hasErrors) {
        clientsWithErrors.push(result.clientName);
        return;
      }

      const chargesCount = result.data.charges.length;
      const expensesCount = result.data.expenses.length;

      if (chargesCount === 0 && expensesCount === 0) {
        return; // Ignora clientes sem dados
      }

      // Validar CPFs
      const cpfsPagadores = result.data.charges.map(c => c.payerCpf);
      const cpfsBeneficiarios = result.data.charges.map(c => c.patientCpf);
      const validacao = validarCPFsParaExportacao(
        result.data.client.cpf,
        cpfsPagadores,
        cpfsBeneficiarios
      );

      if (!validacao.valido) {
        clientsWithInvalidCpf.push(result.clientName);
        return;
      }

      totalCharges += chargesCount;
      totalExpenses += expensesCount;
      clientsWithData.push(result.clientId);
    });

    return {
      totalCharges,
      totalExpenses,
      clientsWithErrors,
      clientsWithInvalidCpf,
      clientsWithData,
      validClients: batchData.filter(r => 
        !r.hasErrors && 
        (r.data.charges.length > 0 || r.data.expenses.length > 0) &&
        validarCPFsParaExportacao(
          r.data.client.cpf,
          r.data.charges.map(c => c.payerCpf),
          r.data.charges.map(c => c.patientCpf)
        ).valido
      ),
    };
  }, [batchData]);

  // Função para sanitizar nome do arquivo
  const sanitizeName = (name: string): string => {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim();
  };

  // Função para converter charges para formato de rendimento
  const convertToRendimentos = (
    charges: ChargeExportData[],
    cpfProfissional: string,
    registroProfissional: string | null
  ): RendimentoData[] => {
    return charges.map(charge => ({
      dataRecebimento: charge.paymentDate,
      valor: charge.amount,
      historico: charge.description,
      cpfPagador: charge.payerCpf,
      cpfBeneficiario: charge.patientCpf,
      cpfProfissional,
      registroProfissional,
    }));
  };

  // Função para converter expenses para formato de pagamento
  const convertToPagamentos = (expenses: ExpenseExportData[]): PagamentoData[] => {
    return expenses.map(expense => ({
      dataPagamento: expense.paymentDate,
      codigoDespesa: expense.categoryCode,
      valor: expense.deductibleAmount,
      historico: expense.description,
    }));
  };

  // Função para gerar nome do arquivo
  const generateFileName = (clientName: string, type: 'receita saude' | 'despesas'): string => {
    const sanitized = sanitizeName(clientName);
    const competence = `${month.toString().padStart(2, '0')}-${year}`;
    return `${sanitized}_${type}_${competence}.csv`;
  };

  // Download sequencial com delay
  const downloadWithDelay = async (content: string, filename: string): Promise<void> => {
    downloadCsv(content, filename);
    await new Promise(resolve => setTimeout(resolve, 300));
  };

  const handleExport = async () => {
    if (!summary || summary.validClients.length === 0) return;

    setIsExporting(true);
    let filesGenerated = 0;
    let clientsProcessed = 0;

    try {
      const totalClients = summary.validClients.length;

      for (const result of summary.validClients) {
        setProgress({
          current: clientsProcessed + 1,
          total: totalClients,
          currentClient: result.clientName,
        });

        // Gerar arquivo de receitas
        if (exportCharges && result.data.charges.length > 0) {
          const rendimentos = convertToRendimentos(
            result.data.charges,
            result.data.client.cpf,
            result.data.client.crpNumber
          );
          const content = gerarArquivoRendimentos(rendimentos);
          const filename = generateFileName(result.clientName, 'receita saude');
          await downloadWithDelay(content, filename);
          filesGenerated++;
        }

        // Gerar arquivo de despesas
        if (exportExpenses && result.data.expenses.length > 0) {
          const pagamentos = convertToPagamentos(result.data.expenses);
          const content = gerarArquivoPagamentos(pagamentos);
          const filename = generateFileName(result.clientName, 'despesas');
          await downloadWithDelay(content, filename);
          filesGenerated++;
        }

        // Marcar como exportado se a opção estiver ativada
        if (markAsExported) {
          if (exportCharges && result.data.charges.length > 0) {
            await markExported({ clientId: result.clientId, type: 'charges' });
          }
          if (exportExpenses && result.data.expenses.length > 0) {
            await markExported({ clientId: result.clientId, type: 'expenses' });
          }
        }

        clientsProcessed++;
      }

      toast({
        title: 'Exportação em lote concluída',
        description: `${filesGenerated} arquivo(s) gerado(s) para ${clientsProcessed} cliente(s).`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro na exportação',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      setProgress(null);
    }
  };

  const canExport = summary && summary.validClients.length > 0 && (exportCharges || exportExpenses);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Exportar em Lote - Carnê Leão
          </DialogTitle>
          <DialogDescription>
            Período: {formattedMonth}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isExporting && progress ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Exportando...</span>
                <span>{progress.current}/{progress.total} clientes</span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Gerando: {progress.currentClient}...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resumo */}
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Clientes selecionados: {selectedClientIds.length}
              </p>
              {summary && (
                <>
                  <p className="text-sm text-muted-foreground">
                    • Total de receitas: {summary.totalCharges} registros
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • Total de despesas: {summary.totalExpenses} registros
                  </p>
                </>
              )}
            </div>

            {/* Alertas */}
            {summary?.clientsWithInvalidCpf.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{summary.clientsWithInvalidCpf.length}</strong> cliente(s) com CPF inválido 
                  serão ignorados: {summary.clientsWithInvalidCpf.slice(0, 3).join(', ')}
                  {summary.clientsWithInvalidCpf.length > 3 && '...'}
                </AlertDescription>
              </Alert>
            )}

            {summary?.clientsWithErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{summary.clientsWithErrors.length}</strong> cliente(s) com erro de carregamento.
                </AlertDescription>
              </Alert>
            )}

            {summary?.validClients.length === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum cliente válido para exportação no período selecionado.
                </AlertDescription>
              </Alert>
            )}

            {/* Opções de exportação */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exportCharges"
                  checked={exportCharges}
                  onCheckedChange={(checked) => setExportCharges(!!checked)}
                />
                <Label htmlFor="exportCharges" className="text-sm">
                  Exportar Rendimentos (Receita Saúde)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exportExpenses"
                  checked={exportExpenses}
                  onCheckedChange={(checked) => setExportExpenses(!!checked)}
                />
                <Label htmlFor="exportExpenses" className="text-sm">
                  Exportar Despesas Dedutíveis (P10)
                </Label>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t">
                <Checkbox
                  id="markAsExported"
                  checked={markAsExported}
                  onCheckedChange={(checked) => setMarkAsExported(!!checked)}
                />
                <Label htmlFor="markAsExported" className="text-sm">
                  Marcar como exportado após download
                </Label>
              </div>
            </div>

            {/* Info de clientes válidos */}
            {summary && summary.validClients.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{summary.validClients.length} cliente(s) prontos para exportação</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={!canExport || isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar Todos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
