import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UploadZone } from '@/components/conferencia/UploadZone';
import { StagingTable } from '@/components/conferencia/StagingTable';
import { ClassificationDialog } from '@/components/conferencia/ClassificationDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function Conferencia() {
  const [classifyingUpload, setClassifyingUpload] = useState<any>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: orgData } = await supabase
        .from('user_roles')
        .select('org_id')
        .eq('user_id', user.id)
        .single();
      
      if (!orgData) throw new Error('Organização não encontrada');

      const uploads = await Promise.all(
        files.map(async (file) => {
          const filePath = `${orgData.org_id}/staging/${Date.now()}-${file.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file);
          
          if (uploadError) throw uploadError;

          const { error: insertError } = await supabase
            .from('staging_uploads')
            .insert({
              org_id: orgData.org_id,
              uploaded_by: user.id,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              state: 'pending'
            });
          
          if (insertError) throw insertError;
        })
      );

      return uploads;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staging-uploads'] });
      toast.success('Arquivos enviados com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao enviar arquivos');
      console.error(error);
    }
  });

  const handleFilesSelected = (files: File[]) => {
    uploadMutation.mutate(files);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Conferência</h1>
        <p className="text-muted-foreground">
          Faça upload e classifique documentos para envio aos clientes.
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="staging">Classificar Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <UploadZone
            onFilesSelected={handleFilesSelected}
            isUploading={uploadMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="staging" className="space-y-4">
          <StagingTable onClassify={setClassifyingUpload} />
        </TabsContent>
      </Tabs>

      <ClassificationDialog
        upload={classifyingUpload}
        open={!!classifyingUpload}
        onOpenChange={(open) => !open && setClassifyingUpload(null)}
      />
    </div>
  );
}
