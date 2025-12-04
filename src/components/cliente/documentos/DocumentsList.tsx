import { FileText } from 'lucide-react';
import { DocumentsTable } from './DocumentsTable';
import { DocumentCard } from './DocumentCard';
import { EmptyState } from '../EmptyState';
import type { Document } from '@/hooks/cliente/useDocumentsData';

interface DocumentsListProps {
  documents: Document[];
}

export function DocumentsList({ documents }: DocumentsListProps) {
  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nenhum documento"
        description="Você ainda não possui documentos permanentes."
      />
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
