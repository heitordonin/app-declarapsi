import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ClientExportData, ChargeExportData, ExpenseExportData, ClientData } from "./useClientExport";

export interface BatchExportFilters {
  clientIds: string[];
  month: number;
  year: number;
}

export interface BatchExportResult {
  clientId: string;
  clientName: string;
  data: ClientExportData;
  hasErrors: boolean;
  errorMessage?: string;
}

async function fetchClientExportData(
  clientId: string,
  clientName: string,
  month: number,
  year: number
): Promise<BatchExportResult> {
  try {
    // Busca dados do cliente (CPF, CRP)
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("cpf, crp_number, code")
      .eq("id", clientId)
      .single();

    if (clientError) throw clientError;

    // Calcula o range de datas para o mês selecionado
    const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, "0")}-${lastDay}`;

    // Busca receitas (charges) pagas no período
    const { data: chargesData, error: chargesError } = await supabase
      .from("charges")
      .select(`
        payment_date,
        patient_cpf,
        payer_cpf,
        description,
        amount,
        sessions_count,
        patients!inner(name)
      `)
      .eq("client_id", clientId)
      .eq("status", "paid")
      .gte("payment_date", startDate)
      .lte("payment_date", endDate)
      .order("payment_date", { ascending: true });

    if (chargesError) throw chargesError;

    // Busca despesas pagas no período
    const { data: expensesData, error: expensesError } = await supabase
      .from("expenses")
      .select(`
        payment_date,
        amount,
        deductible_amount,
        is_residential_expense,
        description,
        expense_categories!inner(code, name)
      `)
      .eq("client_id", clientId)
      .gte("payment_date", startDate)
      .lte("payment_date", endDate)
      .order("payment_date", { ascending: true });

    if (expensesError) throw expensesError;

    // Transforma dados de charges
    const charges: ChargeExportData[] = (chargesData || []).map((charge) => ({
      paymentDate: charge.payment_date || "",
      patientCpf: charge.patient_cpf || "",
      payerCpf: charge.payer_cpf || "",
      patientName: (charge.patients as { name: string })?.name || "",
      description: charge.description || "",
      amount: Number(charge.amount) || 0,
      sessionsCount: charge.sessions_count || 1,
    }));

    // Transforma dados de expenses
    const expenses: ExpenseExportData[] = (expensesData || []).map((expense) => ({
      paymentDate: expense.payment_date || "",
      categoryCode: (expense.expense_categories as { code: string; name: string })?.code || "",
      categoryName: (expense.expense_categories as { code: string; name: string })?.name || "",
      originalAmount: Number(expense.amount) || 0,
      deductibleAmount: Number(expense.deductible_amount) || 0,
      isResidential: expense.is_residential_expense || false,
      description: expense.description,
    }));

    const client: ClientData = {
      cpf: clientData.cpf || '',
      crpNumber: clientData.crp_number || null,
      code: clientData.code || '',
    };

    return {
      clientId,
      clientName,
      data: { charges, expenses, client },
      hasErrors: false,
    };
  } catch (error) {
    return {
      clientId,
      clientName,
      data: { charges: [], expenses: [], client: { cpf: '', crpNumber: null, code: '' } },
      hasErrors: true,
      errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

export function useBatchExport(filters: BatchExportFilters | null, clientNames: Map<string, string>) {
  return useQuery({
    queryKey: ['batch-export', filters?.clientIds, filters?.month, filters?.year],
    queryFn: async (): Promise<BatchExportResult[]> => {
      if (!filters || filters.clientIds.length === 0) {
        return [];
      }

      // Busca dados de todos os clientes em paralelo
      const promises = filters.clientIds.map(clientId => 
        fetchClientExportData(
          clientId, 
          clientNames.get(clientId) || 'Cliente', 
          filters.month, 
          filters.year
        )
      );

      return Promise.all(promises);
    },
    enabled: !!filters && filters.clientIds.length > 0,
  });
}
