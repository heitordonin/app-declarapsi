import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, MoreVertical, FileText, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OcrStatusBadge, DocumentTypeBadge } from './OcrStatusBadge';
import type { StagingUploadWithOcr, OcrData } from '@/lib/ocr-types';
import { formatCpfForDisplay, formatNitNisForDisplay } from '@/lib/ocr-types';

interface StagingTableProps {
  onClassify: (upload: StagingUploadWithOcr) => void;
}

export function StagingTable({ onClassify }: StagingTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: uploads, isLoading } = useQuery({
    queryKey: ['staging-uploads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staging_uploads')
        .select('*')
        .eq('state', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      // Cast through unknown to handle Json type compatibility
      return data as unknown as StagingUploadWithOcr[];
    },
    refetchInterval: 3000, // Faster polling as fallback (Realtime is primary)
  });

  // Subscribe to realtime updates for staging_uploads
  useEffect(() => {
    const channel = supabase
      .channel('staging-uploads-ocr')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'staging_uploads',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['staging-uploads'] });
          queryClient.invalidateQueries({ queryKey: ['staging-uploads-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const upload = uploads?.find(u => u.id === id);
      if (upload?.file_path) {
        await supabase.storage.from('documents').remove([upload.file_path]);
      }
      
      const { error } = await supabase
        .from('staging_uploads')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staging-uploads'] });
      queryClient.invalidateQueries({ queryKey: ['staging-uploads-count'] });
      toast.success('Arquivo removido!');
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error('Erro ao remover arquivo');
      console.error(error);
    }
  });

  const reprocessMutation = useMutation({
    mutationFn: async (uploadId: string) => {
      const { error } = await supabase.functions.invoke('process-ocr', {
        body: { uploadId }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('OCR reiniciado!');
      queryClient.invalidateQueries({ queryKey: ['staging-uploads'] });
    },
    onError: (error) => {
      toast.error('Erro ao reprocessar OCR');
      console.error(error);
    }
  });

  const filteredUploads = uploads?.filter(upload =>
    upload.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (upload.ocr_data as OcrData | null)?.matching?.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClientDisplay = (upload: StagingUploadWithOcr) => {
    const ocrData = upload.ocr_data as OcrData | null;
    
    if (ocrData?.matching?.client_found && ocrData?.matching?.client_name) {
      return (
        <span className="text-green-700">
          [{ocrData.matching.client_code}] {ocrData.matching.client_name}
        </span>
      );
    }
    
    if (ocrData?.extracted_data) {
      const identifier = ocrData.document_type === 'darf' 
        ? ocrData.extracted_data.cpf 
        : ocrData.extracted_data.nit_nis;
      
      if (identifier) {
        const formatted = ocrData.document_type === 'darf'
          ? formatCpfForDisplay(identifier)
          : formatNitNisForDisplay(identifier);
        
        return (
          <span className="text-yellow-700">
            {ocrData.document_type === 'darf' ? 'CPF' : 'NIT'}: {formatted}
            <span className="block text-xs text-yellow-600">Não encontrado</span>
          </span>
        );
      }
    }
    
    if (upload.ocr_status === 'pending' || upload.ocr_status === 'processing') {
      return <span className="text-muted-foreground">Aguardando...</span>;
    }
    
    return <span className="text-red-600">Não identificado</span>;
  };

  const getObligationDisplay = (upload: StagingUploadWithOcr) => {
    const ocrData = upload.ocr_data as OcrData | null;
    
    if (ocrData?.matching?.obligation_found && ocrData?.matching?.obligation_name) {
      return <span className="text-green-700">{ocrData.matching.obligation_name}</span>;
    }
    
    if (ocrData?.extracted_data?.codigo) {
      return (
        <span className="text-yellow-700">
          Código: {ocrData.extracted_data.codigo}
          <span className="block text-xs text-yellow-600">Não mapeado</span>
        </span>
      );
    }
    
    if (upload.ocr_status === 'pending' || upload.ocr_status === 'processing') {
      return <span className="text-muted-foreground">Aguardando...</span>;
    }
    
    return <span className="text-red-600">Não identificado</span>;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!uploads || uploads.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum documento pendente</h3>
        <p className="text-sm text-muted-foreground">
          Faça upload de documentos para começar a classificá-los
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do arquivo ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Badge variant="outline" className="px-3 py-1.5">
            {uploads.length} {uploads.length === 1 ? 'arquivo' : 'arquivos'}
          </Badge>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Obrigação</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status OCR</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUploads?.map((upload) => {
                const ocrData = upload.ocr_data as OcrData | null;
                
                return (
                  <TableRow key={upload.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate max-w-[200px]" title={upload.file_name}>
                          {upload.file_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DocumentTypeBadge type={upload.document_type} />
                    </TableCell>
                    <TableCell>
                      {getClientDisplay(upload)}
                    </TableCell>
                    <TableCell>
                      {getObligationDisplay(upload)}
                    </TableCell>
                    <TableCell>
                      {upload.competence || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {upload.amount ? (
                        <span>R$ {upload.amount.toFixed(2).replace('.', ',')}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <OcrStatusBadge 
                        status={upload.ocr_status} 
                        error={upload.ocr_error}
                        documentType={upload.document_type}
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onClassify(upload)}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Classificar
                          </DropdownMenuItem>
                          {(upload.ocr_status === 'error' || upload.ocr_status === 'pending') && (
                            <DropdownMenuItem 
                              onClick={() => reprocessMutation.mutate(upload.id)}
                              disabled={reprocessMutation.isPending}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Reprocessar OCR
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setDeleteId(upload.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover arquivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O arquivo será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
