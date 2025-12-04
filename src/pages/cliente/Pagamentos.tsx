import { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MonthSelector } from '@/components/cliente/pagamentos/MonthSelector';
import { PaymentCard } from '@/components/cliente/pagamentos/PaymentCard';
import { usePaymentsData } from '@/hooks/cliente/usePaymentsData';
import { format } from 'date-fns';

export default function Pagamentos() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(format(new Date(), 'yyyy-MM'));
  const { payments } = usePaymentsData();

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      // Filter by month
      if (selectedMonth) {
        const paymentMonth = format(new Date(payment.dueDate), 'yyyy-MM');
        if (paymentMonth !== selectedMonth) return false;
      }

      // Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          payment.title.toLowerCase().includes(query) ||
          payment.value.toString().includes(query)
        );
      }

      return true;
    });
  }, [payments, selectedMonth, searchQuery]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header with filter icon */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">A pagar</h1>
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

      {/* Payments List */}
      <div className="space-y-3">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum pagamento encontrado
          </div>
        ) : (
          filteredPayments.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))
        )}
      </div>
    </div>
  );
}
