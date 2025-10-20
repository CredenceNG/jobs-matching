# GitHub Copilot Instructions for JobAI

## Project Overview

JobAI is a Next.js 14 AI-powered job search platform that helps users find, match, and apply to jobs using intelligent matching algorithms. The platform offers both anonymous (free) and premium (paid) tiers with real-time job search and AI-powered matching.

## Architecture & Tech Stack

### Frontend

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom React components
- **State Management**: React hooks (useState, useEffect)

### Backend

- **API Routes**: Next.js API routes
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (for premium users)
- **Storage**: Session storage (anonymous), Supabase (premium)

### AI Services

- **Primary AI**: Anthropic Claude (claude-3-sonnet-20241022)
- **Fallback AI**: OpenAI GPT-4o-mini
- **Job Search APIs**: JSearch (RapidAPI), Adzuna

### Key Libraries

- Supabase client (@supabase/supabase-js)
- Tailwind CSS for styling
- TypeScript for type safety

## Code Style & Standards

### TypeScript

- Use strict TypeScript with proper interfaces
- Define interfaces for all data structures
- Use proper error handling with typed catch blocks
- Prefer `interface` over `type` for object definitions

```typescript
// Good
interface UserProfile {
  id: string;
  name: string;
  skills: string[];
}

// Error handling
try {
  // code
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
}
```

### React Components

- Use functional components with hooks
- Prefer `'use client'` directive for client-side components
- Use proper TypeScript props interfaces
- Handle loading states and error boundaries

```typescript
"use client";

interface ComponentProps {
  title: string;
  onSubmit: (data: FormData) => void;
}

export default function Component({ title, onSubmit }: ComponentProps) {
  const [loading, setLoading] = useState(false);
  // component logic
}
```

### File Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage
│   ├── anonymous-jobs/    # Anonymous job matching
│   ├── profile/           # User profile setup
│   └── pricing/           # Premium pricing page
├── components/            # Reusable components
│   ├── ai/               # AI-related components
│   ├── jobs/             # Job-related components
│   └── premium/          # Premium upgrade components
├── lib/                  # Utilities and services
│   ├── services/         # API services
│   └── mock-data/        # Mock data for development
└── types/                # TypeScript type definitions
```

## Service Layer Architecture

### Job Search Service (`src/lib/services/job-search.ts`)

- Integrates with multiple job APIs (JSearch, Adzuna)
- Implements fallback chain for reliability
- Returns standardized job data format

```typescript
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  url?: string;
}

export class JobSearchService {
  async searchJobs(filters: JobSearchFilters): Promise<JobSearchResponse> {
    // Implementation with fallbacks
  }
}
```

### AI Job Matching Service (`src/lib/services/ai-job-matching.ts`)

- Uses Claude AI as primary, OpenAI as fallback
- Provides detailed match scoring and reasoning
- Implements proper error handling and timeouts

### Profile Storage Service (`src/lib/services/profile-storage.ts`)

- Handles both anonymous (session storage) and premium (database) profiles
- Provides seamless upgrade path from anonymous to premium
- Implements proper data validation and completion tracking

## Key Features & Implementation

### Anonymous Job Matching

- **No signup required** - users can immediately use AI job matching
- **Session storage** - profiles saved temporarily in browser
- **Real API integration** - uses actual job search APIs and AI analysis
- **Premium conversion** - encourages upgrade after showing value

### Premium Features

- **Persistent profiles** - saved in Supabase database
- **Job alerts** - email notifications for new matches
- **Advanced tracking** - application history and career insights
- **AI career advisor** - personalized career guidance

### User Experience Flow

1. **Anonymous Entry** → Quick profile setup (5 minutes)
2. **AI Job Matching** → Real job search + AI analysis
3. **Results Display** → Match scores with explanations
4. **Premium Upgrade** → Optional conversion to save results

## API Integration Guidelines

### Environment Variables

```bash
# AI Services
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...

# Job Search APIs
RAPIDAPI_KEY=your-key
ADZUNA_APP_ID=your-id
ADZUNA_APP_KEY=your-key

# Database
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # Server-side only!
```

### Error Handling

- Always implement proper fallbacks for external APIs
- Use graceful degradation when services are unavailable
- Provide meaningful error messages to users
- Log errors for debugging but don't expose sensitive information

### Performance Considerations

- Limit AI processing to 8 jobs maximum for speed
- Implement timeouts for external API calls (10s job search, 3s per AI analysis)
- Use parallel processing where possible
- Cache results when appropriate

## Data Models & Types

### Core Interfaces

```typescript
interface UserProfile {
  name: string;
  location: string;
  currentRole: string;
  experienceLevel: "entry" | "mid" | "senior" | "expert";
  skills: Array<{ name: string; proficiency: string }>;
  preferences: {
    jobTypes: string[];
    workModes: string[];
    salaryRange: { min: number; max: number };
  };
  isAnonymous: boolean;
}

interface JobMatch {
  jobId: string;
  matchScore: number; // 0-100
  matchReasons: string[];
  overallFit: string;
  skillsMatch: number;
  experienceMatch: number;
  locationMatch: number;
}
```

## Security Best Practices

### API Keys

- Never expose service role keys in client-side code
- Use environment variables for all sensitive data
- Implement proper CORS and rate limiting

### Data Privacy

- Anonymous users: no personal data stored server-side
- Premium users: encrypted data storage in Supabase
- Implement proper data retention policies

## Testing & Development

### Mock Data Usage

- **NEVER use mock data in production features**
- Mock data only for UI development and testing
- Always integrate with real APIs for actual functionality
- Use environment flags to control mock vs real data

### Development Flags

```bash
DEV_MOCK_AI_RESPONSES=false  # Always use real AI
DEBUG_AI_REQUESTS=true       # Log AI interactions
```

## 🚨 CRITICAL: NO HARDCODING, MOCK-UPS, OR TEST DATA 🚨

### ABSOLUTE RULES - NEVER VIOLATE THESE:

#### 1. **NO HARDCODED DATA**

- ❌ **NEVER** hardcode job listings in the codebase
- ❌ **NEVER** return static/fake job data from any function
- ❌ **NEVER** use placeholder data like "Example Company" or "Sample Job Title"
- ✅ **ALWAYS** fetch real data from actual APIs
- ✅ **ALWAYS** return empty arrays if API fails, not fake data

#### 2. **NO MOCK-UPS OR FALLBACK DATA**

- ❌ **NEVER** create "fallback" job listings when APIs fail
- ❌ **NEVER** use "sample" or "demo" data in any production code path
- ❌ **NEVER** show fake results to demonstrate functionality
- ✅ **ALWAYS** show proper error messages when APIs fail
- ✅ **ALWAYS** return empty state with clear messaging

#### 3. **NO TEST DATA IN PRODUCTION**

- ❌ **NEVER** include test data arrays in services or components
- ❌ **NEVER** mix real API data with fake data
- ❌ **NEVER** use "example" or "test" entries in any user-facing feature
- ✅ **ALWAYS** use only real API responses
- ✅ **ALWAYS** validate data sources are external APIs

#### 4. **RESUME PARSING MUST BE ACCURATE**

- ❌ **NEVER** use hardcoded skill lists that only cover software engineering
- ❌ **NEVER** ignore resume content and return default/cached results
- ❌ **NEVER** assume all users are software developers
- ✅ **ALWAYS** parse actual resume content comprehensively
- ✅ **ALWAYS** support ALL professions (marketing, sales, HR, finance, design, etc.)
- ✅ **ALWAYS** extract skills specific to the uploaded resume

#### 5. **JOB MATCHING MUST BE GENUINE**

- ❌ **NEVER** return jobs unrelated to the user's resume
- ❌ **NEVER** use generic queries that ignore resume content
- ❌ **NEVER** show software engineering jobs to non-technical professionals
- ✅ **ALWAYS** match jobs based on actual parsed resume data
- ✅ **ALWAYS** use resume-specific keywords in job search queries
- ✅ **ALWAYS** filter results by relevance to user's profession

### Enforcement Guidelines

**When writing any code involving data:**

1. **Ask yourself**: "Is this data coming from an external API?"
   - If NO → Don't use it in production
2. **Ask yourself**: "Could this function return fake data?"
   - If YES → Refactor to only return real API data or empty array
3. **Ask yourself**: "Am I making assumptions about the user's profession?"
   - If YES → Remove assumptions, parse actual resume content
4. **Ask yourself**: "Would this work correctly for a marketing manager?"
   - If NO → Expand support for all professions

### Code Examples

**❌ WRONG - Hardcoded fallback data:**

```typescript
async searchJobs(query: string) {
  try {
    return await api.search(query);
  } catch (error) {
    // WRONG: Returning fake data
    return [
      { title: "Sample Job", company: "Example Corp" }
    ];
  }
}
```

**✅ CORRECT - Empty state with error:**

```typescript
async searchJobs(query: string) {
  try {
    return await api.search(query);
  } catch (error) {
    console.error("Job search failed:", error);
    return []; // Return empty array, let UI handle empty state
  }
}
```

**❌ WRONG - Tech-only skill parsing:**

```typescript
const skills = ["JavaScript", "React", "Python"]; // Only tech skills!
```

**✅ CORRECT - Comprehensive skill parsing:**

```typescript
const skills = [
  ...techSkills, // JavaScript, Python, etc.
  ...marketingSkills, // SEO, Social Media, etc.
  ...salesSkills, // CRM, Negotiation, etc.
  ...hrSkills, // Recruiting, HRIS, etc.
  ...financeSkills, // Accounting, Excel, etc.
  ...designSkills, // Photoshop, Figma, etc.
];
```

### User Impact

**Remember**: Users trust our AI matching. If we show:

- Software engineering jobs to a marketing manager → User loses trust
- Fake/mock data → User thinks the product doesn't work
- Irrelevant results → User abandons the platform

**Every piece of data must be:**

1. Real (from external APIs)
2. Relevant (matched to user's actual profile)
3. Current (no cached/stale data)
4. Accurate (properly parsed and processed)

## Common Patterns

### API Service Pattern

```typescript
class APIService {
  private async makeRequest(url: string, options: RequestInit) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }
}
```

### Component Loading States

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleSubmit = async () => {
  setLoading(true);
  setError(null);
  try {
    // API call
  } catch (err) {
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setLoading(false);
  }
};
```

### Form Validation

```typescript
const isFormValid = () => {
  return (
    profile.title &&
    profile.skills.length > 0 &&
    profile.experience &&
    profile.location
  );
};
```

## Copilot Assistance Guidelines

When suggesting code:

1. **Always use TypeScript** with proper interfaces
2. **Follow the established patterns** in the codebase
3. **Include proper error handling** with fallbacks
4. **Use real APIs** - never suggest mock data for production features
5. **Implement loading states** for async operations
6. **Follow the service layer architecture**
7. **Maintain consistent styling** with Tailwind CSS
8. **Consider both anonymous and premium user flows**
9. **Implement proper accessibility** (ARIA labels, semantic HTML)
10. **Optimize for performance** (timeouts, parallel processing, limiting API calls)

## Common Tasks & Solutions

### Adding a new API service

1. Create service class in `src/lib/services/`
2. Implement proper error handling and fallbacks
3. Add environment variables for API keys
4. Create TypeScript interfaces for request/response
5. Add timeout and retry logic

### Adding a new user interface

1. Create component in appropriate `src/components/` subdirectory
2. Use `'use client'` directive if client-side logic needed
3. Implement proper loading and error states
4. Add responsive design with Tailwind CSS
5. Include accessibility features

### Adding premium features

1. Check user subscription status
2. Implement feature toggles
3. Add upgrade prompts for anonymous users
4. Ensure data persistence for premium users
5. Add proper error handling for subscription checks

Remember: The goal is to provide real, valuable AI-powered job matching while maintaining a smooth user experience that converts anonymous users to premium subscribers through demonstrated value, not artificial barriers.
