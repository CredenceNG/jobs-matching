/**
 * Serverless-Compatible Puppeteer Browser Launcher
 *
 * Uses @sparticuz/chromium for Netlify/Vercel serverless environments
 * Falls back to local Puppeteer for development
 *
 * @description Provides a unified interface for launching Chrome/Chromium
 * @cost Free - uses serverless-compatible Chrome binary
 */

import type { Browser, Page } from 'puppeteer-core'

/**
 * Get the appropriate Puppeteer instance based on environment
 */
async function getPuppeteer() {
  // In serverless (production), use puppeteer-core
  if (process.env.NODE_ENV === 'production' || process.env.NETLIFY || process.env.VERCEL) {
    const puppeteer = await import('puppeteer-core')
    return puppeteer.default
  }

  // In development, use full puppeteer
  const puppeteer = await import('puppeteer')
  return puppeteer.default
}

/**
 * Get Chrome executable path for serverless environment
 */
async function getChromePath(): Promise<string | undefined> {
  // In serverless environments, use @sparticuz/chromium
  if (process.env.NODE_ENV === 'production' || process.env.NETLIFY || process.env.VERCEL) {
    try {
      const chromium = await import('@sparticuz/chromium')

      // Get the executable path (chromium will download if needed)
      const executablePath = await chromium.default.executablePath()
      console.log('🌐 [Serverless Chrome] Using @sparticuz/chromium:', executablePath)

      return executablePath
    } catch (error) {
      console.error('❌ [Serverless Chrome] Failed to load @sparticuz/chromium:', error)
      throw new Error('Serverless Chrome initialization failed')
    }
  }

  // In development, let Puppeteer use bundled Chrome
  console.log('💻 [Local Chrome] Using bundled Chromium')
  return undefined
}

/**
 * Get Chrome launch arguments for serverless
 */
async function getChromeArgs(): Promise<string[]> {
  // Base args for headless Chrome
  const baseArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
  ]

  // In serverless, add @sparticuz/chromium args
  if (process.env.NODE_ENV === 'production' || process.env.NETLIFY || process.env.VERCEL) {
    try {
      const chromium = await import('@sparticuz/chromium')
      const chromiumArgs = await chromium.default.args
      return [...baseArgs, ...chromiumArgs]
    } catch (error) {
      console.warn('⚠️  [Serverless Chrome] Could not load @sparticuz/chromium args, using base args')
      return baseArgs
    }
  }

  return baseArgs
}

/**
 * Launch a browser instance compatible with serverless environments
 *
 * @param options Optional Puppeteer launch options
 * @returns Puppeteer Browser instance
 */
export async function launchServerlessBrowser(options: {
  headless?: boolean
  timeout?: number
} = {}): Promise<Browser> {
  try {
    const puppeteer = await getPuppeteer()
    const executablePath = await getChromePath()
    const args = await getChromeArgs()

    const browser = await puppeteer.launch({
      executablePath,
      args,
      headless: options.headless ?? true,
      timeout: options.timeout ?? 30000,
      // Serverless-specific optimizations
      defaultViewport: {
        width: 1280,
        height: 720,
      },
    })

    console.log('✅ [Browser] Launched successfully')
    return browser as any // Type compatibility between puppeteer and puppeteer-core
  } catch (error) {
    console.error('❌ [Browser] Launch failed:', error)
    throw new Error(`Failed to launch browser: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create a stealth page that avoids bot detection
 *
 * @param browser Browser instance
 * @returns Puppeteer Page with stealth settings
 */
export async function createStealthPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage()

  // Set realistic user agent
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  )

  // Set extra headers to look like real browser
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  })

  // Override navigator properties to hide automation
  await page.evaluateOnNewDocument(() => {
    // Override webdriver property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    })

    // Override plugins and languages
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    })

    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    })
  })

  console.log('✅ [Page] Created stealth page')
  return page
}

/**
 * Utility: Close browser gracefully
 */
export async function closeBrowser(browser: Browser | null): Promise<void> {
  if (browser) {
    try {
      await browser.close()
      console.log('✅ [Browser] Closed successfully')
    } catch (error) {
      console.warn('⚠️  [Browser] Error during close:', error)
    }
  }
}
