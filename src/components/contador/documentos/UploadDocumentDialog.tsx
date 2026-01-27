import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Client {
  id: string;
  name: string;
  code: string;
}

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  selectedClientId: string | null;
  onUpload: (data: { clientId: string; name: string; file: File; orgId: string }) => void;
  isUploading: boolean;
  orgId: string;
}

export function UploadDocumentDialog({
  open,
  onOpenChange,
  clients,
  selectedClientId,
  onUpload,
  isUploading,
  orgId,
}: UploadDocumentDialogProps) {
  const [clientId, setClientId] = useState(selectedClientId || '');
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      // Auto-fill name from file name if empty
      if (!name) {
        const nameWithoutExtension = selectedFile.name.replace(/\.[^/.]+$/, '');
        setName(nameWithoutExtension);
      }
    }
  }, [name]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  const handleSubmit = () => {
    if (!clientId || !name.trim() || !file) return;

    onUpload({
      clientId,
      name: name.trim(),
      file,
      orgId,
    });

    // Reset form
    setName('');
    setFile(null);
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName('');
      setFile(null);
      if (!selectedClientId) {
        setClientId('');
      }
    } else {
      setClientId(selectedClientId || '');
    }
    onOpenChange(open);
  };

  const removeFile = () => {
    setFile(null);
  };

  const isValid = clientId && name.trim() && file;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Documento Permanente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.code} - {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome do documento</Label>
            <Input
              id="name"
              placeholder="Ex: Contrato Social"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Arquivo</Label>
            {file ? (
              <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/50">
                <FileText className="h-8 w-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive
                    ? 'Solte o arquivo aqui...'
                    : 'Arraste um arquivo ou clique para selecionar'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOC, DOCX, PNG, JPG
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Fazer Upload'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
