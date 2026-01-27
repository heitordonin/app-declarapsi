import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DocumentosTable } from '@/components/contador/documentos/DocumentosTable';
import { UploadDocumentDialog } from '@/components/contador/documentos/UploadDocumentDialog';
import { EditDocumentDialog } from '@/components/contador/documentos/EditDocumentDialog';
import { usePermanentDocuments, type PermanentDocument } from '@/hooks/contador/usePermanentDocuments';

export default function DocumentosPermanentes() {
  const { user } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDocument, setEditDocument] = useState<PermanentDocument | null>(null);

  // Fetch org_id
  const { data: userRole } = useQuery({
    queryKey: ['user-org', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('org_id')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch clients
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients-list', userRole?.org_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, code')
        .eq('org_id', userRole!.org_id)
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!userRole?.org_id,
  });

  const {
    documents,
    isLoading,
    upload,
    isUploading,
    update,
    isUpdating,
    delete: deleteDocument,
  } = usePermanentDocuments(selectedClientId);

  const handleEdit = (doc: PermanentDocument) => {
    setEditDocument(doc);
  };

  const handleDelete = (doc: PermanentDocument) => {
    deleteDocument({ id: doc.id, filePath: doc.file_path });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          Documentos Permanentes
        </h1>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo
        </Button>
      </div>

      {/* Client Filter */}
      <div className="max-w-sm">
        <Select
          value={selectedClientId || ''}
          onValueChange={(value) => setSelectedClientId(value || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cliente" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {clientsLoading ? (
              <SelectItem value="loading" disabled>
                Carregando...
              </SelectItem>
            ) : (
              clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.code} - {client.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {selectedClientId ? (
        <DocumentosTable
          documents={documents}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          <p>Selecione um cliente para ver os documentos permanentes.</p>
        </div>
      )}

      {/* Upload Dialog */}
      <UploadDocumentDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        clients={clients}
        selectedClientId={selectedClientId}
        onUpload={upload}
        isUploading={isUploading}
        orgId={userRole?.org_id || ''}
      />

      {/* Edit Dialog */}
      <EditDocumentDialog
        open={!!editDocument}
        onOpenChange={(open) => !open && setEditDocument(null)}
        document={editDocument}
        onUpdate={update}
        isUpdating={isUpdating}
      />
    </div>
  );
}
