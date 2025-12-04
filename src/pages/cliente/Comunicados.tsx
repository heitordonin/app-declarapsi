import { MessageSquare } from 'lucide-react';
import { EmptyState } from '@/components/cliente/EmptyState';

export default function Comunicados() {
  // TODO: Replace with real data from useQuery
  const comunicados: unknown[] = [];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Comunicados</h1>

      {comunicados.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Nenhum comunicado"
          description="Você ainda não recebeu nenhum comunicado."
        />
      ) : (
        <div>{/* Lista de comunicados será implementada aqui */}</div>
      )}
    </div>
  );
}
