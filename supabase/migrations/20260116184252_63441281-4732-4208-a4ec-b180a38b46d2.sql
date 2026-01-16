-- Criar tabela de descrições padrão
CREATE TABLE charge_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_charge_descriptions_client_id ON charge_descriptions(client_id);

-- Trigger para updated_at
CREATE TRIGGER update_charge_descriptions_updated_at
  BEFORE UPDATE ON charge_descriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE charge_descriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Clients can view their own charge descriptions"
  ON charge_descriptions FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can insert their own charge descriptions"
  ON charge_descriptions FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can update their own charge descriptions"
  ON charge_descriptions FOR UPDATE
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can delete their own charge descriptions"
  ON charge_descriptions FOR DELETE
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));