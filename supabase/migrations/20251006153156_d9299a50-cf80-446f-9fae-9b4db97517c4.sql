-- Create custom types
CREATE TYPE app_role AS ENUM ('admin', 'client');
CREATE TYPE client_status AS ENUM ('active', 'archived');
CREATE TYPE frequency_type AS ENUM ('weekly', 'monthly', 'annual');
CREATE TYPE instance_status AS ENUM ('pending', 'due_48h', 'on_time_done', 'overdue', 'late_done');
CREATE TYPE upload_state AS ENUM ('pending', 'classified', 'sent', 'error');
CREATE TYPE delivery_state AS ENUM ('sent', 'delivered', 'bounced', 'failed');
CREATE TYPE email_event_type AS ENUM ('sent', 'delivered', 'bounced', 'opened', 'clicked', 'spam');

-- Organizations table
CREATE TABLE public.orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;

-- User roles table (SECURITY CRITICAL)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, org_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cpf TEXT NOT NULL,
  cep TEXT,
  state TEXT,
  city TEXT,
  neighborhood TEXT,
  address TEXT,
  number TEXT,
  complement TEXT,
  status client_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  UNIQUE(org_id, code)
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Obligations catalog table
CREATE TABLE public.obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency frequency_type NOT NULL,
  internal_target_day INT NOT NULL,
  legal_due_rule TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.obligations ENABLE ROW LEVEL SECURITY;

-- Client-Obligation links table
CREATE TABLE public.client_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  obligation_id UUID NOT NULL REFERENCES public.obligations(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true,
  params JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, obligation_id)
);

ALTER TABLE public.client_obligations ENABLE ROW LEVEL SECURITY;

-- Obligation instances table
CREATE TABLE public.obligation_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  obligation_id UUID NOT NULL REFERENCES public.obligations(id) ON DELETE CASCADE,
  competence TEXT NOT NULL,
  due_at DATE NOT NULL,
  internal_target_at DATE NOT NULL,
  status instance_status NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  notified_due_day BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, obligation_id, competence)
);

ALTER TABLE public.obligation_instances ENABLE ROW LEVEL SECURITY;

-- Staging uploads table
CREATE TABLE public.staging_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  state upload_state NOT NULL DEFAULT 'pending',
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  obligation_id UUID REFERENCES public.obligations(id) ON DELETE CASCADE,
  competence TEXT,
  due_at DATE,
  amount NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staging_uploads ENABLE ROW LEVEL SECURITY;

-- Documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  obligation_id UUID NOT NULL REFERENCES public.obligations(id) ON DELETE CASCADE,
  competence TEXT NOT NULL,
  due_at DATE NOT NULL,
  amount NUMERIC,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  delivered_at TIMESTAMPTZ NOT NULL,
  delivered_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivery_state delivery_state NOT NULL DEFAULT 'sent',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Communications table
CREATE TABLE public.communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL,
  total_recipients INT NOT NULL
);

ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

-- Communication recipients table
CREATE TABLE public.communication_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  communication_id UUID NOT NULL REFERENCES public.communications(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  email_status email_event_type NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ
);

ALTER TABLE public.communication_recipients ENABLE ROW LEVEL SECURITY;

-- Email events table
CREATE TABLE public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id TEXT NOT NULL,
  event_type email_event_type NOT NULL,
  recipient TEXT NOT NULL,
  metadata JSONB,
  received_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Audit events table
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Security definer functions for RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_org(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for orgs
CREATE POLICY "Users can view their org"
  ON public.orgs FOR SELECT
  TO authenticated
  USING (id = public.get_user_org(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- RLS Policies for clients
CREATE POLICY "Admins can view all clients in their org"
  ON public.clients FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org(auth.uid()) 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Clients can view their own record"
  ON public.clients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (
    org_id = public.get_user_org(auth.uid()) 
    AND public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for obligations
CREATE POLICY "Admins can view obligations"
  ON public.obligations FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org(auth.uid()) 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage obligations"
  ON public.obligations FOR ALL
  TO authenticated
  USING (
    org_id = public.get_user_org(auth.uid()) 
    AND public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for client_obligations
CREATE POLICY "Admins can manage client obligations"
  ON public.client_obligations FOR ALL
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE org_id = public.get_user_org(auth.uid())
    )
    AND public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for obligation_instances
CREATE POLICY "Admins can view all instances"
  ON public.obligation_instances FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE org_id = public.get_user_org(auth.uid())
    )
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Clients can view their instances"
  ON public.obligation_instances FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage instances"
  ON public.obligation_instances FOR ALL
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE org_id = public.get_user_org(auth.uid())
    )
    AND public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for staging_uploads
CREATE POLICY "Only admins can access staging"
  ON public.staging_uploads FOR ALL
  TO authenticated
  USING (
    org_id = public.get_user_org(auth.uid()) 
    AND public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for documents
CREATE POLICY "Admins can view all documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org(auth.uid()) 
    AND public.has_role(auth.uid(), 'admin')
    AND deleted_at IS NULL
  );

CREATE POLICY "Clients can view their documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Admins can manage documents"
  ON public.documents FOR ALL
  TO authenticated
  USING (
    org_id = public.get_user_org(auth.uid()) 
    AND public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for communications
CREATE POLICY "Admins can view communications"
  ON public.communications FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org(auth.uid()) 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Clients can view their communications"
  ON public.communications FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT communication_id 
      FROM public.communication_recipients cr
      JOIN public.clients c ON cr.client_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create communications"
  ON public.communications FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org(auth.uid()) 
    AND public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for communication_recipients
CREATE POLICY "Admins can view recipients"
  ON public.communication_recipients FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE org_id = public.get_user_org(auth.uid())
    )
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Clients can view their recipient records"
  ON public.communication_recipients FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for audit_events
CREATE POLICY "Admins can view audit events"
  ON public.audit_events FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org(auth.uid()) 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can create audit events"
  ON public.audit_events FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org(auth.uid()) 
    AND public.has_role(auth.uid(), 'admin')
  );

-- Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_orgs_updated_at
  BEFORE UPDATE ON public.orgs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_obligations_updated_at
  BEFORE UPDATE ON public.obligations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_obligation_instances_updated_at
  BEFORE UPDATE ON public.obligation_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_org_id ON public.user_roles(org_id);
CREATE INDEX idx_clients_org_id ON public.clients(org_id);
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_obligations_org_id ON public.obligations(org_id);
CREATE INDEX idx_client_obligations_client_id ON public.client_obligations(client_id);
CREATE INDEX idx_client_obligations_obligation_id ON public.client_obligations(obligation_id);
CREATE INDEX idx_obligation_instances_client_id ON public.obligation_instances(client_id);
CREATE INDEX idx_obligation_instances_status ON public.obligation_instances(status);
CREATE INDEX idx_obligation_instances_competence ON public.obligation_instances(competence);
CREATE INDEX idx_staging_uploads_org_id ON public.staging_uploads(org_id);
CREATE INDEX idx_staging_uploads_state ON public.staging_uploads(state);
CREATE INDEX idx_documents_org_id ON public.documents(org_id);
CREATE INDEX idx_documents_client_id ON public.documents(client_id);
CREATE INDEX idx_documents_deleted_at ON public.documents(deleted_at);
CREATE INDEX idx_communications_org_id ON public.communications(org_id);
CREATE INDEX idx_communication_recipients_communication_id ON public.communication_recipients(communication_id);
CREATE INDEX idx_audit_events_org_id ON public.audit_events(org_id);