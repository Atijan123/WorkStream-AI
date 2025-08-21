export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ComponentPerformance {
  componentName: string;
  renderTime: number;
  mountTime?: number;
  updateCount: number;
  lastUpdate: Date;
}

export class PerformanceMonitorService {
  private static instance: PerformanceMonitorService;
  private metrics: PerformanceMetric[] = [];
  private componentMetrics: Map<string, ComponentPerformance> = new Map();
  private maxMetrics = 1000;

  static getInstance(): PerformanceMonitorService {
    if (!PerformanceMonitorService.instance) {
      PerformanceMonitorService.instance = new PerformanceMonitorService();
    }
    return PerformanceMonitorService.instance;
  }

  private constructor() {
    this.setupPerformanceObserver();
  }

  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        // Observe navigation timing
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart);
              this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
              this.recordMetric('first_paint', navEntry.loadEventEnd - navEntry.fetchStart);
            }
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });

        // Observe resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              if (resourceEntry.name.includes('/api/')) {
                this.recordMetric('api_request_time', resourceEntry.duration, {
                  url: resourceEntry.name,
                  method: 'unknown' // We can't get method from PerformanceResourceTiming
                });
              }
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });

        // Observe largest contentful paint
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              this.recordMetric('largest_contentful_paint', entry.startTime);
            }
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Observe first input delay
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'first-input') {
              const fidEntry = entry as PerformanceEventTiming;
              this.recordMetric('first_input_delay', fidEntry.processingStart - fidEntry.startTime);
            }
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

      } catch (error) {
        console.warn('Performance Observer setup failed:', error);
      }
    }
  }

  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      metadata
    };

    this.metrics.unshift(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(0, this.maxMetrics);
    }

    // Log slow operations
    if (this.isSlowOperation(name, value)) {
      console.warn(`Slow operation detected: ${name} took ${value}ms`, metadata);
    }
  }

  recordComponentPerformance(componentName: string, renderTime: number, isMount: boolean = false): void {
    const existing = this.componentMetrics.get(componentName);
    
    if (existing) {
      existing.renderTime = renderTime;
      existing.updateCount += 1;
      existing.lastUpdate = new Date();
      if (isMount) {
        existing.mountTime = renderTime;
      }
    } else {
      this.componentMetrics.set(componentName, {
        componentName,
        renderTime,
        mountTime: isMount ? renderTime : undefined,
        updateCount: 1,
        lastUpdate: new Date()
      });
    }

    // Record as general metric too
    this.recordMetric(`component_render_${componentName}`, renderTime, { isMount });
  }

  private isSlowOperation(name: string, value: number): boolean {
    const thresholds: Record<string, number> = {
      'page_load_time': 3000,
      'api_request_time': 2000,
      'component_render': 16, // 60fps = 16.67ms per frame
      'largest_contentful_paint': 2500,
      'first_input_delay': 100
    };

    for (const [key, threshold] of Object.entries(thresholds)) {
      if (name.includes(key) && value > threshold) {
        return true;
      }
    }

    return false;
  }

  getMetrics(name?: string, limit: number = 100): PerformanceMetric[] {
    let filteredMetrics = this.metrics;
    
    if (name) {
      filteredMetrics = this.metrics.filter(m => m.name.includes(name));
    }
    
    return filteredMetrics.slice(0, limit);
  }

  getComponentMetrics(): ComponentPerformance[] {
    return Array.from(this.componentMetrics.values());
  }

  getAverageMetric(name: string, timeWindow?: number): number | null {
    let filteredMetrics = this.metrics.filter(m => m.name === name);
    
    if (timeWindow) {
      const cutoff = new Date(Date.now() - timeWindow);
      filteredMetrics = filteredMetrics.filter(m => m.timestamp > cutoff);
    }
    
    if (filteredMetrics.length === 0) {
      return null;
    }
    
    const sum = filteredMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / filteredMetrics.length;
  }

  getPerformanceSummary(): {
    totalMetrics: number;
    slowOperations: number;
    averageApiTime: number | null;
    averageRenderTime: number | null;
    componentCount: number;
  } {
    const slowOps = this.metrics.filter(m => this.isSlowOperation(m.name, m.value));
    
    return {
      totalMetrics: this.metrics.length,
      slowOperations: slowOps.length,
      averageApiTime: this.getAverageMetric('api_request_time'),
      averageRenderTime: this.getAverageMetric('component_render'),
      componentCount: this.componentMetrics.size
    };
  }

  clearMetrics(): void {
    this.metrics = [];
    this.componentMetrics.clear();
  }

  // Utility method to measure function execution time
  async measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, { ...metadata, error: true });
      throw error;
    }
  }

  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, { ...metadata, error: true });
      throw error;
    }
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const monitor = PerformanceMonitorService.getInstance();

  return {
    recordMetric: monitor.recordMetric.bind(monitor),
    recordComponentPerformance: monitor.recordComponentPerformance.bind(monitor),
    measureAsync: monitor.measureAsync.bind(monitor),
    measure: monitor.measure.bind(monitor),
    getMetrics: monitor.getMetrics.bind(monitor),
    getComponentMetrics: monitor.getComponentMetrics.bind(monitor),
    getPerformanceSummary: monitor.getPerformanceSummary.bind(monitor)
  };
};

import React from 'react';

// Higher-order component for automatic performance monitoring
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const ComponentWithPerformanceMonitoring = (props: P) => {
    const monitor = PerformanceMonitorService.getInstance();
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Unknown';
    
    React.useEffect(() => {
      const start = performance.now();
      
      return () => {
        const duration = performance.now() - start;
        monitor.recordComponentPerformance(name, duration, true);
      };
    }, []);

    React.useEffect(() => {
      const start = performance.now();
      
      return () => {
        const duration = performance.now() - start;
        monitor.recordComponentPerformance(name, duration, false);
      };
    });

    return React.createElement(WrappedComponent, props);
  };

  ComponentWithPerformanceMonitoring.displayName = `withPerformanceMonitoring(${name})`;
  
  return ComponentWithPerformanceMonitoring;
};