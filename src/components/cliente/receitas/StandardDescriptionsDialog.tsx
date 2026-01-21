import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, Check, X, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useChargeDescriptions, ChargeDescription } from '@/hooks/cliente/useChargeDescriptions';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface StandardDescriptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (description: string) => void;
}

export function StandardDescriptionsDialog({
  open,
  onOpenChange,
  onSelect,
}: StandardDescriptionsDialogProps) {
  const isMobile = useIsMobile();
  const {
    descriptions,
    isLoading,
    createDescription,
    updateDescription,
    deleteDescription,
    isCreating,
    isUpdating,
    isDeleting,
  } = useChargeDescriptions();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setIsAddingNew(false);
      setNewDescription('');
      setEditingId(null);
      setEditingValue('');
    }
  }, [open]);

  const filteredDescriptions = descriptions.filter((d) =>
    d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (description: string) => {
    onSelect(description);
    onOpenChange(false);
  };

  const handleCreate = async () => {
    if (!newDescription.trim()) return;
    await createDescription(newDescription.trim());
    setNewDescription('');
    setIsAddingNew(false);
  };

  const handleStartEdit = (item: ChargeDescription) => {
    setEditingId(item.id);
    setEditingValue(item.description);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingValue.trim()) return;
    await updateDescription({ id: editingId, description: editingValue.trim() });
    setEditingId(null);
    setEditingValue('');
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteDescription(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  // Shared content for both Dialog and Drawer
  const content = (
    <div className="space-y-4">
      {/* Search and Add New */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar descrições..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsAddingNew(true)}
          disabled={isAddingNew}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Add New Input */}
      {isAddingNew && (
        <div className="flex gap-2 items-center bg-muted/50 p-2 rounded-lg">
          <Input
            placeholder="Digite a nova descrição..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') {
                setIsAddingNew(false);
                setNewDescription('');
              }
            }}
            autoFocus={!isMobile}
            className="flex-1"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCreate}
            disabled={!newDescription.trim() || isCreating}
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setIsAddingNew(false);
              setNewDescription('');
            }}
          >
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )}

      {/* Descriptions List */}
      <ScrollArea className={cn("pr-4", isMobile ? "h-[50vh]" : "h-[300px]")}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Carregando...
          </div>
        ) : filteredDescriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <FileText className="h-8 w-8" />
            <p className="text-sm">
              {searchQuery
                ? 'Nenhuma descrição encontrada'
                : 'Nenhuma descrição cadastrada'}
            </p>
            {!searchQuery && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setIsAddingNew(true)}
              >
                Criar primeira descrição
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDescriptions.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border transition-colors',
                  editingId === item.id
                    ? 'bg-muted border-primary'
                    : 'hover:bg-muted/50 cursor-pointer'
                )}
              >
                {editingId === item.id ? (
                  // Edit Mode
                  <>
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus={!isMobile}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleSaveEdit}
                      disabled={!editingValue.trim() || isUpdating}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                ) : (
                  // View Mode
                  <>
                    <span
                      className="flex-1 text-sm truncate"
                      onClick={() => handleSelect(item.description)}
                    >
                      {item.description}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(item);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(item.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // Mobile: Use Drawer (bottom sheet) to avoid conflicts with parent Drawer
  if (isMobile) {
    return (
      <>
        <Drawer 
          open={open} 
          onOpenChange={onOpenChange} 
          shouldScaleBackground={false}
          repositionInputs={false}
        >
          <DrawerContent className="max-h-[600px]">
            <DrawerHeader className="bg-primary text-primary-foreground rounded-t-[10px]">
              <DrawerTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Descrições Padrão
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 py-4">
              {content}
            </div>
          </DrawerContent>
        </Drawer>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir descrição?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A descrição será removida permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
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

  // Desktop: Use Dialog (centered modal)
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Descrições Padrão
            </DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir descrição?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A descrição será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
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
