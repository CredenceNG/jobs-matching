'use client';

import React, { useState } from 'react';
import {
    Lightbulb,
    ChevronRight,
    Check,
    X,
    ArrowRight,
    Wand2,
    Copy,
    Download,
    RefreshCw
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

interface ResumeOptimizationProps {
    suggestions: OptimizationSuggestion[];
    onApplySuggestion?: (suggestionId: string) => void;
    onRejectSuggestion?: (suggestionId: string) => void;
    className?: string;
}

interface OptimizationSuggestion {
    id: string;
    type: 'content' | 'formatting' | 'keywords' | 'structure' | 'length' | 'grammar';
    priority: 'high' | 'medium' | 'low';
    section: string;
    title: string;
    description: string;
    before?: string;
    after?: string;
    impact: string;
    status?: 'pending' | 'applied' | 'rejected';
}

export const ResumeOptimization: React.FC<ResumeOptimizationProps> = ({
    suggestions,
    onApplySuggestion,
    onRejectSuggestion,
    className,
}) => {
    const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
    const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
    const [rejectedSuggestions, setRejectedSuggestions] = useState<Set<string>>(new Set());

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'content':
                return '📝';
            case 'formatting':
                return '🎨';
            case 'keywords':
                return '🔍';
            case 'structure':
                return '🏗️';
            case 'length':
                return '📏';
            case 'grammar':
                return '✏️';
            default:
                return '💡';
        }
    };

    const handleApplySuggestion = (suggestionId: string) => {
        setAppliedSuggestions(prev => new Set(prev).add(suggestionId));
        setRejectedSuggestions(prev => {
            const newSet = new Set(prev);
            newSet.delete(suggestionId);
            return newSet;
        });
        onApplySuggestion?.(suggestionId);
    };

    const handleRejectSuggestion = (suggestionId: string) => {
        setRejectedSuggestions(prev => new Set(prev).add(suggestionId));
        setAppliedSuggestions(prev => {
            const newSet = new Set(prev);
            newSet.delete(suggestionId);
            return newSet;
        });
        onRejectSuggestion?.(suggestionId);
    };

    const getSuggestionStatus = (suggestionId: string) => {
        if (appliedSuggestions.has(suggestionId)) return 'applied';
        if (rejectedSuggestions.has(suggestionId)) return 'rejected';
        return 'pending';
    };

    const pendingSuggestions = suggestions.filter(s => getSuggestionStatus(s.id) === 'pending');
    const appliedCount = suggestions.filter(s => getSuggestionStatus(s.id) === 'applied').length;
    const rejectedCount = suggestions.filter(s => getSuggestionStatus(s.id) === 'rejected').length;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast notification here
    };

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header with Stats */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5" />
                        AI-Powered Resume Optimization
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{suggestions.length}</div>
                            <div className="text-sm text-gray-600">Total Suggestions</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{appliedCount}</div>
                            <div className="text-sm text-gray-600">Applied</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-600">{rejectedCount}</div>
                            <div className="text-sm text-gray-600">Rejected</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">{pendingSuggestions.length}</div>
                            <div className="text-sm text-gray-600">Pending</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-wrap gap-3">
                        <Button variant="default" className="flex items-center gap-2">
                            <Wand2 className="h-4 w-4" />
                            Apply All High Priority
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Generate More Suggestions
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Export Optimized Resume
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Suggestions List */}
            <div className="space-y-4">
                {suggestions.map((suggestion) => {
                    const status = getSuggestionStatus(suggestion.id);
                    const isExpanded = expandedSuggestion === suggestion.id;

                    return (
                        <Card
                            key={suggestion.id}
                            className={cn(
                                'transition-all duration-200',
                                status === 'applied' && 'bg-green-50 border-green-200',
                                status === 'rejected' && 'bg-gray-50 border-gray-200 opacity-75'
                            )}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-lg">{getTypeIcon(suggestion.type)}</span>

                                            <span className={cn(
                                                'px-2 py-1 rounded-full text-xs font-medium border',
                                                getPriorityColor(suggestion.priority)
                                            )}>
                                                {suggestion.priority} priority
                                            </span>

                                            <span className="text-sm text-gray-500 capitalize">
                                                {suggestion.section.replace('-', ' ')}
                                            </span>

                                            {status === 'applied' && (
                                                <span className="flex items-center gap-1 text-green-600 text-sm">
                                                    <Check className="h-4 w-4" />
                                                    Applied
                                                </span>
                                            )}

                                            {status === 'rejected' && (
                                                <span className="flex items-center gap-1 text-gray-500 text-sm">
                                                    <X className="h-4 w-4" />
                                                    Rejected
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            {suggestion.title}
                                        </h3>

                                        <p className="text-gray-700 mb-3">
                                            {suggestion.description}
                                        </p>

                                        <div className="flex items-center gap-2 text-sm text-blue-600">
                                            <Lightbulb className="h-4 w-4" />
                                            <span>Impact: {suggestion.impact}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        {status === 'pending' && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRejectSuggestion(suggestion.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApplySuggestion(suggestion.id)}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setExpandedSuggestion(
                                                isExpanded ? null : suggestion.id
                                            )}
                                        >
                                            <ChevronRight className={cn(
                                                'h-4 w-4 transition-transform',
                                                isExpanded && 'rotate-90'
                                            )} />
                                        </Button>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (suggestion.before || suggestion.after) && (
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {suggestion.before && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                                            ❌ Before
                                                        </h4>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(suggestion.before!)}
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                                                            {suggestion.before}
                                                        </pre>
                                                    </div>
                                                </div>
                                            )}

                                            {suggestion.after && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                                            ✅ Suggested Improvement
                                                        </h4>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(suggestion.after!)}
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                                                            {suggestion.after}
                                                        </pre>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {suggestion.before && suggestion.after && status === 'pending' && (
                                            <div className="mt-4 text-center">
                                                <Button
                                                    onClick={() => handleApplySuggestion(suggestion.id)}
                                                    className="flex items-center gap-2"
                                                >
                                                    Apply This Improvement
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {suggestions.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Lightbulb className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">
                            No Suggestions Available
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Your resume looks great! Upload a new version or request a detailed analysis for more optimization suggestions.
                        </p>
                        <Button className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Generate New Suggestions
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};