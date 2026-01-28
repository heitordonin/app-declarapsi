import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExportFilters {
  clientId: string;
  month: number; // 1-12
  year: number;
}

export interface ChargeExportData {
  paymentDate: string;
  patientCpf: string;
  payerCpf: string;
  patientName: string;
  description: string;
  amount: number;
  sessionsCount: number;
}

export interface ExpenseExportData {
  paymentDate: string;
  categoryCode: string;
  categoryName: string;
  originalAmount: number;
  deductibleAmount: number;
  isResidential: boolean;
  description: string | null;
}

export interface ClientExportData {
  charges: ChargeExportData[];
  expenses: ExpenseExportData[];
}

export function useClientExport(filters: ExportFilters | null) {
  return useQuery({
    queryKey: ["client-export", filters?.clientId, filters?.month, filters?.year],
    queryFn: async (): Promise<ClientExportData> => {
      if (!filters) {
        return { charges: [], expenses: [] };
      }

      const { clientId, month, year } = filters;

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

      return { charges, expenses };
    },
    enabled: !!filters,
  });
}
