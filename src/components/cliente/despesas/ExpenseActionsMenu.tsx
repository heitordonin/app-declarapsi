import { useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { canModifyExpense, getRestrictionMessage } from '@/lib/charge-period-utils';
import type { Expense } from '@/hooks/cliente/useExpensesData';

interface ExpenseActionsMenuProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseActionsMenu({ expense, onEdit, onDelete }: ExpenseActionsMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Verificar se pode modificar baseado na data de pagamento
  const canModify = canModifyExpense(expense.paymentDate);

  const handleEditClick = () => {
    if (!canModify) {
      toast.error('Fora do período de apuração', {
        description: getRestrictionMessage(),
        duration: 5000,
      });
      return;
    }
    onEdit(expense);
  };

  const handleDeleteClick = () => {
    if (!canModify) {
      toast.error('Fora do período de apuração', {
        description: getRestrictionMessage(),
        duration: 5000,
      });
      return;
    }
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onDelete(expense.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 bg-background">
          <DropdownMenuItem 
            onClick={handleEditClick}
            className={!canModify ? 'opacity-50' : ''}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleDeleteClick} 
            className={`text-destructive focus:text-destructive ${!canModify ? 'opacity-50' : ''}`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir despesa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta despesa de <strong>{expense.category}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
