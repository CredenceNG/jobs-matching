# JobAI Real AI Backend Implementation Plan

Based on CLAUDE.MD specifications, this is a comprehensive roadmap to transform the current UI-only Next.js app into a production-ready AI-powered job search SaaS platform.

## 🎯 Implementation Overview

**Goal**: Convert static mock job search app into real AI-powered SaaS with:

- Real AI job matching using Claude Sonnet 4.5 & GPT-4o-mini
- Live job data from web scraping (Indeed, LinkedIn, Glassdoor, RemoteOK)
- Premium subscription model ($3/month) with Stripe
- User authentication and personalized features
- Cost-optimized caching and rate limiting

**Timeline**: 6 phases over 2-3 weeks
**Budget Target**: Free tier focus, fallback $50-100/month for moderate usage

---

## 📋 Phase-by-Phase Implementation Plan

### **Phase 1: Database & Authentication Foundation** (Days 1-2)

_Priority: Critical - Everything depends on this_

#### 1.1 Supabase Setup & Configuration

```bash
# Create new Supabase project
npx supabase init
npx supabase start
```

**Tasks:**

- [ ] Create Supabase project at supabase.com
- [ ] Set up local development environment
- [ ] Configure environment variables
- [ ] Create database migrations

#### 1.2 Database Schema Design

**Tables to Create:**

```sql
-- users (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'free', -- 'free', 'premium'
  subscription_id TEXT, -- Stripe subscription ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_profiles (parsed resume data)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  resume_data JSONB, -- Parsed resume content
  skills TEXT[],
  experience_years INTEGER,
  location TEXT,
  salary_expectation NUMERIC,
  preferred_roles TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- jobs (scraped job data)
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE, -- Job ID from source
  source TEXT NOT NULL, -- 'indeed', 'linkedin', etc.
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  salary_min NUMERIC,
  salary_max NUMERIC,
  description TEXT,
  requirements TEXT[],
  posting_date TIMESTAMP WITH TIME ZONE,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- job_matches (AI-generated matches with caching)
CREATE TABLE job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  match_explanation JSONB, -- AI-generated explanation
  matched_skills TEXT[],
  missing_skills TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- saved_searches (premium feature)
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  search_criteria JSONB, -- filters, keywords, location
  alert_frequency TEXT DEFAULT 'daily', -- 'instant', 'daily', 'weekly'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ai_insights (daily generated insights)
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  insights JSONB, -- Array of insight objects
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- usage_quotas (rate limiting)
CREATE TABLE usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quota_type TEXT NOT NULL, -- 'job_matches', 'cover_letters', 'interview_prep'
  daily_count INTEGER DEFAULT 0,
  monthly_count INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quota_type)
);

-- ai_cost_tracking (cost monitoring)
CREATE TABLE ai_cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  service TEXT NOT NULL, -- 'claude', 'openai'
  model TEXT NOT NULL,
  tokens_used INTEGER,
  estimated_cost NUMERIC(10,6),
  operation_type TEXT, -- 'job_match', 'resume_parse', 'cover_letter'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 1.3 Authentication Setup

**Files to Create:**

- `lib/supabase.ts` - Supabase client configuration
- `lib/auth.ts` - Authentication helpers
- `hooks/useAuth.ts` - React hook for auth state
- `app/(auth)/login/page.tsx` - Login page
- `app/(auth)/signup/page.tsx` - Signup page

#### 1.4 Environment Configuration

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services (to be added in Phase 2)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Payments (to be added in Phase 5)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Email/SMS (to be added in Phase 5)
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

**Deliverables Phase 1:**

- ✅ Working Supabase database with all tables
- ✅ User authentication (login/signup/logout)
- ✅ Protected routes for premium features
- ✅ Database connection in Next.js app

---

### **Phase 2: AI Services Integration** (Days 3-4)

_Priority: High - Core differentiator_

#### 2.1 AI Client Setup

**Files to Create:**

```typescript
// lib/ai/anthropic.ts
import Anthropic from "@anthropic-ai/sdk";

export class ClaudeClient {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Generate job match analysis using Claude Sonnet 4.5
   * @cost ~$0.001 per match
   * @cache 24 hours
   */
  async analyzeJobMatch(
    userProfile: any,
    jobData: any
  ): Promise<JobMatchResult> {
    // Implementation with retry logic, error handling, cost tracking
  }

  /**
   * Generate cover letter using Claude
   * @cost ~$0.003 per letter
   * @premium Premium feature
   */
  async generateCoverLetter(
    userProfile: any,
    jobData: any,
    companyInfo: any
  ): Promise<string> {
    // Implementation
  }
}
```

```typescript
// lib/ai/openai.ts
import OpenAI from "openai";

export class OpenAIClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Parse resume using GPT-4o-mini for cost efficiency
   * @cost ~$0.0002 per resume
   */
  async parseResume(resumeText: string): Promise<ParsedResume> {
    // Implementation with structured output
  }

  /**
   * Generate quick insights using GPT-4o-mini
   * @cost ~$0.0005 per insight set
   */
  async generateInsights(
    userProfile: any,
    recentSearches: any[]
  ): Promise<AIInsight[]> {
    // Implementation
  }
}
```

#### 2.2 Cost Tracking & Monitoring

```typescript
// lib/ai/cost-tracker.ts
export class CostTracker {
  /**
   * Log AI API usage for cost monitoring
   */
  static async logUsage(
    userId: string,
    service: "claude" | "openai",
    model: string,
    tokensUsed: number,
    operationType: string
  ): Promise<void> {
    // Store in ai_cost_tracking table
    // Calculate estimated cost based on model pricing
    // Alert if approaching budget limits
  }

  /**
   * Get daily cost summary for monitoring
   */
  static async getDailyCosts(): Promise<CostSummary> {
    // Query cost tracking table
    // Return aggregated data
  }
}
```

#### 2.3 Caching System

```typescript
// lib/cache/cache-manager.ts
export class CacheManager {
  /**
   * Multi-layer cache: Memory (5min) → Database (24h) → Fresh AI call
   */
  static async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    // Check database cache second
    // Return null if not found (trigger fresh AI call)
  }

  static async set<T>(key: string, value: T, ttl: number): Promise<void> {
    // Store in both memory and database
    // Set appropriate TTL
  }

  /**
   * Generate cache keys for different data types
   */
  static getCacheKey(
    type: "job_match" | "user_insights" | "resume_parse",
    ...args: string[]
  ): string {
    return `${type}_${args.join("_")}`;
  }
}
```

**Deliverables Phase 2:**

- ✅ Working Claude and OpenAI clients with error handling
- ✅ Cost tracking system logging all AI usage
- ✅ Multi-layer caching system
- ✅ Comprehensive error handling with fallbacks

---

### **Phase 3: Core AI Features** (Days 5-7)

_Priority: High - Core product functionality_

#### 3.1 Job Matching Engine

```typescript
// lib/ai/job-matcher.ts
export class JobMatchingEngine {
  /**
   * Match user profile against job with AI analysis
   * Strategy: Check cache → Claude analysis → Store & return
   * @cost ~$0.001 per fresh match
   * @cache 24 hours per user-job pair
   */
  static async matchJob(
    userId: string,
    jobId: string
  ): Promise<JobMatchResult> {
    // 1. Check cache first
    const cacheKey = CacheManager.getCacheKey("job_match", userId, jobId);
    const cached = await CacheManager.get<JobMatchResult>(cacheKey);
    if (cached) return cached;

    // 2. Get user profile and job data
    const [userProfile, jobData] = await Promise.all([
      getUserProfile(userId),
      getJobById(jobId),
    ]);

    // 3. Generate AI match analysis
    const claude = new ClaudeClient();
    const matchResult = await claude.analyzeJobMatch(userProfile, jobData);

    // 4. Store in cache and database
    await CacheManager.set(cacheKey, matchResult, 24 * 60 * 60); // 24 hours
    await storeJobMatch(userId, jobId, matchResult);

    // 5. Track cost
    await CostTracker.logUsage(
      userId,
      "claude",
      "sonnet-4.5",
      matchResult.tokensUsed,
      "job_match"
    );

    return matchResult;
  }
}
```

#### 3.2 Resume Parser

```typescript
// lib/ai/resume-parser.ts
export class ResumeParser {
  /**
   * Parse uploaded resume file using GPT-4o-mini
   * @cost ~$0.0002 per resume
   */
  static async parseResume(file: File, userId: string): Promise<ParsedResume> {
    // 1. Extract text from PDF/DOCX
    const resumeText = await extractTextFromFile(file);

    // 2. Parse with OpenAI
    const openai = new OpenAIClient();
    const parsedData = await openai.parseResume(resumeText);

    // 3. Store in user_profiles table
    await updateUserProfile(userId, parsedData);

    // 4. Track cost
    await CostTracker.logUsage(
      userId,
      "openai",
      "gpt-4o-mini",
      parsedData.tokensUsed,
      "resume_parse"
    );

    return parsedData;
  }
}
```

#### 3.3 AI Insights Generator

```typescript
// lib/ai/insights-generator.ts
export class InsightsGenerator {
  /**
   * Generate daily personalized insights
   * Runs via cron job for all users
   * @cost ~$0.0005 per user per day
   */
  static async generateDailyInsights(userId: string): Promise<AIInsight[]> {
    // 1. Check if insights already generated today
    const existing = await getExistingInsights(userId);
    if (existing && !isExpired(existing)) return existing.insights;

    // 2. Gather user context
    const [userProfile, recentSearches, marketTrends] = await Promise.all([
      getUserProfile(userId),
      getRecentSearches(userId),
      getMarketTrends(userProfile.preferredRoles),
    ]);

    // 3. Generate insights with AI
    const openai = new OpenAIClient();
    const insights = await openai.generateInsights(userProfile, recentSearches);

    // 4. Store with 24h expiration
    await storeAIInsights(userId, insights);

    return insights;
  }
}
```

**API Endpoints to Create:**

- `app/api/ai/match-job/route.ts` - Job matching endpoint
- `app/api/ai/parse-resume/route.ts` - Resume upload and parsing
- `app/api/ai/insights/route.ts` - Get daily insights
- `app/api/ai/costs/route.ts` - Cost tracking dashboard

**Deliverables Phase 3:**

- ✅ Real job matching with AI explanations
- ✅ Resume upload and parsing functionality
- ✅ Daily AI insights generation
- ✅ Cost tracking for all AI operations

---

### **Phase 4: Job Data Pipeline** (Days 8-9)

_Priority: High - Need real job data_

#### 4.1 Web Scrapers

```typescript
// lib/scrapers/base-scraper.ts
export abstract class BaseScraper {
  protected rateLimit = 1000; // 1 second between requests
  protected maxRetries = 3;

  /**
   * Scrape jobs from source with rate limiting and error recovery
   */
  abstract scrapeJobs(): Promise<ScrapedJob[]>;

  protected async makeRequest(url: string): Promise<string> {
    // Rate limiting, retry logic, error handling
  }
}

// lib/scrapers/indeed-scraper.ts
export class IndeedScraper extends BaseScraper {
  async scrapeJobs(): Promise<ScrapedJob[]> {
    // Scrape Indeed job listings
    // Parse HTML safely
    // Extract: title, company, location, salary, description
    // Return structured data
  }
}
```

#### 4.2 Scheduled Job Collection

```typescript
// app/api/jobs/scrape/route.ts (Netlify Function)
export async function GET() {
  /**
   * Scheduled function (runs every 6 hours)
   * Scrapes jobs from all sources
   * Deduplicates and stores in database
   */
  try {
    const scrapers = [
      new IndeedScraper(),
      new LinkedInScraper(),
      new GlassdoorScraper(),
      new RemoteOKScraper(),
    ];

    const allJobs: ScrapedJob[] = [];

    for (const scraper of scrapers) {
      try {
        const jobs = await scraper.scrapeJobs();
        allJobs.push(...jobs);
      } catch (error) {
        console.error(`Scraper failed:`, error);
        // Continue with other scrapers
      }
    }

    // Deduplicate jobs
    const uniqueJobs = deduplicateJobs(allJobs);

    // Store in database
    await storeJobs(uniqueJobs);

    return Response.json({
      success: true,
      scraped: allJobs.length,
      stored: uniqueJobs.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

#### 4.3 Job Search API

```typescript
// app/api/jobs/search/route.ts
export async function POST(request: Request) {
  /**
   * Search jobs with filters
   * Return paginated results with AI match scores (if authenticated)
   */
  const { query, filters, page = 1 } = await request.json();

  // Search database
  const jobs = await searchJobs(query, filters, page);

  // Add AI match scores for authenticated users
  const user = await getCurrentUser();
  if (user) {
    for (const job of jobs) {
      job.matchScore = await JobMatchingEngine.matchJob(user.id, job.id);
    }
  }

  return Response.json({ jobs, pagination: {...} });
}
```

**Deliverables Phase 4:**

- ✅ Working web scrapers for multiple job sites
- ✅ Scheduled job collection (Netlify cron)
- ✅ Job deduplication and storage
- ✅ Real job search with live data

---

### **Phase 5: Premium Features** (Days 10-12)

_Priority: Medium - Revenue generation_

#### 5.1 Stripe Payment Integration

```typescript
// lib/payments/stripe.ts
export class StripeManager {
  static async createCheckoutSession(userId: string): Promise<string> {
    // Create Stripe checkout for $3/month subscription
    // Return checkout URL
  }

  static async handleWebhook(event: Stripe.Event): Promise<void> {
    // Handle subscription events
    // Update user subscription status in database
  }
}
```

#### 5.2 Premium Feature Gating

```typescript
// lib/auth/premium-check.ts
export async function checkPremiumAccess(
  userId: string,
  feature: string
): Promise<boolean> {
  const user = await getUserById(userId);

  if (user.subscription_status === "premium") return true;

  // Check free tier quotas
  const quota = await getUsageQuota(userId, feature);
  return quota.hasRemainingUsage;
}
```

#### 5.3 Cover Letter Generator (Premium)

```typescript
// app/api/ai/cover-letter/route.ts
export async function POST(request: Request) {
  const { jobId, userId } = await request.json();

  // Check premium access and quota
  const hasAccess = await checkPremiumAccess(userId, "cover_letters");
  if (!hasAccess) {
    return Response.json(
      { error: "Premium feature - upgrade required" },
      { status: 403 }
    );
  }

  // Generate cover letter with Claude
  const claude = new ClaudeClient();
  const coverLetter = await claude.generateCoverLetter(userProfile, jobData);

  // Track usage
  await incrementUsageQuota(userId, "cover_letters");

  return Response.json({ coverLetter });
}
```

#### 5.4 Saved Search Alerts (Premium)

```typescript
// app/api/alerts/check/route.ts (Cron job - hourly)
export async function GET() {
  /**
   * Check all saved searches for new matching jobs
   * Send email/SMS alerts for matches
   */
  const savedSearches = await getActiveSavedSearches();

  for (const search of savedSearches) {
    const newJobs = await findNewMatchingJobs(search);

    if (newJobs.length > 0) {
      await sendJobAlert(search.user_id, newJobs, search.alert_frequency);
    }
  }
}
```

**Deliverables Phase 5:**

- ✅ Stripe subscription system
- ✅ Premium feature gating
- ✅ Cover letter generation (premium)
- ✅ Interview prep (premium)
- ✅ Saved search alerts with email/SMS

---

### **Phase 6: Optimization & Production** (Days 13-14)

_Priority: Critical - Production readiness_

#### 6.1 Rate Limiting System

```typescript
// lib/rate-limit/quota-manager.ts
export class QuotaManager {
  /**
   * Free tier limits:
   * - Job matches: 50/day
   * - AI insights: 1/day
   * - Cover letters: 2/month
   * - Interview prep: 1/week
   */
  static async checkQuota(userId: string, operation: string): Promise<boolean> {
    // Check current usage against limits
    // Reset daily/monthly counters as needed
    // Return true if within limits
  }
}
```

#### 6.2 Performance Monitoring

```typescript
// lib/monitoring/performance.ts
export class PerformanceMonitor {
  static async trackAPIPerformance(
    endpoint: string,
    duration: number,
    success: boolean
  ) {
    // Log API performance metrics
    // Alert on slow responses or high error rates
  }

  static async trackAICosts() {
    // Daily cost summaries
    // Budget alerts
    // Usage optimization recommendations
  }
}
```

#### 6.3 Production Deployment Checklist

- [ ] Environment variables configured in Netlify
- [ ] Supabase RLS policies enabled
- [ ] Stripe webhook endpoints configured
- [ ] SendGrid/Twilio API keys added
- [ ] Cron jobs scheduled in Netlify
- [ ] Error monitoring setup (Sentry)
- [ ] Cost alerts configured
- [ ] Database backups enabled
- [ ] Rate limiting tested

**Deliverables Phase 6:**

- ✅ Production-ready deployment
- ✅ Comprehensive monitoring
- ✅ Cost optimization active
- ✅ Error handling robust

---

## 🔧 Implementation Commands & Setup

### Initial Setup Commands

```bash
# 1. Install AI dependencies
npm install @anthropic-ai/sdk openai

# 2. Install Supabase
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# 3. Install payment processing
npm install stripe @stripe/stripe-js

# 4. Install utilities
npm install pdf-parse mammoth cheerio axios

# 5. Setup Supabase locally
npx supabase init
npx supabase start
npx supabase db reset
```

### Environment Setup

```bash
# Copy and fill environment variables
cp .env.example .env.local

# Add to .env.local:
# - Supabase credentials
# - Anthropic API key
# - OpenAI API key
# - Stripe keys
# - SendGrid API key
# - Twilio credentials (optional)
```

---

## 📊 Success Metrics & Monitoring

After implementation, track:

- **API Cost per User**: Target <$0.10/day
- **Cache Hit Rate**: Target >80%
- **Job Match Accuracy**: User feedback scores
- **Premium Conversion**: Free → Premium rate
- **Scraper Success**: >90% success rate
- **Alert Delivery**: >95% delivery rate
- **System Uptime**: >99.5%

## 🚀 Getting Started

**Next Steps:**

1. Start with Phase 1 (Database setup) - foundation for everything
2. Set up Supabase project and create database schema
3. Implement authentication system
4. Move to Phase 2 (AI integration) once foundation is solid

**Key Success Factors:**

- Implement caching BEFORE making AI calls
- Track costs from day 1
- Test with small user base first
- Monitor performance continuously
- Have fallback strategies for AI failures

This plan transforms your current UI-focused app into a real AI-powered SaaS platform with production-ready backend infrastructure, real job data, and premium subscription features.
