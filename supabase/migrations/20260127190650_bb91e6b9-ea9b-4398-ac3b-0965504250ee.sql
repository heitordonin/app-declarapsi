-- Adicionar 'opened' ao enum delivery_state
ALTER TYPE delivery_state ADD VALUE IF NOT EXISTS 'opened';

-- Criar tabela de fila de e-mails
CREATE TABLE public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  email_id TEXT, -- ID retornado pelo Resend para tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para processamento eficiente da fila
CREATE INDEX idx_email_queue_status ON public.email_queue(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_email_queue_next_retry ON public.email_queue(next_retry_at) WHERE status = 'pending';

-- RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver a fila de e-mails
CREATE POLICY "Admins can view email queue"
ON public.email_queue FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Sistema pode gerenciar a fila (via service role)
CREATE POLICY "System can manage email queue"
ON public.email_queue FOR ALL
USING (true)
WITH CHECK (true);