'use client';

import React from 'react';
import { Briefcase, Search } from 'lucide-react';
import { JobCard } from './JobCard';
import { Pagination } from './Pagination';
import { cn } from '@/lib/utils/cn';

interface JobListProps {
    jobs: JobData[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onJobSave?: (jobId: string) => void;
    onJobApply?: (jobId: string) => void;
    savedJobIds?: string[];
    isLoading?: boolean;
    showMatchScores?: boolean;
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

const LoadingSkeleton = () => (
    <div className="space-y-6">
        {[...Array(5)].map((_, index) => (
            <div key={index} className="border rounded-lg p-6 animate-pulse">
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="flex gap-4">
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const EmptyState = ({ hasFilters }: { hasFilters: boolean }) => (
    <div className="text-center py-16">
        {hasFilters ? (
            <>
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                    No jobs match your filters
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Try adjusting your search criteria or removing some filters to see more results.
                </p>
            </>
        ) : (
            <>
                <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                    No jobs available
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    We're constantly adding new job opportunities. Check back soon or adjust your search criteria.
                </p>
            </>
        )}
    </div>
);

export const JobList: React.FC<JobListProps> = ({
    jobs,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onJobSave,
    onJobApply,
    savedJobIds = [],
    isLoading = false,
    showMatchScores = true,
    className,
}) => {
    if (isLoading) {
        return (
            <div className={cn('space-y-6', className)}>
                <LoadingSkeleton />
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className={className}>
                <EmptyState hasFilters={totalItems === 0} />
            </div>
        );
    }

    return (
        <div className={cn('space-y-6', className)}>
            {/* Results Summary */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                    {totalItems.toLocaleString()} Jobs Found
                </h2>

                {/* Sort Options */}
                <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="relevance">Sort by Relevance</option>
                    <option value="date">Most Recent</option>
                    <option value="salary_desc">Salary: High to Low</option>
                    <option value="salary_asc">Salary: Low to High</option>
                    <option value="match_score">Best Match</option>
                </select>
            </div>

            {/* Job Cards */}
            <div className="space-y-4">
                {jobs.map((job) => (
                    <JobCard
                        key={job.id}
                        job={job}
                        onSave={onJobSave}
                        onApply={onJobApply}
                        isSaved={savedJobIds.includes(job.id)}
                        showMatchScore={showMatchScores}
                    />
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pt-6 border-t border-gray-200">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={onPageChange}
                    />
                </div>
            )}

            {/* Back to Top Button */}
            {jobs.length > 3 && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        ↑ Back to top
                    </button>
                </div>
            )}
        </div>
    );
};