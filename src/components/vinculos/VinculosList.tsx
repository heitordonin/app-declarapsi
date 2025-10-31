import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreVertical, Edit, Trash2, Link as LinkIcon, Power } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { getFrequencyLabel, getFrequencyColor } from "@/lib/frequency-utils";
import { VinculoWithRelations } from "@/types/vinculos";

interface VinculosListProps {
  onEdit: (vinculo: VinculoWithRelations) => void;
}

export function VinculosList({ onEdit }: VinculosListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: vinculos, isLoading } = useQuery({
    queryKey: ["client-obligations", statusFilter, search],
    queryFn: async () => {
      let query = supabase
        .from("client_obligations")
        .select(`
          *,
          client:clients!inner(id, code, name, status),
          obligation:obligations!inner(id, name, frequency)
        `);

      if (statusFilter !== "all") {
        query = query.eq("active", statusFilter === "active");
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      
      // Filter by search term on client or obligation name (client-side)
      if (search && data) {
        const searchLower = search.toLowerCase();
        return data.filter((v: any) => 
          v.client.name.toLowerCase().includes(searchLower) ||
          v.obligation.name.toLowerCase().includes(searchLower)
        );
      }
      
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: boolean }) => {
      const { error } = await supabase
        .from("client_obligations")
        .update({ active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-obligations"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("client_obligations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-obligations"] });
      toast.success("Vínculo removido com sucesso!");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Erro ao remover vínculo");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
        <div className="border rounded-lg">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b last:border-0">
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!vinculos || vinculos.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10">
        <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum vínculo criado</h3>
        <p className="text-sm text-muted-foreground">
          Vincule obrigações aos seus clientes para começar a gerenciá-las
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Buscar por cliente ou obrigação..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Obrigação</TableHead>
              <TableHead>Frequência</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vinculos.map((vinculo: any) => (
              <TableRow key={vinculo.id}>
                <TableCell className="font-mono text-sm">
                  {vinculo.client.code}
                </TableCell>
                <TableCell className="font-medium">
                  {vinculo.client.name}
                </TableCell>
                <TableCell>{vinculo.obligation.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getFrequencyColor(vinculo.obligation.frequency)}>
                    {getFrequencyLabel(vinculo.obligation.frequency)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {vinculo.active ? (
                    <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                      ✓ Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300">
                      ✕ Inativo
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(vinculo.created_at), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(vinculo)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toggleMutation.mutate({ id: vinculo.id, currentStatus: vinculo.active })}
                      >
                        <Power className="h-4 w-4 mr-2" />
                        {vinculo.active ? "Desativar" : "Ativar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(vinculo.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este vínculo? Esta ação não pode ser desfeita.
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
