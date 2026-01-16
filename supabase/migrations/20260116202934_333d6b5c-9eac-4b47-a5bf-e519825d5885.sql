-- Add sessions_count column to charges table
ALTER TABLE public.charges
ADD COLUMN sessions_count integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.charges.sessions_count IS 'Quantidade de consultas/sessões referentes a esta cobrança';