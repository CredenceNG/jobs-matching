#!/usr/bin/env node

/**
 * Test AI Job Search API
 * Tests the complete AI job search pipeline
 */

const fs = require('fs');
const path = require('path');

// Sample resume content
const sampleResume = `
John Doe
Senior Software Engineer
john.doe@email.com | (555) 123-4567 | San Francisco, CA

SUMMARY
Experienced Full Stack Engineer with 6+ years building scalable web applications.
Expert in React, Node.js, TypeScript, and cloud technologies.

SKILLS
Languages: JavaScript, TypeScript, Python, SQL
Frontend: React, Next.js, Vue.js, HTML/CSS, Tailwind
Backend: Node.js, Express, NestJS, GraphQL, REST APIs
Databases: PostgreSQL, MongoDB, Redis
Cloud: AWS (EC2, S3, Lambda), Docker, Kubernetes
Tools: Git, CI/CD, Jest, Webpack

EXPERIENCE

Senior Software Engineer | TechCorp Inc | 2021 - Present
- Led development of microservices platform serving 2M+ users
- Reduced API response time by 60% through optimization
- Mentored team of 5 junior developers
- Technologies: React, Node.js, PostgreSQL, AWS, Docker

Software Engineer | StartupXYZ | 2019 - 2021
- Built customer-facing web applications from scratch
- Implemented real-time features using WebSockets
- Increased test coverage from 30% to 90%
- Technologies: React, Express, MongoDB, Redis

Junior Developer | WebAgency | 2018 - 2019
- Developed responsive websites for clients
- Fixed bugs and maintained existing codebases
- Technologies: HTML, CSS, JavaScript, PHP

EDUCATION
B.S. Computer Science | State University | 2018
GPA: 3.7 | Dean's List
`;

async function testAIJobSearch() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🧪 Testing AI Job Search API');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Create a temporary resume file
    const tempFilePath = path.join(__dirname, 'temp-resume.txt');
    fs.writeFileSync(tempFilePath, sampleResume, 'utf-8');

    // Create form data
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('resume', fs.createReadStream(tempFilePath));

    // Make API request
    console.log('📤 Sending resume to API...\n');

    const response = await fetch('http://localhost:3000/api/ai-job-search', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    // Clean up temp file
    fs.unlinkSync(tempFilePath);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API returned ${response.status}`);
    }

    const data = await response.json();

    // Display results
    console.log('✅ API Response Received\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  📊 SEARCH RESULTS');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Parsed Resume
    if (data.parsedResume) {
      console.log('📄 Resume Analysis:');
      console.log(`   Skills Detected: ${data.parsedResume.skills?.length || 0}`);
      console.log(`   Top Skills: ${data.parsedResume.skills?.slice(0, 5).join(', ')}`);
      console.log(`   Experience: ${data.parsedResume.yearsExperience || 'N/A'} years`);
      console.log(`   Roles: ${data.parsedResume.experience?.join(', ')}\n`);
    }

    // Search Queries
    if (data.searchQueries) {
      console.log('🔍 AI-Generated Search Queries:');
      data.searchQueries.forEach((query, i) => {
        console.log(`   ${i + 1}. "${query}"`);
      });
      console.log();
    }

    // Job Matches
    if (data.matches && data.matches.length > 0) {
      console.log(`💼 Found ${data.matches.length} Job Matches:\n`);

      data.matches.slice(0, 5).forEach((job, i) => {
        console.log(`   ${i + 1}. ${job.title} at ${job.company}`);
        console.log(`      📍 ${job.location}`);
        console.log(`      📊 Match Score: ${job.matchScore}%`);
        if (job.salary) {
          console.log(`      💰 Salary: ${job.salary}`);
        }
        if (job.matchingSkills && job.matchingSkills.length > 0) {
          console.log(`      ✓ Matching: ${job.matchingSkills.slice(0, 3).join(', ')}`);
        }
        if (job.recommendation) {
          console.log(`      💡 ${job.recommendation}`);
        }
        console.log();
      });
    }

    // Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
      console.log('🎯 Personalized Recommendations:\n');
      data.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
      console.log();
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  ⏱️  Processing Time: ${data.processingTime}s`);
    console.log(`  🔍 Queries Generated: ${data.searchQueries?.length || 0}`);
    console.log(`  📊 Jobs Found: ${data.totalFound || 0}`);
    console.log(`  ⭐ Top Matches: ${data.matches?.length || 0}`);
    console.log(`  💡 Recommendations: ${data.recommendations?.length || 0}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('✅ Test completed successfully!\n');
    console.log('Next step: Open http://localhost:3000/resume-jobs-v3 to try the UI\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Make sure the dev server is running: npm run dev');
    console.error('  2. Check that ANTHROPIC_API_KEY is set in .env.local');
    console.error('  3. Verify the API route exists at /api/ai-job-search\n');
    process.exit(1);
  }
}

// Check if dev server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'GET'
    }).catch(() => null);

    if (!response) {
      console.log('⚠️  Dev server not detected at http://localhost:3000');
      console.log('   Starting test anyway (server might be on different port)...\n');
    }
  } catch (e) {
    // Ignore
  }
}

// Run test
checkServer().then(() => testAIJobSearch());
