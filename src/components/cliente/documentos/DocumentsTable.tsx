import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DocumentActionsMenu } from './DocumentActionsMenu';
import type { Document } from '@/hooks/cliente/useDocumentsData';

interface DocumentsTableProps {
  documents: Document[];
}

export function DocumentsTable({ documents }: DocumentsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>DOCUMENTO</TableHead>
          <TableHead>ENVIADO EM</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((document) => (
          <TableRow key={document.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium">{document.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {format(new Date(document.createdAt), 'dd/MM/yyyy')}
            </TableCell>
            <TableCell>
              <DocumentActionsMenu documentId={document.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
