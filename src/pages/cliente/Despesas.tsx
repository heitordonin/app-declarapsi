import { TrendingDown } from 'lucide-react';

export default function Despesas() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <TrendingDown className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold text-foreground mb-2">Despesas</h1>
      <p className="text-muted-foreground text-center">
        Esta página está sendo desenvolvida.
      </p>
    </div>
  );
}
