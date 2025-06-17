import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { API_CONFIG, LLM_CONFIG } from '@/config/constants';
import { QueryRequest, QueryResponse, QueryError, isQueryError } from '@/types/extraction';
import { log, createErrorResponse } from '@/lib/utils';
import { queryPrompts } from '@/config/prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  let retryCount = 0;
  const startTime = Date.now();

  try {
    const { question, context, mode = API_CONFIG.defaultMode } = await req.json() as QueryRequest;

    if (!question || !context) {
      throw createErrorResponse(
        API_CONFIG.errorCodes.VALIDATION_ERROR,
        'Missing question or context',
        'Both question and context are required'
      );
    }

    const systemPrompt = queryPrompts[mode];

    while (retryCount < LLM_CONFIG.retryAttempts) {
      try {
        log('info', 'Sending query to LLM', { 
          mode, 
          questionLength: question.length, 
          contextLength: context.length,
          attempt: retryCount + 1
        });

        const response = await openai.chat.completions.create({
          model: LLM_CONFIG.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Context:\n${context}\n\nQuestion:\n${question}` },
          ],
          temperature: LLM_CONFIG.temperature[mode],
          max_tokens: LLM_CONFIG.maxTokens,
        });

        const answer = response.choices[0].message.content?.trim();
        if (!answer) {
          throw createErrorResponse(
            API_CONFIG.errorCodes.QUERY_ERROR,
            'No answer generated'
          );
        }

        const processingTime = Date.now() - startTime;
        log('info', 'Received answer from LLM', { 
          answerLength: answer.length,
          processingTime,
          tokenCount: response.usage?.total_tokens
        });

        const result: QueryResponse = { 
          answer,
          confidence: 0.8, // TODO: Add confidence scoring
          processingTime,
          tokenCount: response.usage?.total_tokens
        };
        return NextResponse.json(result);
      } catch (error) {
        retryCount++;
        log('warn', 'Query attempt failed', { 
          attempt: retryCount, 
          maxRetries: LLM_CONFIG.retryAttempts,
          error 
        });

        if (retryCount >= LLM_CONFIG.retryAttempts) {
          throw error;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, LLM_CONFIG.retryDelay));
      }
    }

    throw createErrorResponse(
      API_CONFIG.errorCodes.QUERY_ERROR,
      'Failed to get an answer after multiple attempts'
    );
  } catch (error: unknown) {
    log('error', 'Query error', { error });
    
    if (isQueryError(error)) {
      return NextResponse.json(error, { status: 500 });
    }

    const queryError: QueryError = createErrorResponse(
      API_CONFIG.errorCodes.QUERY_ERROR,
      'Failed to get an answer',
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(queryError, { status: 500 });
  }
}
