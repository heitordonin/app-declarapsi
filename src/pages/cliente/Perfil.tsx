import { User } from 'lucide-react';
import { EmptyState } from '@/components/cliente/EmptyState';

export default function Perfil() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
      <EmptyState
        icon={User}
        title="Em construção"
        description="Esta página está sendo desenvolvida."
      />
    </div>
  );
}
