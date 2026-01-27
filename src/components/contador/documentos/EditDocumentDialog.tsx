import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: { id: string; name: string } | null;
  onUpdate: (data: { id: string; name: string }) => void;
  isUpdating: boolean;
}

export function EditDocumentDialog({
  open,
  onOpenChange,
  document,
  onUpdate,
  isUpdating,
}: EditDocumentDialogProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (document) {
      setName(document.name);
    }
  }, [document]);

  const handleSubmit = () => {
    if (!document || !name.trim()) return;

    onUpdate({ id: document.id, name: name.trim() });
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Documento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome do documento</Label>
            <Input
              id="edit-name"
              placeholder="Ex: Contrato Social"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
