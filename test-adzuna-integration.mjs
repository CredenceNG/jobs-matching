// Test script to diagnose Adzuna API integration issues

console.log("🔍 Testing Adzuna API Integration...");

// Manually set the environment variables for testing
const ADZUNA_APP_ID = "c0be6cc2";
const ADZUNA_APP_KEY = "7057110f9dda6e628ce8a77d9227aa5d";

// Mock the Adzuna API class to test it directly
class TestAdzunaAPI {
  constructor() {
    this.appId = ADZUNA_APP_ID;
    this.appKey = ADZUNA_APP_KEY;
    this.baseUrl = "https://api.adzuna.com/v1/api";
    this.country = "us"; // Default to US
  }

  async searchJobs(filters, page = 1) {
    console.log("🔧 Adzuna Credentials Check:");
    console.log("- App ID:", this.appId ? "✅ Set" : "❌ Missing");
    console.log("- App Key:", this.appKey ? "✅ Set" : "❌ Missing");

    if (!this.appId || !this.appKey) {
      throw new Error("Adzuna API not configured");
    }

    try {
      const params = new URLSearchParams({
        app_id: this.appId,
        app_key: this.appKey,
        results_per_page: "20",
        what: filters.keywords || "software developer",
        where: filters.location || "",
        page: page.toString(),
      });

      const url = `${this.baseUrl}/jobs/${this.country}/search/${page}?${params}`;
      console.log("🔍 Adzuna API Request URL:", url);

      const response = await fetch(url);
      console.log(
        "📡 Adzuna Response Status:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Adzuna API Error Response:", errorText);
        throw new Error(
          `Adzuna API request failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log(
        "✅ Adzuna Response received! Jobs count:",
        data.results?.length || 0
      );

      if (data.results && data.results.length > 0) {
        console.log("📋 Sample Job from Adzuna:");
        const sample = data.results[0];
        console.log("- Title:", sample.title);
        console.log("- Company:", sample.company?.display_name);
        console.log("- Location:", sample.location?.display_name);
        console.log("- Description Length:", sample.description?.length);
      }

      return data;
    } catch (error) {
      console.error("💥 Adzuna API Error:", error.message);
      throw error;
    }
  }
}

// Test it
async function testAdzunaIntegration() {
  const adzunaAPI = new TestAdzunaAPI();

  try {
    const filters = {
      keywords: "C# developer",
      location: "Remote",
    };

    console.log("\n📊 Testing with filters:", filters);
    const result = await adzunaAPI.searchJobs(filters, 1);
    console.log("\n🎉 SUCCESS: Adzuna API is working correctly!");
  } catch (error) {
    console.log("\n❌ FAILED:", error.message);
  }
}

testAdzunaIntegration();
