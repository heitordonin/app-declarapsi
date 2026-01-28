-- Tabela para rastrear status de exportação por cliente/mês
CREATE TABLE public.client_monthly_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  charges_exported_at timestamp with time zone,
  charges_exported_by uuid,
  expenses_exported_at timestamp with time zone,
  expenses_exported_by uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(client_id, year, month)
);

-- RLS
ALTER TABLE public.client_monthly_status ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem gerenciar
CREATE POLICY "Admins can manage client monthly status"
  ON public.client_monthly_status FOR ALL
  USING (
    client_in_user_org(client_id, auth.uid()) 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Trigger para updated_at
CREATE TRIGGER update_client_monthly_status_updated_at
  BEFORE UPDATE ON public.client_monthly_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();