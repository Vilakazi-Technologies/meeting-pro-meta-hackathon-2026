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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      action_items: {
        Row: {
          business_id: string
          created_at: string
          due_date: string | null
          id: string
          is_ai_generated: boolean
          owner: string | null
          status: Database["public"]["Enums"]["action_item_status"]
          text: string
          transcript_id: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_ai_generated?: boolean
          owner?: string | null
          status?: Database["public"]["Enums"]["action_item_status"]
          text: string
          transcript_id: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_ai_generated?: boolean
          owner?: string | null
          status?: Database["public"]["Enums"]["action_item_status"]
          text?: string
          transcript_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      business_contacts: {
        Row: {
          business_id: string
          company: string | null
          created_at: string
          display_name: string
          email: string | null
          id: string
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          business_id: string
          company?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          company?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_contacts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          business_id: string
          clerk_user_id: string | null
          created_at: string
          email_minutes_enabled: boolean
          id: string
          meeting_minutes_email: string | null
          role: Database["public"]["Enums"]["member_role"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          clerk_user_id?: string | null
          created_at?: string
          email_minutes_enabled?: boolean
          id?: string
          meeting_minutes_email?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          clerk_user_id?: string | null
          created_at?: string
          email_minutes_enabled?: boolean
          id?: string
          meeting_minutes_email?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      calls: {
        Row: {
          business_id: string
          counterparty_bsuid: string | null
          counterparty_parent_bsuid: string | null
          counterparty_phone: string | null
          created_at: string
          direction: Database["public"]["Enums"]["call_direction"]
          duration_seconds: number | null
          ended_at: string | null
          id: string
          meta_call_id: string
          recording_enabled: boolean
          started_at: string | null
          status: string | null
          transcription_enabled: boolean
          updated_at: string
          whatsapp_number_id: string | null
        }
        Insert: {
          business_id: string
          counterparty_bsuid?: string | null
          counterparty_parent_bsuid?: string | null
          counterparty_phone?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["call_direction"]
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          meta_call_id: string
          recording_enabled?: boolean
          started_at?: string | null
          status?: string | null
          transcription_enabled?: boolean
          updated_at?: string
          whatsapp_number_id?: string | null
        }
        Update: {
          business_id?: string
          counterparty_bsuid?: string | null
          counterparty_parent_bsuid?: string | null
          counterparty_phone?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["call_direction"]
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          meta_call_id?: string
          recording_enabled?: boolean
          started_at?: string | null
          status?: string | null
          transcription_enabled?: boolean
          updated_at?: string
          whatsapp_number_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_whatsapp_number_id_fkey"
            columns: ["whatsapp_number_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_numbers"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          business_id: string
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          business_id: string
          color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      transcript_segments: {
        Row: {
          business_id: string
          channel: number | null
          confidence: number | null
          created_at: string
          end_seconds: number | null
          id: string
          meta_segment_id: string | null
          segment_index: number
          speaker: string | null
          start_seconds: number | null
          text: string | null
          transcript_id: string
          words: Json | null
        }
        Insert: {
          business_id: string
          channel?: number | null
          confidence?: number | null
          created_at?: string
          end_seconds?: number | null
          id?: string
          meta_segment_id?: string | null
          segment_index: number
          speaker?: string | null
          start_seconds?: number | null
          text?: string | null
          transcript_id: string
          words?: Json | null
        }
        Update: {
          business_id?: string
          channel?: number | null
          confidence?: number | null
          created_at?: string
          end_seconds?: number | null
          id?: string
          meta_segment_id?: string | null
          segment_index?: number
          speaker?: string | null
          start_seconds?: number | null
          text?: string | null
          transcript_id?: string
          words?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "transcript_segments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcript_segments_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      transcript_tags: {
        Row: {
          business_id: string
          created_at: string
          tag_id: string
          transcript_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          tag_id: string
          transcript_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          tag_id?: string
          transcript_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcript_tags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcript_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcript_tags_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          business_id: string
          call_id: string
          confidence: number | null
          created_at: string
          duration_seconds: number | null
          fetched_at: string | null
          full_text: string | null
          id: string
          language: string | null
          media_sha256: string | null
          meta_media_id: string | null
          raw: Json | null
          search_vector: unknown
          status: Database["public"]["Enums"]["transcript_status"]
          summarized_at: string | null
          summary: string | null
          summary_error: string | null
          summary_model: string | null
          summary_status: Database["public"]["Enums"]["summary_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          call_id: string
          confidence?: number | null
          created_at?: string
          duration_seconds?: number | null
          fetched_at?: string | null
          full_text?: string | null
          id?: string
          language?: string | null
          media_sha256?: string | null
          meta_media_id?: string | null
          raw?: Json | null
          search_vector?: unknown
          status?: Database["public"]["Enums"]["transcript_status"]
          summarized_at?: string | null
          summary?: string | null
          summary_error?: string | null
          summary_model?: string | null
          summary_status?: Database["public"]["Enums"]["summary_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          call_id?: string
          confidence?: number | null
          created_at?: string
          duration_seconds?: number | null
          fetched_at?: string | null
          full_text?: string | null
          id?: string
          language?: string | null
          media_sha256?: string | null
          meta_media_id?: string | null
          raw?: Json | null
          search_vector?: unknown
          status?: Database["public"]["Enums"]["transcript_status"]
          summarized_at?: string | null
          summary?: string | null
          summary_error?: string | null
          summary_model?: string | null
          summary_status?: Database["public"]["Enums"]["summary_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcripts_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: true
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          business_id: string | null
          dedupe_key: string
          error: string | null
          event_type: string
          id: string
          meta_phone_number_id: string | null
          meta_waba_id: string | null
          payload: Json
          processed_at: string | null
          received_at: string
          signature_verified: boolean
          whatsapp_number_id: string | null
        }
        Insert: {
          business_id?: string | null
          dedupe_key: string
          error?: string | null
          event_type: string
          id?: string
          meta_phone_number_id?: string | null
          meta_waba_id?: string | null
          payload: Json
          processed_at?: string | null
          received_at?: string
          signature_verified?: boolean
          whatsapp_number_id?: string | null
        }
        Update: {
          business_id?: string | null
          dedupe_key?: string
          error?: string | null
          event_type?: string
          id?: string
          meta_phone_number_id?: string | null
          meta_waba_id?: string | null
          payload?: Json
          processed_at?: string | null
          received_at?: string
          signature_verified?: boolean
          whatsapp_number_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_events_whatsapp_number_id_fkey"
            columns: ["whatsapp_number_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_numbers"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_numbers: {
        Row: {
          access_token_secret_id: string | null
          business_id: string
          created_at: string
          display_phone_number: string
          id: string
          is_active: boolean
          phone_number_id: string
          updated_at: string
          waba_id: string
        }
        Insert: {
          access_token_secret_id?: string | null
          business_id: string
          created_at?: string
          display_phone_number: string
          id?: string
          is_active?: boolean
          phone_number_id: string
          updated_at?: string
          waba_id: string
        }
        Update: {
          access_token_secret_id?: string | null
          business_id?: string
          created_at?: string
          display_phone_number?: string
          id?: string
          is_active?: boolean
          phone_number_id?: string
          updated_at?: string
          waba_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_numbers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_transcript_summary: {
        Args: {
          p_action_items: Json
          p_model: string
          p_summary: string
          p_title: string
          p_transcript_id: string
        }
        Returns: undefined
      }
      is_business_admin: { Args: { p_business_id: string }; Returns: boolean }
      is_business_member: { Args: { p_business_id: string }; Returns: boolean }
      register_whatsapp_number: {
        Args: {
          p_display_phone: string
          p_phone_number_id: string
          p_waba_id: string
          p_business_name?: string | null
        }
        Returns: string
      }
      search_transcript_ids: {
        Args: { p_query: string }
        Returns: {
          id: string
        }[]
      }
    }
    Enums: {
      action_item_status: "open" | "done" | "cancelled"
      call_direction: "business_initiated" | "user_initiated" | "unknown"
      member_role: "owner" | "admin" | "member"
      summary_status: "pending" | "ready" | "failed"
      transcript_status: "pending" | "fetching" | "ready" | "failed"
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
    Enums: {
      action_item_status: ["open", "done", "cancelled"],
      call_direction: ["business_initiated", "user_initiated", "unknown"],
      member_role: ["owner", "admin", "member"],
      summary_status: ["pending", "ready", "failed"],
      transcript_status: ["pending", "fetching", "ready", "failed"],
    },
  },
} as const
