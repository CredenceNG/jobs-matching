/**
 * Dynamic Location Mapper
 *
 * Database-driven location configuration system that allows adding new locations
 * without code changes. Falls back to static config if database is unavailable.
 *
 * @module DynamicLocationMapper
 */

import { prisma } from '@/lib/prisma';

// =============================================================================
// TYPES
// =============================================================================

export interface LocationConfig {
  region: string;
  country: string;
  indeedDomain: string;
  linkedInRegion: string;
  recommendedBoards: string[];
}

interface DbLocationConfig {
  id: string;
  region: string;
  country: string;
  keywords: string[];
  indeedDomain: string;
  linkedinRegion: string;
  recommendedBoards: string[];
  isActive: boolean;
  priority: number;
}

// =============================================================================
// CACHE
// =============================================================================

// In-memory cache for location configs (refresh every 5 minutes)
let cachedConfigs: DbLocationConfig[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load location configs from database with caching
 */
async function loadLocationConfigs(): Promise<DbLocationConfig[]> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedConfigs && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedConfigs;
  }

  try {
    console.log('🔄 [Dynamic Location] Refreshing location configs from database...');

    const configs = await prisma.locationConfig.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
      select: {
        id: true,
        region: true,
        country: true,
        keywords: true,
        indeedDomain: true,
        linkedinRegion: true,
        recommendedBoards: true,
        isActive: true,
        priority: true,
      },
    });

    cachedConfigs = configs;
    cacheTimestamp = now;

    console.log(`✅ [Dynamic Location] Loaded ${configs.length} location configs`);
    return configs;
  } catch (error) {
    console.error('❌ [Dynamic Location] Failed to load from database:', error);

    // If we have stale cache, use it
    if (cachedConfigs) {
      console.log('⚠️  [Dynamic Location] Using stale cache');
      return cachedConfigs;
    }

    // Otherwise return empty array (will fall back to static config)
    return [];
  }
}

// =============================================================================
// LOCATION DETECTION
// =============================================================================

/**
 * Detect location configuration from user input using database
 * Falls back to static configuration if database is unavailable
 *
 * @param location User's location string (e.g., "Toronto", "London, UK", "Remote")
 * @returns Location configuration with scrapers and domains
 */
export async function detectLocationConfigDynamic(location?: string): Promise<LocationConfig> {
  if (!location) {
    return getDefaultConfig();
  }

  const loc = location.toLowerCase().trim();

  // Try database-driven matching first
  try {
    const configs = await loadLocationConfigs();

    // Find matching config by checking if any keyword matches
    // Higher priority configs are checked first (ordered by priority DESC)
    for (const config of configs) {
      const matches = config.keywords.some(keyword =>
        loc.includes(keyword.toLowerCase())
      );

      if (matches) {
        console.log(`✅ [Dynamic Location] Matched "${location}" to ${config.country} (priority: ${config.priority})`);
        return {
          region: config.region,
          country: config.country,
          indeedDomain: config.indeedDomain,
          linkedInRegion: config.linkedinRegion,
          recommendedBoards: config.recommendedBoards,
        };
      }
    }

    console.log(`⚠️  [Dynamic Location] No match found for "${location}", using default`);
  } catch (error) {
    console.error('❌ [Dynamic Location] Error during detection:', error);
  }

  // Fall back to default global config
  return getDefaultConfig();
}

/**
 * Get all available scrapers for a location (database-driven)
 */
export async function getScrapersForLocationDynamic(location?: string): Promise<string[]> {
  console.log(`🌍 [Dynamic Location] Input location: "${location}"`);

  const config = await detectLocationConfigDynamic(location);
  console.log(`🗺️  [Dynamic Location] Detected config:`, config);

  // Always include these global boards for broader coverage
  const globalBoards = ['remoteok', 'linkedin', 'stackoverflow'];

  // Combine recommended boards with global boards
  const allBoards = Array.from(new Set([...config.recommendedBoards, ...globalBoards]));
  console.log(`📋 [Dynamic Location] Final scrapers:`, allBoards);

  return allBoards;
}

/**
 * Get Indeed domain for location (database-driven)
 */
export async function getIndeedDomainDynamic(location?: string): Promise<string> {
  const config = await detectLocationConfigDynamic(location);
  return config.indeedDomain;
}

// =============================================================================
// FALLBACK / DEFAULT
// =============================================================================

/**
 * Get default global configuration
 */
function getDefaultConfig(): LocationConfig {
  return {
    region: 'global',
    country: 'Global',
    indeedDomain: 'indeed.com',
    linkedInRegion: 'global',
    recommendedBoards: ['indeed', 'remoteok', 'linkedin', 'stackoverflow'],
  };
}

// =============================================================================
// ADMIN UTILITIES
// =============================================================================

/**
 * Add a new location configuration (admin only)
 */
export async function addLocationConfig(config: Omit<DbLocationConfig, 'id' | 'isActive'>): Promise<DbLocationConfig> {
  const newConfig = await prisma.locationConfig.create({
    data: {
      region: config.region,
      country: config.country,
      keywords: config.keywords,
      indeedDomain: config.indeedDomain,
      linkedinRegion: config.linkedinRegion,
      recommendedBoards: config.recommendedBoards,
      priority: config.priority,
      isActive: true,
    },
  });

  // Invalidate cache
  cachedConfigs = null;

  console.log(`✅ [Dynamic Location] Added new location config: ${config.country}`);
  return newConfig as DbLocationConfig;
}

/**
 * Update an existing location configuration (admin only)
 */
export async function updateLocationConfig(
  id: string,
  updates: Partial<Omit<DbLocationConfig, 'id'>>
): Promise<DbLocationConfig> {
  const updated = await prisma.locationConfig.update({
    where: { id },
    data: updates,
  });

  // Invalidate cache
  cachedConfigs = null;

  console.log(`✅ [Dynamic Location] Updated location config: ${id}`);
  return updated as DbLocationConfig;
}

/**
 * Deactivate a location configuration (admin only)
 */
export async function deactivateLocationConfig(id: string): Promise<void> {
  await prisma.locationConfig.update({
    where: { id },
    data: { isActive: false },
  });

  // Invalidate cache
  cachedConfigs = null;

  console.log(`✅ [Dynamic Location] Deactivated location config: ${id}`);
}

/**
 * Get all location configurations (admin only)
 */
export async function getAllLocationConfigs(): Promise<DbLocationConfig[]> {
  return await prisma.locationConfig.findMany({
    orderBy: [
      { isActive: 'desc' },
      { priority: 'desc' },
    ],
  }) as DbLocationConfig[];
}

/**
 * Force refresh cache
 */
export function refreshLocationCache(): void {
  cachedConfigs = null;
  cacheTimestamp = 0;
  console.log('🔄 [Dynamic Location] Cache invalidated');
}
