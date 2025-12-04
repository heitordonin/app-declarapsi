import { DocumentsTable } from './DocumentsTable';
import { DocumentCard } from './DocumentCard';
import type { Document } from '@/hooks/cliente/useDocumentsData';

interface DocumentsListProps {
  documents: Document[];
}

export function DocumentsList({ documents }: DocumentsListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum documento encontrado
      </div>
    );
  }

  return (
    <>
      {/* Desktop: Table */}
      <div className="hidden md:block">
        <DocumentsTable documents={documents} />
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {documents.map((document) => (
          <DocumentCard key={document.id} document={document} />
        ))}
      </div>
    </>
  );
}
