/**
 * Enhanced Circuit Breaker implementation for HTTP requests
 * Provides open-half-closed pattern with metrics and Application Insights integration
 */

import {
  CircuitBreakerState,
  CircuitBreakerOptions,
  CircuitBreakerMetrics,
  CircuitBreaker,
  CircuitBreakerOpenError,
  DEFAULT_CIRCUIT_BREAKER_OPTIONS,
} from '../../types/circuitBreaker.types';
import { config } from '../../config/environment';

/**
 * Circuit breaker implementation
 */
class CircuitBreakerImpl implements CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private lastStateChangeTime = Date.now();
  private nextAttempt?: number;

  constructor(
    private readonly name: string,
    private readonly options: CircuitBreakerOptions
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.isRequestAllowed()) {
      const error = new CircuitBreakerOpenError(this.name, this.nextAttempt);
      this.emitStateChange('request_blocked', error);
      throw error;
    }

    const startTime = Date.now();

    try {
      const result = await fn();
      this.onSuccess(Date.now() - startTime);
      return result;
    } catch (error) {
      this.onFailure(error as Error, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Get circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    const totalRequests = this.failureCount + this.successCount;
    const failureRate =
      totalRequests > 0 ? this.failureCount / totalRequests : 0;

    return {
      state: this.state,
      totalRequests,
      successfulRequests: this.successCount,
      failedRequests: this.failureCount,
      lastFailureTime: this.lastFailureTime ?? 0,
      lastSuccessTime: this.lastSuccessTime ?? 0,
      lastStateChangeTime: this.lastStateChangeTime,
      failureRate,
      averageResponseTime: 0, // Would need to track response times
      consecutiveFailures:
        this.state === CircuitBreakerState.CLOSED ? this.failureCount : 0,
      consecutiveSuccesses:
        this.state === CircuitBreakerState.HALF_OPEN ? this.successCount : 0,
      nextAttempt: this.nextAttempt ?? 0,
    };
  }

  /**
   * Manually open the circuit
   */
  open(): void {
    this.setState(CircuitBreakerState.OPEN);
    this.nextAttempt = Date.now() + this.options.timeout;

    if (this.options.onOpen) {
      this.options.onOpen(new Error('Circuit manually opened'));
    }
  }

  /**
   * Manually close the circuit
   */
  close(): void {
    this.setState(CircuitBreakerState.CLOSED);
    this.failureCount = 0;
    this.successCount = 0;
    delete (this as any).nextAttempt;

    if (this.options.onClose) {
      this.options.onClose();
    }
  }

  /**
   * Set circuit to half-open state
   */
  halfOpen(): void {
    this.setState(CircuitBreakerState.HALF_OPEN);
    this.successCount = 0;
    delete (this as any).nextAttempt;

    if (this.options.onHalfOpen) {
      this.options.onHalfOpen();
    }
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset(): void {
    this.setState(CircuitBreakerState.CLOSED);
    this.failureCount = 0;
    this.successCount = 0;
    delete (this as any).lastFailureTime;
    delete (this as any).lastSuccessTime;
    delete (this as any).nextAttempt;
  }

  /**
   * Check if request is allowed based on current state
   */
  isRequestAllowed(): boolean {
    const now = Date.now();

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        return true;

      case CircuitBreakerState.OPEN:
        if (this.nextAttempt && now >= this.nextAttempt) {
          this.halfOpen();
          return true;
        }
        return false;

      case CircuitBreakerState.HALF_OPEN:
        return true;

      default:
        return false;
    }
  }

  /**
   * Handle successful request
   */
  private onSuccess(responseTime: number): void {
    this.lastSuccessTime = Date.now();

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        this.failureCount = 0;
        break;

      case CircuitBreakerState.HALF_OPEN:
        this.successCount++;

        if (this.successCount >= this.options.successThreshold) {
          this.close();
        }
        break;
    }

    // Emit metrics for monitoring
    this.emitMetrics('success', responseTime);
  }

  /**
   * Handle failed request
   */
  private onFailure(error: Error, responseTime: number): void {
    this.lastFailureTime = Date.now();

    // Check if this error should trigger circuit breaking
    const shouldTrigger = this.options.isFailure
      ? this.options.isFailure(error)
      : this.isDefaultFailure(error);

    if (!shouldTrigger) {
      return;
    }

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        this.failureCount++;

        if (this.failureCount >= this.options.failureThreshold) {
          this.open();
        }
        break;

      case CircuitBreakerState.HALF_OPEN:
        this.open();
        break;
    }

    // Emit metrics for monitoring
    this.emitMetrics('failure', responseTime, error);
  }

  /**
   * Default failure detection logic
   */
  private isDefaultFailure(error: any): boolean {
    if (this.options.expectedFailures) {
      const errorCode = error.response?.status || error.code || error.status;
      return this.options.expectedFailures.includes(errorCode);
    }

    // Default: network errors and 5xx responses
    return !error.response || error.response.status >= 500;
  }

  /**
   * Set circuit state and emit change event
   */
  private setState(newState: CircuitBreakerState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.lastStateChangeTime = Date.now();

      if (this.options.onStateChange) {
        this.options.onStateChange(newState);
      }

      this.emitStateChange('state_change', undefined, {
        from: oldState,
        to: newState,
      });

      // Log state changes in development
      if (config.environment === 'DEV') {
        console.log(
          `🔄 Circuit Breaker '${this.name}': ${oldState} → ${newState}`
        );
      }
    }
  }

  /**
   * Emit state change events
   */
  private emitStateChange(type: string, error?: Error, metadata?: any): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('circuitBreaker:stateChange', {
          detail: {
            name: this.name,
            type,
            state: this.state,
            error,
            metadata,
            timestamp: Date.now(),
          },
        })
      );
    }
  }

  /**
   * Emit metrics for monitoring
   */
  private emitMetrics(
    type: 'success' | 'failure',
    responseTime: number,
    error?: Error
  ): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('circuitBreaker:metrics', {
          detail: {
            name: this.name,
            type,
            responseTime,
            error,
            metrics: this.getMetrics(),
            timestamp: Date.now(),
          },
        })
      );
    }
  }
}

/**
 * Circuit breaker factory and registry
 */
class CircuitBreakerFactory {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Create or get circuit breaker instance
   */
  create(
    name: string,
    options: Partial<CircuitBreakerOptions> = {}
  ): CircuitBreaker {
    if (this.breakers.has(name)) {
      return this.breakers.get(name)!;
    }

    const mergedOptions = { ...DEFAULT_CIRCUIT_BREAKER_OPTIONS, ...options };
    const breaker = new CircuitBreakerImpl(name, mergedOptions);

    this.breakers.set(name, breaker);

    // Log creation in development
    if (config.environment === 'DEV') {
      console.log(`🛡️ Circuit Breaker '${name}' created:`, mergedOptions);
    }

    return breaker;
  }

  /**
   * Get existing circuit breaker
   */
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Remove circuit breaker
   */
  remove(name: string): boolean {
    return this.breakers.delete(name);
  }

  /**
   * List all circuit breaker names
   */
  list(): string[] {
    return Array.from(this.breakers.keys());
  }

  /**
   * Reset all circuit breakers
   */
  reset(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }

  /**
   * Get all circuit breaker metrics
   */
  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};

    this.breakers.forEach((breaker, name) => {
      metrics[name] = breaker.getMetrics();
    });

    return metrics;
  }
}

/**
 * Global circuit breaker factory instance
 */
export const circuitBreakerFactory = new CircuitBreakerFactory();

/**
 * Convenience function to wrap functions with circuit breaker protection
 */
export const withCircuitBreaker = <T>(
  key: string,
  fn: () => Promise<T>,
  options?: Partial<CircuitBreakerOptions>
): Promise<T> => {
  const breaker = circuitBreakerFactory.create(key, options);
  return breaker.execute(fn);
};

/**
 * Request function with circuit breaker protection for axios requests
 */
export const requestWithBreaker = async (axiosConfig: any) => {
  const { axiosClient } = await import('./axiosClient');

  return withCircuitBreaker(
    `${axiosConfig.method?.toUpperCase() || 'GET'}:${axiosConfig.url}`,
    () => axiosClient.request(axiosConfig)
  );
};

/**
 * Development utilities
 */
if (config.environment === 'DEV') {
  // Add global circuit breaker utilities for debugging
  (window as any).__CIRCUIT_BREAKER__ = {
    factory: circuitBreakerFactory,
    withCircuitBreaker,
    requestWithBreaker,
    getAllMetrics: () => circuitBreakerFactory.getAllMetrics(),
  };

  // Log circuit breaker events
  window.addEventListener('circuitBreaker:stateChange', (event: any) => {
    console.log('🔄 Circuit Breaker State Change:', event.detail);
  });

  window.addEventListener('circuitBreaker:metrics', (event: any) => {
    if (event.detail.type === 'failure') {
      console.warn('⚠️ Circuit Breaker Failure:', event.detail);
    }
  });
}

/**
 * Export circuit breaker utilities
 */
export { CircuitBreakerImpl as CircuitBreaker };
export default circuitBreakerFactory;
