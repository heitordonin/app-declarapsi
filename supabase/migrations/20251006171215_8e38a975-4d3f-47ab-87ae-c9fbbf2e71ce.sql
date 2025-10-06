-- Permitir que admins insiram destinatários para comunicados da sua organização
CREATE POLICY "Admins can create recipients"
ON communication_recipients
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND client_id IN (
    SELECT id FROM clients
    WHERE org_id = get_user_org(auth.uid())
  )
  AND communication_id IN (
    SELECT id FROM communications
    WHERE org_id = get_user_org(auth.uid())
  )
);