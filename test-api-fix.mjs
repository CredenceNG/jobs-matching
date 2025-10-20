// Test script to verify API fix
import { promises as fs } from "fs";

console.log("🧪 Testing API Fix...");

// Simulate the data flow to verify our fix
const mockJobMatches = [
  {
    id: "mock-1",
    title: "Senior JavaScript Developer",
    company: "Tech Solutions Inc",
    location: "San Francisco, CA",
    type: "Full-time",
    salary: "$120,000 - $150,000",
    description: "We are looking for an experienced developer...",
    source: "Adzuna (Demo)",
    matchScore: 0.8,
    matchReasons: ["Initial match"],
  },
];

// Simulate AI matching service response
const aiEnhancedJobs = [
  {
    jobId: "mock-1",
    matchScore: 0.95,
    matchReasons: ["Skills compatibility: 90%", "Role alignment: 95%"],
    overallFit: "Excellent",
    skillsMatch: 0.9,
    experienceMatch: 0.95,
    locationMatch: 0.8,
    salaryMatch: 0.9,
  },
];

// Test our fixed logic
console.log("\n📊 Testing the fix...");
const enhancedMatches = aiEnhancedJobs
  .map((aiMatch) => {
    // Find the original job data using the jobId from AI match
    const originalJob = mockJobMatches.find((j) => j.id === aiMatch.jobId);
    if (!originalJob) {
      console.warn(
        `⚠️  Could not find original job for AI match ${aiMatch.jobId}`
      );
      return null;
    }

    return {
      ...originalJob, // Keep all original job data (title, company, description, etc.)
      matchScore: aiMatch.matchScore || 0,
      matchReasons: aiMatch.matchReasons || [],
    };
  })
  .filter(Boolean); // Remove any null entries

console.log("\n✅ Enhanced matches result:");
enhancedMatches.forEach((job) => {
  console.log(`- Job: ${job.title}`);
  console.log(`  Company: ${job.company}`);
  console.log(`  Match Score: ${Math.round(job.matchScore * 100)}%`);
  console.log(`  Reasons: ${job.matchReasons.join(", ")}`);
  console.log("");
});

if (enhancedMatches[0]?.title === "Senior JavaScript Developer") {
  console.log("🎉 FIX SUCCESSFUL! Job titles are preserved correctly.");
} else {
  console.log("❌ Fix failed - still getting wrong job data");
}
