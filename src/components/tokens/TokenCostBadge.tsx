/**
 * Token Cost Badge Component
 *
 * Shows token cost before AI actions
 * Displays affordability status based on user balance
 */

'use client';

import { Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TokenCostBadgeProps {
    cost: number;
    userBalance?: number;
    size?: 'sm' | 'md' | 'lg';
    showAffordability?: boolean;
}

export default function TokenCostBadge({
    cost,
    userBalance,
    size = 'md',
    showAffordability = true
}: TokenCostBadgeProps) {
    const canAfford = userBalance !== undefined && userBalance >= cost;
    const isLow = userBalance !== undefined && userBalance < cost * 2;

    const sizeClasses = {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-3 py-1.5',
        lg: 'text-base px-4 py-2'
    };

    const iconSizes = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5'
    };

    return (
        <div className="inline-flex items-center gap-2">
            {/* Cost Badge */}
            <div className={cn(
                'inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg font-bold border',
                userBalance !== undefined && !canAfford
                    ? 'border-red-300 text-red-700'
                    : 'border-blue-200 text-blue-700',
                sizeClasses[size]
            )}>
                <Sparkles className={cn(iconSizes[size], 'text-blue-600')} />
                <span>{cost}</span>
                <span className="font-normal text-xs">tokens</span>
            </div>

            {/* Affordability Status */}
            {showAffordability && userBalance !== undefined && (
                <div className="inline-flex items-center gap-1">
                    {canAfford ? (
                        <>
                            <CheckCircle className={cn(iconSizes[size], 'text-green-600')} />
                            {isLow && (
                                <span className="text-xs text-yellow-600 font-medium">
                                    Running low
                                </span>
                            )}
                        </>
                    ) : (
                        <>
                            <AlertCircle className={cn(iconSizes[size], 'text-red-600')} />
                            <span className="text-xs text-red-600 font-medium">
                                Insufficient tokens
                            </span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
