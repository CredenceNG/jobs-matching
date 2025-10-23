import { NextRequest, NextResponse } from "next/server";
import { jobSearchService } from "@/lib/services/job-search";
import { aiResumeAnalyzer } from "@/lib/services/ai-resume-analyzer";
import { aiJobScorer } from "@/lib/services/ai-job-scorer";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.AI_DEFAULT_MODEL || 'claude-sonnet-4-5-20250929';

// Helper to extract text from different file types
async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  if (fileType.includes("text") || fileType.includes("plain")) {
    // Plain text file
    return await file.text();
  } else if (fileType === "application/pdf") {
    // Extract text from PDF using pdf-parse
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Parse PDF
      const data = await pdfParse(buffer);
      const fullText = data.text;

      console.log(`📝 Extracted text length: ${fullText.length} characters`);
      console.log(`📄 PDF has ${data.numpages} pages`);

      return fullText;
    } catch (error) {
      console.error("PDF extraction error:", error);
      throw new Error(
        "Failed to extract text from PDF. Please try converting your resume to a text file or using a different PDF."
      );
    }
  } else if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    // Extract text from DOCX using mammoth
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await mammoth.extractRawText({ buffer });
      const fullText = result.value;

      console.log(`📝 Extracted text from DOCX: ${fullText.length} characters`);

      if (result.messages && result.messages.length > 0) {
        console.warn("⚠️  DOCX extraction warnings:", result.messages);
      }

      return fullText;
    } catch (error) {
      console.error("DOCX extraction error:", error);
      throw new Error(
        "Failed to extract text from DOCX file. Please try saving as PDF or text file."
      );
    }
  } else if (
    fileType === "application/msword" ||
    fileName.endsWith(".doc")
  ) {
    // .doc files (old Word format) are harder to parse
    // For now, suggest converting to .docx or PDF
    throw new Error(
      "Old .doc format is not supported. Please save your resume as .docx, PDF, or text file."
    );
  } else {
    throw new Error(
      `Unsupported file type: ${fileType}. Please upload PDF, DOCX, or text file.`
    );
  }
}

// Normalize job data to ensure consistent structure
function normalizeJobData(job: any): any {
  // Debug: log raw job data to see what we're working with
  console.log("🔍 Raw job data before normalization:", {
    id: job.id,
    title: job.title,
    company: job.company,
    description: job.description?.substring(0, 100) + "...",
    source: job.source,
  });

  const normalized = {
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

  // Debug: log normalized result
  console.log("✅ Normalized job data:", {
    id: normalized.id,
    title: normalized.title,
    company: normalized.company,
    hasRealData: !!(job.title && job.company && job.description),
  });

  return normalized;
}

// Generate job match score and reasons
function analyzeJobMatch(
  job: any,
  parsedData: any
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Skills matching
  const jobDescription = job.description.toLowerCase();
  const jobTitle = job.title.toLowerCase();

  if (parsedData.skills && parsedData.skills.length > 0) {
    const matchingSkills = parsedData.skills.filter(
      (skill: string) =>
        jobDescription.includes(skill.toLowerCase()) ||
        jobTitle.includes(skill.toLowerCase())
    );

    if (matchingSkills.length > 0) {
      score += Math.min(matchingSkills.length * 15, 60); // Max 60 points for skills
      reasons.push(`Skills match: ${matchingSkills.slice(0, 3).join(", ")}`);
    }
  }

  // Job title matching
  if (parsedData.jobTitles && parsedData.jobTitles.length > 0) {
    const titleMatch = parsedData.jobTitles.some(
      (title: string) =>
        jobTitle.includes(title.toLowerCase()) ||
        title.toLowerCase().includes(jobTitle)
    );

    if (titleMatch) {
      score += 20;
      reasons.push("Similar job title to your experience");
    }
  }

  // Experience level matching
  if (parsedData.experience) {
    const experienceInJob = jobDescription.includes(
      parsedData.experience.toLowerCase()
    );
    if (experienceInJob) {
      score += 15;
      reasons.push(`Experience level matches (${parsedData.experience})`);
    }
  }

  // Industry matching
  if (parsedData.industries && parsedData.industries.length > 0) {
    const industryMatch = parsedData.industries.some(
      (industry: string) =>
        jobDescription.includes(industry.toLowerCase()) ||
        job.company.toLowerCase().includes(industry.toLowerCase())
    );

    if (industryMatch) {
      score += 10;
      reasons.push("Industry experience aligns");
    }
  }

  // Base compatibility score
  score += 15;

  if (reasons.length === 0) {
    reasons.push("Basic job requirements match your profile");
  }

  return { score: Math.min(score, 95), reasons }; // Cap at 95%
}

/**
 * Generate career-level strategic recommendations based on resume analysis and job search results
 * Similar to V3's approach but integrated into V2
 *
 * @param resumeAnalysis - Parsed resume data with skills, experience, titles
 * @param scoredJobs - Array of jobs with AI match scores
 * @returns Array of strategic career recommendations
 */
async function generateCareerRecommendations(
  resumeAnalysis: any,
  scoredJobs: any[]
): Promise<string[]> {
  console.log('💡 Generating career-level recommendations...')

  if (scoredJobs.length === 0) {
    return [
      'Broaden your search criteria to include more job titles',
      'Consider adding related skills to your resume',
      'Try searching in nearby cities or remote positions'
    ]
  }

  // Extract key data for AI analysis
  const topSkills = resumeAnalysis.skills.slice(0, 10).map((s: any) => s.name || s).join(', ')
  const jobTitles = resumeAnalysis.jobTitles.join(', ')
  const topMatches = scoredJobs.slice(0, 5).map(j => `${j.title} (${j.matchScore}% match)`).join(', ')
  const avgScore = Math.round(scoredJobs.reduce((sum, j) => sum + j.matchScore, 0) / scoredJobs.length)

  // Analyze common requirements from top jobs
  const topJobDescriptions = scoredJobs.slice(0, 5).map(j => j.description).join(' ')

  const prompt = `Based on this candidate's job search results, provide 4-5 SPECIFIC, ACTIONABLE career recommendations.

CANDIDATE PROFILE:
- Top Skills: ${topSkills}
- Experience Level: ${resumeAnalysis.experienceLevel}
- Years of Experience: ${resumeAnalysis.yearsOfExperience || 'Unknown'}
- Current/Past Roles: ${jobTitles}
- Specializations: ${resumeAnalysis.specializations?.join(', ') || 'None'}

JOB SEARCH RESULTS:
- Total Jobs Found: ${scoredJobs.length}
- Top Matches: ${topMatches}
- Average Match Score: ${avgScore}%
- Industries: ${resumeAnalysis.industries?.join(', ') || 'Various'}

COMMON REQUIREMENTS IN TOP JOBS:
${topJobDescriptions.substring(0, 1500)}

Provide strategic career advice such as:
1. Role pivots that align better with their skills
2. Specific skills to add or certifications to obtain (WITH NAMES)
3. Resume positioning changes to improve match scores
4. Alternative job titles to target
5. Portfolio/project recommendations

CRITICAL REQUIREMENTS:
- Use second-person language ("You should...", "Consider...", "Your...")
- Be SPECIFIC (mention actual certification names, technologies, courses)
- NO generic advice like "network more" or "improve skills"
- Focus on GAP ANALYSIS between their profile and market demand
- Reference ACTUAL data from their search results

Return ONLY valid JSON: { "recommendations": ["rec1", "rec2", "rec3", "rec4", "rec5"] }`

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 800,
      temperature: 0.6,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const cleanedText = content.text
        .trim()
        .replace(/^```json?\n?/i, '')
        .replace(/\n?```$/, '')
        .trim()

      const parsed = JSON.parse(cleanedText)
      console.log(`✅ Generated ${parsed.recommendations?.length || 0} career recommendations`)
      return parsed.recommendations || []
    }
  } catch (error) {
    console.error('❌ Career recommendation generation failed:', error)
  }

  // Fallback recommendations based on match scores
  if (avgScore < 50) {
    return [
      `Your average match score of ${avgScore}% suggests you're targeting roles that don't align with your ${resumeAnalysis.experienceLevel} profile`,
      `Consider pivoting to roles that emphasize your core skills: ${topSkills}`,
      `Your background in ${jobTitles} may be better suited for related positions rather than ${scoredJobs[0]?.title} roles`,
      'Add specific portfolio projects or certifications that demonstrate skills required by your target roles',
      `Research job descriptions for ${scoredJobs[0]?.title} roles and identify the 3-5 most commonly requested skills you're missing`
    ]
  }

  return [
    `With an ${avgScore}% average match, you're on the right track targeting ${scoredJobs[0]?.title} positions`,
    `To improve your competitiveness, focus on acquiring certifications in skills mentioned frequently in top matches`,
    `Your ${resumeAnalysis.experienceLevel} experience is well-suited for these roles - emphasize this in your applications`,
    'Consider expanding your search to include similar roles that value your expertise',
    `Highlight specific projects where you used ${topSkills} to stand out among other candidates`
  ]
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume") as File;
    const preferencesString = formData.get("preferences") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No resume file provided" },
        { status: 400 }
      );
    }

    // Parse user preferences
    let userPreferences = null;
    if (preferencesString) {
      try {
        userPreferences = JSON.parse(preferencesString);
        console.log(`📋 User Preferences:`, userPreferences);
      } catch (e) {
        console.warn("Failed to parse preferences, continuing without them");
      }
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    console.log(`📄 Processing resume file: ${file.name} (${file.type})`);

    // Extract text from file
    let resumeText: string;
    try {
      resumeText = await extractTextFromFile(file);
      console.log(`📝 Resume text preview (first 500 chars):`);
      console.log(resumeText.substring(0, 500));
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to extract text from file",
        },
        { status: 400 }
      );
    }

    if (!resumeText || resumeText.length < 100) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Resume content is too short or could not be extracted. Please try a different file format.",
        },
        { status: 400 }
      );
    }

    console.log(`📝 Extracted text length: ${resumeText.length} characters`);

    // ========================================================================
    // STEP 2: AI RESUME ANALYSIS
    // ========================================================================
    console.log("🤖 STEP 2: Analyzing resume with AI...");
    let resumeAnalysis;
    try {
      resumeAnalysis = await aiResumeAnalyzer.analyzeResume(resumeText);
      console.log(`✅ AI Analysis Complete:`);
    } catch (aiError) {
      console.error("❌ AI Resume Analysis Failed:", {
        error: aiError instanceof Error ? aiError.message : 'Unknown error',
        stack: aiError instanceof Error ? aiError.stack : undefined,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Failed to analyze resume with AI",
          message: aiError instanceof Error ? aiError.message : "AI service unavailable",
          details: "The AI service encountered an error while analyzing your resume. Please try again.",
        },
        { status: 500 }
      );
    }

    console.log(`✅ AI Analysis Complete:`);
    console.log(`   - Skills found: ${resumeAnalysis.skills.length}`);
    console.log(`   - Job titles: ${resumeAnalysis.jobTitles.join(", ")}`);
    console.log(`   - Industries: ${resumeAnalysis.industries.join(", ")}`);
    console.log(`   - Experience: ${resumeAnalysis.experienceLevel}`);
    console.log(
      `   - Top skills: ${resumeAnalysis.skills
        .slice(0, 5)
        .map((s) => s.name)
        .join(", ")}`
    );

    // ========================================================================
    // STEP 3: SEARCH FOR JOBS
    // ========================================================================
    console.log("🔍 STEP 3: Searching for relevant jobs...");

    // Generate search keywords from AI analysis
    const searchKeywords = aiResumeAnalyzer
      .generateSearchKeywords(resumeAnalysis)
      .join(" ");

    // Use user preferences for location if provided, otherwise use resume location
    const searchLocation = userPreferences?.preferredLocation || resumeAnalysis.location || "Remote";

    console.log(`   - Search query: "${searchKeywords}"`);
    console.log(`   - Location: "${searchLocation}"`);
    if (userPreferences) {
      console.log(`   - Preferred Role: "${userPreferences.preferredRole || 'None'}"`);
      console.log(`   - Employment Type: "${userPreferences.employmentType || 'Any'}"`);
      console.log(`   - Remote Only: ${userPreferences.remoteOnly ? 'Yes' : 'No'}`);
    }

    // Search for jobs
    const jobSearchResults = await jobSearchService.searchJobs({
      keywords: searchKeywords,
      location: searchLocation,
      experienceLevel: resumeAnalysis.experienceLevel,
      remote: searchLocation.toLowerCase().includes("remote"),
    });

    console.log(`✅ Found ${jobSearchResults.jobs.length} jobs`);

    // Normalize job data
    const normalizedJobs = jobSearchResults.jobs.map((job) =>
      normalizeJobData(job)
    );

    // ========================================================================
    // STEP 3B: AI JOB SCORING
    // ========================================================================
    console.log("🎯 STEP 3B: Scoring jobs with AI...");

    // Score each job using AI, passing user preferences for location/role/type matching
    const jobScores = await aiJobScorer.scoreJobs(
      normalizedJobs.slice(0, 20), // Limit to top 20 for cost efficiency
      resumeAnalysis,
      userPreferences || undefined
    );

    console.log(`✅ AI Scoring Complete!`);

    // Combine jobs with their AI scores
    const scoredJobs = normalizedJobs.slice(0, 20).map((job, index) => {
      const score = jobScores[index];
      return {
        ...job,
        matchScore: score.overallScore,
        breakdown: score.breakdown,
        strengths: score.strengths,
        concerns: score.concerns,
        bridgeGaps: score.bridgeGaps, // AI-generated contextual recommendations
        recommendation: score.recommendation,
        shouldApply: score.shouldApply,
        reasoning: score.reasoning,
      };
    });

    // Sort by AI score (highest first)
    scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

    console.log(`📊 Top 3 matches:`);
    scoredJobs.slice(0, 3).forEach((job, i) => {
      console.log(
        `   ${i + 1}. ${job.title} at ${job.company} - ${job.matchScore}% match`
      );
    });

    // ========================================================================
    // STEP 4: GENERATE CAREER-LEVEL RECOMMENDATIONS
    // ========================================================================
    console.log("💡 STEP 4: Generating career-level recommendations...");

    const careerRecommendations = await generateCareerRecommendations(
      resumeAnalysis,
      scoredJobs
    );

    console.log(`✅ Generated ${careerRecommendations.length} career recommendations`);

    // ========================================================================
    // STEP 5: RETURN RESULTS
    // ========================================================================
    console.log("✅ Job matching complete! Returning results...");

    return NextResponse.json({
      success: true,
      message: `Found ${scoredJobs.length} AI-matched jobs based on your resume`,
      analysis: {
        skills: resumeAnalysis.skills.slice(0, 15),
        jobTitles: resumeAnalysis.jobTitles,
        industries: resumeAnalysis.industries,
        experience: resumeAnalysis.experienceLevel,
        yearsOfExperience: resumeAnalysis.yearsOfExperience,
        specializations: resumeAnalysis.specializations,
        location: resumeAnalysis.location,
        summary: resumeAnalysis.summary,
      },
      matches: scoredJobs,
      recommendations: careerRecommendations, // NEW: Career-level strategic recommendations
      searchKeywords,
      searchLocation,
    });
  } catch (error) {
    console.error("Resume job search error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to process resume and search for jobs. Please try again.",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
