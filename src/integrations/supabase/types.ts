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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      candidates: {
        Row: {
          created_at: string
          created_by: string | null
          current_company: string | null
          current_designation: string | null
          current_salary: number | null
          education: string | null
          email: string | null
          expected_salary: number | null
          experience_years: number | null
          full_name: string
          id: string
          location: string | null
          notes: string | null
          notice_period: string | null
          phone: string | null
          resume_parsed: Json | null
          resume_url: string | null
          skills: string[] | null
          source: string | null
          status: Database["public"]["Enums"]["candidate_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_company?: string | null
          current_designation?: string | null
          current_salary?: number | null
          education?: string | null
          email?: string | null
          expected_salary?: number | null
          experience_years?: number | null
          full_name: string
          id?: string
          location?: string | null
          notes?: string | null
          notice_period?: string | null
          phone?: string | null
          resume_parsed?: Json | null
          resume_url?: string | null
          skills?: string[] | null
          source?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_company?: string | null
          current_designation?: string | null
          current_salary?: number | null
          education?: string | null
          email?: string | null
          expected_salary?: number | null
          experience_years?: number | null
          full_name?: string
          id?: string
          location?: string | null
          notes?: string | null
          notice_period?: string | null
          phone?: string | null
          resume_parsed?: Json | null
          resume_url?: string | null
          skills?: string[] | null
          source?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          industry: string | null
          is_active: boolean
          location: string | null
          logo_url: string | null
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          location?: string | null
          logo_url?: string | null
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          location?: string | null
          logo_url?: string | null
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_contacts: {
        Row: {
          company_id: string
          created_at: string
          designation: string | null
          email: string | null
          id: string
          is_primary: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          designation?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          designation?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          body: string
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          recipient_email: string
          recipient_name: string | null
          related_candidate_id: string | null
          related_job_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["email_status"]
          subject: string
          template_type: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          body: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          recipient_email: string
          recipient_name?: string | null
          related_candidate_id?: string | null
          related_job_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject: string
          template_type?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          body?: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          recipient_email?: string
          recipient_name?: string | null
          related_candidate_id?: string | null
          related_job_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string
          template_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_related_candidate_id_fkey"
            columns: ["related_candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_queue_related_job_id_fkey"
            columns: ["related_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      hired_candidates: {
        Row: {
          candidate_id: string
          company_id: string | null
          created_at: string
          created_by: string | null
          fee_percentage: number | null
          fee_status: string | null
          id: string
          job_id: string
          joining_date: string | null
          notes: string | null
          offer_date: string | null
          offer_salary: number | null
          placement_fee: number | null
          updated_at: string
        }
        Insert: {
          candidate_id: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          fee_percentage?: number | null
          fee_status?: string | null
          id?: string
          job_id: string
          joining_date?: string | null
          notes?: string | null
          offer_date?: string | null
          offer_salary?: number | null
          placement_fee?: number | null
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          fee_percentage?: number | null
          fee_status?: string | null
          id?: string
          job_id?: string
          joining_date?: string | null
          notes?: string | null
          offer_date?: string | null
          offer_salary?: number | null
          placement_fee?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hired_candidates_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hired_candidates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hired_candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_pipeline: {
        Row: {
          candidate_id: string
          contact_id: string | null
          created_at: string
          created_by: string | null
          feedback: string | null
          id: string
          job_id: string
          review_token: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["hr_pipeline_status"]
          updated_at: string
        }
        Insert: {
          candidate_id: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          feedback?: string | null
          id?: string
          job_id: string
          review_token?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["hr_pipeline_status"]
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          feedback?: string | null
          id?: string
          job_id?: string
          review_token?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["hr_pipeline_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_pipeline_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_pipeline_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_pipeline_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          candidate_id: string
          created_at: string
          created_by: string | null
          duration_minutes: number | null
          feedback: string | null
          id: string
          interview_type: string | null
          interviewers: string[] | null
          job_id: string
          location: string | null
          meeting_link: string | null
          notes: string | null
          rating: number | null
          scheduled_at: string
          status: Database["public"]["Enums"]["interview_status"]
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interview_type?: string | null
          interviewers?: string[] | null
          job_id: string
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          rating?: number | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["interview_status"]
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interview_type?: string | null
          interviewers?: string[] | null
          job_id?: string
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          rating?: number | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["interview_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          experience_max: number | null
          experience_min: number | null
          id: string
          job_type: string | null
          location: string | null
          openings: number | null
          priority: Database["public"]["Enums"]["job_priority"]
          requirements: string | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          skills: string[] | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          experience_max?: number | null
          experience_min?: number | null
          id?: string
          job_type?: string | null
          location?: string | null
          openings?: number | null
          priority?: Database["public"]["Enums"]["job_priority"]
          requirements?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          experience_max?: number | null
          experience_min?: number | null
          id?: string
          job_type?: string | null
          location?: string | null
          openings?: number | null
          priority?: Database["public"]["Enums"]["job_priority"]
          requirements?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          candidate_id: string
          created_at: string
          education_score: number | null
          experience_score: number | null
          id: string
          job_id: string
          location_score: number | null
          matched_by: string | null
          notes: string | null
          overall_score: number | null
          salary_score: number | null
          score_breakdown: Json | null
          skill_score: number | null
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          education_score?: number | null
          experience_score?: number | null
          id?: string
          job_id: string
          location_score?: number | null
          matched_by?: string | null
          notes?: string | null
          overall_score?: number | null
          salary_score?: number | null
          score_breakdown?: Json | null
          skill_score?: number | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          education_score?: number | null
          experience_score?: number | null
          id?: string
          job_id?: string
          location_score?: number | null
          matched_by?: string | null
          notes?: string | null
          overall_score?: number | null
          salary_score?: number | null
          score_breakdown?: Json | null
          skill_score?: number | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      money_alerts: {
        Row: {
          alert_type: string
          amount: number | null
          created_at: string
          created_by: string | null
          due_date: string | null
          hired_candidate_id: string | null
          id: string
          is_resolved: boolean
          notes: string | null
          updated_at: string
        }
        Insert: {
          alert_type: string
          amount?: number | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          hired_candidate_id?: string | null
          id?: string
          is_resolved?: boolean
          notes?: string | null
          updated_at?: string
        }
        Update: {
          alert_type?: string
          amount?: number | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          hired_candidate_id?: string | null
          id?: string
          is_resolved?: boolean
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "money_alerts_hired_candidate_id_fkey"
            columns: ["hired_candidate_id"]
            isOneToOne: false
            referencedRelation: "hired_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      todos: {
        Row: {
          assigned_to: string | null
          checklist: Json | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean
          is_sequential: boolean
          notes: string | null
          order_index: number | null
          priority: Database["public"]["Enums"]["todo_priority"]
          related_candidate_id: string | null
          related_company_id: string | null
          related_job_id: string | null
          title: string
          type: Database["public"]["Enums"]["todo_type"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          checklist?: Json | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          is_sequential?: boolean
          notes?: string | null
          order_index?: number | null
          priority?: Database["public"]["Enums"]["todo_priority"]
          related_candidate_id?: string | null
          related_company_id?: string | null
          related_job_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["todo_type"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          checklist?: Json | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          is_sequential?: boolean
          notes?: string | null
          order_index?: number | null
          priority?: Database["public"]["Enums"]["todo_priority"]
          related_candidate_id?: string | null
          related_company_id?: string | null
          related_job_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["todo_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_related_candidate_id_fkey"
            columns: ["related_candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_related_company_id_fkey"
            columns: ["related_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_related_job_id_fkey"
            columns: ["related_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verifications: {
        Row: {
          candidate_id: string
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          verification_type: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          candidate_id: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          verification_type?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          candidate_id?: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          verification_type?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verifications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_min_role: {
        Args: {
          _min_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "hr_manager" | "recruiter"
      candidate_status:
        | "new"
        | "screening"
        | "shortlisted"
        | "interview"
        | "offered"
        | "hired"
        | "rejected"
        | "on_hold"
      email_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "sent"
        | "failed"
      hr_pipeline_status:
        | "pending"
        | "sent"
        | "reviewed"
        | "accepted"
        | "rejected"
        | "opted_out"
      interview_status: "scheduled" | "completed" | "cancelled" | "no_show"
      job_priority: "low" | "medium" | "high" | "urgent"
      job_status: "draft" | "open" | "on_hold" | "closed" | "filled"
      match_status: "new" | "reviewed" | "shortlisted" | "rejected" | "hired"
      todo_priority: "low" | "medium" | "high" | "critical"
      todo_type:
        | "general"
        | "interview_docs"
        | "company_contacts"
        | "background_verification"
      verification_status: "pending" | "email_sent" | "verified" | "rejected"
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
      app_role: ["super_admin", "admin", "hr_manager", "recruiter"],
      candidate_status: [
        "new",
        "screening",
        "shortlisted",
        "interview",
        "offered",
        "hired",
        "rejected",
        "on_hold",
      ],
      email_status: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "sent",
        "failed",
      ],
      hr_pipeline_status: [
        "pending",
        "sent",
        "reviewed",
        "accepted",
        "rejected",
        "opted_out",
      ],
      interview_status: ["scheduled", "completed", "cancelled", "no_show"],
      job_priority: ["low", "medium", "high", "urgent"],
      job_status: ["draft", "open", "on_hold", "closed", "filled"],
      match_status: ["new", "reviewed", "shortlisted", "rejected", "hired"],
      todo_priority: ["low", "medium", "high", "critical"],
      todo_type: [
        "general",
        "interview_docs",
        "company_contacts",
        "background_verification",
      ],
      verification_status: ["pending", "email_sent", "verified", "rejected"],
    },
  },
} as const
