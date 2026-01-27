import { Gift } from 'lucide-react';
import { EmptyState } from '@/components/cliente/EmptyState';

export default function IndiqueAmigo() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Indique um Amigo</h1>
      <EmptyState
        icon={Gift}
        title="Em construção"
        description="Esta página está sendo desenvolvida."
      />
    </div>
  );
}
