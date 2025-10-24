'use client'

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [tokenBalance, setTokenBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            try {
                const response = await fetch('/api/tokens/balance');
                if (response.ok) {
                    const data = await response.json();
                    setIsAuthenticated(true);
                    setTokenBalance(data.balance || 0);
                }
            } catch (error) {
                // User not authenticated
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        }

        checkAuth();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            JobAI
                        </span>
                        <div className="flex items-center gap-3">
                            {!loading && (
                                <>
                                    {isAuthenticated ? (
                                        <>
                                            {/* Token Balance */}
                                            <Link
                                                href="/tokens/buy"
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 hover:shadow-md transition-all"
                                            >
                                                <Sparkles className="h-4 w-4 text-blue-600" />
                                                <div className="flex items-baseline gap-1">
                                                    <span className="font-bold text-gray-900">{tokenBalance}</span>
                                                    <span className="text-xs text-gray-600">tokens</span>
                                                </div>
                                            </Link>
                                            {/* Dashboard Link */}
                                            <Link
                                                href="/dashboard"
                                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all"
                                            >
                                                Dashboard
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <a
                                                href="/resume-jobs-v2"
                                                className="text-sm text-gray-700 hover:text-blue-600 transition-colors font-medium"
                                            >
                                                Try Free
                                            </a>
                                            <a
                                                href="/pricing"
                                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all"
                                            >
                                                Go Premium
                                            </a>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Hero */}
                    <div className="text-center max-w-4xl mx-auto mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-sm text-blue-700 font-medium mb-6 border border-blue-100">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            Powered by Claude AI
                        </div>

                        <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
                            Find Jobs That
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Actually Fit</span>
                        </h1>

                        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            AI-powered job matching that understands your skills, experience, and career goals. No signup required to start.
                        </p>

                        {/* Version Selector */}
                        <div className="max-w-4xl mx-auto mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Choose Your Job Search Method</h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* V2 - Original */}
                                <a href="/resume-jobs-v2" className="group p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold text-blue-600">V2: Original</span>
                                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">Stable</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Classic Search</h3>
                                    <p className="text-sm text-gray-600 mb-3">Basic AI matching with established APIs</p>
                                    <div className="text-xs text-gray-500">⚡ Fast (2-5s)</div>
                                </a>

                                {/* V3 - API Based */}
                                <a href="/resume-jobs-v3" className="group p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-300 hover:border-blue-500 hover:shadow-xl transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold text-blue-700">V3: API-Based</span>
                                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Recommended</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Smart API Search</h3>
                                    <p className="text-sm text-gray-600 mb-3">Multi-API (Adzuna, RemoteOK) with AI ranking</p>
                                    <div className="text-xs text-gray-500">🌍 Global • ⚡ Fast (under 5s)</div>
                                </a>

                                {/* V4 - Web Scraping - Disabled in production for now */}
                                <div className="group p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-300 opacity-75 cursor-not-allowed">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold text-gray-600">V4: Web Scraping</span>
                                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">Beta</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-700 mb-2">Comprehensive Scrape</h3>
                                    <p className="text-sm text-gray-600 mb-3">Real-time scraping (requires additional setup)</p>
                                    <div className="text-xs text-gray-500">🔧 Coming Soon</div>
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-gray-500">
                            Free forever • No credit card required • Instant results
                        </p>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid md:grid-cols-3 gap-6 mb-20">
                        {/* Free Feature */}
                        <div className="group relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                Smart Job Search
                            </h3>
                            <p className="text-gray-600 mb-6">
                                AI analyzes thousands of jobs to find your perfect matches with detailed compatibility scores.
                            </p>
                            <a
                                href="/resume-jobs-v2"
                                className="inline-flex items-center text-blue-600 font-semibold hover:gap-2 transition-all"
                            >
                                Try Now
                                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </a>
                        </div>

                        {/* Resume Analysis */}
                        <div className="group relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                Resume Analysis
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Upload your resume and let AI extract skills, experience, and match you with relevant opportunities.
                            </p>
                            <a
                                href="/resume-jobs-v2"
                                className="inline-flex items-center text-purple-600 font-semibold hover:gap-2 transition-all"
                            >
                                Upload Resume
                                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </a>
                        </div>

                        {/* Premium Teaser */}
                        <div className="group relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white hover:shadow-2xl hover:scale-105 transition-all">
                            <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                                Premium
                            </div>
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">
                                Save & Track Everything
                            </h3>
                            <p className="text-blue-50 mb-6">
                                Save searches, get job alerts, track applications, and unlock unlimited AI features.
                            </p>
                            <a
                                href="/pricing"
                                className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-lg transition-all"
                            >
                                View Plans
                                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* How It Works */}
                    <div className="bg-white rounded-3xl p-12 border border-gray-200 mb-20">
                        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                            How It Works
                        </h2>
                        <div className="grid md:grid-cols-3 gap-12">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-blue-600">1</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Share Your Profile</h3>
                                <p className="text-gray-600">Tell us about your skills, experience, and career goals in minutes</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-purple-600">2</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Analyzes Jobs</h3>
                                <p className="text-gray-600">Claude AI compares your profile against real job postings</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-green-600">3</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Get Perfect Matches</h3>
                                <p className="text-gray-600">Receive personalized job matches with compatibility scores</p>
                            </div>
                        </div>
                    </div>

                    {/* Premium CTA */}
                    <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-3xl p-12 text-center text-white overflow-hidden">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
                        <div className="relative">
                            <h2 className="text-4xl font-bold mb-4">
                                Unlock Premium Features
                            </h2>
                            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                                Save your searches, get instant job alerts, and access unlimited AI-powered career tools for just <span className="font-bold text-white">$20/month</span>
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a
                                    href="/pricing"
                                    className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all"
                                >
                                    View Pricing Plans
                                </a>
                                <a
                                    href="/resume-jobs-v2"
                                    className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all"
                                >
                                    Try Free First
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
