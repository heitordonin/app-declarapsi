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
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
  upload: any;
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
        .select('id, code, name')
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
        .select('id, name, frequency')
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
      let finalFileName = upload.file_name;
      let newPath = `${orgData.org_id}/${values.client_id}/${finalFileName}`;

      // Check if file already exists at destination
      const folderPath = `${orgData.org_id}/${values.client_id}`;
      const { data: existingFiles } = await supabase.storage
        .from('documents')
        .list(folderPath, { search: upload.file_name });

      // If file exists, generate unique name with timestamp
      if (existingFiles && existingFiles.length > 0) {
        const fileExt = finalFileName.substring(finalFileName.lastIndexOf('.'));
        const fileBase = finalFileName.substring(0, finalFileName.lastIndexOf('.'));
        finalFileName = `${fileBase}_${Date.now()}${fileExt}`;
        newPath = `${orgData.org_id}/${values.client_id}/${finalFileName}`;
        
        console.log('Arquivo duplicado detectado, usando nome único:', finalFileName);
      }

      // Move file to permanent location
      const { error: moveError } = await supabase.storage
        .from('documents')
        .move(upload.file_path, newPath);
      
      if (moveError) {
        if (moveError.message?.includes('409') || moveError.message?.includes('Duplicate')) {
          throw new Error('Arquivo duplicado detectado. Tente novamente.');
        }
        throw moveError;
      }

      // Create document record with final filename
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
        .eq('id', upload.id);
      
      if (updateError) throw updateError;

      // Get the created document ID for email notification
      const { data: newDocument } = await supabase
        .from('documents')
        .select('id')
        .eq('file_path', newPath)
        .single();

      // Send notification email (don't await - fire and forget)
      if (newDocument) {
        supabase.functions.invoke('send-document-notification', {
          body: { documentId: newDocument.id }
        }).then(({ error: emailError }) => {
          if (emailError) {
            console.error('Erro ao enviar notificação de documento:', emailError);
          }
        });
      }

      // Auto-complete obligation instance
      const { data: instance, error: instanceError } = await supabase
        .from('obligation_instances')
        .select('id, status, internal_target_at')
        .eq('client_id', values.client_id)
        .eq('obligation_id', values.obligation_id)
        .eq('competence', values.competence)
        .maybeSingle();

      if (instanceError) {
        console.error('Erro ao buscar instância:', instanceError);
      } else if (instance && instance.status !== 'on_time_done' && instance.status !== 'late_done') {
        // Determine if completed on time or late
        const today = new Date().toISOString().split('T')[0];
        const isOnTime = today <= instance.internal_target_at;
        const newStatus = isOnTime ? 'on_time_done' : 'late_done';

        const { error: completeError } = await supabase
          .from('obligation_instances')
          .update({
            status: newStatus,
            completed_at: new Date().toISOString(),
            completion_notes: 'Concluída automaticamente via upload de documento'
          })
          .eq('id', instance.id);

        if (completeError) {
          console.error('Erro ao concluir instância automaticamente:', completeError);
        }
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
      queryClient.invalidateQueries({ queryKey: ['client-comparison'] });
      queryClient.invalidateQueries({ queryKey: ['instances-detail'] });
      queryClient.invalidateQueries({ queryKey: ['obligation-stats'] });
      toast.success('Documento classificado e obrigação concluída automaticamente!');
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Erro ao classificar documento';
      toast.error(errorMessage);
      console.error('Erro na classificação:', error);
    }
  });

  const onSubmit = (values: ClassificationForm) => {
    classifyMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Classificar Documento</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Arquivo:</p>
              <p className="text-sm font-semibold">{upload?.file_name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
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
                  <FormItem>
                    <FormLabel>Obrigação *</FormLabel>
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