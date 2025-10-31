import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getFrequencyLabel } from "@/lib/frequency-utils";
import { VinculoWithRelations } from "@/types/vinculos";

const editVinculoSchema = z.object({
  active: z.boolean(),
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

type EditVinculoFormValues = z.infer<typeof editVinculoSchema>;

interface EditVinculoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vinculo: VinculoWithRelations | null;
}

export function EditVinculoDialog({ open, onOpenChange, vinculo }: EditVinculoDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditVinculoFormValues>({
    resolver: zodResolver(editVinculoSchema),
    defaultValues: {
      active: true,
      params: "",
    },
  });

  useEffect(() => {
    if (vinculo) {
      form.reset({
        active: vinculo.active,
        params: vinculo.params ? JSON.stringify(vinculo.params, null, 2) : "",
      });
    }
  }, [vinculo, form]);

  const updateMutation = useMutation({
    mutationFn: async (values: EditVinculoFormValues) => {
      if (!vinculo) return;

      const { error } = await supabase
        .from("client_obligations")
        .update({
          active: values.active,
          params: values.params ? JSON.parse(values.params) : null,
        })
        .eq("id", vinculo.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-obligations"] });
      toast.success("Vínculo atualizado com sucesso!");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar vínculo");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (values: EditVinculoFormValues) => {
    setIsSubmitting(true);
    updateMutation.mutate(values);
  };

  if (!vinculo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Vínculo</DialogTitle>
          <DialogDescription>
            Atualize os parâmetros e status do vínculo
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Input
                value={`[${vinculo.client.code}] ${vinculo.client.name}`}
                disabled
                className="bg-muted"
              />
            </FormItem>

            <FormItem>
              <FormLabel>Obrigação</FormLabel>
              <Input
                value={`${vinculo.obligation.name} (${getFrequencyLabel(vinculo.obligation.frequency)})`}
                disabled
                className="bg-muted"
              />
            </FormItem>

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
                      rows={6}
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
                    <FormLabel className="text-base">Status Ativo</FormLabel>
                    <FormDescription>
                      Desative temporariamente este vínculo
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
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
