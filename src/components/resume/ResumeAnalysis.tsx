'use client';

import React from 'react';
import {
    BarChart3,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Target,
    Eye,
    Search,
    FileText,
    Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

interface ResumeAnalysisProps {
    analysis: AnalysisData;
    className?: string;
}

interface AnalysisData {
    overallScore: number;
    sections: SectionAnalysis[];
    strengths: string[];
    weaknesses: string[];
    atsCompatibility: ATSCompatibility;
    keywordAnalysis: KeywordAnalysis;
}

interface SectionAnalysis {
    section: string;
    score: number;
    present: boolean;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    feedback: string;
}

interface ATSCompatibility {
    score: number;
    issues: ATSIssue[];
}

interface ATSIssue {
    type: string;
    severity: 'critical' | 'warning' | 'info';
    description: string;
}

interface KeywordAnalysis {
    totalKeywords: number;
    industryKeywords: string[];
    missingKeywords: string[];
    keywordDensity: { [key: string]: number };
}

export const ResumeAnalysis: React.FC<ResumeAnalysisProps> = ({
    analysis,
    className
}) => {
    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-blue-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBackground = (score: number) => {
        if (score >= 90) return 'bg-green-100';
        if (score >= 70) return 'bg-blue-100';
        if (score >= 50) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    const getQualityIcon = (quality: string) => {
        switch (quality) {
            case 'excellent':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'good':
                return <CheckCircle className="h-5 w-5 text-blue-600" />;
            case 'fair':
                return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
            case 'poor':
                return <XCircle className="h-5 w-5 text-red-600" />;
            default:
                return <AlertTriangle className="h-5 w-5 text-gray-600" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'text-red-600 bg-red-50 border-red-200';
            case 'warning':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'info':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const formatSectionName = (section: string) => {
        return section.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    return (
        <div className={cn('space-y-6', className)}>
            {/* Overall Score */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Resume Analysis Score
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className={cn(
                                'w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold',
                                getScoreBackground(analysis.overallScore)
                            )}>
                                <span className={getScoreColor(analysis.overallScore)}>
                                    {analysis.overallScore}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Overall Resume Quality
                            </h3>
                            <p className="text-gray-600">
                                {analysis.overallScore >= 90 && "Excellent! Your resume is well-optimized and ATS-friendly."}
                                {analysis.overallScore >= 70 && analysis.overallScore < 90 && "Good job! Your resume has strong foundations with room for improvement."}
                                {analysis.overallScore >= 50 && analysis.overallScore < 70 && "Fair resume that needs some optimization to stand out."}
                                {analysis.overallScore < 50 && "Your resume needs significant improvements to be competitive."}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Section Analysis */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Section Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analysis.sections.map((section) => (
                            <div key={section.section} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    {getQualityIcon(section.quality)}
                                    <div>
                                        <h4 className="font-medium text-gray-900">
                                            {formatSectionName(section.section)}
                                        </h4>
                                        <p className="text-sm text-gray-600">{section.feedback}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className={cn('text-lg font-bold', getScoreColor(section.score))}>
                                            {section.score}/100
                                        </div>
                                        <div className="text-xs text-gray-500 capitalize">
                                            {section.quality}
                                        </div>
                                    </div>

                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                        <div
                                            className={cn(
                                                'h-2 rounded-full transition-all duration-300',
                                                section.score >= 90 ? 'bg-green-500' :
                                                    section.score >= 70 ? 'bg-blue-500' :
                                                        section.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                            )}
                                            style={{ width: `${section.score}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* ATS Compatibility */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        ATS Compatibility
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">ATS Score</span>
                            <span className={cn('text-lg font-bold', getScoreColor(analysis.atsCompatibility.score))}>
                                {analysis.atsCompatibility.score}/100
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={cn(
                                    'h-2 rounded-full transition-all duration-300',
                                    analysis.atsCompatibility.score >= 90 ? 'bg-green-500' :
                                        analysis.atsCompatibility.score >= 70 ? 'bg-blue-500' :
                                            analysis.atsCompatibility.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                )}
                                style={{ width: `${analysis.atsCompatibility.score}%` }}
                            />
                        </div>
                    </div>

                    {analysis.atsCompatibility.issues.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-medium text-gray-900 mb-3">ATS Issues Found</h4>
                            {analysis.atsCompatibility.issues.map((issue, index) => (
                                <div key={index} className={cn(
                                    'p-3 rounded-lg border text-sm',
                                    getSeverityColor(issue.severity)
                                )}>
                                    <div className="flex items-start gap-2">
                                        <span className="capitalize font-medium">{issue.severity}:</span>
                                        <span>{issue.description}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Keyword Analysis */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Keyword Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Industry Keywords */}
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                Industry Keywords Found ({analysis.keywordAnalysis.industryKeywords.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {analysis.keywordAnalysis.industryKeywords.map((keyword) => (
                                    <span
                                        key={keyword}
                                        className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium"
                                    >
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Missing Keywords */}
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <Target className="h-4 w-4 text-red-600" />
                                Missing Keywords ({analysis.keywordAnalysis.missingKeywords.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {analysis.keywordAnalysis.missingKeywords.map((keyword) => (
                                    <span
                                        key={keyword}
                                        className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs font-medium"
                                    >
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <Zap className="h-5 w-5" />
                            Strengths
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {analysis.strengths.map((strength, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">{strength}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Weaknesses */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700">
                            <AlertTriangle className="h-5 w-5" />
                            Areas for Improvement
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {analysis.weaknesses.map((weakness, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">{weakness}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};