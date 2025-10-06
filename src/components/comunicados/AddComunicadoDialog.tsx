import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from './RichTextEditor';
import { Loader2, Upload, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

const formSchema = z.object({
  subject: z.string().min(1, 'Assunto é obrigatório').max(200),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  allClients: z.boolean().default(false),
  selectedClients: z.array(z.string()).optional(),
});

interface AddComunicadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddComunicadoDialog({ open, onOpenChange }: AddComunicadoDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: '',
      message: '',
      allClients: false,
      selectedClients: [],
    },
  });

  const allClients = form.watch('allClients');

  const { data: clients } = useQuery({
    queryKey: ['active-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, code')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles((prev) => [...prev, ...acceptedFiles]);
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!user) throw new Error('User not authenticated');

      // Obter org_id do usuário
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (!userRole) throw new Error('User organization not found');

      // Determinar destinatários
      const recipientIds = values.allClients
        ? clients?.map((c) => c.id) || []
        : values.selectedClients || [];

      if (recipientIds.length === 0) {
        throw new Error('Selecione pelo menos um destinatário');
      }

      // Criar comunicado
      const { data: communication, error: commError } = await supabase
        .from('communications')
        .insert({
          subject: values.subject,
          message: values.message,
          org_id: userRole.org_id,
          sent_by: user.id,
          total_recipients: recipientIds.length,
          sent_at: new Date().toISOString(),
          attachments: [],
        })
        .select()
        .single();

      if (commError) throw commError;

      // Upload de anexos (se houver)
      const attachmentUrls: any[] = [];
      for (const file of files) {
        const filePath = `${communication.id}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('communication_attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        attachmentUrls.push({
          name: file.name,
          path: filePath,
          size: file.size,
        });
      }

      // Atualizar comunicado com anexos
      if (attachmentUrls.length > 0) {
        const { error: updateError } = await supabase
          .from('communications')
          .update({ attachments: attachmentUrls })
          .eq('id', communication.id);

        if (updateError) throw updateError;
      }

      // Criar registros de destinatários
      const recipients = recipientIds.map((clientId) => ({
        communication_id: communication.id,
        client_id: clientId,
        email_status: 'sent' as const,
        sent_at: new Date().toISOString(),
      }));

      const { error: recipientsError } = await supabase
        .from('communication_recipients')
        .insert(recipients);

      if (recipientsError) throw recipientsError;

      return communication;
    },
    onSuccess: () => {
      toast({
        title: 'Comunicado enviado com sucesso!',
      });
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      form.reset();
      setFiles([]);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar comunicado',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Comunicado</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assunto</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o assunto do comunicado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      content={field.value}
                      onChange={field.onChange}
                      placeholder="Digite a mensagem do comunicado..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Anexos</FormLabel>
              <div
                {...getRootProps()}
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clique ou arraste arquivos aqui (máx. 10MB por arquivo)
                </p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <span className="text-sm truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="allClients"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer">
                    Enviar para todos os clientes ativos
                  </FormLabel>
                </FormItem>
              )}
            />

            {!allClients && (
              <FormField
                control={form.control}
                name="selectedClients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selecionar Clientes</FormLabel>
                    <div className="border rounded-lg max-h-60 overflow-y-auto p-4 space-y-2">
                      {clients?.map((client) => (
                        <div key={client.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={field.value?.includes(client.id)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, client.id]);
                              } else {
                                field.onChange(current.filter((id) => id !== client.id));
                              }
                            }}
                          />
                          <label className="text-sm cursor-pointer">
                            {client.code} - {client.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enviar Comunicado
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
