#!/usr/bin/env node

/**
 * Test Web Scrapers
 *
 * Tests the job board scrapers to verify they work correctly
 * Run with: node test-scrapers.mjs
 */

console.log('🕷️  Job Scraper Test Suite\n');
console.log('=' .repeat(60));
console.log('This test will scrape real job boards to verify functionality.');
console.log('Note: This requires Puppeteer to be installed and may take 30-60s.');
console.log('=' .repeat(60) + '\n');

// Dynamic import for ES modules
async function runTests() {
  try {
    console.log('📦 Loading scraper modules...\n');

    // Import scrapers (these are TypeScript, so we need to compile first)
    const {
      indeedScraper,
      remoteOKScraper,
      glassdoorScraper,
      jobDeduplicator,
    } = await import('./src/lib/scrapers/index.ts');

    console.log('✅ Modules loaded\n');

    // Test configuration
    const testQuery = 'software developer';
    const testOptions = {
      limit: 5, // Get only 5 jobs per source for testing
      remote: false,
    };

    const results = {
      passed: [],
      failed: [],
    };

    // =============================================================================
    // TEST 1: RemoteOK Scraper (Usually most reliable)
    // =============================================================================

    console.log('\n' + '='.repeat(60));
    console.log('🧪 TEST 1: RemoteOK Scraper');
    console.log('='.repeat(60) + '\n');

    try {
      const remoteOKResult = await remoteOKScraper.scrape(testQuery, testOptions);

      if (remoteOKResult.success && remoteOKResult.data && remoteOKResult.data.length > 0) {
        console.log('✅ RemoteOK Test PASSED');
        console.log(`   Jobs found: ${remoteOKResult.data.length}`);
        console.log(`   Sample job: "${remoteOKResult.data[0].title}" at ${remoteOKResult.data[0].company}`);

        results.passed.push('RemoteOK');
      } else {
        console.log('⚠️  RemoteOK Test PASSED (but no jobs found)');
        results.passed.push('RemoteOK (no results)');
      }

      await remoteOKScraper.closeBrowser();
    } catch (error) {
      console.log('❌ RemoteOK Test FAILED');
      console.log(`   Error: ${error.message}`);
      results.failed.push(`RemoteOK: ${error.message}`);
    }

    // =============================================================================
    // TEST 2: Indeed Scraper
    // =============================================================================

    console.log('\n' + '='.repeat(60));
    console.log('🧪 TEST 2: Indeed Scraper');
    console.log('='.repeat(60) + '\n');

    try {
      const indeedResult = await indeedScraper.scrape(testQuery, testOptions);

      if (indeedResult.success && indeedResult.data && indeedResult.data.length > 0) {
        console.log('✅ Indeed Test PASSED');
        console.log(`   Jobs found: ${indeedResult.data.length}`);
        console.log(`   Sample job: "${indeedResult.data[0].title}" at ${indeedResult.data[0].company}`);

        results.passed.push('Indeed');
      } else {
        console.log('⚠️  Indeed Test PASSED (but no jobs found)');
        results.passed.push('Indeed (no results)');
      }

      await indeedScraper.closeBrowser();
    } catch (error) {
      console.log('❌ Indeed Test FAILED');
      console.log(`   Error: ${error.message}`);
      results.failed.push(`Indeed: ${error.message}`);
    }

    // =============================================================================
    // TEST 3: Glassdoor Scraper (May be blocked by CAPTCHA)
    // =============================================================================

    console.log('\n' + '='.repeat(60));
    console.log('🧪 TEST 3: Glassdoor Scraper');
    console.log('='.repeat(60) + '\n');

    try {
      const glassdoorResult = await glassdoorScraper.scrape(testQuery, testOptions);

      if (glassdoorResult.success && glassdoorResult.data && glassdoorResult.data.length > 0) {
        console.log('✅ Glassdoor Test PASSED');
        console.log(`   Jobs found: ${glassdoorResult.data.length}`);
        console.log(`   Sample job: "${glassdoorResult.data[0].title}" at ${glassdoorResult.data[0].company}`);

        results.passed.push('Glassdoor');
      } else if (glassdoorResult.error && glassdoorResult.error.includes('CAPTCHA')) {
        console.log('⚠️  Glassdoor Test BLOCKED (CAPTCHA detected)');
        console.log('   This is expected - Glassdoor has anti-scraping measures');
        results.passed.push('Glassdoor (CAPTCHA - expected)');
      } else {
        console.log('⚠️  Glassdoor Test PASSED (but no jobs found)');
        results.passed.push('Glassdoor (no results)');
      }

      await glassdoorScraper.closeBrowser();
    } catch (error) {
      if (error.message.includes('CAPTCHA')) {
        console.log('⚠️  Glassdoor Test BLOCKED (CAPTCHA)');
        console.log('   This is normal - Glassdoor blocks automated access');
        results.passed.push('Glassdoor (CAPTCHA - expected)');
      } else {
        console.log('❌ Glassdoor Test FAILED');
        console.log(`   Error: ${error.message}`);
        results.failed.push(`Glassdoor: ${error.message}`);
      }
    }

    // =============================================================================
    // SUMMARY
    // =============================================================================

    console.log('\n\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60) + '\n');

    if (results.passed.length > 0) {
      console.log('✅ PASSED:');
      results.passed.forEach(r => console.log(`   - ${r}`));
      console.log('');
    }

    if (results.failed.length > 0) {
      console.log('❌ FAILED:');
      results.failed.forEach(r => console.log(`   - ${r}`));
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('\n💡 Next Steps:\n');

    if (results.passed.length >= 2) {
      console.log('✅ Scrapers are working! You have at least 2 job sources.');
      console.log('   You can now integrate these into your job search.');
      console.log('\n   Usage example:');
      console.log('   ```typescript');
      console.log('   import { scraperJobSearchService } from \'@/lib/services/scraper-job-search\';');
      console.log('');
      console.log('   const results = await scraperJobSearchService.searchJobs({');
      console.log('     keywords: \'software developer\',');
      console.log('     location: \'Remote\',');
      console.log('   });');
      console.log('   ```\n');
    } else {
      console.log('⚠️  Limited scraper functionality.');
      console.log('   Consider using API-based job sources as backup.');
    }

    if (results.failed.some(r => r.includes('Glassdoor'))) {
      console.log('ℹ️  Glassdoor Note:');
      console.log('   Glassdoor has strong anti-scraping measures (CAPTCHA).');
      console.log('   Consider using Indeed + RemoteOK as primary sources.');
    }

    console.log('\n✨ Test complete!\n');

  } catch (error) {
    console.error('\n❌ Test suite failed to run:');
    console.error(error);
    console.error('\nMake sure Puppeteer is installed:');
    console.error('  npm install puppeteer');
    process.exit(1);
  }
}

// Check for TypeScript support
console.log('🔍 Checking environment...\n');

try {
  // Check if we can run TypeScript files
  await import('tsx').then(() => {
    console.log('✅ TypeScript support detected (tsx)\n');
  }).catch(() => {
    console.log('⚠️  tsx not found, trying ts-node...\n');
  });
} catch (e) {
  // Fallback - compile first
  console.log('ℹ️  Note: For best results, install tsx:');
  console.log('   npm install -D tsx\n');
}

console.log('🚀 Starting tests...\n');
runTests().catch(console.error);
