/**
 * Unified Pricing Page
 *
 * Shows both token packages (pay-as-you-go) and subscriptions (unlimited)
 * Users can choose their preferred pricing model
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to /tokens/buy which will be our unified pricing page
        router.replace('/tokens/buy');
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-600">Redirecting to pricing...</p>
            </div>
        </div>
    );
}
