import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { DocumentActionsMenu } from './DocumentActionsMenu';
import type { Document } from '@/hooks/cliente/useDocumentsData';

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium text-foreground">{document.name}</p>
            <p className="text-xs text-muted-foreground">
              Enviado em {format(new Date(document.createdAt), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>
        <DocumentActionsMenu documentId={document.id} />
      </CardContent>
    </Card>
  );
}
