# Deployment Checklist - Hybrid Scraping Architecture

## ✅ Implementation Complete

### What Was Built

**10 Job Board Scrapers**:
1. Indeed
2. RemoteOK
3. Glassdoor
4. LinkedIn (STRICT anti-blocking)
5. ZipRecruiter
6. Monster
7. CareerBuilder
8. SimplyHired
9. Stack Overflow
10. Dice (Tech-focused)

**4 Database Services**:
1. JobStorageService - Store/search jobs with full-text search
2. ScheduleService - Manage scraping schedules
3. CacheService - Cache search results (1-4 hour TTL)
4. ScrapingLogService - Track all scraping operations

**Netlify Scheduled Function**:
- Runs hourly via cron
- Processes 70 default schedules
- Max 3 concurrent scrapers

**Hybrid Search Flow**:
- Layer 1: Cache (<100ms)
- Layer 2: Database (<500ms)
- Layer 3: JIT Scraping (5-30s)
- Layer 4: API Fallback (5-10s)

## 📋 Deployment Steps

### Step 1: Apply Database Migration ⏳

**Option A: Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** → **New Query**
4. Copy entire file: `supabase/migrations/20250110000000_create_jobs_tables.sql`
5. Paste and click **Run**

**Option B: Supabase CLI**
```bash
# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migration
supabase db push
```

**What Gets Created:**
- ✅ 4 tables (jobs, scraping_schedules, search_cache, scraping_logs)
- ✅ 70 default job search schedules
- ✅ Full-text search indexes
- ✅ Helper functions

### Step 2: Environment Variables

Ensure these are set in your `.env.local`:

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional APIs (fallback only)
ADZUNA_APP_ID=your_app_id
ADZUNA_APP_KEY=your_app_key
RAPIDAPI_KEY=your_rapidapi_key

# OpenAI/Anthropic (for AI features)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### Step 3: Deploy to Netlify

```bash
# Install Netlify CLI (if not already installed)
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Step 4: Verify Scheduled Function

1. Go to Netlify Dashboard → Your Site
2. Navigate to **Functions**
3. Find `scheduled-scraper`
4. Verify cron schedule: `0 * * * *` (every hour)
5. Check logs after first run

### Step 5: Test the System

**Test Cache Layer:**
```bash
# Make a search request
curl https://your-site.netlify.app/api/jobs/search?keywords=software+engineer

# Repeat same search (should be faster - cache hit)
curl https://your-site.netlify.app/api/jobs/search?keywords=software+engineer
```

**Test Database:**
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) FROM jobs WHERE is_active = true;
SELECT COUNT(*) FROM scraping_schedules WHERE is_active = true;
SELECT * FROM scraping_logs ORDER BY created_at DESC LIMIT 10;
```

**Test Scheduled Function:**
Wait 1 hour after deployment, then check:
```sql
-- Should see scraping logs
SELECT
  source,
  COUNT(*) as total_scrapes,
  SUM(items_stored) as total_jobs
FROM scraping_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY source;
```

## 📊 Expected Results

### After 1 Hour
- ✅ First scheduled scrape completed
- ✅ ~200-500 jobs stored in database
- ✅ Scraping logs show success/errors

### After 24 Hours
- ✅ ~1,680 scrapes completed (70 schedules × 24 runs)
- ✅ ~5,000-10,000 jobs in database
- ✅ Cache starting to populate
- ✅ Search performance improving

### After 7 Days (Steady State)
- ✅ ~100,000-150,000 active jobs
- ✅ 80%+ cache hit rate
- ✅ <500ms average search time
- ✅ Full market coverage

## 🎯 Default Schedules (70 Total)

### Priority 10 (Highest) - 4 schedules
- LinkedIn: Software Engineer (SF, NYC, Remote, Full Stack)

### Priority 9 - 6 schedules
- ZipRecruiter, Dice, Indeed: Software Engineer, Java, Python

### Priority 8 - 6 schedules
- Frontend, Backend, Full Stack, React, Node.js

### Priority 7 - 6 schedules
- DevOps, Data Scientist, Data Engineer, Cloud, ML, AWS

### Priority 6 - 9 schedules
- Product Manager, Program Manager, Delivery Manager, Agile Coach, Scrum Master, TPM, Designer

### Priority 5 - 6 schedules
- Business Analyst, Data Analyst, BI Analyst, Systems Analyst, Technical BA, Product Analyst

### Priority 4 - 8 schedules
- Mobile (iOS, Android), QA, SQA, Test Automation, Security, Cybersecurity

### Priority 3 - 6 schedules
- SRE, Network Engineer, DBA, System Admin, IT Support, Technical Support

### Priority 2 - 6 schedules
- Entry-level, Junior, Intern, Associate, Graduate positions

### Priority 1 - 10 schedules
- Regional hubs (Austin, Seattle, Boston, Chicago, LA) + Specialized (Blockchain, AI, Salesforce, Embedded)

## 💰 Cost Analysis

### Current (Free Tier)
- Netlify Functions: **$0** (50,400 scrapes/month < 125,000 limit)
- Supabase: **$0** (~250K jobs < 500MB limit)
- Total: **$0/month** ✅

### If Scaling Beyond Free Tier
- Netlify Pro: $19/month (1M function invocations)
- Supabase Pro: $25/month (8GB database)
- Total: **~$44/month** (for 10x traffic)

## 🚨 Monitoring

### Key Metrics to Watch

**Scraping Health:**
```sql
-- Success rate by source
SELECT
  source,
  COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as success_rate,
  AVG(duration_ms) as avg_duration_ms,
  SUM(items_stored) as total_jobs_stored
FROM scraping_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY source
ORDER BY success_rate DESC;
```

**Cache Performance:**
```sql
-- Cache hit rate
SELECT
  COUNT(*) as total_entries,
  SUM(hit_count) as total_hits,
  AVG(hit_count) as avg_hits_per_entry,
  COUNT(*) FILTER (WHERE hit_count > 0) * 100.0 / COUNT(*) as cache_hit_rate
FROM search_cache
WHERE expires_at > NOW();
```

**Database Growth:**
```sql
-- Jobs by source
SELECT
  source,
  COUNT(*) as active_jobs,
  MAX(scraped_at) as last_scraped,
  MIN(scraped_at) as oldest_job
FROM jobs
WHERE is_active = true
GROUP BY source
ORDER BY active_jobs DESC;
```

## 🔧 Maintenance Tasks

### Daily
- [ ] Check scraping logs for errors
- [ ] Monitor cache hit rate (target: >70%)
- [ ] Verify scheduled function runs (24/day)

### Weekly
- [ ] Review popular searches (add to schedules if needed)
- [ ] Check database size (should be <500MB)
- [ ] Analyze scraping success rates by source

### Monthly
- [ ] Clean up old logs: `SELECT cleanup_old_logs(30)`
- [ ] Review and optimize schedules
- [ ] Check for IP blocking issues
- [ ] Update scraper selectors if sites changed

## 🐛 Troubleshooting

### Issue: No jobs in database
**Solution:**
1. Check Netlify function logs
2. Verify Supabase connection
3. Manually trigger: `netlify functions:invoke scheduled-scraper`

### Issue: Low cache hit rate (<50%)
**Solution:**
1. Check if searches match scheduled queries
2. Increase schedule frequency for popular searches
3. Add more default schedules

### Issue: Scraping failures
**Solution:**
1. Check scraping logs: `SELECT * FROM scraping_logs WHERE status = 'error'`
2. Look for blocking patterns: `SELECT source, COUNT(*) FROM scraping_logs WHERE status = 'error' GROUP BY source`
3. Increase delays for blocked sources
4. Temporarily disable problematic sources

### Issue: Database growing too fast
**Solution:**
1. Reduce schedule frequency
2. Decrease schedules for low-priority searches
3. Lower TTL for job expiry (currently 30 days)

## 📚 Additional Resources

- **Architecture**: `SCRAPING_ARCHITECTURE.md`
- **Implementation**: `HYBRID_SCRAPING_IMPLEMENTATION.md`
- **Scrapers**: `src/lib/scrapers/`
- **Services**: `src/lib/services/`
- **Migration**: `supabase/migrations/20250110000000_create_jobs_tables.sql`

## ✅ Success Criteria

- [x] 10 scrapers implemented
- [x] 70 default schedules configured
- [x] 4 database services created
- [x] Hybrid search flow integrated
- [x] Scheduled function ready
- [ ] **Migration applied to Supabase** ⏳ (YOUR NEXT STEP)
- [ ] **Deployed to Netlify**
- [ ] **Verified scheduled scraping works**

---

**Current Status**: ✅ Code complete, ready for database migration and deployment

**Next Action**: Apply the Supabase migration using Step 1 above
