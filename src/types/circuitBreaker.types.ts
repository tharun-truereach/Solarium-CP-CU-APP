/**
 * Circuit Breaker type definitions for the Solarium Web Portal
 */

/**
 * Circuit breaker state enum
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Circuit breaker configuration options
 */
export interface CircuitBreakerOptions {
  // Failure threshold before opening circuit
  failureThreshold: number;

  // Success threshold to close circuit from half-open
  successThreshold: number;

  // Timeout in milliseconds before trying half-open
  timeout: number;

  // Monitor window for failures (rolling window)
  monitoringPeriod: number;

  // Expected failure types that should trigger circuit breaking
  expectedFailures?: Array<string | number>;

  // Custom error detector function
  isFailure?: (error: any) => boolean;

  // Callback when state changes
  onStateChange?: (state: CircuitBreakerState, error?: Error) => void;

  // Callback when circuit opens
  onOpen?: (error: Error) => void;

  // Callback when circuit closes
  onClose?: () => void;

  // Callback when circuit is half-open
  onHalfOpen?: () => void;
}

/**
 * Circuit breaker metrics
 */
export interface CircuitBreakerMetrics {
  // Current state
  state: CircuitBreakerState;

  // Counters
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;

  // Timing
  lastFailureTime?: number;
  lastSuccessTime?: number;
  lastStateChangeTime: number;

  // Statistics
  failureRate: number;
  averageResponseTime: number;

  // Circuit specific
  consecutiveFailures: number;
  consecutiveSuccesses: number;

  // Next allowed request time (for OPEN state)
  nextAttempt?: number;
}

/**
 * Circuit breaker instance interface
 */
export interface CircuitBreaker {
  // Execute a function with circuit breaker protection
  execute<T>(fn: () => Promise<T>): Promise<T>;

  // Get current state
  getState(): CircuitBreakerState;

  // Get metrics
  getMetrics(): CircuitBreakerMetrics;

  // Manual state management
  open(): void;
  close(): void;
  halfOpen(): void;

  // Reset circuit breaker
  reset(): void;

  // Check if request is allowed
  isRequestAllowed(): boolean;
}

/**
 * Circuit breaker factory options
 */
export interface CircuitBreakerFactory {
  create(
    name: string,
    options?: Partial<CircuitBreakerOptions>
  ): CircuitBreaker;
  get(name: string): CircuitBreaker | undefined;
  remove(name: string): boolean;
  list(): string[];
  reset(): void;
}

/**
 * Circuit breaker error types
 */
export class CircuitBreakerOpenError extends Error {
  constructor(circuitName: string, nextAttempt?: number) {
    super(
      `Circuit breaker '${circuitName}' is OPEN${nextAttempt ? ` until ${new Date(nextAttempt).toISOString()}` : ''}`
    );
    this.name = 'CircuitBreakerOpenError';
  }
}

export class CircuitBreakerTimeoutError extends Error {
  constructor(circuitName: string) {
    super(`Circuit breaker '${circuitName}' request timeout`);
    this.name = 'CircuitBreakerTimeoutError';
  }
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_BREAKER_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000, // 30 seconds
  monitoringPeriod: 60000, // 1 minute
  expectedFailures: [500, 502, 503, 504],
  isFailure: (error: any) => {
    // Network errors and 5xx responses are considered failures
    return !error.response || error.response.status >= 500;
  },
};

export interface CircuitBreakerStats {
  requests: number;
  successes: number;
  failures: number;
  rejects: number;
  fires: number;
  timeouts: number;
  cacheHits: number;
  cacheMisses: number;
  semaphoreRejections: number;
  percentiles: {
    '0.0': number;
    '0.25': number;
    '0.5': number;
    '0.75': number;
    '0.9': number;
    '0.95': number;
    '0.99': number;
    '0.995': number;
    '1': number;
  };
  latencyMean: number;
  latencyTotalTimeInMilliseconds: number;
}

export interface CircuitBreakerStatus {
  state: CircuitBreakerState;
  stats: CircuitBreakerStats;
  nextAttempt?: number;
}
