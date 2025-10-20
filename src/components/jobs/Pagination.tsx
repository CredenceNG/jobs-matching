'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    className,
}) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Generate page numbers to display
    const getVisiblePages = () => {
        const pages: (number | 'ellipsis')[] = [];
        const maxVisiblePages = 7;

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 4) {
                pages.push('ellipsis');
            }

            // Show pages around current page
            const startPage = Math.max(2, currentPage - 2);
            const endPage = Math.min(totalPages - 1, currentPage + 2);

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 3) {
                pages.push('ellipsis');
            }

            // Always show last page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const visiblePages = getVisiblePages();

    if (totalPages <= 1) {
        return (
            <div className={cn('flex justify-center text-sm text-gray-600', className)}>
                Showing {totalItems} {totalItems === 1 ? 'job' : 'jobs'}
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4', className)}>
            {/* Results info */}
            <div className="text-sm text-gray-600">
                Showing {startItem}-{endItem} of {totalItems.toLocaleString()} jobs
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-1">
                {/* Previous button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="flex items-center gap-1"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </Button>

                {/* Page numbers */}
                <div className="hidden sm:flex items-center gap-1 mx-2">
                    {visiblePages.map((page, index) => {
                        if (page === 'ellipsis') {
                            return (
                                <div key={`ellipsis-${index}`} className="px-2">
                                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                </div>
                            );
                        }

                        return (
                            <Button
                                key={page}
                                variant={currentPage === page ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onPageChange(page)}
                                className={cn(
                                    'w-10 h-10 p-0',
                                    currentPage === page
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                )}
                            >
                                {page}
                            </Button>
                        );
                    })}
                </div>

                {/* Mobile page indicator */}
                <div className="sm:hidden px-3 py-1 text-sm text-gray-600">
                    {currentPage} / {totalPages}
                </div>

                {/* Next button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="flex items-center gap-1"
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};