/**
 * Core user types for authentication and profile management
 *
 * @description Defines user profile structure, premium status, and usage quotas
 * for the JobAI platform with comprehensive type safety
 */

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;

  // Profile information
  full_name?: string;
  profile_picture?: string;

  // Premium subscription
  is_premium: boolean;
  subscription_id?: string;
  subscription_status?: "active" | "canceled" | "past_due" | "incomplete";
  subscription_end_date?: string;

  // Usage tracking for free tier limits
  usage_quotas: UserUsageQuotas;

  // User preferences
  preferences: UserPreferences;
}

export interface UserProfile {
  id: string;
  user_id: string;

  // Personal information
  full_name: string;
  email: string;
  phone?: string;
  location?: string;

  // Professional information
  title?: string;
  summary?: string;
  experience_years?: number;
  salary_expectation_min?: number;
  salary_expectation_max?: number;

  // Skills and technologies (parsed from resume or manually added)
  skills: UserSkill[];

  // Work history
  work_experience: WorkExperience[];

  // Education
  education: Education[];

  // Resume file reference
  resume_url?: string;
  resume_parsed_at?: string;

  created_at: string;
  updated_at: string;
}

export interface UserSkill {
  name: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  years_experience?: number;
  category: "technical" | "soft" | "language" | "certification";
}

export interface WorkExperience {
  company: string;
  title: string;
  location?: string;
  start_date: string;
  end_date?: string; // null if current
  is_current: boolean;
  description: string;
  technologies?: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field_of_study?: string;
  start_date: string;
  end_date?: string;
  gpa?: number;
  description?: string;
}

export interface UserUsageQuotas {
  // Monthly quotas (reset on subscription renewal date)
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

  // Daily quotas
  daily_job_searches: number;
  daily_search_limit: number;

  // Reset dates
  monthly_reset_date: string;
  daily_reset_date: string;
}

export interface UserPreferences {
  // Job search preferences
  preferred_locations: string[];
  remote_preference: "remote_only" | "hybrid" | "onsite" | "no_preference";
  job_types: ("full_time" | "part_time" | "contract" | "internship")[];

  // Salary preferences
  currency: string;
  salary_display_format: "range" | "minimum" | "maximum";

  // Notification preferences
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;

  // Alert preferences
  alert_frequency: "instant" | "daily" | "weekly";
  match_threshold: number; // Minimum match score to trigger alert (0-100)

  // AI preferences
  ai_explanation_detail: "brief" | "detailed";
  preferred_ai_model: "claude" | "openai" | "auto";

  // UI preferences
  theme: "light" | "dark" | "auto";
  language: string;
  timezone: string;
}

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AuthUser;
}

// Premium subscription types
export interface PremiumFeature {
  name: string;
  description: string;
  free_limit?: number;
  premium_limit?: number | "unlimited";
}

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    name: "job_matches",
    description: "AI-powered job matching with detailed explanations",
    free_limit: 50,
    premium_limit: "unlimited",
  },
  {
    name: "cover_letters",
    description: "AI-generated personalized cover letters",
    free_limit: 2,
    premium_limit: "unlimited",
  },
  {
    name: "interview_prep",
    description: "AI-powered interview preparation and practice",
    free_limit: 1,
    premium_limit: "unlimited",
  },
  {
    name: "saved_searches",
    description: "Save job searches with email/SMS alerts",
    free_limit: 0,
    premium_limit: "unlimited",
  },
  {
    name: "salary_analysis",
    description: "Detailed salary analysis and negotiation tips",
    free_limit: 0,
    premium_limit: "unlimited",
  },
];
