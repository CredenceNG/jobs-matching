-- Migration: Add dynamic location configuration support
-- This allows admins to add/modify location support without code changes

CREATE TABLE "LocationConfig" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "region" TEXT NOT NULL, -- e.g., 'north_america', 'europe', 'asia'
  "country" TEXT NOT NULL, -- e.g., 'Canada', 'United Kingdom'
  "keywords" TEXT[] NOT NULL, -- e.g., ['canada', 'toronto', 'vancouver']
  "indeed_domain" TEXT NOT NULL, -- e.g., 'ca.indeed.com'
  "linkedin_region" TEXT NOT NULL, -- e.g., 'Canada'
  "recommended_boards" TEXT[] NOT NULL, -- e.g., ['indeed', 'linkedin', 'jobbank']
  "is_active" BOOLEAN DEFAULT true,
  "priority" INTEGER DEFAULT 0, -- Higher priority = checked first
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for fast lookups
CREATE INDEX "idx_location_keywords" ON "LocationConfig" USING GIN ("keywords");
CREATE INDEX "idx_location_active" ON "LocationConfig" ("is_active");
CREATE INDEX "idx_location_priority" ON "LocationConfig" ("priority" DESC);

-- Seed with initial data
INSERT INTO "LocationConfig" (region, country, keywords, indeed_domain, linkedin_region, recommended_boards, priority) VALUES
  ('north_america', 'Canada', ARRAY['canada', 'toronto', 'vancouver', 'montreal', 'ottawa', 'calgary', 'edmonton'], 'ca.indeed.com', 'Canada', ARRAY['indeed', 'linkedin', 'jobbank', 'workopolis', 'eluta'], 100),
  ('europe', 'United Kingdom', ARRAY['uk', 'united kingdom', 'london', 'manchester', 'birmingham', 'england', 'scotland', 'wales'], 'uk.indeed.com', 'United Kingdom', ARRAY['indeed', 'linkedin', 'reed', 'totaljobs', 'cwjobs'], 100),
  ('oceania', 'Australia', ARRAY['australia', 'sydney', 'melbourne', 'brisbane', 'perth'], 'au.indeed.com', 'Australia', ARRAY['indeed', 'linkedin', 'seek', 'jora'], 100),
  ('europe', 'Germany', ARRAY['germany', 'berlin', 'munich', 'hamburg', 'deutschland'], 'de.indeed.com', 'Germany', ARRAY['indeed', 'linkedin', 'stepstone', 'xing'], 90),
  ('europe', 'France', ARRAY['france', 'paris', 'lyon', 'marseille'], 'fr.indeed.com', 'France', ARRAY['indeed', 'linkedin', 'apec', 'jobteaser'], 90),
  ('asia', 'India', ARRAY['india', 'bangalore', 'mumbai', 'delhi', 'hyderabad'], 'in.indeed.com', 'India', ARRAY['indeed', 'linkedin', 'naukri', 'monsterindia'], 90),
  ('asia', 'Singapore', ARRAY['singapore'], 'sg.indeed.com', 'Singapore', ARRAY['indeed', 'linkedin', 'jobstreet', 'jobsdb'], 90),
  ('north_america', 'United States', ARRAY['usa', 'united states', 'america', 'new york', 'san francisco', 'los angeles', 'chicago', 'boston', 'seattle', 'austin', 'denver'], 'indeed.com', 'United States', ARRAY['indeed', 'linkedin', 'glassdoor', 'dice', 'monster', 'ziprecruiter'], 80),
  ('global', 'Remote', ARRAY['remote', 'anywhere', 'worldwide'], 'indeed.com', 'global', ARRAY['remoteok', 'weworkremotely', 'linkedin', 'stackoverflow', 'indeed'], 50);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_location_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_location_config
  BEFORE UPDATE ON "LocationConfig"
  FOR EACH ROW
  EXECUTE FUNCTION update_location_config_updated_at();
