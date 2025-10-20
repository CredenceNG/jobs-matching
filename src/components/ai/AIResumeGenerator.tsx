/**
 * AI Resume Generator Component
 *
 * Interactive component for AI-powered resume optimization.
 * Creates job-tailored resumes that increase chances of getting hired.
 *
 * @description Resume generation with ATS scoring, keyword matching, and formatting options
 */

'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Copy, Check, AlertCircle, Sparkles } from 'lucide-react';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface JobDetails {
    id?: string;
    title: string;
    company: string;
    description: string;
    requirements: string[];
    skills?: string[];
    location?: string;
    salary?: string;
}

interface UserProfile {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    summary: string;
    skills: string[];
    experience: Array<{
        title: string;
        company: string;
        duration: string;
        achievements: string[];
    }>;
    education: Array<{
        degree: string;
        institution: string;
        year: string;
    }>;
    certifications?: string[];
    projects?: Array<{
        name: string;
        description: string;
        technologies: string[];
    }>;
}

type ResumeFormat = 'ats-friendly' | 'modern' | 'executive' | 'creative';

interface ResumeOptions {
    format: ResumeFormat;
    includeObjective: boolean;
    includeCertifications: boolean;
    includeProjects: boolean;
    emphasizeAchievements: boolean;
}

interface OptimizedResume {
    content: string;
    format: ResumeFormat;
    atsScore: number;
    keywordMatches: string[];
    optimizations: string[];
    suggestions: string[];
    wordCount: number;
    estimatedReadTime: number;
}

interface AIResumeGeneratorProps {
    initialJobDetails?: JobDetails;
    initialUserProfile?: UserProfile;
    onResumeGenerated?: (resume: OptimizedResume) => void;
    className?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AIResumeGenerator({
    initialJobDetails,
    initialUserProfile,
    onResumeGenerated,
    className = ''
}: AIResumeGeneratorProps) {
    const [activeStep, setActiveStep] = useState(1);
    const [jobDetails, setJobDetails] = useState<JobDetails>(
        initialJobDetails || {
            title: '',
            company: '',
            description: '',
            requirements: [],
            skills: [],
        }
    );
    const [userProfile, setUserProfile] = useState<UserProfile>(
        initialUserProfile || {
            name: '',
            email: '',
            summary: '',
            skills: [],
            experience: [],
            education: [],
            certifications: [],
            projects: [],
        }
    );
    const [options, setOptions] = useState<ResumeOptions>({
        format: 'ats-friendly',
        includeObjective: true,
        includeCertifications: true,
        includeProjects: false,
        emphasizeAchievements: true,
    });
    const [generatedResume, setGeneratedResume] = useState<OptimizedResume | null>(null);
    const [editedContent, setEditedContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Load user profile from localStorage on mount
    useEffect(() => {
        if (!initialUserProfile) {
            const savedProfile = localStorage.getItem('jobai_user_profile');
            if (savedProfile) {
                try {
                    const parsed = JSON.parse(savedProfile);
                    setUserProfile({
                        ...parsed,
                        certifications: parsed.certifications || [],
                        projects: parsed.projects || [],
                    });
                } catch (err) {
                    console.error('Failed to load saved profile:', err);
                }
            }
        }
    }, [initialUserProfile]);

    // Save user profile to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('jobai_user_profile', JSON.stringify(userProfile));
    }, [userProfile]);

    /**
     * Generate optimized resume using AI
     * Cost: 15 tokens per generation
     */
    const generateResume = async () => {
        if (!jobDetails.title || !jobDetails.company || !userProfile.name) {
            setError('Please fill in the required job and profile information');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai/resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jobDetails,
                    userProfile,
                    format: options.format,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Resume generation failed');
            }

            const result = await response.json();
            const resume = result.optimizedResume;

            setGeneratedResume(resume);
            setEditedContent(resume.content);
            setActiveStep(4);

            // Notify parent component
            onResumeGenerated?.(resume);
        } catch (err) {
            console.error('Resume generation error:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while generating the resume');
        } finally {
            setLoading(false);
        }
    };

    const downloadResume = () => {
        const content = editedContent || generatedResume?.content || '';
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resume-${jobDetails.company}-${jobDetails.title}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = async () => {
        const content = editedContent || generatedResume?.content || '';
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

    // Step 1: Job Details
    const JobDetailsStep = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
                            Job Title *
                        </label>
                        <input
                            id="jobTitle"
                            type="text"
                            value={jobDetails.title}
                            onChange={(e) => setJobDetails(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Senior Software Engineer"
                        />
                    </div>

                    <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                            Company *
                        </label>
                        <input
                            id="company"
                            type="text"
                            value={jobDetails.company}
                            onChange={(e) => setJobDetails(prev => ({ ...prev, company: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Google"
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-2">
                        Job Description
                    </label>
                    <textarea
                        id="jobDescription"
                        rows={6}
                        value={jobDetails.description}
                        onChange={(e) => setJobDetails(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Paste the job description here..."
                    />
                </div>

                <div>
                    <label htmlFor="requiredSkills" className="block text-sm font-medium text-gray-700 mb-2">
                        Required Skills (comma-separated)
                    </label>
                    <input
                        id="requiredSkills"
                        type="text"
                        value={jobDetails.skills?.join(', ') || ''}
                        onChange={(e) => setJobDetails(prev => ({
                            ...prev,
                            skills: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="React, Node.js, Python, AWS, etc."
                    />
                </div>
            </div>
        </div>
    );

    // Step 2: User Profile
    const UserProfileStep = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                        </label>
                        <input
                            id="userName"
                            type="text"
                            value={userProfile.name}
                            onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Your full name"
                        />
                    </div>

                    <div>
                        <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            id="userEmail"
                            type="email"
                            value={userProfile.email}
                            onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="your.email@example.com"
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label htmlFor="userSummary" className="block text-sm font-medium text-gray-700 mb-2">
                        Professional Summary
                    </label>
                    <textarea
                        id="userSummary"
                        rows={4}
                        value={userProfile.summary}
                        onChange={(e) => setUserProfile(prev => ({ ...prev, summary: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Brief summary of your professional background and key strengths..."
                    />
                </div>

                <div>
                    <label htmlFor="userSkills" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Skills (comma-separated)
                    </label>
                    <input
                        id="userSkills"
                        type="text"
                        value={userProfile.skills.join(', ')}
                        onChange={(e) => setUserProfile(prev => ({
                            ...prev,
                            skills: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="React, Node.js, Python, Project Management, etc."
                    />
                </div>
            </div>
        </div>
    );

    // Step 3: Format Options
    const OptionsStep = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customize Your Resume</h3>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Resume Format
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            {
                                value: 'ats-friendly',
                                label: 'ATS-Friendly',
                                desc: 'Optimized for Applicant Tracking Systems',
                                icon: '📄',
                                recommended: true
                            },
                            {
                                value: 'modern',
                                label: 'Modern',
                                desc: 'Clean, contemporary design',
                                icon: '✨'
                            },
                            {
                                value: 'executive',
                                label: 'Executive',
                                desc: 'Professional senior-level format',
                                icon: '👔'
                            },
                            {
                                value: 'creative',
                                label: 'Creative',
                                desc: 'Bold design for creative roles',
                                icon: '🎨'
                            },
                        ].map((format) => (
                            <label
                                key={format.value}
                                className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                    options.format === format.value
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="format"
                                    value={format.value}
                                    checked={options.format === format.value}
                                    onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as ResumeFormat }))}
                                    className="sr-only"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center mb-1">
                                        <span className="text-2xl mr-2">{format.icon}</span>
                                        <span className="font-medium text-gray-900">{format.label}</span>
                                        {format.recommended && (
                                            <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                                                Recommended
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600">{format.desc}</p>
                                </div>
                                {options.format === format.value && (
                                    <Check className="h-5 w-5 text-blue-600 absolute top-4 right-4" />
                                )}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Additional Options
                    </label>

                    {[
                        {
                            key: 'includeObjective',
                            label: 'Include Career Objective',
                            desc: 'Add a brief career objective statement'
                        },
                        {
                            key: 'includeCertifications',
                            label: 'Include Certifications',
                            desc: 'Highlight relevant certifications and licenses'
                        },
                        {
                            key: 'includeProjects',
                            label: 'Include Projects',
                            desc: 'Showcase relevant projects and portfolio work'
                        },
                        {
                            key: 'emphasizeAchievements',
                            label: 'Emphasize Achievements',
                            desc: 'Focus on quantifiable results and accomplishments'
                        },
                    ].map((option) => (
                        <label key={option.key} className="flex items-start cursor-pointer p-3 rounded-lg hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={options[option.key as keyof ResumeOptions] as boolean}
                                onChange={(e) => setOptions(prev => ({ ...prev, [option.key]: e.target.checked }))}
                                className="mt-1 mr-3"
                            />
                            <div>
                                <div className="font-medium text-gray-900">{option.label}</div>
                                <div className="text-sm text-gray-600">{option.desc}</div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );

    // Step 4: Generated Resume
    const GeneratedStep = () => {
        if (!generatedResume) return null;

        const getATSScoreColor = (score: number) => {
            if (score >= 80) return 'text-green-600';
            if (score >= 60) return 'text-yellow-600';
            return 'text-red-600';
        };

        const getATSScoreLabel = (score: number) => {
            if (score >= 80) return 'Excellent';
            if (score >= 60) return 'Good';
            return 'Needs Improvement';
        };

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Your AI-Optimized Resume</h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={copyToClipboard}
                            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                            onClick={downloadResume}
                            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Download
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                        <div className={`text-3xl font-bold ${getATSScoreColor(generatedResume.atsScore)}`}>
                            {generatedResume.atsScore}%
                        </div>
                        <div className="text-sm text-gray-700 font-medium mt-1">ATS Score</div>
                        <div className="text-xs text-gray-600 mt-0.5">{getATSScoreLabel(generatedResume.atsScore)}</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-green-600">{generatedResume.keywordMatches.length}</div>
                        <div className="text-sm text-gray-700 font-medium mt-1">Keywords</div>
                        <div className="text-xs text-gray-600 mt-0.5">Matched</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-purple-600">{generatedResume.wordCount}</div>
                        <div className="text-sm text-gray-700 font-medium mt-1">Words</div>
                        <div className="text-xs text-gray-600 mt-0.5">Total</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-orange-600">{generatedResume.estimatedReadTime}</div>
                        <div className="text-sm text-gray-700 font-medium mt-1">Minutes</div>
                        <div className="text-xs text-gray-600 mt-0.5">Read Time</div>
                    </div>
                </div>

                {/* Editable Content */}
                <div>
                    <label htmlFor="resumeContent" className="block text-sm font-medium text-gray-700 mb-2">
                        Resume Content
                    </label>
                    <textarea
                        id="resumeContent"
                        rows={20}
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm leading-relaxed"
                    />
                </div>

                {/* Keyword Matches */}
                {generatedResume.keywordMatches.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                            <Check className="h-5 w-5 mr-2" />
                            Matched Keywords from Job Description
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {generatedResume.keywordMatches.map((keyword, index) => (
                                <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Key Optimizations */}
                {generatedResume.optimizations.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                            <Sparkles className="h-5 w-5 mr-2" />
                            Key Optimizations Applied
                        </h4>
                        <ul className="space-y-2">
                            {generatedResume.optimizations.map((opt, index) => (
                                <li key={index} className="text-sm text-blue-800 flex items-start">
                                    <span className="text-blue-500 mr-2">•</span>
                                    <span>{opt}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Suggestions */}
                {generatedResume.suggestions.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
                            <AlertCircle className="h-5 w-5 mr-2" />
                            Suggestions for Further Improvement
                        </h4>
                        <ul className="space-y-2">
                            {generatedResume.suggestions.map((suggestion, index) => (
                                <li key={index} className="text-sm text-yellow-800 flex items-start">
                                    <span className="text-yellow-600 mr-2">💡</span>
                                    <span>{suggestion}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm ${className}`}>
            {/* Progress Steps */}
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    {[
                        { step: 1, label: 'Job Details', icon: FileText },
                        { step: 2, label: 'Your Profile', icon: FileText },
                        { step: 3, label: 'Format', icon: Sparkles },
                        { step: 4, label: 'Generated', icon: Check },
                    ].map((item, index) => (
                        <div key={item.step} className="flex items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                                    activeStep >= item.step
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                }`}
                            >
                                {activeStep > item.step ? <Check className="h-5 w-5" /> : <item.icon className="h-5 w-5" />}
                            </div>
                            <span className={`ml-2 text-sm font-medium hidden md:inline ${
                                activeStep >= item.step ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                                {item.label}
                            </span>
                            {index < 3 && (
                                <div className={`ml-4 w-12 md:w-20 h-0.5 transition-colors ${
                                    activeStep > item.step ? 'bg-blue-600' : 'bg-gray-200'
                                }`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {activeStep === 1 && <JobDetailsStep />}
                {activeStep === 2 && <UserProfileStep />}
                {activeStep === 3 && <OptionsStep />}
                {activeStep === 4 && <GeneratedStep />}
            </div>

            {/* Navigation */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
                <button
                    onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                    disabled={activeStep === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Previous
                </button>

                <div className="flex space-x-3">
                    {activeStep < 3 ? (
                        <button
                            onClick={() => setActiveStep(prev => prev + 1)}
                            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Next
                        </button>
                    ) : activeStep === 3 ? (
                        <button
                            onClick={generateResume}
                            disabled={loading || !jobDetails.title || !jobDetails.company || !userProfile.name}
                            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Generate Resume
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                setActiveStep(1);
                                setGeneratedResume(null);
                                setEditedContent('');
                                setError(null);
                            }}
                            className="px-6 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                            Create Another
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
