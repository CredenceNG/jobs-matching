/**
 * GET /api/tokens/packages
 *
 * Get all available token packages for purchase
 *
 * @returns { packages: TokenPackage[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/tokens';

export async function GET(request: NextRequest) {
    try {
        const packages = await TokenService.getTokenPackages();

        // Add display price and calculate equivalents
        const packagesWithExtras = packages.map(pkg => {
            const priceDisplay = `$${(pkg.priceCents / 100).toFixed(2)}`;
            const pricePerToken = pkg.priceCents / pkg.tokens;

            // Calculate equivalent actions (sample costs)
            const equivalents = [
                { action: 'Job Matches', count: Math.floor(pkg.tokens / 5) },
                { action: 'Cover Letters', count: Math.floor(pkg.tokens / 12) },
                { action: 'Resume Analyses', count: Math.floor(pkg.tokens / 10) },
                { action: 'Interview Preps', count: Math.floor(pkg.tokens / 8) },
            ];

            return {
                ...pkg,
                priceDisplay,
                pricePerToken,
                equivalents
            };
        });

        return NextResponse.json({
            packages: packagesWithExtras
        });
    } catch (error: any) {
        console.error('Error fetching token packages:', error);
        return NextResponse.json(
            { error: 'Failed to fetch packages', details: error.message },
            { status: 500 }
        );
    }
}
