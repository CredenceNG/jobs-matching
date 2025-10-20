export { logger } from './logger';
export { 
  errorHandler, 
  AIError, 
  ErrorType, 
  ErrorSeverity 
} from './error-handler';
export { 
  monitoringService, 
  type HealthMetrics, 
  type Alert 
} from './monitoring';

export type { ErrorContext, RetryConfig } from './error-handler';

// Utility function for combining class names
export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}