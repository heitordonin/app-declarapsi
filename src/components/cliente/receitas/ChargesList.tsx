import { TrendingUp } from 'lucide-react';
import { ChargesTable } from './ChargesTable';
import { ChargeCard } from './ChargeCard';
import { EmptyState } from '../EmptyState';
import type { Charge } from '@/hooks/cliente/useChargesData';

interface ChargesListProps {
  charges: Charge[];
  onMarkAsPaid: (charge: Charge) => void;
  onMarkAsUnpaid: (chargeId: string) => void;
  onEdit: (charge: Charge) => void;
  onDelete: (chargeId: string) => Promise<void>;
}

export function ChargesList({ charges, onMarkAsPaid, onMarkAsUnpaid, onEdit, onDelete }: ChargesListProps) {
  if (charges.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Nenhuma cobrança"
        description="Registre sua primeira cobrança clicando no botão acima."
      />
    );
  }

  return (
    <>
      {/* Desktop: Table */}
      <div className="hidden md:block">
        <ChargesTable 
          charges={charges}
          onMarkAsPaid={onMarkAsPaid}
          onMarkAsUnpaid={onMarkAsUnpaid}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {charges.map((charge) => (
          <ChargeCard 
            key={charge.id} 
            charge={charge}
            onMarkAsPaid={onMarkAsPaid}
            onMarkAsUnpaid={onMarkAsUnpaid}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </>
  );
}
