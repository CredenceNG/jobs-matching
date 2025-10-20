/**
 * TokenGate Component
 *
 * Wrapper component that gates AI features behind token checks
 * Shows cost, checks affordability, and handles token deduction
 *
 * @example
 * <TokenGate
 *   featureKey="cover_letter"
 *   featureName="Generate Cover Letter"
 *   onConfirm={handleGenerate}
 * >
 *   <button>Generate Cover Letter</button>
 * </TokenGate>
 */

'use client';

import { useState, cloneElement, ReactElement } from 'react';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import TokenConfirmationModal from './TokenConfirmationModal';
import TokenCostBadge from './TokenCostBadge';

interface TokenGateProps {
    featureKey: string;
    featureName: string;
    description?: string;
    onConfirm: () => Promise<void> | void;
    children: ReactElement;
    showCostBadge?: boolean;
    disabled?: boolean;
}

/**
 * TokenGate wraps a trigger element and handles token-gated actions
 */
export default function TokenGate({
    featureKey,
    featureName,
    description,
    onConfirm,
    children,
    showCostBadge = true,
    disabled = false
}: TokenGateProps) {
    const { balance, isUnlimited, getCost, refreshBalance } = useTokenBalance();
    const [showModal, setShowModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cost = getCost(featureKey);
    const canAfford = isUnlimited || balance >= cost;

    /**
     * Handle click on trigger element
     */
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (disabled || isProcessing) return;

        // Show confirmation modal
        setShowModal(true);
        setError(null);
    };

    /**
     * Handle confirmed action
     */
    const handleConfirm = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            // Deduct tokens via API
            const response = await fetch('/api/tokens/deduct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    featureKey,
                    metadata: {
                        feature_name: featureName,
                        timestamp: new Date().toISOString()
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 402) {
                    throw new Error('Insufficient tokens. Please purchase more tokens to continue.');
                }
                throw new Error(data.error || 'Failed to deduct tokens');
            }

            // Refresh balance
            refreshBalance();

            // Execute the actual feature action
            await onConfirm();

            // Close modal on success
            setShowModal(false);
        } catch (error: any) {
            console.error('Token deduction failed:', error);
            setError(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    /**
     * Clone child element and attach click handler
     */
    const triggerElement = cloneElement(children, {
        onClick: (e: React.MouseEvent) => {
            // Call original onClick if exists
            if (children.props.onClick) {
                children.props.onClick(e);
            }
            handleClick(e);
        },
        disabled: disabled || isProcessing,
        className: children.props.className
    });

    return (
        <>
            <div className="relative inline-block">
                {/* Cost Badge (optional) */}
                {showCostBadge && !isUnlimited && (
                    <div className="mb-2">
                        <TokenCostBadge
                            cost={cost}
                            userBalance={balance}
                            showAffordability
                        />
                    </div>
                )}

                {/* Trigger Element */}
                {triggerElement}

                {/* Processing Indicator */}
                {isProcessing && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <TokenConfirmationModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setError(null);
                }}
                onConfirm={handleConfirm}
                action={featureName}
                cost={cost}
                currentBalance={balance}
                description={description}
                isProcessing={isProcessing}
                error={error}
            />
        </>
    );
}
