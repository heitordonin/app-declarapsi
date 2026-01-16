-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
  
  -- Valores
  amount NUMERIC(12,2) NOT NULL,
  deductible_amount NUMERIC(12,2) NOT NULL,
  penalty NUMERIC(12,2) DEFAULT 0,
  
  -- Datas
  payment_date DATE NOT NULL,
  
  -- Campos condicionais
  is_residential_expense BOOLEAN NOT NULL DEFAULT false,
  competency_month INTEGER CHECK (competency_month BETWEEN 1 AND 12),
  competency_year INTEGER CHECK (competency_year BETWEEN 2020 AND 2100),
  
  -- Informações adicionais
  description TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_expenses_client_id ON expenses(client_id);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_payment_date ON expenses(payment_date);
CREATE INDEX idx_expenses_competency ON expenses(competency_year, competency_month);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Clients can view their own expenses
CREATE POLICY "Clients can view their own expenses"
  ON expenses FOR SELECT
  USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

-- Clients can insert their own expenses
CREATE POLICY "Clients can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

-- Clients can update their own expenses
CREATE POLICY "Clients can update their own expenses"
  ON expenses FOR UPDATE
  USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

-- Clients can delete their own expenses
CREATE POLICY "Clients can delete their own expenses"
  ON expenses FOR DELETE
  USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

-- Admins can view client expenses in their org
CREATE POLICY "Admins can view client expenses"
  ON expenses FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE org_id = get_user_org(auth.uid())
    )
    AND has_role(auth.uid(), 'admin')
  );

-- Trigger for updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();