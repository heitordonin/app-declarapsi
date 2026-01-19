import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Loader2, CheckCircle2, AlertTriangle, XCircle, FileQuestion } from 'lucide-react';

interface OcrStatusBadgeProps {
  status: string | null;
  error?: string | null;
  documentType?: string | null;
}

const statusConfig: Record<string, { 
  label: string; 
  icon: typeof Clock; 
  className: string;
  iconAnimate?: string;
  badgeAnimate?: string;
}> = {
  pending: { 
    label: 'Aguardando OCR', 
    icon: Clock, 
    className: 'bg-gray-100 text-gray-700 border-gray-300' 
  },
  processing: { 
    label: 'Lendo documento...', 
    icon: Loader2, 
    className: 'bg-blue-100 text-blue-700 border-blue-300 animate-pulse',
    iconAnimate: 'animate-spin',
  },
  success: { 
    label: 'Lido com sucesso', 
    icon: CheckCircle2, 
    className: 'bg-green-100 text-green-700 border-green-300' 
  },
  needs_review: { 
    label: 'Revisar', 
    icon: AlertTriangle, 
    className: 'bg-yellow-100 text-yellow-700 border-yellow-300' 
  },
  error: { 
    label: 'Erro no OCR', 
    icon: XCircle, 
    className: 'bg-red-100 text-red-700 border-red-300' 
  },
};

const documentTypeLabels: Record<string, string> = {
  darf: 'DARF',
  gps: 'GPS (INSS)',
  unknown: 'Desconhecido',
};

export function OcrStatusBadge({ status, error, documentType }: OcrStatusBadgeProps) {
  // Default to pending if no status
  const effectiveStatus = status || 'pending';
  const config = statusConfig[effectiveStatus];
  const Icon = config.icon;

  const tooltipContent = (
    <div className="space-y-1">
      {documentType && documentType !== 'unknown' && (
        <p className="font-medium">Tipo: {documentTypeLabels[documentType] || documentType}</p>
      )}
      {error && <p className="text-sm">{error}</p>}
      {!error && effectiveStatus === 'success' && (
        <p className="text-sm">Documento lido e dados extraídos com sucesso.</p>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${config.className} cursor-help`}>
            <Icon className={`h-3 w-3 mr-1 ${config.iconAnimate || ''}`} />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function DocumentTypeBadge({ type }: { type: string | null }) {
  if (!type || type === 'unknown') {
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
        <FileQuestion className="h-3 w-3 mr-1" />
        Não identificado
      </Badge>
    );
  }

  const label = documentTypeLabels[type] || type;
  const className = type === 'darf' 
    ? 'bg-purple-50 text-purple-700 border-purple-200'
    : 'bg-cyan-50 text-cyan-700 border-cyan-200';

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
