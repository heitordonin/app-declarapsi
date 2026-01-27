import { useState, useMemo } from 'react';
import { Search, Loader2, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/cliente/EmptyState';
import { MonthSelector } from '@/components/cliente/pagamentos/MonthSelector';
import { PaymentCard } from '@/components/cliente/pagamentos/PaymentCard';
import { MarkPaymentAsPaidDialog } from '@/components/cliente/pagamentos/MarkPaymentAsPaidDialog';
import { usePaymentsData, type Payment } from '@/hooks/cliente/usePaymentsData';
import { useExpensesData } from '@/hooks/cliente/useExpensesData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

// IDs das categorias de despesas fiscais
const DARF_CATEGORY_ID = '5bdb11af-bb34-4eda-a864-c2a400f0e7a9';
const INSS_CATEGORY_ID = '7993b8a5-3bbd-484e-ba43-c78bf1fe8c9b';

function getExpenseCategoryId(obligationName: string | null): string | null {
  if (!obligationName) return null;
  
  const normalizedName = obligationName.toUpperCase();
  
  if (normalizedName.includes('INSS')) {
    return INSS_CATEGORY_ID;
  }
  
  if (normalizedName.includes('DARF') || normalizedName.includes('CARNÊ') || normalizedName.includes('CARNE')) {
    return DARF_CATEGORY_ID;
  }
  
  return null;
}

function getExpenseCategoryName(obligationName: string | null): string | null {
  if (!obligationName) return null;
  
  const normalizedName = obligationName.toUpperCase();
  
  if (normalizedName.includes('INSS')) {
    return 'INSS - Previdência Social';
  }
  
  if (normalizedName.includes('DARF') || normalizedName.includes('CARNÊ') || normalizedName.includes('CARNE')) {
    return 'DARF Carnê-Leão';
  }
  
  return null;
}

export default function Pagamentos() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(format(new Date(), 'yyyy-MM'));
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get client ID
  const { data: client } = useQuery({
    queryKey: ['client-data'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();
      return data;
    },
  });

  const { payments, isLoading, downloadDocument, markAsPaid, unmarkAsPaid, isUnmarkingAsPaid } = usePaymentsData(client?.id);
  const { createExpense } = useExpensesData();

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      // Filter by month (using due date)
      if (selectedMonth) {
        const dueDateMonth = payment.dueDate
          ? format(new Date(payment.dueDate), 'yyyy-MM')
          : null;
        if (dueDateMonth !== selectedMonth) {
          return false;
        }
      }

      // Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          payment.title.toLowerCase().includes(query) ||
          payment.fileName.toLowerCase().includes(query) ||
          (payment.value?.toString().includes(query) ?? false)
        );
      }

      return true;
    });
  }, [payments, selectedMonth, searchQuery]);

  const newPaymentsCount = useMemo(() => {
    return payments.filter(p => p.isNew).length;
  }, [payments]);

  const handleOpenMarkAsPaidDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  const handleUnmarkAsPaid = async (payment: Payment) => {
    await unmarkAsPaid(payment.id);
  };

  const handleConfirmPayment = async (paymentDate: Date, registerAsExpense: boolean) => {
    if (!selectedPayment) return;
    
    setIsProcessing(true);
    try {
      // Mark document as paid
      await markAsPaid({ documentId: selectedPayment.id, paidAt: paymentDate });

      // Create expense if requested
      if (registerAsExpense && selectedPayment.value) {
        const categoryId = getExpenseCategoryId(selectedPayment.obligationName);
        
        if (!categoryId) {
          toast.warning('Pagamento confirmado, mas não foi possível identificar a categoria da despesa.');
        } else {
          // Extract competency from document's competence field (format: "yyyy-MM")
          const [competencyYear, competencyMonth] = selectedPayment.competence.split('-').map(Number);
          
          await createExpense.mutateAsync({
            categoryId: categoryId,
            value: selectedPayment.value.toString(),
            paymentDate: format(paymentDate, 'yyyy-MM-dd'),
            isResidentialExpense: false,
            competencyMonth,
            competencyYear,
            description: selectedPayment.title,
          });
          
          toast.success('Pagamento confirmado e despesa registrada!');
          setDialogOpen(false);
          setSelectedPayment(null);
          return;
        }
      }

      toast.success('Pagamento confirmado!');
      setDialogOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Erro ao confirmar pagamento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-foreground">A pagar</h1>
        {newPaymentsCount > 0 && (
          <span className="bg-accent text-accent-foreground text-xs font-medium px-2 py-0.5 rounded-full">
            {newPaymentsCount} {newPaymentsCount === 1 ? 'novo' : 'novos'}
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar pagamentos..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Month Selector */}
      <MonthSelector
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
      />

      {/* Payments count */}
      <div className="flex items-center gap-2">
        <span className="bg-muted text-muted-foreground text-sm font-medium px-2.5 py-1 rounded-full">
          {filteredPayments.length}
        </span>
        <span className="text-muted-foreground">
          {filteredPayments.length === 1 ? 'pagamento' : 'pagamentos'}
        </span>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        /* Payments List */
        filteredPayments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum pagamento encontrado"
            description={selectedMonth 
              ? "Não há pagamentos para este período." 
              : "Seus documentos a pagar aparecerão aqui."}
          />
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <PaymentCard 
                key={payment.id} 
                payment={payment}
                onDownload={downloadDocument}
                onMarkAsPaid={handleOpenMarkAsPaidDialog}
                onUnmarkAsPaid={handleUnmarkAsPaid}
                isUnmarking={isUnmarkingAsPaid}
              />
            ))}
          </div>
        )
      )}

      {/* Mark as Paid Dialog */}
      <MarkPaymentAsPaidDialog
        payment={selectedPayment}
        expenseCategoryName={getExpenseCategoryName(selectedPayment?.obligationName ?? null)}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmPayment}
        isLoading={isProcessing}
      />
    </div>
  );
}
