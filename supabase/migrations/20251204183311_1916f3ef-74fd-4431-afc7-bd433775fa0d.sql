-- Permitir clientes atualizarem viewed_at nos seus próprios registros
CREATE POLICY "Clients can mark as viewed"
ON public.communication_recipients
FOR UPDATE
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Permitir admins visualizarem eventos de email
CREATE POLICY "Admins can view email events"
ON public.email_events
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));