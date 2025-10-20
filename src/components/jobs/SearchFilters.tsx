'use client';

import React, { useState } from 'react';
import { Search, MapPin, DollarSign, Briefcase, Filter, X } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

interface SearchFiltersProps {
    onFiltersChange: (filters: JobFilters) => void;
    initialFilters?: Partial<JobFilters>;
    className?: string;
}

interface JobFilters {
    query: string;
    location: string;
    remote: boolean;
    jobType: string[];
    experienceLevel: string[];
    salaryMin: number;
    salaryMax: number;
    industry: string[];
}

const JOB_TYPES = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'temporary', label: 'Temporary' },
];

const EXPERIENCE_LEVELS = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior Level' },
    { value: 'executive', label: 'Executive' },
];

const INDUSTRIES = [
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'Marketing',
    'Sales',
    'Design',
    'Engineering',
    'Operations',
    'Legal',
];

export const SearchFilters: React.FC<SearchFiltersProps> = ({
    onFiltersChange,
    initialFilters = {},
    className,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [filters, setFilters] = useState<JobFilters>({
        query: initialFilters.query || '',
        location: initialFilters.location || '',
        remote: initialFilters.remote || false,
        jobType: initialFilters.jobType || [],
        experienceLevel: initialFilters.experienceLevel || [],
        salaryMin: initialFilters.salaryMin || 0,
        salaryMax: initialFilters.salaryMax || 200000,
        industry: initialFilters.industry || [],
    });

    const updateFilter = (key: keyof JobFilters, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const toggleArrayFilter = (key: 'jobType' | 'experienceLevel' | 'industry', value: string) => {
        const current = filters[key] as string[];
        const updated = current.includes(value)
            ? current.filter(item => item !== value)
            : [...current, value];
        updateFilter(key, updated);
    };

    const clearAllFilters = () => {
        const clearedFilters: JobFilters = {
            query: '',
            location: '',
            remote: false,
            jobType: [],
            experienceLevel: [],
            salaryMin: 0,
            salaryMax: 200000,
            industry: [],
        };
        setFilters(clearedFilters);
        onFiltersChange(clearedFilters);
    };

    const hasActiveFilters = () => {
        return (
            filters.query ||
            filters.location ||
            filters.remote ||
            filters.jobType.length > 0 ||
            filters.experienceLevel.length > 0 ||
            filters.salaryMin > 0 ||
            filters.salaryMax < 200000 ||
            filters.industry.length > 0
        );
    };

    return (
        <Card className={cn('p-6', className)}>
            {/* Main Search Bar */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Job title, keywords, or company"
                            value={filters.query}
                            onChange={(e) => updateFilter('query', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex-1 relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Location"
                            value={filters.location}
                            onChange={(e) => updateFilter('location', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        Filters
                        {hasActiveFilters() && (
                            <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {filters.jobType.length + filters.experienceLevel.length + filters.industry.length + (filters.remote ? 1 : 0)}
                            </span>
                        )}
                    </Button>
                </div>

                {/* Remote Work Toggle */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="remote"
                        checked={filters.remote}
                        onChange={(e) => updateFilter('remote', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="remote" className="text-sm font-medium text-gray-700">
                        Remote work only
                    </label>
                </div>
            </div>

            {/* Expanded Filters */}
            {isExpanded && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
                    {/* Job Type */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Job Type</h3>
                        <div className="flex flex-wrap gap-2">
                            {JOB_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => toggleArrayFilter('jobType', type.value)}
                                    className={cn(
                                        'px-3 py-1 text-sm rounded-full border transition-colors',
                                        filters.jobType.includes(type.value)
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                    )}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Experience Level */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Experience Level</h3>
                        <div className="flex flex-wrap gap-2">
                            {EXPERIENCE_LEVELS.map((level) => (
                                <button
                                    key={level.value}
                                    onClick={() => toggleArrayFilter('experienceLevel', level.value)}
                                    className={cn(
                                        'px-3 py-1 text-sm rounded-full border transition-colors',
                                        filters.experienceLevel.includes(level.value)
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                    )}
                                >
                                    {level.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Salary Range */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Salary Range (USD)</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">Min</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={filters.salaryMin || ''}
                                        onChange={(e) => updateFilter('salaryMin', Number(e.target.value) || 0)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">Max</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input
                                        type="number"
                                        placeholder="200000"
                                        value={filters.salaryMax || ''}
                                        onChange={(e) => updateFilter('salaryMax', Number(e.target.value) || 200000)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Industry */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Industry</h3>
                        <div className="flex flex-wrap gap-2">
                            {INDUSTRIES.map((industry) => (
                                <button
                                    key={industry}
                                    onClick={() => toggleArrayFilter('industry', industry)}
                                    className={cn(
                                        'px-3 py-1 text-sm rounded-full border transition-colors',
                                        filters.industry.includes(industry)
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                    )}
                                >
                                    {industry}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters() && (
                        <div className="flex justify-end">
                            <Button
                                variant="ghost"
                                onClick={clearAllFilters}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                            >
                                <X className="h-4 w-4" />
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};