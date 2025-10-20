# Dynamic Location Support System

## Overview

The Dynamic Location Support System allows JobAI to add new countries and regions **without code changes**. Location configurations are stored in the database and can be managed through Prisma Studio or an admin API.

## Architecture

### Components

1. **Database Table**: `location_configs` - Stores location configurations
2. **Dynamic Mapper**: `dynamic-location-mapper.ts` - Queries database for location matching
3. **Static Fallback**: `location-mapper.ts` - Original static configuration (fallback)
4. **Cache Layer**: In-memory cache with 5-minute TTL for performance
5. **Admin Tools**: Scripts and APIs for managing location configs

### Benefits

✅ **No Code Deployment Required** - Add Brazil, Mexico, Italy, etc. via database
✅ **Priority-Based Matching** - Higher priority locations checked first
✅ **Keyword Flexibility** - Add multiple aliases per location
✅ **Performance** - Cached configurations for fast lookups
✅ **Graceful Degradation** - Falls back to static config if database unavailable
✅ **Admin UI Ready** - Easy to integrate with Prisma Studio or custom admin panel

## Setup

### 1. Run Database Migration

```bash
# Apply the schema changes
npx prisma migrate dev --name add_location_config

# Or run the SQL directly
psql $DATABASE_URL < prisma/migrations/add_location_config.sql
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Seed Initial Data

```bash
# Populate with 13 pre-configured locations
npx ts-node scripts/seed-locations.ts
```

This seeds:
- **North America**: Canada, United States
- **Europe**: UK, Germany, France, Netherlands, Spain
- **Asia**: India, Singapore, Japan
- **Oceania**: Australia, New Zealand
- **Global**: Remote/Worldwide

### 4. Update Scraper Service

Replace static location mapper with dynamic one:

```typescript
// In src/lib/services/scraper-job-search.ts

// OLD (static)
import { getScrapersForLocation } from '@/lib/scrapers/location-mapper';

// NEW (dynamic)
import { getScrapersForLocationDynamic } from '@/lib/scrapers/dynamic-location-mapper';

// Then update the method
private async getDefaultSources(location?: string): Promise<JobBoardSource[]> {
  // Use dynamic location detection
  const locationScrapers = await getScrapersForLocationDynamic(location);

  const globalScrapers: JobBoardSource[] = ['remoteok', 'stackoverflow', 'weworkremotely'];
  const allScrapers = [...new Set([...locationScrapers, ...globalScrapers])];

  return allScrapers as JobBoardSource[];
}
```

## Usage

### For Users

Users simply enter their location preference (e.g., "London, UK", "Toronto", "Remote") and the system automatically:
1. Matches keywords against database configurations
2. Selects appropriate job boards for that region
3. Uses the correct Indeed domain (e.g., `uk.indeed.com`)
4. Falls back to global boards if no match

### For Admins

#### Adding a New Location (No Code Required!)

**Option 1: Via Prisma Studio**

```bash
npx prisma studio
```

Then:
1. Navigate to `LocationConfig` table
2. Click "Add Record"
3. Fill in:
   - **region**: e.g., `'south_america'`
   - **country**: e.g., `'Brazil'`
   - **keywords**: `['brazil', 'sao paulo', 'rio', 'brasil']`
   - **indeedDomain**: `'br.indeed.com'`
   - **linkedinRegion**: `'Brazil'`
   - **recommendedBoards**: `['indeed', 'linkedin', 'catho', 'vagas']`
   - **priority**: `90` (higher = checked first)
   - **isActive**: `true`
4. Save

**Option 2: Via Script**

```typescript
import { addLocationConfig } from '@/lib/scrapers/dynamic-location-mapper';

await addLocationConfig({
  region: 'south_america',
  country: 'Brazil',
  keywords: ['brazil', 'sao paulo', 'rio', 'brasil'],
  indeedDomain: 'br.indeed.com',
  linkedinRegion: 'Brazil',
  recommendedBoards: ['indeed', 'linkedin', 'catho', 'vagas'],
  priority: 90,
});
```

**Option 3: Via SQL**

```sql
INSERT INTO location_configs (
  region, country, keywords, indeed_domain, linkedin_region,
  recommended_boards, priority, is_active
) VALUES (
  'south_america',
  'Brazil',
  ARRAY['brazil', 'sao paulo', 'rio', 'brasil'],
  'br.indeed.com',
  'Brazil',
  ARRAY['indeed', 'linkedin', 'catho', 'vagas'],
  90,
  true
);
```

#### Updating a Location

```typescript
import { updateLocationConfig } from '@/lib/scrapers/dynamic-location-mapper';

await updateLocationConfig('location-uuid-here', {
  keywords: ['uk', 'united kingdom', 'london', 'manchester', 'liverpool'], // Add Liverpool
  recommendedBoards: ['indeed', 'linkedin', 'reed', 'totaljobs', 'cwjobs', 'adzuna'], // Add Adzuna
});
```

#### Deactivating a Location

```typescript
import { deactivateLocationConfig } from '@/lib/scrapers/dynamic-location-mapper';

await deactivateLocationConfig('location-uuid-here');
```

## Database Schema

```prisma
model LocationConfig {
  id                 String   @id @default(uuid()) @db.Uuid
  region             String   // Geographic region
  country            String   // Country name
  keywords           String[] // Search keywords (lowercase)
  indeedDomain       String   // e.g., 'uk.indeed.com'
  linkedinRegion     String   // LinkedIn region name
  recommendedBoards  String[] // Job board identifiers
  isActive           Boolean  @default(true)
  priority           Int      @default(0) // Higher = checked first
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([isActive])
  @@index([priority(sort: Desc)])
  @@map("location_configs")
}
```

## Matching Logic

1. Convert user input to lowercase: `"London, UK"` → `"london, uk"`
2. Query active configs ordered by priority DESC
3. Check if any keyword matches (using `Array.some()`)
4. Return first match (highest priority wins)
5. If no match, return global/default configuration

### Priority Guidelines

- **100**: Major English-speaking countries (Canada, UK, Australia)
- **90**: Large tech markets (Germany, India, Singapore)
- **80-85**: Other established markets
- **50**: Remote/Global
- **0**: Custom/experimental locations

## Performance

- **Cache**: Configs cached in memory for 5 minutes
- **Database Queries**: Only when cache expires
- **Fast Lookups**: Keywords checked via Array.some() (O(n*m) but small dataset)
- **Graceful Failure**: Uses stale cache or static fallback if DB unavailable

## API Endpoints (Optional)

Create admin endpoints for location management:

```typescript
// src/app/api/admin/locations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAllLocationConfigs, addLocationConfig } from '@/lib/scrapers/dynamic-location-mapper';

// GET all locations
export async function GET(req: NextRequest) {
  try {
    const configs = await getAllLocationConfigs();
    return NextResponse.json({ success: true, configs });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch locations' }, { status: 500 });
  }
}

// POST new location
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const newConfig = await addLocationConfig(data);
    return NextResponse.json({ success: true, config: newConfig }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create location' }, { status: 500 });
  }
}
```

## Migration from Static to Dynamic

### Step 1: Keep Both Systems

```typescript
// During transition, fall back to static if dynamic fails
import { getScrapersForLocation } from '@/lib/scrapers/location-mapper'; // static
import { getScrapersForLocationDynamic } from '@/lib/scrapers/dynamic-location-mapper'; // dynamic

async function getScrapers(location?: string): Promise<string[]> {
  try {
    return await getScrapersForLocationDynamic(location);
  } catch (error) {
    console.error('Dynamic location failed, using static fallback');
    return getScrapersForLocation(location);
  }
}
```

### Step 2: Test Thoroughly

```bash
# Test with various locations
curl -X POST /api/resume-job-search \
  -F "resume=@test.pdf" \
  -F 'preferences={"preferredLocation":"London, UK"}'

curl -X POST /api/resume-job-search \
  -F "resume=@test.pdf" \
  -F 'preferences={"preferredLocation":"Brazil"}'
```

### Step 3: Remove Static System

Once confident, remove the static location mapper and use only dynamic.

## Examples: Adding New Locations

### Example 1: Mexico

```sql
INSERT INTO location_configs VALUES (
  gen_random_uuid(),
  'north_america',
  'Mexico',
  ARRAY['mexico', 'mexico city', 'guadalajara', 'monterrey'],
  'mx.indeed.com',
  'Mexico',
  ARRAY['indeed', 'linkedin', 'occ', 'computrabajo'],
  90,
  true,
  NOW(),
  NOW()
);
```

### Example 2: Italy

```typescript
await addLocationConfig({
  region: 'europe',
  country: 'Italy',
  keywords: ['italy', 'rome', 'milan', 'italia', 'roma', 'milano'],
  indeedDomain: 'it.indeed.com',
  linkedinRegion: 'Italy',
  recommendedBoards: ['indeed', 'linkedin', 'infojobs'],
  priority: 85,
});
```

### Example 3: South Africa

```sql
INSERT INTO location_configs VALUES (
  gen_random_uuid(),
  'africa',
  'South Africa',
  ARRAY['south africa', 'johannesburg', 'cape town', 'durban', 'pretoria'],
  'za.indeed.com',
  'South Africa',
  ARRAY['indeed', 'linkedin', 'pnet', 'careers24'],
  85,
  true,
  NOW(),
  NOW()
);
```

## Monitoring & Analytics

Track which locations are being searched:

```typescript
// Add to location detection function
console.log(`✅ [Analytics] Location matched: ${config.country} for input "${location}"`);

// Or store in database
await prisma.locationAnalytics.create({
  data: {
    locationInput: location,
    matchedCountry: config.country,
    timestamp: new Date(),
  },
});
```

## Future Enhancements

1. **Auto-suggest locations** - Typeahead based on `keywords` array
2. **Analytics dashboard** - Popular locations, unused configs
3. **A/B testing** - Test different scraper combinations per location
4. **Community contributions** - Allow users to suggest new locations
5. **Localization** - Store job board names in multiple languages

## Troubleshooting

### Cache Not Refreshing

```typescript
import { refreshLocationCache } from '@/lib/scrapers/dynamic-location-mapper';
refreshLocationCache(); // Force refresh
```

### Location Not Matching

1. Check keywords in database: `SELECT * FROM location_configs WHERE 'your_keyword' = ANY(keywords);`
2. Verify `isActive = true`
3. Check priority order: Higher priority configs checked first
4. Look at logs: `console.log` in `detectLocationConfigDynamic`

### Database Connection Issues

The system automatically falls back to an empty array, which then uses the default global configuration.

## Summary

The Dynamic Location System makes JobAI **infinitely extensible** without code deployments. Add any country in the world via:
- Prisma Studio (GUI)
- SQL scripts
- Admin API endpoints
- Direct Prisma calls

All with 5-minute cached performance and graceful degradation. 🌍
