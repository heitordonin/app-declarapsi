import { CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChargeStatus } from '@/hooks/cliente/useChargesData';

interface ChargeStatusBadgeProps {
  status: ChargeStatus;
}

const statusConfig = {
  paid: {
    label: 'Pago',
    className: 'bg-green-100 text-green-700',
    Icon: CheckCircle2,
  },
  overdue: {
    label: 'Vencida',
    className: 'bg-red-100 text-red-600',
    Icon: Clock,
  },
  pending: {
    label: 'Pendente',
    className: 'bg-yellow-100 text-yellow-700',
    Icon: Clock,
  },
};

export function ChargeStatusBadge({ status }: ChargeStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.Icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        config.className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
