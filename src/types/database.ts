/**
 * Database types for Supabase integration
 *
 * @description Generated types matching the Supabase schema
 * with comprehensive type safety for all database operations
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
          full_name: string | null;
          profile_picture: string | null;
          is_premium: boolean;
          subscription_id: string | null;
          subscription_status: string | null;
          subscription_end_date: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string | null;
          profile_picture?: string | null;
          is_premium?: boolean;
          subscription_id?: string | null;
          subscription_status?: string | null;
          subscription_end_date?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string | null;
          profile_picture?: string | null;
          is_premium?: boolean;
          subscription_id?: string | null;
          subscription_status?: string | null;
          subscription_end_date?: string | null;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          location: string | null;
          title: string | null;
          summary: string | null;
          experience_years: number | null;
          salary_expectation_min: number | null;
          salary_expectation_max: number | null;
          skills: any; // JSON array
          work_experience: any; // JSON array
          education: any; // JSON array
          resume_url: string | null;
          resume_parsed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          location?: string | null;
          title?: string | null;
          summary?: string | null;
          experience_years?: number | null;
          salary_expectation_min?: number | null;
          salary_expectation_max?: number | null;
          skills?: any;
          work_experience?: any;
          education?: any;
          resume_url?: string | null;
          resume_parsed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          location?: string | null;
          title?: string | null;
          summary?: string | null;
          experience_years?: number | null;
          salary_expectation_min?: number | null;
          salary_expectation_max?: number | null;
          skills?: any;
          work_experience?: any;
          education?: any;
          resume_url?: string | null;
          resume_parsed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_quotas: {
        Row: {
          id: string;
          user_id: string;
          job_matches_used: number;
          job_matches_limit: number;
          cover_letters_used: number;
          cover_letters_limit: number;
          interview_prep_used: number;
          interview_prep_limit: number;
          resume_parses_used: number;
          resume_parses_limit: number;
          ai_insights_generated: number;
          ai_insights_limit: number;
          daily_job_searches: number;
          daily_search_limit: number;
          monthly_reset_date: string;
          daily_reset_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_matches_used?: number;
          job_matches_limit?: number;
          cover_letters_used?: number;
          cover_letters_limit?: number;
          interview_prep_used?: number;
          interview_prep_limit?: number;
          resume_parses_used?: number;
          resume_parses_limit?: number;
          ai_insights_generated?: number;
          ai_insights_limit?: number;
          daily_job_searches?: number;
          daily_search_limit?: number;
          monthly_reset_date?: string;
          daily_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_matches_used?: number;
          job_matches_limit?: number;
          cover_letters_used?: number;
          cover_letters_limit?: number;
          interview_prep_used?: number;
          interview_prep_limit?: number;
          resume_parses_used?: number;
          resume_parses_limit?: number;
          ai_insights_generated?: number;
          ai_insights_limit?: number;
          daily_job_searches?: number;
          daily_search_limit?: number;
          monthly_reset_date?: string;
          daily_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          title: string;
          company: string;
          company_logo: string | null;
          location: string;
          is_remote: boolean;
          job_type: string;
          description: string;
          requirements: string[]; // Array of strings
          nice_to_have: string[] | null;
          benefits: string[] | null;
          salary_min: number | null;
          salary_max: number | null;
          salary_currency: string;
          salary_period: string;
          experience_level: string;
          experience_years_min: number | null;
          experience_years_max: number | null;
          required_skills: string[];
          preferred_skills: string[] | null;
          technologies: string[];
          posted_date: string;
          expires_date: string | null;
          apply_url: string;
          company_website: string | null;
          source: string;
          source_job_id: string;
          last_scraped: string;
          ai_summary: string | null;
          difficulty_score: number | null;
          created_at: string;
          updated_at: string;
          is_active: boolean;
          view_count: number;
        };
        Insert: {
          id?: string;
          title: string;
          company: string;
          company_logo?: string | null;
          location: string;
          is_remote?: boolean;
          job_type: string;
          description: string;
          requirements: string[];
          nice_to_have?: string[] | null;
          benefits?: string[] | null;
          salary_min?: number | null;
          salary_max?: number | null;
          salary_currency?: string;
          salary_period?: string;
          experience_level: string;
          experience_years_min?: number | null;
          experience_years_max?: number | null;
          required_skills: string[];
          preferred_skills?: string[] | null;
          technologies?: string[];
          posted_date: string;
          expires_date?: string | null;
          apply_url: string;
          company_website?: string | null;
          source: string;
          source_job_id: string;
          last_scraped?: string;
          ai_summary?: string | null;
          difficulty_score?: number | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          view_count?: number;
        };
        Update: {
          id?: string;
          title?: string;
          company?: string;
          company_logo?: string | null;
          location?: string;
          is_remote?: boolean;
          job_type?: string;
          description?: string;
          requirements?: string[];
          nice_to_have?: string[] | null;
          benefits?: string[] | null;
          salary_min?: number | null;
          salary_max?: number | null;
          salary_currency?: string;
          salary_period?: string;
          experience_level?: string;
          experience_years_min?: number | null;
          experience_years_max?: number | null;
          required_skills?: string[];
          preferred_skills?: string[] | null;
          technologies?: string[];
          posted_date?: string;
          expires_date?: string | null;
          apply_url?: string;
          company_website?: string | null;
          source?: string;
          source_job_id?: string;
          last_scraped?: string;
          ai_summary?: string | null;
          difficulty_score?: number | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          view_count?: number;
        };
      };
      job_matches: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          match_score: number;
          match_explanation: string;
          skills_match: any; // JSON
          experience_match: any; // JSON
          location_match: any; // JSON
          salary_match: any; // JSON
          strengths: string[];
          concerns: string[];
          recommendations: string[];
          ai_model_used: string;
          generated_at: string;
          cost_usd: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id: string;
          match_score: number;
          match_explanation: string;
          skills_match: any;
          experience_match: any;
          location_match: any;
          salary_match?: any;
          strengths: string[];
          concerns: string[];
          recommendations: string[];
          ai_model_used: string;
          generated_at?: string;
          cost_usd?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string;
          match_score?: number;
          match_explanation?: string;
          skills_match?: any;
          experience_match?: any;
          location_match?: any;
          salary_match?: any;
          strengths?: string[];
          concerns?: string[];
          recommendations?: string[];
          ai_model_used?: string;
          generated_at?: string;
          cost_usd?: number | null;
          created_at?: string;
        };
      };
      saved_searches: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          filters: any; // JSON
          email_alerts: boolean;
          sms_alerts: boolean;
          alert_frequency: string;
          minimum_match_score: number;
          last_checked: string;
          new_matches_count: number;
          total_matches_found: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          filters: any;
          email_alerts?: boolean;
          sms_alerts?: boolean;
          alert_frequency?: string;
          minimum_match_score?: number;
          last_checked?: string;
          new_matches_count?: number;
          total_matches_found?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          filters?: any;
          email_alerts?: boolean;
          sms_alerts?: boolean;
          alert_frequency?: string;
          minimum_match_score?: number;
          last_checked?: string;
          new_matches_count?: number;
          total_matches_found?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      job_applications: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          status: string;
          applied_date: string | null;
          cover_letter_id: string | null;
          resume_version: string | null;
          portfolio_url: string | null;
          interviews: any; // JSON array
          notes: string | null;
          next_action: string | null;
          next_action_date: string | null;
          external_application_id: string | null;
          recruiter_contact: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id: string;
          status?: string;
          applied_date?: string | null;
          cover_letter_id?: string | null;
          resume_version?: string | null;
          portfolio_url?: string | null;
          interviews?: any;
          notes?: string | null;
          next_action?: string | null;
          next_action_date?: string | null;
          external_application_id?: string | null;
          recruiter_contact?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string;
          status?: string;
          applied_date?: string | null;
          cover_letter_id?: string | null;
          resume_version?: string | null;
          portfolio_url?: string | null;
          interviews?: any;
          notes?: string | null;
          next_action?: string | null;
          next_action_date?: string | null;
          external_application_id?: string | null;
          recruiter_contact?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_requests: {
        Row: {
          id: string;
          user_id: string | null;
          model: string;
          feature: string;
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
          cost_usd: number;
          response_time_ms: number;
          cached: boolean;
          cache_hit_key: string | null;
          input_data: any; // JSON
          output_data: any; // JSON
          status: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          model: string;
          feature: string;
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
          cost_usd: number;
          response_time_ms: number;
          cached?: boolean;
          cache_hit_key?: string | null;
          input_data: any;
          output_data: any;
          status: string;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          model?: string;
          feature?: string;
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
          cost_usd?: number;
          response_time_ms?: number;
          cached?: boolean;
          cache_hit_key?: string | null;
          input_data?: any;
          output_data?: any;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
      };
      cache_entries: {
        Row: {
          key: string;
          value: any; // JSON
          ttl_seconds: number;
          created_at: string;
          expires_at: string;
          hit_count: number;
          last_accessed: string;
          size_bytes: number;
        };
        Insert: {
          key: string;
          value: any;
          ttl_seconds: number;
          created_at?: string;
          expires_at: string;
          hit_count?: number;
          last_accessed?: string;
          size_bytes: number;
        };
        Update: {
          key?: string;
          value?: any;
          ttl_seconds?: number;
          created_at?: string;
          expires_at?: string;
          hit_count?: number;
          last_accessed?: string;
          size_bytes?: number;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      job_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "internship"
        | "temporary";
      experience_level: "entry" | "mid" | "senior" | "lead" | "executive";
      application_status:
        | "saved"
        | "applied"
        | "screening"
        | "interviewing"
        | "offer"
        | "rejected"
        | "withdrawn";
      ai_model: "claude-3-sonnet-20241022" | "gpt-4o-mini" | "gpt-4o";
      ai_feature:
        | "job_matching"
        | "resume_parsing"
        | "cover_letter_generation"
        | "interview_preparation"
        | "career_insights"
        | "salary_analysis";
    };
  };
}

// Helper types for database operations
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

// Commonly used types
export type DbUser = Tables<"users">;
export type DbUserProfile = Tables<"user_profiles">;
export type DbJob = Tables<"jobs">;
export type DbJobMatch = Tables<"job_matches">;
export type DbSavedSearch = Tables<"saved_searches">;
export type DbJobApplication = Tables<"job_applications">;
export type DbAIRequest = Tables<"ai_requests">;
export type DbCacheEntry = Tables<"cache_entries">;

// Auth helper types (for compatibility with our new schema)
export type User = DbUser & {
  onboarding_completed?: boolean;
  subscription_expires_at?: string | null;
};

export type SubscriptionStatus = "free" | "premium" | "trial" | "cancelled";
