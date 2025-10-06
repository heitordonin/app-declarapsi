import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Instance {
  id: string;
  competence: string;
  due_at: string;
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

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-slate-500' },
  due_48h: { label: 'Vence em 48h', color: 'bg-yellow-500' },
  on_time_done: { label: 'Concluída no Prazo', color: 'bg-green-500' },
  overdue: { label: 'Vencida', color: 'bg-red-500' },
  late_done: { label: 'Concluída com Atraso', color: 'bg-orange-500' },
};

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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Obrigação</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((instance) => {
                const statusInfo = statusConfig[instance.status as keyof typeof statusConfig];
                return (
                  <TableRow key={instance.id}>
                    <TableCell className="font-medium">{instance.client.name}</TableCell>
                    <TableCell>{instance.obligation.name}</TableCell>
                    <TableCell>{instance.competence}</TableCell>
                    <TableCell>
                      {format(new Date(instance.due_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusInfo.color}>
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
