import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Loader2, AlertTriangle, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Client } from "@/types/database";
import { useClientExport, ChargeExportData, ExpenseExportData } from "@/hooks/contador/useClientExport";
import {
  generateCsv,
  downloadCsv,
  formatDateBR,
  formatNumberCSV,
  cleanCpf,
  CsvColumn,
} from "@/lib/csv-utils";
import {
  gerarArquivoRendimentos,
  gerarArquivoPagamentos,
  validarLimiteLinhas,
  RendimentoData,
  PagamentoData,
} from "@/lib/carne-leao-export";
import {
  validarCPFsParaExportacao,
  formatarCPF,
} from "@/lib/cpf-validator";

interface Props {
  client?: Client;
  clientId?: string;
  clientName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ExportFormat = "interno" | "carne-leao";

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

// Gera lista de anos (ano atual + 2 anteriores)
function getYearOptions() {
  const currentYear = new Date().getFullYear();
  return [currentYear, currentYear - 1, currentYear - 2];
}

// Colunas para CSV interno de receitas
const chargeColumnsInterno: CsvColumn<ChargeExportData>[] = [
  { header: "data_pagamento", render: (item) => formatDateBR(item.paymentDate) },
  { header: "cpf_paciente", render: (item) => cleanCpf(item.patientCpf) },
  { header: "cpf_pagador", render: (item) => cleanCpf(item.payerCpf) },
  { header: "nome_paciente", render: (item) => item.patientName },
  { header: "descricao", render: (item) => item.description },
  { header: "valor", render: (item) => formatNumberCSV(item.amount) },
  { header: "quantidade_sessoes", render: (item) => item.sessionsCount },
];

// Colunas para CSV interno de despesas
const expenseColumnsInterno: CsvColumn<ExpenseExportData>[] = [
  { header: "data_pagamento", render: (item) => formatDateBR(item.paymentDate) },
  { header: "codigo_categoria", render: (item) => item.categoryCode },
  { header: "categoria", render: (item) => item.categoryName },
  { header: "valor_original", render: (item) => formatNumberCSV(item.originalAmount) },
  { header: "valor_dedutivel", render: (item) => formatNumberCSV(item.deductibleAmount) },
  { header: "residencial", render: (item) => (item.isResidential ? "Sim" : "Não") },
  { header: "descricao", render: (item) => item.description || "" },
];

export function ExportClientDataDialog({ client, clientId, clientName, open, onOpenChange }: Props) {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [exportCharges, setExportCharges] = useState(true);
  const [exportExpenses, setExportExpenses] = useState(true);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("carne-leao");
  const [isExporting, setIsExporting] = useState(false);

  // Suporta tanto client object quanto clientId/clientName separados
  const resolvedClientId = client?.id || clientId;
  const resolvedClientName = client?.name || clientName || '';

  const { data, isLoading, refetch } = useClientExport(
    open && resolvedClientId ? { clientId: resolvedClientId, month, year } : null
  );

  const yearOptions = getYearOptions();
  const selectedMonthLabel = MONTHS.find((m) => m.value === month)?.label || "";

  // Validação para formato Carnê Leão
  const validacaoCarneLeao = useMemo(() => {
    if (!data || exportFormat !== "carne-leao") {
      return { valido: true, erros: [], cpfsInvalidos: [] };
    }

    const cpfsPagadores = data.charges.map(c => c.payerCpf);
    const cpfsBeneficiarios = data.charges.map(c => c.patientCpf);

    return validarCPFsParaExportacao(
      data.client.cpf,
      cpfsPagadores,
      cpfsBeneficiarios
    );
  }, [data, exportFormat]);

  // Validação de limite de linhas
  const validacaoLimite = useMemo(() => {
    if (!data) return { valido: true, mensagem: null };
    return validarLimiteLinhas(
      exportCharges ? data.charges.length : 0,
      exportExpenses ? data.expenses.length : 0
    );
  }, [data, exportCharges, exportExpenses]);

  // Gera nome do arquivo no formato: nome_tipo_mm-aaaa.csv
  const gerarNomeArquivo = (nome: string, tipo: string, mes: number, ano: number): string => {
    const nomeLimpo = nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove caracteres especiais
      .trim();
    const mesFormatado = mes.toString().padStart(2, '0');
    return `${nomeLimpo}_${tipo}_${mesFormatado}-${ano}.csv`;
  };

  const handleExportInterno = async () => {
    const result = await refetch();
    const exportData = result.data;

    if (!exportData) {
      throw new Error("Não foi possível carregar os dados");
    }

    let filesExported = 0;

    // Determinar tipo para nome do arquivo
    const exportarAmbos = exportCharges && exportExpenses;

    // Exportar receitas formato interno
    if (exportCharges) {
      const csvContent = generateCsv(exportData.charges, chargeColumnsInterno);
      const tipo = exportarAmbos ? "receitas" : "receitas";
      const filename = gerarNomeArquivo(resolvedClientName, tipo, month, year);
      downloadCsv(csvContent, filename);
      filesExported++;
    }

    // Exportar despesas formato interno
    if (exportExpenses) {
      const csvContent = generateCsv(exportData.expenses, expenseColumnsInterno);
      const tipo = exportarAmbos ? "despesas" : "despesas";
      const filename = gerarNomeArquivo(resolvedClientName, tipo, month, year);
      downloadCsv(csvContent, filename);
      filesExported++;
    }

    return {
      filesExported,
      chargesCount: exportCharges ? exportData.charges.length : 0,
      expensesCount: exportExpenses ? exportData.expenses.length : 0,
    };
  };

  const handleExportCarneLeao = async () => {
    const result = await refetch();
    const exportData = result.data;

    if (!exportData) {
      throw new Error("Não foi possível carregar os dados");
    }

    let filesExported = 0;

    // Exportar rendimentos (Receita Saúde)
    if (exportCharges && exportData.charges.length > 0) {
      const rendimentos: RendimentoData[] = exportData.charges.map(charge => ({
        dataRecebimento: charge.paymentDate,
        valor: charge.amount,
        historico: charge.description,
        cpfPagador: charge.payerCpf,
        cpfBeneficiario: charge.patientCpf,
        cpfProfissional: exportData.client.cpf,
        registroProfissional: exportData.client.crpNumber,
      }));

      const csvContent = gerarArquivoRendimentos(rendimentos);
      const filename = gerarNomeArquivo(resolvedClientName, "receita saude", month, year);
      downloadCsv(csvContent, filename);
      filesExported++;
    }

    // Exportar pagamentos (P10)
    if (exportExpenses && exportData.expenses.length > 0) {
      const pagamentos: PagamentoData[] = exportData.expenses.map(expense => ({
        dataPagamento: expense.paymentDate,
        codigoDespesa: expense.categoryCode,
        valor: expense.deductibleAmount,
        historico: expense.description,
      }));

      const csvContent = gerarArquivoPagamentos(pagamentos);
      const filename = gerarNomeArquivo(resolvedClientName, "despesas", month, year);
      downloadCsv(csvContent, filename);
      filesExported++;
    }

    return {
      filesExported,
      chargesCount: exportCharges ? exportData.charges.length : 0,
      expensesCount: exportExpenses ? exportData.expenses.length : 0,
    };
  };

  const handleExport = async () => {
    if (!exportCharges && !exportExpenses) {
      toast({
        title: "Selecione ao menos um tipo",
        description: "Escolha exportar receitas e/ou despesas.",
        variant: "destructive",
      });
      return;
    }

    // Validações para Carnê Leão
    if (exportFormat === "carne-leao") {
      if (!validacaoCarneLeao.valido) {
        toast({
          title: "CPFs inválidos encontrados",
          description: "Corrija os CPFs antes de exportar no formato Carnê Leão.",
          variant: "destructive",
        });
        return;
      }

      if (!validacaoLimite.valido) {
        toast({
          title: "Limite de linhas excedido",
          description: validacaoLimite.mensagem,
          variant: "destructive",
        });
        return;
      }
    }

    setIsExporting(true);

    try {
      const result = exportFormat === "carne-leao" 
        ? await handleExportCarneLeao()
        : await handleExportInterno();

      const formatLabel = exportFormat === "carne-leao" ? "Carnê Leão" : "interno";

      toast({
        title: "Exportação concluída",
        description: `${result.filesExported} arquivo(s) gerado(s) no formato ${formatLabel}: ${result.chargesCount} receita(s), ${result.expensesCount} despesa(s).`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar os arquivos CSV.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const isReady = !isLoading && data;
  const chargesCount = data?.charges.length || 0;
  const expensesCount = data?.expenses.length || 0;

  const canExport = 
    !isExporting && 
    !isLoading && 
    (exportCharges || exportExpenses) &&
    (exportFormat !== "carne-leao" || (validacaoCarneLeao.valido && validacaoLimite.valido));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exportar Dados
          </DialogTitle>
          <DialogDescription>
            Exporte receitas e despesas de <strong>{resolvedClientName}</strong> para CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações do cliente para Carnê Leão */}
          {exportFormat === "carne-leao" && data?.client && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">CPF Profissional:</span>
                <span className="font-medium">
                  {data.client.cpf ? formatarCPF(data.client.cpf) : "Não informado"}
                </span>
              </div>
              {data.client.crpNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CRP:</span>
                  <span className="font-medium">{data.client.crpNumber}</span>
                </div>
              )}
            </div>
          )}

          {/* Seletores de período */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mês</Label>
              <Select
                value={month.toString()}
                onValueChange={(v) => setMonth(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ano</Label>
              <Select
                value={year.toString()}
                onValueChange={(v) => setYear(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Formato de exportação */}
          <div className="space-y-3">
            <Label>Formato de exportação</Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={(v) => setExportFormat(v as ExportFormat)}
              className="space-y-2"
            >
              <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="carne-leao" id="carne-leao" className="mt-0.5" />
                <div className="flex-1">
                  <label htmlFor="carne-leao" className="text-sm font-medium cursor-pointer">
                    Carnê Leão Web (Receita Federal)
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Layout oficial para importação direta no sistema da RF
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="interno" id="interno" className="mt-0.5" />
                <div className="flex-1">
                  <label htmlFor="interno" className="text-sm font-medium cursor-pointer">
                    Formato Interno
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Para controle e análise do escritório
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Alertas de validação */}
          {exportFormat === "carne-leao" && !validacaoCarneLeao.valido && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-4 text-sm space-y-1">
                  {validacaoCarneLeao.erros.map((erro, i) => (
                    <li key={i}>{erro}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {!validacaoLimite.valido && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{validacaoLimite.mensagem}</AlertDescription>
            </Alert>
          )}

          {/* Checkboxes de tipo */}
          <div className="space-y-3">
            <Label>O que exportar?</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-charges"
                checked={exportCharges}
                onCheckedChange={(checked) => setExportCharges(!!checked)}
              />
              <label
                htmlFor="export-charges"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {exportFormat === "carne-leao" ? "Rendimentos (Receita Saúde)" : "Receitas"}
                {isReady && (
                  <span className="ml-1 text-muted-foreground">
                    ({chargesCount} registro{chargesCount !== 1 ? "s" : ""})
                  </span>
                )}
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-expenses"
                checked={exportExpenses}
                onCheckedChange={(checked) => setExportExpenses(!!checked)}
              />
              <label
                htmlFor="export-expenses"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {exportFormat === "carne-leao" ? "Pagamentos Dedutíveis (P10)" : "Despesas"}
                {isReady && (
                  <span className="ml-1 text-muted-foreground">
                    ({expensesCount} registro{expensesCount !== 1 ? "s" : ""})
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* Preview de quantidade */}
          {isLoading && (
            <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando dados...
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={!canExport}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
