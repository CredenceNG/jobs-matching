'use client';

import React, { useState, useEffect } from 'react';
import { SearchFilters } from './SearchFilters';
import { JobList } from './JobList';
import { cn } from '@/lib/utils/cn';

interface SearchResultsProps {
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

// Mock data generator for demonstration
const generateMockJobs = (filters: JobFilters, page: number): { jobs: JobData[], totalItems: number } => {
    const allJobs: JobData[] = [
        {
            id: '1',
            title: 'Senior Frontend Developer',
            company: 'TechCorp Inc.',
            companyLogo: undefined,
            location: 'San Francisco, CA',
            remote: true,
            jobType: 'full_time',
            salary: { min: 120000, max: 180000, currency: '$', period: 'yearly' },
            postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            matchScore: 95,
            description: 'We are looking for an experienced Frontend Developer to join our growing team. You will be responsible for building user-facing features using React, TypeScript, and modern web technologies.',
            tags: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL'],
            experienceLevel: 'senior',
            applicationUrl: 'https://example.com/apply/1'
        },
        {
            id: '2',
            title: 'Full Stack Engineer',
            company: 'StartupXYZ',
            location: 'New York, NY',
            remote: false,
            jobType: 'full_time',
            salary: { min: 100000, max: 150000, currency: '$', period: 'yearly' },
            postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            matchScore: 87,
            description: 'Join our dynamic startup as a Full Stack Engineer. Work with cutting-edge technologies and help build products that impact millions of users worldwide.',
            tags: ['Node.js', 'React', 'PostgreSQL', 'AWS', 'Docker'],
            experienceLevel: 'mid',
            applicationUrl: 'https://example.com/apply/2'
        },
        {
            id: '3',
            title: 'Product Designer',
            company: 'Design Studio Pro',
            location: 'Austin, TX',
            remote: true,
            jobType: 'full_time',
            salary: { min: 90000, max: 130000, currency: '$', period: 'yearly' },
            postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            matchScore: 78,
            description: 'We are seeking a talented Product Designer to help create beautiful, intuitive user experiences. You will work closely with our product and engineering teams.',
            tags: ['Figma', 'Sketch', 'Prototyping', 'User Research', 'Design Systems'],
            experienceLevel: 'mid',
            applicationUrl: 'https://example.com/apply/3'
        },
        {
            id: '4',
            title: 'DevOps Engineer',
            company: 'CloudTech Solutions',
            location: 'Seattle, WA',
            remote: true,
            jobType: 'full_time',
            salary: { min: 110000, max: 160000, currency: '$', period: 'yearly' },
            postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            matchScore: 82,
            description: 'Looking for a DevOps Engineer to help scale our infrastructure. You will work with Kubernetes, AWS, and modern CI/CD pipelines.',
            tags: ['Kubernetes', 'AWS', 'Docker', 'Terraform', 'Jenkins'],
            experienceLevel: 'senior',
            applicationUrl: 'https://example.com/apply/4'
        },
        {
            id: '5',
            title: 'Data Scientist',
            company: 'AI Innovations',
            location: 'Boston, MA',
            remote: false,
            jobType: 'full_time',
            salary: { min: 95000, max: 140000, currency: '$', period: 'yearly' },
            postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
            matchScore: 73,
            description: 'Join our AI team as a Data Scientist. Work on cutting-edge machine learning projects and help drive data-driven decisions.',
            tags: ['Python', 'TensorFlow', 'SQL', 'Machine Learning', 'Statistics'],
            experienceLevel: 'mid',
            applicationUrl: 'https://example.com/apply/5'
        },
        {
            id: '6',
            title: 'Backend Developer',
            company: 'MegaCorp Enterprise',
            location: 'Chicago, IL',
            remote: true,
            jobType: 'contract',
            salary: { min: 80, max: 120, currency: '$', period: 'hourly' },
            postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
            matchScore: 89,
            description: 'Contract position for an experienced Backend Developer. Work on high-scale systems processing millions of requests daily.',
            tags: ['Java', 'Spring Boot', 'Microservices', 'Redis', 'MongoDB'],
            experienceLevel: 'senior',
            applicationUrl: 'https://example.com/apply/6'
        }
    ];

    // Filter jobs based on search criteria
    const filteredJobs = allJobs.filter(job => {
        // Text search
        if (filters.query) {
            const query = filters.query.toLowerCase();
            const searchText = `${job.title} ${job.company} ${job.description} ${job.tags.join(' ')}`.toLowerCase();
            if (!searchText.includes(query)) return false;
        }

        // Location search
        if (filters.location) {
            const locationQuery = filters.location.toLowerCase();
            if (!job.location.toLowerCase().includes(locationQuery)) return false;
        }

        // Remote filter
        if (filters.remote && !job.remote) return false;

        // Job type filter
        if (filters.jobType.length > 0 && !filters.jobType.includes(job.jobType)) return false;

        // Experience level filter
        if (filters.experienceLevel.length > 0 && !filters.experienceLevel.includes(job.experienceLevel)) return false;

        // Salary filter
        if (job.salary && filters.salaryMin > 0) {
            const jobSalaryMin = job.salary.min || 0;
            if (job.salary.period === 'yearly' && jobSalaryMin < filters.salaryMin) return false;
            if (job.salary.period === 'hourly' && jobSalaryMin * 2080 < filters.salaryMin) return false; // Assume 2080 working hours/year
        }

        return true;
    });

    // Duplicate jobs to simulate more results for pagination
    const extendedJobs = [...filteredJobs, ...filteredJobs, ...filteredJobs];

    const itemsPerPage = 5;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedJobs = extendedJobs.slice(startIndex, endIndex);

    return {
        jobs: paginatedJobs,
        totalItems: extendedJobs.length
    };
};

export const SearchResults: React.FC<SearchResultsProps> = ({ className }) => {
    const [filters, setFilters] = useState<JobFilters>({
        query: '',
        location: '',
        remote: false,
        jobType: [],
        experienceLevel: [],
        salaryMin: 0,
        salaryMax: 200000,
        industry: []
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
    const itemsPerPage = 5;

    // Simulate API call
    const { jobs, totalItems } = generateMockJobs(filters, currentPage);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const handleFiltersChange = (newFilters: JobFilters) => {
        setIsLoading(true);
        setFilters(newFilters);
        setCurrentPage(1); // Reset to first page when filters change

        // Simulate API delay
        setTimeout(() => {
            setIsLoading(false);
        }, 500);
    };

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        setCurrentPage(page);

        // Simulate API delay
        setTimeout(() => {
            setIsLoading(false);
        }, 300);

        // Scroll to top of results
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleJobSave = (jobId: string) => {
        setSavedJobIds(prev =>
            prev.includes(jobId)
                ? prev.filter(id => id !== jobId)
                : [...prev, jobId]
        );
    };

    const handleJobApply = (jobId: string) => {
        // In a real app, this would handle the job application process
        console.log('Applying to job:', jobId);
        alert('Application process would start here!');
    };

    return (
        <div className={cn('max-w-7xl mx-auto px-4 py-8', className)}>
            <div className="space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Find Your Dream Job
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Discover thousands of job opportunities with AI-powered matching.
                        Filter by your preferences and find the perfect role.
                    </p>
                </div>

                {/* Search Filters */}
                <SearchFilters
                    onFiltersChange={handleFiltersChange}
                    initialFilters={filters}
                />

                {/* Results */}
                <JobList
                    jobs={jobs}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onJobSave={handleJobSave}
                    onJobApply={handleJobApply}
                    savedJobIds={savedJobIds}
                    isLoading={isLoading}
                    showMatchScores={true}
                />
            </div>
        </div>
    );
};