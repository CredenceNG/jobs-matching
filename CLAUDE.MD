# VS Code Copilot Prompt: JobAI Real AI Implementation with Claude Sonnet 4.5

> **📚 Documentation Location**: All project documentation has been moved to the [`/docs`](./docs) folder.
> **🧪 Test Scripts Location**: All debugging and test scripts are in the [`/debug-tests`](./debug-tests) folder.
> **Quick Start**: See [docs/INDEX.md](./docs/INDEX.md) for complete documentation index.
> **V2 vs V3 Guide**: See [docs/V2_V3_COMPLETE_DOCUMENTATION.md](./docs/V2_V3_COMPLETE_DOCUMENTATION.md)

---

## Project Context

I'm converting an existing React + Vite job search SaaS application to Next.js with REAL AI capabilities. The current app has a simulated AI system with mock job data. I need to transform it into a production-ready, AI-powered platform.

## Current State

- **Framework**: React 18 + Vite + Tailwind CSS
- **Features**: Job search, filters, saved jobs, application tracking, premium subscription ($3/month, $2.50/month annual)
- **Mock AI**: Static match scores, hardcoded insights, simulated alerts
- **Deployment**: Configured for Netlify

## Target Architecture

### Tech Stack

- **Frontend**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **AI Services**:
  - Anthropic Claude (Sonnet 4.5) for complex reasoning, long context tasks
  - OpenAI (GPT-4o-mini) for cost-effective operations
- **Job Data**: Web scraping from multiple job boards
- **Deployment**: Netlify
- **Auth**: JWT-based authentication
- **File Storage**: Temporary (Netlify Functions tmp directory)

### Budget Strategy

- **Primary**: Free tier only with aggressive caching
- **Fallback**: Budget-conscious mode ($50-100/month for moderate usage)
- **Cost Controls**: Rate limiting, response caching, model selection

## Requirements & Features to Implement

### 1. AI-Powered Job Matching

**Free Tier Strategy**: Cache match scores for 24 hours per job-user pair

```typescript
// Use Claude Sonnet 4.5 for initial comprehensive analysis
// Cache results in database
// Cost: ~$0.001 per match (first time only)
```

**Requirements**:

- Analyze user profile (skills, experience, preferences) against job requirements
- Generate 0-100 match score with detailed explanation
- Highlight matching skills (green) vs missing skills (gray)
- Consider: technical skills, soft skills, experience level, location preferences, salary expectations
- Store match explanations for user reference

### 2. Resume Parsing & Auto-Profile Creation

**Free Tier Strategy**: One-time parsing, store extracted data, use GPT-4o-mini

**Requirements**:

- Accept PDF, DOCX, TXT uploads (max 5MB)
- Extract: name, email, phone, skills, experience, education, certifications
- Parse work history with dates and descriptions
- Identify skill proficiency levels
- Store parsed data in structured format
- Update user profile automatically
- Handle parsing errors gracefully
- Temporary file storage (delete after processing)

### 3. Dynamic AI Insights

**Free Tier Strategy**: Generate once daily per user, cache for 24 hours

**Requirements**:

- Personalized career insights based on profile + recent job searches
- Market trend analysis (hiring patterns in user's field)
- Skill gap recommendations with learning resources
- Application success predictions
- 4-5 insights per user, refreshed daily
- Use Claude for deep analysis, cache results

### 4. Cover Letter Generation

**Premium Feature** - Free tier: 2 per month, Paid: unlimited

**Requirements**:

- Generate personalized cover letters per job
- Input: user profile + job details + company research
- Output: Professional, tailored 300-400 word letter
- Include specific examples from user's experience
- Match company culture/tone
- Download as PDF or copy to clipboard
- Track usage quota (2 free, unlimited premium)

### 5. Interview Preparation

**Premium Feature** - Free tier: 1 per week, Paid: unlimited

**Requirements**:

- Generate likely interview questions based on job description
- Provide sample answers using user's experience
- Technical questions for developer roles
- Behavioral questions with STAR method guidance
- Company-specific questions
- Practice mode with AI feedback on responses

### 6. Salary Analysis & Negotiation

**Free tier**: Basic range, **Premium**: Detailed analysis + negotiation tips

**Requirements**:

- Analyze market salary data for role/location/experience
- Suggest optimal salary range
- Compare user's expectations with market
- Provide negotiation talking points (premium)
- Benefits analysis (premium)

### 7. Web Scraping Job Data

**Free Tier Strategy**: Scrape every 6 hours, cache aggressively

**Requirements**:

- Scrape jobs from: Indeed, LinkedIn, Glassdoor, RemoteOK
- Extract: title, company, location, salary, description, requirements, posting date
- Deduplicate jobs across sources
- Store in PostgreSQL database with metadata
- Run via Netlify Scheduled Functions (cron)
- Rate limiting to avoid blocking
- Error handling for scraper failures
- Fallback to cached data if scraping fails

### 8. Premium User Authentication

**Requirements**:

- JWT-based authentication
- Email/password signup
- OAuth (Google, GitHub) optional
- Free tier: Browse, basic search, 2 cover letters/month
- Premium tier ($3/month): Saved searches, email/SMS alerts, unlimited AI features
- Stripe integration for payments
- User dashboard showing usage quotas
- Graceful degradation for non-authenticated users

### 9. Saved Search Alerts

**Premium Only** - Real-time email/SMS when matching jobs found

**Requirements**:

- Store search criteria (keywords, location, filters) per user
- Run matching job check every hour via cron
- Compare new jobs against saved searches
- Send email alerts (via SendGrid free tier: 100 emails/day)
- Send SMS alerts for 90%+ matches (via Twilio - optional, paid)
- Alert frequency: instant, daily digest, weekly summary
- Unsubscribe/manage preferences
- Track delivery status

### 10. Cost Optimization & Caching

**Critical Implementation Details**:

#### Cache Strategy

```typescript
// Implement multi-layer caching:
// 1. In-memory cache (Netlify Functions) - 5 minutes
// 2. Database cache (PostgreSQL) - 24 hours
// 3. CDN cache (Netlify) - Static content

// Cache keys:
// - job_match_{userId}_{jobId} -> 24h
// - user_insights_{userId} -> 24h
// - job_data_{jobId} -> 6h
// - ai_response_{hash} -> 1 week
```

#### Rate Limiting

```typescript
// Per user limits (free tier):
// - Job matches: 50/day
// - AI insights: 1/day
// - Cover letters: 2/month
// - Interview prep: 1/week
// - Resume parsing: 1/upload

// Premium users: 10x higher limits
```

#### Model Selection

```typescript
// Use GPT-4o-mini for:
// - Resume parsing ($0.00015 per 1K tokens)
// - Simple insights
// - Quick matches

// Use Claude Sonnet 4.5 for:
// - Complex career analysis ($3 per 1M tokens)
// - Cover letter generation
// - Interview preparation
// - Detailed job matching with reasoning
```

## Project Structure

```
jobai-nextjs/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── search/
│   │   ├── saved/
│   │   ├── applied/
│   │   ├── alerts/
│   │   ├── searches/
│   │   └── profile/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── match-job/route.ts
│   │   │   ├── generate-insights/route.ts
│   │   │   ├── cover-letter/route.ts
│   │   │   ├── interview-prep/route.ts
│   │   │   └── parse-resume/route.ts
│   │   ├── jobs/
│   │   │   ├── search/route.ts
│   │   │   ├── scrape/route.ts (cron trigger)
│   │   │   └── [id]/route.ts
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── signup/route.ts
│   │   │   └── logout/route.ts
│   │   ├── alerts/
│   │   │   ├── check/route.ts (cron trigger)
│   │   │   └── send/route.ts
│   │   └── payments/
│   │       ├── create-checkout/route.ts
│   │       └── webhook/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ai/
│   │   ├── JobMatchScore.tsx
│   │   ├── AIInsights.tsx
│   │   ├── CoverLetterGenerator.tsx
│   │   └── InterviewPrep.tsx
│   ├── jobs/
│   │   ├── JobCard.tsx
│   │   ├── JobFilters.tsx
│   │   └── JobList.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   └── ui/ (shadcn/ui components)
├── lib/
│   ├── ai/
│   │   ├── anthropic.ts (Claude client)
│   │   ├── openai.ts (OpenAI client)
│   │   ├── match-engine.ts
│   │   ├── resume-parser.ts
│   │   └── prompt-templates.ts
│   ├── scrapers/
│   │   ├── indeed.ts
│   │   ├── linkedin.ts
│   │   └── base-scraper.ts
│   ├── cache/
│   │   ├── redis.ts (optional)
│   │   └── memory.ts
│   ├── database/
│   │   ├── prisma.ts
│   │   ├── queries.ts
│   │   └── types.ts
│   ├── email/
│   │   └── sendgrid.ts
│   ├── payments/
│   │   └── stripe.ts
│   └── utils/
│       ├── rate-limit.ts
│       ├── cost-tracker.ts
│       └── error-handler.ts
├── types/
│   ├── job.ts
│   ├── user.ts
│   ├── ai.ts
│   └── database.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useJobs.ts
│   ├── useAI.ts
│   └── usePremium.ts
├── .env.local (gitignored)
├── .env.example
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## Implementation Tasks & Order

### Phase 1: Foundation (Day 1-2)

1. **Migrate to Next.js**

   - Convert React components to Next.js App Router
   - Setup server/client component boundaries
   - Migrate Tailwind config
   - Setup environment variables

2. **Setup Database**

   - Create PostgreSQL database
   - Design Prisma schema (users, jobs, matches, searches, alerts)
   - Setup JWT authentication
   - Create Prisma client

3. **Environment Configuration**

   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/jobai

   # AI Services
   ANTHROPIC_API_KEY=
   OPENAI_API_KEY=

   # Payments
   STRIPE_SECRET_KEY=
   STRIPE_WEBHOOK_SECRET=
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

   # Email
   SENDGRID_API_KEY=

   # Optional
   TWILIO_ACCOUNT_SID=
   TWILIO_AUTH_TOKEN=

   # Rate Limiting
   UPSTASH_REDIS_URL= (optional)
   ```

### Phase 2: AI Integration (Day 3-5)

4. **Setup AI Clients**

   - Create Anthropic client with error handling
   - Create OpenAI client with fallback
   - Implement retry logic with exponential backoff
   - Add request logging for cost tracking

5. **Job Matching Engine**

   - Create matching algorithm using Claude
   - Implement caching layer
   - Build match explanation generator
   - Add skill highlighting logic

6. **Resume Parser**

   - File upload handler (temp storage)
   - PDF/DOCX text extraction
   - AI parsing with structured output
   - Database storage of parsed data

7. **AI Insights Generator**
   - Daily insight generation cron job
   - Market trend analysis
   - Skill recommendations
   - Cache management

### Phase 3: Job Data (Day 6-7)

8. **Web Scrapers**

   - Indeed scraper with rate limiting
   - LinkedIn scraper (use API if available)
   - Deduplicate logic
   - Error handling and retries
   - Store in PostgreSQL database

9. **Scheduled Scraping**
   - Netlify cron function (every 6 hours)
   - Job freshness tracking
   - Cleanup old jobs

### Phase 4: Premium Features (Day 8-10)

10. **Authentication System**

    - JWT authentication implementation
    - Login/signup flows
    - Protected routes
    - Session management

11. **Payment Integration**

    - Stripe subscription setup
    - Checkout flow
    - Webhook handling
    - Subscription status checking

12. **Cover Letter Generator**

    - Premium user check
    - Quota tracking (2 free/month)
    - AI generation with Claude
    - PDF export

13. **Interview Prep**

    - Question generation
    - Sample answers
    - Practice mode
    - Feedback system

14. **Saved Search Alerts**
    - Search storage
    - Hourly matching cron
    - Email sending (SendGrid)
    - SMS sending (optional, Twilio)

### Phase 5: Optimization & Production (Day 11-12)

15. **Caching Implementation**

    - Multi-layer cache
    - Cache invalidation strategy
    - Cost tracking

16. **Rate Limiting**

    - Per-user quotas
    - API endpoint protection
    - Graceful degradation

17. **Error Handling**

    - Comprehensive try-catch
    - User-friendly error messages
    - Logging and monitoring
    - Fallback strategies

18. **Testing & Deployment**
    - API endpoint testing
    - Cost monitoring
    - Netlify deployment
    - Environment variable setup

## Code Style Requirements

### 1. Comments

Every function MUST have:

```typescript
/**
 * @description Clear explanation of what function does
 * @param {Type} paramName - What this parameter is for
 * @returns {Type} What is returned
 * @throws {Error} When errors can occur
 * @example Usage example
 * @cost Estimated API cost per call (for AI functions)
 * @cache Cache duration if applicable
 */
```

### 2. Error Handling

```typescript
// ALWAYS wrap AI calls:
try {
  const result = await aiFunction();
  return result;
} catch (error) {
  // Log error with context
  console.error("Context:", error);
  // Return graceful fallback
  return fallbackResponse;
  // OR throw user-friendly error
  throw new Error("User-friendly message");
}
```

### 3. Type Safety

- Use TypeScript strictly
- Define interfaces for all data structures
- No `any` types unless absolutely necessary
- Export types for reusability

### 4. Performance

- Use React Server Components where possible
- Implement loading states
- Optimize images
- Minimize client JavaScript

### 5. Security

- Never expose API keys client-side
- Validate all user inputs
- Sanitize scraped data
- Use Prisma transactions for data integrity

## Specific Implementation Notes

### Job Matching Algorithm

```typescript
/**
 * Matches user profile against job requirements using AI
 *
 * Strategy:
 * 1. Check cache first (24h TTL)
 * 2. If no cache, use Claude Sonnet 4.5
 * 3. Parse response into structured format
 * 4. Store in cache
 * 5. Return match score + explanation
 *
 * Cost: ~$0.001 per match (first time only)
 */
async function matchJobToUser(
  userId: string,
  jobId: string
): Promise<MatchResult> {
  // Implementation with detailed comments
}
```

### Web Scraping Pattern

```typescript
/**
 * Scrapes jobs from source with error recovery
 *
 * Strategy:
 * 1. Rate limit requests (1/second)
 * 2. Retry on failure (3 attempts)
 * 3. Parse HTML safely
 * 4. Validate extracted data
 * 5. Store in database
 * 6. Return success/failure metrics
 */
async function scrapeJobs(source: JobSource): Promise<ScrapeResult> {
  // Implementation with detailed comments
}
```

### Caching Strategy

```typescript
/**
 * Multi-layer cache implementation
 *
 * Layers:
 * 1. Memory cache (5 min) - Fastest, but lost on restart
 * 2. Database cache (24h) - Persistent, shared across functions
 * 3. CDN cache (static) - For public content
 *
 * Invalidation:
 * - Manual via admin API
 * - TTL expiration
 * - On data update
 */
class CacheManager {
  // Implementation with detailed comments
}
```

## Cost Tracking Requirements

Implement cost tracker that logs:

- AI API calls (model, tokens, cost)
- Per-user usage
- Daily/monthly totals
- Alert when approaching budget

## Testing Checklist

Before deployment, verify:

- [ ] All AI endpoints work with both APIs
- [ ] Caching reduces duplicate AI calls
- [ ] Rate limiting blocks excessive requests
- [ ] Free tier quotas enforced
- [ ] Premium features blocked for free users
- [ ] Payment flow works end-to-end
- [ ] Email alerts send successfully
- [ ] Resume upload and parsing works
- [ ] Job scraping runs on schedule
- [ ] Error messages are user-friendly
- [ ] Environment variables loaded correctly
- [ ] Database migrations applied
- [ ] Cost tracking logs API usage

## Success Metrics

After implementation, track:

- API cost per user per day (target: <$0.10)
- Cache hit rate (target: >80%)
- Job match accuracy (user feedback)
- Premium conversion rate
- Alert delivery rate (>95%)
- Scraper success rate (>90%)

## Questions for Copilot

As you implement, use these patterns:

1. "Create [component] with [requirements] following the cost optimization strategy"
2. "Implement [AI feature] using Claude Sonnet 4.5 with caching and error handling"
3. "Add comprehensive comments explaining [complex logic]"
4. "Setup [integration] with free tier limits and premium upgrade path"

## Start Implementation

Begin with: "Create the Next.js project structure and Prisma database schema based on the requirements above. Include all necessary types, migration files, and configuration with detailed comments explaining each decision."

---

**Important Reminders for Copilot:**

- ALWAYS add detailed comments explaining WHY decisions are made
- ALWAYS implement caching before making AI calls
- ALWAYS handle errors gracefully with user-friendly messages
- ALWAYS track API costs in logs
- ALWAYS validate user inputs
- ALWAYS check premium status before allowing premium features
- Focus on production-ready code with proper error boundaries
