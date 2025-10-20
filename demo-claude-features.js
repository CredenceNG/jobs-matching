#!/usr/bin/env node

/**
 * Simple Demo of Claude AI Features
 * Demonstrates direct API calls without TypeScript dependencies
 */

const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config({ path: '.env.local' });

const MODEL = process.env.AI_DEFAULT_MODEL || 'claude-sonnet-4-5-20250929';

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Demo data
const userProfile = {
  name: "Sarah Johnson",
  skills: ["Python", "Machine Learning", "TensorFlow", "Data Analysis", "SQL"],
  experience: "3 years as Data Scientist at TechCorp",
  education: "M.S. Computer Science, Stanford University"
};

const job = {
  title: "Senior Data Scientist",
  company: "AI Innovations Inc.",
  description: "Looking for an experienced data scientist to lead ML projects",
  requirements: ["5+ years Python", "Deep Learning", "TensorFlow/PyTorch", "Team Leadership"]
};

// Demo Functions

async function demo1_JobMatching() {
  console.log("\n" + "=".repeat(70));
  console.log("  DEMO 1: AI-Powered Job Matching");
  console.log("=".repeat(70));

  const prompt = `Analyze this job match and provide a match score (0-100) with reasoning:

USER PROFILE:
Name: ${userProfile.name}
Skills: ${userProfile.skills.join(", ")}
Experience: ${userProfile.experience}
Education: ${userProfile.education}

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Requirements: ${job.requirements.join(", ")}

Provide:
1. Match Score (0-100)
2. Key Strengths (what matches well)
3. Gaps (what's missing)
4. Recommendation (should they apply?)

Be concise and specific.`;

  try {
    console.log("\n📊 Analyzing job match with Claude...\n");

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }]
    });

    const analysis = response.content[0].text;
    console.log("✅ Match Analysis:\n");
    console.log(analysis);
    console.log(`\n💰 Cost: $${calculateCost(response.usage).toFixed(4)}`);
    console.log(`📊 Tokens: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out`);

    return true;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

async function demo2_CoverLetter() {
  console.log("\n" + "=".repeat(70));
  console.log("  DEMO 2: AI-Generated Cover Letter");
  console.log("=".repeat(70));

  const prompt = `Write a professional cover letter for this job application:

CANDIDATE:
${userProfile.name}
Skills: ${userProfile.skills.join(", ")}
Experience: ${userProfile.experience}
Education: ${userProfile.education}

JOB:
${job.title} at ${job.company}
${job.description}
Requirements: ${job.requirements.join(", ")}

Write a compelling 3-paragraph cover letter (250-300 words) that:
1. Opens with enthusiasm and key qualifications
2. Highlights relevant experience and skills
3. Closes with call to action

Make it professional yet personable.`;

  try {
    console.log("\n📝 Generating cover letter with Claude...\n");

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      temperature: 0.6,
      messages: [{ role: "user", content: prompt }]
    });

    const coverLetter = response.content[0].text;
    console.log("✅ Generated Cover Letter:\n");
    console.log("-".repeat(70));
    console.log(coverLetter);
    console.log("-".repeat(70));
    console.log(`\n💰 Cost: $${calculateCost(response.usage).toFixed(4)}`);
    console.log(`📊 Tokens: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out`);
    console.log(`📏 Length: ${coverLetter.length} characters`);

    return true;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

async function demo3_ResumeOptimization() {
  console.log("\n" + "=".repeat(70));
  console.log("  DEMO 3: AI Resume Optimization");
  console.log("=".repeat(70));

  const currentResume = `${userProfile.name}
${userProfile.education}

EXPERIENCE:
Data Scientist at TechCorp (2021-Present)
- Worked on machine learning projects
- Used Python and TensorFlow
- Analyzed data and created models

SKILLS:
${userProfile.skills.join(", ")}`;

  const prompt = `Optimize this resume for the specific job posting. Transform it into achievement-oriented bullet points with metrics:

CURRENT RESUME:
${currentResume}

TARGET JOB:
${job.title} at ${job.company}
Requirements: ${job.requirements.join(", ")}

Rewrite the experience section to:
1. Lead with impact and results (add quantifiable metrics where plausible)
2. Use action verbs
3. Align with job requirements
4. Highlight relevant skills

Provide the optimized EXPERIENCE section only (3-5 achievement-focused bullets).`;

  try {
    console.log("\n📄 Optimizing resume with Claude...\n");

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      temperature: 0.4,
      messages: [{ role: "user", content: prompt }]
    });

    const optimizedResume = response.content[0].text;
    console.log("✅ Optimized Resume Section:\n");
    console.log("-".repeat(70));
    console.log(optimizedResume);
    console.log("-".repeat(70));
    console.log(`\n💰 Cost: $${calculateCost(response.usage).toFixed(4)}`);
    console.log(`📊 Tokens: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out`);

    return true;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

// Helper function to calculate cost
function calculateCost(usage) {
  const INPUT_COST = 0.003 / 1000;  // $3 per 1M tokens
  const OUTPUT_COST = 0.015 / 1000; // $15 per 1M tokens

  const inputCost = usage.input_tokens * INPUT_COST;
  const outputCost = usage.output_tokens * OUTPUT_COST;

  return inputCost + outputCost;
}

// Main demo runner
async function runDemo() {
  console.log("\n" + "=".repeat(70));
  console.log("  🚀 JobAI Claude AI Features Demo");
  console.log("=".repeat(70));
  console.log(`  Model: ${MODEL}`);
  console.log(`  API Key: ${process.env.ANTHROPIC_API_KEY ? '✓ Found' : '✗ Missing'}`);
  console.log("=".repeat(70));

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("\n❌ ANTHROPIC_API_KEY not found in environment");
    process.exit(1);
  }

  const results = {
    jobMatching: false,
    coverLetter: false,
    resumeOptimization: false
  };

  let totalCost = 0;

  // Run demos
  results.jobMatching = await demo1_JobMatching();
  await sleep(1000);

  results.coverLetter = await demo2_CoverLetter();
  await sleep(1000);

  results.resumeOptimization = await demo3_ResumeOptimization();

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("  📊 Demo Summary");
  console.log("=".repeat(70));
  console.log(`  Job Matching:         ${results.jobMatching ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`  Cover Letter:         ${results.coverLetter ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`  Resume Optimization:  ${results.resumeOptimization ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log("=".repeat(70));

  const successCount = Object.values(results).filter(r => r).length;
  console.log(`\n  ${successCount}/3 demos completed successfully`);

  if (successCount === 3) {
    console.log("\n  🎉 All AI features are working perfectly with Claude!");
    console.log("  💡 Ready to integrate into your JobAI application");
  }

  console.log("\n");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the demo
runDemo().catch(error => {
  console.error("\n❌ Demo failed:", error);
  process.exit(1);
});
