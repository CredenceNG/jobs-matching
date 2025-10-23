'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
    recommendation?: string
    reasoning?: string
    source?: string
}

interface ProcessingStep {
    id: number
    title: string
    description: string
    status: 'pending' | 'processing' | 'completed' | 'error'
}

export default function ResumeJobSearch() {
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
        { id: 1, title: 'Analyzing Resume', description: 'Extracting skills, experience, and career goals', status: 'pending' },
        { id: 2, title: 'Searching Jobs', description: 'Scraping the internet for matching opportunities', status: 'pending' },
        { id: 3, title: 'AI Job Scoring', description: 'Evaluating each job against your profile', status: 'pending' },
        { id: 4, title: 'Generating Insights', description: 'Creating personalized recommendations', status: 'pending' }
    ])
    const [results, setResults] = useState<{
        success: boolean
        matches?: JobMatch[]
        recommendations?: string[]
        analysis?: any
        parsedData?: any
        message?: string
        error?: string
    } | null>(null)
    const [dragActive, setDragActive] = useState(false)

    // Job preferences
    const [showPreferences, setShowPreferences] = useState(false)
    const [preferences, setPreferences] = useState({
        preferredRole: '',
        preferredLocation: '',
        employmentType: 'fulltime' as 'fulltime' | 'parttime' | 'contract' | 'any',
        remoteOnly: false
    })

    // Restore results from sessionStorage on mount
    useEffect(() => {
        const savedResults = sessionStorage.getItem('jobSearchResults')
        const savedPreferences = sessionStorage.getItem('jobSearchPreferences')

        if (savedResults) {
            try {
                const parsedResults = JSON.parse(savedResults)
                setResults(parsedResults)
            } catch (e) {
                console.error('Failed to restore results:', e)
            }
        }

        if (savedPreferences) {
            try {
                const parsedPreferences = JSON.parse(savedPreferences)
                setPreferences(parsedPreferences)
                if (parsedPreferences.preferredRole || parsedPreferences.preferredLocation) {
                    setShowPreferences(true)
                }
            } catch (e) {
                console.error('Failed to restore preferences:', e)
            }
        }
    }, [])

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
        } else {
            alert('Please select a PDF, DOC, DOCX, or text file')
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
        } else {
            alert('Please drop a PDF, DOC, DOCX, or text file')
        }
    }

    const updateStepStatus = (stepId: number, status: ProcessingStep['status']) => {
        setProcessingSteps(prev => prev.map(step =>
            step.id === stepId ? { ...step, status } : step
        ))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return

        setLoading(true)
        setResults(null)
        setCurrentStep(1)

        // Reset all steps
        setProcessingSteps(prev => prev.map(step => ({ ...step, status: 'pending' })))

        try {
            const formData = new FormData()
            formData.append('resume', file)
            formData.append('preferences', JSON.stringify(preferences))

            // Simulate step progression
            updateStepStatus(1, 'processing')

            console.log('[Resume Jobs] Sending resume to API for processing...');
            const response = await fetch('/api/resume-job-search', {
                method: 'POST',
                body: formData,
            })

            console.log('[Resume Jobs] API response received', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                headers: Object.fromEntries(response.headers.entries()),
            });

            // Check for timeout (504) or server errors (5xx)
            if (response.status === 504) {
                console.error('[Resume Jobs] Gateway Timeout - request took too long');
                throw new Error('Your resume is taking longer than expected to process. This usually means we found a lot of great matches! Please try again, and the results should load faster.');
            }

            if (response.status >= 500) {
                console.error('[Resume Jobs] Server error:', response.status);
                throw new Error('Our servers are experiencing high demand. Please try again in a few moments.');
            }

            // Step 1 complete
            updateStepStatus(1, 'completed')
            setCurrentStep(2)
            updateStepStatus(2, 'processing')

            // Check if response has content before trying to parse JSON
            const responseText = await response.text();
            console.log('[Resume Jobs] Response text received', {
                length: responseText.length,
                preview: responseText.substring(0, 200),
                isEmpty: responseText.length === 0,
            });

            // Handle empty response (likely timeout or connection issue)
            if (!responseText || responseText.trim().length === 0) {
                console.error('[Resume Jobs] CRITICAL: Empty response received');
                throw new Error('We lost connection while processing your resume. This can happen with large files or slow connections. Please try again.');
            }

            let data;
            try {
                data = JSON.parse(responseText);
                console.log('[Resume Jobs] Successfully parsed JSON response', {
                    success: data.success,
                    hasMatches: !!data.matches,
                    matchesCount: data.matches?.length || 0,
                });
            } catch (jsonError) {
                console.error('[Resume Jobs] CRITICAL: Failed to parse JSON response', {
                    error: jsonError instanceof Error ? jsonError.message : 'Unknown error',
                    responseText: responseText.substring(0, 500),
                    responseStatus: response.status,
                });

                // Provide specific error message for JSON parsing failures
                if (response.status === 502 || response.status === 503 || response.status === 504) {
                    throw new Error('The server took too long to respond. Your resume might be particularly detailed! Please try again, and consider using a smaller file if possible.');
                }

                throw new Error('We received an incomplete response from the server. This can happen during high traffic. Please try again in a moment.');
            }

            if (!response.ok) {
                console.error('[Resume Jobs] API returned error status', {
                    status: response.status,
                    error: data.error,
                    message: data.message,
                });
                throw new Error(data.message || data.error || 'An unexpected error occurred while processing your resume. Please try again.');
            }

            // Step 2 complete
            updateStepStatus(2, 'completed')
            setCurrentStep(3)
            updateStepStatus(3, 'processing')

            // Simulate AI scoring delay
            await new Promise(resolve => setTimeout(resolve, 500))

            // Step 3 complete
            updateStepStatus(3, 'completed')
            setCurrentStep(4)
            updateStepStatus(4, 'processing')

            // Simulate insights generation
            await new Promise(resolve => setTimeout(resolve, 300))

            // Step 4 complete
            updateStepStatus(4, 'completed')

            setResults(data)

            // Save results and preferences to sessionStorage for persistence
            sessionStorage.setItem('jobSearchResults', JSON.stringify(data))
            sessionStorage.setItem('jobSearchPreferences', JSON.stringify(preferences))

        } catch (error) {
            console.error('[Resume Jobs] CRITICAL ERROR during resume processing:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                currentStep,
            });

            // Determine user-friendly error message
            let errorMessage = 'We encountered an unexpected issue while processing your resume. Please try again in a few moments.';

            if (error instanceof Error) {
                // Check if this is a user-friendly error message (doesn't contain technical terms)
                const technicalTerms = ['json', 'parse', 'fetch', 'response', 'undefined', 'null', 'syntax'];
                const isTechnicalError = technicalTerms.some(term =>
                    error.message.toLowerCase().includes(term)
                );

                if (!isTechnicalError) {
                    // Use the error message if it's already user-friendly
                    errorMessage = error.message;
                } else {
                    // Log technical details but show friendly message
                    console.error('[Resume Jobs] Technical error details:', error.message);
                    errorMessage = 'We're experiencing technical difficulties processing your resume. Our team has been notified. Please try again shortly.';
                }
            }

            // Mark current step as error
            updateStepStatus(currentStep, 'error')

            setResults({
                success: false,
                error: errorMessage
            })
        } finally {
            setLoading(false)
        }
    }

    const removeFile = () => {
        setFile(null)
        setResults(null)
        setShowPreferences(false)
        // Clear saved results when starting new search
        sessionStorage.removeItem('jobSearchResults')
        sessionStorage.removeItem('jobSearchPreferences')
    }

    const viewJobDetails = (jobId: string) => {
        // Store job data in sessionStorage
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

    // Filter jobs with 10% minimum match
    const filteredJobs = results?.matches?.filter(job => job.matchScore >= 10) || []

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
                            <Link
                                href="/anonymous-jobs"
                                className="text-sm text-gray-700 hover:text-blue-600 transition-colors font-medium"
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
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full text-sm text-purple-700 font-medium mb-6 border border-purple-100">
                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                            AI-Powered Resume Analysis
                        </div>

                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
                            Upload Resume,
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Get Matches</span>
                        </h1>

                        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                            Our AI analyzes your resume and instantly finds jobs that match your skills and experience.
                        </p>
                    </div>

                    {/* Upload Form */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-200">
                        <form onSubmit={handleSubmit}>
                            {/* File Upload Area */}
                            <div className="mb-6">
                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                                        dragActive
                                            ? 'border-blue-500 bg-blue-50 scale-105'
                                            : file
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    {file ? (
                                        <div className="space-y-3">
                                            <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg border border-green-200 max-w-md mx-auto">
                                                <p className="font-semibold text-gray-900 mb-1">{file.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={removeFile}
                                                className="text-red-600 hover:text-red-800 text-xs font-medium underline"
                                            >
                                                Remove & Choose Different File
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="font-semibold text-gray-700">
                                                    Drag & drop your resume here
                                                </p>
                                                <p className="text-sm text-gray-500">or</p>
                                                <input
                                                    type="file"
                                                    onChange={handleFileChange}
                                                    accept=".pdf,.txt,.doc,.docx"
                                                    className="hidden"
                                                    id="resume-upload"
                                                />
                                                <label
                                                    htmlFor="resume-upload"
                                                    className="inline-block px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                                                >
                                                    Browse Files
                                                </label>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    PDF, DOC, DOCX, or TXT • Max 10MB
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Job Preferences */}
                            {showPreferences && (
                                <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                        </svg>
                                        Job Preferences (Optional)
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">Help us find better matches by sharing your preferences</p>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Role/Title</label>
                                            <input
                                                type="text"
                                                value={preferences.preferredRole}
                                                onChange={(e) => setPreferences({...preferences, preferredRole: e.target.value})}
                                                placeholder="e.g., Senior Developer, Product Manager"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Location</label>
                                            <input
                                                type="text"
                                                value={preferences.preferredLocation}
                                                onChange={(e) => setPreferences({...preferences, preferredLocation: e.target.value})}
                                                placeholder="e.g., San Francisco, Remote"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Employment Type</label>
                                            <select
                                                value={preferences.employmentType}
                                                onChange={(e) => setPreferences({...preferences, employmentType: e.target.value as any})}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="any">Any</option>
                                                <option value="fulltime">Full-time</option>
                                                <option value="parttime">Part-time</option>
                                                <option value="contract">Contract</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Work Location</label>
                                            <label className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    checked={preferences.remoteOnly}
                                                    onChange={(e) => setPreferences({...preferences, remoteOnly: e.target.checked})}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Remote Only</span>
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
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Find My Perfect Jobs
                                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Processing Steps - Enhanced V3 Style */}
                    {loading && (
                        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center gap-3">
                                <svg className="w-8 h-8 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                Processing Your Resume
                            </h2>
                            <div className="space-y-4">
                                {processingSteps.map((step, index) => (
                                    <div key={step.id} className={`flex items-start gap-4 p-4 rounded-lg ${
                                        step.status === 'completed' ? 'bg-green-50' :
                                        step.status === 'processing' ? 'bg-purple-50' :
                                        step.status === 'error' ? 'bg-red-50' :
                                        'bg-gray-50'
                                    }`}>
                                        <div className="flex-shrink-0 mt-0.5">
                                            {step.status === 'completed' ? (
                                                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : step.status === 'processing' ? (
                                                <svg className="animate-spin w-6 h-6 text-purple-600" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                            ) : step.status === 'error' ? (
                                                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            ) : (
                                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-bold text-lg ${
                                                step.status === 'completed' ? 'text-green-900' :
                                                step.status === 'processing' ? 'text-purple-900' :
                                                step.status === 'error' ? 'text-red-900' :
                                                'text-gray-500'
                                            }`}>
                                                {step.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Results Section */}
                    {results && (
                        <div className="space-y-6">
                            {results.error && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <h3 className="text-lg font-semibold text-red-900 mb-1">Processing Error</h3>
                                            <p className="text-red-700">{results.error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {results.success && (results.analysis || results.parsedData) && (
                                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <span className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </span>
                                        Resume Analyzed Successfully
                                    </h2>

                                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                                        {((results.analysis?.skills || results.parsedData?.skills)?.length > 0) && (
                                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                                <p className="text-sm font-semibold text-blue-900 mb-2">Skills Detected</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(results.analysis?.skills || results.parsedData?.skills).slice(0, 8).map((skill: any, idx: number) => (
                                                        <span key={idx} className="px-3 py-1 bg-white text-blue-700 text-sm font-medium rounded-full border border-blue-200">
                                                            {typeof skill === 'string' ? skill : skill.name}
                                                        </span>
                                                    ))}
                                                    {(results.analysis?.skills || results.parsedData?.skills).length > 8 && (
                                                        <span className="px-3 py-1 bg-white text-blue-700 text-sm font-medium rounded-full border border-blue-200">
                                                            +{(results.analysis?.skills || results.parsedData?.skills).length - 8} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {(results.analysis?.experience || results.parsedData?.experience) && (
                                            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                                <p className="text-sm font-semibold text-purple-900 mb-2">Experience Level</p>
                                                <p className="text-purple-700 font-medium capitalize">{results.analysis?.experience || results.parsedData?.experience}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Career-Level AI Recommendations */}
                                    {results.recommendations && results.recommendations.length > 0 && (
                                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200 mb-6">
                                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                </svg>
                                                🤖 AI Career Recommendations
                                            </h3>
                                            <ul className="space-y-3">
                                                {results.recommendations.map((rec, idx) => (
                                                    <li key={idx} className="flex items-start gap-3 text-gray-700">
                                                        <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                        <span className="leading-relaxed">{rec}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {filteredJobs.length > 0 ? (
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                                🎯 {filteredJobs.length} Matching Jobs Found
                                            </h3>
                                            {filteredJobs.map((job) => (
                                                <div
                                                    key={job.id}
                                                    className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all bg-white cursor-pointer"
                                                    onClick={() => viewJobDetails(job.id)}
                                                >
                                                    {/* Match Score */}
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex-1">
                                                            <h4 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600">
                                                                {job.title}
                                                            </h4>
                                                            <p className="text-gray-600 flex items-center gap-2 mb-2">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                                </svg>
                                                                {job.company}
                                                            </p>
                                                            <p className="text-gray-500 flex items-center gap-2">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                {job.location}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                                                                Math.round(job.matchScore) >= 80 ? 'bg-green-100 text-green-800' :
                                                                Math.round(job.matchScore) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                                Math.round(job.matchScore) >= 40 ? 'bg-orange-100 text-orange-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {Math.round(job.matchScore)}% Match
                                                            </div>
                                                            {job.source && (
                                                                <p className="text-xs text-gray-500 mt-2">{job.source}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Brief Description */}
                                                    {job.description && job.description !== 'No description available' && (
                                                        <p className="text-gray-700 mb-4 leading-relaxed line-clamp-2">
                                                            {stripHtml(job.description)}
                                                        </p>
                                                    )}

                                                    {/* Quick Summary */}
                                                    {job.recommendation && (
                                                        <div className="mb-4">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                                job.recommendation === 'Excellent Match' ? 'bg-green-100 text-green-800' :
                                                                job.recommendation === 'Strong Match' ? 'bg-blue-100 text-blue-800' :
                                                                job.recommendation === 'Good Match' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                🤖 {job.recommendation}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* View Details Button */}
                                                    <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm flex items-center gap-1">
                                                        View Full Analysis
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-gray-600 font-medium mb-2">No matching jobs found</p>
                                            <p className="text-sm text-gray-500">Try uploading a different resume or check back later</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
