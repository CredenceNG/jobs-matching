/**
 * AI Resume Analysis Component
 * 
 * Interactive component for AI-powered resume parsing and analysis.
 * Allows users to upload resumes and get detailed feedback.
 * 
 * @description Resume upload, parsing, and optimization suggestions
 */

'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface ParsedResume {
    personalInfo: {
        name: string;
        email: string;
        phone: string;
        location: string;
        linkedIn?: string;
        github?: string;
        website?: string;
    };
    summary: string;
    skills: {
        technical: string[];
        soft: string[];
        languages: string[];
        certifications: string[];
    };
    experience: Array<{
        title: string;
        company: string;
        location: string;
        startDate: string;
        endDate: string;
        current: boolean;
        description: string;
        achievements: string[];
        technologies: string[];
    }>;
    education: Array<{
        degree: string;
        institution: string;
        location: string;
        graduationDate: string;
        gpa?: string;
        relevantCourses: string[];
        achievements: string[];
    }>;
    projects: Array<{
        name: string;
        description: string;
        technologies: string[];
        url?: string;
        startDate?: string;
        endDate?: string;
    }>;
    achievements: string[];
    keywords: string[];
}

interface ResumeAnalysis {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    improvements: {
        content: string[];
        formatting: string[];
        keywords: string[];
    };
    atsCompatibility: {
        score: number;
        issues: string[];
        recommendations: string[];
    };
    industryAlignment: {
        bestFit: string[];
        suggestions: string[];
    };
}

interface AIResumeAnalysisProps {
    onResumeAnalyzed?: (parsed: ParsedResume, analysis: ResumeAnalysis) => void;
    targetIndustry?: string;
    targetRole?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AIResumeAnalysis({
    onResumeAnalyzed,
    targetIndustry,
    targetRole,
}: AIResumeAnalysisProps) {
    const [resumeText, setResumeText] = useState('');
    const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
    const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'upload' | 'results' | 'analysis'>('upload');

    // File upload handling
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setResumeText(text);
                // Auto-analyze after upload
                analyzeResume(text);
            };
            reader.readAsText(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/plain': ['.txt'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        multiple: false,
    });

    const analyzeResume = async (text?: string) => {
        const textToAnalyze = text || resumeText;
        if (!textToAnalyze.trim()) {
            setError('Please provide resume text to analyze');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai/resume-parsing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resumeText: textToAnalyze,
                    options: {
                        includeAnalysis: true,
                        targetIndustry,
                        targetRole,
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Resume analysis failed');
            }

            const result = await response.json();
            setParsedResume(result.parsed);
            setAnalysis(result.analysis);
            setActiveTab('results');

            // Notify parent component
            onResumeAnalyzed?.(result.parsed, result.analysis);
        } catch (err) {
            console.error('Resume analysis error:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while analyzing the resume');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number): string => {
        if (score >= 0.8) return 'text-green-600';
        if (score >= 0.6) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBackground = (score: number): string => {
        if (score >= 0.8) return 'bg-green-500';
        if (score >= 0.6) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    // Upload Tab
    const UploadTab = () => (
        <div className="space-y-6">
            {/* File Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Upload Resume
                </label>
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragActive
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                        }`}
                >
                    <input {...getInputProps()} />
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    {isDragActive ? (
                        <p className="text-blue-600">Drop your resume here...</p>
                    ) : (
                        <div>
                            <p className="text-gray-600 mb-2">
                                Drag and drop your resume here, or click to select
                            </p>
                            <p className="text-sm text-gray-500">
                                Supports PDF, DOC, DOCX, and TXT files
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Text Input Alternative */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or paste resume text</span>
                </div>
            </div>

            <div>
                <label htmlFor="resumeText" className="block text-sm font-medium text-gray-700 mb-3">
                    Resume Text
                </label>
                <textarea
                    id="resumeText"
                    rows={12}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Paste your resume text here..."
                />
            </div>

            {/* Target Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="targetRole" className="block text-sm font-medium text-gray-700 mb-2">
                        Target Role (Optional)
                    </label>
                    <input
                        id="targetRole"
                        type="text"
                        value={targetRole || ''}
                        onChange={(e) => {
                            // This would need to be handled by parent component
                            console.log('Target role:', e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Senior Software Engineer"
                    />
                </div>
                <div>
                    <label htmlFor="targetIndustry" className="block text-sm font-medium text-gray-700 mb-2">
                        Target Industry (Optional)
                    </label>
                    <input
                        id="targetIndustry"
                        type="text"
                        value={targetIndustry || ''}
                        onChange={(e) => {
                            // This would need to be handled by parent component
                            console.log('Target industry:', e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Technology, Finance"
                    />
                </div>
            </div>

            {/* Analyze Button */}
            <button
                onClick={() => analyzeResume()}
                disabled={loading || !resumeText.trim()}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
                {loading ? (
                    <div className="flex items-center justify-center">
                        <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Analyzing Resume...
                    </div>
                ) : (
                    'Analyze Resume with AI'
                )}
            </button>
        </div>
    );

    // Results Tab
    const ResultsTab = () => {
        if (!parsedResume) return null;

        return (
            <div className="space-y-6">
                {/* Personal Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Name:</span>
                            <span className="ml-2 font-medium">{parsedResume.personalInfo.name || 'Not provided'}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Email:</span>
                            <span className="ml-2">{parsedResume.personalInfo.email || 'Not provided'}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Phone:</span>
                            <span className="ml-2">{parsedResume.personalInfo.phone || 'Not provided'}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Location:</span>
                            <span className="ml-2">{parsedResume.personalInfo.location || 'Not provided'}</span>
                        </div>
                    </div>
                </div>

                {/* Skills */}
                <div>
                    <h3 className="font-medium text-gray-900 mb-3">Skills</h3>
                    <div className="space-y-3">
                        {parsedResume.skills.technical.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Technical Skills</p>
                                <div className="flex flex-wrap gap-2">
                                    {parsedResume.skills.technical.map((skill, index) => (
                                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {parsedResume.skills.soft.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Soft Skills</p>
                                <div className="flex flex-wrap gap-2">
                                    {parsedResume.skills.soft.map((skill, index) => (
                                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Experience */}
                {parsedResume.experience.length > 0 && (
                    <div>
                        <h3 className="font-medium text-gray-900 mb-3">Experience</h3>
                        <div className="space-y-4">
                            {parsedResume.experience.map((exp, index) => (
                                <div key={index} className="border-l-2 border-blue-200 pl-4 pb-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{exp.title}</h4>
                                            <p className="text-gray-600">{exp.company}</p>
                                            <p className="text-sm text-gray-500">
                                                {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                                            </p>
                                        </div>
                                    </div>
                                    {exp.achievements.length > 0 && (
                                        <ul className="mt-2 text-sm text-gray-700">
                                            {exp.achievements.slice(0, 3).map((achievement, i) => (
                                                <li key={i} className="flex items-start mt-1">
                                                    <span className="text-blue-500 mr-2">•</span>
                                                    {achievement}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Education */}
                {parsedResume.education.length > 0 && (
                    <div>
                        <h3 className="font-medium text-gray-900 mb-3">Education</h3>
                        <div className="space-y-3">
                            {parsedResume.education.map((edu, index) => (
                                <div key={index} className="border-l-2 border-green-200 pl-4">
                                    <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                                    <p className="text-gray-600">{edu.institution}</p>
                                    <p className="text-sm text-gray-500">{edu.graduationDate}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Analysis Tab
    const AnalysisTab = () => {
        if (!analysis) return null;

        return (
            <div className="space-y-6">
                {/* Overall Score */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                    <div className="text-center">
                        <div className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)} mb-2`}>
                            {(analysis.overallScore * 100).toFixed(0)}%
                        </div>
                        <p className="text-gray-600">Overall Resume Score</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                            <div
                                className={`h-2 rounded-full ${getScoreBackground(analysis.overallScore)}`}
                                style={{ width: `${analysis.overallScore * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Strengths and Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-medium text-green-600 mb-3 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Strengths
                        </h3>
                        <ul className="space-y-2">
                            {analysis.strengths.map((strength, index) => (
                                <li key={index} className="flex items-start text-sm">
                                    <span className="text-green-500 mr-2">•</span>
                                    {strength}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-medium text-red-600 mb-3 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Areas for Improvement
                        </h3>
                        <ul className="space-y-2">
                            {analysis.weaknesses.map((weakness, index) => (
                                <li key={index} className="flex items-start text-sm">
                                    <span className="text-red-500 mr-2">•</span>
                                    {weakness}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* ATS Compatibility */}
                <div className="bg-yellow-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        ATS Compatibility Score: {(analysis.atsCompatibility.score * 100).toFixed(0)}%
                    </h3>

                    {analysis.atsCompatibility.issues.length > 0 && (
                        <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Issues Found:</p>
                            <ul className="space-y-1">
                                {analysis.atsCompatibility.issues.map((issue, index) => (
                                    <li key={index} className="text-sm text-gray-600 flex items-start">
                                        <span className="text-yellow-500 mr-2">⚠</span>
                                        {issue}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {analysis.atsCompatibility.recommendations.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
                            <ul className="space-y-1">
                                {analysis.atsCompatibility.recommendations.map((rec, index) => (
                                    <li key={index} className="text-sm text-gray-600 flex items-start">
                                        <span className="text-blue-500 mr-2">•</span>
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Improvement Suggestions */}
                <div>
                    <h3 className="font-medium text-gray-900 mb-4">Improvement Suggestions</h3>
                    <div className="space-y-4">
                        {analysis.improvements.content.length > 0 && (
                            <div className="bg-blue-50 rounded-lg p-4">
                                <h4 className="font-medium text-blue-800 mb-2">Content Improvements</h4>
                                <ul className="space-y-1">
                                    {analysis.improvements.content.map((improvement, index) => (
                                        <li key={index} className="text-sm text-blue-700 flex items-start">
                                            <span className="text-blue-500 mr-2">•</span>
                                            {improvement}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {analysis.improvements.keywords.length > 0 && (
                            <div className="bg-purple-50 rounded-lg p-4">
                                <h4 className="font-medium text-purple-800 mb-2">Keyword Optimization</h4>
                                <ul className="space-y-1">
                                    {analysis.improvements.keywords.map((keyword, index) => (
                                        <li key={index} className="text-sm text-purple-700 flex items-start">
                                            <span className="text-purple-500 mr-2">•</span>
                                            {keyword}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                    {[
                        { key: 'upload', label: 'Upload Resume', icon: '📄' },
                        { key: 'results', label: 'Parsed Data', icon: '🔍' },
                        { key: 'analysis', label: 'AI Analysis', icon: '🎯' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            disabled={tab.key !== 'upload' && !parsedResume}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.key
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {activeTab === 'upload' && <UploadTab />}
                {activeTab === 'results' && <ResultsTab />}
                {activeTab === 'analysis' && <AnalysisTab />}
            </div>
        </div>
    );
}