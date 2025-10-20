import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    label?: string;
}

export const Input: React.FC<InputProps> = ({
    className,
    type = 'text',
    error,
    label,
    ...props
}) => {
    const baseClasses = `
    flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm 
    placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 
    focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50
  `;

    const errorClasses = error ? 'border-red-500 focus:ring-red-500' : '';

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <input
                type={type}
                className={cn(baseClasses, errorClasses, className)}
                {...props}
            />
            {error && (
                <p className="text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
};