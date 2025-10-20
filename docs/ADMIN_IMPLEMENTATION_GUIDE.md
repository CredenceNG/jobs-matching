# Admin Dashboard Implementation Guide

## Overview

This guide provides implementation details for the 4 new admin management pages:
1. **Locations Management** (`/admin/locations`)
2. **Job Scrapers Management** (`/admin/scrapers`)
3. **Scraping Schedule** (`/admin/schedule`)
4. **AI Engines Configuration** (`/admin/ai-engines`)

## Navigation Already Added ✅

The admin layout has been updated with new navigation items:
- Locations (Globe icon)
- Job Scrapers (Search icon)
- Scrape Schedule (Clock icon)
- AI Engines (Brain icon)

## 1. Locations Management Page

**Path**: `/src/app/admin/locations/page.tsx`

### Features Needed:
- **List View**: Display all location configs from database
  - Country, Region, Keywords count, Job boards, Priority, Active status
  - Sort by: Country, Priority, Active
  - Filter by: Region, Active status

- **Add/Edit Form**: Modal or slide-over panel
  - Country (text input)
  - Region (dropdown: north_america, europe, asia, oceania, global)
  - Keywords (tag input - array)
  - Indeed Domain (text input)
  - LinkedIn Region (text input)
  - Recommended Boards (multi-select chips)
  - Priority (number input 0-100)
  - Active toggle

- **Actions**:
  - Add New Location
  - Edit existing
  - Delete (with confirmation)
  - Toggle active/inactive
  - AI Generate (button to auto-generate config for new country)

### API Endpoints Required:
```typescript
GET    /api/admin/locations          // List all
POST   /api/admin/locations          // Create new
PUT    /api/admin/locations/:id      // Update
DELETE /api/admin/locations/:id      // Delete
POST   /api/admin/locations/generate // AI generate config
```

### Database Queries:
```typescript
// List all
await prisma.locationConfig.findMany({
  orderBy: { priority: 'desc' }
})

// Create
await prisma.locationConfig.create({ data: {...} })

// Update
await prisma.locationConfig.update({
  where: { id },
  data: {...}
})

// Delete
await prisma.locationConfig.delete({ where: { id } })
```

## 2. Job Scrapers Management Page

**Path**: `/src/app/admin/scrapers/page.tsx`

### Features Needed:
- **Scraper List**: Display all available scrapers
  - Name (Indeed, LinkedIn, RemoteOK, etc.)
  - Domain/URL
  - Status (Active/Inactive)
  - Last Run timestamp
  - Success Rate (%) from last 10 runs
  - Jobs Scraped (today/total)

- **Scraper Details Card**: For each scraper
  - Configuration settings
  - Rate limits
  - Timeout settings
  - Retry attempts
  - Enable/Disable toggle

- **Test Scraper**: Button to test individual scraper
  - Run test scrape
  - Show results in real-time
  - Display errors if any

- **Scraper Stats**: Charts showing
  - Jobs scraped per day (last 7 days)
  - Success rate trend
  - Error types breakdown

### Available Scrapers:
```typescript
const scrapers = [
  'indeed', 'linkedin', 'remoteok', 'glassdoor',
  'ziprecruiter', 'monster', 'dice', 'stackoverflow',
  'reed', 'seek', 'jobbank', 'weworkremotely', 'naukri'
]
```

### API Endpoints Required:
```typescript
GET  /api/admin/scrapers         // List all scrapers with stats
POST /api/admin/scrapers/test    // Test a scraper
PUT  /api/admin/scrapers/:name   // Update scraper config
GET  /api/admin/scrapers/:name/stats // Get detailed stats
```

### Data to Track:
Create a `ScraperStats` table:
```prisma
model ScraperStats {
  id              String   @id @default(uuid())
  scraperName     String
  timestamp       DateTime @default(now())
  jobsFound       Int
  duration        Int      // milliseconds
  success         Boolean
  errorMessage    String?
  @@map("scraper_stats")
}
```

## 3. Scraping Schedule Management

**Path**: `/src/app/admin/schedule/page.tsx`

### Features Needed:
- **Current Schedule Display**:
  - Frequency (Every 6 hours, Daily, etc.)
  - Last run timestamp
  - Next scheduled run
  - Active/Paused status
  - Jobs collected in last run

- **Schedule Configuration**:
  - Frequency selector (dropdown)
    - Every hour
    - Every 6 hours
    - Every 12 hours
    - Daily
    - Custom cron expression
  - Active hours (time range)
  - Days of week (if daily)
  - Sources to scrape (multi-select)

- **Manual Trigger**:
  - "Run Now" button
  - Progress indicator
  - Real-time log output

- **Schedule History**:
  - Table of past runs
  - Status (Success/Failed)
  - Duration
  - Jobs found
  - Error logs (if failed)

### API Endpoints Required:
```typescript
GET  /api/admin/schedule         // Get current schedule
PUT  /api/admin/schedule         // Update schedule
POST /api/admin/schedule/run     // Manual trigger
GET  /api/admin/schedule/history // Get run history
GET  /api/admin/schedule/logs    // Get logs for a run
```

### Database Schema:
```prisma
model ScrapeSchedule {
  id               String   @id @default(uuid())
  frequency        String   // cron expression
  isActive         Boolean  @default(true)
  lastRun          DateTime?
  nextRun          DateTime
  sourcesToScrape  String[] // which scrapers to run
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  @@map("scrape_schedules")
}

model ScrapeRun {
  id            String   @id @default(uuid())
  startTime     DateTime @default(now())
  endTime       DateTime?
  status        String   // running, success, failed
  jobsFound     Int      @default(0)
  sources       String[]
  errorMessage  String?
  logs          Json?
  @@map("scrape_runs")
}
```

## 4. AI Engines Configuration

**Path**: `/src/app/admin/ai-engines/page.tsx`

### Features Needed:
- **Engine List**: Display all configured AI engines
  - Name (OpenAI, Anthropic)
  - Model (gpt-4o-mini, claude-sonnet-4.5)
  - API Key (masked: sk-...abc)
  - Status (Active/Inactive)
  - Usage today (requests, tokens, cost)
  - Usage this month

- **Engine Configuration Card**:
  - Provider selector (OpenAI, Anthropic)
  - Model selector (dropdown of available models)
  - API Key input (password field)
  - Cost per 1K tokens (input)
  - Default for feature (checkboxes)
    - Resume parsing
    - Job matching
    - Cover letter generation
    - Interview prep
  - Rate limits
  - Active toggle

- **Usage Statistics**:
  - Chart: API calls over time
  - Chart: Cost over time
  - Table: Cost breakdown by feature
  - Total cost today/month/all-time

- **Test Engine**: Button to test API connection
  - Send test request
  - Show response
  - Display latency

### API Endpoints Required:
```typescript
GET    /api/admin/ai-engines           // List all engines
POST   /api/admin/ai-engines           // Add new engine
PUT    /api/admin/ai-engines/:id       // Update config
DELETE /api/admin/ai-engines/:id       // Remove engine
POST   /api/admin/ai-engines/:id/test  // Test connection
GET    /api/admin/ai-engines/usage     // Get usage stats
```

### Database Schema:
```prisma
model AIEngine {
  id                String   @id @default(uuid())
  name              String   // "OpenAI GPT-4o-mini"
  provider          String   // "openai" or "anthropic"
  model             String   // "gpt-4o-mini"
  apiKey            String   // Encrypted
  costPer1kTokens   Decimal  @db.Decimal(10, 6)
  isActive          Boolean  @default(true)
  defaultFor        String[] // ["resume_parsing", "job_matching"]
  rateLimit         Int?     // requests per minute
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  @@map("ai_engines")
}

model AIUsage {
  id              String   @id @default(uuid())
  engineId        String
  feature         String   // "resume_parsing", "job_matching", etc.
  inputTokens     Int
  outputTokens    Int
  cost            Decimal  @db.Decimal(10, 6)
  duration        Int      // milliseconds
  timestamp       DateTime @default(now())
  userId          String?
  success         Boolean  @default(true)
  errorMessage    String?
  @@map("ai_usage")
}
```

## Common UI Components to Create

### 1. Data Table Component
```tsx
// components/admin/DataTable.tsx
// Reusable table with:
// - Sorting
// - Filtering
// - Pagination
// - Row actions (edit, delete)
```

### 2. Modal Component
```tsx
// components/admin/Modal.tsx
// For forms and confirmations
```

### 3. Stats Card Component
```tsx
// components/admin/StatsCard.tsx
// Reusable card for displaying metrics
```

### 4. Toggle Switch Component
```tsx
// components/admin/Toggle.tsx
// For active/inactive states
```

## Implementation Order

1. ✅ **Update admin layout** (DONE)
2. **Create database schemas**
   - Add ScraperStats, ScrapeSchedule, ScrapeRun, AIEngine, AIUsage models
   - Run `npx prisma db push`
3. **Build API endpoints**
   - Start with GET endpoints for each page
   - Then POST/PUT/DELETE
4. **Create page components**
   - Start with Locations (simplest)
   - Then Scrapers
   - Then Schedule
   - Finally AI Engines (most complex)
5. **Test each feature**
   - CRUD operations
   - Real-time updates
   - Error handling

## Quick Start Command

```bash
# 1. Add new Prisma models to schema.prisma
# 2. Push to database
npx prisma db push

# 3. Generate Prisma client
npx prisma generate

# 4. Create API routes (use existing /api/admin structure)
# 5. Create page files
# 6. Test in browser at /admin
```

## Security Notes

- ✅ All admin routes already protected by admin check
- ✅ API endpoints should verify admin status
- ⚠️  Encrypt AI API keys before storing in database
- ⚠️  Never expose full API keys in responses (mask them)
- ⚠️  Log all admin actions for audit trail

## Next Steps

The structure is now in place. To implement each page:
1. Create the page file
2. Create the corresponding API endpoints
3. Add database models if needed
4. Test functionality

Would you like me to proceed with implementing any specific page first?
