// Test script to debug job search API issues
const fs = require("fs");

console.log("🔍 Testing Job Search APIs...");

// Test the actual API endpoint with a proper file upload
async function testJobSearchAPI() {
  try {
    console.log("\n📡 Testing API with file upload...");

    // Create a simple text file to simulate resume upload
    const resumeContent = `
John Doe
Software Developer

EXPERIENCE:
- 5 years experience in JavaScript, React, Node.js
- Python backend development
- Full-stack web applications
- Remote work experience

SKILLS:
- JavaScript, TypeScript
- React, Next.js
- Node.js, Express
- Python, Django
- Git, Docker
`;

    // Create FormData for file upload
    const FormData = require("form-data");
    const formData = new FormData();

    // Add resume as text file
    formData.append("resume", resumeContent, {
      filename: "test-resume.txt",
      contentType: "text/plain",
    });

    const response = await fetch(
      "http://localhost:3000/api/resume-job-search",
      {
        method: "POST",
        body: formData,
        headers: formData.getHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log("✅ API Response received");
    console.log("📊 Jobs found:", data.matches?.length || 0);

    if (data.matches && data.matches.length > 0) {
      console.log("\n📋 Sample Job Data:");
      const sampleJob = data.matches[0];
      console.log("- ID:", sampleJob.id);
      console.log("- Title:", sampleJob.title);
      console.log("- Company:", sampleJob.company);
      console.log("- Location:", sampleJob.location);
      console.log("- Description Length:", sampleJob.description?.length || 0);
      console.log("- Source:", sampleJob.source);
      console.log(
        "- Has Real Data:",
        !!(
          sampleJob.title !== "Untitled Position" &&
          sampleJob.company !== "Unknown Company"
        )
      );
    }

    console.log("\n🔍 All Jobs Summary:");
    data.matches?.forEach((job, index) => {
      const isPlaceholder =
        job.title === "Untitled Position" || job.company === "Unknown Company";
      console.log(
        `${index + 1}. ${job.title} @ ${job.company} (${
          isPlaceholder ? "PLACEHOLDER" : "REAL"
        })`
      );
    });
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testJobSearchAPI();
