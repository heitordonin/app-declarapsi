import * as React from "react";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ResponsiveActionPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: () => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isDirty?: boolean;
  confirmClose?: boolean;
  confirmMessage?: string;
}

export function ResponsiveActionPanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel = "Salvar",
  cancelLabel = "Cancelar",
  onSubmit,
  onCancel,
  isSubmitting = false,
  isDirty = false,
  confirmClose = true,
  confirmMessage = "Você tem alterações não salvas. Deseja descartar?",
}: ResponsiveActionPanelProps) {
  const isMobile = useIsMobile();
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  const handleClose = React.useCallback(() => {
    if (confirmClose && isDirty) {
      setShowConfirmDialog(true);
    } else {
      onOpenChange(false);
      onCancel?.();
    }
  }, [confirmClose, isDirty, onOpenChange, onCancel]);

  const handleConfirmDiscard = React.useCallback(() => {
    setShowConfirmDialog(false);
    onOpenChange(false);
    onCancel?.();
  }, [onOpenChange, onCancel]);

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        handleClose();
      } else {
        onOpenChange(true);
      }
    },
    [handleClose, onOpenChange]
  );

  const PanelHeader = (
    <>
      {isMobile ? (
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
      ) : (
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
      )}
    </>
  );

  const PanelContent = (
    <div className="flex-1 min-h-0 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="px-4 pb-4">{children}</div>
      </ScrollArea>
    </div>
  );

  const PanelFooter = (
    <div className="flex justify-end gap-3 p-4 border-t bg-background">
      <Button
        type="button"
        variant="outline"
        onClick={handleClose}
        disabled={isSubmitting}
      >
        {cancelLabel}
      </Button>
      <Button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="min-w-[100px]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </div>
  );

  const ConfirmDialog = (
    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
          <AlertDialogDescription>{confirmMessage}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continuar editando</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmDiscard}>
            Descartar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerContent className="max-h-[90vh] flex flex-col">
            {PanelHeader}
            {PanelContent}
            <DrawerFooter className="p-0">{PanelFooter}</DrawerFooter>
          </DrawerContent>
        </Drawer>
        {ConfirmDialog}
      </>
    );
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          className="w-[480px] sm:max-w-[480px] flex flex-col p-0"
        >
          <div className="p-6 pb-0">{PanelHeader}</div>
          {PanelContent}
          {PanelFooter}
        </SheetContent>
      </Sheet>
      {ConfirmDialog}
    </>
  );
}
