/**
 * Premium Features Summary
 * 
 * Summary component showing premium vs free plan differences.
 * Used in various parts of the app to highlight premium benefits.
 * 
 * @description Premium plan comparison component
 */

interface PremiumFeaturesSummaryProps {
    compact?: boolean;
    showUpgradeButton?: boolean;
    onUpgrade?: () => void;
}

const features = [
    {
        category: 'AI Job Matching',
        free: 'Full access',
        premium: 'Full access',
        icon: '🎯'
    },
    {
        category: 'Resume Analysis',
        free: 'Full access',
        premium: 'Full access',
        icon: '📄'
    },
    {
        category: 'Cover Letters',
        free: 'Full access',
        premium: 'Full access',
        icon: '✍️'
    },
    {
        category: 'Interview Prep',
        free: 'Full access',
        premium: 'Full access',
        icon: '🎤'
    },
    {
        category: 'Career Insights',
        free: 'Full access',
        premium: 'Full access',
        icon: '📊'
    },
    {
        category: 'Save Job Searches',
        free: '❌ Not available',
        premium: '✅ Save & organize',
        icon: '�'
    },
    {
        category: 'Job Alerts',
        free: '❌ Not available',
        premium: '✅ Email notifications',
        icon: '🔔'
    },
    {
        category: 'Export Results',
        free: '❌ Not available',
        premium: '✅ PDF/CSV export',
        icon: '📤'
    }
];

export default function PremiumFeaturesSummary({
    compact = false,
    showUpgradeButton = true,
    onUpgrade
}: PremiumFeaturesSummaryProps) {
    if (compact) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Upgrade to Premium</h3>
                    <span className="text-2xl font-bold text-blue-600">$29/mo</span>
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        Save job searches & results
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        Email job alerts & notifications
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        Export search results (PDF/CSV)
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        All AI features included
                    </div>
                </div>                {showUpgradeButton && (
                    <button
                        onClick={onUpgrade}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        Upgrade Now
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Free vs Premium Plans
                </h3>
                <p className="text-gray-600 text-sm">
                    Compare features and choose the plan that fits your career goals
                </p>
            </div>

            {/* Feature Comparison */}
            <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                    {/* Header Row */}
                    <div className="grid grid-cols-4 gap-4 pb-4 border-b border-gray-200">
                        <div className="font-semibold text-gray-900">Feature</div>
                        <div className="font-semibold text-gray-900 text-center">Free Plan</div>
                        <div className="font-semibold text-blue-600 text-center">Premium Plan</div>
                        <div className="font-semibold text-gray-900 text-center">Benefit</div>
                    </div>

                    {/* Feature Rows */}
                    {features.map((feature, index) => (
                        <div key={index} className="grid grid-cols-4 gap-4 py-3 border-b border-gray-100 last:border-b-0">
                            <div className="flex items-center">
                                <span className="mr-2 text-lg">{feature.icon}</span>
                                <span className="font-medium text-gray-900">{feature.category}</span>
                            </div>
                            <div className="text-center text-sm text-gray-600">
                                {feature.free}
                            </div>
                            <div className="text-center text-sm font-semibold text-blue-600">
                                {feature.premium}
                            </div>
                            <div className="text-center">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Enhanced
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Additional Benefits */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">What You Get with Premium</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save & organize job searches
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Email job alerts & notifications
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Export results to PDF/CSV
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            All AI features remain free
                        </div>
                    </div>
                </div>

                {/* Pricing & CTA */}
                {showUpgradeButton && (
                    <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                        <div className="mb-4">
                            <span className="text-3xl font-bold text-gray-900">$5</span>
                            <span className="text-gray-600 ml-1">/month</span>
                            <div className="text-sm text-gray-500 mt-1">
                                or $4/month billed annually (save 20%)
                            </div>
                        </div>
                        <button
                            onClick={onUpgrade}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
                        >
                            Upgrade to Premium
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                            Cancel anytime • 30-day money-back guarantee
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}