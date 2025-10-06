import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Calendar, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ObligationStatus } from '@/lib/obligation-status-utils';

interface ObrigacaoGroupedCardProps {
  obligation_name: string;
  obligation_id: string;
  competence: string;
  due_at: string;
  total: number;
  completed: number;
  overdue_count: number;
  onClick: () => void;
}

export function ObrigacaoGroupedCard({
  obligation_name,
  competence,
  due_at,
  total,
  completed,
  overdue_count,
  onClick,
}: ObrigacaoGroupedCardProps) {
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const hasOverdue = overdue_count > 0;

  return (
    <Card 
      className="p-4 hover:shadow-lg transition-all cursor-pointer hover:border-primary/50"
      onClick={onClick}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-lg leading-tight flex items-center gap-2">
              {obligation_name}
              {hasOverdue && (
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
              )}
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {competence}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Venc: {format(new Date(due_at), 'dd/MM/yyyy', { locale: ptBR })}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="h-4 w-4" />
              {completed}/{total} clientes concluídos
            </span>
            <span className="font-semibold text-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {hasOverdue && (
          <p className="text-xs text-destructive font-medium">
            {overdue_count} {overdue_count === 1 ? 'cliente atrasado' : 'clientes atrasados'}
          </p>
        )}

        <div className="text-right">
          <span className="text-xs text-primary hover:underline">
            Ver detalhes →
          </span>
        </div>
      </div>
    </Card>
  );
}
