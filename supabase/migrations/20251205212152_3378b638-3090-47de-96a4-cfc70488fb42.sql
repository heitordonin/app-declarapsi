-- Create enum for patient type
CREATE TYPE public.patient_type AS ENUM ('pf', 'pj');

-- Create enum for how patient was created
CREATE TYPE public.created_via AS ENUM ('manual', 'invite_link');

-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.patient_type NOT NULL DEFAULT 'pf',
  is_foreign_payment BOOLEAN NOT NULL DEFAULT false,
  document TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  cep TEXT,
  address TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  has_financial_responsible BOOLEAN NOT NULL DEFAULT false,
  financial_responsible_cpf TEXT,
  created_via public.created_via NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patient invite tokens table
CREATE TABLE public.patient_invite_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_invite_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patients - Clients can only see their own patients
CREATE POLICY "Clients can view their own patients"
ON public.patients
FOR SELECT
USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can insert their own patients"
ON public.patients
FOR INSERT
WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can update their own patients"
ON public.patients
FOR UPDATE
USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can delete their own patients"
ON public.patients
FOR DELETE
USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

-- RLS Policies for patient_invite_tokens - Clients can only manage their own tokens
CREATE POLICY "Clients can view their own tokens"
ON public.patient_invite_tokens
FOR SELECT
USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can insert their own tokens"
ON public.patient_invite_tokens
FOR INSERT
WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

-- Trigger for updated_at on patients
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_patients_client_id ON public.patients(client_id);
CREATE INDEX idx_patient_invite_tokens_token ON public.patient_invite_tokens(token);
CREATE INDEX idx_patient_invite_tokens_client_id ON public.patient_invite_tokens(client_id);