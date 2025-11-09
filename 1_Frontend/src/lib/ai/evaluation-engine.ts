// Task ID: P4BA14
// AI Evaluation Engine - Orchestrates all 5 AI models

import { createClient } from '@/lib/supabase/server';
import {
  AIModel,
  AIEvaluationResult,
  PoliticianEvaluationData,
  DatabaseEvaluation,
  RetryConfig,
} from './types';
import { generateEvaluationPrompt, validateEvaluationResponse } from './prompts/evaluation-prompt';
import { OpenAIEvaluationClient } from './clients/openai-client';
import { AnthropicEvaluationClient } from './clients/anthropic-client';
import { GoogleEvaluationClient } from './clients/google-client';
import { XAIEvaluationClient } from './clients/xai-client';
import { PerplexityEvaluationClient } from './clients/perplexity-client';

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 2000,
  timeout: 60000,
};

/**
 * AI Evaluation Engine
 * Coordinates evaluation generation across 5 AI models
 */
export class EvaluationEngine {
  private clients: {
    chatgpt: OpenAIEvaluationClient;
    claude: AnthropicEvaluationClient;
    gemini: GoogleEvaluationClient;
    grok: XAIEvaluationClient;
    perplexity: PerplexityEvaluationClient;
  };

  constructor() {
    this.clients = {
      chatgpt: new OpenAIEvaluationClient(),
      claude: new AnthropicEvaluationClient(),
      gemini: new GoogleEvaluationClient(),
      grok: new XAIEvaluationClient(),
      perplexity: new PerplexityEvaluationClient(),
    };
  }

  /**
   * Fetch politician data from database
   */
  async fetchPoliticianData(
    politicianId: string
  ): Promise<PoliticianEvaluationData | null> {
    const supabase = createClient();

    // Fetch politician basic info
    const { data: politician, error } = await supabase
      .from('politicians')
      .select(
        `
        id,
        name,
        bio,
        political_party_id,
        position_id,
        constituency_id
      `
      )
      .eq('id', politicianId)
      .single();

    if (error || !politician) {
      console.error('Failed to fetch politician:', error);
      return null;
    }

    // Fetch related data (pledges, activities, etc.)
    // For now, use mock data for pledges and news
    // TODO: Integrate with actual pledges and news APIs when available

    return {
      id: politician.id,
      name: politician.name,
      party: 'Democratic Party', // Mock - should fetch from political_party_id
      position: 'National Assembly Member', // Mock - should fetch from position_id
      region: 'Seoul Gangnam', // Mock - should fetch from constituency_id
      bio: politician.bio || undefined,
      recentActivities: [
        '2024년 11월: 지역 주민 간담회 개최',
        '2024년 10월: 교육법 개정안 발의',
        '2024년 09월: 국정감사 참여',
      ],
      pledges: [
        {
          title: '교통 인프라 개선',
          description: '지하철 9호선 연장 추진',
          status: 'in_progress',
        },
        {
          title: '교육 예산 증액',
          description: '초중고 교육 예산 20% 증액',
          status: 'completed',
        },
      ],
      newsArticles: [
        {
          title: '국회의원 주요 법안 통과',
          summary: '교육법 개정안이 국회 본회의를 통과했습니다.',
          url: 'https://example.com/news1',
        },
        {
          title: '지역 봉사 활동 참여',
          summary: '주말 지역 주민과 함께 환경 정화 활동을 진행했습니다.',
          url: 'https://example.com/news2',
        },
      ],
    };
  }

  /**
   * Generate evaluation using a specific AI model with retry logic
   */
  private async generateWithRetry(
    model: AIModel,
    prompt: string,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<AIEvaluationResult | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Timeout')),
            config.timeout
          )
        );

        const evaluationPromise = this.clients[model].generateEvaluation(prompt);

        const result = await Promise.race([evaluationPromise, timeoutPromise]);

        // Validate response
        if (validateEvaluationResponse(result)) {
          return result;
        } else {
          throw new Error('Invalid evaluation response structure');
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(
          `Attempt ${attempt}/${config.maxRetries} failed for ${model}:`,
          lastError.message
        );

        if (attempt < config.maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, config.retryDelay * attempt)
          );
        }
      }
    }

    console.error(
      `All retry attempts failed for ${model}:`,
      lastError?.message
    );
    return null;
  }

  /**
   * Generate evaluations from all 5 AI models in parallel
   */
  async generateAllEvaluations(
    politicianId: string
  ): Promise<{ model: AIModel; result: AIEvaluationResult | null }[]> {
    // 1. Fetch politician data
    const politician = await this.fetchPoliticianData(politicianId);
    if (!politician) {
      throw new Error('Politician not found');
    }

    // 2. Generate prompt
    const prompt = generateEvaluationPrompt(politician);

    // 3. Call all 5 AI models in parallel
    const models: AIModel[] = ['chatgpt', 'claude', 'gemini', 'grok', 'perplexity'];

    const results = await Promise.allSettled(
      models.map((model) => this.generateWithRetry(model, prompt))
    );

    // 4. Combine results
    return results.map((result, index) => ({
      model: models[index],
      result:
        result.status === 'fulfilled' ? result.value : null,
    }));
  }

  /**
   * Convert AI evaluation result to database format
   */
  private convertToDBFormat(
    politicianId: string,
    model: AIModel,
    result: AIEvaluationResult,
    modelVersion: string
  ): DatabaseEvaluation {
    const evaluationDate = new Date().toISOString().split('T')[0];

    return {
      politician_id: politicianId,
      evaluation_date: evaluationDate,
      overall_score: result.overall_score,
      overall_grade: result.overall_grade,
      pledge_completion_rate: Math.floor(Math.random() * 20) + 80, // Mock: 80-100
      activity_score: Math.floor(Math.random() * 15) + 85, // Mock: 85-100
      controversy_score: Math.floor(Math.random() * 30) + 70, // Mock: 70-100
      public_sentiment_score: Math.floor(Math.random() * 20) + 75, // Mock: 75-95
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      summary: result.summary,
      detailed_analysis: {
        integrity_score: result.criteria.integrity.score,
        integrity_evidence: result.criteria.integrity.evidence,
        expertise_score: result.criteria.expertise.score,
        expertise_evidence: result.criteria.expertise.evidence,
        communication_score: result.criteria.communication.score,
        communication_evidence: result.criteria.communication.evidence,
        leadership_score: result.criteria.leadership.score,
        leadership_evidence: result.criteria.leadership.evidence,
        transparency_score: result.criteria.transparency.score,
        transparency_evidence: result.criteria.transparency.evidence,
        responsiveness_score: result.criteria.responsiveness.score,
        responsiveness_evidence: result.criteria.responsiveness.evidence,
        innovation_score: result.criteria.innovation.score,
        innovation_evidence: result.criteria.innovation.evidence,
        collaboration_score: result.criteria.collaboration.score,
        collaboration_evidence: result.criteria.collaboration.evidence,
        constituency_service_score: result.criteria.constituency_service.score,
        constituency_service_evidence:
          result.criteria.constituency_service.evidence,
        policy_impact_score: result.criteria.policy_impact.score,
        policy_impact_evidence: result.criteria.policy_impact.evidence,
      },
      sources: result.sources,
      ai_model_version: modelVersion,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Save evaluation to database (Upsert)
   */
  async saveEvaluation(
    politicianId: string,
    model: AIModel,
    result: AIEvaluationResult
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    const supabase = createClient();

    // Get model version
    const modelVersion = this.clients[model].getModelVersion();

    // Convert to database format
    const dbEvaluation = this.convertToDBFormat(
      politicianId,
      model,
      result,
      modelVersion
    );

    // Check for existing evaluation
    const { data: existing } = await supabase
      .from('ai_evaluations')
      .select('id')
      .eq('politician_id', politicianId)
      .eq('ai_model_version', modelVersion)
      .single();

    let data, error;

    if (existing) {
      // Update existing
      ({ data, error } = await supabase
        .from('ai_evaluations')
        .update(dbEvaluation)
        .eq('id', existing.id)
        .select()
        .single());
    } else {
      // Insert new
      ({ data, error } = await supabase
        .from('ai_evaluations')
        .insert(dbEvaluation)
        .select()
        .single());
    }

    if (error) {
      console.error('Database save error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  /**
   * Generate and save evaluations for all 5 AI models
   */
  async generateAndSaveAll(
    politicianId: string
  ): Promise<{
    success: boolean;
    results: { model: AIModel; saved: boolean; error?: string }[];
  }> {
    // Generate evaluations
    const evaluations = await this.generateAllEvaluations(politicianId);

    // Save each evaluation
    const saveResults = await Promise.all(
      evaluations.map(async ({ model, result }) => {
        if (!result) {
          return {
            model,
            saved: false,
            error: 'Failed to generate evaluation',
          };
        }

        const saveResult = await this.saveEvaluation(
          politicianId,
          model,
          result
        );

        return {
          model,
          saved: saveResult.success,
          error: saveResult.error,
        };
      })
    );

    const allSaved = saveResults.every((r) => r.saved);

    return {
      success: allSaved,
      results: saveResults,
    };
  }
}
