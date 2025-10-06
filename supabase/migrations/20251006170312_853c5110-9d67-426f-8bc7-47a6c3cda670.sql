-- Adicionar campo de anexos na tabela communications
ALTER TABLE communications 
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- Adicionar campo de visualização na plataforma em communication_recipients
ALTER TABLE communication_recipients 
ADD COLUMN IF NOT EXISTS viewed_at timestamp with time zone;

-- Criar storage bucket para anexos de comunicados
INSERT INTO storage.buckets (id, name, public)
VALUES ('communication_attachments', 'communication_attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies para o bucket communication_attachments

-- Admins podem fazer upload de anexos
CREATE POLICY "Admins can upload communication attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'communication_attachments' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Admins podem deletar anexos
CREATE POLICY "Admins can delete communication attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'communication_attachments' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Admins podem visualizar todos os anexos da sua org
CREATE POLICY "Admins can view communication attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'communication_attachments' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Clientes podem visualizar anexos dos comunicados que receberam
CREATE POLICY "Clients can view their communication attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'communication_attachments'
  AND (
    -- Extrai o communication_id do path (formato: {communication_id}/{filename})
    (storage.foldername(name))[1] IN (
      SELECT cr.communication_id::text
      FROM communication_recipients cr
      JOIN clients c ON c.id = cr.client_id
      WHERE c.user_id = auth.uid()
    )
  )
);