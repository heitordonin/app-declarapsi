import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ClientMonthlyStats } from '@/hooks/contador/useClientMonthlyStats';
import type { ClientMonthlyStatus } from '@/hooks/contador/useClientMonthlyStatus';

interface ClientDetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientMonthlyStats | null;
  status: ClientMonthlyStatus | null;
  onMarkExported: (clientId: string, type: 'charges' | 'expenses') => void;
  onUnmarkExported: (clientId: string, type: 'charges' | 'expenses') => void;
  onExportCSV: (clientId: string) => void;
  isMarking?: boolean;
  selectedMonth: string;
}

export function ClientDetailPanel({
  open,
  onOpenChange,
  client,
  status,
  onMarkExported,
  onUnmarkExported,
  onExportCSV,
  isMarking,
  selectedMonth,
}: ClientDetailPanelProps) {
  const isMobile = useIsMobile();

  if (!client) return null;

  const chargesExported = !!status?.charges_exported_at;
  const expensesExported = !!status?.expenses_exported_at;

  const content = (
    <div className="space-y-6 p-4 md:p-0">
      {/* Resumo Financeiro */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Faturamento</span>
            <span className="font-medium text-green-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.totalRevenue)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Despesas</span>
            <span className="font-medium text-red-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.totalExpenses)}
            </span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="text-muted-foreground">Lucro Líquido</span>
            <span className={`font-bold ${client.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.netProfit)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Alíquota Efetiva</span>
            <span className="font-medium">
              {client.effectiveRate > 0 ? `${client.effectiveRate.toFixed(1)}%` : 'Isento'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lançamentos no Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{client.chargesCount}</p>
              <p className="text-sm text-muted-foreground">Receitas</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{client.expensesCount}</p>
              <p className="text-sm text-muted-foreground">Despesas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist de Exportação */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Exportação para Carnê Leão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={chargesExported ? 'default' : 'outline'} className={chargesExported ? 'bg-green-600' : ''}>
                {chargesExported ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </Badge>
              <span>Receitas</span>
            </div>
            <Button
              variant={chargesExported ? 'outline' : 'default'}
              size="sm"
              disabled={isMarking}
              onClick={() => 
                chargesExported 
                  ? onUnmarkExported(client.clientId, 'charges')
                  : onMarkExported(client.clientId, 'charges')
              }
            >
              {chargesExported ? 'Desmarcar' : 'Marcar exportado'}
            </Button>
          </div>
          {chargesExported && status?.charges_exported_at && (
            <p className="text-xs text-muted-foreground pl-7">
              Exportado em {format(new Date(status.charges_exported_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={expensesExported ? 'default' : 'outline'} className={expensesExported ? 'bg-green-600' : ''}>
                {expensesExported ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </Badge>
              <span>Despesas</span>
            </div>
            <Button
              variant={expensesExported ? 'outline' : 'default'}
              size="sm"
              disabled={isMarking}
              onClick={() => 
                expensesExported 
                  ? onUnmarkExported(client.clientId, 'expenses')
                  : onMarkExported(client.clientId, 'expenses')
              }
            >
              {expensesExported ? 'Desmarcar' : 'Marcar exportado'}
            </Button>
          </div>
          {expensesExported && status?.expenses_exported_at && (
            <p className="text-xs text-muted-foreground pl-7">
              Exportado em {format(new Date(status.expenses_exported_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <div className="space-y-2">
        <Button className="w-full" variant="outline" onClick={() => onExportCSV(client.clientId)}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>
              <div>
                <p>{client.clientName}</p>
                <p className="text-sm font-normal text-muted-foreground">{client.clientCode} • {selectedMonth}</p>
              </div>
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto pb-8">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            <div>
              <p>{client.clientName}</p>
              <p className="text-sm font-normal text-muted-foreground">{client.clientCode} • {selectedMonth}</p>
            </div>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          {content}
        </div>
      </SheetContent>
    </Sheet>
  );
}
