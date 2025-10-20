/**
 * POST /api/analyze-resume
 *
 * Analyze resume text using AI and extract structured information
 *
 * @requires authentication
 * @requires tokens or subscription
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from '@/lib/auth/session';
import { TokenService } from '@/lib/tokens/token-service';

export async function POST(request: NextRequest) {
  console.log('🔵 [Resume Analysis] Starting resume analysis request...');

  try {
    // Step 1: Check authentication
    const user = await getSession();

    if (!user) {
      console.error('🔴 [Resume Analysis] Authentication error: No session');
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to analyze resumes' },
        { status: 401 }
      );
    }

    console.log('✅ [Resume Analysis] User authenticated:', user.id);

    const { resumeText } = await request.json();

    if (!resumeText) {
      return NextResponse.json(
        { error: "Resume text is required" },
        { status: 400 }
      );
    }

    // Step 2: Check token balance
    const RESUME_ANALYSIS_FEATURE = 'resume_analysis';

    try {
      const canAfford = await TokenService.canAfford(user.id, RESUME_ANALYSIS_FEATURE);

      if (!canAfford.canAfford && !canAfford.isUnlimited) {
        console.error('🔴 [Resume Analysis] Insufficient tokens');
        return NextResponse.json(
          {
            error: 'Insufficient tokens',
            required: canAfford.required,
            balance: canAfford.balance,
            message: 'You need more tokens to analyze your resume. Please purchase tokens or upgrade to premium.'
          },
          { status: 402 } // Payment Required
        );
      }

      console.log(`✅ [Resume Analysis] User has sufficient tokens (unlimited: ${canAfford.isUnlimited})`);
    } catch (tokenError) {
      console.error('🔴 [Resume Analysis] Token check error:', tokenError);
      // Continue anyway - token system may not be fully set up yet
    }

    console.log('🔵 [Resume Analysis] Calling AI for analysis...');

    const analysisPrompt = `
You are an expert resume parser. Analyze this resume text and extract structured information.

Resume Text:
${resumeText}

Please extract and return the following information in JSON format:
{
  "skills": ["list of technical and soft skills mentioned"],
  "experience": "experience level (entry-level, mid-level, senior, executive)",
  "location": "preferred work location if mentioned",
  "jobTitles": ["list of job titles/positions held"],
  "industries": ["list of industries/sectors mentioned"],
  "education": "highest education level",
  "certifications": ["list of certifications if any"],
  "summary": "brief summary of the candidate's profile"
}

Focus on:
1. Technical skills (programming languages, tools, technologies)
2. Soft skills (leadership, communication, etc.)
3. Years of experience or experience level
4. Job titles and company names
5. Industry experience
6. Education and certifications
7. Location preferences (if any)

Return only valid JSON without any additional text or formatting.
`;

    // Direct Anthropic call to avoid cookie issues
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
    });

    const responseText =
      aiResponse.content[0]?.type === "text"
        ? aiResponse.content[0].text
        : "{}";

    console.log('✅ [Resume Analysis] Analysis complete');

    // Step 3: Deduct tokens (if not unlimited)
    try {
      await TokenService.deductTokens(
        user.id,
        RESUME_ANALYSIS_FEATURE,
        {
          resume_length: resumeText.length,
          analysis_model: 'claude-3-5-sonnet'
        }
      );
      console.log(`✅ [Resume Analysis] Tokens deducted successfully`);
    } catch (deductError) {
      console.error('🟡 [Resume Analysis] Warning - Failed to deduct tokens:', deductError);
      // Continue anyway - token logging is not critical
    }

    return NextResponse.json({
      success: true,
      analysis: responseText,
    });
  } catch (error) {
    console.error("Resume analysis error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze resume",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
