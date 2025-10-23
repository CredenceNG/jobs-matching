'use client'

/**
 * Resume Job Search V3 - AI-Powered Intelligent Job Discovery
 *
 * @description Revolutionary job search using AI to:
 * - Generate smart search queries from resume
 * - Search job boards via AI (no traditional scraping)
 * - Extract and structure job data with AI
 * - Match and rank jobs intelligently
 * - Provide personalized recommendations
 *
 * @version 3.0.0 - AI-First Approach
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Upload,
    Check,
    X,
    Loader2,
    FileText,
    Search,
    Sparkles,
    Zap,
    Brain,
    TrendingUp,
    MapPin,
    Building2,
    DollarSign,
    Calendar,
    ChevronRight,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Target,
    Wand2,
    Activity,
    Sun,
    Moon
} from 'lucide-react'

// ==================== INTERFACES ====================

interface JobMatch {
    id: string
    title: string
    company: string
    location: string
    description: string
    requirements?: string[]
    salary?: string
    url?: string
    matchScore: number
    matchingSkills?: string[]
    missingSkills?: string[]
    recommendation?: string
    source?: string
    postedDate?: string
    remote?: boolean
}

interface AIProcessingStep {
    id: number
    title: string
    description: string
    status: 'pending' | 'processing' | 'completed' | 'error'
}

// ==================== MAIN COMPONENT ====================

export default function ResumeJobSearchV3() {
    // ==================== STATE ====================

    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [darkMode, setDarkMode] = useState(false)
    const [refineSearch, setRefineSearch] = useState(true) // Enable AI-refined search by default

    const [results, setResults] = useState<{
        success: boolean
        searchQueries?: string[]
        matches?: JobMatch[]
        recommendations?: string[]
        totalFound?: number
        error?: string
    } | null>(null)

    const [aiSteps, setAiSteps] = useState<AIProcessingStep[]>([
        { id: 1, title: 'Resume Analysis', description: 'AI extracts skills and experience', status: 'pending' },
        { id: 2, title: 'Career Assessment', description: 'AI analyzes optimal roles and creates targeted queries', status: 'pending' },
        { id: 3, title: 'Job Discovery', description: 'AI searches and collects jobs', status: 'pending' },
        { id: 4, title: 'Intelligent Matching', description: 'AI ranks jobs by relevance', status: 'pending' },
        { id: 5, title: 'Insights Generation', description: 'AI provides recommendations', status: 'pending' }
    ])

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

    // ==================== EFFECTS ====================

    useEffect(() => {
        const savedDarkMode = localStorage.getItem('darkMode')
        if (savedDarkMode === 'true') {
            setDarkMode(true)
            document.documentElement.classList.add('dark')
        }
    }, [])

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('darkMode', 'true')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('darkMode', 'false')
        }
    }, [darkMode])

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
            showToast('Resume uploaded successfully!', 'success')
        }
    }

    const updateStepStatus = (stepId: number, status: AIProcessingStep['status']) => {
        setAiSteps(prev => prev.map(step =>
            step.id === stepId ? { ...step, status } : step
        ))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return

        setLoading(true)
        setResults(null)

        // Reset all steps
        setAiSteps(prev => prev.map(step => ({ ...step, status: 'pending' })))

        try {
            const formData = new FormData()
            formData.append('resume', file)
            formData.append('refineSearch', refineSearch.toString()) // Pass refined search flag

            // Step 1: Resume Analysis
            updateStepStatus(1, 'processing')
            await new Promise(resolve => setTimeout(resolve, 800))
            updateStepStatus(1, 'completed')

            // Step 2: Query Generation
            updateStepStatus(2, 'processing')
            await new Promise(resolve => setTimeout(resolve, 1000))
            updateStepStatus(2, 'completed')

            // Step 3: Job Discovery
            updateStepStatus(3, 'processing')

            const response = await fetch('/api/ai-job-search', {
                method: 'POST',
                body: formData,
            })

            // Check for timeout (504) BEFORE parsing
            if (response.status === 504) {
                throw new Error('The search is taking longer than expected. This usually means we found many great matches! Please try again.');
            }

            if (response.status >= 500) {
                throw new Error('Our servers are experiencing high demand. Please try again in a few moments.');
            }

            // Safe JSON parsing with error handling
            const responseText = await response.text();

            // Handle empty response
            if (!responseText || responseText.trim().length === 0) {
                throw new Error('We lost connection while searching for jobs. Please try again.');
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (jsonError) {
                // Specific error for timeouts
                if (response.status === 502 || response.status === 503) {
                    throw new Error('The server took too long to respond. Please try again.');
                }
                throw new Error('We received an incomplete response from the server. Please try again in a moment.');
            }

            if (!response.ok) {
                throw new Error(data.message || 'AI job search failed')
            }

            updateStepStatus(3, 'completed')

            // Step 4: Intelligent Matching
            updateStepStatus(4, 'processing')
            await new Promise(resolve => setTimeout(resolve, 1200))
            updateStepStatus(4, 'completed')

            // Step 5: Insights Generation
            updateStepStatus(5, 'processing')
            await new Promise(resolve => setTimeout(resolve, 800))
            updateStepStatus(5, 'completed')

            setResults(data)
            showToast(`AI found ${data.matches?.length || 0} matching jobs!`, 'success')

        } catch (error) {
            console.error('Error:', error)
            const errorMessage = error instanceof Error ? error.message : 'AI job search failed'
            setResults({
                success: false,
                error: errorMessage
            })
            showToast(errorMessage, 'error')

            // Mark current processing step as error
            const currentStep = aiSteps.find(s => s.status === 'processing')
            if (currentStep) {
                updateStepStatus(currentStep.id, 'error')
            }
        } finally {
            setLoading(false)
        }
    }

    const removeFile = () => {
        setFile(null)
        setResults(null)
        showToast('Resume removed', 'info')
    }

    // ==================== RENDER ====================

    const bgClass = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-white to-blue-50'
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
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            JobAI
                        </Link>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-700'} hover:scale-110 transition-all`}
                            >
                                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                            <Link
                                href="/resume-jobs-v2"
                                className={`text-sm ${textSecondaryClass} hover:text-purple-600 transition-colors font-medium`}
                            >
                                V2 (Scraper)
                            </Link>
                            <Link
                                href="/pricing"
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all"
                            >
                                Go Premium
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-24 pb-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 ${darkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-100'} rounded-full text-sm text-purple-700 dark:text-purple-300 font-medium mb-6 border`}>
                            <Brain className="w-4 h-4 animate-pulse" />
                            Version 3.0 - AI-First Job Discovery
                        </div>

                        <h1 className={`text-5xl md:text-6xl font-bold ${textClass} mb-6 tracking-tight`}>
                            Let AI Find
                            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> Your Perfect Job</span>
                        </h1>

                        <p className={`text-xl ${textSecondaryClass} mb-4 max-w-2xl mx-auto leading-relaxed`}>
                            No more scrapers! AI reads your resume, generates smart searches, and finds jobs you'll actually love.
                        </p>

                        {/* AI Features Highlight */}
                        <div className="flex flex-wrap justify-center gap-4 mt-8">
                            <div className={`flex items-center gap-2 px-4 py-2 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-full`}>
                                <Wand2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Smart Queries</span>
                            </div>
                            <div className={`flex items-center gap-2 px-4 py-2 ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'} rounded-full`}>
                                <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                <span className={`text-sm font-medium ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>AI Matching</span>
                            </div>
                            <div className={`flex items-center gap-2 px-4 py-2 ${darkMode ? 'bg-green-900/30' : 'bg-green-50'} rounded-full`}>
                                <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                                <span className={`text-sm font-medium ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Personalized Results</span>
                            </div>
                        </div>
                    </div>

                    {/* Upload Card */}
                    <div className={`${cardBgClass} rounded-2xl shadow-xl p-8 mb-8 border transition-colors duration-300`}>
                        <form onSubmit={handleSubmit}>
                            {/* File Upload */}
                            <div className="mb-6">
                                <div
                                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                                        dragActive
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-105'
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
                                            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className={`${darkMode ? 'bg-gray-700' : 'bg-white'} p-4 rounded-lg max-w-md mx-auto`}>
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                                                    <div className="flex-1 text-left">
                                                        <p className={`font-semibold ${textClass}`}>{file.name}</p>
                                                        <p className={`text-xs ${textMutedClass}`}>
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={removeFile}
                                                className="text-red-600 dark:text-red-400 text-sm font-medium underline"
                                            >
                                                Remove & Choose Different File
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className={`w-16 h-16 mx-auto ${darkMode ? 'bg-purple-900' : 'bg-purple-100'} rounded-full flex items-center justify-center mb-4`}>
                                                <Upload className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <p className={`text-lg font-semibold ${textClass} mb-2`}>
                                                Drag & drop your resume here
                                            </p>
                                            <p className={`text-sm ${textMutedClass} mb-4`}>or</p>
                                            <input
                                                type="file"
                                                onChange={handleFileChange}
                                                accept=".pdf,.txt,.doc,.docx"
                                                className="hidden"
                                                id="resume-upload-v3"
                                            />
                                            <label
                                                htmlFor="resume-upload-v3"
                                                className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                                            >
                                                Browse Files
                                            </label>
                                            <p className={`text-xs ${textMutedClass} mt-4`}>
                                                PDF, DOC, DOCX, or TXT • Max 10MB
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* AI Refined Search Toggle */}
                            {file && (
                                <div className={`flex items-center justify-center gap-3 p-4 rounded-lg ${darkMode ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
                                    <input
                                        type="checkbox"
                                        id="refineSearch"
                                        checked={refineSearch}
                                        onChange={(e) => setRefineSearch(e.target.checked)}
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                    />
                                    <label htmlFor="refineSearch" className={`text-sm font-medium cursor-pointer ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        <span className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-purple-600" />
                                            Use AI recommendations to refine job search (finds better matches)
                                        </span>
                                    </label>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="text-center">
                                <button
                                    type="submit"
                                    disabled={!file || loading}
                                    className={`group px-12 py-4 rounded-xl font-bold text-lg transition-all ${
                                        !file || loading
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-2xl hover:scale-105'
                                    }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-3">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            AI is Working...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Brain className="w-6 h-6" />
                                            Let AI Find My Jobs
                                            <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                                        </span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* AI Processing Steps */}
                    {loading && (
                        <div className={`${cardBgClass} rounded-2xl shadow-xl p-8 mb-8 border`}>
                            <h3 className={`text-xl font-bold ${textClass} mb-6 flex items-center gap-2`}>
                                <Activity className="w-6 h-6 animate-pulse text-purple-600 dark:text-purple-400" />
                                AI Processing Pipeline
                            </h3>

                            <div className="space-y-4">
                                {aiSteps.map((step) => (
                                    <div key={step.id} className={`flex items-start gap-4 p-4 rounded-lg ${
                                        step.status === 'completed' ? darkMode ? 'bg-green-900/20' : 'bg-green-50' :
                                        step.status === 'processing' ? darkMode ? 'bg-purple-900/20' : 'bg-purple-50' :
                                        step.status === 'error' ? darkMode ? 'bg-red-900/20' : 'bg-red-50' :
                                        darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                                    }`}>
                                        <div className="flex-shrink-0 mt-0.5">
                                            {step.status === 'completed' && <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />}
                                            {step.status === 'processing' && <Loader2 className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-spin" />}
                                            {step.status === 'error' && <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />}
                                            {step.status === 'pending' && (
                                                <div className={`w-6 h-6 rounded-full border-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`} />
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <h4 className={`font-semibold ${textClass} mb-1`}>{step.title}</h4>
                                            <p className={`text-sm ${textSecondaryClass}`}>{step.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {results && (
                        <div className="space-y-6">
                            {/* Error */}
                            {results.error && (
                                <div className={`${darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'} border-2 rounded-xl p-6`}>
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                        <div>
                                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-red-400' : 'text-red-900'} mb-1`}>AI Search Error</h3>
                                            <p className={darkMode ? 'text-red-300' : 'text-red-700'}>{results.error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Success */}
                            {results.success && (
                                <>
                                    {/* Search Overview */}
                                    <div className={`${cardBgClass} rounded-2xl shadow-xl p-8 border`}>
                                        <h2 className={`text-2xl font-bold ${textClass} mb-6 flex items-center gap-2`}>
                                            <Sparkles className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                                            AI Search Results
                                        </h2>

                                        <div className="grid md:grid-cols-3 gap-6 mb-6">
                                            <div className={`${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-xl p-4`}>
                                                <p className={`text-sm font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-900'} mb-1`}>Search Queries Generated</p>
                                                <p className={`text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{results.searchQueries?.length || 0}</p>
                                            </div>
                                            <div className={`${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'} rounded-xl p-4`}>
                                                <p className={`text-sm font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-900'} mb-1`}>Jobs Discovered</p>
                                                <p className={`text-3xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{results.totalFound || 0}</p>
                                            </div>
                                            <div className={`${darkMode ? 'bg-green-900/30' : 'bg-green-50'} rounded-xl p-4`}>
                                                <p className={`text-sm font-semibold ${darkMode ? 'text-green-300' : 'text-green-900'} mb-1`}>Top Matches</p>
                                                <p className={`text-3xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{results.matches?.length || 0}</p>
                                            </div>
                                        </div>

                                        {/* Data Source Indicator */}
                                        {(results as any).usedMockData && (
                                            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                                                            Using Demo Data
                                                        </p>
                                                        <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                                                            Job search APIs are currently unavailable. Showing sample jobs to demonstrate the AI matching system.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    {/* Search Queries Used */}
                                        {results.searchQueries && results.searchQueries.length > 0 && (
                                            <div>
                                                <h3 className={`text-lg font-bold ${textClass} mb-3`}>AI Generated Searches:</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {results.searchQueries.map((query, idx) => (
                                                        <span key={idx} className={`px-3 py-1 ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} rounded-full text-sm`}>
                                                            "{query}"
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Recommendations */}
                                    {results.recommendations && results.recommendations.length > 0 && (
                                        <div className={`${cardBgClass} rounded-xl shadow-lg p-6 border`}>
                                            <h3 className={`text-lg font-bold ${textClass} mb-4 flex items-center gap-2`}>
                                                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                AI Recommendations
                                            </h3>
                                            <ul className="space-y-2">
                                                {results.recommendations.map((rec, idx) => (
                                                    <li key={idx} className={`flex items-start gap-2 ${textSecondaryClass}`}>
                                                        <ChevronRight className="w-5 h-5 flex-shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
                                                        <span>{rec}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Job Matches */}
                                    {results.matches && results.matches.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className={`text-xl font-bold ${textClass}`}>
                                                {results.matches.length} Jobs Matched by AI
                                            </h3>

                                            {results.matches.map((job) => (
                                                <div
                                                    key={job.id}
                                                    onClick={() => {
                                                        // Save job data to sessionStorage for details page
                                                        sessionStorage.setItem('currentJob', JSON.stringify(job))
                                                        sessionStorage.setItem('allMatches', JSON.stringify(results.matches))
                                                        // Navigate to job details
                                                        window.location.href = `/resume-jobs-v3/${job.id}`
                                                    }}
                                                    className={`${cardBgClass} rounded-xl p-6 border hover:shadow-lg transition-shadow cursor-pointer`}
                                                >
                                                    {/* Job Header */}
                                                    <div className="mb-4">
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <h4 className={`text-xl font-bold ${textClass}`}>{job.title}</h4>
                                                            {job.source === 'Mock Data' && (
                                                                <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold rounded-full">
                                                                    DEMO
                                                                </span>
                                                            )}
                                                        </div>
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
                                                                    {job.salary}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Match Score */}
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
                                                                className={`h-3 rounded-full ${
                                                                    job.matchScore >= 80 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                                                    job.matchScore >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                                                    'bg-gradient-to-r from-orange-500 to-orange-600'
                                                                }`}
                                                                style={{ width: `${job.matchScore}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Skills Match */}
                                                    {job.matchingSkills && job.matchingSkills.length > 0 && (
                                                        <div className="mb-4">
                                                            <p className={`text-sm font-semibold ${textClass} mb-2`}>Matching Skills:</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {job.matchingSkills.slice(0, 5).map((skill, idx) => (
                                                                    <span key={idx} className={`px-3 py-1 ${darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'} rounded-full text-xs font-medium`}>
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Recommendation */}
                                                    {job.recommendation && (
                                                        <div className={`p-3 ${darkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'} rounded-lg border mt-4`}>
                                                            <p className={`text-sm ${darkMode ? 'text-purple-200' : 'text-purple-900'}`}>
                                                                <strong>AI Recommendation:</strong> {job.recommendation}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
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
