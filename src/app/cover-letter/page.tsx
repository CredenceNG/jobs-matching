/**
 * Cover Letter Generator Page
 *
 * AI-powered cover letter generation using Claude
 * Pulls together user's resume and job details to create personalized cover letters
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CoverLetterPage() {
    const router = useRouter();
    const [isGenerating, setIsGenerating] = useState(true);
    const [coverLetter, setCoverLetter] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [jobDetails, setJobDetails] = useState<any>(null);

    useEffect(() => {
        const generateCoverLetter = async () => {
            try {
                // Get data from sessionStorage
                const jobData = sessionStorage.getItem('currentJob');
                const analysisData = sessionStorage.getItem('resumeAnalysis');

                if (!jobData || !analysisData) {
                    setError('Missing job or resume data. Please go back and select a job.');
                    setIsGenerating(false);
                    return;
                }

                const job = JSON.parse(jobData);
                const analysis = JSON.parse(analysisData);
                setJobDetails(job);

                // Call API to generate cover letter
                const response = await fetch('/api/ai/cover-letter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jobDetails: job,
                        resumeAnalysis: analysis,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to generate cover letter');
                }

                const data = await response.json();
                setCoverLetter(data.coverLetter);
            } catch (err: any) {
                console.error('Error generating cover letter:', err);
                setError(err.message || 'Failed to generate cover letter');
            } finally {
                setIsGenerating(false);
            }
        };

        generateCoverLetter();
    }, []);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(coverLetter);
            alert('Cover letter copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([coverLetter], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cover-letter-${jobDetails?.company || 'job'}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

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
                                Back
                            </button>
                            <Link
                                href="/dashboard"
                                className="text-sm text-gray-700 hover:text-blue-600 transition-colors font-medium"
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/resume"
                                className="text-sm text-gray-700 hover:text-blue-600 transition-colors font-medium"
                            >
                                Resume Tailor
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-24 pb-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            ✨ AI Cover Letter <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Draft</span>
                        </h1>
                        {jobDetails && (
                            <p className="text-lg text-gray-600">
                                For <span className="font-semibold">{jobDetails.title}</span> at <span className="font-semibold">{jobDetails.company}</span>
                            </p>
                        )}
                    </div>

                    {/* Loading State */}
                    {isGenerating && (
                        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                            <div className="animate-spin h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Claude AI is drafting your cover letter...</h3>
                            <p className="text-gray-600">
                                Analyzing your resume and job requirements to create a personalized letter
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isGenerating && (
                        <div className="bg-white rounded-2xl shadow-xl p-8">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Generate Cover Letter</h3>
                                <p className="text-gray-600 mb-6">{error}</p>
                                <button
                                    onClick={() => router.back()}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                                >
                                    Go Back
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Success State */}
                    {coverLetter && !isGenerating && (
                        <div className="space-y-6">
                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={handleCopy}
                                    className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download
                                </button>
                            </div>

                            {/* Cover Letter Content */}
                            <div className="bg-white rounded-2xl shadow-xl p-8">
                                <div className="prose max-w-none">
                                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                                        {coverLetter}
                                    </div>
                                </div>
                            </div>

                            {/* Tips */}
                            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    💡 Next Steps
                                </h4>
                                <ul className="space-y-2 text-sm text-blue-800">
                                    <li className="flex items-start gap-2">
                                        <span>•</span>
                                        <span>Review and personalize the letter with specific examples from your experience</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span>•</span>
                                        <span>Adjust the tone to match the company culture</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span>•</span>
                                        <span>Add any company-specific research or connections you may have</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
