import React from 'react';
import { cn } from '@/lib/utils/cn';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success' | 'warning';
type ButtonSize = 'default' | 'sm' | 'lg' | 'xl' | 'icon';

const getButtonClasses = (variant: ButtonVariant = 'default', size: ButtonSize = 'default') => {
    const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variantClasses = {
        default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
        ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
        link: "text-blue-600 underline hover:text-blue-700 focus:ring-blue-500",
        success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
        warning: "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500",
    };

    const sizeClasses = {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-9 px-3 py-2 text-sm",
        lg: "h-11 px-8 py-2 text-base",
        xl: "h-12 px-10 py-3 text-base",
        icon: "h-10 w-10 p-2",
    };

    return cn(baseClasses, variantClasses[variant], sizeClasses[size]);
};

export interface ButtonProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    disabled?: boolean;
    className?: string;
    children?: React.ReactNode;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    type?: 'button' | 'submit' | 'reset';
}

export const Button = ({
    variant = 'default',
    size = 'default',
    loading = false,
    disabled = false,
    className,
    children,
    ...props
}: ButtonProps) => {
    return (
        <button
            className={cn(getButtonClasses(variant, size), className)}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
};