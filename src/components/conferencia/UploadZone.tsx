import { useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading?: boolean;
}

export function UploadZone({ onFilesSelected, isUploading }: UploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxSize: 52428800, // 50MB
    disabled: isUploading
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
        isUploading && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        {isDragActive ? (
          <>
            <Upload className="h-12 w-12 text-primary animate-bounce" />
            <p className="text-lg font-medium text-primary">Solte os arquivos aqui</p>
          </>
        ) : (
          <>
            <FileText className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">
                Arraste documentos ou clique para selecionar
              </p>
              <p className="text-sm text-muted-foreground">
                PDF, Excel, PNG, JPG (máx. 50MB por arquivo)
              </p>
            </div>
            <Button type="button" variant="outline" disabled={isUploading}>
              Selecionar Arquivos
            </Button>
          </>
        )}
      </div>
    </div>
  );
}