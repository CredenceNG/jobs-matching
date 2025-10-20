/**
 * GET /api/tokens/costs
 *
 * Get all feature costs
 *
 * @query detailed - If true, returns full feature details
 * @returns { costs: Record<string, number>, features?: FeatureCost[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/tokens';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const detailed = searchParams.get('detailed') === 'true';

        if (detailed) {
            const features = await TokenService.getAllFeatureCostsDetailed();
            const costs = features.reduce((acc, f) => {
                acc[f.featureKey] = f.tokenCost;
                return acc;
            }, {} as Record<string, number>);

            return NextResponse.json({
                costs,
                features
            });
        } else {
            const costs = await TokenService.getAllFeatureCosts();
            return NextResponse.json({ costs });
        }
    } catch (error: any) {
        console.error('Error fetching feature costs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch costs', details: error.message },
            { status: 500 }
        );
    }
}
