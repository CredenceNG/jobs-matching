/**
 * AI service types for Claude, OpenAI integrations and cost tracking
 *
 * @description Comprehensive types for AI-powered features including
 * job matching, resume parsing, cover letter generation, and analytics
 */

export type AIModel = "claude-3-sonnet-20241022" | "gpt-4o-mini" | "gpt-4o";

export interface AIRequest {
  id: string;
  user_id?: string;

  // Request details
  model: AIModel;
  feature: AIFeature;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;

  // Cost tracking
  cost_usd: number;

  // Performance
  response_time_ms: number;
  cached: boolean;
  cache_hit_key?: string;

  // Request/Response data
  input_data: Record<string, any>;
  output_data: Record<string, any>;

  // Status
  status: "success" | "error" | "timeout" | "rate_limited";
  error_message?: string;

  created_at: string;
}

export type AIFeature =
  | "job_matching"
  | "resume_parsing"
  | "cover_letter_generation"
  | "interview_preparation"
  | "career_insights"
  | "salary_analysis"
  | "skill_assessment";

export interface JobMatchingRequest {
  user_profile: {
    skills: string[];
    experience_years: number;
    experience_level: string;
    preferred_locations: string[];
    salary_expectation?: { min: number; max: number };
  };
  job: {
    title: string;
    description: string;
    requirements: string[];
    location: string;
    salary_range?: { min: number; max: number };
    experience_required: string;
  };
}

export interface JobMatchingResponse {
  match_score: number; // 0-100
  explanation: string;
  skills_analysis: {
    matching_skills: string[];
    missing_skills: string[];
    transferable_skills: string[];
  };
  experience_assessment: string;
  location_compatibility: string;
  salary_assessment?: string;
  recommendations: string[];
  confidence_score: number; // 0-1
}

export interface ResumeParsingRequest {
  file_content: string;
  file_type: "pdf" | "docx" | "txt";
  file_name: string;
}

export interface ResumeParsingResponse {
  personal_info: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  professional_summary?: string;
  skills: {
    technical: string[];
    soft_skills: string[];
    languages: string[];
    certifications: string[];
  };
  work_experience: Array<{
    company: string;
    title: string;
    start_date: string;
    end_date?: string;
    description: string;
    technologies?: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    start_date?: string;
    end_date?: string;
    gpa?: string;
  }>;
  confidence_score: number; // 0-1
  parsing_notes: string[];
}

export interface CoverLetterRequest {
  user_profile: {
    name: string;
    experience_summary: string;
    key_skills: string[];
    work_history: Array<{
      company: string;
      title: string;
      achievements: string[];
    }>;
  };
  job: {
    title: string;
    company: string;
    description: string;
    requirements: string[];
  };
  company_research?: {
    mission?: string;
    values?: string[];
    culture_notes?: string;
  };
  tone: "professional" | "friendly" | "enthusiastic" | "formal";
  length: "short" | "medium" | "long";
}

export interface CoverLetterResponse {
  cover_letter: string;
  key_points_highlighted: string[];
  word_count: number;
  readability_score: number;
  suggestions: string[];
}

export interface InterviewPrepRequest {
  job: {
    title: string;
    company: string;
    description: string;
    requirements: string[];
    level: string;
  };
  user_profile: {
    experience_level: string;
    relevant_experience: string[];
    skills: string[];
  };
  interview_type: "behavioral" | "technical" | "system_design" | "general";
}

export interface InterviewPrepResponse {
  likely_questions: Array<{
    question: string;
    category: "behavioral" | "technical" | "company" | "role_specific";
    difficulty: "easy" | "medium" | "hard";
    sample_answer?: string;
    key_points: string[];
  }>;
  star_method_examples: Array<{
    situation: string;
    task: string;
    action: string;
    result: string;
    relevant_to: string;
  }>;
  technical_topics?: string[];
  company_research_suggestions: string[];
  preparation_timeline: Array<{
    timeframe: string;
    activities: string[];
  }>;
}

export interface CareerInsightRequest {
  user_profile: {
    current_title?: string;
    experience_years: number;
    skills: string[];
    location: string;
    industry?: string;
  };
  job_search_history: Array<{
    searched_roles: string[];
    applied_count: number;
    interview_count: number;
    offer_count: number;
  }>;
  market_context: {
    trending_skills: string[];
    growth_sectors: string[];
    salary_trends: Record<string, number>;
  };
}

export interface CareerInsightResponse {
  insights: Array<{
    type: "skill_gap" | "market_trend" | "career_path" | "salary_optimization";
    title: string;
    description: string;
    action_items: string[];
    priority: "high" | "medium" | "low";
    timeline: string;
  }>;
  skill_recommendations: Array<{
    skill: string;
    demand_score: number; // 0-100
    learning_resources: string[];
    time_to_proficiency: string;
  }>;
  market_outlook: {
    job_growth_prediction: string;
    salary_trend: "increasing" | "stable" | "decreasing";
    competition_level: "low" | "medium" | "high";
  };
}

// AI Cost tracking and budgets
export interface AICostTracker {
  user_id?: string;
  date: string; // YYYY-MM-DD

  // Usage by model
  claude_requests: number;
  claude_tokens: number;
  claude_cost_usd: number;

  openai_requests: number;
  openai_tokens: number;
  openai_cost_usd: number;

  // Usage by feature
  feature_usage: Record<
    AIFeature,
    {
      requests: number;
      tokens: number;
      cost_usd: number;
    }
  >;

  // Daily totals
  total_requests: number;
  total_tokens: number;
  total_cost_usd: number;

  // Cache performance
  cache_hits: number;
  cache_misses: number;
  cache_hit_rate: number;
  cost_saved_usd: number;
}

export interface AIBudgetAlert {
  id: string;
  user_id?: string; // null for global alerts

  // Alert configuration
  budget_type: "daily" | "monthly" | "user_monthly";
  budget_limit_usd: number;
  alert_threshold_percent: number; // Alert when X% of budget is used

  // Current status
  current_spend_usd: number;
  alert_triggered: boolean;

  // Notification settings
  notify_email: boolean;
  notify_slack?: boolean;

  created_at: string;
  updated_at: string;
}

// Cache management
export interface CacheEntry {
  key: string;
  value: any;
  ttl_seconds: number;
  created_at: string;
  expires_at: string;
  hit_count: number;
  last_accessed: string;
  size_bytes: number;
}

export interface CacheStats {
  total_entries: number;
  total_size_bytes: number;
  hit_rate: number;
  evictions_count: number;
  memory_usage_percent: number;

  // By feature
  feature_stats: Record<
    AIFeature,
    {
      entries: number;
      hit_rate: number;
      avg_ttl_hours: number;
    }
  >;
}

// Error handling
export interface AIError {
  code: string;
  message: string;
  retryable: boolean;
  retry_after_seconds?: number;
  details?: Record<string, any>;
}

export const AI_ERROR_CODES = {
  RATE_LIMITED: "rate_limited",
  INSUFFICIENT_CREDITS: "insufficient_credits",
  MODEL_UNAVAILABLE: "model_unavailable",
  INVALID_REQUEST: "invalid_request",
  CONTEXT_TOO_LONG: "context_too_long",
  CONTENT_FILTERED: "content_filtered",
  NETWORK_ERROR: "network_error",
  TIMEOUT: "timeout",
  UNKNOWN: "unknown",
} as const;
