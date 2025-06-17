import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { API_CONFIG, LLM_CONFIG } from '@/config/constants';
import { 
  ExtractionRequest, 
  ExtractionResult, 
  ExtractionError, 
  isExtractionError,
  ExtractionFields
} from '@/types/extraction';
import { log, createErrorResponse, generateId } from '@/lib/utils';
import { scrapePage } from '@/lib/scraper';
import { extractionPrompts } from '@/config/prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { url, mode = API_CONFIG.defaultMode } = await req.json() as ExtractionRequest;

    if (!url) {
      throw createErrorResponse(
        API_CONFIG.errorCodes.VALIDATION_ERROR,
        'Missing URL',
        'URL is required'
      );
    }

    log('info', 'Starting extraction', { url, mode });

    // Scrape the webpage
    const scrapingResult = await scrapePage(url);
    log('info', 'Scraping complete', { 
      textLength: scrapingResult.rawText.length,
      sourceType: scrapingResult.sourceUrl.type
    });

    // Extract fields using LLM
    const systemPrompt = extractionPrompts[mode];

    const response = await openai.chat.completions.create({
      model: LLM_CONFIG.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: scrapingResult.rawText },
      ],
      temperature: LLM_CONFIG.temperature[mode],
    });

    const extractedText = response.choices[0].message.content?.trim();
    if (!extractedText) {
      throw createErrorResponse(
        API_CONFIG.errorCodes.EXTRACTION_ERROR,
        'No content extracted'
      );
    }

    // Parse the extracted fields
    const rawFields = parseExtractedFields(extractedText);
    log('info', 'Fields extracted', { fieldCount: Object.keys(rawFields).length });

    // Convert raw fields to typed fields
    const fields: ExtractionFields = {
      mission: rawFields['COMPANY MISSION/VISION'] || 'Not found',
      product: rawFields['PRODUCT DESCRIPTION'] || 'Not found',
      value: rawFields['UNIQUE VALUE PROPOSITION'] || 'Not found'
    };

    const result: ExtractionResult = {
      id: generateId(),
      metadata: {
        processingTime: 0, // TODO: Add timing
        confidence: 0.8, // TODO: Add confidence scoring
        version: API_CONFIG.version,
        timestamp: new Date().toISOString(),
        sourceUrl: scrapingResult.sourceUrl,
        model: LLM_CONFIG.model,
        mode,
      },
      rawContent: scrapingResult.rawText,
      extractedFields: fields
    };

    return NextResponse.json(result);
  } catch (error: unknown) {
    log('error', 'Extraction error', { error });
    
    if (isExtractionError(error)) {
      return NextResponse.json(error, { status: 500 });
    }

    const extractionError: ExtractionError = createErrorResponse(
      API_CONFIG.errorCodes.EXTRACTION_ERROR,
      'Failed to extract information',
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(extractionError, { status: 500 });
  }
}

/**
 * Parse the extracted fields from the LLM response
 */
function parseExtractedFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const lines = text.split('\n');

  let currentField = '';
  let currentValue = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check if this is a field header
    if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
      // Save previous field if exists
      if (currentField) {
        fields[currentField] = currentValue.trim();
      }

      // Start new field
      currentField = trimmedLine
        .replace(/^[-*]\s*/, '')
        .split(':')[0]
        .trim()
        .toUpperCase();
      currentValue = trimmedLine.split(':').slice(1).join(':').trim();
    } else {
      // Continue with current field
      currentValue += ' ' + trimmedLine;
    }
  }

  // Save last field
  if (currentField) {
    fields[currentField] = currentValue.trim();
  }

  return fields;
}
