import Link from 'next/link';
import { SearchResults } from '@/components/jobs';

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Job Search</h1>
                            <p className="text-gray-600 mt-2">Find your next opportunity from thousands of job listings</p>
                        </div>
                        <Link
                            href="/"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            🚀 Try AI Features
                        </Link>
                    </div>
                </div>
            </div>

            {/* Job Search Section */}
            <div className="bg-white">
                <SearchResults />
            </div>
        </div>
    );
}

export const metadata = {
    title: 'Job Search - JobAI Platform',
    description: 'Search through thousands of job opportunities. Find your perfect match with our comprehensive job search platform.',
};