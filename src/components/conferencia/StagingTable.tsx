import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Search, MoreVertical, FileText, Trash2, CheckCircle2, RefreshCw, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { OcrStatusBadge, DocumentTypeBadge } from './OcrStatusBadge';
import type { StagingUploadWithOcr, OcrData } from '@/lib/ocr-types';
import { formatCpfForDisplay, formatNitNisForDisplay } from '@/lib/ocr-types';

interface StagingTableProps {
  onClassify: (upload: StagingUploadWithOcr) => void;
}

export function StagingTable({ onClassify }: StagingTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
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

  // Check if a document is ready for batch sending
  const isReadyForBatch = (upload: StagingUploadWithOcr): boolean => {
    // Must have OCR completed (not pending/processing)
    if (upload.ocr_status === 'pending' || upload.ocr_status === 'processing') {
      return false;
    }
    
    // Must have client and obligation identified
    if (!upload.client_id || !upload.obligation_id) {
      return false;
    }
    
    // Must have competence
    if (!upload.competence) {
      return false;
    }
    
    return true;
  };

  // Get list of uploads that are ready for batch
  const readyUploads = useMemo(() => {
    return uploads?.filter(isReadyForBatch) || [];
  }, [uploads]);

  // Clean up selected IDs when uploads change (remove IDs that no longer exist or are not ready)
  useEffect(() => {
    if (uploads) {
      const validIds = new Set(readyUploads.map(u => u.id));
      setSelectedIds(prev => {
        const newSet = new Set<string>();
        prev.forEach(id => {
          if (validIds.has(id)) {
            newSet.add(id);
          }
        });
        return newSet;
      });
    }
  }, [uploads, readyUploads]);

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

  const batchSendMutation = useMutation({
    mutationFn: async (uploadIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: orgData } = await supabase
        .from('user_roles')
        .select('org_id')
        .eq('user_id', user.id)
        .single();
      
      if (!orgData) throw new Error('Organização não encontrada');

      const uploadsToProcess = uploads?.filter(u => uploadIds.includes(u.id)) || [];
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const upload of uploadsToProcess) {
        try {
          // Generate unique filename if needed
          let finalFileName = upload.file_name;
          let newPath = `${orgData.org_id}/${upload.client_id}/${finalFileName}`;

          // Check if file already exists at destination
          const folderPath = `${orgData.org_id}/${upload.client_id}`;
          const { data: existingFiles } = await supabase.storage
            .from('documents')
            .list(folderPath, { search: upload.file_name });

          // If file exists, generate unique name with timestamp
          if (existingFiles && existingFiles.length > 0) {
            const fileExt = finalFileName.substring(finalFileName.lastIndexOf('.'));
            const fileBase = finalFileName.substring(0, finalFileName.lastIndexOf('.'));
            finalFileName = `${fileBase}_${Date.now()}${fileExt}`;
            newPath = `${orgData.org_id}/${upload.client_id}/${finalFileName}`;
          }

          // Move file to permanent location
          const { error: moveError } = await supabase.storage
            .from('documents')
            .move(upload.file_path, newPath);
          
          if (moveError) {
            throw moveError;
          }

          // Create document record
          const { error: docError } = await supabase
            .from('documents')
            .insert({
              org_id: orgData.org_id,
              client_id: upload.client_id!,
              obligation_id: upload.obligation_id!,
              competence: upload.competence!,
              amount: upload.amount || null,
              due_at: upload.due_at || null,
              file_name: finalFileName,
              file_path: newPath,
              delivered_by: user.id,
              delivered_at: new Date().toISOString(),
              delivery_state: 'sent'
            });
          
          if (docError) throw docError;

          // Update staging upload
          const { error: updateError } = await supabase
            .from('staging_uploads')
            .update({
              state: 'classified',
              client_id: upload.client_id,
              obligation_id: upload.obligation_id,
              competence: upload.competence,
              amount: upload.amount,
              due_at: upload.due_at,
            })
            .eq('id', upload.id);
          
          if (updateError) throw updateError;

          // Get the created document ID for email notification
          const { data: newDocument } = await supabase
            .from('documents')
            .select('id')
            .eq('file_path', newPath)
            .single();

          // Send notification email (fire and forget)
          if (newDocument) {
            supabase.functions.invoke('send-document-notification', {
              body: { documentId: newDocument.id }
            }).catch(console.error);
          }

          // Auto-complete obligation instance
          const { data: instance } = await supabase
            .from('obligation_instances')
            .select('id, status, internal_target_at')
            .eq('client_id', upload.client_id!)
            .eq('obligation_id', upload.obligation_id!)
            .eq('competence', upload.competence!)
            .maybeSingle();

          if (instance && instance.status !== 'on_time_done' && instance.status !== 'late_done') {
            const today = new Date().toISOString().split('T')[0];
            const isOnTime = today <= instance.internal_target_at;
            const newStatus = isOnTime ? 'on_time_done' : 'late_done';

            await supabase
              .from('obligation_instances')
              .update({
                status: newStatus,
                completed_at: new Date().toISOString(),
                completion_notes: 'Concluída automaticamente via upload de documento'
              })
              .eq('id', instance.id);
          }

          successCount++;
        } catch (error: any) {
          console.error(`Erro ao processar ${upload.file_name}:`, error);
          errors.push(upload.file_name);
          errorCount++;
        }
      }

      return { successCount, errorCount, errors };
    },
    onSuccess: ({ successCount, errorCount, errors }) => {
      queryClient.invalidateQueries({ queryKey: ['staging-uploads'] });
      queryClient.invalidateQueries({ queryKey: ['staging-uploads-count'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['obligation-instances'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-instances'] });
      queryClient.invalidateQueries({ queryKey: ['general-stats'] });
      queryClient.invalidateQueries({ queryKey: ['evolution-stats'] });
      queryClient.invalidateQueries({ queryKey: ['instances-detail'] });
      queryClient.invalidateQueries({ queryKey: ['obligation-stats'] });
      
      if (errorCount === 0) {
        toast.success(`${successCount} ${successCount === 1 ? 'documento enviado' : 'documentos enviados'} com sucesso!`);
      } else {
        toast.warning(
          `${successCount} enviado(s), ${errorCount} com erro: ${errors.join(', ')}`
        );
      }
      
      setSelectedIds(new Set());
      setShowBatchConfirm(false);
    },
    onError: (error) => {
      toast.error('Erro ao enviar documentos em lote');
      console.error(error);
      setShowBatchConfirm(false);
    }
  });

  const filteredUploads = uploads?.filter(upload =>
    upload.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (upload.ocr_data as OcrData | null)?.matching?.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(readyUploads.map(u => u.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleBatchSend = () => {
    if (selectedIds.size > 0) {
      setShowBatchConfirm(true);
    }
  };

  const executeBatchSend = () => {
    batchSendMutation.mutate(Array.from(selectedIds));
  };

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

  // Check if all ready uploads in the filtered list are selected
  const allReadySelected = useMemo(() => {
    const filteredReadyIds = filteredUploads?.filter(isReadyForBatch).map(u => u.id) || [];
    return filteredReadyIds.length > 0 && filteredReadyIds.every(id => selectedIds.has(id));
  }, [filteredUploads, selectedIds]);

  // Count of ready uploads in filtered list
  const filteredReadyCount = useMemo(() => {
    return filteredUploads?.filter(isReadyForBatch).length || 0;
  }, [filteredUploads]);

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
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
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
          {selectedIds.size > 0 && (
            <Button
              onClick={handleBatchSend}
              disabled={batchSendMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {batchSendMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar {selectedIds.size} {selectedIds.size === 1 ? 'documento' : 'documentos'}
            </Button>
          )}
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={allReadySelected}
                    onCheckedChange={handleSelectAll}
                    disabled={filteredReadyCount === 0}
                    title={filteredReadyCount === 0 ? 'Nenhum documento pronto para envio' : 'Selecionar todos prontos'}
                  />
                </TableHead>
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
                const isReady = isReadyForBatch(upload);
                
                return (
                  <TableRow 
                    key={upload.id}
                    className={selectedIds.has(upload.id) ? 'bg-primary/5' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(upload.id)}
                        onCheckedChange={(checked) => handleSelectOne(upload.id, !!checked)}
                        disabled={!isReady}
                        title={!isReady ? 'Classifique o documento primeiro' : 'Selecionar para envio em lote'}
                      />
                    </TableCell>
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

      {/* Delete confirmation dialog */}
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

      {/* Batch send confirmation dialog */}
      <AlertDialog open={showBatchConfirm} onOpenChange={setShowBatchConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envio em lote</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você está prestes a enviar <strong>{selectedIds.size}</strong> {selectedIds.size === 1 ? 'documento' : 'documentos'}.
              </p>
              <p>Esta ação irá:</p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>Mover os arquivos para a pasta do cliente</li>
                <li>Registrar os documentos no sistema</li>
                <li>Enviar notificações por email aos clientes</li>
                <li>Marcar as obrigações como concluídas automaticamente</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={batchSendMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBatchSend}
              disabled={batchSendMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {batchSendMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Confirmar Envio
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
