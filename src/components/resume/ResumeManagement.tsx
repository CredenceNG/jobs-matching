'use client';

import React, { useState } from 'react';
import {
    Upload,
    Eye,
    BarChart3,
    Wand2,
    FileText,
    AlertCircle,
    CheckCircle,
    Plus
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { ResumeUpload } from './ResumeUpload';
import { ResumeViewer } from './ResumeViewer';
import { ResumeAnalysis } from './ResumeAnalysis';
import { ResumeOptimization } from './ResumeOptimization';
import { ParsedResume } from '@/types/resume';
import { cn } from '@/lib/utils/cn';

// Simplified analysis result type for this component
interface SimpleAnalysisResult {
    overallScore: number;
    sections: SectionAnalysis[];
    atsCompatibility: {
        score: number;
        issues: string[];
        strengths: string[];
    };
    keywordAnalysis: {
        matchedKeywords: string[];
        missingKeywords: string[];
        suggestions: string[];
    };
    strengths: string[];
    weaknesses: string[];
}

interface SectionAnalysis {
    section: string;
    score: number;
    present: boolean;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    feedback: string;
}

const ResumeManagement: React.FC = () => {
    const [currentResume, setCurrentResume] = useState<ParsedResume | null>(null);
    const [analysisResult, setAnalysisResult] = useState<SimpleAnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState('upload');

    // Mock data for demonstration
    const mockOptimizationSuggestions = [
        {
            id: '1',
            type: 'keywords' as const,
            priority: 'high' as const,
            section: 'work-experience',
            title: 'Add Industry Keywords',
            description: 'Your resume is missing key industry keywords that ATS systems look for. Adding these will improve your match rate.',
            before: 'Developed web applications using modern frameworks',
            after: 'Developed responsive web applications using React, Node.js, and TypeScript with modern CI/CD pipelines',
            impact: 'Could increase ATS match rate by 25%',
        },
        {
            id: '2',
            type: 'content' as const,
            priority: 'high' as const,
            section: 'work-experience',
            title: 'Quantify Your Achievements',
            description: 'Add specific metrics and numbers to demonstrate your impact and results.',
            before: 'Improved system performance and user experience',
            after: 'Improved system performance by 40% and enhanced user experience, resulting in 25% increase in user engagement',
            impact: 'Makes achievements more compelling and measurable',
        }
    ];

    const handleResumeUpload = () => {
        // Mock parsing - in real app, this would parse the file
        const mockResume: ParsedResume = {
            id: 'mock-resume-1',
            fileName: 'john_doe_resume.pdf',
            fileSize: 245760,
            uploadedAt: new Date(),
            lastModified: new Date(),
            personalInfo: {
                name: 'John Doe',
                email: 'john.doe@email.com',
                phone: '+1 (555) 123-4567',
                location: 'San Francisco, CA',
                linkedin: 'linkedin.com/in/johndoe',
                github: 'github.com/johndoe'
            },
            experience: [
                {
                    id: '1',
                    position: 'Senior Software Engineer',
                    company: 'Tech Corp',
                    location: 'San Francisco, CA',
                    startDate: new Date('2021-01-01'),
                    endDate: new Date('2024-01-01'),
                    isCurrent: false,
                    description: ['Led development of web applications'],
                    achievements: ['Improved performance by 40%', 'Mentored 5 junior developers']
                }
            ],
            education: [
                {
                    id: '1',
                    degree: 'Bachelor of Science',
                    field: 'Computer Science',
                    institution: 'University of California',
                    startDate: new Date('2016-09-01'),
                    endDate: new Date('2020-05-01'),
                    gpa: 3.8
                }
            ],
            skills: [
                { id: '1', name: 'JavaScript', category: 'technical', level: 'expert' as const },
                { id: '2', name: 'React', category: 'technical', level: 'expert' as const }
            ],
            projects: [],
            certifications: [],
            languages: [
                { id: '1', name: 'English', proficiency: 'native' as const },
                { id: '2', name: 'Spanish', proficiency: 'conversational' as const }
            ]
        };

        setCurrentResume(mockResume);
        setActiveTab('view');

        // Simulate analysis
        setTimeout(() => {
            setAnalysisResult({
                overallScore: 78,
                sections: [
                    {
                        section: 'Personal Info',
                        score: 85,
                        present: true,
                        quality: 'good' as const,
                        feedback: 'Contact information is complete and professional'
                    },
                    {
                        section: 'Work Experience',
                        score: 75,
                        present: true,
                        quality: 'good' as const,
                        feedback: 'Good experience but could use more quantifiable achievements'
                    },
                    {
                        section: 'Education',
                        score: 80,
                        present: true,
                        quality: 'good' as const,
                        feedback: 'Relevant degree with good GPA'
                    },
                    {
                        section: 'Skills',
                        score: 70,
                        present: true,
                        quality: 'fair' as const,
                        feedback: 'Technical skills are relevant but could be more comprehensive'
                    }
                ],
                strengths: [
                    'Strong technical background',
                    'Progressive career growth',
                    'Relevant education credentials'
                ],
                weaknesses: [
                    'Missing quantifiable achievements',
                    'Limited industry keywords',
                    'Could improve project descriptions'
                ],
                atsCompatibility: {
                    score: 72,
                    issues: [
                        'Missing keywords for target role',
                        'Some sections could be better structured',
                        'Contact information format could be improved'
                    ],
                    strengths: [
                        'Clean formatting and layout',
                        'Appropriate length',
                        'Good use of action verbs'
                    ]
                },
                keywordAnalysis: {
                    matchedKeywords: ['React', 'JavaScript', 'Python', 'AWS'],
                    missingKeywords: ['TypeScript', 'Docker', 'Kubernetes', 'CI/CD'],
                    suggestions: ['Add cloud computing experience', 'Include more technical certifications']
                }
            });
        }, 2000);
    };

    const handleAnalyzeResume = () => {
        if (!currentResume) return;

        setIsAnalyzing(true);
        setActiveTab('analysis');

        // Simulate analysis
        setTimeout(() => {
            setIsAnalyzing(false);
            // Analysis result is already set from upload
        }, 3000);
    };

    const getTabIcon = (tab: string) => {
        switch (tab) {
            case 'upload':
                return <Upload className="h-4 w-4" />;
            case 'view':
                return <Eye className="h-4 w-4" />;
            case 'analysis':
                return <BarChart3 className="h-4 w-4" />;
            case 'optimization':
                return <Wand2 className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Resume Management
                    </h1>
                    <p className="text-gray-600">
                        Upload, analyze, and optimize your resume with AI-powered insights
                    </p>
                </div>

                {/* Status Overview */}
                {currentResume && (
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <FileText className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {currentResume.personalInfo.name}'s Resume
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Professional Resume
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {analysisResult && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                {analysisResult.overallScore >= 80 ? (
                                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                                                )}
                                                <span className={`font-semibold ${getScoreColor(analysisResult.overallScore)}`}>
                                                    {analysisResult.overallScore}/100
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-500">Overall Score</span>
                                        </div>
                                    )}

                                    <Button
                                        variant="outline"
                                        onClick={handleAnalyzeResume}
                                        disabled={isAnalyzing}
                                        className="flex items-center gap-2"
                                    >
                                        <BarChart3 className="h-4 w-4" />
                                        {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Content */}
                <TabsPrimitive.Root value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsPrimitive.List className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-gray-100 rounded-lg p-1">
                        <TabsPrimitive.Trigger value="upload" className="flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Upload className="w-4 h-4" />
                            Upload
                        </TabsPrimitive.Trigger>
                        <TabsPrimitive.Trigger
                            value="view"
                            disabled={!currentResume}
                            className={cn(
                                "flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white data-[state=active]:bg-white data-[state=active]:shadow-sm",
                                !currentResume && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <Eye className="w-4 h-4" />
                            View
                        </TabsPrimitive.Trigger>
                        <TabsPrimitive.Trigger
                            value="analysis"
                            disabled={!currentResume}
                            className={cn(
                                "flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white data-[state=active]:bg-white data-[state=active]:shadow-sm",
                                !currentResume && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <BarChart3 className="w-4 h-4" />
                            Analysis
                        </TabsPrimitive.Trigger>
                        <TabsPrimitive.Trigger
                            value="optimization"
                            disabled={!currentResume}
                            className={cn(
                                "flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white data-[state=active]:bg-white data-[state=active]:shadow-sm",
                                !currentResume && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <Wand2 className="w-4 h-4" />
                            Optimize
                        </TabsPrimitive.Trigger>
                    </TabsPrimitive.List>

                    <TabsPrimitive.Content value="upload" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Upload className="h-5 w-5" />
                                    Upload Your Resume
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResumeUpload onUploadComplete={handleResumeUpload} />
                            </CardContent>
                        </Card>

                        {/* Recent Resumes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Resumes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-gray-500">
                                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No recent resumes found.</p>
                                    <p className="text-sm">Upload your first resume to get started.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsPrimitive.Content>

                    <TabsPrimitive.Content value="view" className="space-y-6">
                        {currentResume ? (
                            <ResumeViewer resume={currentResume} />
                        ) : (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <Upload className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                                        No Resume Uploaded
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        Upload a resume to view and analyze its content.
                                    </p>
                                    <Button onClick={() => setActiveTab('upload')}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Upload Resume
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsPrimitive.Content>

                    <TabsPrimitive.Content value="analysis" className="space-y-6">
                        {analysisResult ? (
                            <ResumeAnalysis
                                analysis={analysisResult as any}
                            />
                        ) : (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                                        Resume Analysis Not Available
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        Upload a resume and run analysis to see detailed insights.
                                    </p>
                                    <Button
                                        onClick={handleAnalyzeResume}
                                        disabled={!currentResume}
                                    >
                                        <BarChart3 className="h-4 w-4 mr-2" />
                                        Analyze Resume
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsPrimitive.Content>

                    <TabsPrimitive.Content value="optimization" className="space-y-6">
                        {analysisResult ? (
                            <ResumeOptimization
                                suggestions={mockOptimizationSuggestions}
                                onApplySuggestion={(id) => console.log('Applied suggestion:', id)}
                                onRejectSuggestion={(id) => console.log('Rejected suggestion:', id)}
                            />
                        ) : (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <Wand2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                                        Optimization Not Available
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        Complete resume analysis first to get personalized optimization suggestions.
                                    </p>
                                    <Button
                                        onClick={() => setActiveTab('analysis')}
                                        disabled={!currentResume}
                                    >
                                        <BarChart3 className="h-4 w-4 mr-2" />
                                        Run Analysis First
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsPrimitive.Content>
                </TabsPrimitive.Root>
            </div>
        </div>
    );
};

export default ResumeManagement;