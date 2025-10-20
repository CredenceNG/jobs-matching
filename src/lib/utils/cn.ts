import { type ClassValue, clsx } from 'clsx';

/**
 * Utility function to merge class names using clsx
 * This is a simple utility that doesn't depend on environment configuration
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}