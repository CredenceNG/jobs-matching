#!/usr/bin/env node

/**
 * Test Scraper Integration
 *
 * Tests that the job search service correctly uses scrapers
 * Run with: node test-integration.mjs
 */

console.log('🧪 Testing Scraper Integration\n');
console.log('=' .repeat(60));
console.log('This test verifies that job search uses web scrapers.');
console.log('=' .repeat(60) + '\n');

async function testIntegration() {
  try {
    console.log('📦 Loading job search service...\n');

    // This will use the integrated service that tries scrapers first
    const { JobSearchService } = await import('./src/lib/services/job-search.ts');

    const jobSearchService = new JobSearchService();

    console.log('✅ Service loaded\n');

    // Test search
    const testFilters = {
      keywords: 'software developer',
      location: 'Remote',
      remote: true,
    };

    console.log('🔍 Testing job search with filters:');
    console.log(`   Keywords: "${testFilters.keywords}"`);
    console.log(`   Location: "${testFilters.location}"`);
    console.log(`   Remote: ${testFilters.remote}\n`);

    console.log('⏳ Searching... (this may take 10-15 seconds)\n');

    const startTime = Date.now();

    const results = await jobSearchService.searchJobs(testFilters, 1);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '=' .repeat(60));
    console.log('📊 RESULTS');
    console.log('=' .repeat(60) + '\n');

    console.log(`✅ Search completed in ${duration}s`);
    console.log(`   Jobs found: ${results.jobs.length}`);
    console.log(`   Total results: ${results.total}`);
    console.log(`   Page: ${results.page}`);
    console.log(`   Has more: ${results.hasMore}\n`);

    if (results.jobs.length > 0) {
      console.log('📋 Sample Jobs:\n');

      results.jobs.slice(0, 5).forEach((job, index) => {
        console.log(`${index + 1}. ${job.title}`);
        console.log(`   Company: ${job.company}`);
        console.log(`   Location: ${job.location}`);
        console.log(`   Source: ${job.source}`);
        if (job.salary) console.log(`   Salary: ${job.salary}`);
        console.log('');
      });
    }

    console.log('=' .repeat(60));
    console.log('\n💡 Integration Test Result:\n');

    if (results.jobs.length > 0) {
      // Check if jobs came from scrapers (Indeed or RemoteOK)
      const scraperSources = results.jobs.filter(j =>
        j.source === 'Indeed' || j.source === 'RemoteOK'
      );

      if (scraperSources.length > 0) {
        console.log('✅ SUCCESS: Web scrapers are working!');
        console.log(`   ${scraperSources.length}/${results.jobs.length} jobs from web scrapers`);
        console.log(`   Sources used: ${[...new Set(results.jobs.map(j => j.source))].join(', ')}`);
      } else {
        console.log('⚠️  PARTIAL: Jobs found but from API fallbacks');
        console.log(`   Sources used: ${[...new Set(results.jobs.map(j => j.source))].join(', ')}`);
        console.log('   Scrapers may have failed - check logs above');
      }

      console.log('\n✨ Your job search system is operational!\n');
      console.log('Next steps:');
      console.log('1. Run: npm run dev');
      console.log('2. Upload a resume at: http://localhost:3000/resume-jobs');
      console.log('3. See AI-matched jobs from Indeed, RemoteOK, and more!\n');

    } else {
      console.log('❌ FAILED: No jobs found');
      console.log('   Check your internet connection');
      console.log('   Review error logs above for details\n');
    }

  } catch (error) {
    console.error('\n❌ Integration test failed:');
    console.error(error);
    console.error('\nPossible issues:');
    console.error('1. Puppeteer not installed: npm install puppeteer');
    console.error('2. Network connection issues');
    console.error('3. Job boards may be blocking automated access\n');
    process.exit(1);
  }
}

console.log('🚀 Starting integration test...\n');
testIntegration().catch(console.error);
