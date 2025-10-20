/**
 * Dashboard Page
 *
 * Main dashboard for authenticated users.
 * Shows job search overview, recent activity, and quick actions.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardContent } from './dashboard-content';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch user data
        fetch('/api/auth/me')
            .then(async res => {
                if (!res.ok) {
                    router.push('/auth/login?redirect=/dashboard');
                    return;
                }
                const data = await res.json();
                setUser(data.user);

                // Fetch user profile (same as user for now)
                setUserProfile(data.user);
                setLoading(false);
            })
            .catch(() => {
                router.push('/auth/login?redirect=/dashboard');
            });
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardContent user={user} userProfile={userProfile} />
        </div>
    );
}
