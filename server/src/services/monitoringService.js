import v8 from 'v8';

// NFR1-3: Performance Monitoring, Uptime Monitoring, Health Checks
// Tracks system health, performance metrics, and uptime statistics

class MonitoringService {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        byEndpoint: {}
      },
      responseTime: {
        total: 0,
        count: 0,
        min: Infinity,
        max: 0,
        samples: []
      },
      uptime: {
        startTime: this.startTime,
        lastCheck: Date.now()
      },
      health: {
        status: 'healthy',
        lastCheck: Date.now(),
        checks: {}
      }
    };

    // Keep last 1000 response time samples for percentile calculations
    this.maxSamples = 1000;

    // Start uptime tracking
    this.startUptimeTracking();
  }

  startUptimeTracking() {
    // Update uptime every minute
    const timer = setInterval(() => {
      this.metrics.uptime.lastCheck = Date.now();
    }, 60000);
    timer.unref?.(); // never keep the process alive just for this
  }

  // Middleware to track requests and response times
  requestTracker() {
    return (req, res, next) => {
      const startTime = Date.now();
      // Collapse ids so per-endpoint metrics do not grow without bound
      const endpoint = `${req.method} ${req.path
        .replace(/\/[0-9a-f]{24}(?=\/|$)/gi, '/:id')
        .replace(/\/\d+(?=\/|$)/g, '/:n')}`;

      // Track request
      this.metrics.requests.total++;
      
      if (!this.metrics.requests.byEndpoint[endpoint]) {
        this.metrics.requests.byEndpoint[endpoint] = {
          total: 0,
          success: 0,
          errors: 0,
          avgResponseTime: 0,
          responseTimes: []
        };
      }
      this.metrics.requests.byEndpoint[endpoint].total++;

      // Capture response
      const originalSend = res.send;
      res.send = function (data) {
        const duration = Date.now() - startTime;
        
        // Track response time
        this.recordResponseTime(duration);
        
        // Track success/error
        if (res.statusCode >= 200 && res.statusCode < 400) {
          this.metrics.requests.success++;
          this.metrics.requests.byEndpoint[endpoint].success++;
        } else {
          this.metrics.requests.errors++;
          this.metrics.requests.byEndpoint[endpoint].errors++;
        }

        // Track endpoint-specific response time
        const endpointMetrics = this.metrics.requests.byEndpoint[endpoint];
        endpointMetrics.responseTimes.push(duration);
        if (endpointMetrics.responseTimes.length > 100) {
          endpointMetrics.responseTimes.shift();
        }
        endpointMetrics.avgResponseTime = 
          endpointMetrics.responseTimes.reduce((a, b) => a + b, 0) / 
          endpointMetrics.responseTimes.length;

        originalSend.call(res, data);
      }.bind(this);

      next();
    };
  }

  recordResponseTime(duration) {
    this.metrics.responseTime.total += duration;
    this.metrics.responseTime.count++;
    this.metrics.responseTime.min = Math.min(this.metrics.responseTime.min, duration);
    this.metrics.responseTime.max = Math.max(this.metrics.responseTime.max, duration);

    // Keep samples for percentile calculations
    this.metrics.responseTime.samples.push(duration);
    if (this.metrics.responseTime.samples.length > this.maxSamples) {
      this.metrics.responseTime.samples.shift();
    }
  }

  // Health check - verify system components
  async performHealthCheck(dependencies = {}) {
    const checks = {};
    let overallStatus = 'healthy';

    // Check database connection
    if (dependencies.mongoose) {
      try {
        const dbState = dependencies.mongoose.connection.readyState;
        checks.database = {
          status: dbState === 1 ? 'healthy' : 'unhealthy',
          connected: dbState === 1,
          readyState: dbState,
          timestamp: Date.now()
        };
        
        if (dbState !== 1) {
          overallStatus = 'unhealthy';
        }
      } catch (error) {
        checks.database = {
          status: 'error',
          error: error.message,
          timestamp: Date.now()
        };
        overallStatus = 'unhealthy';
      }
    }

    // Compare against V8's heap limit: heapTotal grows on demand, so heapUsed/heapTotal is normally high
    const memUsage = process.memoryUsage();
    const memoryThreshold = 0.9; // 90% threshold
    const usedMemoryRatio = memUsage.heapUsed / v8.getHeapStatistics().heap_size_limit;
    
    checks.memory = {
      status: usedMemoryRatio < memoryThreshold ? 'healthy' : 'warning',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      usagePercent: Math.round(usedMemoryRatio * 100) + '%',
      timestamp: Date.now()
    };

    if (usedMemoryRatio >= memoryThreshold) {
      overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
    }

    // Check CPU load (simplified)
    const cpuUsage = process.cpuUsage();
    checks.cpu = {
      status: 'healthy',
      user: Math.round(cpuUsage.user / 1000) + ' ms',
      system: Math.round(cpuUsage.system / 1000) + ' ms',
      timestamp: Date.now()
    };

    // Check uptime
    const uptime = this.getUptime();
    checks.uptime = {
      status: 'healthy',
      seconds: uptime,
      formatted: this.formatUptime(uptime),
      timestamp: Date.now()
    };

    this.metrics.health = {
      status: overallStatus,
      lastCheck: Date.now(),
      checks
    };

    return this.metrics.health;
  }

  // Get uptime in seconds
  getUptime() {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  // Format uptime for display
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
  }

  // Get performance metrics summary
  getPerformanceMetrics() {
    const avgResponseTime = this.metrics.responseTime.count > 0
      ? Math.round(this.metrics.responseTime.total / this.metrics.responseTime.count)
      : 0;

    // Calculate percentiles
    const samples = [...this.metrics.responseTime.samples].sort((a, b) => a - b);
    const p50 = this.getPercentile(samples, 50);
    const p95 = this.getPercentile(samples, 95);
    const p99 = this.getPercentile(samples, 99);

    return {
      requests: {
        total: this.metrics.requests.total,
        success: this.metrics.requests.success,
        errors: this.metrics.requests.errors,
        successRate: this.metrics.requests.total > 0
          ? Math.round((this.metrics.requests.success / this.metrics.requests.total) * 100) + '%'
          : '0%'
      },
      responseTime: {
        average: avgResponseTime + ' ms',
        min: this.metrics.responseTime.min === Infinity ? 0 : this.metrics.responseTime.min + ' ms',
        max: this.metrics.responseTime.max + ' ms',
        p50: p50 + ' ms',
        p95: p95 + ' ms',
        p99: p99 + ' ms'
      },
      uptime: {
        seconds: this.getUptime(),
        formatted: this.formatUptime(this.getUptime())
      },
      timestamp: Date.now()
    };
  }

  // Get percentile value from sorted array
  getPercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return Math.round(sortedArray[index] || 0);
  }

  // Get endpoint-specific metrics
  getEndpointMetrics() {
    const endpoints = [];
    
    for (const [endpoint, metrics] of Object.entries(this.metrics.requests.byEndpoint)) {
      endpoints.push({
        endpoint,
        total: metrics.total,
        success: metrics.success,
        errors: metrics.errors,
        errorRate: metrics.total > 0
          ? Math.round((metrics.errors / metrics.total) * 100) + '%'
          : '0%',
        avgResponseTime: Math.round(metrics.avgResponseTime) + ' ms'
      });
    }

    // Sort by total requests (most active endpoints first)
    return endpoints.sort((a, b) => b.total - a.total);
  }

  // Get complete monitoring dashboard data
  getMonitoringData(dependencies = {}) {
    return {
      health: this.metrics.health,
      performance: this.getPerformanceMetrics(),
      endpoints: this.getEndpointMetrics(),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid
      },
      timestamp: Date.now()
    };
  }

  // Reset metrics (useful for testing)
  resetMetrics() {
    this.metrics.requests = {
      total: 0,
      success: 0,
      errors: 0,
      byEndpoint: {}
    };
    this.metrics.responseTime = {
      total: 0,
      count: 0,
      min: Infinity,
      max: 0,
      samples: []
    };
  }
}

// Export singleton instance
const monitoringService = new MonitoringService();
export default monitoringService;
