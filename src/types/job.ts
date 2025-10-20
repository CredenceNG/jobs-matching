/**
 * Job-related types for the JobAI platform
 *
 * @description Comprehensive job data structure including scraped jobs,
 * search filters, matching scores, and application tracking
 */

export interface Job {
  id: string;

  // Basic job information
  title: string;
  company: string;
  company_logo?: string;
  location: string;
  is_remote: boolean;
  job_type: "full_time" | "part_time" | "contract" | "internship" | "temporary";

  // Job details
  description: string;
  requirements: string[];
  nice_to_have?: string[];
  benefits?: string[];

  // Salary information
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  salary_period: "hourly" | "daily" | "weekly" | "monthly" | "yearly";

  // Experience and seniority
  experience_level: "entry" | "mid" | "senior" | "lead" | "executive";
  experience_years_min?: number;
  experience_years_max?: number;

  // Technologies and skills
  required_skills: string[];
  preferred_skills?: string[];
  technologies: string[];

  // Posting information
  posted_date: string;
  expires_date?: string;
  apply_url: string;
  company_website?: string;

  // Scraped data metadata
  source: JobSource;
  source_job_id: string;
  last_scraped: string;

  // AI-generated fields
  ai_summary?: string;
  difficulty_score?: number; // 1-10 based on requirements

  // Internal tracking
  created_at: string;
  updated_at: string;
  is_active: boolean;
  view_count: number;
}

export type JobSource =
  | "indeed"
  | "linkedin"
  | "glassdoor"
  | "remote_ok"
  | "stackoverflow"
  | "dice"
  | "ziprecruiter";

export interface JobSearchFilters {
  // Text search
  keywords?: string;
  title?: string;
  company?: string;

  // Location filters
  location?: string;
  radius?: number; // miles
  remote_only?: boolean;

  // Job type filters
  job_types?: ("full_time" | "part_time" | "contract" | "internship")[];
  experience_levels?: ("entry" | "mid" | "senior" | "lead" | "executive")[];

  // Salary filters
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;

  // Date filters
  posted_within_days?: number;

  // Skills and technology
  required_skills?: string[];
  technologies?: string[];

  // Company filters
  company_size?: ("startup" | "small" | "medium" | "large" | "enterprise")[];

  // Additional filters
  has_salary_info?: boolean;
  visa_sponsorship?: boolean;
}

export interface JobSearchResult {
  jobs: Job[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
  filters_applied: JobSearchFilters;
  search_duration_ms: number;
}

export interface JobMatch {
  id: string;
  user_id: string;
  job_id: string;

  // AI matching results
  match_score: number; // 0-100
  match_explanation: string;

  // Detailed matching breakdown
  skills_match: SkillMatch[];
  experience_match: ExperienceMatch;
  location_match: LocationMatch;
  salary_match?: SalaryMatch;

  // Overall assessment
  strengths: string[];
  concerns: string[];
  recommendations: string[];

  // Metadata
  ai_model_used: "claude" | "openai";
  generated_at: string;
  cost_usd?: number;

  created_at: string;
}

export interface SkillMatch {
  skill: string;
  user_has: boolean;
  proficiency_level?: "beginner" | "intermediate" | "advanced" | "expert";
  is_required: boolean;
  match_confidence: number; // 0-1
  alternative_skills?: string[]; // Similar skills user has
}

export interface ExperienceMatch {
  years_required_min?: number;
  years_required_max?: number;
  user_years: number;
  level_required: "entry" | "mid" | "senior" | "lead" | "executive";
  user_level: "entry" | "mid" | "senior" | "lead" | "executive";
  match_score: number; // 0-100
  assessment: string;
}

export interface LocationMatch {
  job_location: string;
  user_preferred_locations: string[];
  is_remote: boolean;
  user_remote_preference: "remote_only" | "hybrid" | "onsite" | "no_preference";
  commute_time_minutes?: number;
  match_score: number; // 0-100
}

export interface SalaryMatch {
  job_salary_min?: number;
  job_salary_max?: number;
  user_expectation_min?: number;
  user_expectation_max?: number;
  currency: string;
  match_assessment:
    | "below_expectation"
    | "meets_expectation"
    | "exceeds_expectation"
    | "unknown";
  negotiation_potential: number; // 0-100
}

// Job application tracking
export interface JobApplication {
  id: string;
  user_id: string;
  job_id: string;

  // Application status
  status:
    | "saved"
    | "applied"
    | "screening"
    | "interviewing"
    | "offer"
    | "rejected"
    | "withdrawn";
  applied_date?: string;

  // Application materials
  cover_letter_id?: string;
  resume_version?: string;
  portfolio_url?: string;

  // Interview tracking
  interviews: Interview[];

  // Notes and follow-ups
  notes?: string;
  next_action?: string;
  next_action_date?: string;

  // External tracking
  external_application_id?: string;
  recruiter_contact?: string;

  created_at: string;
  updated_at: string;
}

export interface Interview {
  id: string;
  application_id: string;

  // Interview details
  type: "phone" | "video" | "onsite" | "technical" | "behavioral";
  scheduled_date: string;
  duration_minutes: number;

  // Participants
  interviewer_name?: string;
  interviewer_title?: string;
  interviewer_email?: string;

  // Preparation and results
  preparation_notes?: string;
  questions_asked?: string[];
  user_answers?: string[];
  feedback_received?: string;

  // Outcome
  result: "pending" | "passed" | "failed" | "rescheduled" | "canceled";
  next_steps?: string;

  created_at: string;
  updated_at: string;
}

// Saved job searches with alerts
export interface SavedSearch {
  id: string;
  user_id: string;

  // Search configuration
  name: string;
  filters: JobSearchFilters;

  // Alert settings
  email_alerts: boolean;
  sms_alerts: boolean;
  alert_frequency: "instant" | "daily" | "weekly";
  minimum_match_score: number;

  // Tracking
  last_checked: string;
  new_matches_count: number;
  total_matches_found: number;

  // Activity
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Job scraping metadata
export interface ScrapingSession {
  id: string;
  source: JobSource;
  started_at: string;
  completed_at?: string;

  // Results
  jobs_found: number;
  jobs_new: number;
  jobs_updated: number;
  errors_count: number;

  // Performance
  duration_seconds: number;
  pages_scraped: number;
  requests_made: number;

  // Status
  status: "running" | "completed" | "failed" | "canceled";
  error_message?: string;

  // Configuration used
  filters_applied?: JobSearchFilters;
  max_pages?: number;
  delay_between_requests_ms: number;
}

export interface JobScrapingError {
  id: string;
  session_id: string;
  source: JobSource;

  // Error details
  error_type:
    | "network"
    | "parsing"
    | "rate_limit"
    | "blocked"
    | "captcha"
    | "other";
  error_message: string;
  stack_trace?: string;

  // Context
  url?: string;
  page_number?: number;
  job_data?: Partial<Job>;

  created_at: string;
}
