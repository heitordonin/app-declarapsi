import { Clock, CheckCircle2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PendingCharge, ReceivedCharge } from '@/hooks/cliente/usePatientsData';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientChargesProps {
  charges: PendingCharge[] | ReceivedCharge[];
  type: 'pending' | 'received';
  onAddNew?: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
}

export function PatientCharges({ charges, type, onAddNew }: PatientChargesProps) {
  const isPending = type === 'pending';
  const Icon = isPending ? Clock : CheckCircle2;
  const title = isPending ? 'Cobranças a Receber' : 'Cobranças Recebidas';
  const dateLabel = isPending ? 'Vencimento' : 'Pagamento';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${isPending ? 'text-amber-500' : 'text-green-500'}`} />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          {isPending && onAddNew && (
            <Button variant="ghost" size="sm" className="text-primary" onClick={onAddNew}>
              <Plus className="h-4 w-4 mr-1" />
              Gerar nova cobrança
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {charges.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma cobrança {isPending ? 'pendente' : 'recebida'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>{dateLabel}</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {charges.map((charge) => (
                <TableRow key={charge.id}>
                  <TableCell>{charge.description}</TableCell>
                  <TableCell>
                    {formatDate(
                      'dueDate' in charge ? charge.dueDate : charge.paymentDate
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(charge.value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
