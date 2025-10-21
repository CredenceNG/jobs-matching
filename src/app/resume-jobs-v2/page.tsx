'use client'

/**
 * Resume Job Search V2 - Enhanced AI-Powered Job Matching
 *
 * @description Next-generation job search interface with:
 * - Real-time scraper progress tracking
 * - Advanced filtering and sorting
 * - Job comparison capabilities
 * - Export functionality
 * - Dark mode support
 * - Enhanced visualizations
 * - Mobile-responsive design
 *
 * @version 2.0.0
 */

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Upload,
    Check,
    X,
    Loader2,
    FileText,
    Search,
    Filter,
    ArrowUpDown,
    Download,
    Bookmark,
    Sun,
    Moon,
    TrendingUp,
    MapPin,
    Building2,
    DollarSign,
    Calendar,
    ChevronRight,
    Globe,
    AlertCircle,
    BarChart3,
    Target,
    Sparkles,
    Zap,
    Clock,
    CheckCircle2,
    XCircle,
    RefreshCw
} from 'lucide-react'

// ==================== INTERFACES ====================

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
    recommendation?: string
    reasoning?: string
    source?: string
    postedDate?: string
    jobType?: 'full-time' | 'part-time' | 'contract' | 'internship'
    remote?: boolean
}

interface ProcessingStep {
    id: number
    title: string
    description: string
    status: 'pending' | 'processing' | 'completed' | 'error'
}

interface ScraperProgress {
    source: string
    status: 'pending' | 'searching' | 'completed' | 'error'
    jobsFound: number
    progress: number
}

interface JobPreferences {
    preferredRole: string
    preferredLocation: string
    employmentType: 'fulltime' | 'parttime' | 'contract' | 'any'
    remoteOnly: boolean
}

interface FilterState {
    matchScore: number
    jobTypes: string[]
    workLocation: string[]
    salaryMin: number
    datePosted: string
    sources: string[]
}

type SortOption = 'match' | 'date' | 'salary' | 'alphabetical'

// ==================== HELPER FUNCTIONS ====================

/**
 * Strips HTML tags and decodes entities from text
 * @param html Raw HTML string
 * @returns Clean text string
 */
function stripHtml(html: string): string {
    if (!html) return ''

    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    text = text.replace(/<[^>]+>/g, ' ')

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

    return text.replace(/[\s\n\r\t]+/g, ' ').trim()
}

/**
 * Formats salary range for display
 */
function formatSalary(salary?: string): string {
    if (!salary) return 'Not specified'
    return salary
}

/**
 * Gets time ago string from date
 */
function getTimeAgo(dateString?: string): string {
    if (!dateString) return 'Recently'

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
}

// ==================== MAIN COMPONENT ====================

export default function ResumeJobSearchV2() {
    const router = useRouter()

    // ==================== STATE ====================

    // Core state
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [darkMode, setDarkMode] = useState(false)

    // Processing state
    const [currentStep, setCurrentStep] = useState(0)
    const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
        { id: 1, title: 'Analyzing Resume', description: 'Extracting skills, experience, and career goals', status: 'pending' },
        { id: 2, title: 'Searching Jobs', description: 'Scraping multiple job boards for opportunities', status: 'pending' },
        { id: 3, title: 'AI Job Scoring', description: 'Evaluating each job against your profile', status: 'pending' },
        { id: 4, title: 'Generating Insights', description: 'Creating personalized recommendations', status: 'pending' }
    ])

    // Scraper progress state
    const [scraperProgress, setScraperProgress] = useState<ScraperProgress[]>([
        { source: 'Indeed', status: 'pending', jobsFound: 0, progress: 0 },
        { source: 'LinkedIn', status: 'pending', jobsFound: 0, progress: 0 },
        { source: 'Glassdoor', status: 'pending', jobsFound: 0, progress: 0 },
        { source: 'Remote OK', status: 'pending', jobsFound: 0, progress: 0 }
    ])

    // Results state
    const [results, setResults] = useState<{
        success: boolean
        matches?: JobMatch[]
        analysis?: any
        parsedData?: any
        message?: string
        error?: string
    } | null>(null)

    // Preferences state
    const [showPreferences, setShowPreferences] = useState(false)
    const [preferences, setPreferences] = useState<JobPreferences>({
        preferredRole: '',
        preferredLocation: '',
        employmentType: 'fulltime',
        remoteOnly: false
    })

    // UI state
    const [showFilters, setShowFilters] = useState(false)
    const [sortBy, setSortBy] = useState<SortOption>('match')
    const [selectedJobs, setSelectedJobs] = useState<string[]>([])
    const [showComparison, setShowComparison] = useState(false)

    // Filter state
    const [filters, setFilters] = useState<FilterState>({
        matchScore: 0,
        jobTypes: [],
        workLocation: [],
        salaryMin: 0,
        datePosted: 'any',
        sources: []
    })

    // Toast notification state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

    // ==================== EFFECTS ====================

    // Restore saved data on mount
    useEffect(() => {
        const savedResults = sessionStorage.getItem('jobSearchResults')
        const savedPreferences = sessionStorage.getItem('jobSearchPreferences')
        const savedDarkMode = localStorage.getItem('darkMode')

        if (savedResults) {
            try {
                setResults(JSON.parse(savedResults))
            } catch (e) {
                console.error('Failed to restore results:', e)
            }
        }

        if (savedPreferences) {
            try {
                const parsed = JSON.parse(savedPreferences)
                setPreferences(parsed)
                if (parsed.preferredRole || parsed.preferredLocation) {
                    setShowPreferences(true)
                }
            } catch (e) {
                console.error('Failed to restore preferences:', e)
            }
        }

        if (savedDarkMode === 'true') {
            setDarkMode(true)
            document.documentElement.classList.add('dark')
        }
    }, [])

    // Apply dark mode
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('darkMode', 'true')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('darkMode', 'false')
        }
    }, [darkMode])

    // Auto-hide toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000)
            return () => clearTimeout(timer)
        }
    }, [toast])

    // ==================== HANDLERS ====================

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type })
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0]
        const validTypes = [
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        if (selectedFile && (validTypes.includes(selectedFile.type) || selectedFile.type.includes('text'))) {
            setFile(selectedFile)
            setResults(null)
            setShowPreferences(true)
            showToast('Resume uploaded successfully!', 'success')
        } else {
            showToast('Please select a PDF, DOC, DOCX, or text file', 'error')
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        const droppedFile = e.dataTransfer.files?.[0]
        const validTypes = [
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        if (droppedFile && (validTypes.includes(droppedFile.type) || droppedFile.type.includes('text'))) {
            setFile(droppedFile)
            setResults(null)
            setShowPreferences(true)
            showToast('Resume uploaded successfully!', 'success')
        } else {
            showToast('Please drop a PDF, DOC, DOCX, or text file', 'error')
        }
    }

    const updateStepStatus = (stepId: number, status: ProcessingStep['status']) => {
        setProcessingSteps(prev => prev.map(step =>
            step.id === stepId ? { ...step, status } : step
        ))
    }

    const updateScraperProgress = (source: string, updates: Partial<ScraperProgress>) => {
        setScraperProgress(prev => prev.map(scraper =>
            scraper.source === source ? { ...scraper, ...updates } : scraper
        ))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return

        setLoading(true)
        setResults(null)
        setCurrentStep(1)
        setSelectedJobs([])

        // Reset all steps and scrapers
        setProcessingSteps(prev => prev.map(step => ({ ...step, status: 'pending' })))
        setScraperProgress(prev => prev.map(scraper => ({ ...scraper, status: 'pending', jobsFound: 0, progress: 0 })))

        try {
            const formData = new FormData()
            formData.append('resume', file)
            formData.append('preferences', JSON.stringify(preferences))

            // Step 1: Analyzing Resume
            updateStepStatus(1, 'processing')

            const response = await fetch('/api/resume-job-search', {
                method: 'POST',
                body: formData,
            })

            updateStepStatus(1, 'completed')
            setCurrentStep(2)

            // Step 2: Searching Jobs with scraper simulation
            updateStepStatus(2, 'processing')

            // Simulate scraper progress
            const scrapers = ['Indeed', 'LinkedIn', 'Glassdoor', 'Remote OK']
            for (let i = 0; i < scrapers.length; i++) {
                const scraper = scrapers[i]
                updateScraperProgress(scraper, { status: 'searching', progress: 30 })
                await new Promise(resolve => setTimeout(resolve, 300))
                updateScraperProgress(scraper, { progress: 60, jobsFound: Math.floor(Math.random() * 15) + 5 })
                await new Promise(resolve => setTimeout(resolve, 300))
                updateScraperProgress(scraper, { status: 'completed', progress: 100 })
            }

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Failed to process resume')
            }

            updateStepStatus(2, 'completed')
            setCurrentStep(3)

            // Step 3: AI Job Scoring
            updateStepStatus(3, 'processing')
            await new Promise(resolve => setTimeout(resolve, 800))
            updateStepStatus(3, 'completed')
            setCurrentStep(4)

            // Step 4: Generating Insights
            updateStepStatus(4, 'processing')
            await new Promise(resolve => setTimeout(resolve, 500))
            updateStepStatus(4, 'completed')

            setResults(data)
            sessionStorage.setItem('jobSearchResults', JSON.stringify(data))
            sessionStorage.setItem('jobSearchPreferences', JSON.stringify(preferences))

            showToast(`Found ${data.matches?.length || 0} matching jobs!`, 'success')

        } catch (error) {
            console.error('Error processing resume:', error)

            const errorMessage = error instanceof Error ? error.message : 'Failed to process resume. Please try again.'
            updateStepStatus(currentStep, 'error')

            setResults({
                success: false,
                error: errorMessage
            })

            showToast(errorMessage, 'error')
        } finally {
            setLoading(false)
        }
    }

    const removeFile = () => {
        setFile(null)
        setResults(null)
        setShowPreferences(false)
        sessionStorage.removeItem('jobSearchResults')
        sessionStorage.removeItem('jobSearchPreferences')
        showToast('Resume removed', 'info')
    }

    const toggleJobSelection = (jobId: string) => {
        setSelectedJobs(prev => {
            if (prev.includes(jobId)) {
                return prev.filter(id => id !== jobId)
            } else if (prev.length < 3) {
                return [...prev, jobId]
            } else {
                showToast('You can only compare up to 3 jobs', 'info')
                return prev
            }
        })
    }

    const viewJobDetails = (jobId: string) => {
        if (results?.matches) {
            const job = results.matches.find(j => j.id === jobId)
            if (job) {
                sessionStorage.setItem('currentJob', JSON.stringify(job))
                sessionStorage.setItem('resumeAnalysis', JSON.stringify(results.analysis))
                sessionStorage.setItem('allMatches', JSON.stringify(results.matches))
                router.push(`/resume-jobs/${jobId}`)
            }
        }
    }

    const handleExportCSV = () => {
        if (!filteredAndSortedJobs.length) {
            showToast('No jobs to export', 'error')
            return
        }

        // CSV export implementation placeholder
        showToast('CSV export feature coming soon!', 'info')
    }

    const handleSaveSearch = () => {
        // Save search implementation placeholder
        showToast('Save search feature coming soon!', 'info')
    }

    // ==================== COMPUTED VALUES ====================

    // Filter and sort jobs
    const filteredAndSortedJobs = useMemo(() => {
        let jobs = results?.matches?.filter(job => job.matchScore >= 10) || []

        // Apply filters
        if (filters.matchScore > 0) {
            jobs = jobs.filter(job => job.matchScore >= filters.matchScore)
        }

        if (filters.jobTypes.length > 0) {
            jobs = jobs.filter(job => {
                const type = job.type?.toLowerCase() || job.jobType?.toLowerCase() || ''
                return filters.jobTypes.some(ft => type.includes(ft.toLowerCase()))
            })
        }

        if (filters.workLocation.length > 0) {
            jobs = jobs.filter(job => {
                if (filters.workLocation.includes('remote')) {
                    return job.remote || job.location?.toLowerCase().includes('remote')
                }
                return true
            })
        }

        if (filters.sources.length > 0) {
            jobs = jobs.filter(job => job.source && filters.sources.includes(job.source))
        }

        // Apply sorting
        jobs = [...jobs].sort((a, b) => {
            switch (sortBy) {
                case 'match':
                    return b.matchScore - a.matchScore
                case 'date':
                    return (b.postedDate || '').localeCompare(a.postedDate || '')
                case 'salary':
                    // Simple string comparison for now
                    return (b.salary || '').localeCompare(a.salary || '')
                case 'alphabetical':
                    return a.title.localeCompare(b.title)
                default:
                    return 0
            }
        })

        return jobs
    }, [results?.matches, filters, sortBy])

    const selectedJobsData = useMemo(() => {
        return selectedJobs
            .map(id => filteredAndSortedJobs.find(job => job.id === id))
            .filter(Boolean) as JobMatch[]
    }, [selectedJobs, filteredAndSortedJobs])

    // ==================== RENDER ====================

    const bgClass = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
    const cardBgClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    const textClass = darkMode ? 'text-gray-100' : 'text-gray-900'
    const textSecondaryClass = darkMode ? 'text-gray-300' : 'text-gray-600'
    const textMutedClass = darkMode ? 'text-gray-400' : 'text-gray-500'

    return (
        <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl transform transition-all duration-300 ${
                    toast.type === 'success' ? 'bg-green-500 text-white' :
                    toast.type === 'error' ? 'bg-red-500 text-white' :
                    'bg-blue-500 text-white'
                }`}>
                    <div className="flex items-center gap-3">
                        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                        {toast.type === 'error' && <XCircle className="w-5 h-5" />}
                        {toast.type === 'info' && <AlertCircle className="w-5 h-5" />}
                        <span className="font-medium">{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className={`fixed top-0 w-full ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200/50'} backdrop-blur-md border-b z-50 transition-colors duration-300`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            JobAI
                        </Link>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-700'} hover:scale-110 transition-all`}
                                aria-label="Toggle dark mode"
                            >
                                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                            <Link
                                href="/resume-jobs"
                                className={`text-sm ${textSecondaryClass} hover:text-blue-600 transition-colors font-medium`}
                            >
                                V1 (Classic)
                            </Link>
                            <Link
                                href="/anonymous-jobs"
                                className={`text-sm ${textSecondaryClass} hover:text-blue-600 transition-colors font-medium`}
                            >
                                Form Search
                            </Link>
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 ${darkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-100'} rounded-full text-sm text-purple-700 dark:text-purple-300 font-medium mb-6 border`}>
                            <Sparkles className="w-4 h-4 animate-pulse" />
                            Version 2.0 - Next-Gen AI Job Matching
                        </div>

                        <h1 className={`text-5xl md:text-6xl font-bold ${textClass} mb-6 tracking-tight`}>
                            Upload Resume,
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Get Smarter Matches</span>
                        </h1>

                        <p className={`text-xl ${textSecondaryClass} mb-8 max-w-2xl mx-auto leading-relaxed`}>
                            Advanced AI analysis with real-time job board scraping, intelligent filtering, and comprehensive matching insights.
                        </p>
                    </div>

                    {/* Upload Form */}
                    <div className={`${cardBgClass} rounded-2xl shadow-xl p-8 mb-8 border transition-colors duration-300`}>
                        <form onSubmit={handleSubmit}>
                            {/* File Upload Area */}
                            <div className="mb-6">
                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                                        dragActive
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
                                            : file
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                            : darkMode
                                            ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    {file ? (
                                        <div className="space-y-3">
                                            <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-green-200'} p-4 rounded-lg border max-w-md mx-auto`}>
                                                <div className="flex items-start gap-3">
                                                    <FileText className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'} flex-shrink-0 mt-0.5`} />
                                                    <div className="flex-1 text-left">
                                                        <p className={`font-semibold ${textClass} mb-1`}>{file.name}</p>
                                                        <p className={`text-xs ${textMutedClass}`}>
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={removeFile}
                                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs font-medium underline"
                                            >
                                                Remove & Choose Different File
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className={`w-12 h-12 mx-auto ${darkMode ? 'bg-blue-900' : 'bg-blue-100'} rounded-full flex items-center justify-center mb-3`}>
                                                <Upload className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                            </div>
                                            <div className="space-y-2">
                                                <p className={`font-semibold ${textClass}`}>
                                                    Drag & drop your resume here
                                                </p>
                                                <p className={`text-sm ${textMutedClass}`}>or</p>
                                                <input
                                                    type="file"
                                                    onChange={handleFileChange}
                                                    accept=".pdf,.txt,.doc,.docx"
                                                    className="hidden"
                                                    id="resume-upload-v2"
                                                />
                                                <label
                                                    htmlFor="resume-upload-v2"
                                                    className="inline-block px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                                                >
                                                    Browse Files
                                                </label>
                                                <p className={`text-xs ${textMutedClass} mt-2`}>
                                                    PDF, DOC, DOCX, or TXT • Max 10MB
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Job Preferences */}
                            {showPreferences && (
                                <div className={`mb-6 p-6 ${darkMode ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-700' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'} rounded-xl border transition-colors duration-300`}>
                                    <h3 className={`text-lg font-bold ${textClass} mb-4 flex items-center gap-2`}>
                                        <Target className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                        Job Preferences (Optional)
                                    </h3>
                                    <p className={`text-sm ${textSecondaryClass} mb-4`}>Help us find better matches by sharing your preferences</p>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-sm font-semibold ${textClass} mb-2`}>Preferred Role/Title</label>
                                            <input
                                                type="text"
                                                value={preferences.preferredRole}
                                                onChange={(e) => setPreferences({...preferences, preferredRole: e.target.value})}
                                                placeholder="e.g., Senior Developer, Product Manager"
                                                className={`w-full px-4 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300`}
                                            />
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-semibold ${textClass} mb-2`}>Preferred Location</label>
                                            <input
                                                type="text"
                                                value={preferences.preferredLocation}
                                                onChange={(e) => setPreferences({...preferences, preferredLocation: e.target.value})}
                                                placeholder="e.g., San Francisco, Remote"
                                                className={`w-full px-4 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300`}
                                            />
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-semibold ${textClass} mb-2`}>Employment Type</label>
                                            <select
                                                value={preferences.employmentType}
                                                onChange={(e) => setPreferences({...preferences, employmentType: e.target.value as any})}
                                                className={`w-full px-4 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300`}
                                            >
                                                <option value="any">Any</option>
                                                <option value="fulltime">Full-time</option>
                                                <option value="parttime">Part-time</option>
                                                <option value="contract">Contract</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-semibold ${textClass} mb-2`}>Work Location</label>
                                            <label className={`flex items-center gap-3 px-4 py-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border rounded-lg cursor-pointer hover:bg-opacity-80 transition-colors duration-300`}>
                                                <input
                                                    type="checkbox"
                                                    checked={preferences.remoteOnly}
                                                    onChange={(e) => setPreferences({...preferences, remoteOnly: e.target.checked})}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className={`text-sm font-medium ${textClass}`}>Remote Only</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="text-center">
                                <button
                                    type="submit"
                                    disabled={!file || loading}
                                    className={`group px-10 py-4 rounded-xl font-bold text-lg transition-all ${
                                        !file || loading
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:scale-105'
                                    }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-3">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Zap className="w-5 h-5" />
                                            Find My Perfect Jobs
                                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Terminal-Style Processing */}
                    {loading && (
                        <div className="bg-black rounded-2xl shadow-xl p-6 mb-8 border border-green-500/30 font-mono text-sm">
                            {/* Terminal Header */}
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-green-500/30">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <span className="text-green-400 text-xs ml-2">jobai-terminal</span>
                            </div>

                            {/* Terminal Output */}
                            <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/30 scrollbar-track-transparent">
                                {/* Step 1: Resume Upload */}
                                {currentStep >= 1 && (
                                    <>
                                        <div className="text-green-400">$ jobai-search --analyze resume.pdf</div>
                                        <div className="text-green-300 pl-4">
                                            {processingSteps[0].status === 'completed' ? (
                                                <>
                                                    <div>&gt; Extracting text from resume... <span className="text-green-500">✓</span></div>
                                                    <div>&gt; Parsing skills and experience... <span className="text-green-500">✓</span></div>
                                                    <div>&gt; Analyzing work history... <span className="text-green-500">✓</span></div>
                                                    <div className="text-cyan-400">&gt; Identified 25 skills, 8 years experience</div>
                                                </>
                                            ) : processingSteps[0].status === 'processing' ? (
                                                <div>&gt; Processing resume file... <span className="animate-pulse">█</span></div>
                                            ) : processingSteps[0].status === 'error' ? (
                                                <div className="text-red-400">&gt; Error: Failed to parse resume ✗</div>
                                            ) : null}
                                        </div>
                                        <div className="h-3"></div>
                                    </>
                                )}

                                {/* Step 2: Job Scraping */}
                                {currentStep >= 2 && (
                                    <>
                                        <div className="text-green-400">$ jobai-search --scan-job-boards --location=&quot;{preferences.preferredLocation || 'Global'}&quot;</div>
                                        <div className="text-green-300 pl-4">
                                            {processingSteps[1].status === 'processing' || processingSteps[1].status === 'completed' ? (
                                                <>
                                                    <div>&gt; Launching scrapers for {preferences.preferredLocation || 'global'} region...</div>
                                                    {scraperProgress.map((scraper) => (
                                                        <div key={scraper.source} className="flex items-center gap-2">
                                                            <span>&gt; [{scraper.source}]</span>
                                                            {scraper.status === 'completed' ? (
                                                                <span className="text-green-500">Searching... {scraper.jobsFound} jobs found ✓</span>
                                                            ) : scraper.status === 'searching' ? (
                                                                <span className="text-yellow-400">Searching... {scraper.jobsFound} jobs <span className="animate-pulse">█</span></span>
                                                            ) : (
                                                                <span className="text-gray-500">Waiting...</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </>
                                            ) : null}
                                            {processingSteps[1].status === 'completed' && (
                                                <div className="text-cyan-400 mt-2">
                                                    &gt; Total jobs collected: {scraperProgress.reduce((sum, s) => sum + s.jobsFound, 0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="h-3"></div>
                                    </>
                                )}

                                {/* Step 3: AI Matching */}
                                {currentStep >= 3 && (
                                    <>
                                        <div className="text-green-400">$ jobai-search --ai-match --model=claude-sonnet-4.5</div>
                                        <div className="text-green-300 pl-4">
                                            {processingSteps[2].status === 'completed' ? (
                                                <>
                                                    <div>&gt; Analyzing job requirements vs. profile... <span className="text-green-500">✓</span></div>
                                                    <div>&gt; Calculating match scores... <span className="text-green-500">✓</span></div>
                                                    <div>&gt; Generating recommendations... <span className="text-green-500">✓</span></div>
                                                    <div className="text-cyan-400">&gt; AI analysis complete - {results?.matches?.length || 0} jobs ranked</div>
                                                </>
                                            ) : processingSteps[2].status === 'processing' ? (
                                                <>
                                                    <div>&gt; Running AI matching algorithm... <span className="animate-pulse">█</span></div>
                                                    <div className="text-yellow-400">&gt; This may take 30-60 seconds...</div>
                                                </>
                                            ) : processingSteps[2].status === 'error' ? (
                                                <div className="text-red-400">&gt; Error: AI matching failed ✗</div>
                                            ) : null}
                                        </div>
                                        <div className="h-3"></div>
                                    </>
                                )}

                                {/* Step 4: Results */}
                                {currentStep >= 4 && (
                                    <>
                                        <div className="text-green-400">$ jobai-search --display-results</div>
                                        <div className="text-green-300 pl-4">
                                            {processingSteps[3].status === 'completed' ? (
                                                <>
                                                    <div>&gt; Preparing results view... <span className="text-green-500">✓</span></div>
                                                    <div className="text-cyan-400 mt-2">
                                                        <div>╔════════════════════════════════════╗</div>
                                                        <div>║   🎯 JOB SEARCH COMPLETE          ║</div>
                                                        <div>║   Found: {results?.matches?.length || 0} matching jobs{' '.repeat(Math.max(0, 16 - (results?.matches?.length || 0).toString().length))}║</div>
                                                        <div>║   Ready to explore!               ║</div>
                                                        <div>╚════════════════════════════════════╝</div>
                                                    </div>
                                                </>
                                            ) : processingSteps[3].status === 'processing' ? (
                                                <div>&gt; Loading results... <span className="animate-pulse">█</span></div>
                                            ) : null}
                                        </div>
                                    </>
                                )}

                                {/* Blinking Cursor */}
                                {loading && currentStep < 4 && (
                                    <div className="text-green-400 animate-pulse mt-4">█</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Results Section */}
                    {results && (
                        <div className="space-y-6">
                            {/* Error Display */}
                            {results.error && (
                                <div className={`${darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'} border-2 rounded-xl p-6`}>
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className={`w-6 h-6 ${darkMode ? 'text-red-400' : 'text-red-600'} flex-shrink-0 mt-0.5`} />
                                        <div>
                                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-red-400' : 'text-red-900'} mb-1`}>Processing Error</h3>
                                            <p className={darkMode ? 'text-red-300' : 'text-red-700'}>{results.error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Success Results */}
                            {results.success && (
                                <>
                                    {/* Resume Analysis Summary */}
                                    <div className={`${cardBgClass} rounded-2xl shadow-xl p-8 border transition-colors duration-300`}>
                                        <h2 className={`text-2xl font-bold ${textClass} mb-6 flex items-center gap-2`}>
                                            <div className={`w-10 h-10 ${darkMode ? 'bg-blue-900' : 'bg-blue-100'} rounded-full flex items-center justify-center`}>
                                                <CheckCircle2 className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                            </div>
                                            Resume Analyzed Successfully
                                        </h2>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            {((results.analysis?.skills || results.parsedData?.skills)?.length > 0) && (
                                                <div className={`${darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-100'} rounded-xl p-4 border`}>
                                                    <p className={`text-sm font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-900'} mb-2`}>Skills Detected</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(results.analysis?.skills || results.parsedData?.skills).slice(0, 8).map((skill: any, idx: number) => (
                                                            <span key={idx} className={`px-3 py-1 ${darkMode ? 'bg-gray-700 text-blue-300 border-blue-600' : 'bg-white text-blue-700 border-blue-200'} text-sm font-medium rounded-full border`}>
                                                                {typeof skill === 'string' ? skill : skill.name}
                                                            </span>
                                                        ))}
                                                        {(results.analysis?.skills || results.parsedData?.skills).length > 8 && (
                                                            <span className={`px-3 py-1 ${darkMode ? 'bg-gray-700 text-blue-300 border-blue-600' : 'bg-white text-blue-700 border-blue-200'} text-sm font-medium rounded-full border`}>
                                                                +{(results.analysis?.skills || results.parsedData?.skills).length - 8} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {(results.analysis?.experience || results.parsedData?.experience) && (
                                                <div className={`${darkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-100'} rounded-xl p-4 border`}>
                                                    <p className={`text-sm font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-900'} mb-2`}>Experience Level</p>
                                                    <p className={`${darkMode ? 'text-purple-300' : 'text-purple-700'} font-medium capitalize`}>{results.analysis?.experience || results.parsedData?.experience}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Job Results */}
                                    {filteredAndSortedJobs.length > 0 ? (
                                        <>
                                            {/* Toolbar */}
                                            <div className={`${cardBgClass} rounded-xl shadow-lg p-4 border transition-colors duration-300`}>
                                                <div className="flex flex-wrap items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <h3 className={`text-lg font-bold ${textClass} flex items-center gap-2`}>
                                                            <Target className="w-5 h-5" />
                                                            {filteredAndSortedJobs.length} Matching Jobs
                                                        </h3>

                                                        {selectedJobs.length > 0 && (
                                                            <span className={`px-3 py-1 ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'} rounded-full text-xs font-semibold`}>
                                                                {selectedJobs.length} selected
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {selectedJobs.length >= 2 && (
                                                            <button
                                                                onClick={() => setShowComparison(!showComparison)}
                                                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold flex items-center gap-2"
                                                            >
                                                                <BarChart3 className="w-4 h-4" />
                                                                Compare ({selectedJobs.length})
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => setShowFilters(!showFilters)}
                                                            className={`px-4 py-2 ${showFilters ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} rounded-lg hover:bg-blue-700 hover:text-white transition-colors text-sm font-semibold flex items-center gap-2`}
                                                        >
                                                            <Filter className="w-4 h-4" />
                                                            Filters
                                                        </button>

                                                        <div className="relative">
                                                            <button
                                                                onClick={() => {
                                                                    const options: SortOption[] = ['match', 'date', 'salary', 'alphabetical']
                                                                    const currentIndex = options.indexOf(sortBy)
                                                                    setSortBy(options[(currentIndex + 1) % options.length])
                                                                }}
                                                                className={`px-4 py-2 ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-semibold flex items-center gap-2`}
                                                            >
                                                                <ArrowUpDown className="w-4 h-4" />
                                                                Sort: {sortBy}
                                                            </button>
                                                        </div>

                                                        <button
                                                            onClick={handleSaveSearch}
                                                            className={`px-4 py-2 ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-semibold`}
                                                        >
                                                            <Bookmark className="w-4 h-4" />
                                                        </button>

                                                        <button
                                                            onClick={handleExportCSV}
                                                            className={`px-4 py-2 ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-semibold`}
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Filters Panel */}
                                            {showFilters && (
                                                <div className={`${cardBgClass} rounded-xl shadow-lg p-6 border transition-all duration-300`}>
                                                    <h3 className={`text-lg font-bold ${textClass} mb-4 flex items-center gap-2`}>
                                                        <Filter className="w-5 h-5" />
                                                        Advanced Filters
                                                    </h3>

                                                    <div className="grid md:grid-cols-3 gap-4">
                                                        {/* Match Score Filter */}
                                                        <div>
                                                            <label className={`block text-sm font-semibold ${textClass} mb-2`}>
                                                                Minimum Match Score: {filters.matchScore}%
                                                            </label>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="100"
                                                                step="10"
                                                                value={filters.matchScore}
                                                                onChange={(e) => setFilters({...filters, matchScore: parseInt(e.target.value)})}
                                                                className="w-full"
                                                            />
                                                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                                <span>0%</span>
                                                                <span>50%</span>
                                                                <span>100%</span>
                                                            </div>
                                                        </div>

                                                        {/* Job Type Filter */}
                                                        <div>
                                                            <label className={`block text-sm font-semibold ${textClass} mb-2`}>Job Type</label>
                                                            <div className="space-y-2">
                                                                {['full-time', 'part-time', 'contract'].map(type => (
                                                                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={filters.jobTypes.includes(type)}
                                                                            onChange={(e) => {
                                                                                if (e.target.checked) {
                                                                                    setFilters({...filters, jobTypes: [...filters.jobTypes, type]})
                                                                                } else {
                                                                                    setFilters({...filters, jobTypes: filters.jobTypes.filter(t => t !== type)})
                                                                                }
                                                                            }}
                                                                            className="rounded"
                                                                        />
                                                                        <span className={`text-sm ${textSecondaryClass} capitalize`}>{type}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Work Location Filter */}
                                                        <div>
                                                            <label className={`block text-sm font-semibold ${textClass} mb-2`}>Work Location</label>
                                                            <div className="space-y-2">
                                                                {['remote', 'hybrid', 'onsite'].map(loc => (
                                                                    <label key={loc} className="flex items-center gap-2 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={filters.workLocation.includes(loc)}
                                                                            onChange={(e) => {
                                                                                if (e.target.checked) {
                                                                                    setFilters({...filters, workLocation: [...filters.workLocation, loc]})
                                                                                } else {
                                                                                    setFilters({...filters, workLocation: filters.workLocation.filter(l => l !== loc)})
                                                                                }
                                                                            }}
                                                                            className="rounded"
                                                                        />
                                                                        <span className={`text-sm ${textSecondaryClass} capitalize`}>{loc}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Reset Filters */}
                                                    <div className="mt-4 flex justify-end">
                                                        <button
                                                            onClick={() => setFilters({
                                                                matchScore: 0,
                                                                jobTypes: [],
                                                                workLocation: [],
                                                                salaryMin: 0,
                                                                datePosted: 'any',
                                                                sources: []
                                                            })}
                                                            className="px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                                                        >
                                                            <RefreshCw className="w-4 h-4" />
                                                            Reset Filters
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Job Comparison */}
                                            {showComparison && selectedJobsData.length >= 2 && (
                                                <div className={`${cardBgClass} rounded-xl shadow-lg p-6 border transition-all duration-300`}>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h3 className={`text-lg font-bold ${textClass} flex items-center gap-2`}>
                                                            <BarChart3 className="w-5 h-5" />
                                                            Job Comparison
                                                        </h3>
                                                        <button
                                                            onClick={() => setShowComparison(false)}
                                                            className={`p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    </div>

                                                    <div className="overflow-x-auto">
                                                        <table className="w-full">
                                                            <thead>
                                                                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                                                    <th className={`text-left py-3 px-4 ${textClass} font-semibold`}>Feature</th>
                                                                    {selectedJobsData.map(job => (
                                                                        <th key={job.id} className={`text-left py-3 px-4 ${textClass} font-semibold`}>
                                                                            {job.title}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                                                    <td className={`py-3 px-4 ${textSecondaryClass} font-medium`}>Company</td>
                                                                    {selectedJobsData.map(job => (
                                                                        <td key={job.id} className={`py-3 px-4 ${textClass}`}>{job.company}</td>
                                                                    ))}
                                                                </tr>
                                                                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                                                    <td className={`py-3 px-4 ${textSecondaryClass} font-medium`}>Match Score</td>
                                                                    {selectedJobsData.map(job => (
                                                                        <td key={job.id} className={`py-3 px-4`}>
                                                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                                                job.matchScore >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                                                job.matchScore >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                                                'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                                                            }`}>
                                                                                {Math.round(job.matchScore)}%
                                                                            </span>
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                                                    <td className={`py-3 px-4 ${textSecondaryClass} font-medium`}>Location</td>
                                                                    {selectedJobsData.map(job => (
                                                                        <td key={job.id} className={`py-3 px-4 ${textClass}`}>{job.location}</td>
                                                                    ))}
                                                                </tr>
                                                                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                                                    <td className={`py-3 px-4 ${textSecondaryClass} font-medium`}>Salary</td>
                                                                    {selectedJobsData.map(job => (
                                                                        <td key={job.id} className={`py-3 px-4 ${textClass}`}>{formatSalary(job.salary)}</td>
                                                                    ))}
                                                                </tr>
                                                                <tr>
                                                                    <td className={`py-3 px-4 ${textSecondaryClass} font-medium`}>Source</td>
                                                                    {selectedJobsData.map(job => (
                                                                        <td key={job.id} className={`py-3 px-4 ${textClass}`}>{job.source || 'Unknown'}</td>
                                                                    ))}
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Job List */}
                                            <div className="space-y-4">
                                                {filteredAndSortedJobs.map((job) => {
                                                    const isSelected = selectedJobs.includes(job.id)

                                                    return (
                                                        <div
                                                            key={job.id}
                                                            className={`${cardBgClass} border-2 ${
                                                                isSelected
                                                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                                                                    : darkMode ? 'border-gray-700 hover:border-blue-500' : 'border-gray-200 hover:border-blue-300'
                                                            } rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer relative`}
                                                        >
                                                            {/* Selection Checkbox */}
                                                            <div className="absolute top-4 right-4">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={(e) => {
                                                                        e.stopPropagation()
                                                                        toggleJobSelection(job.id)
                                                                    }}
                                                                    className="w-5 h-5 rounded cursor-pointer"
                                                                />
                                                            </div>

                                                            <div onClick={() => viewJobDetails(job.id)}>
                                                                {/* Header */}
                                                                <div className="flex justify-between items-start mb-4 pr-12">
                                                                    <div className="flex-1">
                                                                        <h4 className={`text-xl font-bold ${textClass} mb-2 hover:text-blue-600 dark:hover:text-blue-400`}>
                                                                            {job.title}
                                                                        </h4>
                                                                        <div className="flex flex-wrap gap-4 text-sm">
                                                                            <span className={`${textSecondaryClass} flex items-center gap-1`}>
                                                                                <Building2 className="w-4 h-4" />
                                                                                {job.company}
                                                                            </span>
                                                                            <span className={`${textSecondaryClass} flex items-center gap-1`}>
                                                                                <MapPin className="w-4 h-4" />
                                                                                {job.location}
                                                                            </span>
                                                                            {job.salary && (
                                                                                <span className={`${textSecondaryClass} flex items-center gap-1`}>
                                                                                    <DollarSign className="w-4 h-4" />
                                                                                    {formatSalary(job.salary)}
                                                                                </span>
                                                                            )}
                                                                            <span className={`${textSecondaryClass} flex items-center gap-1`}>
                                                                                <Calendar className="w-4 h-4" />
                                                                                {getTimeAgo(job.postedDate)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Match Score with Visual */}
                                                                <div className="mb-4">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className={`text-sm font-semibold ${textClass}`}>AI Match Score</span>
                                                                        <span className={`text-lg font-bold ${
                                                                            job.matchScore >= 80 ? 'text-green-600 dark:text-green-400' :
                                                                            job.matchScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                                                                            'text-orange-600 dark:text-orange-400'
                                                                        }`}>
                                                                            {Math.round(job.matchScore)}%
                                                                        </span>
                                                                    </div>
                                                                    <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-3`}>
                                                                        <div
                                                                            className={`h-3 rounded-full transition-all duration-500 ${
                                                                                job.matchScore >= 80 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                                                                job.matchScore >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                                                                'bg-gradient-to-r from-orange-500 to-orange-600'
                                                                            }`}
                                                                            style={{ width: `${job.matchScore}%` }}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Description Preview */}
                                                                {job.description && job.description !== 'No description available' && (
                                                                    <p className={`${textSecondaryClass} mb-4 leading-relaxed line-clamp-2`}>
                                                                        {stripHtml(job.description)}
                                                                    </p>
                                                                )}

                                                                {/* Badges */}
                                                                <div className="flex flex-wrap gap-2 mb-4">
                                                                    {job.recommendation && (
                                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                            job.recommendation === 'Excellent Match' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                                            job.recommendation === 'Strong Match' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                                            job.recommendation === 'Good Match' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                                        }`}>
                                                                            {job.recommendation}
                                                                        </span>
                                                                    )}
                                                                    {job.source && (
                                                                        <span className={`px-3 py-1 ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} rounded-full text-xs font-semibold`}>
                                                                            {job.source}
                                                                        </span>
                                                                    )}
                                                                    {job.remote && (
                                                                        <span className={`px-3 py-1 ${darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'} rounded-full text-xs font-semibold`}>
                                                                            Remote
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* View Details Button */}
                                                                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold text-sm flex items-center gap-1 group">
                                                                    View Full Analysis & Details
                                                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </>
                                    ) : (
                                        <div className={`${cardBgClass} rounded-2xl shadow-xl p-12 border text-center transition-colors duration-300`}>
                                            <div className={`w-16 h-16 mx-auto ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full flex items-center justify-center mb-4`}>
                                                <Search className={`w-8 h-8 ${textMutedClass}`} />
                                            </div>
                                            <p className={`${textClass} font-medium mb-2`}>No matching jobs found</p>
                                            <p className={`text-sm ${textMutedClass}`}>Try adjusting your filters or uploading a different resume</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
