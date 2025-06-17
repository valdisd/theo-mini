import OpenAI from 'openai';
import { ExtractionFields, DEFAULT_FIELD_VALUE, EXTRACTION_FIELDS } from '@/types/extraction';
import { LLM_CONFIG } from '@/config/constants';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Extracts business information from raw content using LLM.
 * @param rawContent - The raw content to extract information from.
 * @returns The extracted fields.
 */
export async function extractBusinessInfo(rawContent: string): Promise<ExtractionFields> {
  try {
    // Prepare the prompt for the LLM
    const prompt = `Extract business information from the content below. 
For each field, extract ONLY if explicitly stated, otherwise use "${DEFAULT_FIELD_VALUE}".

${Object.values(EXTRACTION_FIELDS)
  .map(field => `=== ${field.label} ===`)
  .join('\n')}

Content:
${rawContent}`;

    // Call the LLM API
    const response = await openai.chat.completions.create({
      model: LLM_CONFIG.model,
      messages: [
        {
          role: 'system',
          content: 'You are a precise business information extractor. Only extract information that is explicitly stated in the content.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    const extractedText = response.choices[0].message.content || '';
    return parseExtractedFields(extractedText);
  } catch (error) {
    console.error('Error extracting business info:', error);
    throw error;
  }
}

/**
 * Parses the raw extracted text into structured fields.
 * @param extractedText - The raw text from the LLM response.
 * @returns The parsed extraction fields.
 */
function parseExtractedFields(extractedText: string): ExtractionFields {
  const fields: ExtractionFields = {} as ExtractionFields;
  const sections = extractedText.split(/^=== .+ ===$/m).slice(1); // Skip first empty section

  Object.entries(EXTRACTION_FIELDS).forEach(([key], index) => {
    const content = sections[index]?.trim() || '';
    fields[key as keyof ExtractionFields] = content || DEFAULT_FIELD_VALUE;
  });

  return fields;
}
