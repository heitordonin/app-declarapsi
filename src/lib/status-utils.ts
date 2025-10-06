import { InstanceStatus } from "@/types/database";

export const STATUS_CONFIG = {
  pending: { 
    label: 'Pendente', 
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
    icon: '⏳'
  },
  due_48h: { 
    label: 'Vence em 48h', 
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
    icon: '⚠️'
  },
  on_time_done: { 
    label: 'Concluído no Prazo', 
    color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
    icon: '✅'
  },
  overdue: { 
    label: 'Vencido', 
    color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    icon: '🔴'
  },
  late_done: { 
    label: 'Concluído com Atraso', 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    icon: '✓'
  }
} as const;

export const getStatusLabel = (status: InstanceStatus) => 
  STATUS_CONFIG[status].label;

export const getStatusColor = (status: InstanceStatus) => 
  STATUS_CONFIG[status].color;

export const getStatusIcon = (status: InstanceStatus) => 
  STATUS_CONFIG[status].icon;
