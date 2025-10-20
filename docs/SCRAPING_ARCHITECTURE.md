# Hybrid Job Scraping Architecture
## Strategy: Scheduled Scraping + Just-In-Time (JIT) Search

---

## 🎯 Core Strategy

### 1. **Scheduled Background Scraping** (Database Cache)
- **Purpose**: Build and maintain a fresh job database
- **Frequency**: Every 4-6 hours for popular searches
- **Storage**: Supabase PostgreSQL
- **Benefit**: Fast search results, reduced scraping load

### 2. **Just-In-Time (JIT) Scraping** (Live Search)
- **Purpose**: Handle unique/niche queries not in cache
- **Trigger**: When cache miss or stale data
- **Storage**: Temporary (returned directly, optionally cached)
- **Benefit**: Always fresh for specific searches

---

## 📊 Database Schema (Supabase)

```sql
-- Jobs table (cached scraped jobs)
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE NOT NULL, -- Job ID from source
  source TEXT NOT NULL, -- 'linkedin', 'ziprecruiter', 'monster', etc.

  -- Job details
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  location_type TEXT, -- 'remote', 'hybrid', 'onsite'
  employment_type TEXT, -- 'full-time', 'part-time', 'contract'
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  description TEXT,
  requirements TEXT,
  url TEXT,

  -- Metadata
  posted_date TIMESTAMP,
  scraped_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Auto-calculated based on posted_date
  is_active BOOLEAN DEFAULT true,

  -- Search optimization
  search_vector TSVECTOR, -- Full-text search
  keywords TEXT[], -- Array for quick filtering

  -- Deduplication
  content_hash TEXT, -- Hash of title+company+description for dedup

  -- Indexes
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_jobs_source ON jobs(source);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_employment_type ON jobs(employment_type);
CREATE INDEX idx_jobs_posted_date ON jobs(posted_date DESC);
CREATE INDEX idx_jobs_scraped_at ON jobs(scraped_at DESC);
CREATE INDEX idx_jobs_is_active ON jobs(is_active) WHERE is_active = true;
CREATE INDEX idx_jobs_content_hash ON jobs(content_hash);
CREATE INDEX idx_jobs_search_vector ON jobs USING GIN(search_vector);
CREATE INDEX idx_jobs_keywords ON jobs USING GIN(keywords);

-- Trigger to update search_vector
CREATE TRIGGER jobs_search_vector_update
  BEFORE INSERT OR UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', title, company, description);

-- Scraping schedules (what to scrape and when)
CREATE TABLE scraping_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL, -- 'linkedin', 'ziprecruiter', etc.
  search_query TEXT NOT NULL, -- e.g., "software engineer"
  location TEXT, -- e.g., "San Francisco"
  filters JSONB, -- Additional filters

  -- Scheduling
  frequency_hours INTEGER DEFAULT 6, -- Scrape every 6 hours
  last_scraped_at TIMESTAMP,
  next_scrape_at TIMESTAMP,

  -- Stats
  total_scrapes INTEGER DEFAULT 0,
  last_job_count INTEGER DEFAULT 0,
  average_duration_ms INTEGER,

  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5, -- 1-10, higher = more important

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_schedules_next_scrape ON scraping_schedules(next_scrape_at)
  WHERE is_active = true;

-- Search cache (for popular searches)
CREATE TABLE search_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_key TEXT UNIQUE NOT NULL, -- Hash of search params
  search_params JSONB NOT NULL,
  job_ids UUID[] NOT NULL, -- Array of job IDs

  -- Cache metadata
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_search_cache_expires ON search_cache(expires_at);
CREATE INDEX idx_search_cache_key ON search_cache(search_key);

-- Scraping logs (for monitoring and debugging)
CREATE TABLE scraping_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  search_query TEXT,

  -- Results
  jobs_found INTEGER DEFAULT 0,
  jobs_new INTEGER DEFAULT 0,
  jobs_updated INTEGER DEFAULT 0,
  jobs_deduplicated INTEGER DEFAULT 0,

  -- Performance
  duration_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_logs_source ON scraping_logs(source);
CREATE INDEX idx_logs_created_at ON scraping_logs(created_at DESC);
```

---

## 🤖 Scraping Strategy by Source

### **Anti-Blocking Techniques**

```typescript
// Common anti-blocking strategies
const antiBlockingConfig = {
  // 1. Rotate User Agents
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36...',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36...',
  ],

  // 2. Request delays (per source)
  delays: {
    linkedin: 5000,      // 5 seconds between requests (strict)
    ziprecruiter: 3000,  // 3 seconds
    monster: 2000,       // 2 seconds
    careerbuilder: 2000,
    simplyhired: 2000,
    stackoverflow: 3000,
  },

  // 3. Max concurrent scrapers
  maxConcurrent: 2, // Only 2 scrapers running at once

  // 4. Proxy rotation (optional, for production)
  useProxies: false, // Enable in production

  // 5. Headless browser with stealth
  puppeteerOptions: {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  },
};
```

### **Per-Source Configuration**

```typescript
// LinkedIn - STRICT (high risk of blocking)
{
  source: 'linkedin',
  method: 'scheduled_only', // NEVER do JIT, too risky
  frequency: 12, // Every 12 hours (less frequent)
  maxPages: 2,   // Only scrape first 2 pages
  delay: 5000,   // 5 second delay between requests
  useCache: true,
  cacheDuration: 24, // Cache for 24 hours
}

// ZipRecruiter - MODERATE
{
  source: 'ziprecruiter',
  method: 'hybrid', // Scheduled + JIT for cache misses
  frequency: 6,     // Every 6 hours
  maxPages: 5,
  delay: 3000,
  useCache: true,
  cacheDuration: 12,
}

// Monster - MODERATE
{
  source: 'monster',
  method: 'hybrid',
  frequency: 6,
  maxPages: 5,
  delay: 2000,
  useCache: true,
  cacheDuration: 12,
}

// CareerBuilder - MODERATE
{
  source: 'careerbuilder',
  method: 'hybrid',
  frequency: 6,
  maxPages: 5,
  delay: 2000,
  useCache: true,
  cacheDuration: 12,
}

// SimplyHired - LOW RISK
{
  source: 'simplyhired',
  method: 'hybrid',
  frequency: 4, // Every 4 hours
  maxPages: 10,
  delay: 1500,
  useCache: true,
  cacheDuration: 8,
}

// Stack Overflow Jobs - LOW RISK
{
  source: 'stackoverflow',
  method: 'hybrid',
  frequency: 6,
  maxPages: 5,
  delay: 3000,
  useCache: true,
  cacheDuration: 12,
}
```

---

## 🔄 Search Flow Architecture

```
User Search Request
       |
       v
┌─────────────────────────┐
│ 1. Check Search Cache   │ <- Hash search params
│    (Supabase)           │
└─────────────────────────┘
       |
       v
   Cache Hit? ────YES───> Return Cached Results (FAST: <100ms)
       |
       NO
       v
┌─────────────────────────┐
│ 2. Query Jobs Table     │ <- Full-text search
│    (Supabase)           │    + filters
└─────────────────────────┘
       |
       v
   Fresh Data? ────YES───> Apply AI Scoring -> Return Results (FAST: <500ms)
   (< 6hrs old)
       |
       NO (stale or no results)
       v
┌─────────────────────────┐
│ 3. JIT Scraping         │ <- Scrape 1-2 sources
│    (Live)               │    with anti-blocking
└─────────────────────────┘
       |
       v
   Success? ────YES───> Store in DB -> Apply AI Scoring -> Return Results (SLOW: 5-15s)
       |
       NO
       v
┌─────────────────────────┐
│ 4. Fallback to APIs     │ <- RemoteOK, Adzuna, JSearch
│    (External)           │
└─────────────────────────┘
       |
       v
   Return Results (MEDIUM: 2-5s)
```

---

## ⏰ Scheduled Scraping Service

```typescript
// Netlify Function (Scheduled)
// File: netlify/functions/scheduled-scraper.ts

export async function handler(event: any) {
  // Runs every hour via Netlify cron

  // 1. Get due scraping schedules
  const dueSchedules = await getDueSchedules();

  // 2. Prioritize: High priority first
  const sorted = dueSchedules.sort((a, b) => b.priority - a.priority);

  // 3. Process with concurrency limit
  const results = await processBatch(sorted.slice(0, 5), {
    maxConcurrent: 2, // Only 2 at a time to avoid blocking
  });

  // 4. Store jobs in Supabase
  await storeScrapedJobs(results);

  // 5. Update schedules
  await updateSchedules(results);

  // 6. Log results
  await logScrapingResults(results);

  return {
    statusCode: 200,
    body: JSON.stringify({ scraped: results.length }),
  };
}

// Default schedules to create
const defaultSchedules = [
  // Popular tech roles
  { query: 'software engineer', location: 'San Francisco', priority: 10 },
  { query: 'software engineer', location: 'New York', priority: 10 },
  { query: 'software engineer', location: 'Remote', priority: 10 },
  { query: 'full stack developer', location: 'Remote', priority: 9 },
  { query: 'frontend developer', location: 'Remote', priority: 8 },
  { query: 'backend developer', location: 'Remote', priority: 8 },
  { query: 'devops engineer', location: 'Remote', priority: 7 },
  { query: 'data scientist', location: 'Remote', priority: 7 },
  { query: 'product manager', location: 'Remote', priority: 6 },
  { query: 'project manager', location: 'Remote', priority: 6 },
];
```

---

## 🚀 Implementation Plan

### **Phase 1: Database Setup**
1. Create Supabase tables (jobs, schedules, logs, cache)
2. Add indexes and full-text search
3. Create database helper functions

### **Phase 2: New Scrapers**
1. **LinkedIn Scraper** (high priority, strict anti-blocking)
2. **ZipRecruiter Scraper**
3. **Monster Scraper**
4. **CareerBuilder Scraper**
5. **SimplyHired Scraper**
6. **Stack Overflow Scraper**

### **Phase 3: Scheduled Service**
1. Create Netlify scheduled function (runs hourly)
2. Implement smart scheduling logic
3. Add anti-blocking middleware
4. Create admin dashboard for monitoring

### **Phase 4: JIT Integration**
1. Update search service to check cache first
2. Add JIT fallback for cache misses
3. Implement smart source selection for JIT

### **Phase 5: Optimization**
1. Add search analytics to identify popular searches
2. Auto-create schedules for popular searches
3. Expire old jobs automatically
4. Add proxy rotation for production

---

## 📈 Benefits of This Architecture

### ✅ **For Users:**
- **Fast searches** (most queries: <500ms from cache)
- **Fresh results** (refreshed every 4-6 hours)
- **Wide coverage** (7+ job sources)
- **Always works** (JIT fallback for niche searches)

### ✅ **For System:**
- **Reduced scraping load** (scheduled vs. on-demand)
- **Lower blocking risk** (controlled request rate)
- **Cost effective** (cache reduces API calls)
- **Scalable** (database can handle millions of jobs)

### ✅ **For Development:**
- **Easy monitoring** (logs table tracks everything)
- **Flexible scheduling** (adjust frequency per source)
- **Graceful degradation** (multiple fallback layers)

---

## 🔧 Configuration Example

```typescript
// config/scraping.ts
export const scrapingConfig = {
  // Database cache settings
  cache: {
    searchResultsTTL: 3600,      // 1 hour
    jobFreshnessTTL: 21600,      // 6 hours
    maxCacheSize: 100000,        // 100k jobs max
    autoExpireAfterDays: 30,     // Remove jobs older than 30 days
  },

  // Scheduling
  scheduling: {
    enabled: true,
    defaultFrequency: 6,         // 6 hours
    maxSchedules: 50,            // Limit schedules to avoid overload
    cronExpression: '0 * * * *', // Run every hour
  },

  // JIT scraping
  jit: {
    enabled: true,
    maxSources: 2,               // Scrape max 2 sources for JIT
    timeout: 15000,              // 15 second timeout
    cacheMissThreshold: 5,       // If <5 results in cache, trigger JIT
  },

  // Anti-blocking
  blocking: {
    useRotatingAgents: true,
    useProxies: false,           // Enable in production
    respectRobotsTxt: true,
    maxRetriesPerSource: 2,
  },
};
```

---

## 📊 Monitoring Dashboard

Track these metrics:
- **Cache hit rate** (target: >80%)
- **Average search latency** (target: <500ms)
- **Scraping success rate** (target: >90%)
- **Jobs in database** (growth over time)
- **Active schedules** (by priority)
- **Blocking incidents** (minimize)
- **API costs** (should decrease with cache)

---

## 🎯 Summary

This hybrid architecture gives you:

1. **Fast searches** - 80%+ from cache (<500ms)
2. **Fresh data** - Scheduled scraping every 4-6 hours
3. **Complete coverage** - JIT for niche searches
4. **Anti-blocking** - Smart delays, rotation, limited concurrency
5. **Scalability** - Database can handle millions of jobs
6. **Cost efficiency** - Reduced API calls, free scraping
7. **Reliability** - Multiple fallback layers

**Next Steps**: Would you like me to implement:
1. The Supabase schema (SQL migrations)?
2. The new scrapers (LinkedIn, ZipRecruiter, etc.)?
3. The scheduled scraping service?
4. The JIT search integration?
