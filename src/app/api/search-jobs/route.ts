import { NextRequest, NextResponse } from "next/server";
import { JobSearchService } from "@/lib/services/job-search";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filters, page = 1 } = body;

    console.log("🔍 API Route: Received job search request", { filters, page });

    const jobSearchService = new JobSearchService();
    const results = await jobSearchService.searchJobs(filters, page);

    console.log(`✅ API Route: Successfully found ${results.jobs.length} jobs`);

    return NextResponse.json(results);
  } catch (error) {
    console.error("❌ API Route: Job search failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Job search failed",
        message: errorMessage,
        details: "Please check your API keys in .env.local and try again.",
      },
      { status: 500 }
    );
  }
}
