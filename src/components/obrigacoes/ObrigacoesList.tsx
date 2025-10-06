import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Obligation } from "@/types/database";
import { ObrigacaoCard } from "./ObrigacaoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";

interface ObrigacoesListProps {
  onEdit: (obrigacao: Obligation) => void;
}

export function ObrigacoesList({ onEdit }: ObrigacoesListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [obrigacaoToArchive, setObrigacaoToArchive] = useState<Obligation | null>(null);

  const { data: obrigacoes, isLoading } = useQuery({
    queryKey: ['obligations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obligations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Obligation[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Desativa vínculos primeiro
      await supabase
        .from('client_obligations')
        .update({ active: false })
        .eq('obligation_id', id);
      
      // Deleta obrigação
      const { error } = await supabase
        .from('obligations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligations'] });
      toast({
        title: "Sucesso",
        description: "Obrigação arquivada com sucesso!"
      });
      setObrigacaoToArchive(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível arquivar a obrigação. Tente novamente.",
        variant: "destructive"
      });
      console.error(error);
    }
  });

  const handleArchive = (obrigacao: Obligation) => {
    setObrigacaoToArchive(obrigacao);
  };

  const confirmArchive = () => {
    if (obrigacaoToArchive) {
      deleteMutation.mutate(obrigacaoToArchive.id);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (!obrigacoes || obrigacoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma obrigação cadastrada</h3>
        <p className="text-muted-foreground mb-4">
          Crie sua primeira obrigação fiscal para começar a gerenciar.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {obrigacoes.map((obrigacao) => (
          <ObrigacaoCard
            key={obrigacao.id}
            obrigacao={obrigacao}
            onEdit={onEdit}
            onArchive={handleArchive}
          />
        ))}
      </div>

      <AlertDialog open={!!obrigacaoToArchive} onOpenChange={() => setObrigacaoToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar obrigação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Vínculos ativos com clientes serão desativados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Arquivando..." : "Arquivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
