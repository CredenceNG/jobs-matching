/**
 * Home Button Component
 *
 * Reusable button to navigate back to the home page
 * Displays at the top of pages for easy navigation
 */

import Link from 'next/link';
import { Home } from 'lucide-react';

interface HomeButtonProps {
    className?: string;
}

export default function HomeButton({ className = '' }: HomeButtonProps) {
    return (
        <Link
            href="/"
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all ${className}`}
        >
            <Home className="h-4 w-4" />
            Home
        </Link>
    );
}
