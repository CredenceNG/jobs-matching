/**
 * Base Web Scraper
 *
 * Provides common functionality for all job board scrapers including:
 * - Rate limiting
 * - Error handling and retries
 * - Proxy support (optional)
 * - User agent rotation
 * - Request delays
 *
 * @description Foundation for all web scraping operations
 */

import { Browser, Page } from "puppeteer-core";
import { launchServerlessBrowser, closeBrowser } from "./serverless-browser";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface ScraperConfig {
  name: string;
  baseUrl: string;
  requestDelayMs?: number;
  maxRetries?: number;
  timeout?: number;
  headless?: boolean;
  userAgents?: string[];
  // Allow additional properties for flexibility
  [key: string]: any;
}

export interface ScrapeResult<T> {
  success: boolean;
  data?: T[];
  error?: string;
  itemsScraped: number;
  duration: number;
  source: string;
}

export interface RateLimitState {
  requestCount: number;
  windowStart: number;
  maxRequestsPerWindow: number;
  windowDurationMs: number;
}

// =============================================================================
// BASE SCRAPER CLASS
// =============================================================================

export abstract class BaseScraper<T> {
  protected config: ScraperConfig;
  protected browser: Browser | null = null;
  private rateLimitState: RateLimitState;

  constructor(config: ScraperConfig) {
    this.config = config;
    this.rateLimitState = {
      requestCount: 0,
      windowStart: Date.now(),
      maxRequestsPerWindow: 10, // Max 10 requests per minute
      windowDurationMs: 60000, // 1 minute window
    };
  }

  /**
   * Initialize browser instance
   * Reuses existing browser to save resources
   * Uses serverless-compatible Chrome launcher
   */
  protected async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      console.log(`🌐 [${this.config.name}] Launching browser...`);

      // Use serverless-compatible browser launcher
      this.browser = await launchServerlessBrowser({
        headless: this.config.headless,
        timeout: this.config.timeout,
      });

      console.log(`✅ [${this.config.name}] Browser launched`);
    }

    return this.browser;
  }

  /**
   * Create a new page with stealth settings to avoid detection
   */
  protected async createStealthPage(): Promise<Page> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Set random user agent
    const userAgent = this.getRandomUserAgent();
    await page.setUserAgent(userAgent);

    // Set extra headers to look more like a real browser
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      Connection: "keep-alive",
    });

    // Block unnecessary resources to speed up scraping
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();

      // Block images, fonts, and media to speed up loading
      if (["image", "font", "media", "stylesheet"].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    return page;
  }

  /**
   * Get random user agent to rotate between requests
   */
  protected getRandomUserAgent(): string {
    const userAgents = this.config.userAgents || [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    ];

    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  /**
   * Rate limiting - ensures we don't make too many requests
   */
  protected async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowElapsed = now - this.rateLimitState.windowStart;

    // Reset window if expired
    if (windowElapsed >= this.rateLimitState.windowDurationMs) {
      this.rateLimitState.requestCount = 0;
      this.rateLimitState.windowStart = now;
      return;
    }

    // Check if we've exceeded the limit
    if (
      this.rateLimitState.requestCount >=
      this.rateLimitState.maxRequestsPerWindow
    ) {
      const waitTime = this.rateLimitState.windowDurationMs - windowElapsed;
      console.log(
        `⏳ [${this.config.name}] Rate limit reached. Waiting ${Math.round(
          waitTime / 1000
        )}s...`
      );
      await this.delay(waitTime);
      this.rateLimitState.requestCount = 0;
      this.rateLimitState.windowStart = Date.now();
    }

    this.rateLimitState.requestCount++;
  }

  /**
   * Delay execution for specified milliseconds
   */
  protected async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Add random delay between requests to appear more human
   */
  protected async randomDelay(): Promise<void> {
    const baseDelay = this.config.requestDelayMs ?? 1000; // Default 1 second
    const randomOffset = Math.random() * 1000; // Add 0-1s random offset
    await this.delay(baseDelay + randomOffset);
  }

  /**
   * Retry wrapper for scraping operations
   */
  protected async withRetry<R>(
    operation: () => Promise<R>,
    operationName: string
  ): Promise<R> {
    let lastError: Error | null = null;
    const maxRetries = this.config.maxRetries ?? 3; // Default 3 retries

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `🔄 [${this.config.name}] ${operationName} (attempt ${attempt}/${maxRetries})`
        );
        const result = await operation();
        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(
          `❌ [${this.config.name}] ${operationName} failed (attempt ${attempt}):`,
          error
        );

        if (attempt < maxRetries) {
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
          console.log(
            `⏳ [${this.config.name}] Retrying in ${backoffDelay}ms...`
          );
          await this.delay(backoffDelay);
        }
      }
    }

    throw new Error(
      `${operationName} failed after ${this.config.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Clean up browser resources
   * Uses serverless-compatible cleanup
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      console.log(`🔚 [${this.config.name}] Closing browser...`);
      await closeBrowser(this.browser);
      this.browser = null;
    }
  }

  /**
   * Abstract method - must be implemented by child scrapers
   * This is where the actual scraping logic goes
   */
  abstract scrape(query: string, options?: any): Promise<ScrapeResult<T>>;

  /**
   * Extract and clean text from HTML element
   */
  protected cleanText(text: string | null | undefined): string {
    if (!text) return "";
    return text.trim().replace(/\s+/g, " ");
  }

  /**
   * Handle scraping errors gracefully
   */
  protected handleError(error: any, operationName: string): ScrapeResult<T> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(
      `❌ [${this.config.name}] ${operationName} error:`,
      errorMessage
    );

    return {
      success: false,
      error: errorMessage,
      itemsScraped: 0,
      duration: 0,
      source: this.config.name,
    };
  }

  /**
   * Log scraping statistics
   */
  protected logStats(
    itemsScraped: number,
    duration: number,
    query: string
  ): void {
    console.log(
      `
📊 [${this.config.name}] Scraping completed:
   Query: "${query}"
   Items: ${itemsScraped}
   Duration: ${(duration / 1000).toFixed(2)}s
   Rate: ${(itemsScraped / (duration / 1000)).toFixed(2)} items/sec
    `.trim()
    );
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate unique job ID from job details
 */
export function generateJobId(
  title: string,
  company: string,
  location: string
): string {
  const combined = `${title}-${company}-${location}`.toLowerCase();
  const cleaned = combined.replace(/[^a-z0-9]/g, "-");

  // Create a simple hash
  let hash = 0;
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `${Math.abs(hash)}-${cleaned.substring(0, 30)}`;
}

/**
 * Normalize job location string
 */
export function normalizeLocation(location: string): string {
  if (!location) return "Remote";

  const cleaned = location.trim();

  // Handle common remote work patterns
  if (/remote|work from home|wfh|anywhere/i.test(cleaned)) {
    return "Remote";
  }

  return cleaned;
}

/**
 * Extract salary range from text
 */
export function extractSalary(text: string): string | undefined {
  if (!text) return undefined;

  // Match patterns like "$100,000 - $150,000" or "$100K-$150K"
  const salaryPattern = /\$[\d,]+[kK]?\s*[-–—]\s*\$[\d,]+[kK]?/;
  const match = text.match(salaryPattern);

  return match ? match[0] : undefined;
}

/**
 * Parse relative date (e.g., "2 days ago") to ISO string
 */
export function parseRelativeDate(dateText: string): string {
  if (!dateText) return new Date().toISOString();

  const now = new Date();
  const lowerText = dateText.toLowerCase();

  // Handle "X days ago"
  const daysMatch = lowerText.match(/(\d+)\s*day/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    now.setDate(now.getDate() - days);
    return now.toISOString();
  }

  // Handle "X hours ago"
  const hoursMatch = lowerText.match(/(\d+)\s*hour/);
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1]);
    now.setHours(now.getHours() - hours);
    return now.toISOString();
  }

  // Handle "today" or "just posted"
  if (lowerText.includes("today") || lowerText.includes("just posted")) {
    return now.toISOString();
  }

  return now.toISOString();
}
