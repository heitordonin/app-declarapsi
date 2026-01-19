-- Allow clients to update their own documents (for marking as viewed)
CREATE POLICY "Clients can mark documents as viewed"
ON public.documents
FOR UPDATE
USING (
  client_id IN (
    SELECT clients.id 
    FROM clients 
    WHERE clients.user_id = auth.uid()
  )
)
WITH CHECK (
  client_id IN (
    SELECT clients.id 
    FROM clients 
    WHERE clients.user_id = auth.uid()
  )
);