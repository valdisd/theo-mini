import { MODES, Mode } from '@/config/constants';

/**
 * Mode for extraction and query operations
 */
export type ExtractionMode = Mode;

/**
 * Default value used when a field is not found or empty
 */
export const DEFAULT_FIELD_VALUE = 'N/A';

/**
 * API response types for the extraction endpoint.
 * Includes both successful response and error cases.
 */
export type ExtractionResponse = {
  extractedFields: ExtractionFields;
  sourceUrl: string;
};

export type ErrorResponse = {
  message: string;
  details?: string;
};

export type ApiResponse = ExtractionResponse | ErrorResponse;

/**
 * Field configuration for extraction
 */
export interface FieldConfig {
  key: string;
  label: string;
  required: boolean;
}

/**
 * Configuration for extraction fields
 * Each field has a label and whether it's required
 */
export const EXTRACTION_FIELDS: Record<string, FieldConfig> = {
  mission: {
    key: 'mission',
    label: 'COMPANY MISSION/VISION',
    required: true
  },
  product: {
    key: 'product',
    label: 'PRODUCT DESCRIPTION',
    required: true
  },
  value: {
    key: 'value',
    label: 'UNIQUE VALUE PROPOSITION',
    required: true
  }
} as const;

/**
 * Type for the extraction fields configuration
 */
export type ExtractionFieldsConfig = typeof EXTRACTION_FIELDS;

/**
 * Extracted fields from the content
 */
export type ExtractionFields = {
  [K in keyof typeof EXTRACTION_FIELDS]: string;
};

/**
 * Mutable version of extracted fields
 */
export type MutableExtractionFields = {
  [K in keyof typeof EXTRACTION_FIELDS]: string;
};

/**
 * Source URL information
 */
export interface SourceUrl {
  url: string;
  type: 'homepage' | 'about';
}

/**
 * Result of scraping a webpage
 */
export interface ScrapingResult {
  /** The extracted text content from the page */
  rawText: string;
  /** The full HTML content of the page */
  rawHtml: string;
  /** The URL that was scraped */
  sourceUrl: SourceUrl;
}

/**
 * Metadata about the extraction process
 */
export interface ExtractionMetadata {
  processingTime: number;
  confidence: number;
  version: string;
  timestamp: string;
  sourceUrl: SourceUrl;
  model: string;
  mode: ExtractionMode;
  tokenCount?: number;
}

/**
 * Successful extraction result
 */
export interface ExtractionResult {
  id: string;
  metadata: ExtractionMetadata;
  rawContent: string;
  extractedFields: ExtractionFields;
}

/**
 * Base error type for all API errors
 */
export interface ApiError {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
  requestId?: string;
  status?: number;
}

/**
 * Error type for extraction failures
 */
export type ExtractionError = ApiError;

/**
 * Query request payload
 */
export interface QueryRequest {
  question: string;
  context: string;
  mode: ExtractionMode;
  maxLength?: number;
  temperature?: number;
}

/**
 * Query response payload
 */
export interface QueryResponse {
  answer: string;
  confidence: number;
  processingTime: number;
  tokenCount?: number;
}

/**
 * Query error response
 */
export type QueryError = ApiError;

/**
 * Extraction request payload
 */
export interface ExtractionRequest {
  url: string;
  mode: ExtractionMode;
  maxLength?: number;
  temperature?: number;
  timeout?: number;
}

/**
 * Type guard for API errors
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'timestamp' in error
  );
}

/**
 * Type guard for extraction errors
 */
export function isExtractionError(error: unknown): error is ExtractionError {
  return isApiError(error);
}

/**
 * Type guard for query errors
 */
export function isQueryError(error: unknown): error is QueryError {
  return isApiError(error);
}

/**
 * Type guard for extraction results
 */
export function isExtractionResult(result: unknown): result is ExtractionResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'id' in result &&
    'metadata' in result &&
    'extractedFields' in result &&
    'rawContent' in result
  );
}

/**
 * Type guard for URL strings
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard for extraction requests
 */
export function isValidExtractionRequest(request: unknown): request is ExtractionRequest {
  return (
    typeof request === 'object' &&
    request !== null &&
    'url' in request &&
    typeof (request as ExtractionRequest).url === 'string' &&
    isValidUrl((request as ExtractionRequest).url) &&
    'mode' in request &&
    typeof (request as ExtractionRequest).mode === 'string' &&
    Object.values(MODES).includes((request as ExtractionRequest).mode as Mode)
  );
}

/**
 * Type guard for query requests
 */
export function isValidQueryRequest(request: unknown): request is QueryRequest {
  return (
    typeof request === 'object' &&
    request !== null &&
    'question' in request &&
    typeof (request as QueryRequest).question === 'string' &&
    (request as QueryRequest).question.length > 0 &&
    'context' in request &&
    typeof (request as QueryRequest).context === 'string' &&
    (request as QueryRequest).context.length > 0 &&
    'mode' in request &&
    typeof (request as QueryRequest).mode === 'string' &&
    Object.values(MODES).includes((request as QueryRequest).mode as Mode)
  );
}

/**
 * Type guard to check if a response is an error response.
 * @param response - The API response to check.
 * @returns True if the response is an error response.
 */
export function isErrorResponse(response: ApiResponse): response is ErrorResponse {
  return 'message' in response;
}

/**
 * Type guard to check if a response is a successful extraction response.
 * @param response - The API response to check.
 * @returns True if the response is a successful extraction response.
 */
export function isExtractionResponse(response: ApiResponse): response is ExtractionResponse {
  return 'extractedFields' in response;
} 