import { MoreHorizontal, Eye, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Document } from '@/hooks/cliente/useDocumentsData';

interface DocumentActionsMenuProps {
  document: Document;
  onDownload: (document: Document) => Promise<boolean>;
}

export function DocumentActionsMenu({ document, onDownload }: DocumentActionsMenuProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    const success = await onDownload(document);
    setIsDownloading(false);
    
    if (!success) {
      toast.error('Erro ao baixar documento');
    }
  };

  const handleView = async () => {
    // For view, we download and open in new tab
    setIsDownloading(true);
    const success = await onDownload(document);
    setIsDownloading(false);
    
    if (!success) {
      toast.error('Erro ao visualizar documento');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        <DropdownMenuItem onClick={handleView} disabled={isDownloading}>
          <Eye className="h-4 w-4 mr-2" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownload} disabled={isDownloading}>
          <Download className="h-4 w-4 mr-2" />
          Baixar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
