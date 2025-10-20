/**
 * POST /api/ai/resume
 *
 * Generate optimized resume for a specific job using AI
 *
 * @requires authentication
 * @requires tokens (premium feature)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { resumeOptimizerService } from '@/lib/ai/resume-optimizer';
import { TokenService } from '@/lib/tokens/token-service';

export async function POST(request: NextRequest) {
    console.log('🔵 [AI Resume] Starting resume optimization request...');

    try {
        // Step 1: Check authentication
        const user = await getSession();

        if (!user) {
            console.error('🔴 [AI Resume] Authentication error: No session');
            return NextResponse.json(
                { error: 'Unauthorized - Please log in' },
                { status: 401 }
            );
        }

        console.log('✅ [AI Resume] User authenticated:', user.id);

        // Step 2: Parse request body
        const body = await request.json();
        const {
            jobId,
            jobTitle,
            company,
            location,
            jobType,
            description,
            requirements,
            userProfile,
            format = 'ats-friendly',
            focusAreas = [],
            customInstructions
        } = body;

        // Validate required fields
        if (!jobTitle || !company || !userProfile || !userProfile.resumeData) {
            console.error('🔴 [AI Resume] Missing required fields');
            return NextResponse.json(
                { error: 'Missing required fields: jobTitle, company, userProfile.resumeData' },
                { status: 400 }
            );
        }

        console.log(`🔵 [AI Resume] Optimizing resume for ${jobTitle} at ${company}`);

        // Step 3: Check token balance and deduct tokens
        const RESUME_COST = 15; // Resume optimization costs 15 tokens

        try {
            const canAfford = await TokenService.canAfford(user.id, 'resume_optimization');

            if (!canAfford.canAfford && !canAfford.isUnlimited) {
                console.error('🔴 [AI Resume] Insufficient tokens');
                return NextResponse.json(
                    {
                        error: 'Insufficient tokens',
                        required: RESUME_COST,
                        balance: canAfford.balance,
                        message: 'You need more tokens to generate an optimized resume. Please purchase tokens to continue.'
                    },
                    { status: 402 } // Payment Required
                );
            }

            console.log(`✅ [AI Resume] User has sufficient tokens (unlimited: ${canAfford.isUnlimited})`);
        } catch (tokenError) {
            console.error('🔴 [AI Resume] Token check error:', tokenError);
            // Continue anyway - token system may not be fully set up yet
        }

        // Step 4: Build job listing object
        const jobListing = {
            id: jobId || `job-${Date.now()}`,
            title: jobTitle,
            company,
            location: location || 'Not specified',
            jobType: jobType || 'Full-time',
            description: description || '',
            requirements: Array.isArray(requirements) ? requirements : [],
            salary: '',
            postedDate: new Date().toISOString(),
            source: 'user-provided'
        };

        // Step 5: Build optimization request
        const optimizationRequest = {
            userProfile: {
                name: userProfile.name || user.email?.split('@')[0] || 'Candidate',
                email: userProfile.email || user.email || '',
                phone: userProfile.phone || '',
                location: userProfile.location || '',
                resumeData: userProfile.resumeData
            },
            jobListing,
            format: format as any,
            focusAreas: Array.isArray(focusAreas) ? focusAreas : [],
            customInstructions
        };

        console.log('🔵 [AI Resume] Calling AI service for optimization...');

        // Step 6: Generate optimized resume
        const optimizedResume = await resumeOptimizerService.optimizeResume(
            user.id,
            optimizationRequest
        );

        console.log('✅ [AI Resume] Resume optimization complete');
        console.log(`📊 [AI Resume] ATS Score: ${optimizedResume.atsScore}%`);
        console.log(`📊 [AI Resume] Matched Keywords: ${optimizedResume.matchedKeywords.length}`);

        // Step 7: Deduct tokens (if not unlimited)
        try {
            await TokenService.deductTokens(
                user.id,
                'resume_optimization',
                {
                    job_id: jobId,
                    job_title: jobTitle,
                    company,
                    format
                }
            );
            console.log(`✅ [AI Resume] Tokens deducted successfully`);
        } catch (deductError) {
            console.error('🟡 [AI Resume] Warning - Failed to deduct tokens:', deductError);
            // Continue anyway - token logging is not critical
        }

        // Step 8: Return optimized resume
        return NextResponse.json({
            success: true,
            optimizedResume,
            metadata: {
                jobTitle,
                company,
                format,
                atsScore: optimizedResume.atsScore,
                keywordCount: optimizedResume.matchedKeywords.length,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error('🔴 [AI Resume] FATAL ERROR:', error);
        console.error('🔴 [AI Resume] Error message:', error.message);
        console.error('🔴 [AI Resume] Error stack:', error.stack);

        return NextResponse.json(
            {
                error: 'Failed to generate optimized resume',
                details: error.message,
                type: error.name
            },
            { status: 500 }
        );
    }
}
