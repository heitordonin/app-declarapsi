import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, CheckCircle2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChargeStatusBadge } from './ChargeStatusBadge';
import { ChargeActionsMenu } from './ChargeActionsMenu';
import type { Charge } from '@/hooks/cliente/useChargesData';
import { cn } from '@/lib/utils';

interface ChargesTableProps {
  charges: Charge[];
}

export function ChargesTable({ charges }: ChargesTableProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (dateStr: string) =>
    format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PACIENTE</TableHead>
            <TableHead>DESCRIÇÃO</TableHead>
            <TableHead>STATUS</TableHead>
            <TableHead className="text-right">VALOR</TableHead>
            <TableHead>VENCIMENTO</TableHead>
            <TableHead>PAGAMENTO</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {charges.map((charge) => (
            <TableRow key={charge.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{charge.patientName}</span>
                </div>
              </TableCell>
              <TableCell>{charge.description}</TableCell>
              <TableCell>
                <ChargeStatusBadge status={charge.status} />
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(charge.value)}
              </TableCell>
              <TableCell
                className={cn(charge.status === 'overdue' && 'text-red-500')}
              >
                {formatDate(charge.dueDate)}
              </TableCell>
              <TableCell>
                {charge.paymentDate ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {formatDate(charge.paymentDate)}
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <ChargeActionsMenu chargeId={charge.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
