import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { STATUS_CONFIG, ObligationStatus } from '@/lib/obligation-status-utils';

interface Instance {
  id: string;
  competence: string;
  due_at: string;
  internal_target_at: string;
  status: string;
  client: {
    name: string;
  };
  obligation: {
    name: string;
  };
}

interface InstancesTableProps {
  data: Instance[];
}

export function InstancesTable({ data }: InstancesTableProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento das Instâncias</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhuma instância encontrada para este período
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhamento das Instâncias ({data.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Obrigação</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Prazo Interno</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((instance) => {
                const statusInfo = STATUS_CONFIG[instance.status as ObligationStatus] || {
                  label: instance.status,
                  badge: 'bg-muted text-muted-foreground',
                };
                
                return (
                  <TableRow key={instance.id}>
                    <TableCell className="font-medium">{instance.client.name}</TableCell>
                    <TableCell>{instance.obligation.name}</TableCell>
                    <TableCell>{instance.competence}</TableCell>
                    <TableCell>
                      {format(parseISO(instance.internal_target_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(instance.due_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusInfo.badge}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
