/**
 * Premium Upgrade Page
 * 
 * Dedicated page for premium subscription upgrades.
 * Provides detailed comparison and upgrade options.
 * 
 * @description Premium subscription upgrade page
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PremiumUpgrade from '@/components/premium/PremiumUpgrade';
import { getCurrentUser, getUserProfile } from '@/lib/auth/auth-client';
import { User } from '@/types/database';

function UpgradeForm() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        async function loadUserData() {
            try {
                const currentUser = await getCurrentUser();
                if (!currentUser) {
                    router.push('/auth/login?redirect=/upgrade');
                    return;
                }

                setUser(currentUser);

                const userProfile = await getUserProfile(currentUser.id);
                setProfile(userProfile);
            } catch (error) {
                console.error('Error loading user data:', error);
                router.push('/auth/login?redirect=/upgrade');
            } finally {
                setLoading(false);
            }
        }

        loadUserData();
    }, [router]);

    const handleUpgradeSuccess = () => {
        // Refresh the profile data or redirect to dashboard
        router.push('/dashboard?upgraded=true');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your account information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-4"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Upgrade to Premium
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                                {profile?.full_name || user?.email}
                            </span>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${profile?.subscription_status === 'premium'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                {profile?.subscription_status === 'premium' ? 'Premium' : 'Free'}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Success Message */}
                {searchParams.get('upgraded') === 'true' && (
                    <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-6">
                        <div className="flex items-center">
                            <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <div>
                                <h3 className="text-lg font-semibold text-green-900">
                                    Welcome to Premium!
                                </h3>
                                <p className="text-green-700">
                                    Your upgrade was successful. You now have access to all premium features.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <PremiumUpgrade
                    currentPlan={profile?.subscription_status as 'free' | 'premium' || 'free'}
                    onUpgrade={handleUpgradeSuccess}
                    userEmail={user?.email || ''}
                    userName={profile?.full_name || user?.email || 'User'}
                />
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center text-sm text-gray-600">
                        <p>
                            Need help? Contact our support team at{' '}
                            <a href="mailto:support@jobai.com" className="text-blue-600 hover:text-blue-700">
                                support@jobai.com
                            </a>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function UpgradePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading upgrade options...</p>
                </div>
            </div>
        }>
            <UpgradeForm />
        </Suspense>
    );
}