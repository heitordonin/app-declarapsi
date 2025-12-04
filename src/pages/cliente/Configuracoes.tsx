import { Settings } from 'lucide-react';
import { EmptyState } from '@/components/cliente/EmptyState';

export default function Configuracoes() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
      <EmptyState
        icon={Settings}
        title="Em construção"
        description="Esta página está sendo desenvolvida."
      />
    </div>
  );
}
