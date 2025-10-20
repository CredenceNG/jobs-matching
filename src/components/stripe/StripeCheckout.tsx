/**
 * Stripe Checkout Component
 * 
 * React component for Stripe payment processing with Elements.
 * Handles subscription creation and payment confirmation.
 * 
 * @description Stripe Elements integration for premium subscriptions
 */

'use client';

import { useState, useEffect } from 'react';
import {
    useStripe,
    useElements,
    CardElement,
    Elements
} from '@stripe/react-stripe-js';
import { getStripe, formatAmount, getPlanConfig } from '@/lib/stripe/config';

// =============================================================================
// STRIPE CHECKOUT FORM
// =============================================================================

interface StripeCheckoutFormProps {
    priceId: string;
    planType?: 'monthly' | 'annual';
    onSuccess: (subscriptionId: string) => void;
    onError: (error: string) => void;
    userEmail: string;
    userName: string;
}

function StripeCheckoutForm({
    priceId,
    planType = 'monthly',
    onSuccess,
    onError,
    userEmail,
    userName
}: StripeCheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [cardError, setCardError] = useState<string | null>(null);

    const planConfig = getPlanConfig(planType);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setLoading(true);
        setCardError(null);

        const card = elements.getElement(CardElement);
        if (!card) {
            setCardError('Card element not found');
            setLoading(false);
            return;
        }

        try {
            // Create payment method
            const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: card,
                billing_details: {
                    name: userName,
                    email: userEmail,
                },
            });

            if (paymentMethodError) {
                setCardError(paymentMethodError.message || 'Payment method creation failed');
                setLoading(false);
                return;
            }

            // Create subscription on backend
            const response = await fetch('/api/stripe/create-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId,
                    paymentMethodId: paymentMethod.id,
                }),
            });

            const subscriptionData = await response.json();

            if (!response.ok) {
                throw new Error(subscriptionData.error || 'Subscription creation failed');
            }

            const { subscriptionId, clientSecret, status } = subscriptionData;

            if (status === 'requires_payment_method') {
                setCardError('Payment failed. Please try a different payment method.');
                setLoading(false);
                return;
            }

            if (status === 'requires_action' && clientSecret) {
                // Handle 3D Secure authentication
                const { error: confirmError } = await stripe.confirmCardPayment(clientSecret);

                if (confirmError) {
                    setCardError(confirmError.message || '3D Secure authentication failed');
                    setLoading(false);
                    return;
                }
            }

            // Success
            onSuccess(subscriptionId);

        } catch (error) {
            console.error('Payment processing error:', error);
            onError(error instanceof Error ? error.message : 'Payment processing failed');
        } finally {
            setLoading(false);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#374151',
                '::placeholder': {
                    color: '#9CA3AF',
                },
                fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
            },
            invalid: {
                color: '#EF4444',
                iconColor: '#EF4444',
            },
        },
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Header */}
            <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Complete Your Premium Upgrade
                </h3>
                {planConfig && (
                    <div className="text-2xl font-bold text-blue-600">
                        {formatAmount(planConfig.amount)}/month
                    </div>
                )}
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-2">Billing to:</div>
                    <div className="font-medium text-gray-900">{userName}</div>
                    <div className="text-gray-600">{userEmail}</div>
                </div>

                {/* Card Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Information
                    </label>
                    <div className="border border-gray-300 rounded-lg p-4 bg-white">
                        <CardElement
                            options={cardElementOptions}
                            onChange={(event) => {
                                if (event.error) {
                                    setCardError(event.error.message);
                                } else {
                                    setCardError(null);
                                }
                            }}
                        />
                    </div>
                    {cardError && (
                        <p className="mt-2 text-sm text-red-600">{cardError}</p>
                    )}
                </div>

                {/* Security Notice */}
                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-sm text-blue-800">
                            Your payment information is secure and encrypted
                        </span>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!stripe || loading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                            Processing Payment...
                        </div>
                    ) : (
                        planConfig ? `Subscribe for ${formatAmount(planConfig.amount)}/month` : 'Subscribe Now'
                    )}
                </button>

                {/* Terms */}
                <p className="text-xs text-gray-500 text-center">
                    By subscribing, you agree to our Terms of Service and Privacy Policy.
                    You can cancel your subscription at any time.
                </p>
            </form>
        </div>
    );
}

// =============================================================================
// MAIN CHECKOUT COMPONENT
// =============================================================================

interface StripeCheckoutProps {
    priceId: string;
    planType?: 'monthly' | 'annual';
    onSuccess: (subscriptionId: string) => void;
    onError: (error: string) => void;
    onCancel?: () => void;
    userEmail: string;
    userName: string;
}

export default function StripeCheckout({
    priceId,
    planType = 'monthly',
    onSuccess,
    onError,
    onCancel,
    userEmail,
    userName
}: StripeCheckoutProps) {
    const [stripePromise] = useState(() => getStripe());

    return (
        <div className="max-w-md mx-auto">
            {/* Cancel Button */}
            {onCancel && (
                <div className="mb-4">
                    <button
                        onClick={onCancel}
                        className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Plans
                    </button>
                </div>
            )}

            {/* Stripe Elements Provider */}
            <Elements stripe={stripePromise}>
                <StripeCheckoutForm
                    priceId={priceId}
                    planType={planType}
                    onSuccess={onSuccess}
                    onError={onError}
                    userEmail={userEmail}
                    userName={userName}
                />
            </Elements>
        </div>
    );
}

// =============================================================================
// CHECKOUT MODAL WRAPPER
// =============================================================================

interface StripeCheckoutModalProps extends StripeCheckoutProps {
    isOpen: boolean;
    onClose: () => void;
}

export function StripeCheckoutModal({
    isOpen,
    onClose,
    ...checkoutProps
}: StripeCheckoutModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Upgrade to Premium
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                    <StripeCheckout
                        {...checkoutProps}
                        onCancel={onClose}
                        onSuccess={(subscriptionId) => {
                            checkoutProps.onSuccess(subscriptionId);
                            onClose();
                        }}
                    />
                </div>
            </div>
        </div>
    );
}