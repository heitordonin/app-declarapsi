-- Create permanent_documents table
CREATE TABLE public.permanent_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.permanent_documents ENABLE ROW LEVEL SECURITY;

-- Admins can manage all permanent documents in their org
CREATE POLICY "Admins can manage permanent documents"
ON public.permanent_documents FOR ALL
USING (org_id = get_user_org(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- Clients can view their permanent documents
CREATE POLICY "Clients can view their permanent documents"
ON public.permanent_documents FOR SELECT
USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

-- Clients can update viewed_at on their permanent documents
CREATE POLICY "Clients can mark permanent documents as viewed"
ON public.permanent_documents FOR UPDATE
USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()))
WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_permanent_documents_client_id ON public.permanent_documents(client_id);
CREATE INDEX idx_permanent_documents_org_id ON public.permanent_documents(org_id);

-- Storage policies for permanent documents folder
CREATE POLICY "Admins can upload permanent documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'permanent' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update permanent documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'permanent' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete permanent documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'permanent' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Clients can view permanent documents in storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'permanent'
);