import { logger } from './logger';
import { errorHandler, ErrorType, ErrorSeverity, type AIError } from './error-handler';
import { config } from '@/lib/config';

export interface HealthMetrics {
  timestamp: Date;
  aiProviders: {
    anthropic: {
      available: boolean;
      responseTime: number;
      errorRate: number;
    };
    openai: {
      available: boolean;
      responseTime: number;
      errorRate: number;
    };
  };
  cache: {
    available: boolean;
    hitRate: number;
    responseTime: number;
  };
  costs: {
    dailySpend: number;
    budgetUtilization: number;
    avgCostPerRequest: number;
  };
  performance: {
    avgResponseTime: number;
    requestsPerMinute: number;
    activeUsers: number;
  };
  errors: {
    totalErrors: number;
    criticalErrors: number;
    errorsByType: Record<string, number>;
  };
}

export interface Alert {
  id: string;
  type: 'error' | 'performance' | 'cost' | 'availability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  metadata?: Record<string, any>;
}

/**
 * System monitoring and alerting service
 */
export class MonitoringService {
  private static instance: MonitoringService;
  private alerts: Alert[] = [];
  private metrics: HealthMetrics[] = [];
  private lastHealthCheck = new Date();
  
  private requestTimes: number[] = [];
  private errorCounts = new Map<ErrorType, number>();
  private dailyCosts = 0;
  private activeUserSessions = new Set<string>();

  private constructor() {
    // Start periodic health checks
    this.startHealthMonitoring();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Record request metrics
   */
  recordRequest(
    duration: number,
    userId?: string,
    cost?: number,
    error?: AIError
  ): void {
    // Record response time
    this.requestTimes.push(duration);
    
    // Keep only last 100 requests for performance
    if (this.requestTimes.length > 100) {
      this.requestTimes.shift();
    }

    // Track active users
    if (userId) {
      this.activeUserSessions.add(userId);
    }

    // Track costs
    if (cost) {
      this.dailyCosts += cost;
    }

    // Track errors
    if (error) {
      const currentCount = this.errorCounts.get(error.type) || 0;
      this.errorCounts.set(error.type, currentCount + 1);
      
      // Create alert for critical errors
      if (error.severity === ErrorSeverity.CRITICAL) {
        this.createAlert(
          'error',
          'critical',
          `Critical error occurred: ${error.message}`,
          { errorType: error.type, context: error.context }
        );
      }
    }

    logger.debug('Request metrics recorded', {
      duration,
      userId,
      cost,
      errorType: error?.type,
    });
  }

  /**
   * Get current health metrics
   */
  async getCurrentHealth(): Promise<HealthMetrics> {
    const now = new Date();
    
    // Calculate metrics
    const avgResponseTime = this.requestTimes.length > 0 
      ? this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length
      : 0;

    const requestsPerMinute = this.requestTimes.length; // Simplified
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    const criticalErrors = this.alerts.filter(alert => 
      alert.severity === 'critical' && 
      alert.type === 'error' && 
      now.getTime() - alert.timestamp.getTime() < 3600000 // Last hour
    ).length;

    const errorsByType: Record<string, number> = {};
    this.errorCounts.forEach((count, type) => {
      errorsByType[type] = count;
    });

    const budgetUtilization = config.ai.dailyBudgetUsd > 0 
      ? (this.dailyCosts / config.ai.dailyBudgetUsd) * 100 
      : 0;

    const metrics: HealthMetrics = {
      timestamp: now,
      aiProviders: {
        anthropic: await this.checkProviderHealth('anthropic'),
        openai: await this.checkProviderHealth('openai'),
      },
      cache: await this.checkCacheHealth(),
      costs: {
        dailySpend: this.dailyCosts,
        budgetUtilization,
        avgCostPerRequest: this.requestTimes.length > 0 
          ? this.dailyCosts / this.requestTimes.length 
          : 0,
      },
      performance: {
        avgResponseTime,
        requestsPerMinute,
        activeUsers: this.activeUserSessions.size,
      },
      errors: {
        totalErrors,
        criticalErrors,
        errorsByType,
      },
    };

    // Store metrics history
    this.metrics.push(metrics);
    
    // Keep only last 24 hours of metrics
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);

    // Check for alert conditions
    this.checkAlertConditions(metrics);

    return metrics;
  }

  /**
   * Check AI provider health
   */
  private async checkProviderHealth(provider: 'anthropic' | 'openai'): Promise<{
    available: boolean;
    responseTime: number;
    errorRate: number;
  }> {
    try {
      const startTime = Date.now();
      
      // Simple health check - would ping provider in production
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const responseTime = Date.now() - startTime;
      const providerErrors = Array.from(this.errorCounts.entries())
        .filter(([type]) => type.includes('AI_PROVIDER'))
        .reduce((sum, [, count]) => sum + count, 0);
      
      const totalRequests = this.requestTimes.length;
      const errorRate = totalRequests > 0 ? (providerErrors / totalRequests) * 100 : 0;

      return {
        available: true,
        responseTime,
        errorRate,
      };
    } catch (error) {
      logger.error(`${provider} health check failed`, { error });
      return {
        available: false,
        responseTime: 0,
        errorRate: 100,
      };
    }
  }

  /**
   * Check cache health
   */
  private async checkCacheHealth(): Promise<{
    available: boolean;
    hitRate: number;
    responseTime: number;
  }> {
    try {
      const startTime = Date.now();
      
      // Simple cache health check
      await new Promise(resolve => setTimeout(resolve, 5));
      
      const responseTime = Date.now() - startTime;
      
      // Calculate cache hit rate from error handler stats
      const cacheErrors = this.errorCounts.get(ErrorType.CACHE_ERROR) || 0;
      const hitRate = this.requestTimes.length > 0 
        ? Math.max(0, 100 - (cacheErrors / this.requestTimes.length) * 100)
        : 0;

      return {
        available: true,
        hitRate,
        responseTime,
      };
    } catch (error) {
      logger.error('Cache health check failed', { error });
      return {
        available: false,
        hitRate: 0,
        responseTime: 0,
      };
    }
  }

  /**
   * Check for alert conditions and create alerts
   */
  private checkAlertConditions(metrics: HealthMetrics): void {
    // High error rate alert
    if (metrics.errors.totalErrors > 10) {
      this.createAlert(
        'error',
        'high',
        `High error rate detected: ${metrics.errors.totalErrors} errors`,
        { errorsByType: metrics.errors.errorsByType }
      );
    }

    // Budget alert
    if (metrics.costs.budgetUtilization > 90) {
      this.createAlert(
        'cost',
        'critical',
        `Budget utilization critical: ${metrics.costs.budgetUtilization.toFixed(1)}%`,
        { dailySpend: metrics.costs.dailySpend }
      );
    } else if (metrics.costs.budgetUtilization > 75) {
      this.createAlert(
        'cost',
        'high',
        `Budget utilization high: ${metrics.costs.budgetUtilization.toFixed(1)}%`,
        { dailySpend: metrics.costs.dailySpend }
      );
    }

    // Performance alert
    if (metrics.performance.avgResponseTime > 10000) {
      this.createAlert(
        'performance',
        'medium',
        `High response time: ${metrics.performance.avgResponseTime.toFixed(0)}ms`,
        { avgResponseTime: metrics.performance.avgResponseTime }
      );
    }

    // Availability alert
    if (!metrics.aiProviders.anthropic.available && !metrics.aiProviders.openai.available) {
      this.createAlert(
        'availability',
        'critical',
        'All AI providers are unavailable',
        { providers: metrics.aiProviders }
      );
    }
  }

  /**
   * Create a new alert
   */
  private createAlert(
    type: Alert['type'],
    severity: Alert['severity'],
    message: string,
    metadata?: Record<string, any>
  ): void {
    // Check if similar alert already exists and is recent
    const recentThreshold = 5 * 60 * 1000; // 5 minutes
    const now = new Date();
    
    const existingAlert = this.alerts.find(alert => 
      alert.type === type &&
      alert.message === message &&
      !alert.acknowledged &&
      now.getTime() - alert.timestamp.getTime() < recentThreshold
    );

    if (existingAlert) {
      logger.debug('Skipping duplicate alert', { type, message });
      return;
    }

    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: now,
      acknowledged: false,
      metadata,
    };

    this.alerts.push(alert);

    // Log alert
    logger.warn('New alert created', {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
    });

    // Clean up old alerts (keep last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      logger.info('Alert acknowledged', { alertId });
      return true;
    }
    return false;
  }

  /**
   * Get system metrics history
   */
  getMetricsHistory(hours: number = 24): HealthMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    // Check health every 5 minutes
    setInterval(async () => {
      try {
        await this.getCurrentHealth();
        logger.debug('Periodic health check completed');
      } catch (error) {
        logger.error('Periodic health check failed', { error });
      }
    }, 5 * 60 * 1000);

    // Reset daily metrics at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.resetDailyMetrics();
      
      // Set up daily reset interval
      setInterval(() => {
        this.resetDailyMetrics();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  /**
   * Reset daily metrics
   */
  private resetDailyMetrics(): void {
    this.dailyCosts = 0;
    this.errorCounts.clear();
    this.requestTimes.length = 0;
    this.activeUserSessions.clear();
    
    logger.info('Daily metrics reset');
  }

  /**
   * Export monitoring data for analysis
   */
  exportMonitoringData(): {
    alerts: Alert[];
    metrics: HealthMetrics[];
    summary: {
      totalRequests: number;
      totalErrors: number;
      uptime: number;
      avgResponseTime: number;
    };
  } {
    const totalRequests = this.requestTimes.length;
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    const avgResponseTime = totalRequests > 0 
      ? this.requestTimes.reduce((sum, time) => sum + time, 0) / totalRequests
      : 0;
    
    return {
      alerts: [...this.alerts],
      metrics: [...this.metrics],
      summary: {
        totalRequests,
        totalErrors,
        uptime: 99.9, // Simplified uptime calculation
        avgResponseTime,
      },
    };
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();