/**
 * Premium Banner Component
 *
 * Reusable banner for promoting premium features throughout the app
 * Displays compelling upgrade prompts at key user journey moments
 */

'use client';

import Link from 'next/link';
import { Sparkles, Lock, ArrowRight } from 'lucide-react';

interface PremiumBannerProps {
    feature: 'save' | 'alerts' | 'tracking' | 'unlimited' | 'general';
    className?: string;
    compact?: boolean;
}

const featureContent = {
    save: {
        title: 'Save Your Searches',
        description: 'Keep track of your favorite jobs and searches',
        icon: '💾',
    },
    alerts: {
        title: 'Get Job Alerts',
        description: 'Be the first to know when matching jobs are posted',
        icon: '🔔',
    },
    tracking: {
        title: 'Track Applications',
        description: 'Organize and manage all your job applications',
        icon: '📊',
    },
    unlimited: {
        title: 'Unlimited AI Features',
        description: 'Access all premium AI tools without limits',
        icon: '✨',
    },
    general: {
        title: 'Unlock Premium',
        description: 'Get unlimited access to all features',
        icon: '⭐',
    },
};

export default function PremiumBanner({
    feature = 'general',
    className = '',
    compact = false
}: PremiumBannerProps) {
    const content = featureContent[feature];

    if (compact) {
        return (
            <div className={`relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white overflow-hidden ${className}`}>
                <div className="relative flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">{content.title}</p>
                            <p className="text-xs text-blue-100">{content.description}</p>
                        </div>
                    </div>
                    <Link
                        href="/pricing"
                        className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold text-sm hover:shadow-lg transition-all whitespace-nowrap"
                    >
                        Upgrade
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-2xl p-8 text-white overflow-hidden ${className}`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>

            <div className="relative">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Content */}
                    <div className="flex items-center gap-6 text-center md:text-left">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl">
                            {content.icon}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-2">
                                {content.title}
                            </h3>
                            <p className="text-blue-100 text-lg mb-2">
                                {content.description}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-blue-100">
                                <Lock className="h-4 w-4" />
                                <span>Premium Feature</span>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="flex flex-col gap-3">
                        <Link
                            href="/pricing"
                            className="group px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                        >
                            View Plans
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <p className="text-xs text-blue-100 text-center">
                            Starting at <span className="font-bold text-white">$4/month</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
