#!/usr/bin/env node

/**
 * Test Script for AI Features
 * Demonstrates job matching, cover letter generation, and resume optimization
 * using Claude Sonnet 4.5
 */

const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Mock data
const mockUserProfile = {
  name: "John Doe",
  email: "john.doe@email.com",
  phone: "+1-555-0123",
  location: "San Francisco, CA",
  skills: [
    "JavaScript", "TypeScript", "React", "Node.js", "Next.js",
    "PostgreSQL", "REST APIs", "GraphQL", "Git", "AWS"
  ],
  experience: [
    "Senior Full Stack Developer at TechCorp (3 years)",
    "Full Stack Developer at StartupXYZ (2 years)",
    "Junior Developer at WebAgency (1 year)"
  ],
  education: [
    "B.S. Computer Science from State University (2018)"
  ],
  preferences: {
    location: "San Francisco Bay Area",
    remote: true,
    salaryMin: 120000,
    salaryMax: 180000,
    jobTypes: ["full-time"],
    industries: ["Technology", "SaaS"]
  }
};

const mockJob = {
  id: "job-123",
  title: "Senior Full Stack Engineer",
  company: "InnovateAI",
  description: "We're looking for an experienced Full Stack Engineer to join our growing team. You'll work on building scalable web applications using modern JavaScript frameworks and cloud technologies. Must have strong experience with React, Node.js, and PostgreSQL.",
  requirements: [
    "5+ years of full stack development experience",
    "Expert in React and Node.js",
    "Experience with PostgreSQL and database design",
    "Strong understanding of RESTful APIs",
    "Cloud platform experience (AWS/GCP/Azure)",
    "Experience with CI/CD pipelines",
    "Excellent communication skills"
  ],
  location: "San Francisco, CA",
  remote: true,
  salary: {
    min: 140000,
    max: 180000,
    currency: "USD"
  },
  jobType: "full-time",
  industry: "Technology",
  url: "https://innovateai.com/careers/senior-fullstack"
};

const mockResumeData = {
  contactInfo: {
    name: "John Doe",
    email: "john.doe@email.com",
    phone: "+1-555-0123",
    location: "San Francisco, CA"
  },
  experience: [
    {
      title: "Senior Full Stack Developer",
      company: "TechCorp",
      startDate: "Jan 2021",
      endDate: "Present",
      responsibilities: [
        "Led development of microservices architecture serving 1M+ users",
        "Implemented GraphQL API reducing data transfer by 40%",
        "Mentored team of 5 junior developers"
      ],
      achievements: [
        "Reduced page load time by 60% through optimization",
        "Increased test coverage from 40% to 85%",
        "Designed and implemented real-time notification system"
      ],
      technologies: ["React", "Node.js", "PostgreSQL", "AWS", "Docker", "Kubernetes"]
    },
    {
      title: "Full Stack Developer",
      company: "StartupXYZ",
      startDate: "Jun 2019",
      endDate: "Dec 2020",
      responsibilities: [
        "Built customer-facing web applications",
        "Developed RESTful APIs",
        "Integrated third-party services"
      ],
      achievements: [
        "Launched 3 major product features ahead of schedule",
        "Reduced API response time by 50%"
      ],
      technologies: ["React", "Express.js", "MongoDB", "Redis"]
    }
  ],
  skills: {
    technical: ["JavaScript", "TypeScript", "React", "Node.js", "Next.js", "PostgreSQL", "MongoDB", "AWS", "Docker"],
    soft: ["Leadership", "Communication", "Problem Solving", "Agile/Scrum"],
    certifications: ["AWS Certified Developer Associate"]
  },
  education: [
    {
      degree: "Bachelor of Science in Computer Science",
      institution: "State University",
      graduationDate: "May 2018",
      gpa: "3.7",
      honors: ["Dean's List", "Cum Laude"]
    }
  ],
  projects: [
    {
      name: "Open Source Task Manager",
      description: "Built a collaborative task management tool with real-time updates",
      technologies: ["React", "Socket.io", "Node.js", "PostgreSQL"],
      link: "https://github.com/johndoe/taskmanager"
    },
    {
      name: "E-commerce Platform",
      description: "Full-stack e-commerce solution with payment integration",
      technologies: ["Next.js", "Stripe", "Prisma", "PostgreSQL"],
      link: "https://github.com/johndoe/ecommerce"
    }
  ]
};

// Test functions
async function testJobMatching() {
  console.log("\n🎯 TEST 1: Job Matching with Claude AI\n");
  console.log("Testing AI-powered job matching...");
  console.log(`User: ${mockUserProfile.name}`);
  console.log(`Job: ${mockJob.title} at ${mockJob.company}\n`);

  try {
    // Import the job matching service
    const { jobMatchingService } = require('./src/lib/ai/job-matching.ts');

    const result = await jobMatchingService.findJobMatches(
      "test-user-123",
      mockUserProfile,
      [mockJob],
      {
        maxResults: 1,
        minScore: 0,
        includeAnalysis: true
      }
    );

    console.log("✅ Job Matching Results:");
    if (result.matches.length > 0) {
      const match = result.matches[0];
      console.log(`   Match Score: ${(match.matchScore * 100).toFixed(1)}%`);
      console.log(`   Confidence: ${(match.confidenceScore * 100).toFixed(1)}%`);
      console.log(`\n   Matching Skills: ${match.skillsMatch.matching.slice(0, 5).join(", ")}`);
      console.log(`   Missing Skills: ${match.skillsMatch.missing.slice(0, 3).join(", ")}`);
      console.log(`\n   Analysis: ${match.overallAnalysis.substring(0, 200)}...`);
      console.log(`\n   Top Recommendation: ${match.recommendations[0] || "N/A"}`);
    }

    return true;
  } catch (error) {
    console.error("❌ Job Matching Failed:", error.message);
    return false;
  }
}

async function testCoverLetterGeneration() {
  console.log("\n📝 TEST 2: Cover Letter Generation with Claude AI\n");
  console.log("Generating personalized cover letter...");
  console.log(`For: ${mockJob.title} at ${mockJob.company}\n`);

  try {
    const { coverLetterService } = require('./src/lib/ai/cover-letter.ts');

    const request = {
      userProfile: {
        ...mockUserProfile,
        resumeData: mockResumeData
      },
      jobListing: mockJob,
      tone: "professional",
      length: "medium",
      focusAreas: ["technical leadership", "scalability", "team collaboration"],
      customInstructions: "Emphasize experience with microservices and cloud technologies"
    };

    const result = await coverLetterService.generateCoverLetter(
      "test-user-123",
      request
    );

    console.log("✅ Cover Letter Generated:");
    console.log(`   Length: ${result.content.length} characters`);
    console.log(`   Key Points: ${result.keyPoints.slice(0, 3).join(", ")}`);
    console.log(`\n   Preview (first 300 chars):`);
    console.log(`   ${result.content.substring(0, 300)}...\n`);
    console.log(`   Personalizations: ${result.personalizationElements.slice(0, 2).join(", ")}`);

    // Save to file for review
    await fs.writeFile(
      path.join(__dirname, 'cover-letter-sample.txt'),
      result.content,
      'utf-8'
    );
    console.log(`\n   ✓ Full cover letter saved to: cover-letter-sample.txt`);

    return true;
  } catch (error) {
    console.error("❌ Cover Letter Generation Failed:", error.message);
    return false;
  }
}

async function testResumeOptimization() {
  console.log("\n📄 TEST 3: Resume Optimization with Claude AI\n");
  console.log("Optimizing resume for job...");
  console.log(`Target: ${mockJob.title} at ${mockJob.company}\n`);

  try {
    const { resumeOptimizerService } = require('./src/lib/ai/resume-optimizer.ts');

    const request = {
      userProfile: {
        ...mockUserProfile,
        resumeData: mockResumeData
      },
      jobListing: mockJob,
      format: "ats-friendly",
      focusAreas: ["microservices", "scalability", "leadership"],
      customInstructions: "Focus on quantifiable achievements and impact"
    };

    const result = await resumeOptimizerService.optimizeResume(
      "test-user-123",
      request
    );

    console.log("✅ Resume Optimized:");
    console.log(`   ATS Score: ${result.atsScore}/100`);
    console.log(`   Matched Keywords: ${result.matchedKeywords.slice(0, 5).join(", ")}`);
    console.log(`\n   Key Optimizations:`);
    result.keyOptimizations.slice(0, 3).forEach((opt, i) => {
      console.log(`   ${i + 1}. ${opt}`);
    });

    console.log(`\n   Professional Summary:`);
    console.log(`   ${result.structure.header.summary.substring(0, 200)}...`);

    // Save to file for review
    await fs.writeFile(
      path.join(__dirname, 'resume-optimized-sample.txt'),
      result.content,
      'utf-8'
    );
    console.log(`\n   ✓ Full optimized resume saved to: resume-optimized-sample.txt`);

    return true;
  } catch (error) {
    console.error("❌ Resume Optimization Failed:", error.message);
    console.error("   Full error:", error);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  JobAI - Claude AI Features Test Suite");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Using Model: ${process.env.AI_DEFAULT_MODEL || 'claude-sonnet-4-5-20250929'}`);
  console.log(`  API Key: ${process.env.ANTHROPIC_API_KEY ? '✓ Found' : '✗ Missing'}`);
  console.log("═══════════════════════════════════════════════════════════");

  const results = {
    jobMatching: false,
    coverLetter: false,
    resumeOptimization: false
  };

  // Run tests sequentially
  results.jobMatching = await testJobMatching();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting

  results.coverLetter = await testCoverLetterGeneration();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting

  results.resumeOptimization = await testResumeOptimization();

  // Summary
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  Test Results Summary");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Job Matching:          ${results.jobMatching ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Cover Letter:          ${results.coverLetter ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Resume Optimization:   ${results.resumeOptimization ? '✅ PASS' : '❌ FAIL'}`);
  console.log("═══════════════════════════════════════════════════════════");

  const passCount = Object.values(results).filter(r => r).length;
  const totalTests = Object.keys(results).length;

  console.log(`\n  Overall: ${passCount}/${totalTests} tests passed`);

  if (passCount === totalTests) {
    console.log("\n  🎉 All AI features are working correctly!");
  } else {
    console.log("\n  ⚠️  Some tests failed. Check errors above.");
  }

  process.exit(passCount === totalTests ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error("\n❌ Test suite failed:", error);
  process.exit(1);
});
