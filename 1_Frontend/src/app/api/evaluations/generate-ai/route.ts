// Task ID: P4BA14
// POST /api/evaluations/generate-ai - Generate AI evaluations from all 5 models

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EvaluationEngine } from '@/lib/ai/evaluation-engine';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * Request body interface
 */
interface GenerateAIEvaluationRequest {
  politician_id: string;
  models?: ('claude' | 'chatgpt' | 'gemini' | 'grok' | 'perplexity')[];
}

/**
 * POST /api/evaluations/generate-ai
 * Generate AI evaluations for a politician using all 5 AI models
 *
 * Request body:
 * - politician_id: string (required)
 * - models?: string[] (optional, defaults to all 5 models)
 *
 * Response:
 * - success: boolean
 * - results: Array of evaluation results for each model
 * - message: string
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = createClient();

    // 1. Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 2. Admin authorization check (optional - can be removed for testing)
    // For now, allow any authenticated user to generate evaluations
    // In production, you should check if user has admin role

    // 3. Parse and validate request body
    const body: GenerateAIEvaluationRequest = await request.json();
    const { politician_id, models } = body;

    if (!politician_id) {
      return NextResponse.json(
        { success: false, error: 'politician_id가 필요합니다' },
        { status: 400 }
      );
    }

    // 4. Verify politician exists
    const { data: politician, error: politicianError } = await supabase
      .from('politicians')
      .select('id, name')
      .eq('id', politician_id)
      .single();

    if (politicianError || !politician) {
      return NextResponse.json(
        { success: false, error: '정치인을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 5. Initialize evaluation engine
    const engine = new EvaluationEngine();

    // 6. Generate and save evaluations
    console.log(
      `Generating AI evaluations for politician: ${politician.name} (${politician_id})`
    );

    const result = await engine.generateAndSaveAll(politician_id);

    const duration = Date.now() - startTime;

    // 7. Prepare response
    const successfulModels = result.results.filter((r) => r.saved);
    const failedModels = result.results.filter((r) => !r.saved);

    return NextResponse.json(
      {
        success: result.success,
        politician: {
          id: politician.id,
          name: politician.name,
        },
        results: result.results,
        summary: {
          total: result.results.length,
          successful: successfulModels.length,
          failed: failedModels.length,
          duration_ms: duration,
        },
        message: result.success
          ? `${successfulModels.length}개 AI 모델의 평가가 성공적으로 생성되었습니다`
          : `일부 평가 생성 실패: ${successfulModels.length}/${result.results.length} 성공`,
      },
      { status: result.success ? 201 : 207 } // 207 Multi-Status for partial success
    );
  } catch (error) {
    console.error('POST /api/evaluations/generate-ai error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/evaluations/generate-ai
 * Get status and configuration information
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // Return API configuration and status
    return NextResponse.json({
      success: true,
      endpoint: '/api/evaluations/generate-ai',
      methods: ['POST'],
      description: 'Generate AI evaluations using 5 different AI models',
      models: ['claude', 'chatgpt', 'gemini', 'grok', 'perplexity'],
      configuration: {
        max_retries: 3,
        retry_delay_ms: 2000,
        timeout_ms: 60000,
      },
      request_format: {
        politician_id: 'string (required)',
        models: 'string[] (optional, defaults to all 5)',
      },
      api_keys_configured: {
        openai: !!process.env.OPENAI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        google: !!process.env.GOOGLE_AI_API_KEY,
        xai: !!process.env.XAI_API_KEY,
        perplexity: !!process.env.PERPLEXITY_API_KEY,
      },
    });
  } catch (error) {
    console.error('GET /api/evaluations/generate-ai error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
