/**
 * Location Mapper Utility
 *
 * Maps user location preferences to appropriate job boards and domains
 * Supports international job searches across multiple countries
 */

export type JobBoardRegion =
  | 'us'
  | 'canada'
  | 'uk'
  | 'europe'
  | 'australia'
  | 'asia'
  | 'global';

export interface LocationConfig {
  region: JobBoardRegion;
  country: string;
  indeedDomain: string;
  linkedInRegion: string;
  recommendedBoards: string[];
}

/**
 * Detect region and country from location string
 */
export function detectLocationConfig(location?: string): LocationConfig {
  if (!location) {
    return {
      region: 'global',
      country: 'global',
      indeedDomain: 'indeed.com',
      linkedInRegion: 'global',
      recommendedBoards: ['indeed', 'remoteok', 'linkedin', 'stackoverflow'],
    };
  }

  const loc = location.toLowerCase();

  // Canada
  if (loc.includes('canada') || loc.includes('toronto') || loc.includes('vancouver') ||
      loc.includes('montreal') || loc.includes('calgary') || loc.includes('ottawa')) {
    return {
      region: 'canada',
      country: 'Canada',
      indeedDomain: 'ca.indeed.com',
      linkedInRegion: 'Canada',
      recommendedBoards: ['indeed', 'linkedin', 'jobbank', 'workopolis', 'eluta'],
    };
  }

  // United Kingdom
  if (loc.includes('uk') || loc.includes('united kingdom') || loc.includes('london') ||
      loc.includes('manchester') || loc.includes('birmingham') || loc.includes('england') ||
      loc.includes('scotland') || loc.includes('wales')) {
    return {
      region: 'uk',
      country: 'United Kingdom',
      indeedDomain: 'uk.indeed.com',
      linkedInRegion: 'United Kingdom',
      recommendedBoards: ['indeed', 'linkedin', 'reed', 'totaljobs', 'cwjobs'],
    };
  }

  // Australia
  if (loc.includes('australia') || loc.includes('sydney') || loc.includes('melbourne') ||
      loc.includes('brisbane') || loc.includes('perth')) {
    return {
      region: 'australia',
      country: 'Australia',
      indeedDomain: 'au.indeed.com',
      linkedInRegion: 'Australia',
      recommendedBoards: ['indeed', 'linkedin', 'seek', 'jora'],
    };
  }

  // Germany
  if (loc.includes('germany') || loc.includes('berlin') || loc.includes('munich') ||
      loc.includes('hamburg') || loc.includes('deutschland')) {
    return {
      region: 'europe',
      country: 'Germany',
      indeedDomain: 'de.indeed.com',
      linkedInRegion: 'Germany',
      recommendedBoards: ['indeed', 'linkedin', 'stepstone', 'xing'],
    };
  }

  // France
  if (loc.includes('france') || loc.includes('paris') || loc.includes('lyon') ||
      loc.includes('marseille')) {
    return {
      region: 'europe',
      country: 'France',
      indeedDomain: 'fr.indeed.com',
      linkedInRegion: 'France',
      recommendedBoards: ['indeed', 'linkedin', 'apec', 'jobteaser'],
    };
  }

  // India
  if (loc.includes('india') || loc.includes('bangalore') || loc.includes('mumbai') ||
      loc.includes('delhi') || loc.includes('hyderabad')) {
    return {
      region: 'asia',
      country: 'India',
      indeedDomain: 'in.indeed.com',
      linkedInRegion: 'India',
      recommendedBoards: ['indeed', 'linkedin', 'naukri', 'monsterindia'],
    };
  }

  // Singapore
  if (loc.includes('singapore')) {
    return {
      region: 'asia',
      country: 'Singapore',
      indeedDomain: 'sg.indeed.com',
      linkedInRegion: 'Singapore',
      recommendedBoards: ['indeed', 'linkedin', 'jobstreet', 'jobsdb'],
    };
  }

  // United States (default for US locations)
  if (loc.includes('usa') || loc.includes('united states') || loc.includes('america') ||
      loc.includes('new york') || loc.includes('san francisco') || loc.includes('los angeles') ||
      loc.includes('chicago') || loc.includes('boston') || loc.includes('seattle') ||
      loc.includes('austin') || loc.includes('denver')) {
    return {
      region: 'us',
      country: 'United States',
      indeedDomain: 'indeed.com',
      linkedInRegion: 'United States',
      recommendedBoards: ['indeed', 'linkedin', 'glassdoor', 'dice', 'monster', 'ziprecruiter'],
    };
  }

  // Remote-only keywords
  if (loc.includes('remote') || loc.includes('anywhere') || loc.includes('worldwide')) {
    return {
      region: 'global',
      country: 'Remote',
      indeedDomain: 'indeed.com',
      linkedInRegion: 'global',
      recommendedBoards: ['remoteok', 'weworkremotely', 'linkedin', 'stackoverflow', 'indeed'],
    };
  }

  // Default to global
  return {
    region: 'global',
    country: 'Global',
    indeedDomain: 'indeed.com',
    linkedInRegion: 'global',
    recommendedBoards: ['indeed', 'remoteok', 'linkedin', 'stackoverflow'],
  };
}

/**
 * Get all available scrapers for a location
 */
export function getScrapersForLocation(location?: string): string[] {
  console.log(`🌍 [Location Mapper] Input location: "${location}"`);
  const config = detectLocationConfig(location);
  console.log(`🗺️  [Location Mapper] Detected config:`, config);

  // Always include these global boards
  const globalBoards = ['remoteok', 'linkedin', 'stackoverflow'];

  // Combine recommended boards with global boards
  const allBoards = [...new Set([...config.recommendedBoards, ...globalBoards])];
  console.log(`📋 [Location Mapper] Final scrapers:`, allBoards);

  return allBoards;
}

/**
 * Get Indeed domain for location
 */
export function getIndeedDomain(location?: string): string {
  return detectLocationConfig(location).indeedDomain;
}
