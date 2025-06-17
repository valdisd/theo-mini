/**
 * Configuration constants for the application
 */

/**
 * Common paths to look for about pages
 */
export const ABOUT_PATHS = [
  '/about',
  '/about-us',
  '/company',
  '/mission',
  '/vision',
  '/who-we-are',
  '/our-story',
  '/team',
] as const;

/**
 * Browser configuration
 */
export const BROWSER_CONFIG = {
  timeout: 30000, // 30 seconds
  waitUntil: 'networkidle' as const,
  loadingTimeout: 5000, // 5 seconds for loading indicators
  contentWait: 2000, // 2 seconds for content to settle
  maxRetries: 3, // Maximum number of retries for failed requests
  retryDelay: 1000, // Delay between retries in milliseconds
  userAgent: 'Mozilla/5.0 (compatible; TheoBot/1.0; +https://theo.ai/bot)', // Bot user agent
} as const;

/**
 * Content validation thresholds
 */
export const CONTENT_VALIDATION = {
  minLength: 50,
  minSentences: 2,
  maxLength: 100000, // Maximum content length to process
  loadingIndicators: ['Loading...', 'Please wait', 'Loading', 'Please wait...'],
  minConfidence: 0.7, // Minimum confidence score for extraction
} as const;

/**
 * LLM configuration
 */
export const LLM_CONFIG = {
  model: 'gpt-4o',
  maxInputLength: 5000,
  maxOutputLength: 2000,
  temperature: {
    strict: 0.15,
    open: 0.7,
  },
  retryAttempts: 3,
  retryDelay: 2000, // 2 seconds
  maxTokens: 4096,
  rateLimit: {
    requestsPerMinute: 60,
    tokensPerMinute: 40000,
  },
} as const;

/**
 * API configuration
 */
export const API_CONFIG = {
  version: '1.0.0',
  defaultMode: 'strict' as const,
  errorCodes: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    EXTRACTION_ERROR: 'EXTRACTION_ERROR',
    QUERY_ERROR: 'QUERY_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
  } as const,
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  timeout: {
    request: 30000, // 30 seconds
    extraction: 60000, // 1 minute
    query: 30000, // 30 seconds
  },
} as const;

/**
 * Mode types for extraction and query operations
 */
export const MODES = {
  strict: 'strict',
  open: 'open',
} as const;

export type Mode = typeof MODES[keyof typeof MODES];

/**
 * Environment variable names
 */
export const ENV = {
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  NODE_ENV: 'NODE_ENV',
  LOG_LEVEL: 'LOG_LEVEL',
  RATE_LIMIT_WINDOW_MS: 'RATE_LIMIT_WINDOW_MS',
  RATE_LIMIT_MAX_REQUESTS: 'RATE_LIMIT_MAX_REQUESTS',
} as const;

/**
 * Logging configuration
 */
export const LOG_CONFIG = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
  },
} as const; 