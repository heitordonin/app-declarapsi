import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CompleteObligationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (notes: string) => void;
  isLoading: boolean;
  obligationName: string;
  clientName?: string;
}

export function CompleteObligationDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  obligationName,
  clientName,
}: CompleteObligationDialogProps) {
  const [notes, setNotes] = useState('');
  
  const handleConfirm = () => {
    if (notes.trim().length >= 10) {
      onConfirm(notes.trim());
      setNotes('');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isLoading) {
      setNotes('');
    }
    onOpenChange(newOpen);
  };

  const isValid = notes.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Concluir Obrigação</DialogTitle>
          <DialogDescription>
            Informe a justificativa para a conclusão manual desta obrigação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">{obligationName}</p>
            {clientName && (
              <p className="text-sm text-muted-foreground">{clientName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Justificativa <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Descreva o motivo da conclusão manual (mínimo 10 caracteres)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {notes.trim().length}/10 caracteres mínimos
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Salvando...' : 'Concluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
