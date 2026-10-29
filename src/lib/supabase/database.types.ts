// Gerado a partir do banco real (zofxrohoilwjtzbcruse) pela Management API.
// NÃ£o edite Ã  mÃ£o: depois de aplicar uma migration, rode
//   powershell -ExecutionPolicy Bypass -File scripts\gen-db-types.ps1

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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: never
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: never
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_history: {
        Row: {
          actor_id: string
          channel: string
          created_at: string
          creator_id: string
          id: string
          summary: string
          visible_to_creator: boolean
        }
        Insert: {
          actor_id: string
          channel: string
          created_at?: string
          creator_id: string
          id?: string
          summary: string
          visible_to_creator?: boolean
        }
        Update: {
          actor_id?: string
          channel?: string
          created_at?: string
          creator_id?: string
          id?: string
          summary?: string
          visible_to_creator?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "contact_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_history_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      creator_profiles: {
        Row: {
          biography: string | null
          categories: string[]
          city: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_reason: string | null
          public_name: string
          public_name_search: string | null
          region: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          biography?: string | null
          categories?: string[]
          city?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          public_name?: string
          public_name_search?: string | null
          region?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          biography?: string | null
          categories?: string[]
          city?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          public_name?: string
          public_name_search?: string | null
          region?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_profiles_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_requests: {
        Row: {
          created_at: string
          details: string | null
          id: string
          kind: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          kind: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          kind?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eligibility_settings: {
        Row: {
          max_story_age_days: number | null
          minimum_followers: number
          minimum_story_views: number
          required_story_evidence: number
          singleton: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          max_story_age_days?: number | null
          minimum_followers?: number
          minimum_story_views?: number
          required_story_evidence?: number
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          max_story_age_days?: number | null
          minimum_followers?: number
          minimum_story_views?: number
          required_story_evidence?: number
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eligibility_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_upload_events: {
        Row: {
          id: number
          uploaded_at: string
          user_id: string
        }
        Insert: {
          id?: never
          uploaded_at?: string
          user_id: string
        }
        Update: {
          id?: never
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_upload_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_evidence: {
        Row: {
          content_type: string
          created_at: string
          creator_id: string
          creator_notes: string | null
          id: string
          position: number
          review_reason: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          size_bytes: number
          social_account_id: string
          storage_path: string
          story_published_on: string
          updated_at: string
          views_reported: number
        }
        Insert: {
          content_type: string
          created_at?: string
          creator_id: string
          creator_notes?: string | null
          id?: string
          position: number
          review_reason?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_bytes: number
          social_account_id: string
          storage_path: string
          story_published_on: string
          updated_at?: string
          views_reported: number
        }
        Update: {
          content_type?: string
          created_at?: string
          creator_id?: string
          creator_notes?: string | null
          id?: string
          position?: number
          review_reason?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_bytes?: number
          social_account_id?: string
          storage_path?: string
          story_published_on?: string
          updated_at?: string
          views_reported?: number
        }
        Relationships: [
          {
            foreignKeyName: "metric_evidence_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "metric_evidence_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_evidence_social_account_id_creator_id_fkey"
            columns: ["social_account_id", "creator_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id", "creator_id"]
          },
          {
            foreignKeyName: "metric_evidence_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          kind: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          description: string
          key: string
        }
        Insert: {
          description: string
          key: string
        }
        Update: {
          description?: string
          key?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          consented_at: string | null
          created_at: string
          deactivated_at: string | null
          deactivated_by: string | null
          deactivation_reason: string | null
          full_name: string
          full_name_search: string | null
          id: string
          is_active: boolean
          phone: string | null
          privacy_version: string | null
          terms_version: string | null
          updated_at: string
        }
        Insert: {
          consented_at?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          full_name: string
          full_name_search?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          privacy_version?: string | null
          terms_version?: string | null
          updated_at?: string
        }
        Update: {
          consented_at?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          full_name?: string
          full_name_search?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          privacy_version?: string | null
          terms_version?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_counters: {
        Row: {
          hits: number
          key: string
          window_started_at: string
        }
        Insert: {
          hits: number
          key: string
          window_started_at: string
        }
        Update: {
          hits?: number
          key?: string
          window_started_at?: string
        }
        Relationships: []
      }
      recruiter_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          creator_id: string
          ended_at: string | null
          id: string
          recruiter_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          creator_id: string
          ended_at?: string | null
          id?: string
          recruiter_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          creator_id?: string
          ended_at?: string | null
          id?: string
          recruiter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_assignments_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "recruiter_assignments_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          creator_id: string
          ended_at: string | null
          id: string
          manager_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          creator_id: string
          ended_at?: string | null
          id?: string
          manager_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          creator_id?: string
          ended_at?: string | null
          id?: string
          manager_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationship_assignments_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "relationship_assignments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_history: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          creator_id: string
          evidence_id: string | null
          id: string
          outcome: string | null
          reason: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          creator_id: string
          evidence_id?: string | null
          id?: string
          outcome?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          creator_id?: string
          evidence_id?: string | null
          id?: string
          outcome?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_history_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "review_history_evidence_id_creator_id_fkey"
            columns: ["evidence_id", "creator_id"]
            isOneToOne: false
            referencedRelation: "metric_evidence"
            referencedColumns: ["id", "creator_id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_key: string
          role_id: number
        }
        Insert: {
          permission_key: string
          role_id: number
        }
        Update: {
          permission_key?: string
          role_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          id: number
          key: string
          label: string
        }
        Insert: {
          id?: never
          key: string
          label: string
        }
        Update: {
          id?: never
          key?: string
          label?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          presentation_video_path: string | null
          singleton: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          presentation_video_path?: string | null
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          presentation_video_path?: string | null
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          created_at: string
          creator_id: string
          followers_reported: number
          followers_reported_at: string
          handle: string
          id: string
          platform: string
          profile_url: string
          updated_at: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          followers_reported: number
          followers_reported_at?: string
          handle: string
          id?: string
          platform: string
          profile_url: string
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          followers_reported?: number
          followers_reported_at?: string
          handle?: string
          id?: string
          platform?: string
          profile_url?: string
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "social_accounts_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          body: string
          created_at: string
          creator_id: string
          id: string
          sender_id: string
          visible_to_creator: boolean
        }
        Insert: {
          body: string
          created_at?: string
          creator_id: string
          id?: string
          sender_id: string
          visible_to_creator?: boolean
        }
        Update: {
          body?: string
          created_at?: string
          creator_id?: string
          id?: string
          sender_id?: string
          visible_to_creator?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_documents: {
        Row: {
          cpf: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cpf: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cpf?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          revoked_at: string | null
          role_id: number
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          revoked_at?: string | null
          role_id: number
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          revoked_at?: string | null
          role_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      account_is_active: { Args: never; Returns: boolean }
      assign_creator_responsibles: {
        Args: {
          new_manager: string
          new_recruiter: string
          target_creator: string
        }
        Returns: undefined
      }
      can_access_creator: { Args: { target_creator: string }; Returns: boolean }
      consume_evidence_upload_quota: { Args: never; Returns: boolean }
      consume_rate_limit: {
        Args: { counter_key: string; max_hits: number; window_seconds: number }
        Returns: boolean
      }
      create_data_request: {
        Args: { request_details?: string; request_kind: string }
        Returns: string
      }
      creator_queue: {
        Args: { responsible?: string; unassigned?: boolean }
        Returns: {
          biography: string | null
          categories: string[]
          city: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_reason: string | null
          public_name: string
          public_name_search: string | null
          region: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "creator_profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      delete_own_draft_evidence: {
        Args: { target_position: number }
        Returns: string
      }
      forward_creator_to_validation: {
        Args: { target_creator: string }
        Returns: undefined
      }
      has_permission: { Args: { permission_name: string }; Returns: boolean }
      internal_dashboard_report: { Args: never; Returns: Json }
      is_valid_cpf: { Args: { value: string }; Returns: boolean }
      record_contact_event: {
        Args: {
          contact_channel: string
          contact_summary: string
          target_creator: string
          visible_to_creator?: boolean
        }
        Returns: string
      }
      record_review_decision: {
        Args: { decision: string; reason: string; target_creator: string }
        Returns: undefined
      }
      recovery_email_for_cpf: { Args: { lookup_cpf: string }; Returns: string }
      recovery_phone_hint: { Args: { lookup_email: string }; Returns: string }
      request_creator_corrections: {
        Args: { correction_reason: string; target_creator: string }
        Returns: undefined
      }
      resolve_data_request: {
        Args: { new_status: string; note?: string; request_id: string }
        Returns: undefined
      }
      review_social_account: {
        Args: { decision: string; reason?: string; target_account: string }
        Returns: undefined
      }
      review_story_evidence: {
        Args: { decision: string; evidence_id: string; reason?: string }
        Returns: undefined
      }
      search_text: { Args: { value: string }; Returns: string }
      set_own_cpf: { Args: { new_cpf: string }; Returns: undefined }
      set_user_active: {
        Args: { enabled: boolean; reason?: string; target_user: string }
        Returns: undefined
      }
      set_user_role: {
        Args: { enabled: boolean; role_key: string; target_user: string }
        Returns: undefined
      }
      submit_creator_application: { Args: never; Returns: undefined }
      update_eligibility_settings: {
        Args: {
          new_max_story_age_days?: number
          new_minimum_followers: number
          new_minimum_views: number
          new_required_evidence: number
        }
        Returns: undefined
      }
      user_id_for_email: { Args: { lookup_email: string }; Returns: string }
      withdraw_creator_application: { Args: never; Returns: undefined }
      write_audit_log: {
        Args: {
          event_action: string
          event_details?: Json
          event_entity_id: string
          event_entity_type: string
        }
        Returns: undefined
      }
      write_staff_message: {
        Args: { message_body: string; target_creator: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
