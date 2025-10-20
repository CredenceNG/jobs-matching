/**
 * Token Confirmation Modal
 *
 * Shows before deducting tokens for an AI action
 * Clear cost display and balance preview
 */

'use client';

import { Sparkles, AlertCircle, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';

interface TokenConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    action: string;
    cost: number;
    currentBalance: number;
    description?: string;
    isProcessing?: boolean;
    error?: string | null;
}

export default function TokenConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    action,
    cost,
    currentBalance,
    description,
    isProcessing = false,
    error = null
}: TokenConfirmationModalProps) {
    if (!isOpen) return null;

    const newBalance = currentBalance - cost;
    const canAfford = currentBalance >= cost;
    const isLow = newBalance > 0 && newBalance < 20;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Header */}
                <div className="mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
                        <Sparkles className="h-7 w-7 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {action}
                    </h3>
                    {description && (
                        <p className="text-gray-600 text-sm">
                            {description}
                        </p>
                    )}
                </div>

                {canAfford ? (
                    <>
                        {/* Cost Breakdown */}
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-4 border border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-gray-700">Token Cost</span>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-blue-600" />
                                    <span className="text-lg font-bold text-gray-900">
                                        {cost} tokens
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm border-t border-blue-200 pt-3">
                                <span className="text-gray-600">Current Balance</span>
                                <span className="font-semibold text-gray-900">
                                    {currentBalance} tokens
                                </span>
                            </div>

                            <div className="flex items-center justify-center my-2">
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                            </div>

                            <div className="flex items-center justify-between text-sm border-t border-blue-200 pt-3">
                                <span className="text-gray-600">After This Action</span>
                                <span className={`font-bold ${
                                    isLow ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                    {newBalance} tokens
                                </span>
                            </div>
                        </div>

                        {/* Low Balance Warning */}
                        {isLow && !error && (
                            <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-semibold text-yellow-900 mb-1">
                                        Low Balance Warning
                                    </p>
                                    <p className="text-yellow-700">
                                        You'll have {newBalance} tokens left. Consider buying more tokens soon.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200 mb-4">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-semibold text-red-900 mb-1">
                                        Error
                                    </p>
                                    <p className="text-red-700">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                        Processing...
                                    </>
                                ) : (
                                    'Confirm'
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Insufficient Tokens */}
                        <div className="bg-red-50 rounded-xl p-4 mb-4 border border-red-200">
                            <div className="flex items-start gap-3 mb-4">
                                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-red-900 mb-1">
                                        Insufficient Tokens
                                    </p>
                                    <p className="text-sm text-red-700">
                                        You need <strong>{cost} tokens</strong> but only have <strong>{currentBalance} tokens</strong>.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-3 border border-red-100">
                                <p className="text-sm text-gray-700 mb-2">
                                    Tokens needed: <span className="font-bold text-red-600">{cost - currentBalance} more</span>
                                </p>
                                <p className="text-xs text-gray-600">
                                    Recommended: Buy {cost - currentBalance < 100 ? 'Starter' : 'Basic'} package
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <Link
                                href="/tokens/buy"
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all text-center"
                            >
                                Buy Tokens
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
