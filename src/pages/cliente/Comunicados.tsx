import { useState, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CommunicationsList } from '@/components/cliente/comunicados/CommunicationsList';
import { ViewCommunicationDialog } from '@/components/cliente/comunicados/ViewCommunicationDialog';
import { useCommunicationsData, type Communication } from '@/hooks/cliente/useCommunicationsData';

export default function Comunicados() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);
  const { communications, isLoading, markAsViewed } = useCommunicationsData();

  const filteredCommunications = useMemo(() => {
    if (!searchQuery) return communications;

    const query = searchQuery.toLowerCase();
    return communications.filter((comm) =>
      comm.subject.toLowerCase().includes(query)
    );
  }, [communications, searchQuery]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <h1 className="text-2xl font-bold text-foreground">Comunicados</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar comunicado..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        /* Communications List */
        <CommunicationsList 
          communications={filteredCommunications}
          onSelect={setSelectedCommunication}
        />
      )}

      {/* View Dialog */}
      <ViewCommunicationDialog
        communication={selectedCommunication}
        open={!!selectedCommunication}
        onOpenChange={(open) => !open && setSelectedCommunication(null)}
        onMarkAsViewed={markAsViewed}
      />
    </div>
  );
}
