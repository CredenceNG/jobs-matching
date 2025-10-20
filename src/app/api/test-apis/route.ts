import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const adzunaAppId = process.env.ADZUNA_APP_ID;
    const adzunaAppKey = process.env.ADZUNA_APP_KEY;

    console.log("🔍 Testing API keys...");

    const results = {
      rapidApiKey: rapidApiKey ? "✅ Found" : "❌ Missing",
      adzunaAppId: adzunaAppId ? "✅ Found" : "❌ Missing",
      adzunaAppKey: adzunaAppKey ? "✅ Found" : "❌ Missing",
      jsearchTest: "Not tested",
      adzunaTest: "Not tested",
    };

    // Test JSearch API
    if (rapidApiKey) {
      try {
        const jsearchResponse = await fetch(
          "https://jsearch.p.rapidapi.com/search?query=developer&page=1&num_pages=1",
          {
            method: "GET",
            headers: {
              "X-RapidAPI-Key": rapidApiKey,
              "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
            },
          }
        );

        if (jsearchResponse.ok) {
          const data = await jsearchResponse.json();
          results.jsearchTest = `✅ Success - Found ${
            data.data?.length || 0
          } jobs`;
        } else {
          const errorText = await jsearchResponse.text();
          results.jsearchTest = `❌ Error ${jsearchResponse.status}: ${errorText}`;
        }
      } catch (error) {
        results.jsearchTest = `❌ Exception: ${
          error instanceof Error ? error.message : "Unknown"
        }`;
      }
    }

    // Test Adzuna API
    if (adzunaAppId && adzunaAppKey) {
      try {
        const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${adzunaAppId}&app_key=${adzunaAppKey}&results_per_page=5&what=developer`;
        const adzunaResponse = await fetch(adzunaUrl);

        if (adzunaResponse.ok) {
          const data = await adzunaResponse.json();
          results.adzunaTest = `✅ Success - Found ${
            data.results?.length || 0
          } jobs`;
        } else {
          const errorText = await adzunaResponse.text();
          results.adzunaTest = `❌ Error ${adzunaResponse.status}: ${errorText}`;
        }
      } catch (error) {
        results.adzunaTest = `❌ Exception: ${
          error instanceof Error ? error.message : "Unknown"
        }`;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("❌ API test failed:", error);

    return NextResponse.json(
      {
        error: "API test failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
