/**
 * AI Features Redirect Page
 * 
 * This page redirects users to the homepage where AI features are now located.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AIFeaturesPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to homepage after a short delay to allow users to see the message
        const timer = setTimeout(() => {
            router.push('/');
        }, 3000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md mx-auto text-center p-8">
                <div className="bg-white rounded-lg shadow-sm p-8">
                    <div className="text-6xl mb-4">🚀</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        AI Features Have Moved!
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Our AI features are now front and center on the homepage.
                        You'll be redirected automatically in a few seconds.
                    </p>
                    <div className="space-y-3">
                        <Link
                            href="/"
                            className="block w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Go to AI Features Now
                        </Link>
                        <Link
                            href="/search"
                            className="block w-full px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Browse Jobs Instead
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}