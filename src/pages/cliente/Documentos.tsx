import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DocumentsList } from '@/components/cliente/documentos/DocumentsList';
import { useDocumentsData } from '@/hooks/cliente/useDocumentsData';
import { Skeleton } from '@/components/ui/skeleton';

export default function Documentos() {
  const [searchQuery, setSearchQuery] = useState('');
  const { documents, isLoading, downloadDocument } = useDocumentsData();

  const filteredDocuments = useMemo(() => {
    if (!searchQuery) return documents;

    const query = searchQuery.toLowerCase();
    return documents.filter((doc) =>
      doc.name.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <h1 className="text-2xl font-bold text-foreground">Documentos Permanentes</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar documento..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Documents List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          <p>Nenhum documento permanente disponível.</p>
          <p className="text-sm mt-1">
            Seus documentos aparecerão aqui quando forem enviados.
          </p>
        </div>
      ) : (
        <DocumentsList documents={filteredDocuments} onDownload={downloadDocument} />
      )}
    </div>
  );
}
