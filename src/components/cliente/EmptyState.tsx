import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 animate-fade-in', className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse" />
        <div className="relative bg-muted rounded-full p-4">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
      </div>
      <h3 className="mt-4 text-lg font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground text-center max-w-xs">
          {description}
        </p>
      )}
    </div>
  );
}
