import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Mail, MailOpen, Paperclip } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Communication } from '@/hooks/cliente/useCommunicationsData';
import { cn } from '@/lib/utils';

interface CommunicationsTableProps {
  communications: Communication[];
  onSelect: (communication: Communication) => void;
}

export function CommunicationsTable({ communications, onSelect }: CommunicationsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]"></TableHead>
          <TableHead>ASSUNTO</TableHead>
          <TableHead className="w-[100px]">ANEXOS</TableHead>
          <TableHead>ENVIADO EM</TableHead>
          <TableHead>STATUS</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {communications.map((communication) => {
          const isUnread = !communication.viewedAt;
          const hasAttachments = communication.attachments && communication.attachments.length > 0;
          
          return (
            <TableRow 
              key={communication.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelect(communication)}
            >
              <TableCell>
                {isUnread ? (
                  <Mail className="h-4 w-4 text-primary" />
                ) : (
                  <MailOpen className="h-4 w-4 text-muted-foreground" />
                )}
              </TableCell>
              <TableCell className={cn(isUnread && 'font-semibold')}>
                {communication.subject}
              </TableCell>
              <TableCell>
                {hasAttachments && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Paperclip className="h-4 w-4" />
                    <span className="text-xs">{communication.attachments.length}</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(communication.sentAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell>
                {isUnread ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Não lido
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Lido</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
