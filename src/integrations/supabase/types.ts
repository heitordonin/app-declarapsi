export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          org_id: string
          resource_id: string | null
          resource_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          org_id: string
          resource_id?: string | null
          resource_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          org_id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      client_obligations: {
        Row: {
          active: boolean
          client_id: string
          created_at: string
          id: string
          obligation_id: string
          params: Json | null
        }
        Insert: {
          active?: boolean
          client_id: string
          created_at?: string
          id?: string
          obligation_id: string
          params?: Json | null
        }
        Update: {
          active?: boolean
          client_id?: string
          created_at?: string
          id?: string
          obligation_id?: string
          params?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "client_obligations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_obligations_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "obligations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          archived_at: string | null
          birth_date: string | null
          cep: string | null
          city: string | null
          code: string
          complement: string | null
          cpf: string
          created_at: string
          crp_number: string | null
          display_name: string | null
          email: string
          id: string
          name: string
          neighborhood: string | null
          nit_nis: string | null
          number: string | null
          obligations_start_date: string | null
          org_id: string
          phone: string | null
          state: string | null
          status: Database["public"]["Enums"]["client_status"]
          user_id: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          code: string
          complement?: string | null
          cpf: string
          created_at?: string
          crp_number?: string | null
          display_name?: string | null
          email: string
          id?: string
          name: string
          neighborhood?: string | null
          nit_nis?: string | null
          number?: string | null
          obligations_start_date?: string | null
          org_id: string
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          user_id?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          code?: string
          complement?: string | null
          cpf?: string
          created_at?: string
          crp_number?: string | null
          display_name?: string | null
          email?: string
          id?: string
          name?: string
          neighborhood?: string | null
          nit_nis?: string | null
          number?: string | null
          obligations_start_date?: string | null
          org_id?: string
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_recipients: {
        Row: {
          client_id: string
          communication_id: string
          email_status: Database["public"]["Enums"]["email_event_type"]
          id: string
          sent_at: string | null
          viewed_at: string | null
        }
        Insert: {
          client_id: string
          communication_id: string
          email_status?: Database["public"]["Enums"]["email_event_type"]
          id?: string
          sent_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          client_id?: string
          communication_id?: string
          email_status?: Database["public"]["Enums"]["email_event_type"]
          id?: string
          sent_at?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_recipients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_recipients_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          attachments: Json | null
          id: string
          message: string
          org_id: string
          sent_at: string
          sent_by: string
          subject: string
          total_recipients: number
        }
        Insert: {
          attachments?: Json | null
          id?: string
          message: string
          org_id: string
          sent_at: string
          sent_by: string
          subject: string
          total_recipients: number
        }
        Update: {
          attachments?: Json | null
          id?: string
          message?: string
          org_id?: string
          sent_at?: string
          sent_by?: string
          subject?: string
          total_recipients?: number
        }
        Relationships: [
          {
            foreignKeyName: "communications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          amount: number | null
          client_id: string
          competence: string
          created_at: string
          deleted_at: string | null
          delivered_at: string
          delivered_by: string
          delivery_state: Database["public"]["Enums"]["delivery_state"]
          due_at: string
          file_name: string
          file_path: string
          id: string
          obligation_id: string
          org_id: string
        }
        Insert: {
          amount?: number | null
          client_id: string
          competence: string
          created_at?: string
          deleted_at?: string | null
          delivered_at: string
          delivered_by: string
          delivery_state?: Database["public"]["Enums"]["delivery_state"]
          due_at: string
          file_name: string
          file_path: string
          id?: string
          obligation_id: string
          org_id: string
        }
        Update: {
          amount?: number | null
          client_id?: string
          competence?: string
          created_at?: string
          deleted_at?: string | null
          delivered_at?: string
          delivered_by?: string
          delivery_state?: Database["public"]["Enums"]["delivery_state"]
          due_at?: string
          file_name?: string
          file_path?: string
          id?: string
          obligation_id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "obligations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          email_id: string
          event_type: Database["public"]["Enums"]["email_event_type"]
          id: string
          metadata: Json | null
          received_at: string
          recipient: string
        }
        Insert: {
          email_id: string
          event_type: Database["public"]["Enums"]["email_event_type"]
          id?: string
          metadata?: Json | null
          received_at: string
          recipient: string
        }
        Update: {
          email_id?: string
          event_type?: Database["public"]["Enums"]["email_event_type"]
          id?: string
          metadata?: Json | null
          received_at?: string
          recipient?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_residential: boolean
          name: string
          org_id: string
          requires_competency: boolean
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_residential?: boolean
          name: string
          org_id: string
          requires_competency?: boolean
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_residential?: boolean
          name?: string
          org_id?: string
          requires_competency?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      obligation_instances: {
        Row: {
          client_id: string
          competence: string
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          due_at: string
          id: string
          internal_target_at: string
          notified_due_day: boolean
          obligation_id: string
          status: Database["public"]["Enums"]["instance_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          competence: string
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          due_at: string
          id?: string
          internal_target_at: string
          notified_due_day?: boolean
          obligation_id: string
          status?: Database["public"]["Enums"]["instance_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          competence?: string
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          due_at?: string
          id?: string
          internal_target_at?: string
          notified_due_day?: boolean
          obligation_id?: string
          status?: Database["public"]["Enums"]["instance_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obligation_instances_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obligation_instances_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "obligations"
            referencedColumns: ["id"]
          },
        ]
      }
      obligations: {
        Row: {
          created_at: string
          frequency: Database["public"]["Enums"]["frequency_type"]
          id: string
          internal_target_day: number
          legal_due_rule: number | null
          name: string
          notes: string | null
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          frequency: Database["public"]["Enums"]["frequency_type"]
          id?: string
          internal_target_day: number
          legal_due_rule?: number | null
          name: string
          notes?: string | null
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          frequency?: Database["public"]["Enums"]["frequency_type"]
          id?: string
          internal_target_day?: number
          legal_due_rule?: number | null
          name?: string
          notes?: string | null
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obligations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_invite_tokens: {
        Row: {
          client_id: string
          created_at: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_invite_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          cep: string | null
          city: string | null
          client_id: string
          complement: string | null
          created_at: string
          created_via: Database["public"]["Enums"]["created_via"]
          document: string | null
          email: string
          financial_responsible_cpf: string | null
          has_financial_responsible: boolean
          id: string
          is_foreign_payment: boolean
          name: string
          neighborhood: string | null
          number: string | null
          phone: string
          state: string | null
          type: Database["public"]["Enums"]["patient_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          cep?: string | null
          city?: string | null
          client_id: string
          complement?: string | null
          created_at?: string
          created_via?: Database["public"]["Enums"]["created_via"]
          document?: string | null
          email: string
          financial_responsible_cpf?: string | null
          has_financial_responsible?: boolean
          id?: string
          is_foreign_payment?: boolean
          name: string
          neighborhood?: string | null
          number?: string | null
          phone: string
          state?: string | null
          type?: Database["public"]["Enums"]["patient_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          cep?: string | null
          city?: string | null
          client_id?: string
          complement?: string | null
          created_at?: string
          created_via?: Database["public"]["Enums"]["created_via"]
          document?: string | null
          email?: string
          financial_responsible_cpf?: string | null
          has_financial_responsible?: boolean
          id?: string
          is_foreign_payment?: boolean
          name?: string
          neighborhood?: string | null
          number?: string | null
          phone?: string
          state?: string | null
          type?: Database["public"]["Enums"]["patient_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      staging_uploads: {
        Row: {
          amount: number | null
          client_id: string | null
          competence: string | null
          created_at: string
          due_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          obligation_id: string | null
          org_id: string
          state: Database["public"]["Enums"]["upload_state"]
          uploaded_by: string
        }
        Insert: {
          amount?: number | null
          client_id?: string | null
          competence?: string | null
          created_at?: string
          due_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          obligation_id?: string | null
          org_id: string
          state?: Database["public"]["Enums"]["upload_state"]
          uploaded_by: string
        }
        Update: {
          amount?: number | null
          client_id?: string | null
          competence?: string | null
          created_at?: string
          due_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          obligation_id?: string | null
          org_id?: string
          state?: Database["public"]["Enums"]["upload_state"]
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "staging_uploads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staging_uploads_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "obligations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staging_uploads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      client_in_user_org: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      communication_in_user_org: {
        Args: { _communication_id: string; _user_id: string }
        Returns: boolean
      }
      get_user_org: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client"
      client_status: "active" | "archived"
      created_via: "manual" | "invite_link"
      delivery_state: "sent" | "delivered" | "bounced" | "failed"
      email_event_type:
        | "sent"
        | "delivered"
        | "bounced"
        | "opened"
        | "clicked"
        | "spam"
      frequency_type: "weekly" | "monthly" | "annual"
      instance_status:
        | "pending"
        | "due_48h"
        | "on_time_done"
        | "overdue"
        | "late_done"
      patient_type: "pf" | "pj"
      upload_state: "pending" | "classified" | "sent" | "error"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "client"],
      client_status: ["active", "archived"],
      created_via: ["manual", "invite_link"],
      delivery_state: ["sent", "delivered", "bounced", "failed"],
      email_event_type: [
        "sent",
        "delivered",
        "bounced",
        "opened",
        "clicked",
        "spam",
      ],
      frequency_type: ["weekly", "monthly", "annual"],
      instance_status: [
        "pending",
        "due_48h",
        "on_time_done",
        "overdue",
        "late_done",
      ],
      patient_type: ["pf", "pj"],
      upload_state: ["pending", "classified", "sent", "error"],
    },
  },
} as const
