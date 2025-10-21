/**
 * AI-Powered Location Intelligence
 *
 * Uses AI to enhance location detection with:
 * - Smart normalization (typos, abbreviations, alternate spellings)
 * - Contextual understanding ("Bay Area" → San Francisco)
 * - Multi-language support (París → Paris, München → Munich)
 * - Fuzzy matching for user errors
 * - Auto-generation of location configs
 *
 * @module AILocationIntelligence
 */

import { openaiClient } from '@/lib/ai/openai';
import { anthropicClient } from '@/lib/ai/anthropic';
import { prisma } from '@/lib/prisma';

// =============================================================================
// TYPES
// =============================================================================

interface LocationNormalization {
  original: string;
  normalized: string;
  country: string;
  city?: string;
  region?: string;
  confidence: number;
  suggestions: string[];
}

interface LocationConfigSuggestion {
  country: string;
  region: string;
  keywords: string[];
  indeedDomain: string;
  linkedinRegion: string;
  recommendedBoards: string[];
  priority: number;
  reasoning: string;
}

// =============================================================================
// AI-POWERED LOCATION NORMALIZATION
// =============================================================================

/**
 * Normalize location string using AI to handle:
 * - Typos: "Londn" → "London"
 * - Abbreviations: "SF" → "San Francisco"
 * - Alternate spellings: "Munchen" → "Munich"
 * - Colloquialisms: "The Bay" → "San Francisco Bay Area"
 * - Multi-language: "París" → "Paris"
 *
 * @param locationInput User's raw location input
 * @returns Normalized location with confidence score
 */
export async function normalizeLocationWithAI(
  locationInput: string
): Promise<LocationNormalization> {
  try {
    console.log(`🤖 [AI Location] Normalizing: "${locationInput}"`);

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cheap for this task
      messages: [
        {
          role: 'system',
          content: `You are a location normalization expert. Given a location string, normalize it to a standard format and provide structured information.

RULES:
1. Handle typos, abbreviations, alternate spellings
2. Recognize colloquialisms (e.g., "Bay Area" → "San Francisco")
3. Support multiple languages (e.g., "München" → "Munich")
4. Provide confidence score 0-100
5. Suggest similar locations if unsure

Return JSON format:
{
  "normalized": "London",
  "country": "United Kingdom",
  "city": "London",
  "region": "Europe",
  "confidence": 95,
  "suggestions": ["London, UK", "London, Ontario, Canada"]
}`,
        },
        {
          role: 'user',
          content: `Normalize this location: "${locationInput}"`,
        },
      ],
      temperature: 0.3, // Low temperature for consistency
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    console.log(`✅ [AI Location] Normalized to: ${result.normalized} (confidence: ${result.confidence}%)`);

    return {
      original: locationInput,
      normalized: result.normalized || locationInput,
      country: result.country || 'Unknown',
      city: result.city,
      region: result.region,
      confidence: result.confidence || 50,
      suggestions: result.suggestions || [],
    };
  } catch (error) {
    console.error('❌ [AI Location] Normalization failed:', error);

    // Fallback to original input
    return {
      original: locationInput,
      normalized: locationInput,
      country: 'Unknown',
      confidence: 0,
      suggestions: [],
    };
  }
}

// =============================================================================
// AI-POWERED JOB BOARD RECOMMENDATIONS
// =============================================================================

/**
 * Use AI to recommend job boards for a specific location
 * Considers local market knowledge, language, and job market characteristics
 *
 * @param country Country name
 * @param city Optional city name
 * @returns Recommended job boards with reasoning
 */
export async function recommendJobBoardsWithAI(
  country: string,
  city?: string
): Promise<{ boards: string[]; reasoning: string }> {
  try {
    console.log(`🤖 [AI Location] Recommending job boards for ${city ? city + ', ' : ''}${country}`);

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a global job market expert. Recommend the best job boards for a given location.

Consider:
1. Local popular job sites (e.g., Seek in Australia, Naukri in India)
2. International sites (Indeed, LinkedIn)
3. Tech-specific sites if it's a tech hub
4. Language and regional preferences

Return JSON:
{
  "boards": ["indeed", "linkedin", "local_board_1", "local_board_2"],
  "reasoning": "Brief explanation of why these boards were chosen"
}`,
        },
        {
          role: 'user',
          content: `Recommend job boards for: ${city ? city + ', ' : ''}${country}`,
        },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    console.log(`✅ [AI Location] Recommended ${result.boards?.length || 0} job boards`);

    return {
      boards: result.boards || ['indeed', 'linkedin'],
      reasoning: result.reasoning || 'Default recommendation',
    };
  } catch (error) {
    console.error('❌ [AI Location] Board recommendation failed:', error);

    // Fallback to default boards
    return {
      boards: ['indeed', 'linkedin', 'remoteok'],
      reasoning: 'Fallback to default boards due to error',
    };
  }
}

// =============================================================================
// AI-POWERED AUTO-GENERATION OF LOCATION CONFIGS
// =============================================================================

/**
 * Generate a complete location configuration using AI
 * Perfect for quickly adding new countries/regions
 *
 * @param country Country name
 * @returns Complete location config ready to save
 */
export async function generateLocationConfigWithAI(
  country: string
): Promise<LocationConfigSuggestion> {
  try {
    console.log(`🤖 [AI Location] Generating config for: ${country}`);

    const response = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514', // Use Claude for more thoughtful analysis
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Generate a complete location configuration for job search in ${country}.

Include:
1. **Region**: Geographic region (e.g., 'europe', 'asia', 'south_america')
2. **Keywords**: Array of search keywords including:
   - Country name (English)
   - Country name (local language if different)
   - Major cities (5-10)
   - Common abbreviations
3. **Indeed Domain**: The correct Indeed domain (e.g., 'uk.indeed.com')
4. **LinkedIn Region**: How LinkedIn refers to this location
5. **Recommended Boards**: Popular job boards in this market (5-8 boards)
   - Include local boards (research real job sites used in this country)
   - Include international boards (Indeed, LinkedIn)
   - Include tech boards if it's a tech market
6. **Priority**: Suggest priority 80-100 (100 for major English markets, 90 for large markets, 80-85 for others)
7. **Reasoning**: Explain your board selection

Return valid JSON:
{
  "country": "Brazil",
  "region": "south_america",
  "keywords": ["brazil", "brasil", "sao paulo", "rio", "..."],
  "indeedDomain": "br.indeed.com",
  "linkedinRegion": "Brazil",
  "recommendedBoards": ["indeed", "linkedin", "catho", "vagas", "..."],
  "priority": 90,
  "reasoning": "Brazil has a large tech market..."
}

Research actual job boards used in ${country}. Be accurate.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract JSON from response (Claude might include markdown)
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const result = JSON.parse(jsonMatch[0]);

    console.log(`✅ [AI Location] Generated config for ${result.country}`);
    console.log(`   - Keywords: ${result.keywords.length}`);
    console.log(`   - Boards: ${result.recommendedBoards.join(', ')}`);

    return result;
  } catch (error) {
    console.error('❌ [AI Location] Config generation failed:', error);
    throw error;
  }
}

// =============================================================================
// AI-POWERED LOCATION MATCHING (FUZZY)
// =============================================================================

/**
 * Use AI to match ambiguous or misspelled locations to existing configs
 * Handles cases where keyword matching fails
 *
 * @param locationInput User's input
 * @param availableCountries List of countries in database
 * @returns Best matching country
 */
export async function fuzzyMatchLocationWithAI(
  locationInput: string,
  availableCountries: string[]
): Promise<{ country: string; confidence: number }> {
  try {
    console.log(`🤖 [AI Location] Fuzzy matching: "${locationInput}"`);

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Match a user's location input to the best available country from a list.

Handle:
- Typos
- Abbreviations
- Partial matches
- Colloquialisms

Return JSON:
{
  "country": "United Kingdom",
  "confidence": 95
}`,
        },
        {
          role: 'user',
          content: `Match "${locationInput}" to one of these countries: ${availableCountries.join(', ')}`,
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    console.log(`✅ [AI Location] Matched to: ${result.country} (${result.confidence}% confidence)`);

    return {
      country: result.country || availableCountries[0] || 'Unknown',
      confidence: result.confidence || 50,
    };
  } catch (error) {
    console.error('❌ [AI Location] Fuzzy matching failed:', error);

    // Fallback to first available country
    return {
      country: availableCountries[0] || 'Unknown',
      confidence: 0,
    };
  }
}

// =============================================================================
// INTEGRATED AI LOCATION DETECTION FLOW
// =============================================================================

/**
 * Complete AI-enhanced location detection flow
 *
 * 1. Normalize input with AI (handle typos, etc.)
 * 2. Try database keyword matching
 * 3. If no match, try AI fuzzy matching
 * 4. If still no match, offer to auto-generate config
 *
 * @param locationInput User's raw input
 * @returns Location configuration or suggestion to create one
 */
export async function detectLocationWithAI(locationInput?: string): Promise<{
  config?: any;
  suggestion?: LocationConfigSuggestion;
  shouldCreate: boolean;
  reasoning: string;
}> {
  if (!locationInput) {
    return {
      shouldCreate: false,
      reasoning: 'No location provided, using global default',
    };
  }

  try {
    // Step 1: Normalize input
    const normalized = await normalizeLocationWithAI(locationInput);

    if (normalized.confidence < 30) {
      return {
        shouldCreate: false,
        reasoning: `Low confidence match for "${locationInput}". Consider manual configuration.`,
      };
    }

    // Step 2: Try database matching with normalized input
    const configs = await prisma.locationConfig.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
    });

    const normalizedLower = normalized.normalized.toLowerCase();

    for (const config of configs) {
      const matches = config.keywords.some(keyword =>
        normalizedLower.includes(keyword.toLowerCase())
      );

      if (matches) {
        return {
          config,
          shouldCreate: false,
          reasoning: `Matched to existing config: ${config.country}`,
        };
      }
    }

    // Step 3: Try fuzzy AI matching
    const availableCountries = configs.map(c => c.country);
    const fuzzyMatch = await fuzzyMatchLocationWithAI(normalized.normalized, availableCountries);

    if (fuzzyMatch.confidence > 70) {
      const matchedConfig = configs.find(c => c.country === fuzzyMatch.country);
      if (matchedConfig) {
        return {
          config: matchedConfig,
          shouldCreate: false,
          reasoning: `AI fuzzy matched to: ${fuzzyMatch.country}`,
        };
      }
    }

    // Step 4: No match found - suggest creating new config
    if (normalized.country && normalized.country !== 'Unknown') {
      const suggestion = await generateLocationConfigWithAI(normalized.country);

      return {
        suggestion,
        shouldCreate: true,
        reasoning: `No existing config found. AI generated a suggestion for ${normalized.country}.`,
      };
    }

    return {
      shouldCreate: false,
      reasoning: 'Unable to determine location. Using global default.',
    };
  } catch (error) {
    console.error('❌ [AI Location] Detection flow failed:', error);

    return {
      shouldCreate: false,
      reasoning: `Error during AI detection: ${error}`,
    };
  }
}

// =============================================================================
// ADMIN HELPER: BULK LOCATION GENERATION
// =============================================================================

/**
 * Generate configs for multiple countries at once
 * Useful for quickly expanding to new regions
 *
 * @param countries Array of country names
 * @returns Array of generated configs
 */
export async function bulkGenerateLocationConfigs(
  countries: string[]
): Promise<LocationConfigSuggestion[]> {
  console.log(`🤖 [AI Location] Bulk generating configs for ${countries.length} countries...`);

  const results: LocationConfigSuggestion[] = [];

  for (const country of countries) {
    try {
      const config = await generateLocationConfigWithAI(country);
      results.push(config);

      // Rate limit: Wait 1 second between API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Failed to generate config for ${country}:`, error);
    }
  }

  console.log(`✅ [AI Location] Generated ${results.length}/${countries.length} configs`);

  return results;
}
