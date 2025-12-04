import { ChargesTable } from './ChargesTable';
import { ChargeCard } from './ChargeCard';
import type { Charge } from '@/hooks/cliente/useChargesData';

interface ChargesListProps {
  charges: Charge[];
}

export function ChargesList({ charges }: ChargesListProps) {
  if (charges.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma cobrança encontrada
      </div>
    );
  }

  return (
    <>
      {/* Desktop: Table */}
      <div className="hidden md:block">
        <ChargesTable charges={charges} />
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {charges.map((charge) => (
          <ChargeCard key={charge.id} charge={charge} />
        ))}
      </div>
    </>
  );
}
