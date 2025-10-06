-- Adicionar campos NIT/NIS e Início Controle de Obrigações na tabela clients
ALTER TABLE public.clients 
  ADD COLUMN nit_nis text,
  ADD COLUMN obligations_start_date date;

COMMENT ON COLUMN public.clients.nit_nis IS 'Número de Identificação do Trabalhador/Número de Inscrição Social';
COMMENT ON COLUMN public.clients.obligations_start_date IS 'Data de início do controle de obrigações para este cliente';