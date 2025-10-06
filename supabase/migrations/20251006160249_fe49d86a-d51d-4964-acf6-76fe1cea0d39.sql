-- Alter legal_due_rule column from text to integer
ALTER TABLE public.obligations
ALTER COLUMN legal_due_rule TYPE integer USING legal_due_rule::integer;