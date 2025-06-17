import { CONTENT_VALIDATION } from '@/config/constants';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log a message with the specified level and optional metadata
 */
export function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level,
    message,
    ...(data && { data })
  };

  switch (level) {
    case 'debug':
      console.debug(logData);
      break;
    case 'info':
      console.info(logData);
      break;
    case 'warn':
      console.warn(logData);
      break;
    case 'error':
      console.error(logData);
      break;
  }
}

/**
 * Validates if the extracted content is meaningful and complete
 */
export function isValidContent(text: string): boolean {
  if (!text || typeof text !== 'string') {
    log('warn', 'Content validation failed: Invalid input');
    return false;
  }

  const validation = {
    length: text.length,
    sentences: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
    hasLoadingIndicators: CONTENT_VALIDATION.loadingIndicators.some(indicator => 
      text.includes(indicator)
    )
  };

  log('debug', 'Content validation', validation);
  
  if (validation.length < CONTENT_VALIDATION.minLength) {
    log('warn', 'Content validation failed: Content too short', { 
      length: validation.length, 
      minLength: CONTENT_VALIDATION.minLength 
    });
    return false;
  }
  
  if (validation.length > CONTENT_VALIDATION.maxLength) {
    log('warn', 'Content validation failed: Content too long', { 
      length: validation.length, 
      maxLength: CONTENT_VALIDATION.maxLength 
    });
    return false;
  }
  
  if (validation.hasLoadingIndicators) {
    log('warn', 'Content validation failed: Loading indicators present');
    return false;
  }
  
  if (validation.sentences < CONTENT_VALIDATION.minSentences) {
    log('warn', 'Content validation failed: Not enough sentences', { 
      sentences: validation.sentences, 
      minSentences: CONTENT_VALIDATION.minSentences 
    });
    return false;
  }
  
  return true;
}

/**
 * Create an error response object
 */
export function createErrorResponse(code: string, message: string, details?: string) {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString()
  };
}

/**
 * Normalizes URLs by ensuring they have a protocol
 */
export function normalizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL input');
  }
  return url.startsWith('http') ? url : `https://${url}`;
}

/**
 * Normalizes newlines in text content
 */
export function normalizeNewlines(text: string): string {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input');
  }
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Truncate a string to a specified length
 */
export function truncateString(str: string, length: number): string {
  if (!str || typeof str !== 'string') {
    throw new Error('Invalid string input');
  }
  if (typeof length !== 'number' || length < 0) {
    throw new Error('Invalid length input');
  }
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

/**
 * Validate an email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100);
}

/**
 * Format a phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phone;
}

/**
 * Format a file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format a duration in milliseconds
 */
export function formatDuration(ms: number): string {
  if (typeof ms !== 'number' || ms < 0) {
    throw new Error('Invalid duration input');
  }
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number): string {
  if (typeof num !== 'number') {
    throw new Error('Invalid number input');
  }
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format a list of items
 */
export function formatList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

/**
 * Format a range of numbers
 */
export function formatRange(start: number, end: number): string {
  if (start === end) return start.toString();
  return `${start} - ${end}`;
}

/**
 * Format a boolean value
 */
export function formatBoolean(value: boolean): string {
  return value ? 'Yes' : 'No';
}

/**
 * Format a null or undefined value
 */
export function formatNullOrUndefined(value: null | undefined): string {
  return value === null ? 'null' : 'undefined';
} 