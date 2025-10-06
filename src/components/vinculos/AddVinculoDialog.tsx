import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getFrequencyLabel } from "@/lib/frequency-utils";

const vinculoSchema = z.object({
  client_id: z.string().uuid({ message: "Selecione um cliente" }),
  obligation_id: z.string().uuid({ message: "Selecione uma obrigação" }),
  active: z.boolean().default(true),
  params: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        try {
          JSON.parse(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: "JSON inválido" }
    ),
});

type VinculoFormValues = z.infer<typeof vinculoSchema>;

interface AddVinculoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddVinculoDialog({ open, onOpenChange }: AddVinculoDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VinculoFormValues>({
    resolver: zodResolver(vinculoSchema),
    defaultValues: {
      client_id: "",
      obligation_id: "",
      active: true,
      params: "",
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, code, name")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const { data: obligations } = useQuery({
    queryKey: ["obligations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obligations")
        .select("id, name, frequency")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (values: VinculoFormValues) => {
      // Verificar duplicata
      const { data: existing } = await supabase
        .from("client_obligations")
        .select("id")
        .eq("client_id", values.client_id)
        .eq("obligation_id", values.obligation_id)
        .eq("active", true)
        .maybeSingle();

      if (existing) {
        throw new Error("Já existe um vínculo ativo entre este cliente e obrigação");
      }

      const { error } = await supabase.from("client_obligations").insert({
        client_id: values.client_id,
        obligation_id: values.obligation_id,
        active: values.active,
        params: values.params ? JSON.parse(values.params) : null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-obligations"] });
      toast.success("Vínculo criado com sucesso!");
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar vínculo");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (values: VinculoFormValues) => {
    setIsSubmitting(true);
    addMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Vínculo</DialogTitle>
          <DialogDescription>
            Associe uma obrigação a um cliente para gerenciamento automático
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
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
                        <SelectValue placeholder="Selecione uma obrigação" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {obligations?.map((obligation) => (
                        <SelectItem key={obligation.id} value={obligation.id}>
                          {obligation.name} ({getFrequencyLabel(obligation.frequency)})
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
              name="params"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parâmetros Customizados</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{"chave": "valor"}'
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Parâmetros adicionais em formato JSON (opcional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ativo</FormLabel>
                    <FormDescription>
                      O vínculo será criado como ativo
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar Vínculo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
