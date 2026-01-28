import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";
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

interface Props {
  client?: Client;
  clientId?: string;
  clientName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

// Colunas para CSV de receitas
const chargeColumns: CsvColumn<ChargeExportData>[] = [
  { header: "data_pagamento", render: (item) => formatDateBR(item.paymentDate) },
  { header: "cpf_paciente", render: (item) => cleanCpf(item.patientCpf) },
  { header: "cpf_pagador", render: (item) => cleanCpf(item.payerCpf) },
  { header: "nome_paciente", render: (item) => item.patientName },
  { header: "descricao", render: (item) => item.description },
  { header: "valor", render: (item) => formatNumberCSV(item.amount) },
  { header: "quantidade_sessoes", render: (item) => item.sessionsCount },
];

// Colunas para CSV de despesas
const expenseColumns: CsvColumn<ExpenseExportData>[] = [
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
  const [isExporting, setIsExporting] = useState(false);

  // Suporta tanto client object quanto clientId/clientName separados
  const resolvedClientId = client?.id || clientId;
  const resolvedClientName = client?.name || clientName || '';
  const resolvedClientCode = client?.code || '';

  const { data, isLoading, refetch } = useClientExport(
    open && resolvedClientId ? { clientId: resolvedClientId, month, year } : null
  );

  const yearOptions = getYearOptions();
  const selectedMonthLabel = MONTHS.find((m) => m.value === month)?.label || "";

  const handleExport = async () => {
    if (!exportCharges && !exportExpenses) {
      toast({
        title: "Selecione ao menos um tipo",
        description: "Escolha exportar receitas e/ou despesas.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      // Refetch para garantir dados atualizados
      const result = await refetch();
      const exportData = result.data;

      if (!exportData) {
        throw new Error("Não foi possível carregar os dados");
      }

      const clientCode = resolvedClientCode || "cliente";
      const periodLabel = `${selectedMonthLabel.toLowerCase()}_${year}`;

      let filesExported = 0;

      // Exportar receitas
      if (exportCharges) {
        const csvContent = generateCsv(exportData.charges, chargeColumns);
        const filename = `receitas_${clientCode}_${periodLabel}.csv`;
        downloadCsv(csvContent, filename);
        filesExported++;
      }

      // Exportar despesas
      if (exportExpenses) {
        const csvContent = generateCsv(exportData.expenses, expenseColumns);
        const filename = `despesas_${clientCode}_${periodLabel}.csv`;
        downloadCsv(csvContent, filename);
        filesExported++;
      }

      const chargesCount = exportCharges ? exportData.charges.length : 0;
      const expensesCount = exportExpenses ? exportData.expenses.length : 0;

      toast({
        title: "Exportação concluída",
        description: `${filesExported} arquivo(s) gerado(s): ${chargesCount} receita(s), ${expensesCount} despesa(s).`,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Dados</DialogTitle>
          <DialogDescription>
            Exporte receitas e despesas de <strong>{resolvedClientName}</strong> para CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
                Receitas
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
                Despesas
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
            disabled={isExporting || isLoading || (!exportCharges && !exportExpenses)}
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
