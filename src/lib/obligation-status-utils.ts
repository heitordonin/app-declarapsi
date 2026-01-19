import { CheckCircle2, Clock, AlertTriangle, XCircle, AlertCircle } from 'lucide-react';

export type ObligationStatus = 'pending' | 'due_48h' | 'on_time_done' | 'overdue' | 'late_done';

export const STATUS_CONFIG = {
  overdue: {
    bg: 'bg-red-100',
    border: 'border-red-500',
    text: 'text-red-700',
    badge: 'bg-red-500',
    chart: '#ef4444',
    label: 'Vencida',
    icon: XCircle,
  },
  due_48h: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-500',
    text: 'text-yellow-700',
    badge: 'bg-yellow-500',
    chart: '#eab308',
    label: 'Vencendo em 48h',
    icon: AlertTriangle,
  },
  pending: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-700',
    badge: 'bg-gray-400',
    chart: '#9ca3af',
    label: 'Dentro do Prazo',
    icon: Clock,
  },
  on_time_done: {
    bg: 'bg-green-100',
    border: 'border-green-500',
    text: 'text-green-700',
    badge: 'bg-green-500',
    chart: '#22c55e',
    label: 'Concluída no Prazo',
    icon: CheckCircle2,
  },
  late_done: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-600',
    badge: 'bg-red-300',
    chart: '#fca5a5',
    label: 'Concluída Fora do Prazo',
    icon: AlertCircle,
  },
} as const;

export function getStatusColor(status: ObligationStatus) {
  return STATUS_CONFIG[status]?.chart || STATUS_CONFIG.pending.chart;
}

export function getStatusLabel(status: ObligationStatus) {
  return STATUS_CONFIG[status]?.label || 'Desconhecido';
}

export function getStatusIcon(status: ObligationStatus) {
  return STATUS_CONFIG[status]?.icon || Clock;
}

export function getStatusStyles(status: ObligationStatus) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
}

/**
 * Calcula o status efetivo baseado na data atual e no prazo interno.
 * Usado para garantir que o frontend mostre o status correto em tempo real,
 * independente do status armazenado no banco (que depende de cron job).
 */
export function getEffectiveStatus(
  dbStatus: ObligationStatus,
  internalTargetAt: string | Date
): ObligationStatus {
  // Se já está concluído, manter o status
  if (dbStatus === 'on_time_done' || dbStatus === 'late_done') {
    return dbStatus;
  }

  const now = new Date();
  const targetDate = new Date(internalTargetAt);
  
  // Comparar apenas as datas (ignorando horário)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  
  // Se prazo interno já passou → overdue
  if (target < today) {
    return 'overdue';
  }

  // Calcular diferença em horas para verificar 48h
  const diffMs = targetDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // Se falta 48h ou menos → due_48h
  if (diffHours <= 48 && diffHours >= 0) {
    return 'due_48h';
  }

  // Caso contrário, manter pending
  return 'pending';
}
