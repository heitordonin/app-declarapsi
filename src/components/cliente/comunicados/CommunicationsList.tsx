import { MessageSquare } from 'lucide-react';
import { CommunicationsTable } from './CommunicationsTable';
import { CommunicationCard } from './CommunicationCard';
import { EmptyState } from '../EmptyState';
import type { Communication } from '@/hooks/cliente/useCommunicationsData';

interface CommunicationsListProps {
  communications: Communication[];
  onSelect: (communication: Communication) => void;
}

export function CommunicationsList({ communications, onSelect }: CommunicationsListProps) {
  if (communications.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Nenhum comunicado"
        description="Você ainda não recebeu nenhum comunicado."
      />
    );
  }

  return (
    <>
      {/* Desktop: Table */}
      <div className="hidden md:block">
        <CommunicationsTable communications={communications} onSelect={onSelect} />
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {communications.map((communication) => (
          <CommunicationCard 
            key={communication.id} 
            communication={communication}
            onClick={() => onSelect(communication)}
          />
        ))}
      </div>
    </>
  );
}
