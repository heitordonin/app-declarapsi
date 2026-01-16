import { useState } from 'react';
import { MoreVertical, CheckCircle, Mail, MessageCircle, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Charge } from '@/hooks/cliente/useChargesData';

interface ChargeActionsMenuProps {
  charge: Charge;
  onMarkAsPaid: (charge: Charge) => void;
  onEdit: (charge: Charge) => void;
  onDelete: (chargeId: string) => Promise<void>;
}

export function ChargeActionsMenu({ 
  charge, 
  onMarkAsPaid, 
  onEdit, 
  onDelete 
}: ChargeActionsMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEmailReminder = () => {
    toast.info('Esta funcionalidade estará disponível em breve');
  };

  const handleWhatsAppReminder = () => {
    toast.info('Esta funcionalidade estará disponível em breve');
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(charge.id);
      toast.success('Cobrança excluída com sucesso!');
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error('Erro ao excluir cobrança');
    } finally {
      setIsDeleting(false);
    }
  };

  const isPaid = charge.status === 'paid';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-background">
          <DropdownMenuItem 
            onClick={() => onMarkAsPaid(charge)}
            disabled={isPaid}
            className={isPaid ? 'opacity-50' : ''}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar como Pago
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEmailReminder} disabled className="opacity-50">
            <Mail className="h-4 w-4 mr-2" />
            Lembrete Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleWhatsAppReminder} disabled className="opacity-50">
            <MessageCircle className="h-4 w-4 mr-2" />
            Lembrete WhatsApp
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onEdit(charge)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)} 
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cobrança?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a cobrança de <strong>{charge.patient_name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
