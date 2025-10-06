import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Eye, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AddComunicadoDialog } from './AddComunicadoDialog';
import { ViewComunicadoDialog } from './ViewComunicadoDialog';
import { Badge } from '@/components/ui/badge';

export function ComunicadosList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedComunicado, setSelectedComunicado] = useState<any>(null);

  const { data: comunicados, isLoading, error } = useQuery({
    queryKey: ['communications'],
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communications')
        .select(`
          *,
          recipients:communication_recipients(
            id,
            client_id,
            email_status,
            viewed_at,
            client:clients(name)
          )
        `)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredComunicados = comunicados?.filter((com) =>
    com.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleView = (comunicado: any) => {
    setSelectedComunicado(comunicado);
    setViewDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por assunto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Comunicado
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          Erro ao carregar comunicados. Tente novamente.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assunto</TableHead>
                <TableHead>Data de Envio</TableHead>
                <TableHead className="text-center">Total Destinatários</TableHead>
                <TableHead className="text-center">Visualizações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComunicados?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum comunicado encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredComunicados?.map((comunicado) => {
                  const totalRecipients = comunicado.recipients?.length || 0;
                  const viewedCount = comunicado.recipients?.filter((r: any) => r.viewed_at).length || 0;
                  
                  return (
                    <TableRow
                      key={comunicado.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleView(comunicado)}
                    >
                      <TableCell className="font-medium">{comunicado.subject}</TableCell>
                      <TableCell>
                        {format(new Date(comunicado.sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-center">{totalRecipients}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {viewedCount} / {totalRecipients}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(comunicado);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AddComunicadoDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      {selectedComunicado && (
        <ViewComunicadoDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          comunicado={selectedComunicado}
        />
      )}
    </div>
  );
}
