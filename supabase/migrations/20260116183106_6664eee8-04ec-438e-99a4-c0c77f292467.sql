-- 1. Criar enum para status de cobrança
CREATE TYPE charge_status AS ENUM ('pending', 'overdue', 'paid');

-- 2. Criar tabela charges
CREATE TABLE charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_cpf text NOT NULL,
  payer_cpf text NOT NULL,
  due_date date NOT NULL,
  payment_date date,
  description text NOT NULL,
  amount numeric NOT NULL,
  health_receipt_issued boolean NOT NULL DEFAULT false,
  status charge_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Índices para performance
CREATE INDEX idx_charges_client_id ON charges(client_id);
CREATE INDEX idx_charges_patient_id ON charges(patient_id);
CREATE INDEX idx_charges_due_date ON charges(due_date);
CREATE INDEX idx_charges_status ON charges(status);

-- 4. Trigger para updated_at
CREATE TRIGGER update_charges_updated_at
  BEFORE UPDATE ON charges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Habilitar RLS
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;

-- 6. Policies para clientes
CREATE POLICY "Clients can view their own charges"
  ON charges FOR SELECT
  USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

CREATE POLICY "Clients can insert their own charges"
  ON charges FOR INSERT
  WITH CHECK (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

CREATE POLICY "Clients can update their own charges"
  ON charges FOR UPDATE
  USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

CREATE POLICY "Clients can delete their own charges"
  ON charges FOR DELETE
  USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

-- 7. Policy para admins
CREATE POLICY "Admins can view client charges"
  ON charges FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE org_id = get_user_org(auth.uid())
    ) 
    AND has_role(auth.uid(), 'admin')
  );