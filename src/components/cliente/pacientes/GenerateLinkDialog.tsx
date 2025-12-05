import { useState } from 'react';
import { Copy, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GenerateLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: string | null;
}

export function GenerateLinkDialog({ open, onOpenChange, link }: GenerateLinkDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!link) return;
    
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link de Cadastro Gerado</DialogTitle>
          <DialogDescription>
            Compartilhe este link com o paciente para que ele preencha seus próprios dados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={link || ''}
              readOnly
              className="flex-1"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>Este link expira em 24 horas e pode ser usado apenas uma vez.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
