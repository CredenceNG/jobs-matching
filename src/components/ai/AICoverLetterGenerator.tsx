/**
 * AI Cover Letter Generator Component
 * 
 * Interactive component for AI-powered cover letter generation.
 * Creates personalized cover letters based on job descriptions and user profiles.
 * 
 * @description Cover letter generation, editing, and optimization
 */

'use client';

import { useState, useEffect } from 'react';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface JobDetails {
    title: string;
    company: string;
    description: string;
    requirements: string[];
    location?: string;
    salary?: string;
    url?: string;
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
}

interface CoverLetterOptions {
    tone: 'professional' | 'enthusiastic' | 'conversational' | 'formal';
    length: 'concise' | 'standard' | 'detailed';
    focus: 'experience' | 'skills' | 'achievements' | 'education' | 'passion';
    includePersonalStory: boolean;
    emphasizeKeywords: boolean;
}

interface GeneratedCoverLetter {
    content: string;
    keyPoints: string[];
    matchingSkills: string[];
    improvements: string[];
    wordCount: number;
    readabilityScore: number;
}

interface AICoverLetterGeneratorProps {
    initialJobDetails?: JobDetails;
    initialUserProfile?: UserProfile;
    onCoverLetterGenerated?: (coverLetter: GeneratedCoverLetter) => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AICoverLetterGenerator({
    initialJobDetails,
    initialUserProfile,
    onCoverLetterGenerated,
}: AICoverLetterGeneratorProps) {
    const [activeStep, setActiveStep] = useState(1);
    const [jobDetails, setJobDetails] = useState<JobDetails>(
        initialJobDetails || {
            title: '',
            company: '',
            description: '',
            requirements: [],
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
        }
    );
    const [options, setOptions] = useState<CoverLetterOptions>({
        tone: 'professional',
        length: 'standard',
        focus: 'experience',
        includePersonalStory: false,
        emphasizeKeywords: true,
    });
    const [generatedLetter, setGeneratedLetter] = useState<GeneratedCoverLetter | null>(null);
    const [editedContent, setEditedContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load user profile from localStorage on mount
    useEffect(() => {
        if (!initialUserProfile) {
            const savedProfile = localStorage.getItem('jobai_user_profile');
            if (savedProfile) {
                try {
                    setUserProfile(JSON.parse(savedProfile));
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

    const generateCoverLetter = async () => {
        if (!jobDetails.title || !jobDetails.company || !userProfile.name) {
            setError('Please fill in the required job and profile information');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai/cover-letter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jobDetails,
                    userProfile,
                    options,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Cover letter generation failed');
            }

            const result = await response.json();
            setGeneratedLetter(result);
            setEditedContent(result.content);
            setActiveStep(4);

            // Notify parent component
            onCoverLetterGenerated?.(result);
        } catch (err) {
            console.error('Cover letter generation error:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while generating the cover letter');
        } finally {
            setLoading(false);
        }
    };

    const addRequirement = () => {
        setJobDetails(prev => ({
            ...prev,
            requirements: [...prev.requirements, ''],
        }));
    };

    const updateRequirement = (index: number, value: string) => {
        setJobDetails(prev => ({
            ...prev,
            requirements: prev.requirements.map((req, i) => (i === index ? value : req)),
        }));
    };

    const removeRequirement = (index: number) => {
        setJobDetails(prev => ({
            ...prev,
            requirements: prev.requirements.filter((_, i) => i !== index),
        }));
    };

    const downloadCoverLetter = () => {
        const content = editedContent || generatedLetter?.content || '';
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cover-letter-${jobDetails.company}-${jobDetails.title}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = async () => {
        const content = editedContent || generatedLetter?.content || '';
        try {
            await navigator.clipboard.writeText(content);
            // Could add a toast notification here
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

    // Step 1: Job Details
    const JobDetailsStep = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Job Information</h3>

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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Key Requirements
                    </label>
                    <div className="space-y-2">
                        {jobDetails.requirements.map((req, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={req}
                                    onChange={(e) => updateRequirement(index, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., 5+ years of React experience"
                                />
                                <button
                                    onClick={() => removeRequirement(index)}
                                    className="p-2 text-red-500 hover:text-red-700"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={addRequirement}
                            className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Requirement
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Step 2: User Profile
    const UserProfileStep = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Profile</h3>

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
                        Key Skills (comma-separated)
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

    // Step 3: Customization Options
    const OptionsStep = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Customize Your Cover Letter</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Tone
                        </label>
                        <div className="space-y-2">
                            {[
                                { value: 'professional', label: 'Professional', desc: 'Formal and business-appropriate' },
                                { value: 'enthusiastic', label: 'Enthusiastic', desc: 'Energetic and passionate' },
                                { value: 'conversational', label: 'Conversational', desc: 'Friendly and approachable' },
                                { value: 'formal', label: 'Formal', desc: 'Very structured and traditional' },
                            ].map((tone) => (
                                <label key={tone.value} className="flex items-start cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tone"
                                        value={tone.value}
                                        checked={options.tone === tone.value}
                                        onChange={(e) => setOptions(prev => ({ ...prev, tone: e.target.value as any }))}
                                        className="mt-1 mr-3"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900">{tone.label}</div>
                                        <div className="text-sm text-gray-600">{tone.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Length
                        </label>
                        <div className="space-y-2">
                            {[
                                { value: 'concise', label: 'Concise', desc: '2-3 short paragraphs' },
                                { value: 'standard', label: 'Standard', desc: '3-4 medium paragraphs' },
                                { value: 'detailed', label: 'Detailed', desc: '4-5 comprehensive paragraphs' },
                            ].map((length) => (
                                <label key={length.value} className="flex items-start cursor-pointer">
                                    <input
                                        type="radio"
                                        name="length"
                                        value={length.value}
                                        checked={options.length === length.value}
                                        onChange={(e) => setOptions(prev => ({ ...prev, length: e.target.value as any }))}
                                        className="mt-1 mr-3"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900">{length.label}</div>
                                        <div className="text-sm text-gray-600">{length.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Focus Area
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                            { value: 'experience', label: 'Work Experience' },
                            { value: 'skills', label: 'Technical Skills' },
                            { value: 'achievements', label: 'Key Achievements' },
                            { value: 'education', label: 'Education' },
                            { value: 'passion', label: 'Passion & Motivation' },
                        ].map((focus) => (
                            <label key={focus.value} className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="focus"
                                    value={focus.value}
                                    checked={options.focus === focus.value}
                                    onChange={(e) => setOptions(prev => ({ ...prev, focus: e.target.value as any }))}
                                    className="mr-2"
                                />
                                <span className="text-sm font-medium text-gray-900">{focus.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={options.includePersonalStory}
                            onChange={(e) => setOptions(prev => ({ ...prev, includePersonalStory: e.target.checked }))}
                            className="mr-3"
                        />
                        <div>
                            <div className="font-medium text-gray-900">Include Personal Story</div>
                            <div className="text-sm text-gray-600">Add a brief personal connection to the company or role</div>
                        </div>
                    </label>

                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={options.emphasizeKeywords}
                            onChange={(e) => setOptions(prev => ({ ...prev, emphasizeKeywords: e.target.checked }))}
                            className="mr-3"
                        />
                        <div>
                            <div className="font-medium text-gray-900">Emphasize Keywords</div>
                            <div className="text-sm text-gray-600">Include relevant keywords from the job description</div>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );

    // Step 4: Generated Cover Letter
    const GeneratedStep = () => {
        if (!generatedLetter) return null;

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Your AI-Generated Cover Letter</h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={copyToClipboard}
                            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            📋 Copy
                        </button>
                        <button
                            onClick={downloadCoverLetter}
                            className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                            📁 Download
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{generatedLetter.wordCount}</div>
                        <div className="text-sm text-gray-600">Words</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{generatedLetter.matchingSkills.length}</div>
                        <div className="text-sm text-gray-600">Matching Skills</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{generatedLetter.readabilityScore}%</div>
                        <div className="text-sm text-gray-600">Readability</div>
                    </div>
                </div>

                {/* Editable Content */}
                <div>
                    <label htmlFor="coverLetterContent" className="block text-sm font-medium text-gray-700 mb-2">
                        Cover Letter Content
                    </label>
                    <textarea
                        id="coverLetterContent"
                        rows={16}
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm leading-relaxed"
                    />
                </div>

                {/* Key Points */}
                {generatedLetter.keyPoints.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Key Points Highlighted</h4>
                        <ul className="space-y-1">
                            {generatedLetter.keyPoints.map((point, index) => (
                                <li key={index} className="text-sm text-blue-800 flex items-start">
                                    <span className="text-blue-500 mr-2">•</span>
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Matching Skills */}
                {generatedLetter.matchingSkills.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-medium text-green-900 mb-2">Skills Matched from Job Requirements</h4>
                        <div className="flex flex-wrap gap-2">
                            {generatedLetter.matchingSkills.map((skill, index) => (
                                <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Improvements */}
                {generatedLetter.improvements.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-900 mb-2">Suggestions for Enhancement</h4>
                        <ul className="space-y-1">
                            {generatedLetter.improvements.map((improvement, index) => (
                                <li key={index} className="text-sm text-yellow-800 flex items-start">
                                    <span className="text-yellow-600 mr-2">💡</span>
                                    {improvement}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm">
            {/* Progress Steps */}
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center space-x-4">
                    {[
                        { step: 1, label: 'Job Details' },
                        { step: 2, label: 'Your Profile' },
                        { step: 3, label: 'Customize' },
                        { step: 4, label: 'Generated' },
                    ].map((item, index) => (
                        <div key={item.step} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${activeStep >= item.step
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                    }`}
                            >
                                {activeStep > item.step ? '✓' : item.step}
                            </div>
                            <span className={`ml-2 text-sm font-medium ${activeStep >= item.step ? 'text-blue-600' : 'text-gray-500'
                                }`}>
                                {item.label}
                            </span>
                            {index < 3 && (
                                <div className={`ml-4 w-8 h-0.5 transition-colors ${activeStep > item.step ? 'bg-blue-600' : 'bg-gray-200'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
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
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Next
                        </button>
                    ) : activeStep === 3 ? (
                        <button
                            onClick={generateCoverLetter}
                            disabled={loading || !jobDetails.title || !jobDetails.company || !userProfile.name}
                            className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    Generating...
                                </div>
                            ) : (
                                '✨ Generate Cover Letter'
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                setActiveStep(1);
                                setGeneratedLetter(null);
                                setEditedContent('');
                                setError(null);
                            }}
                            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                            Create Another
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}