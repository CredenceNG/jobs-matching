# JobAI Schema & Code Alignment Migration Plan

**Status**: In Progress
**Date**: October 21, 2025
**Current Build Errors**: ~170 TypeScript errors

## Executive Summary

The codebase has significant mismatches between Prisma schema definitions and how the code uses them. This document outlines a systematic approach to align them.

### The Core Problem

Services were written expecting certain fields/structures that don't exist in the Prisma schema. Two approaches to fix:

1. **Schema-First** (Recommended): Update Prisma schema to match code expectations
2. **Code-First**: Refactor services to use only schema fields

We'll use **Schema-First** approach to preserve existing business logic.

---

## Part 1: ScrapeSchedule Model Issues

### Current Schema
```prisma
model ScrapeSchedule {
  id              String   @id @default(uuid()) @db.Uuid
  frequency       String   // cron expression
  isActive        Boolean  @default(true) @map("is_active")
  lastRun         DateTime? @map("last_run") @db.Timestamptz
  nextRun         DateTime @map("next_run") @db.Timestamptz
  sourcesToScrape String[] @map("sources_to_scrape")
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz
}
```

### Code Expectations
Services expect these fields:
- `source` (string) - specific job source to scrape
- `searchQuery` (string) - search keywords
- `location` (string) - location filter
- `frequencyHours` (number) - hours between scrapes
- `priority` (number) - scraping priority
- `metadata` (JSON) - additional configuration
- `nextScrapeAt` (DateTime) - next scheduled time
- `lastScrapedAt` (DateTime) - when last scraped

### Migration Steps

#### Step 1: Update Prisma Schema
Add missing fields to `ScrapeSchedule` model:

```prisma
model ScrapeSchedule {
  id              String   @id @default(uuid()) @db.Uuid

  // Search configuration
  source          String   @db.VarChar(100)  // e.g., "linkedin", "indeed"
  searchQuery     String   @db.Text          // search keywords
  location        String?  @db.VarChar(255)  // e.g., "remote", "New York, NY"

  // Scheduling
  frequency       String   @db.VarChar(50)   // cron expression
  frequencyHours  Int      @map("frequency_hours")  // hours between runs
  priority        Int      @default(5)       // 1-10 scale

  // Status tracking
  isActive        Boolean  @default(true) @map("is_active")
  lastRun         DateTime? @map("last_run") @db.Timestamptz
  lastScrapedAt   DateTime? @map("last_scraped_at") @db.Timestamptz
  nextRun         DateTime @map("next_run") @db.Timestamptz
  nextScrapeAt    DateTime? @map("next_scrape_at") @db.Timestamptz

  // Data
  sourcesToScrape String[] @map("sources_to_scrape")
  metadata        Json?    @default("{}")

  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@map("scrape_schedules")
}
```

#### Step 2: Create Prisma Migration
```bash
npx prisma migrate dev --name add_schedule_fields
```

#### Step 3: No Code Changes Needed
The service code will work once fields exist.

**Files Affected**: None (schema change only)

---

## Part 2: ScrapeRun Model Issues

### Current Schema
```prisma
model ScrapeRun {
  id            String   @id @default(uuid()) @db.Uuid
  startTime     DateTime @default(now()) @map("start_time") @db.Timestamptz
  endTime       DateTime? @map("end_time") @db.Timestamptz
  status        String   // running, success, failed
  jobsFound     Int      @default(0) @map("jobs_found")
  sources       String[]
  errorMessage  String?  @map("error_message") @db.Text
  logs          Json?

  @@map("scrape_runs")
}
```

### Code Expectations
Services expect these fields:
- `source` (string) - single source
- `searchQuery` (string) - search keywords
- `location` (string) - location filter
- `itemsFound` (number) - items found
- `itemsStored` (number) - items stored
- `durationMs` (number) - execution time in ms
- `metadata` (JSON) - additional data
- `createdAt` (DateTime) - creation timestamp

### Migration Steps

#### Step 1: Update Prisma Schema
```prisma
model ScrapeRun {
  id            String   @id @default(uuid()) @db.Uuid

  // Search context
  source        String?  @db.VarChar(100)   // e.g., "linkedin"
  searchQuery   String?  @db.Text           // search keywords
  location      String?  @db.VarChar(255)   // location filter

  // Execution
  startTime     DateTime @default(now()) @map("start_time") @db.Timestamptz
  endTime       DateTime? @map("end_time") @db.Timestamptz
  durationMs    Int?     @map("duration_ms")   // execution time

  // Results
  status        String   @db.VarChar(50)    // running, success, failed
  jobsFound     Int      @default(0) @map("jobs_found")
  itemsFound    Int?     @map("items_found")
  itemsStored   Int?     @map("items_stored")

  // Data
  sources       String[] @deprecated("Use 'source' field instead")
  metadata      Json?    @default("{}")

  // Logging
  errorMessage  String?  @map("error_message") @db.Text
  logs          Json?

  // Timestamp for logging service
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@map("scrape_runs")
}
```

#### Step 2: Create Prisma Migration
```bash
npx prisma migrate dev --name add_scrape_run_fields
```

#### Step 3: Update Scraping Log Service
File: `src/lib/services/scraping-log.service.ts`

Change property access from `log.source` to `log.source || log.sources?.[0]`
Change `createdAt` → `startTime` in queries

**Files to Update**:
- `src/lib/services/scraping-log.service.ts` (~15 fixes)

---

## Part 3: Job Model Issues

### Current Schema
```prisma
model Job {
  id              String   @id @default(uuid()) @db.Uuid
  externalId      String   @map("external_id")
  title           String
  company         String
  location        String?
  description     String   @db.Text
  salary          String?
  jobType         String?  @map("job_type")
  remote          Boolean  @default(false)
  url             String?
  source          String
  postedDate      DateTime? @map("posted_date") @db.Timestamptz
  scrapedAt       DateTime @default(now()) @map("scraped_at") @db.Timestamptz
  metadata        Json?

  @@map("jobs")
}
```

### Code Issues
1. Code tries to filter by `isActive` field (doesn't exist)
2. Code tries to filter by `expiresAt` field (doesn't exist)
3. Various type mismatches with optional/required fields

### Migration Steps

#### Step 1: Add Missing Fields to Schema
```prisma
model Job {
  id              String   @id @default(uuid()) @db.Uuid
  externalId      String   @map("external_id")

  // Job info
  title           String
  company         String
  location        String?
  description     String   @db.Text
  salary          String?
  jobType         String?  @map("job_type")
  remote          Boolean  @default(false)
  url             String?

  // Metadata
  source          String   @db.VarChar(100)
  postedDate      DateTime? @map("posted_date") @db.Timestamptz

  // Status fields
  isActive        Boolean  @default(true) @map("is_active")
  expiresAt       DateTime? @map("expires_at") @db.Timestamptz

  // Tracking
  scrapedAt       DateTime @default(now()) @map("scraped_at") @db.Timestamptz
  metadata        Json?

  @@unique([externalId, source])
  @@index([source])
  @@index([postedDate])
  @@index([scrapedAt])
  @@map("jobs")
}
```

#### Step 2: Create Migration
```bash
npx prisma migrate dev --name add_job_status_fields
```

#### Step 3: Update Job Storage Service
File: `src/lib/services/job-storage.service.ts`

- Remove `location_type`, `employment_type`, `salary_min`, `salary_max` (map to existing fields)
- Fix type mismatches for optional fields
- Update queries to use `isActive` and `expiresAt`

**Files to Update**:
- `src/lib/services/job-storage.service.ts` (~20 fixes)
- `src/lib/services/job-search.ts` (~5 fixes)

---

## Part 4: Scraper Architecture Issues

### Problem
All scraper classes (7 total) are missing:
1. Generic type parameter: `extends BaseScraper<JobType>`
2. Methods: `withRetry()`, `delay()`, `launchBrowser()`, `getRandomUserAgent()`, `closeBrowser()`
3. Property: `config`
4. Field in `ScrapeResult`: `itemCount` → `itemsScraped`

### Solution: Fix Base Scraper

File: `src/lib/scrapers/base-scraper.ts`

1. Add missing methods to `BaseScraper`:
```typescript
protected withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  // retry logic
}

protected delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

protected async launchBrowser() {
  // browser launch logic
}

protected getRandomUserAgent(): string {
  // return random user agent
}

protected async closeBrowser() {
  // browser cleanup
}
```

2. Add `config` property to constructor

3. Fix `ScrapeResult` interface:
```typescript
interface ScrapeResult<T> {
  success: boolean;
  data?: T[];
  error?: string;
  itemsScraped: number;  // changed from itemCount
  duration: number;
  source: string;
}
```

### Updates to Each Scraper

All 7 files need class declaration fixed:

```typescript
// Before:
export class LinkedInScraper extends BaseScraper { }

// After:
export class LinkedInScraper extends BaseScraper<LinkedInJob> { }
```

Change all `itemCount` → `itemsScraped`

**Files to Update**:
- `src/lib/scrapers/base-scraper.ts` (add methods)
- `src/lib/scrapers/linkedin-scraper.ts`
- `src/lib/scrapers/ziprecruiter-scraper.ts`
- `src/lib/scrapers/monster-scraper.ts`
- `src/lib/scrapers/careerbuilder-scraper.ts`
- `src/lib/scrapers/simplyhired-scraper.ts`
- `src/lib/scrapers/stackoverflow-scraper.ts`
- `src/lib/scrapers/dice-scraper.ts`

---

## Part 5: Type Definition Issues

### Issues
1. Resume type interfaces missing properties
2. Module export conflicts
3. API response type mismatches

### Fixes

#### File: `src/types/resume.ts`
Add missing properties:

```typescript
interface WorkExperience {
  // ... existing fields
  responsibilities?: string[];  // ADD THIS
}

interface Education {
  // ... existing fields
  honors?: string[];  // ADD THIS (verify it exists)
}

interface Project {
  // ... existing fields
  link?: string;  // ADD THIS (map to 'url' field)
}
```

#### File: `src/lib/ai/index.ts`
Fix duplicate export:
```typescript
// Remove or rename one of the ResumeAnalysis exports
export type { ResumeAnalysis } from './resume-parsing';
// OR
export type { ResumeAnalysis as ResumeAnalysisV2 } from './resume-optimization';
```

#### Files: `src/app/resume-jobs*.tsx`
Add `parsedData` to API response type OR update references to use correct field name.

**Files to Update**:
- `src/types/resume.ts`
- `src/lib/ai/index.ts`
- `src/lib/ai/resume-optimizer.ts`
- `src/app/resume-jobs-v2/page.tsx`
- `src/app/resume-jobs/page.tsx`

---

## Part 6: Configuration Updates

### TypeScript Config
Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "downlevelIteration": true
  }
}
```

### Stripe API Version Issues
Update all Stripe files to use consistent API version:

**Files**:
- `src/app/api/subscriptions/confirm/route.ts`
- `src/app/api/subscriptions/create-checkout/route.ts`
- `src/app/api/tokens/confirm/route.ts`
- `src/app/api/tokens/purchase/route.ts`
- `src/app/api/tokens/webhook/route.ts`

Change from `"2024-12-18.acacia"` to `"2024-06-20"` (the version expected by types)

---

## Implementation Order (Priority)

### Phase 1: Schema Updates (Highest Impact)
1. ✅ Prisma schema changes (ScrapeSchedule, ScrapeRun, Job)
2. ✅ Run migrations
3. Time: ~30 minutes

### Phase 2: Service Fixes (Medium Impact)
1. Fix Scraping Log Service
2. Fix Job Storage Service
3. Fix Schedule Service references
4. Time: ~1 hour

### Phase 3: Scraper Architecture (High Impact)
1. Update Base Scraper with missing methods
2. Add generic type parameters to all 7 scrapers
3. Fix itemCount → itemsScraped
4. Time: ~45 minutes

### Phase 4: Type Definitions (Medium Impact)
1. Update Resume type interfaces
2. Fix module exports
3. Update API response types
4. Time: ~30 minutes

### Phase 5: Configuration & Polish (Low Impact)
1. Update tsconfig.json
2. Fix Stripe API versions
3. Remove any remaining snake_case references
4. Time: ~20 minutes

---

## Expected Results

After completing all phases:
- ✅ 0 TypeScript errors
- ✅ Clean build
- ✅ Netlify deployment succeeds
- ✅ Schema and code fully aligned

---

## Rollback Strategy

If issues arise:
1. All changes are additive (new fields only)
2. Can run `npx prisma migrate resolve --rolled-back` to rollback migrations
3. Git history available for code rollbacks

---

## Next Steps

1. Implement Phase 1 (Schema)
2. Implement Phase 2 (Services)
3. Implement Phase 3 (Scrapers)
4. Implement Phase 4 (Types)
5. Implement Phase 5 (Config)
6. Run full build test
7. Deploy to Netlify
