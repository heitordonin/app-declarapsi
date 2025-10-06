-- Add UPDATE policy for documents bucket to allow moving files
CREATE POLICY "Admins can move/update documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = get_user_org(auth.uid())::text
  AND has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = get_user_org(auth.uid())::text
  AND has_role(auth.uid(), 'admin')
);