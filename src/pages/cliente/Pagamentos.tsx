import { useState, useMemo } from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MonthSelector } from '@/components/cliente/pagamentos/MonthSelector';
import { PaymentCard } from '@/components/cliente/pagamentos/PaymentCard';
import { usePaymentsData } from '@/hooks/cliente/usePaymentsData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function Pagamentos() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(format(new Date(), 'yyyy-MM'));

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

  const { payments, isLoading, downloadDocument } = usePaymentsData(client?.id);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      // Filter by month (using competence)
      if (selectedMonth && payment.competence !== selectedMonth) {
        return false;
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

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header with filter icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">A pagar</h1>
          {newPaymentsCount > 0 && (
            <span className="bg-accent text-accent-foreground text-xs font-medium px-2 py-0.5 rounded-full">
              {newPaymentsCount} {newPaymentsCount === 1 ? 'novo' : 'novos'}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon">
          <Filter className="h-5 w-5" />
        </Button>
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
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
