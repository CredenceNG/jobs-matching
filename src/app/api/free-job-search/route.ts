import { NextRequest, NextResponse } from "next/server";
import { freeJobSearchService } from "@/lib/services/free-job-apis";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywords, location } = body;

    console.log("🆓 Free API Route: Received job search request", {
      keywords,
      location,
    });

    const results = await freeJobSearchService.searchJobs(
      keywords || "developer",
      location || ""
    );

    console.log(
      `✅ Free API Route: Successfully found ${results.jobs.length} jobs from multiple free sources`
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("❌ Free API Route: Job search failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Free job search failed",
        message: errorMessage,
        details: "All free job APIs are currently unavailable.",
      },
      { status: 500 }
    );
  }
}
