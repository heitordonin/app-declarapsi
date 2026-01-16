import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Mail, MailOpen, Paperclip } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Communication } from '@/hooks/cliente/useCommunicationsData';
import { cn } from '@/lib/utils';

interface CommunicationCardProps {
  communication: Communication;
  onClick: () => void;
}

export function CommunicationCard({ communication, onClick }: CommunicationCardProps) {
  const isUnread = !communication.viewedAt;
  const hasAttachments = communication.attachments && communication.attachments.length > 0;

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-colors hover:bg-muted/50',
        isUnread && 'border-l-4 border-l-primary'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'p-2 rounded-full',
            isUnread ? 'bg-primary/10' : 'bg-muted'
          )}>
            {isUnread ? (
              <Mail className="h-4 w-4 text-primary" />
            ) : (
              <MailOpen className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className={cn(
                'text-sm truncate',
                isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground'
              )}>
                {communication.subject}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                {hasAttachments && (
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                )}
                {isUnread && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(communication.sentAt), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
