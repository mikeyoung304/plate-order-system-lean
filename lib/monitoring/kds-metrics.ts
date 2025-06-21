import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// External monitoring service interfaces
interface MonitoringService {
  log(level: string, message: string, metadata?: any): void;
  metric(name: string, value: number, tags?: Record<string, string>): void;
  error(error: Error, context?: any): void;
}

// Monitoring service implementations
class DataDogService implements MonitoringService {
  private apiKey: string;
  private appKey: string;

  constructor() {
    this.apiKey = process.env.DATADOG_API_KEY || '';
    this.appKey = process.env.DATADOG_APP_KEY || '';
  }

  log(level: string, message: string, metadata?: any): void {
    if (!this.apiKey) {return;}
    
    // DataDog log API implementation
    fetch('https://http-intake.logs.datadoghq.com/api/v2/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': this.apiKey,
      },
      body: JSON.stringify({
        ddsource: 'nodejs',
        ddtags: `env:${process.env.NODE_ENV},service:kds`,
        hostname: process.env.HOSTNAME || 'unknown',
        service: 'kds',
        message,
        level,
        ...metadata,
      }),
    }).catch(err => console.error('DataDog log error:', err));
  }

  metric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.apiKey) {return;}

    const tagString = tags 
      ? Object.entries(tags).map(([k, v]) => `${k}:${v}`).join(',')
      : '';

    // DataDog metric API implementation
    fetch('https://api.datadoghq.com/api/v1/series', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': this.apiKey,
      },
      body: JSON.stringify({
        series: [{
          metric: `kds.${name}`,
          points: [[Math.floor(Date.now() / 1000), value]],
          type: 'gauge',
          tags: tagString ? tagString.split(',') : [],
        }],
      }),
    }).catch(err => console.error('DataDog metric error:', err));
  }

  error(error: Error, context?: any): void {
    this.log('error', error.message, {
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

class NewRelicService implements MonitoringService {
  private apiKey: string;
  private accountId: string;

  constructor() {
    this.apiKey = process.env.NEW_RELIC_API_KEY || '';
    this.accountId = process.env.NEW_RELIC_ACCOUNT_ID || '';
  }

  log(level: string, message: string, metadata?: any): void {
    if (!this.apiKey) {return;}

    // New Relic log API implementation
    fetch(`https://log-api.newrelic.com/log/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': this.apiKey,
      },
      body: JSON.stringify({
        timestamp: Date.now(),
        message,
        level,
        attributes: {
          service: 'kds',
          environment: process.env.NODE_ENV,
          ...metadata,
        },
      }),
    }).catch(err => console.error('New Relic log error:', err));
  }

  metric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.apiKey) {return;}

    // New Relic metric API implementation
    fetch(`https://metric-api.newrelic.com/metric/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': this.apiKey,
      },
      body: JSON.stringify({
        metrics: [{
          name: `kds.${name}`,
          type: 'gauge',
          value,
          timestamp: Date.now(),
          attributes: {
            service: 'kds',
            ...tags,
          },
        }],
      }),
    }).catch(err => console.error('New Relic metric error:', err));
  }

  error(error: Error, context?: any): void {
    this.log('error', error.message, {
      'error.class': error.name,
      'error.message': error.message,
      'error.stack': error.stack,
      ...context,
    });
  }
}

// Console logging service for development
class ConsoleService implements MonitoringService {
  log(level: string, message: string, metadata?: any): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...metadata,
    };
    
    switch (level) {
      case 'error':
        console.error('[KDS]', JSON.stringify(logData, null, 2));
        break;
      case 'warn':
        console.warn('[KDS]', JSON.stringify(logData, null, 2));
        break;
      case 'info':
        console.info('[KDS]', JSON.stringify(logData, null, 2));
        break;
      default:
        console.log('[KDS]', JSON.stringify(logData, null, 2));
    }
  }

  metric(name: string, value: number, tags?: Record<string, string>): void {
    console.log('[KDS Metric]', {
      name,
      value,
      tags,
      timestamp: new Date().toISOString(),
    });
  }

  error(error: Error, context?: any): void {
    console.error('[KDS Error]', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

// Performance metrics
interface PerformanceMetrics {
  apiResponseTime: number;
  queryExecutionTime: number;
  realtimeLatency: number;
  connectionHealth: 'healthy' | 'degraded' | 'unhealthy';
}

// Business metrics
interface BusinessMetrics {
  orderProcessingTime: number;
  kitchenEfficiency: number;
  customerSatisfaction: number;
  averageWaitTime: number;
  orderCompletionRate: number;
}

// System health metrics
interface SystemHealthMetrics {
  memoryUsage: number;
  cpuUsage: number;
  databaseConnections: number;
  activeWebsockets: number;
  errorRate: number;
}

// Main KDS Metrics class
export class KDSMetrics {
  private services: MonitoringService[] = [];
  private performanceBuffer: Map<string, number[]> = new Map();
  private errorBuffer: Error[] = [];
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize monitoring services
    if (process.env.DATADOG_API_KEY) {
      this.services.push(new DataDogService());
    }
    if (process.env.NEW_RELIC_API_KEY) {
      this.services.push(new NewRelicService());
    }
    // Always include console logging
    this.services.push(new ConsoleService());

    // Start periodic metrics collection
    this.startMetricsCollection();
  }

  // Performance tracking methods
  async trackAPIResponse<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    const tags = { operation, environment: process.env.NODE_ENV || 'development' };

    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      this.recordPerformance('api.response_time', duration, tags);
      this.log('info', `API operation completed: ${operation}`, {
        duration,
        success: true,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordPerformance('api.response_time', duration, { ...tags, error: 'true' });
      this.logError(error as Error, {
        operation,
        duration,
        impact: 'api_failure',
      });

      throw error;
    }
  }

  trackQueryPerformance(query: string, duration: number): void {
    const tags = {
      query_type: this.extractQueryType(query),
      environment: process.env.NODE_ENV || 'development',
    };

    this.recordPerformance('database.query_time', duration, tags);
    
    if (duration > 1000) {
      this.log('warn', 'Slow query detected', {
        query: query.substring(0, 200),
        duration,
        threshold: 1000,
      });
    }
  }

  trackRealtimeConnection(status: 'connected' | 'disconnected' | 'error', latency?: number): void {
    const tags = { status, environment: process.env.NODE_ENV || 'development' };

    if (latency !== undefined) {
      this.recordPerformance('realtime.latency', latency, tags);
    }

    this.recordMetric('realtime.connection_status', status === 'connected' ? 1 : 0, tags);
    
    this.log('info', `Realtime connection ${status}`, {
      status,
      latency,
      timestamp: new Date().toISOString(),
    });
  }

  // Error logging methods
  logError(error: Error, context?: any): void {
    this.errorBuffer.push(error);
    
    // Trim buffer if too large
    if (this.errorBuffer.length > 100) {
      this.errorBuffer = this.errorBuffer.slice(-50);
    }

    const errorContext = {
      ...context,
      errorType: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
      timestamp: new Date().toISOString(),
      userId: context?.userId || 'unknown',
      sessionId: context?.sessionId || 'unknown',
    };

    this.services.forEach(service => {
      service.error(error, errorContext);
    });

    // Calculate error rate
    const errorRate = this.calculateErrorRate();
    this.recordMetric('system.error_rate', errorRate, {
      window: '5m',
    });
  }

  // Usage analytics methods
  trackFeatureUsage(feature: string, metadata?: any): void {
    const tags = {
      feature,
      environment: process.env.NODE_ENV || 'development',
      ...metadata,
    };

    this.recordMetric('usage.feature', 1, tags);
    
    this.log('info', `Feature used: ${feature}`, {
      feature,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  trackVoiceCommand(command: string, accuracy: number, success: boolean): void {
    const tags = {
      command_type: this.extractCommandType(command),
      success: success.toString(),
      environment: process.env.NODE_ENV || 'development',
    };

    this.recordMetric('voice.command_count', 1, tags);
    this.recordMetric('voice.accuracy', accuracy, tags);
    
    this.log('info', 'Voice command processed', {
      command: command.substring(0, 100),
      accuracy,
      success,
      timestamp: new Date().toISOString(),
    });
  }

  // Anomaly detection removed - using simpler validation

  // System health methods
  recordSystemHealth(metrics: Partial<SystemHealthMetrics>): void {
    if (metrics.memoryUsage !== undefined) {
      this.recordMetric('system.memory_usage_mb', metrics.memoryUsage, {
        type: 'heap',
      });
    }

    if (metrics.cpuUsage !== undefined) {
      this.recordMetric('system.cpu_usage_percent', metrics.cpuUsage);
    }

    if (metrics.databaseConnections !== undefined) {
      this.recordMetric('database.connection_count', metrics.databaseConnections, {
        pool: 'main',
      });
    }

    if (metrics.activeWebsockets !== undefined) {
      this.recordMetric('realtime.websocket_count', metrics.activeWebsockets);
    }

    this.log('info', 'System health recorded', {
      metrics,
      timestamp: new Date().toISOString(),
    });
  }

  // Business metrics methods
  trackOrderProcessing(orderId: string, stage: 'received' | 'preparing' | 'ready' | 'delivered', duration?: number): void {
    const tags = {
      stage,
      environment: process.env.NODE_ENV || 'development',
    };

    this.recordMetric('business.order_stage', 1, tags);
    
    if (duration !== undefined) {
      this.recordMetric('business.stage_duration_seconds', duration / 1000, tags);
    }

    this.log('info', 'Order processing tracked', {
      orderId,
      stage,
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  recordKitchenEfficiency(metrics: {
    ordersCompleted: number;
    averageCompletionTime: number;
    staffCount: number;
  }): void {
    const efficiency = metrics.ordersCompleted / (metrics.staffCount * 60); // Orders per staff per hour
    
    this.recordMetric('kitchen.efficiency', efficiency);
    this.recordMetric('kitchen.avg_completion_time_minutes', metrics.averageCompletionTime / 60000);
    this.recordMetric('kitchen.orders_completed', metrics.ordersCompleted);
    
    this.log('info', 'Kitchen efficiency recorded', {
      ...metrics,
      calculatedEfficiency: efficiency,
      timestamp: new Date().toISOString(),
    });
  }

  trackCustomerSatisfaction(orderId: string, rating: number, feedback?: string): void {
    const tags = {
      rating_category: rating >= 4 ? 'positive' : rating >= 3 ? 'neutral' : 'negative',
      environment: process.env.NODE_ENV || 'development',
    };

    this.recordMetric('customer.satisfaction_rating', rating, tags);
    
    this.log('info', 'Customer satisfaction recorded', {
      orderId,
      rating,
      feedback: feedback?.substring(0, 200),
      timestamp: new Date().toISOString(),
    });
  }

  // Private helper methods
  private recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    this.services.forEach(service => {
      service.metric(name, value, tags);
    });
  }

  private recordPerformance(name: string, value: number, tags?: Record<string, string>): void {
    // Store in buffer for percentile calculations
    const key = `${name}:${JSON.stringify(tags || {})}`;
    if (!this.performanceBuffer.has(key)) {
      this.performanceBuffer.set(key, []);
    }
    
    const buffer = this.performanceBuffer.get(key)!;
    buffer.push(value);
    
    // Keep only last 1000 values
    if (buffer.length > 1000) {
      buffer.shift();
    }

    // Record the metric
    this.recordMetric(name, value, tags);
    
    // Calculate and record percentiles
    if (buffer.length >= 100) {
      const sorted = [...buffer].sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.5)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];
      
      this.recordMetric(`${name}.p50`, p50, tags);
      this.recordMetric(`${name}.p95`, p95, tags);
      this.recordMetric(`${name}.p99`, p99, tags);
    }
  }

  private log(level: string, message: string, metadata?: any): void {
    this.services.forEach(service => {
      service.log(level, message, metadata);
    });
  }

  private extractQueryType(query: string): string {
    const normalized = query.trim().toLowerCase();
    if (normalized.startsWith('select')) {return 'select';}
    if (normalized.startsWith('insert')) {return 'insert';}
    if (normalized.startsWith('update')) {return 'update';}
    if (normalized.startsWith('delete')) {return 'delete';}
    return 'other';
  }

  private extractCommandType(command: string): string {
    const normalized = command.toLowerCase();
    if (normalized.includes('order')) {return 'order';}
    if (normalized.includes('table')) {return 'table';}
    if (normalized.includes('menu')) {return 'menu';}
    if (normalized.includes('help')) {return 'help';}
    return 'other';
  }

  private calculateErrorRate(): number {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentErrors = this.errorBuffer.filter(
      error => new Date(error.message).getTime() > fiveMinutesAgo
    );
    
    // Assume we process ~100 requests per minute
    const estimatedRequests = 500;
    return (recentErrors.length / estimatedRequests) * 100;
  }

  private startMetricsCollection(): void {
    // Collect system metrics every 30 seconds
    this.metricsInterval = setInterval(() => {
      // Memory usage
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const memUsage = process.memoryUsage();
        this.recordSystemHealth({
          memoryUsage: memUsage.heapUsed / 1024 / 1024,
        });
      }

      // Database connection count (would need actual implementation)
      // this.recordSystemHealth({
      //   databaseConnections: getActiveConnectionCount(),
      // });

      // Clean up old performance buffers
      this.performanceBuffer.forEach((buffer, key) => {
        if (buffer.length === 0) {
          this.performanceBuffer.delete(key);
        }
      });
    }, 30000);
  }

  // Cleanup method
  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    this.performanceBuffer.clear();
    this.errorBuffer = [];
  }
}

// Singleton instance
let metricsInstance: KDSMetrics | null = null;

export function getKDSMetrics(): KDSMetrics {
  if (!metricsInstance) {
    metricsInstance = new KDSMetrics();
  }
  return metricsInstance;
}

// Convenience exports for common operations
export const trackAPIResponse = <T>(operation: string, fn: () => Promise<T>) => 
  getKDSMetrics().trackAPIResponse(operation, fn);

export const logError = (error: Error, context?: any) => 
  getKDSMetrics().logError(error, context);

export const trackFeatureUsage = (feature: string, metadata?: any) => 
  getKDSMetrics().trackFeatureUsage(feature, metadata);

export const trackOrderProcessing = (orderId: string, stage: 'received' | 'preparing' | 'ready' | 'delivered', duration?: number) =>
  getKDSMetrics().trackOrderProcessing(orderId, stage, duration);