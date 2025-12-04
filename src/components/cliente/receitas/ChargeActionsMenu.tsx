import { MoreVertical, CheckCircle, Mail, MessageCircle, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ChargeActionsMenuProps {
  chargeId: string;
}

export function ChargeActionsMenu({ chargeId }: ChargeActionsMenuProps) {
  const handleMarkAsPaid = () => {
    console.log('Marcar como pago:', chargeId);
  };

  const handleEmailReminder = () => {
    console.log('Lembrete email:', chargeId);
  };

  const handleWhatsAppReminder = () => {
    console.log('Lembrete WhatsApp:', chargeId);
  };

  const handleEdit = () => {
    console.log('Editar:', chargeId);
  };

  const handleDelete = () => {
    console.log('Excluir:', chargeId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-background">
        <DropdownMenuItem onClick={handleMarkAsPaid}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Marcar como Pago
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEmailReminder}>
          <Mail className="h-4 w-4 mr-2" />
          Lembrete Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWhatsAppReminder}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Lembrete WhatsApp
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleEdit}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
