/**
 * Token Packages Component
 *
 * Displays available token packages for purchase
 * Shows pricing, savings, and value propositions
 */

'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Zap, Star, Crown, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Package {
    id: string;
    name: string;
    tokens: number;
    price: number;
    savings?: number;
    popular?: boolean;
    bestValue?: boolean;
    icon: any;
    equivalents: { action: string; count: number }[];
}

interface TokenPackagesProps {
    onSelectPackage?: (packageId: string) => void;
    selectedPackage?: string;
}

// Icon mapping based on tier
const ICON_MAP: Record<string, any> = {
    'starter': Sparkles,
    'basic': Zap,
    'pro': Star,
    'power': Crown,
};

// Calculate equivalents based on token count (approximate)
function calculateEquivalents(tokens: number) {
    const equivalents = [];
    equivalents.push({ action: 'Job Matches', count: Math.floor(tokens / 5) });
    equivalents.push({ action: 'Cover Letters', count: Math.floor(tokens / 12) });
    if (tokens >= 250) {
        equivalents.push({ action: 'Resume Analyses', count: Math.floor(tokens / 10) });
    }
    if (tokens >= 600) {
        equivalents.push({ action: 'Interview Preps', count: Math.floor(tokens / 8) });
    }
    return equivalents;
}

export default function TokenPackages({
    onSelectPackage,
    selectedPackage
}: TokenPackagesProps) {
    const [packages, setPackages] = useState<Package[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch packages from API on mount
    useEffect(() => {
        async function fetchPackages() {
            try {
                const response = await fetch('/api/tokens/packages');
                if (!response.ok) {
                    throw new Error('Failed to fetch packages');
                }

                const data = await response.json();

                // Transform API response to component format
                const transformedPackages: Package[] = data.packages.map((pkg: any) => ({
                    id: pkg.id,
                    name: pkg.name,
                    tokens: pkg.tokens,
                    price: pkg.priceCents / 100, // Convert cents to dollars
                    savings: pkg.discountPercentage,
                    popular: pkg.popular,
                    bestValue: pkg.bestValue,
                    icon: ICON_MAP[pkg.tier.toLowerCase()] || Sparkles,
                    equivalents: calculateEquivalents(pkg.tokens)
                }));

                setPackages(transformedPackages);
            } catch (err: any) {
                console.error('Error fetching packages:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        fetchPackages();
    }, []);

    const handleSelect = (packageId: string) => {
        onSelectPackage?.(packageId);
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-2xl p-6 border-2 border-gray-200 animate-pulse">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
                        <div className="h-6 bg-gray-200 rounded mb-2" />
                        <div className="h-10 bg-gray-200 rounded mb-4" />
                        <div className="h-20 bg-gray-200 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 mb-2">Failed to load token packages</p>
                <p className="text-sm text-gray-500">{error}</p>
            </div>
        );
    }

    // Show empty state
    if (packages.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">No token packages available</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => {
                const Icon = pkg.icon;
                const isSelected = selectedPackage === pkg.id;
                const pricePerToken = (pkg.price / pkg.tokens).toFixed(3);

                return (
                    <div
                        key={pkg.id}
                        className={cn(
                            'relative bg-white rounded-2xl p-6 border-2 transition-all cursor-pointer',
                            pkg.bestValue
                                ? 'border-blue-500 shadow-xl scale-105'
                                : 'border-gray-200 hover:border-blue-300 hover:shadow-lg',
                            isSelected && 'ring-4 ring-blue-200'
                        )}
                        onClick={() => handleSelect(pkg.id)}
                    >
                        {/* Badges */}
                        {(pkg.popular || pkg.bestValue) && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 flex gap-2">
                                {pkg.popular && (
                                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                        🔥 Most Popular
                                    </span>
                                )}
                                {pkg.bestValue && (
                                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                        💎 Best Value
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Icon */}
                        <div className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                            pkg.bestValue
                                ? 'bg-gradient-to-br from-blue-100 to-purple-100'
                                : 'bg-gray-100'
                        )}>
                            <Icon className={cn(
                                'h-6 w-6',
                                pkg.bestValue ? 'text-blue-600' : 'text-gray-600'
                            )} />
                        </div>

                        {/* Package Info */}
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {pkg.name}
                        </h3>
                        <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {pkg.tokens}
                            </span>
                            <span className="text-sm text-gray-600">tokens</span>
                        </div>

                        {/* Price */}
                        <div className="mb-4">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-2xl font-bold text-gray-900">
                                    ${pkg.price}
                                </span>
                                <span className="text-xs text-gray-500">
                                    ${pricePerToken}/token
                                </span>
                            </div>
                            {pkg.savings && (
                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                                    <Check className="h-3 w-3" />
                                    Save {pkg.savings}%
                                </div>
                            )}
                        </div>

                        {/* Equivalents */}
                        <div className="space-y-2 mb-6">
                            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                                Enough for:
                            </p>
                            {pkg.equivalents.map((eq, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-700">{eq.action}</span>
                                    <span className="font-semibold text-blue-600">≈ {eq.count}×</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA Button */}
                        <button
                            className={cn(
                                'w-full py-3 rounded-xl font-bold transition-all',
                                pkg.bestValue
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:scale-105'
                                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            )}
                        >
                            {isSelected ? 'Selected' : 'Select Package'}
                        </button>

                        {/* Selection Indicator */}
                        {isSelected && (
                            <div className="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                <Check className="h-4 w-4 text-white" />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
