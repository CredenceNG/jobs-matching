import { NextRequest, NextResponse } from "next/server";
import { OpenWebNinjaAPI } from "@/lib/services/openweb-ninja-api";

export async function POST(request: NextRequest) {
  try {
    const { query, location } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    const openWebNinja = new OpenWebNinjaAPI();
    const jobs = await openWebNinja.searchJobs(query, location);

    return NextResponse.json({
      success: true,
      jobs,
      message: `OpenWeb Ninja JSearch returned ${jobs.length} jobs`,
      source: "OpenWeb Ninja JSearch API",
    });
  } catch (error) {
    console.error("OpenWeb Ninja API test error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
        jobs: [],
        message: `OpenWeb Ninja JSearch API failed: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
