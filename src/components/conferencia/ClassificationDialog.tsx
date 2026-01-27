import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { StagingUploadWithOcr, OcrData } from '@/lib/ocr-types';
import { formatCpfForDisplay, formatNitNisForDisplay } from '@/lib/ocr-types';

const classificationSchema = z.object({
  client_id: z.string().uuid({ message: 'Selecione um cliente' }),
  obligation_id: z.string().uuid({ message: 'Selecione uma obrigação' }),
  competence: z.string().min(1, { message: 'Competência é obrigatória' })
    .regex(/^\d{2}\/\d{4}$/, { message: 'Formato: MM/YYYY' }),
  amount: z.string().optional(),
  due_at: z.string().optional(),
});

type ClassificationForm = z.infer<typeof classificationSchema>;

interface ClassificationDialogProps {
  upload: StagingUploadWithOcr | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClassificationDialog({ upload, open, onOpenChange }: ClassificationDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<ClassificationForm>({
    resolver: zodResolver(classificationSchema),
    defaultValues: {
      client_id: '',
      obligation_id: '',
      competence: '',
      amount: '',
      due_at: '',
    }
  });

  const ocrData = upload?.ocr_data as OcrData | null;
  const hasOcrWarnings = upload?.ocr_status === 'needs_review' || upload?.ocr_status === 'error';
  const clientNotFound = ocrData?.matching && !ocrData.matching.client_found;
  const obligationNotFound = ocrData?.matching && !ocrData.matching.obligation_found;

  useEffect(() => {
    if (upload && open) {
      form.reset({
        client_id: upload.client_id || '',
        obligation_id: upload.obligation_id || '',
        competence: upload.competence || '',
        amount: upload.amount?.toString() || '',
        due_at: upload.due_at || '',
      });
    }
  }, [upload, open, form]);

  const { data: clients } = useQuery({
    queryKey: ['clients-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, code, name, cpf, nit_nis')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: obligations } = useQuery({
    queryKey: ['obligations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obligations')
        .select('id, name, frequency, fiscal_code')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const classifyMutation = useMutation({
    mutationFn: async (values: ClassificationForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: orgData } = await supabase
        .from('user_roles')
        .select('org_id')
        .eq('user_id', user.id)
        .single();
      
      if (!orgData) throw new Error('Organização não encontrada');

      // Generate unique filename if needed
      let finalFileName = upload!.file_name;
      let newPath = `${orgData.org_id}/${values.client_id}/${finalFileName}`;

      // Check if file already exists at destination
      const folderPath = `${orgData.org_id}/${values.client_id}`;
      const { data: existingFiles } = await supabase.storage
        .from('documents')
        .list(folderPath, { search: upload!.file_name });

      // If file exists, generate unique name with timestamp
      if (existingFiles && existingFiles.length > 0) {
        const fileExt = finalFileName.substring(finalFileName.lastIndexOf('.'));
        const fileBase = finalFileName.substring(0, finalFileName.lastIndexOf('.'));
        finalFileName = `${fileBase}_${Date.now()}${fileExt}`;
        newPath = `${orgData.org_id}/${values.client_id}/${finalFileName}`;
      }

      // Move file to permanent location
      const { error: moveError } = await supabase.storage
        .from('documents')
        .move(upload!.file_path, newPath);
      
      if (moveError) {
        if (moveError.message?.includes('409') || moveError.message?.includes('Duplicate')) {
          throw new Error('Arquivo duplicado detectado. Tente novamente.');
        }
        throw moveError;
      }

      // Create document record
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          org_id: orgData.org_id,
          client_id: values.client_id,
          obligation_id: values.obligation_id,
          competence: values.competence,
          amount: values.amount ? parseFloat(values.amount) : null,
          due_at: values.due_at || null,
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
          client_id: values.client_id,
          obligation_id: values.obligation_id,
          competence: values.competence,
          amount: values.amount ? parseFloat(values.amount) : null,
          due_at: values.due_at || null,
        })
        .eq('id', upload!.id);
      
      if (updateError) throw updateError;

      // Get the created document ID for email queue
      const { data: newDocument } = await supabase
        .from('documents')
        .select('id')
        .eq('file_path', newPath)
        .single();

      // Add to email queue instead of sending directly
      if (newDocument) {
        await supabase
          .from('email_queue')
          .insert({
            document_id: newDocument.id,
            status: 'pending',
          });
      }

      // Auto-complete obligation instance
      const { data: instance } = await supabase
        .from('obligation_instances')
        .select('id, status, internal_target_at')
        .eq('client_id', values.client_id)
        .eq('obligation_id', values.obligation_id)
        .eq('competence', values.competence)
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staging-uploads'] });
      queryClient.invalidateQueries({ queryKey: ['staging-uploads-count'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['obligation-instances'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-instances'] });
      queryClient.invalidateQueries({ queryKey: ['general-stats'] });
      queryClient.invalidateQueries({ queryKey: ['evolution-stats'] });
      queryClient.invalidateQueries({ queryKey: ['instances-detail'] });
      queryClient.invalidateQueries({ queryKey: ['obligation-stats'] });
      toast.success('Documento classificado e obrigação concluída automaticamente!');
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao classificar documento');
      console.error('Erro na classificação:', error);
    }
  });

  const onSubmit = (values: ClassificationForm) => {
    classifyMutation.mutate(values);
  };

  // Get detected identifier for display
  const getDetectedIdentifier = () => {
    if (!ocrData?.extracted_data) return null;
    
    if (ocrData.document_type === 'darf' && ocrData.extracted_data.cpf) {
      return `CPF detectado: ${formatCpfForDisplay(ocrData.extracted_data.cpf)}`;
    }
    if (ocrData.document_type === 'gps' && ocrData.extracted_data.nit_nis) {
      return `NIT/NIS detectado: ${formatNitNisForDisplay(ocrData.extracted_data.nit_nis)}`;
    }
    return null;
  };

  const detectedIdentifier = getDetectedIdentifier();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Classificar Documento</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* File info */}
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Arquivo:</p>
              <p className="text-sm font-semibold">{upload?.file_name}</p>
            </div>

            {/* OCR Success indicator */}
            {upload?.ocr_status === 'success' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Documento lido com sucesso</AlertTitle>
                <AlertDescription className="text-green-700">
                  Todos os campos foram identificados e pré-preenchidos. Verifique e confirme.
                </AlertDescription>
              </Alert>
            )}

            {/* OCR Warning alerts */}
            {upload?.ocr_status === 'needs_review' && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Atenção: Revisão necessária</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  {upload.ocr_error || 'Alguns dados precisam de revisão manual.'}
                  {detectedIdentifier && (
                    <p className="mt-1 font-medium">{detectedIdentifier}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {upload?.ocr_status === 'error' && (
              <Alert className="bg-red-50 border-red-200">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Erro no processamento</AlertTitle>
                <AlertDescription className="text-red-700">
                  {upload.ocr_error || 'Não foi possível ler o documento. Preencha os campos manualmente.'}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem className={clientNotFound ? 'ring-2 ring-yellow-400 rounded-md p-2 -m-2' : ''}>
                    <FormLabel>
                      Cliente *
                      {clientNotFound && (
                        <span className="text-yellow-600 text-xs ml-2">(não encontrado)</span>
                      )}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            [{client.code}] {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="obligation_id"
                render={({ field }) => (
                  <FormItem className={obligationNotFound ? 'ring-2 ring-yellow-400 rounded-md p-2 -m-2' : ''}>
                    <FormLabel>
                      Obrigação *
                      {obligationNotFound && (
                        <span className="text-yellow-600 text-xs ml-2">(não mapeada)</span>
                      )}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a obrigação" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {obligations?.map((obligation) => (
                          <SelectItem key={obligation.id} value={obligation.id}>
                            {obligation.name}
                            {obligation.fiscal_code && (
                              <span className="text-muted-foreground ml-1">
                                ({obligation.fiscal_code})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="competence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competência *</FormLabel>
                    <FormControl>
                      <Input placeholder="MM/YYYY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={classifyMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={classifyMutation.isPending}>
                {classifyMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Classificar e Enviar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
