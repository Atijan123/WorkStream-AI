import { useToast } from '../contexts/ToastContext';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  error: Error;
  context: ErrorContext;
  timestamp: Date;
  userAgent: string;
  url: string;
}

export class ErrorHandlerService {
  private static instance: ErrorHandlerService;
  private errorReports: ErrorReport[] = [];
  private maxReports = 100;

  static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService();
    }
    return ErrorHandlerService.instance;
  }

  private constructor() {
    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        { component: 'Global', action: 'unhandledrejection' }
      );
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(
        new Error(`Global Error: ${event.message}`),
        { 
          component: 'Global', 
          action: 'error',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        }
      );
    });
  }

  handleError(error: Error, context: ErrorContext = {}): void {
    const errorReport: ErrorReport = {
      error,
      context,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Store error report
    this.storeErrorReport(errorReport);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled by ErrorHandlerService:', errorReport);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(errorReport);
    }
  }

  private storeErrorReport(report: ErrorReport): void {
    this.errorReports.unshift(report);
    
    // Keep only the most recent reports
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(0, this.maxReports);
    }

    // Store in localStorage for persistence
    try {
      const reportsToStore = this.errorReports.slice(0, 10); // Store only 10 most recent
      localStorage.setItem('errorReports', JSON.stringify(reportsToStore));
    } catch (error) {
      console.warn('Failed to store error reports in localStorage:', error);
    }
  }

  private async sendToMonitoringService(report: ErrorReport): Promise<void> {
    try {
      // In a real application, you would send this to a service like Sentry, LogRocket, etc.
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: report.error.message,
          stack: report.error.stack,
          context: report.context,
          timestamp: report.timestamp,
          userAgent: report.userAgent,
          url: report.url
        })
      });
    } catch (error) {
      console.warn('Failed to send error report to monitoring service:', error);
    }
  }

  getRecentErrors(limit: number = 10): ErrorReport[] {
    return this.errorReports.slice(0, limit);
  }

  clearErrors(): void {
    this.errorReports = [];
    localStorage.removeItem('errorReports');
  }

  // Utility method to get user-friendly error messages
  getUserFriendlyMessage(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    if (message.includes('timeout')) {
      return 'The request timed out. Please try again.';
    }

    if (message.includes('unauthorized') || message.includes('401')) {
      return 'You are not authorized to perform this action. Please log in and try again.';
    }

    if (message.includes('forbidden') || message.includes('403')) {
      return 'Access denied. You do not have permission to perform this action.';
    }

    if (message.includes('not found') || message.includes('404')) {
      return 'The requested resource was not found.';
    }

    if (message.includes('too many requests') || message.includes('429')) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    if (message.includes('server error') || message.includes('500')) {
      return 'A server error occurred. Please try again later.';
    }

    if (message.includes('service unavailable') || message.includes('503')) {
      return 'The service is temporarily unavailable. Please try again later.';
    }

    // Return original message if no specific pattern matches
    return error.message;
  }
}

// React hook for using the error handler
export const useErrorHandler = () => {
  const { showError } = useToast();
  const errorHandler = ErrorHandlerService.getInstance();

  const handleError = (error: Error, context: ErrorContext = {}, showToast: boolean = true) => {
    errorHandler.handleError(error, context);
    
    if (showToast) {
      const friendlyMessage = errorHandler.getUserFriendlyMessage(error);
      showError(
        context.action ? `${context.action} Failed` : 'Error',
        friendlyMessage
      );
    }
  };

  return {
    handleError,
    getRecentErrors: errorHandler.getRecentErrors.bind(errorHandler),
    clearErrors: errorHandler.clearErrors.bind(errorHandler)
  };
};

// Utility function for wrapping async operations with error handling
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: ErrorContext = {},
  showToast: boolean = true
): Promise<T | null> => {
  const errorHandler = ErrorHandlerService.getInstance();
  
  try {
    return await operation();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    errorHandler.handleError(err, context);
    
    if (showToast && typeof window !== 'undefined') {
      // We can't use the hook here, so we'll dispatch a custom event
      window.dispatchEvent(new CustomEvent('showError', {
        detail: {
          title: context.action ? `${context.action} Failed` : 'Error',
          message: errorHandler.getUserFriendlyMessage(err)
        }
      }));
    }
    
    return null;
  }
};