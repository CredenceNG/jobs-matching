'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'

// Helper function to strip HTML tags and clean text
function stripHtml(html: string): string {
    if (!html) return ''

    // Remove script and style elements completely
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

    // Remove all HTML tags (including those with attributes)
    text = text.replace(/<[^>]+>/g, ' ')

    // Decode HTML entities
    text = text
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&apos;/gi, "'")
        .replace(/&ndash;/gi, '–')
        .replace(/&mdash;/gi, '—')
        .replace(/&rsquo;/gi, "'")
        .replace(/&lsquo;/gi, "'")
        .replace(/&rdquo;/gi, '"')
        .replace(/&ldquo;/gi, '"')

    // Remove multiple spaces, tabs, and newlines
    text = text.replace(/[\s\n\r\t]+/g, ' ').trim()

    return text
}

interface JobMatch {
    id: string
    title: string
    company: string
    location: string
    type: string
    salary?: string
    description: string
    url?: string
    matchScore: number
    matchReasons?: string[]
    strengths?: string[]
    concerns?: string[]
    bridgeGaps?: string[]
    recommendation?: string
    reasoning?: string
    source?: string
    breakdown?: {
        skillsMatch: number
        experienceMatch: number
        roleAlignment: number
        industryFit: number
        careerGrowth: number
    }
}

export default function JobDetailPage() {
    const router = useRouter()
    const params = useParams()
    const [job, setJob] = useState<JobMatch | null>(null)
    const [analysis, setAnalysis] = useState<any>(null)
    const [showPremiumModal, setShowPremiumModal] = useState(false)
    const [hasAccess, setHasAccess] = useState(false)
    const [isCheckingAccess, setIsCheckingAccess] = useState(true)

    useEffect(() => {
        // Load job data from sessionStorage
        const jobData = sessionStorage.getItem('currentJob')
        const analysisData = sessionStorage.getItem('resumeAnalysis')

        if (jobData) {
            setJob(JSON.parse(jobData))
        }
        if (analysisData) {
            setAnalysis(JSON.parse(analysisData))
        }

        // Check if user has tokens or subscription
        const checkAccess = async () => {
            try {
                const response = await fetch('/api/tokens/balance')
                if (response.ok) {
                    const data = await response.json()
                    // User has access if they have unlimited (subscription) or tokens > 0
                    setHasAccess(data.unlimited || data.balance > 0)
                }
            } catch (error) {
                console.error('Error checking access:', error)
            } finally {
                setIsCheckingAccess(false)
            }
        }

        checkAccess()
    }, [])

    if (!job) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading job details...</p>
                </div>
            </div>
        )
    }

    const handleCoverLetter = () => {
        if (hasAccess) {
            // User has tokens or subscription - redirect to cover letter page
            router.push('/cover-letter')
        } else {
            // Show premium modal
            setShowPremiumModal(true)
        }
    }

    const handleAIResume = () => {
        if (hasAccess) {
            // User has tokens or subscription - redirect to resume page
            router.push('/resume')
        } else {
            // Show premium modal
            setShowPremiumModal(true)
        }
    }

    const handleSaveJob = () => {
        if (hasAccess) {
            // User has tokens or subscription - save the job
            // TODO: Implement save job functionality
            alert('Job saved successfully!')
        } else {
            // Show premium modal
            setShowPremiumModal(true)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            JobAI
                        </Link>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.back()}
                                className="text-sm text-gray-700 hover:text-blue-600 transition-colors font-medium flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Results
                            </button>
                            <Link
                                href="/pricing"
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all"
                            >
                                Go Premium
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-24 pb-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-200">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex-1">
                                <h1 className="text-4xl font-bold text-gray-900 mb-4">{job.title}</h1>
                                <div className="space-y-2">
                                    <p className="text-xl text-gray-700 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        {job.company}
                                    </p>
                                    <p className="text-gray-600 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {job.location}
                                    </p>
                                    {job.salary && (
                                        <p className="text-gray-600 flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {job.salary}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-bold mb-2 ${
                                    Math.round(job.matchScore) >= 80 ? 'bg-green-100 text-green-800' :
                                    Math.round(job.matchScore) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                    Math.round(job.matchScore) >= 40 ? 'bg-orange-100 text-orange-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {Math.round(job.matchScore)}% Match
                                </div>
                                {job.source && (
                                    <p className="text-sm text-gray-500">Source: {job.source}</p>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            {job.url && (
                                <a
                                    href={job.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 min-w-[200px] px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all text-center flex items-center justify-center gap-2"
                                >
                                    Apply Now
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                            <button
                                onClick={handleCoverLetter}
                                className="flex-1 min-w-[200px] px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 font-bold rounded-xl hover:bg-purple-50 hover:scale-105 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                ✨ Draft Cover Letter
                                {!hasAccess && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">AI</span>}
                            </button>
                            <button
                                onClick={handleAIResume}
                                className="flex-1 min-w-[200px] px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 hover:scale-105 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                ✨ Tailor Resume
                                {!hasAccess && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">AI</span>}
                            </button>
                            <button
                                onClick={handleSaveJob}
                                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-400 hover:scale-105 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                                Save Job
                                {!hasAccess && <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-bold rounded-full">PRO</span>}
                            </button>
                        </div>
                    </div>

                    {/* AI Recommendation */}
                    {job.recommendation && (
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6 mb-8 border-2 border-blue-200">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">🤖 AI Recommendation: {job.recommendation}</h2>
                                    {job.reasoning && (
                                        <p className="text-gray-700 leading-relaxed">{job.reasoning}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Match Breakdown */}
                    {job.breakdown && (
                        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Detailed Match Analysis</h2>
                            <div className="space-y-4">
                                {Object.entries(job.breakdown).map(([key, value]) => {
                                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                                    const percentage = Math.round(value as number)
                                    return (
                                        <div key={key}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-semibold text-gray-700">{label}</span>
                                                <span className={`font-bold ${
                                                    percentage >= 80 ? 'text-green-600' :
                                                    percentage >= 60 ? 'text-yellow-600' :
                                                    percentage >= 40 ? 'text-orange-600' :
                                                    'text-gray-600'
                                                }`}>{percentage}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                    className={`h-3 rounded-full transition-all ${
                                                        percentage >= 80 ? 'bg-green-500' :
                                                        percentage >= 60 ? 'bg-yellow-500' :
                                                        percentage >= 40 ? 'bg-orange-500' :
                                                        'bg-gray-400'
                                                    }`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        {/* Strengths */}
                        {job.strengths && job.strengths.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    ✨ Why This Matches
                                </h2>
                                <ul className="space-y-3">
                                    {job.strengths.map((strength, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-gray-700">{strength}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Concerns */}
                        {job.concerns && job.concerns.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    ⚠️ Potential Gaps
                                </h2>
                                <ul className="space-y-3">
                                    {job.concerns.map((concern, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <span className="text-gray-700">{concern}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Steps to Bridge Gaps - AI Generated */}
                                {job.bridgeGaps && job.bridgeGaps.length > 0 && (
                                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            🎯 Steps to Bridge Gaps:
                                        </h3>
                                        <ul className="space-y-2 text-sm text-blue-800">
                                            {job.bridgeGaps.map((step, index) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <span className="font-bold">{index + 1}.</span>
                                                    <span>{step}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Job Description */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">📝 Full Job Description</h2>
                        <div className="prose max-w-none text-gray-700 leading-relaxed">
                            {stripHtml(job.description)}
                        </div>
                    </div>
                </div>
            </main>

            {/* Premium Modal */}
            {showPremiumModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Feature</h3>
                            <p className="text-gray-600">Upgrade to Premium to unlock AI cover letters, save jobs, and more!</p>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-700">Unlimited AI-generated cover letters</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-700">AI-optimized resumes tailored to jobs</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-700">Save unlimited jobs to your profile</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-700">Interview preparation & practice</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-700">Priority support</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowPremiumModal(false)}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
                            >
                                Maybe Later
                            </button>
                            <Link
                                href="/pricing"
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all text-center"
                            >
                                Upgrade Now
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
