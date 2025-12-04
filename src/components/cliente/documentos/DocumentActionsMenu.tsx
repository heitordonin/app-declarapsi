import { MoreHorizontal, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DocumentActionsMenuProps {
  documentId: string;
}

export function DocumentActionsMenu({ documentId }: DocumentActionsMenuProps) {
  const handleView = () => {
    console.log('Visualizar documento:', documentId);
  };

  const handleDownload = () => {
    console.log('Baixar documento:', documentId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        <DropdownMenuItem onClick={handleView}>
          <Eye className="h-4 w-4 mr-2" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Baixar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
