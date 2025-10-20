/**
 * Admin Analytics Page
 * Detailed analytics and charts
 */

'use client';

import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function AdminAnalyticsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                <p className="mt-2 text-gray-600">
                    Detailed analytics and performance metrics
                </p>
            </div>

            {/* Coming Soon */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <BarChart3 className="h-24 w-24 text-gray-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Advanced Analytics Coming Soon
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto mb-8">
                    We're building powerful analytics features including revenue charts, user growth graphs,
                    feature usage statistics, and much more. Stay tuned!
                </p>

                {/* Preview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                        <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                        <h3 className="font-semibold text-gray-900 mb-2">Revenue Analytics</h3>
                        <p className="text-sm text-gray-600">
                            Track revenue trends, MRR, ARR, and growth metrics
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                        <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="font-semibold text-gray-900 mb-2">User Insights</h3>
                        <p className="text-sm text-gray-600">
                            Analyze user behavior, retention, and engagement
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                        <DollarSign className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                        <h3 className="font-semibold text-gray-900 mb-2">Token Analytics</h3>
                        <p className="text-sm text-gray-600">
                            Monitor token sales, usage patterns, and conversion rates
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
