import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FrequencyType } from "@/types/database";

const obrigacaoSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  frequency: z.enum(['weekly', 'monthly', 'annual'], {
    required_error: 'Selecione a frequência'
  }),
  internal_target_day: z.coerce.number()
    .min(1, 'Dia deve ser entre 1 e 31')
    .max(31, 'Dia deve ser entre 1 e 31'),
  legal_due_rule: z.coerce.number()
    .min(1, 'Dia deve ser entre 1 e 31')
    .max(31, 'Dia deve ser entre 1 e 31')
    .optional()
    .nullable(),
  notes: z.string().optional()
});

type ObrigacaoFormValues = z.infer<typeof obrigacaoSchema>;

interface AddObrigacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddObrigacaoDialog({ open, onOpenChange }: AddObrigacaoDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<ObrigacaoFormValues>({
    resolver: zodResolver(obrigacaoSchema),
    defaultValues: {
      name: "",
      frequency: undefined,
      internal_target_day: 10,
      legal_due_rule: undefined,
      notes: ""
    }
  });

  const addMutation = useMutation({
    mutationFn: async (values: ObrigacaoFormValues) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (!userRole) throw new Error("Organização não encontrada");

      const { error } = await supabase
        .from('obligations')
        .insert({
          name: values.name,
          frequency: values.frequency,
          internal_target_day: values.internal_target_day,
          legal_due_rule: values.legal_due_rule || null,
          notes: values.notes || null,
          org_id: userRole.org_id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligations'] });
      toast({
        title: "Sucesso",
        description: "Obrigação criada com sucesso!"
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a obrigação. Tente novamente.",
        variant: "destructive"
      });
      console.error(error);
    }
  });

  const onSubmit = (values: ObrigacaoFormValues) => {
    addMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Obrigação</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: DCTF Mensal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequência *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="internal_target_day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia da Meta Interna *</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={31} placeholder="10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="legal_due_rule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia do Vencimento Legal</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      max={31} 
                      placeholder="10"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais sobre a obrigação" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
