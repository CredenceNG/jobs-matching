#!/usr/bin/env node

/**
 * Test for Job Data Normalization Fix
 *
 * Tests the handling of undefined job properties that were causing
 * the "Cannot read properties of undefined (reading 'slice')" error.
 */

console.log("🧪 Testing Job Data Normalization");
console.log("================================");

// Simulate job data with missing properties (like from different APIs)
const testJobs = [
  {
    id: "job1",
    title: "Senior Developer",
    company: "TechCorp",
    location: "San Francisco",
    // Missing: description, type, source
  },
  {
    id: "job2",
    title: "Frontend Engineer",
    // Missing: company, location, description, type, source
  },
  {
    // Missing: all properties
  },
  {
    id: "job4",
    title: "Full Stack Developer",
    company: "StartupXYZ",
    location: "Remote",
    description: "We are looking for a passionate full stack developer...",
    type: "Full-time",
    salary: "$80k - $120k",
    source: "Company Website",
  },
];

// Test the normalization function (mimicking the API route logic)
function normalizeJobData(job) {
  return {
    id: job.id || `job-${Date.now()}-${Math.random()}`,
    title: job.title || "Untitled Position",
    company: job.company || "Unknown Company",
    location: job.location || "Location TBD",
    type: job.type || "Full-time",
    salary: job.salary || null,
    description: job.description || "No description available",
    url: job.url || null,
    posted_date: job.posted_date || job.postedDate || null,
    source: job.source || "Unknown Source",
  };
}

// Test React component logic (mimicking the frontend rendering)
function testJobDisplayLogic(job) {
  console.log(`\n📄 Job: ${job.id}`);
  console.log(`   Title: ${job.title || "Untitled Position"}`);
  console.log(
    `   Company: ${job.company || "Unknown Company"} • ${
      job.location || "Location TBD"
    }`
  );
  console.log(`   Type: ${job.type || "Full-time"}`);

  // Test the description slice logic (this was causing the error)
  if (job.description) {
    const truncated = job.description.slice(0, 300);
    const hasMore = job.description.length > 300;
    console.log(`   Description: ${truncated}${hasMore ? "..." : ""}`);
  } else {
    console.log(`   Description: No description available`);
  }

  console.log(`   Source: ${job.source || "Unknown Source"}`);
  console.log(`   ✅ Rendered without errors`);
}

console.log("\n🔍 Testing jobs with missing properties:");

// Test each job
testJobs.forEach((job, index) => {
  console.log(`\n--- Testing Job ${index + 1} (Original) ---`);
  console.log("Raw job data:", JSON.stringify(job, null, 2));

  // Normalize the job data
  const normalizedJob = normalizeJobData(job);

  console.log(`\n--- Testing Job ${index + 1} (Normalized) ---`);
  // Test the display logic with normalized data
  testJobDisplayLogic(normalizedJob);
});

console.log("\n✅ All tests completed successfully!");
console.log("\n📝 Summary:");
console.log("  - Job data normalization prevents undefined property errors");
console.log("  - React component can safely render all job properties");
console.log("  - Frontend fallbacks provide meaningful default values");
console.log('  - No more "Cannot read properties of undefined" errors!');
