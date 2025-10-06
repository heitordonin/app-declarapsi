export type AppRole = 'admin' | 'client';
export type ClientStatus = 'active' | 'archived';
export type FrequencyType = 'weekly' | 'monthly' | 'annual';
export type InstanceStatus = 'pending' | 'due_48h' | 'on_time_done' | 'overdue' | 'late_done';
export type UploadState = 'pending' | 'classified' | 'sent' | 'error';
export type DeliveryState = 'sent' | 'delivered' | 'bounced' | 'failed';
export type EmailEventType = 'sent' | 'delivered' | 'bounced' | 'opened' | 'clicked' | 'spam';

export interface Organization {
  id: string;
  name: string;
  cnpj?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  org_id: string;
  role: AppRole;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  org_id: string;
  user_id?: string;
  code: string;
  name: string;
  email: string;
  cpf: string;
  phone?: string;
  cep?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  number?: string;
  complement?: string;
  status: ClientStatus;
  created_at: string;
  archived_at?: string;
}

export interface Obligation {
  id: string;
  org_id: string;
  name: string;
  frequency: FrequencyType;
  internal_target_day: number;
  legal_due_rule?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientObligation {
  id: string;
  client_id: string;
  obligation_id: string;
  active: boolean;
  params?: Record<string, any>;
  created_at: string;
}

export interface ObligationInstance {
  id: string;
  client_id: string;
  obligation_id: string;
  competence: string;
  due_at: string;
  internal_target_at: string;
  status: InstanceStatus;
  completed_at?: string;
  notified_due_day: boolean;
  created_at: string;
  updated_at: string;
}

export interface StagingUpload {
  id: string;
  org_id: string;
  uploaded_by: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  state: UploadState;
  client_id?: string;
  obligation_id?: string;
  competence?: string;
  due_at?: string;
  amount?: number;
  created_at: string;
}

export interface Document {
  id: string;
  org_id: string;
  client_id: string;
  obligation_id: string;
  competence: string;
  due_at: string;
  amount?: number;
  file_path: string;
  file_name: string;
  delivered_at: string;
  delivered_by: string;
  delivery_state: DeliveryState;
  deleted_at?: string;
  created_at: string;
}

export interface Communication {
  id: string;
  org_id: string;
  subject: string;
  message: string;
  sent_by: string;
  sent_at: string;
  total_recipients: number;
}

export interface CommunicationRecipient {
  id: string;
  communication_id: string;
  client_id: string;
  email_status: EmailEventType;
  sent_at?: string;
}

export interface EmailEvent {
  id: string;
  email_id: string;
  event_type: EmailEventType;
  recipient: string;
  metadata?: Record<string, any>;
  received_at: string;
}

export interface AuditEvent {
  id: string;
  org_id: string;
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}
