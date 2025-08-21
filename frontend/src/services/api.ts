import { DashboardData, Workflow, FeatureRequest } from '../types';
import { ErrorHandlerService } from './errorHandler';

const API_BASE_URL = '/api';

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryCondition?: (error: Error) => boolean;
}

class ApiService {
  private defaultRetryOptions: RetryOptions = {
    maxRetries: 3,
    retryDelay: 1000,
    retryCondition: (error: Error) => {
      // Retry on network errors or 5xx server errors
      return error.message.includes('fetch') || 
             error.message.includes('500') || 
             error.message.includes('502') || 
             error.message.includes('503') || 
             error.message.includes('504');
    }
  };

  private errorHandler = ErrorHandlerService.getInstance();
  private async fetchJson<T>(url: string, options?: RequestInit, retryOptions?: RetryOptions): Promise<T> {
    const finalRetryOptions = { ...this.defaultRetryOptions, ...retryOptions };
    let lastError: Error;

    for (let attempt = 0; attempt <= finalRetryOptions.maxRetries!; attempt++) {
      try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          ...options,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || this.getStatusErrorMessage(response.status);
          const error = new Error(errorMessage);
          
          // Don't retry client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw error;
          }
          
          throw error;
        }

        return response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (error instanceof TypeError && error.message.includes('fetch')) {
          lastError = new Error('Unable to connect to server. Please check your connection and try again.');
        }

        // Check if we should retry
        if (attempt < finalRetryOptions.maxRetries! && 
            finalRetryOptions.retryCondition!(lastError)) {
          await this.delay(finalRetryOptions.retryDelay! * Math.pow(2, attempt)); // Exponential backoff
          continue;
        }
        
        // Log error for monitoring
        this.errorHandler.handleError(lastError, {
          component: 'ApiService',
          action: `${options?.method || 'GET'} ${url}`,
          metadata: { attempt, url, options }
        });
        
        throw lastError;
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getStatusErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication required. Please log in and try again.';
      case 403:
        return 'Access denied. You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return `Request failed with status ${status}. Please try again.`;
    }
  }

  async getDashboardData(): Promise<DashboardData> {
    return this.fetchJson<DashboardData>('/dashboard/data');
  }

  async getWorkflows(): Promise<Workflow[]> {
    return this.fetchJson<Workflow[]>('/workflows');
  }

  async getWorkflowLogs(workflowId: string, limit?: number): Promise<any[]> {
    const params = limit ? `?limit=${limit}` : '';
    return this.fetchJson<any[]>(`/workflows/${workflowId}/logs${params}`);
  }

  async submitFeatureRequest(description: string): Promise<FeatureRequest> {
    return this.fetchJson<FeatureRequest>('/features/request', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  async getFeatureRequests(status?: string, limit?: number): Promise<FeatureRequest[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const url = `/features/requests${queryString ? `?${queryString}` : ''}`;
    
    return this.fetchJson<FeatureRequest[]>(url);
  }

  async createWorkflow(workflowData: Omit<Workflow, 'id'>): Promise<Workflow> {
    return this.fetchJson<Workflow>('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflowData),
    });
  }

  // Hook-related methods
  async listHooks(): Promise<Array<{ name: string; description: string }>> {
    const response = await this.fetchJson<{ hooks: Array<{ name: string; description: string }> }>('/hooks');
    return response.hooks;
  }

  async executeHook(hookName: string, request: string, userId?: string): Promise<any> {
    return this.fetchJson<any>(`/hooks/${hookName}/execute`, {
      method: 'POST',
      body: JSON.stringify({ request, userId }),
    });
  }

  async evolveUI(request: string, userId?: string): Promise<any> {
    return this.fetchJson<any>('/hooks/evolve-ui', {
      method: 'POST',
      body: JSON.stringify({ request, userId }),
    });
  }

  async automateWorkflow(request: string, userId?: string): Promise<any> {
    return this.fetchJson<any>('/hooks/automate-workflow', {
      method: 'POST',
      body: JSON.stringify({ request, userId }),
    });
  }
}

export const apiService = new ApiService();