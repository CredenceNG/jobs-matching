'use client';

import React from 'react';
import {
    MapPin,
    Clock,
    DollarSign,
    Briefcase,
    Heart,
    ExternalLink,
    Building2,
    Calendar,
    Star
} from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

interface JobCardProps {
    job: JobData;
    onSave?: (jobId: string) => void;
    onApply?: (jobId: string) => void;
    isSaved?: boolean;
    showMatchScore?: boolean;
    className?: string;
}

interface JobData {
    id: string;
    title: string;
    company: string;
    companyLogo?: string;
    location: string;
    remote: boolean;
    jobType: string;
    salary?: {
        min?: number;
        max?: number;
        currency: string;
        period: string;
    };
    postedAt: Date;
    matchScore?: number;
    description: string;
    tags: string[];
    experienceLevel: string;
    applicationUrl?: string;
}

export const JobCard: React.FC<JobCardProps> = ({
    job,
    onSave,
    onApply,
    isSaved = false,
    showMatchScore = true,
    className,
}) => {
    const formatSalary = () => {
        if (!job.salary) return null;

        const { min, max, currency, period } = job.salary;
        const formatNumber = (num: number) => new Intl.NumberFormat().format(num);

        if (min && max) {
            return `${currency}${formatNumber(min)} - ${currency}${formatNumber(max)} ${period}`;
        } else if (min) {
            return `From ${currency}${formatNumber(min)} ${period}`;
        } else if (max) {
            return `Up to ${currency}${formatNumber(max)} ${period}`;
        }
        return null;
    };

    const formatJobType = (type: string) => {
        return type.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const formatExperienceLevel = (level: string) => {
        return level.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const getTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else if (diffInHours < 168) { // 7 days
            return `${Math.floor(diffInHours / 24)}d ago`;
        } else {
            return `${Math.floor(diffInHours / 168)}w ago`;
        }
    };

    const getMatchScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600 bg-green-50';
        if (score >= 70) return 'text-blue-600 bg-blue-50';
        if (score >= 50) return 'text-yellow-600 bg-yellow-50';
        return 'text-gray-600 bg-gray-50';
    };

    return (
        <Card className={cn('group hover:shadow-2xl hover:border-blue-200 transition-all duration-300 bg-white border border-gray-200', className)}>
            <CardContent className="p-6">
                {/* Header with Company Logo & Match Score */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                        {/* Company Logo */}
                        {job.companyLogo ? (
                            <img
                                src={job.companyLogo}
                                alt={`${job.company} logo`}
                                className="w-14 h-14 rounded-xl object-contain bg-gray-50 p-2 border border-gray-200"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center border border-gray-200">
                                <Building2 className="h-7 w-7 text-gray-400" />
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                {job.title}
                            </h3>
                            <p className="text-gray-600 font-medium">{job.company}</p>
                        </div>
                    </div>

                    {/* Match Score Badge */}
                    {showMatchScore && job.matchScore && (
                        <div className={cn(
                            'px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-sm border',
                            job.matchScore >= 90 ? 'bg-green-50 text-green-700 border-green-200' :
                            job.matchScore >= 70 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            job.matchScore >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                        )}>
                            <Star className={cn(
                                'h-4 w-4',
                                job.matchScore >= 70 && 'fill-current'
                            )} />
                            {job.matchScore}%
                        </div>
                    )}
                </div>

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                    </div>

                    {job.remote && (
                        <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                            Remote
                        </span>
                    )}

                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200">
                        <Briefcase className="h-3.5 w-3.5" />
                        {formatJobType(job.jobType)}
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200">
                        <Clock className="h-3.5 w-3.5" />
                        {getTimeAgo(job.postedAt)}
                    </div>
                </div>

                {/* Salary */}
                {formatSalary() && (
                    <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-bold text-blue-700">{formatSalary()}</span>
                    </div>
                )}

                {/* Job Description Preview */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {job.description.substring(0, 150)}
                    {job.description.length > 150 && '...'}
                </p>

                {/* Tags */}
                {job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {job.tags.slice(0, 4).map((tag) => (
                            <span
                                key={tag}
                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100"
                            >
                                {tag}
                            </span>
                        ))}
                        {job.tags.length > 4 && (
                            <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium border border-gray-200">
                                +{job.tags.length - 4}
                            </span>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSave?.(job.id)}
                        className={cn(
                            'flex items-center gap-2 rounded-lg',
                            isSaved ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                        )}
                    >
                        <Heart className={cn('h-4 w-4', isSaved && 'fill-current')} />
                        {isSaved ? 'Saved' : 'Save'}
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg border-gray-200 hover:border-blue-300 hover:text-blue-600"
                        >
                            Details
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => onApply?.(job.id)}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-sm"
                        >
                            Apply
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};