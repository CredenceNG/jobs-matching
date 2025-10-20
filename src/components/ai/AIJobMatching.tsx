'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hasFeatureAccess } from '@/lib/stripe/config'
import { getCurrentUser } from '@/lib/auth/auth-client'
import { jobSearchService, type JobSearchFilters } from '@/lib/services/job-search'
import { aiJobMatchingService } from '@/lib/services/ai-job-matching'

// Type definitions
interface Job {
    id: string
    title: string
    company: string
    location: string
    type: string
    salary?: string
    description: string
}

interface UserProfile {
    id?: string
    name: string
    email: string
    role: string
    experience: string[]
    location: string
    skills: string[]
    targetRole: string
    education: string[]
    preferences: {
        jobTypes: string[]
        workModes: string[]
        salaryRange: { min: number; max: number }
        industries: string[]
        companySizes: string[]
        benefits: string[]
    }
}

interface JobMatch {
    jobId: string
    matchScore: number
    matchReasons: string[]
    overallFit: string
}

interface SearchCriteria {
    keywords: string
    location: string
    jobType: string[]
    industry: string[]
    remote: boolean
    experienceLevel: 'entry' | 'mid' | 'senior' | 'executive'
    salaryMin?: number
    salaryMax?: number
}

interface SavedSearch {
    id: string
    name: string
    criteria: SearchCriteria
    userId: string
    createdAt: string
    alertsEnabled: boolean
}

interface AIJobMatchingProps {
    userProfile?: UserProfile
    jobs?: Job[]
    onJobSelect?: (job: Job) => void
    maxResults?: number
    minScore?: number
    showSearchInterface?: boolean
}

export function AIJobMatching({
    userProfile,
    jobs,
    onJobSelect,
    maxResults = 10,
    minScore = 0.6,
    showSearchInterface = true,
}: AIJobMatchingProps) {
    // State management
    const [matches, setMatches] = useState<JobMatch[]>([])
    const [fetchedJobs, setFetchedJobs] = useState<Job[]>([])
    const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
        keywords: '',
        location: '',
        jobType: [],
        industry: [],
        remote: false,
        experienceLevel: 'mid',
    })
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [searchName, setSearchName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [expandedJob, setExpandedJob] = useState<string | null>(null)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [isPremium, setIsPremium] = useState(false)

    const router = useRouter()

    // Initialize user data
    useEffect(() => {
        async function loadUser() {
            const user = await getCurrentUser()
            setCurrentUser(user)

            if (user) {
                // For demo purposes, assume user is free tier
                // TODO: In real app, check user.subscription_status from database
                const canSaveJobs = hasFeatureAccess('free', 'saveJobs')
                setIsPremium(canSaveJobs)
            }
        }
        loadUser()
    }, [])

    // Real AI matching using Claude/OpenAI
    const matchJobsWithAI = async (jobList: Job[], profile: UserProfile): Promise<JobMatch[]> => {
        try {
            const matches = await aiJobMatchingService.matchJobs(jobList, profile)
            return matches
                .filter(match => match.matchScore >= minScore)
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, maxResults)
        } catch (error) {
            console.error('AI job matching failed:', error)
            throw new Error('Failed to analyze job matches with AI')
        }
    }

    const performJobMatching = async () => {
        if (!userProfile) {
            setError('Please complete your profile to get job matches')
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Step 1: Fetch jobs based on search criteria
            const searchFilters: JobSearchFilters = {
                keywords: searchCriteria.keywords || userProfile.targetRole,
                location: searchCriteria.location || userProfile.location,
                experienceLevel: searchCriteria.experienceLevel,
                remote: searchCriteria.remote,
                jobType: searchCriteria.jobType
            }

            console.log('Fetching jobs with filters:', searchFilters)
            const jobResults = await jobSearchService.searchJobs(searchFilters)

            if (jobResults.jobs.length === 0) {
                setError('No jobs found matching your criteria. Try adjusting your search filters.')
                setMatches([])
                setFetchedJobs([])
                return
            }

            console.log(`Found ${jobResults.jobs.length} jobs, analyzing matches...`)
            setFetchedJobs(jobResults.jobs)

            // Step 2: Use AI to match jobs with user profile
            const aiMatches = await matchJobsWithAI(jobResults.jobs, userProfile)
            setMatches(aiMatches)

            if (aiMatches.length === 0) {
                setError('No good matches found. Try expanding your search criteria or updating your profile.')
            }
        } catch (err) {
            console.error('Job matching error:', err)
            setError(err instanceof Error ? err.message : 'Failed to match jobs')
        } finally {
            setLoading(false)
        }
    }

    const handleSaveSearch = async () => {
        if (!currentUser || !isPremium) {
            router.push('/pricing?feature=saveJobs')
            return
        }

        const savedSearch: SavedSearch = {
            id: Date.now().toString(),
            name: searchName,
            criteria: searchCriteria,
            userId: currentUser.id,
            createdAt: new Date().toISOString(),
            alertsEnabled: false,
        }

        setSavedSearches([...savedSearches, savedSearch])
        setShowSaveModal(false)
        setSearchName('')

        // TODO: Save to database
        console.log('Saved search:', savedSearch)
    }

    const updateSearchCriteria = (field: keyof SearchCriteria, value: any) => {
        setSearchCriteria(prev => ({ ...prev, [field]: value }))
    }

    // Auto-match on data load
    useEffect(() => {
        if (jobs && userProfile && jobs.length > 0) {
            performJobMatching()
        }
    }, [jobs, userProfile])

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">AI Job Matching</h2>
                    <p className="text-gray-600">Find your perfect job match with AI-powered recommendations</p>
                </div>
            </div>

            {/* Search Criteria Interface */}
            {showSearchInterface && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Search Criteria</h3>
                        {isPremium && (
                            <button
                                onClick={() => setShowSaveModal(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Save Search
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Keywords
                            </label>
                            <input
                                type="text"
                                value={searchCriteria.keywords}
                                onChange={(e) => updateSearchCriteria('keywords', e.target.value)}
                                placeholder="e.g., React, Product Manager"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location
                            </label>
                            <input
                                type="text"
                                value={searchCriteria.location}
                                onChange={(e) => updateSearchCriteria('location', e.target.value)}
                                placeholder="e.g., San Francisco, Remote"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Experience Level
                            </label>
                            <select
                                value={searchCriteria.experienceLevel}
                                onChange={(e) => updateSearchCriteria('experienceLevel', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="entry">Entry Level</option>
                                <option value="mid">Mid Level</option>
                                <option value="senior">Senior Level</option>
                                <option value="executive">Executive</option>
                            </select>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="remote"
                                checked={searchCriteria.remote}
                                onChange={(e) => updateSearchCriteria('remote', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="remote" className="ml-2 block text-sm text-gray-700">
                                Remote work only
                            </label>
                        </div>
                    </div>

                    <button
                        onClick={performJobMatching}
                        disabled={loading}
                        className="w-full md:w-auto px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Matching...' : 'Find Matches'}
                    </button>
                </div>
            )}

            {/* Premium upgrade prompt for non-premium users */}
            {!isPremium && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-blue-800">Unlock Premium Features</h3>
                            <p className="text-blue-600">Save your searches and get job alerts for $5/month</p>
                        </div>
                        <button
                            onClick={() => router.push('/pricing?feature=saveJobs')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Upgrade Now
                        </button>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">
                        {fetchedJobs.length === 0
                            ? 'Searching for jobs...'
                            : `Our AI is evaluating ${fetchedJobs.length} jobs against your profile...`
                        }
                    </p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <div className="text-red-600 mr-3">⚠️</div>
                        <div>
                            <h3 className="text-red-800 font-semibold">Matching Error</h3>
                            <p className="text-red-600">{error}</p>
                        </div>
                    </div>
                    <button
                        onClick={performJobMatching}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* No Profile Warning */}
            {!userProfile && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <div className="text-yellow-600 mr-3">ℹ️</div>
                        <div>
                            <h3 className="text-yellow-800 font-semibold">Profile Required</h3>
                            <p className="text-yellow-700">Complete your profile to get AI-powered job recommendations</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/profile')}
                        className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                    >
                        Complete Profile
                    </button>
                </div>
            )}

            {/* Job Matches */}
            {matches.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                        AI Recommendations ({matches.length} matches)
                    </h3>

                    {matches.map((match) => {
                        const job = fetchedJobs.find(j => j.id === match.jobId)
                        if (!job) return null

                        return (
                            <div key={match.jobId} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="text-lg font-semibold text-gray-900">{job.title}</h4>
                                        <p className="text-gray-600">{job.company}</p>
                                        <p className="text-sm text-gray-500">{job.location}</p>
                                        {job.salary && (
                                            <p className="text-sm text-green-600 font-medium">{job.salary}</p>
                                        )}
                                    </div>
                                    <div className="ml-4 text-right">
                                        <div className="flex items-center mb-2">
                                            <div className={`w-3 h-3 rounded-full mr-2 ${match.matchScore > 0.8 ? 'bg-green-500' :
                                                match.matchScore > 0.7 ? 'bg-yellow-500' : 'bg-orange-500'
                                                }`}></div>
                                            <span className="text-lg font-bold text-gray-900">
                                                {(match.matchScore * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600">{match.overallFit} Match</div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <button
                                        onClick={() => setExpandedJob(expandedJob === match.jobId ? null : match.jobId)}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                    >
                                        {expandedJob === match.jobId ? 'Hide Details' : 'Show Match Details'}
                                    </button>
                                </div>

                                {expandedJob === match.jobId && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                        <h5 className="font-semibold mb-2">Why this is a good match:</h5>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                            {match.matchReasons.map((reason, index) => (
                                                <li key={index}>{reason}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="mt-4 flex space-x-3">
                                    <button
                                        onClick={() => onJobSelect?.(job)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        View Job
                                    </button>
                                    {isPremium && (
                                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                                            Save Job
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Save Search Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">Save Search</h3>
                        <input
                            type="text"
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            placeholder="Enter search name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                        />
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSearch}
                                disabled={!searchName.trim()}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}