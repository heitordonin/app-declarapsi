-- Etapa 1: Melhorar infraestrutura de auditoria existente
-- A tabela audit_events já existe, vamos adicionar índices e políticas específicas para segurança

-- Adicionar índices para otimizar queries de auditoria de segurança
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON public.audit_events(action);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at_desc ON public.audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource_type ON public.audit_events(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_org_user ON public.audit_events(org_id, user_id);

-- Adicionar nova política para inserção de logs de sistema (edge functions)
CREATE POLICY "System can insert audit logs"
  ON public.audit_events
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id = get_user_org(auth.uid()));

-- Comentários para documentação de uso em segurança
COMMENT ON COLUMN public.audit_events.action IS 'Ação realizada: function_access, unauthorized_access, data_access, login_attempt, etc.';
COMMENT ON COLUMN public.audit_events.resource_type IS 'Tipo do recurso: edge_function, table, api_endpoint, etc.';
COMMENT ON COLUMN public.audit_events.metadata IS 'Dados adicionais: IP, erro, parâmetros da requisição, user agent, etc.';