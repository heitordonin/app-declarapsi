-- Create expense_categories table
CREATE TABLE public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  is_residential BOOLEAN NOT NULL DEFAULT false,
  requires_competency BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, code)
);

-- Enable RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Admins can manage expense categories
CREATE POLICY "Admins can manage expense categories"
  ON public.expense_categories
  FOR ALL
  USING (
    org_id = get_user_org(auth.uid()) 
    AND has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    org_id = get_user_org(auth.uid()) 
    AND has_role(auth.uid(), 'admin')
  );

-- Clients can view active expense categories
CREATE POLICY "Clients can view active expense categories"
  ON public.expense_categories
  FOR SELECT
  USING (
    org_id = get_user_org(auth.uid()) 
    AND is_active = true
  );

-- Trigger for updated_at
CREATE TRIGGER update_expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed initial categories for all existing organizations
INSERT INTO public.expense_categories (org_id, code, name, is_residential, requires_competency)
SELECT 
  o.id,
  v.code,
  v.name,
  v.is_residential,
  v.requires_competency
FROM public.orgs o
CROSS JOIN (VALUES
  ('P10.01.00001', 'Água', true, false),
  ('P10.01.00002', 'Aluguel', true, false),
  ('P10.01.00003', 'Condomínio', true, false),
  ('P10.01.00004', 'CRP - Conselho de classe', false, false),
  ('P10.01.00007', 'Energia', true, false),
  ('P10.01.00008', 'Gás', true, false),
  ('P10.01.00009', 'IPTU', true, false),
  ('P10.01.00010', 'ISS', false, false),
  ('P10.01.00011', 'Material de limpeza', false, false),
  ('P10.01.00012', 'Material de escritório', false, false),
  ('P10.01.00013', 'Remuneração paga a terceiros (com vínculo, INSS e FGTS)', false, false),
  ('P10.01.00014', 'Telefone/celular do consultório', false, false),
  ('P10.01.00015', 'Contador', false, false),
  ('P10.01.00016', 'Supervisão profissional', false, false),
  ('P10.01.00017', 'Sistemas (softwares)', false, false),
  ('P10.01.00018', 'Publicidade e marketing', false, false),
  ('P10.01.00019', 'Internet', true, false),
  ('P10.01.00020', 'Cursos e seminários', false, false),
  ('P10.01.00021', 'Secretária(o)', false, false),
  ('P10.01.00024', 'Outros', false, false),
  ('P20.01.00001', 'INSS - Previdência Social', false, true),
  ('P20.01.00004', 'DARF Carnê-Leão', false, true)
) AS v(code, name, is_residential, requires_competency);