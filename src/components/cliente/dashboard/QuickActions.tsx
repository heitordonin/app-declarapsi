import { UserPlus, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Novo Paciente',
      icon: UserPlus,
      onClick: () => navigate('/cliente/pacientes'),
      variant: 'default' as const,
    },
    {
      label: 'Nova Receita',
      icon: TrendingUp,
      onClick: () => navigate('/cliente/receitas'),
      variant: 'outline' as const,
    },
    {
      label: 'Nova Despesa',
      icon: TrendingDown,
      onClick: () => navigate('/cliente/despesas'),
      variant: 'outline' as const,
    },
    {
      label: 'Contas a Pagar',
      icon: FileText,
      onClick: () => navigate('/cliente/pagamentos'),
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              onClick={action.onClick}
              className="h-auto py-3 flex flex-col gap-2"
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
