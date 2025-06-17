'use client';

import { useState } from 'react';
import { 
  ExtractionFields, 
  ApiResponse,
  isErrorResponse,
  isExtractionResponse,
  DEFAULT_FIELD_VALUE 
} from '@/types/extraction';

/**
 * Helper function to format the extracted fields into a string format
 * suitable for use as context in queries.
 * @param fields - The extracted fields to format.
 * @returns A formatted string representation of the fields.
 */
function formatContext(fields: ExtractionFields): string {
  return Object.entries(fields)
    .map(([key, value]) => `=== ${key.toUpperCase()} ===\n${value || DEFAULT_FIELD_VALUE}`)
    .join('\n\n');
}

/**
 * Component for handling user queries about the extracted information.
 * Supports both strict and open modes, and always uses extracted fields as context.
 * @param extractedFields - The extracted fields to use as context.
 * @param mode - The query mode (strict or open).
 * @param onModeChange - Callback to change the query mode.
 */
function QueryInterface({ 
  extractedFields, 
  mode,
  onModeChange 
}: { 
  extractedFields: ExtractionFields;
  mode: 'strict' | 'open';
  onModeChange: (mode: 'strict' | 'open') => void;
}) {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setAnswer('');
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: query,
          context: formatContext(extractedFields),
          mode
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAnswer(data.error || 'Failed to get an answer');
      } else {
        setAnswer(data.answer || 'No answer returned.');
      }
    } catch (err) {
      console.error('Query error:', err);
      setAnswer('Query failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-4">
      {/* Header with mode selection */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Ask a question about this company</h2>
        <div className="flex items-center space-x-4">
          {/* Mode selection (strict/open) */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Mode:</span>
            <select
              value={mode}
              onChange={(e) => onModeChange(e.target.value as 'strict' | 'open')}
              className="border rounded px-2 py-1 text-sm"
              disabled={loading}
            >
              <option value="strict">Strict (Explicit Only)</option>
              <option value="open">Open (With Inferences)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Query input and submit button */}
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. What makes this company stand out?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleQuery()}
        />
        <button
          onClick={handleQuery}
          className={`px-4 py-2 rounded text-white transition-colors ${
            loading 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={loading || !query.trim()}
        >
          {loading ? 'Asking...' : 'Ask'}
        </button>
      </div>

      {/* Answer display */}
      {answer && (
        <div className={`bg-gray-100 p-4 rounded text-gray-800 ${loading ? 'opacity-50' : ''}`}>
          <strong>Answer:</strong> {answer}
        </div>
      )}
    </div>
  );
}

/**
 * Main component for the business information extractor.
 * Handles the extraction process and displays the results.
 */
export default function Home() {
  // State for managing the extraction process
  const [url, setUrl] = useState('');
  const [extractedFields, setExtractedFields] = useState<ExtractionFields | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractMode, setExtractMode] = useState<'strict' | 'open'>('strict');
  const [queryMode, setQueryMode] = useState<'strict' | 'open'>('strict');

  /**
   * Handles the extraction of business information from a URL.
   * Manages loading states and error handling.
   */
  const handleExtract = async () => {
    setLoading(true);
    setError(null);
    setExtractedFields(null);

    if (!url) {
      setError('Please enter a URL');
      setLoading(false);
      return;
    }

    // Normalize URL by adding https:// if missing
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl, mode: extractMode }),
      });

      const data: ApiResponse = await res.json();

      if (!res.ok) {
        if (isErrorResponse(data)) {
          setError(data.message);
          if (data.details) {
            console.error('Error details:', data.details);
          }
        } else {
          setError('Something went wrong');
        }
      } else if (isExtractionResponse(data)) {
        setExtractedFields(data.extractedFields);
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Network error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Business Information Extractor</h1>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          className="flex-1 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter a business website URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />
        <select
          value={extractMode}
          onChange={(e) => setExtractMode(e.target.value as 'strict' | 'open')}
          className="border rounded px-2 py-1 text-sm"
          disabled={loading}
        >
          <option value="strict">Strict (Explicit Only)</option>
          <option value="open">Open (With Inferences)</option>
        </select>
        <button
          onClick={handleExtract}
          className={`px-4 py-2 rounded text-white transition-colors ${
            loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={loading}
        >
          {loading ? 'Extracting...' : 'Extract'}
        </button>
      </div>
      {error && (
        <div className="bg-red-100 text-red-800 p-2 rounded mb-4 border border-red-200">
          {error}
        </div>
      )}
      {extractedFields && (
        <>
          <ExtractedFieldsDisplay fields={extractedFields} />
          <QueryInterface
            extractedFields={extractedFields}
            mode={queryMode}
            onModeChange={setQueryMode}
          />
        </>
      )}
    </main>
  );
}

/**
 * Component for displaying the extracted fields in a readable format.
 * @param fields - The extracted fields to display.
 */
function ExtractedFieldsDisplay({ fields }: { fields: ExtractionFields }) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-2">Extracted Fields</h2>
      <div className="space-y-4">
        {Object.entries(fields).map(([key, value]) => (
          <div key={key} className="bg-white p-4 rounded border shadow-sm">
            <span className="font-semibold text-gray-700">{key.toUpperCase()}:</span>
            <span className="ml-2 text-gray-900">{value || DEFAULT_FIELD_VALUE}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
