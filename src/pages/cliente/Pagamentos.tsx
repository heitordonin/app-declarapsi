import { useState, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MonthSelector } from '@/components/cliente/pagamentos/MonthSelector';
import { PaymentCard } from '@/components/cliente/pagamentos/PaymentCard';
import { MarkPaymentAsPaidDialog } from '@/components/cliente/pagamentos/MarkPaymentAsPaidDialog';
import { usePaymentsData, type Payment } from '@/hooks/cliente/usePaymentsData';
import { useExpensesData } from '@/hooks/cliente/useExpensesData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

// ID da categoria "DARF Carnê-Leão"
const DARF_CATEGORY_ID = '5bdb11af-bb34-4eda-a864-c2a400f0e7a9';

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

  const { payments, isLoading, downloadDocument, markAsPaid } = usePaymentsData(client?.id);
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

  const handleConfirmPayment = async (paymentDate: Date, registerAsExpense: boolean) => {
    if (!selectedPayment) return;
    
    setIsProcessing(true);
    try {
      // Mark document as paid
      await markAsPaid({ documentId: selectedPayment.id, paidAt: paymentDate });

      // Create expense if requested
      if (registerAsExpense && selectedPayment.value) {
        // Extract competency from document's competence field (format: "yyyy-MM")
        const [competencyYear, competencyMonth] = selectedPayment.competence.split('-').map(Number);
        
        await createExpense.mutateAsync({
          categoryId: DARF_CATEGORY_ID,
          value: selectedPayment.value.toString(),
          paymentDate: format(paymentDate, 'yyyy-MM-dd'),
          isResidentialExpense: false,
          competencyMonth,
          competencyYear,
          description: selectedPayment.title,
        });
      }

      toast.success(
        registerAsExpense 
          ? 'Pagamento confirmado e despesa registrada!' 
          : 'Pagamento confirmado!'
      );
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
    <div className="p-4 md:p-6 space-y-4">
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
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar pagamentos"
          className="pr-10"
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
        <div className="space-y-3">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum pagamento encontrado
            </div>
          ) : (
            filteredPayments.map((payment) => (
              <PaymentCard 
                key={payment.id} 
                payment={payment}
                onDownload={downloadDocument}
                onMarkAsPaid={handleOpenMarkAsPaidDialog}
              />
            ))
          )}
        </div>
      )}

      {/* Mark as Paid Dialog */}
      <MarkPaymentAsPaidDialog
        payment={selectedPayment}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmPayment}
        isLoading={isProcessing}
      />
    </div>
  );
}
