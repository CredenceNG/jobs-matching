#!/usr/bin/env node

/**
 * API Key Testing Utility
 *
 * Tests all configured API keys to verify they work
 * Run with: node test-api-keys.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
try {
  const envFile = readFileSync(join(__dirname, '.env.local'), 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
} catch (err) {
  console.error('❌ Could not load .env.local file:', err.message);
  process.exit(1);
}

const results = {
  passed: [],
  failed: [],
  skipped: []
};

console.log('🔑 Testing API Keys...\n');
console.log('=' .repeat(60));

/**
 * Test OpenAI API Key
 */
async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    results.skipped.push('OpenAI: No API key configured');
    console.log('⏭️  OpenAI: SKIPPED (no API key)');
    return;
  }

  console.log('🧪 Testing OpenAI API...');
  console.log(`   Key: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 4)}`);

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      results.passed.push(`OpenAI: ✅ Valid (${data.data?.length || 0} models available)`);
      console.log(`✅ OpenAI: WORKING (${data.data?.length || 0} models available)`);
    } else {
      const error = await response.text();
      results.failed.push(`OpenAI: ❌ ${response.status} - ${error}`);
      console.log(`❌ OpenAI: FAILED`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${error.substring(0, 200)}...`);
    }
  } catch (error) {
    results.failed.push(`OpenAI: ❌ ${error.message}`);
    console.log(`❌ OpenAI: ERROR - ${error.message}`);
  }

  console.log('');
}

/**
 * Test Anthropic Claude API Key
 */
async function testAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    results.skipped.push('Anthropic: No API key configured');
    console.log('⏭️  Anthropic: SKIPPED (no API key)');
    return;
  }

  console.log('🧪 Testing Anthropic Claude API...');
  console.log(`   Key: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 4)}`);

  try {
    // Simple test message
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [
          { role: 'user', content: 'Say "test"' }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      results.passed.push(`Anthropic: ✅ Valid (Claude 3.5 Sonnet)`);
      console.log(`✅ Anthropic: WORKING (Claude 3.5 Sonnet)`);
      console.log(`   Response: "${data.content[0].text}"`);
    } else {
      const error = await response.text();
      results.failed.push(`Anthropic: ❌ ${response.status} - ${error}`);
      console.log(`❌ Anthropic: FAILED`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${error}`);
    }
  } catch (error) {
    results.failed.push(`Anthropic: ❌ ${error.message}`);
    console.log(`❌ Anthropic: ERROR - ${error.message}`);
  }

  console.log('');
}

/**
 * Test RapidAPI (JSearch) Key
 */
async function testRapidAPI() {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    results.skipped.push('RapidAPI: No API key configured');
    console.log('⏭️  RapidAPI: SKIPPED (no API key)');
    return;
  }

  console.log('🧪 Testing RapidAPI (JSearch)...');
  console.log(`   Key: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 4)}`);

  try {
    const response = await fetch(
      'https://jsearch.p.rapidapi.com/search?query=nodejs+developer&page=1&num_pages=1',
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      const jobCount = data.data?.length || 0;
      results.passed.push(`RapidAPI: ✅ Valid (${jobCount} jobs found)`);
      console.log(`✅ RapidAPI: WORKING (${jobCount} jobs found)`);
    } else {
      const error = await response.text();
      results.failed.push(`RapidAPI: ❌ ${response.status} - ${error}`);
      console.log(`❌ RapidAPI: FAILED`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${error.substring(0, 200)}...`);
    }
  } catch (error) {
    results.failed.push(`RapidAPI: ❌ ${error.message}`);
    console.log(`❌ RapidAPI: ERROR - ${error.message}`);
  }

  console.log('');
}

/**
 * Test Adzuna API
 */
async function testAdzuna() {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    results.skipped.push('Adzuna: No API credentials configured');
    console.log('⏭️  Adzuna: SKIPPED (no API credentials)');
    return;
  }

  console.log('🧪 Testing Adzuna API...');
  console.log(`   App ID: ${appId}`);

  try {
    const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${appId}&app_key=${appKey}&what=developer&results_per_page=5`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      const jobCount = data.results?.length || 0;
      results.passed.push(`Adzuna: ✅ Valid (${jobCount} jobs found)`);
      console.log(`✅ Adzuna: WORKING (${jobCount} jobs found)`);
    } else {
      const error = await response.text();
      results.failed.push(`Adzuna: ❌ ${response.status} - ${error}`);
      console.log(`❌ Adzuna: FAILED`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${error.substring(0, 200)}...`);
    }
  } catch (error) {
    results.failed.push(`Adzuna: ❌ ${error.message}`);
    console.log(`❌ Adzuna: ERROR - ${error.message}`);
  }

  console.log('');
}

/**
 * Main test runner
 */
async function runTests() {
  await testOpenAI();
  await testAnthropic();
  await testRapidAPI();
  await testAdzuna();

  // Print summary
  console.log('=' .repeat(60));
  console.log('\n📊 Test Summary:\n');

  if (results.passed.length > 0) {
    console.log('✅ PASSED:');
    results.passed.forEach(r => console.log(`   ${r}`));
    console.log('');
  }

  if (results.failed.length > 0) {
    console.log('❌ FAILED:');
    results.failed.forEach(r => console.log(`   ${r}`));
    console.log('');
  }

  if (results.skipped.length > 0) {
    console.log('⏭️  SKIPPED:');
    results.skipped.forEach(r => console.log(`   ${r}`));
    console.log('');
  }

  console.log('=' .repeat(60));
  console.log('\n💡 Next Steps:\n');

  if (results.failed.some(r => r.includes('OpenAI'))) {
    console.log('🔧 OpenAI Fix:');
    console.log('   1. Add credits at https://platform.openai.com/account/billing');
    console.log('   2. OR get new API key at https://platform.openai.com/api-keys');
    console.log('   3. Update OPENAI_API_KEY in .env.local\n');
  }

  if (results.failed.some(r => r.includes('Anthropic'))) {
    console.log('🔧 Anthropic Fix:');
    console.log('   1. Get API key at https://console.anthropic.com/settings/keys');
    console.log('   2. Update ANTHROPIC_API_KEY in .env.local\n');
  }

  if (results.failed.some(r => r.includes('RapidAPI'))) {
    console.log('🔧 RapidAPI Fix:');
    console.log('   1. Sign up at https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch');
    console.log('   2. Subscribe to free tier');
    console.log('   3. Update RAPIDAPI_KEY in .env.local\n');
  }

  if (results.passed.length === 0 && results.failed.length > 0) {
    console.log('⚠️  NO WORKING API KEYS FOUND!');
    console.log('   The system needs at least ONE AI API key (OpenAI or Anthropic) to function.\n');
  } else if (results.passed.some(r => r.includes('OpenAI') || r.includes('Anthropic'))) {
    console.log('✨ You have working AI API keys! System is ready to use.');
    console.log('   Run: npm run dev');
    console.log('   Test at: http://localhost:3000/resume-jobs\n');
  }
}

// Run the tests
runTests().catch(console.error);
