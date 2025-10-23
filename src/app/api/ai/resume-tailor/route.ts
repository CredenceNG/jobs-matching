/**
 * POST /api/ai/resume-tailor
 *
 * Generates a tailored resume using Claude AI
 * Optimizes resume for specific job requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { TokenService } from '@/lib/tokens';
import OpenAI from 'openai';

// Lazy initialization to avoid build-time errors when env vars are not available
let openai: OpenAI | null = null;
function getOpenAI() {
    if (!openai) {
        const apiKey = process.env.OPENAI_API_KEY;
        console.log('[Resume Tailor API] Initializing OpenAI client', {
            hasApiKey: !!apiKey,
            apiKeyLength: apiKey?.length || 0,
        });

        openai = new OpenAI({
            apiKey: apiKey || '',
        });

        console.log('[Resume Tailor API] OpenAI client initialized');
    }
    return openai;
}

export async function POST(request: NextRequest) {
    console.log('🔵 [Resume Tailor] Generating tailored resume...');

    try {
        // Step 1: Authenticate user
        const user = await getSession();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized - Please log in' },
                { status: 401 }
            );
        }

        // Step 2: Check token balance or subscription
        const canAfford = await TokenService.canAffordFeature(user.id, 'resume_optimization');

        if (!canAfford.canAfford && !canAfford.isUnlimited) {
            return NextResponse.json({
                error: 'Insufficient tokens',
                required: canAfford.required,
                balance: canAfford.balance,
            }, { status: 402 });
        }

        // Step 3: Get request data
        const { jobDetails, resumeAnalysis } = await request.json();

        if (!jobDetails || !resumeAnalysis) {
            return NextResponse.json(
                { error: 'Missing job details or resume analysis' },
                { status: 400 }
            );
        }

        console.log('✅ [Resume Tailor] Tailoring for job:', jobDetails.title);

        // Step 4: Build prompt for Claude
        const prompt = `You are an expert resume writer. Tailor this resume for the specific job.

CURRENT RESUME ANALYSIS:
- Name: ${resumeAnalysis.name || 'Professional'}
- Job Titles: ${resumeAnalysis.jobTitles?.join(', ') || 'N/A'}
- Experience Level: ${resumeAnalysis.experienceLevel || 'N/A'}
- Years of Experience: ${resumeAnalysis.yearsOfExperience || 'N/A'}
- Key Skills: ${resumeAnalysis.skills?.map((s: any) => s.name).join(', ') || 'N/A'}
- Industries: ${resumeAnalysis.industries?.join(', ') || 'N/A'}
- Summary: ${resumeAnalysis.summary || 'N/A'}
- Education: ${resumeAnalysis.education?.map((e: any) => `${e.degree} from ${e.institution}`).join('; ') || 'N/A'}

TARGET JOB:
- Title: ${jobDetails.title}
- Company: ${jobDetails.company}
- Location: ${jobDetails.location || 'N/A'}
- Description: ${jobDetails.description?.substring(0, 2000) || 'N/A'}
${jobDetails.strengths ? `\n- Your Matching Strengths: ${jobDetails.strengths.join('; ')}` : ''}
${jobDetails.concerns ? `\n- Skills to Emphasize: ${jobDetails.concerns.join('; ')}` : ''}

Create a tailored resume optimization guide with:

1. **PROFESSIONAL SUMMARY** (2-3 sentences)
   - Rewrite the summary to highlight skills matching this specific job
   - Use keywords from the job description
   - Emphasize relevant experience

2. **KEY SKILLS TO FEATURE** (8-12 skills)
   - List skills from your background that match job requirements
   - Order them by relevance to this role
   - Include both technical and soft skills

3. **EXPERIENCE OPTIMIZATION** (3-5 bullet points)
   - How to reframe your work experience for this role
   - Specific achievements to emphasize
   - Quantifiable results to highlight
   - Action verbs to use

4. **KEYWORDS TO INCLUDE**
   - Important terms from the job description
   - Industry buzzwords to add
   - Technologies/tools mentioned in the job post

5. **RECOMMENDATIONS**
   - 2-3 specific changes to make your resume stand out
   - Skills or certifications that would strengthen your application

Format as clear sections with bullet points. Be specific and actionable.`;

        // Step 5: Call OpenAI API
        const completion = await getOpenAI().chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 3000,
            temperature: 0.7,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        const tailoredResume = completion.choices[0]?.message?.content || '';

        if (!tailoredResume) {
            throw new Error('Failed to generate tailored resume');
        }

        // Step 6: Deduct tokens (if not unlimited)
        if (!canAfford.isUnlimited) {
            await TokenService.deductTokens(user.id, 'resume_optimization', {
                metadata: {
                    job_title: jobDetails.title,
                    job_company: jobDetails.company,
                }
            });
        }

        console.log('✅ [Resume Tailor] Generated successfully');

        // Step 7: Return tailored resume
        return NextResponse.json({
            success: true,
            tailoredResume,
        });

    } catch (error) {
        console.error('🔴 [Resume Tailor] Error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to generate tailored resume',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
