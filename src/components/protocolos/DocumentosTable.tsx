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
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Send, Trash2, Filter, Mail, MailOpen, MailX, Clock, Check, Eye } from "lucide-react";

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  client_id: string;
  obligation_id: string;
  competence: string;
  delivered_at: string;
  due_at: string | null;
  amount: number | null;
  delivery_state: string;
  viewed_at: string | null;
  client: {
    id: string;
    name: string;
  };
  obligation: {
    id: string;
    name: string;
  };
}

const getDeliveryStateConfig = (state: string) => {
  const config: Record<string, { label: string; className: string; icon: typeof Mail }> = {
    sent: {
      label: "Enviado",
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      icon: Mail,
    },
    delivered: {
      label: "Entregue",
      className: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
      icon: Check,
    },
    opened: {
      label: "Aberto",
      className: "bg-green-500/10 text-green-700 dark:text-green-400",
      icon: MailOpen,
    },
    bounced: {
      label: "Rejeitado",
      className: "bg-red-500/10 text-red-700 dark:text-red-400",
      icon: MailX,
    },
    failed: {
      label: "Falhou",
      className: "bg-red-500/10 text-red-700 dark:text-red-400",
      icon: MailX,
    },
  };
  return config[state] || { label: state, className: "bg-muted text-muted-foreground", icon: Clock };
};

export function DocumentosTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterObligation, setFilterObligation] = useState<string>("all");
  const [filterCompetence, setFilterCompetence] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select(`
          *,
          client:clients(id, name),
          obligation:obligations(id, name)
        `)
        .is("deleted_at", null)
        .order("delivered_at", { ascending: false });

      if (error) throw error;
      return data as Document[];
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

  const { data: obligations } = useQuery({
    queryKey: ["obligations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obligations")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (document: Document) => {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(document.file_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.file_name;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Download iniciado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao baixar documento.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from("documents")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Sucesso",
        description: "Documento deletado com sucesso.",
      });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao deletar documento.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from("documents")
        .update({
          delivery_state: "sent",
          delivered_at: new Date().toISOString(),
        })
        .eq("id", documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Sucesso",
        description: "Documento reenviado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao reenviar documento.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const filteredDocuments = documents?.filter((doc) => {
    if (filterClient !== "all" && doc.client_id !== filterClient) return false;
    if (filterObligation !== "all" && doc.obligation_id !== filterObligation) return false;
    if (filterCompetence && !doc.competence.includes(filterCompetence)) return false;
    return true;
  });

  const handleDeleteClick = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      deleteMutation.mutate(documentToDelete);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <>
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

          <Select value={filterObligation} onValueChange={setFilterObligation}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Obrigação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as obrigações</SelectItem>
              {obligations?.map((obligation) => (
                <SelectItem key={obligation.id} value={obligation.id}>
                  {obligation.name}
                </SelectItem>
              ))}
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
                <TableHead>Arquivo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Obrigação</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Data de Envio</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Visualizado</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum documento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments?.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {doc.file_name}
                    </TableCell>
                    <TableCell>{doc.client.name}</TableCell>
                    <TableCell>{doc.obligation.name}</TableCell>
                    <TableCell>{doc.competence}</TableCell>
                    <TableCell>
                      {format(new Date(doc.delivered_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {doc.due_at ? format(new Date(doc.due_at), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                    </TableCell>
                    <TableCell>
                      {doc.amount ? `R$ ${Number(doc.amount).toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const config = getDeliveryStateConfig(doc.delivery_state);
                        const IconComponent = config.icon;
                        return (
                          <Badge className={`${config.className} flex items-center gap-1 w-fit`}>
                            <IconComponent className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {doc.viewed_at ? (
                        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 flex items-center gap-1 w-fit">
                          <Eye className="h-3 w-3" />
                          {format(new Date(doc.viewed_at), "dd/MM HH:mm", { locale: ptBR })}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadMutation.mutate(doc)}
                          disabled={downloadMutation.isPending}
                          title="Baixar"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resendMutation.mutate(doc.id)}
                          disabled={resendMutation.isPending}
                          title="Reenviar"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(doc.id)}
                          disabled={deleteMutation.isPending}
                          title="Deletar"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este documento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
