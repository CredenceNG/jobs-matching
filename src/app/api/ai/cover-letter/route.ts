/**
 * POST /api/ai/cover-letter
 *
 * Generates a personalized cover letter using Claude AI
 * Combines resume analysis and job details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { TokenService } from '@/lib/tokens';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
    console.log('🔵 [Cover Letter] Generating AI cover letter...');

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
        const canAfford = await TokenService.canAffordFeature(user.id, 'cover_letter');

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

        console.log('✅ [Cover Letter] Generating for job:', jobDetails.title);

        // Step 4: Build prompt for Claude
        const prompt = `You are an expert career advisor writing a personalized cover letter.

RESUME ANALYSIS:
- Name: ${resumeAnalysis.name || 'Professional'}
- Job Titles: ${resumeAnalysis.jobTitles?.join(', ') || 'N/A'}
- Experience Level: ${resumeAnalysis.experienceLevel || 'N/A'}
- Years of Experience: ${resumeAnalysis.yearsOfExperience || 'N/A'}
- Key Skills: ${resumeAnalysis.skills?.map((s: any) => s.name).slice(0, 15).join(', ') || 'N/A'}
- Industries: ${resumeAnalysis.industries?.join(', ') || 'N/A'}
- Summary: ${resumeAnalysis.summary || 'N/A'}

JOB DETAILS:
- Title: ${jobDetails.title}
- Company: ${jobDetails.company}
- Location: ${jobDetails.location || 'N/A'}
- Description: ${jobDetails.description?.substring(0, 2000) || 'N/A'}

Write a compelling, personalized cover letter that:
1. Opens with enthusiasm for the specific role and company
2. Highlights 2-3 most relevant experiences that directly match job requirements
3. Shows understanding of the company and role
4. Demonstrates value you would bring
5. Closes with a strong call to action
6. Uses professional but conversational tone
7. Is 300-400 words (3-4 paragraphs)
8. Uses "you/your" when referring to the applicant's experience

Format as a professional cover letter with proper paragraphs.
DO NOT include placeholders like [Your Name] or [Date] - write the actual content.
Start directly with the opening paragraph.`;

        // Step 5: Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 2000,
            temperature: 0.7,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        const coverLetter = completion.choices[0]?.message?.content || '';

        if (!coverLetter) {
            throw new Error('Failed to generate cover letter');
        }

        // Step 6: Deduct tokens (if not unlimited)
        if (!canAfford.isUnlimited) {
            await TokenService.deductTokens(user.id, 'cover_letter', {
                metadata: {
                    job_title: jobDetails.title,
                    job_company: jobDetails.company,
                }
            });
        }

        console.log('✅ [Cover Letter] Generated successfully');

        // Step 7: Return cover letter
        return NextResponse.json({
            success: true,
            coverLetter,
            wordCount: coverLetter.split(/\s+/).length,
        });

    } catch (error) {
        console.error('🔴 [Cover Letter] Error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to generate cover letter',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
