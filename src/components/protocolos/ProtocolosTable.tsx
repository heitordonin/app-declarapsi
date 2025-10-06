import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ObligationInstance, Client, Obligation } from "@/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getStatusLabel, getStatusColor } from "@/lib/status-utils";
import { getFrequencyLabel } from "@/lib/frequency-utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Filter } from "lucide-react";

interface InstanceWithRelations extends ObligationInstance {
  client: Client;
  obligation: Obligation;
}

export function ProtocolosTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCompetence, setFilterCompetence] = useState<string>("");

  const { data: instances, isLoading } = useQuery({
    queryKey: ["obligation-instances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obligation_instances")
        .select(`
          *,
          client:clients(*),
          obligation:obligations(*)
        `)
        .order("due_at", { ascending: true });

      if (error) throw error;
      return data as InstanceWithRelations[];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      const { error } = await supabase
        .from("obligation_instances")
        .update({
          status: "on_time_done",
          completed_at: new Date().toISOString(),
        })
        .eq("id", instanceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obligation-instances"] });
      toast({
        title: "Sucesso",
        description: "Instância marcada como concluída.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar instância.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const filteredInstances = instances?.filter((instance) => {
    if (filterClient !== "all" && instance.client_id !== filterClient) return false;
    if (filterStatus !== "all" && instance.status !== filterStatus) return false;
    if (filterCompetence && !instance.competence.includes(filterCompetence)) return false;
    return true;
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>
        
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clients?.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="due_48h">Vence em 48h</SelectItem>
            <SelectItem value="overdue">Vencido</SelectItem>
            <SelectItem value="on_time_done">Concluído no Prazo</SelectItem>
            <SelectItem value="late_done">Concluído com Atraso</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="text"
          placeholder="Competência (ex: 2024-01)"
          value={filterCompetence}
          onChange={(e) => setFilterCompetence(e.target.value)}
          className="w-[200px]"
        />
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Obrigação</TableHead>
              <TableHead>Frequência</TableHead>
              <TableHead>Competência</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Meta Interna</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInstances?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhuma instância encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredInstances?.map((instance) => (
                <TableRow key={instance.id}>
                  <TableCell className="font-medium">{instance.client.name}</TableCell>
                  <TableCell>{instance.obligation.name}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {getFrequencyLabel(instance.obligation.frequency)}
                    </span>
                  </TableCell>
                  <TableCell>{instance.competence}</TableCell>
                  <TableCell>
                    {format(new Date(instance.due_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {format(new Date(instance.internal_target_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(instance.status)}>
                      {getStatusLabel(instance.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(instance.status === "pending" || instance.status === "due_48h" || instance.status === "overdue") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => completeMutation.mutate(instance.id)}
                        disabled={completeMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Concluir
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
