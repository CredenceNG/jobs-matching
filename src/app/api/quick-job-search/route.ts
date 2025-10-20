import { NextRequest, NextResponse } from "next/server";
import { aiJobScorer } from "@/lib/services/ai-job-scorer";
import { ResumeAnalysis } from "@/lib/services/ai-resume-analyzer";

/**
 * Quick Job Search API
 *
 * Lightweight version of resume-job-search for anonymous users
 * Uses web scraping + AI scoring without heavy resume parsing
 */

// Normalize job data from scrapers
function normalizeJobData(job: any): any {
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

// Convert user profile to ResumeAnalysis format for AI scoring
function profileToResumeAnalysis(profile: any): ResumeAnalysis {
  return {
    skills: profile.skills.map((skill: string) => ({
      name: skill,
      proficiency: "intermediate" as const,
      yearsUsed: 2,
      lastUsed: new Date().getFullYear().toString()
    })),
    jobTitles: [profile.title],
    industries: [],
    experienceLevel: profile.experience as any,
    yearsOfExperience: getYearsFromExperience(profile.experience),
    specializations: [],
    careerGoal: profile.title,
    location: profile.location,
    summary: `${profile.experience} level professional seeking ${profile.title} positions`
  };
}

function getYearsFromExperience(experience: string): number {
  switch (experience) {
    case 'entry': return 1;
    case 'mid': return 3;
    case 'senior': return 7;
    case 'expert': return 12;
    default: return 1;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile } = body;

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile data is required" },
        { status: 400 }
      );
    }

    console.log(`🔍 Quick Job Search for: ${profile.title}`);
    console.log(`   - Skills: ${profile.skills.join(", ")}`);
    console.log(`   - Location: ${profile.location}`);
    console.log(`   - Experience: ${profile.experience}`);

    // ========================================================================
    // STEP 1: WEB SCRAPING (using existing job search service)
    // ========================================================================
    console.log("🕷️  STEP 1: Scraping jobs from web...");

    const { jobSearchService } = await import('@/lib/services/job-search');

    const searchFilters = {
      keywords: profile.title,
      location: profile.location === 'Remote' ? undefined : profile.location,
      remote: profile.location === 'Remote' || profile.location.toLowerCase().includes('remote'),
      experienceLevel: profile.experience
    };

    console.log(`   - Search filters:`, searchFilters);

    const jobSearchResults = await jobSearchService.searchJobs(searchFilters, 1);

    console.log(`✅ Found ${jobSearchResults.jobs.length} jobs from web scraping`);

    if (jobSearchResults.jobs.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No jobs found matching your criteria. Try different keywords or location.",
        jobs: []
      });
    }

    // Normalize job data
    const normalizedJobs = jobSearchResults.jobs.map(normalizeJobData);

    // ========================================================================
    // STEP 2: AI JOB SCORING (same as resume-jobs)
    // ========================================================================
    console.log("🎯 STEP 2: Scoring jobs with AI...");

    // Convert profile to ResumeAnalysis format
    const resumeAnalysis = profileToResumeAnalysis(profile);

    // Score jobs using AI (limit to 20 for performance)
    const jobsToScore = normalizedJobs.slice(0, 20);
    const jobScores = await aiJobScorer.scoreJobs(jobsToScore, resumeAnalysis);

    console.log(`✅ AI Scoring Complete!`);

    // Combine jobs with their AI scores
    const scoredJobs = jobsToScore.map((job, index) => {
      const score = jobScores[index];
      return {
        ...job,
        matchScore: score.overallScore,
        breakdown: score.breakdown,
        strengths: score.strengths,
        concerns: score.concerns,
        bridgeGaps: score.bridgeGaps,
        recommendation: score.recommendation,
        shouldApply: score.shouldApply,
        reasoning: score.reasoning,
      };
    });

    // Sort by AI score (highest first)
    scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

    console.log(`📊 Top 3 matches:`);
    scoredJobs.slice(0, 3).forEach((job, i) => {
      console.log(`   ${i + 1}. ${job.title} at ${job.company} - ${job.matchScore}% match`);
    });

    // ========================================================================
    // STEP 3: RETURN RESULTS
    // ========================================================================
    return NextResponse.json({
      success: true,
      message: `Found ${scoredJobs.length} AI-matched jobs`,
      jobs: scoredJobs,
      total: scoredJobs.length,
      searchFilters
    });

  } catch (error) {
    console.error("Quick job search error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to search for jobs. Please try again.",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
