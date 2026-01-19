import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UploadZone } from '@/components/conferencia/UploadZone';
import { StagingTable } from '@/components/conferencia/StagingTable';
import { ClassificationDialog } from '@/components/conferencia/ClassificationDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { StagingUploadWithOcr } from '@/lib/ocr-types';

export default function Conferencia() {
  const [classifyingUpload, setClassifyingUpload] = useState<StagingUploadWithOcr | null>(null);
  const queryClient = useQueryClient();

  const { data: pendingCount } = useQuery({
    queryKey: ['staging-uploads-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('staging_uploads')
        .select('*', { count: 'exact', head: true })
        .eq('state', 'pending');
      
      if (error) throw error;
      return count || 0;
    }
  });

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

      const uploadedRecords: { id: string; fileName: string }[] = [];

      await Promise.all(
        files.map(async (file) => {
          const filePath = `${orgData.org_id}/staging/${Date.now()}-${file.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file);
          
          if (uploadError) throw uploadError;

          const { data: insertData, error: insertError } = await supabase
            .from('staging_uploads')
            .insert({
              org_id: orgData.org_id,
              uploaded_by: user.id,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              state: 'pending',
              ocr_status: 'pending'
            })
            .select('id')
            .single();
          
          if (insertError) throw insertError;
          
          uploadedRecords.push({ id: insertData.id, fileName: file.name });
        })
      );

      return uploadedRecords;
    },
    onSuccess: async (uploadedRecords) => {
      queryClient.invalidateQueries({ queryKey: ['staging-uploads'] });
      queryClient.invalidateQueries({ queryKey: ['staging-uploads-count'] });
      
      const count = uploadedRecords.length;
      toast.success(
        `${count} ${count === 1 ? 'arquivo enviado' : 'arquivos enviados'}! Processando OCR automaticamente...`
      );

      // Trigger OCR processing for each uploaded file (fire and forget)
      for (const record of uploadedRecords) {
        supabase.functions.invoke('process-ocr', {
          body: { uploadId: record.id }
        }).catch((error) => {
          console.error(`OCR failed for ${record.fileName}:`, error);
        });
      }
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
          Faça upload de DARFs e GPS. O sistema lê automaticamente os documentos e pré-preenche os dados para classificação.
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="staging" className="relative">
            Classificar Documentos
            {pendingCount && pendingCount > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300"
              >
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
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
