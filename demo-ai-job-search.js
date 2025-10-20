#!/usr/bin/env node

/**
 * AI-Powered Job Search Demo
 * Demonstrates intelligent job discovery using AI + web search
 */

const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config({ path: '.env.local' });

const MODEL = process.env.AI_DEFAULT_MODEL || 'claude-sonnet-4-5-20250929';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Sample resume data
const sampleResume = {
  name: "Alex Rivera",
  skills: {
    technical: ["JavaScript", "TypeScript", "React", "Node.js", "Python", "AWS", "Docker", "PostgreSQL", "MongoDB", "GraphQL"],
    soft: ["Leadership", "Communication", "Problem Solving", "Agile"],
    certifications: ["AWS Solutions Architect"]
  },
  experience: [
    {
      title: "Senior Software Engineer",
      company: "CloudTech Solutions",
      startDate: "2021",
      endDate: "Present",
      technologies: ["React", "Node.js", "AWS", "PostgreSQL", "Docker"],
      achievements: ["Led team of 5 engineers", "Built microservices architecture", "Reduced costs by 40%"]
    },
    {
      title: "Full Stack Developer",
      company: "StartupCo",
      startDate: "2019",
      endDate: "2021",
      technologies: ["JavaScript", "Python", "MongoDB", "React"],
      achievements: ["Built MVP in 3 months", "Scaled to 100k users"]
    }
  ],
  education: [
    {
      degree: "B.S. Computer Science",
      institution: "State University",
      graduationDate: "2019"
    }
  ]
};

const searchPreferences = {
  location: "San Francisco Bay Area",
  remote: true,
  salaryMin: 120000,
  salaryMax: 180000,
  jobTypes: ["full-time"],
  industries: ["Technology", "SaaS"]
};

// =============================================================================
// AI-Powered Job Search Functions
// =============================================================================

async function generateSearchQueries(resume, preferences) {
  console.log("\n" + "=".repeat(70));
  console.log("  STEP 1: AI Generates Smart Search Queries");
  console.log("=".repeat(70));

  const prompt = `Based on this resume, generate 5 effective job search queries:

CANDIDATE PROFILE:
Skills: ${resume.skills.technical.join(", ")}
Experience: ${resume.experience.map(e => e.title).join(", ")}
Location: ${preferences.location}
Remote: ${preferences.remote ? "Required" : "Preferred"}
Industries: ${preferences.industries.join(", ")}

Generate diverse, effective search queries that would find the best job matches.
Mix specific job titles with skill-based searches.

Return ONLY valid JSON in this format:
{
  "queries": ["query 1", "query 2", "query 3", "query 4", "query 5"],
  "reasoning": "Brief explanation of query strategy"
}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 800,
      temperature: 0.5,
      messages: [{ role: "user", content: prompt }]
    });

    const result = JSON.parse(cleanJSON(response.content[0].text));

    console.log("\n✅ Generated Search Queries:");
    result.queries.forEach((query, i) => {
      console.log(`   ${i + 1}. "${query}"`);
    });
    console.log(`\n💡 Strategy: ${result.reasoning}`);
    console.log(`\n💰 Cost: $${calculateCost(response.usage).toFixed(4)}`);

    return result.queries;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return [
      "Senior Software Engineer React Node.js remote",
      "Full Stack Developer San Francisco",
      "Senior Backend Engineer Python AWS"
    ];
  }
}

async function searchJobsViaAPI(queries) {
  console.log("\n" + "=".repeat(70));
  console.log("  STEP 2: Search Job Boards");
  console.log("=".repeat(70));

  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

  if (!RAPIDAPI_KEY) {
    console.log("\n⚠️  RapidAPI key not configured");
    console.log("   Using mock job data for demo...\n");
    return getMockJobs();
  }

  console.log(`\n🔍 Searching with ${queries.length} queries...`);
  const allJobs = [];

  for (let i = 0; i < Math.min(queries.length, 2); i++) {
    const query = queries[i];
    console.log(`\n   Query ${i + 1}: "${query}"`);

    try {
      const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&num_pages=1`;

      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          allJobs.push(...data.data);
          console.log(`   ✓ Found ${data.data.length} jobs`);
        }
      } else {
        console.log(`   ✗ Search failed: ${response.status}`);
      }

      await sleep(1000); // Rate limiting
    } catch (error) {
      console.log(`   ✗ Error: ${error.message}`);
    }
  }

  if (allJobs.length === 0) {
    console.log("\n   No jobs found via API, using mock data...");
    return getMockJobs();
  }

  console.log(`\n✅ Total jobs found: ${allJobs.length}`);
  return allJobs;
}

async function extractAndMatchJobs(rawJobs, resume) {
  console.log("\n" + "=".repeat(70));
  console.log("  STEP 3: AI Extracts & Matches Jobs");
  console.log("=".repeat(70));

  console.log(`\n🤖 Processing ${rawJobs.length} jobs with AI...`);

  // Process first 5 jobs for demo
  const jobsToProcess = rawJobs.slice(0, 5).map(job => ({
    title: job.job_title || job.title,
    company: job.employer_name || job.company,
    location: job.job_city && job.job_state ? `${job.job_city}, ${job.job_state}` : job.location,
    description: (job.job_description || job.description || "").substring(0, 500),
    remote: job.job_is_remote || job.remote || false,
    salary: job.job_min_salary ? `$${job.job_min_salary}-${job.job_max_salary}` : "Not specified"
  }));

  const prompt = `Extract and match these jobs against the candidate's resume:

CANDIDATE SKILLS: ${resume.skills.technical.join(", ")}
CANDIDATE EXPERIENCE: ${resume.experience.map(e => e.title).join(", ")}

JOBS:
${JSON.stringify(jobsToProcess, null, 2)}

For each job:
1. Calculate match score (0-100) based on skills and experience alignment
2. List matching skills
3. List missing/gap skills
4. Provide brief recommendation

Return ONLY valid JSON in this format:
{
  "matches": [
    {
      "title": "Job Title",
      "company": "Company",
      "matchScore": 85,
      "matchingSkills": ["skill1", "skill2"],
      "missingSkills": ["skill3"],
      "recommendation": "Strong match, apply immediately"
    }
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }]
    });

    const result = JSON.parse(cleanJSON(response.content[0].text));

    console.log("\n✅ Job Match Results:\n");

    result.matches.forEach((match, i) => {
      console.log(`   ${i + 1}. ${match.title} at ${match.company}`);
      console.log(`      Match Score: ${match.matchScore}%`);
      console.log(`      Matching: ${match.matchingSkills.slice(0, 3).join(", ")}`);
      console.log(`      Missing: ${match.missingSkills.slice(0, 2).join(", ")}`);
      console.log(`      → ${match.recommendation}\n`);
    });

    console.log(`💰 Cost: $${calculateCost(response.usage).toFixed(4)}`);

    return result.matches;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return [];
  }
}

async function generateRecommendations(resume, matches) {
  console.log("\n" + "=".repeat(70));
  console.log("  STEP 4: AI Generates Job Search Recommendations");
  console.log("=".repeat(70));

  const prompt = `Based on the job search results, provide personalized recommendations:

CANDIDATE:
Skills: ${resume.skills.technical.join(", ")}
Experience: ${resume.experience.map(e => e.title).join(", ")}

SEARCH RESULTS:
Jobs Found: ${matches.length}
Average Match: ${matches.length > 0 ? Math.round(matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length) : 0}%
Top Jobs: ${matches.slice(0, 3).map(m => m.title).join(", ")}

Provide 4-5 specific, actionable recommendations to improve job search success.

Return ONLY valid JSON in this format:
{
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2",
    ...
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      temperature: 0.6,
      messages: [{ role: "user", content: prompt }]
    });

    const result = JSON.parse(cleanJSON(response.content[0].text));

    console.log("\n✅ Personalized Recommendations:\n");
    result.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
    console.log(`\n💰 Cost: $${calculateCost(response.usage).toFixed(4)}`);

    return result.recommendations;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return [];
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function cleanJSON(text) {
  return text
    .trim()
    .replace(/^```json?\n?/i, '')
    .replace(/\n?```$/, '')
    .trim();
}

function calculateCost(usage) {
  const INPUT_COST = 0.003 / 1000;
  const OUTPUT_COST = 0.015 / 1000;
  return (usage.input_tokens * INPUT_COST) + (usage.output_tokens * OUTPUT_COST);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getMockJobs() {
  return [
    {
      job_title: "Senior Full Stack Engineer",
      employer_name: "InnovateAI Corp",
      job_city: "San Francisco",
      job_state: "CA",
      job_description: "We're seeking a Senior Full Stack Engineer with expertise in React, Node.js, and AWS. You'll lead development of our cloud-native platform serving millions of users. Required: 5+ years experience, React, Node.js, AWS, Docker. Bonus: GraphQL, PostgreSQL, leadership experience.",
      job_is_remote: true,
      job_min_salary: 150000,
      job_max_salary: 200000
    },
    {
      job_title: "Lead Software Engineer",
      employer_name: "TechVentures Inc",
      job_city: "Palo Alto",
      job_state: "CA",
      job_description: "Looking for a Lead Software Engineer to drive technical decisions. Must have: TypeScript, React, Python, AWS, team leadership. We offer competitive comp and equity.",
      job_is_remote: true,
      job_min_salary: 160000,
      job_max_salary: 210000
    },
    {
      job_title: "Senior Backend Engineer",
      employer_name: "CloudScale Systems",
      job_city: "San Jose",
      job_state: "CA",
      job_description: "Senior Backend Engineer needed for microservices platform. Required: Node.js, Python, AWS, Docker, Kubernetes, PostgreSQL. 4+ years experience.",
      job_is_remote: false,
      job_min_salary: 140000,
      job_max_salary: 180000
    },
    {
      job_title: "Full Stack Engineer",
      employer_name: "GrowthTech",
      job_city: "Mountain View",
      job_state: "CA",
      job_description: "Join our growing startup as Full Stack Engineer. We need someone who can work across the stack: React, Node.js, MongoDB, AWS.",
      job_is_remote: true,
      job_min_salary: 130000,
      job_max_salary: 170000
    },
    {
      job_title: "Senior Software Engineer - Cloud",
      employer_name: "DataFlow Solutions",
      job_city: "Oakland",
      job_state: "CA",
      job_description: "Build cloud infrastructure at scale. Need: Python, AWS, Docker, Kubernetes, Terraform. Bonus: React, TypeScript.",
      job_is_remote: true,
      job_min_salary: 145000,
      job_max_salary: 185000
    }
  ];
}

// =============================================================================
// MAIN DEMO
// =============================================================================

async function runDemo() {
  console.log("\n" + "=".repeat(70));
  console.log("  🚀 AI-Powered Intelligent Job Search Demo");
  console.log("=".repeat(70));
  console.log(`  Model: ${MODEL}`);
  console.log(`  Candidate: ${sampleResume.name}`);
  console.log(`  Target: ${searchPreferences.location} (${searchPreferences.remote ? 'Remote' : 'On-site'})`);
  console.log("=".repeat(70));

  let totalCost = 0;

  // Step 1: Generate search queries
  const queries = await generateSearchQueries(sampleResume, searchPreferences);
  await sleep(1000);

  // Step 2: Search for jobs
  const rawJobs = await searchJobsViaAPI(queries);
  await sleep(1000);

  // Step 3: Extract and match jobs
  const matches = await extractAndMatchJobs(rawJobs, sampleResume);
  await sleep(1000);

  // Step 4: Generate recommendations
  const recommendations = await generateRecommendations(sampleResume, matches);

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("  📊 Demo Summary");
  console.log("=".repeat(70));
  console.log(`  Search Queries Generated: ${queries.length}`);
  console.log(`  Jobs Discovered: ${rawJobs.length}`);
  console.log(`  Jobs Analyzed: ${matches.length}`);
  console.log(`  Average Match Score: ${matches.length > 0 ? Math.round(matches.reduce((s, m) => s + m.matchScore, 0) / matches.length) : 0}%`);
  console.log(`  Recommendations: ${recommendations.length}`);
  console.log("=".repeat(70));

  if (matches.length > 0) {
    const topMatch = matches.reduce((best, current) =>
      current.matchScore > best.matchScore ? current : best
    );
    console.log(`\n  🎯 Top Match: ${topMatch.title} at ${topMatch.company} (${topMatch.matchScore}%)`);
  }

  console.log("\n  ✅ AI-powered job search completed successfully!");
  console.log("  💡 This approach is more reliable than traditional scrapers because:");
  console.log("     - AI adapts to any job board format");
  console.log("     - Intelligent query generation finds better matches");
  console.log("     - Built-in relevance filtering saves time");
  console.log("     - Works with free job APIs (no scraping needed)");
  console.log("\n");
}

// Run the demo
runDemo().catch(error => {
  console.error("\n❌ Demo failed:", error);
  process.exit(1);
});
