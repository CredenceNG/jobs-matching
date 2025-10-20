/**
 * Navigation Component
 *
 * Modern, minimalist navigation bar used across all pages
 * Features: Fixed header, gradient branding, prominent CTA
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface NavigationProps {
    transparent?: boolean;
}

export default function Navigation({ transparent = false }: NavigationProps) {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className={cn(
            'fixed top-0 w-full z-50 border-b transition-all',
            transparent
                ? 'bg-white/60 backdrop-blur-lg border-gray-200/30'
                : 'bg-white/80 backdrop-blur-md border-gray-200/50'
        )}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 group"
                    >
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            JobAI
                        </span>
                        <Sparkles className="h-5 w-5 text-blue-600 group-hover:text-purple-600 transition-colors" />
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            href="/resume-jobs-v2"
                            className={cn(
                                'text-sm font-medium transition-colors',
                                isActive('/resume-jobs-v2')
                                    ? 'text-blue-600'
                                    : 'text-gray-700 hover:text-blue-600'
                            )}
                        >
                            Try Free
                        </Link>
                        <Link
                            href="/pricing"
                            className={cn(
                                'text-sm font-medium transition-colors',
                                isActive('/pricing')
                                    ? 'text-blue-600'
                                    : 'text-gray-700 hover:text-blue-600'
                            )}
                        >
                            Pricing
                        </Link>
                    </div>

                    {/* CTA Button */}
                    <Link
                        href="/pricing"
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all"
                    >
                        Go Premium
                    </Link>
                </div>
            </div>
        </nav>
    );
}
