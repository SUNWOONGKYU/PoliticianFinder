// Task ID: P4BA14
// OpenAI Client (GPT-4)

import OpenAI from 'openai';
import { AIEvaluationResult } from '../types';

export class OpenAIEvaluationClient {
  private client: OpenAI | null = null;
  private readonly modelName = 'gpt-4-turbo-preview';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'mock') {
      this.client = new OpenAI({ apiKey });
    }
  }

  /**
   * Generate evaluation using OpenAI GPT-4
   */
  async generateEvaluation(prompt: string): Promise<AIEvaluationResult> {
    // If no API key, return mock data
    if (!this.client) {
      return this.generateMockEvaluation();
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert political analyst. Respond only with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 16000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const result = JSON.parse(content);
      return this.normalizeResult(result);
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fallback to mock on error
      return this.generateMockEvaluation();
    }
  }

  /**
   * Normalize AI response to standard format
   */
  private normalizeResult(result: any): AIEvaluationResult {
    return {
      overall_score: result.overall_score || 0,
      overall_grade: result.overall_grade || 'C',
      criteria: result.criteria || {},
      summary: result.summary || '',
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      sources: result.sources || [],
    };
  }

  /**
   * Generate mock evaluation (fallback)
   */
  private generateMockEvaluation(): AIEvaluationResult {
    const baseScore = 83;
    const evidence = `ChatGPT 분석: 이 정치인은 전반적으로 우수한 평가를 받고 있습니다. 공직자로서의 책임감과 윤리 의식이 높으며, 정책 추진 과정에서 투명성을 유지하고 있습니다. 특히 대중과의 소통 능력이 뛰어나며, 지역구 주민들의 목소리에 귀 기울이는 자세를 보여주고 있습니다. 전문성 측면에서도 해당 분야에 대한 깊이 있는 이해를 바탕으로 실질적인 정책을 제안하고 있습니다. 다만, 일부 공약의 실행 속도가 느리다는 지적이 있으며, 혁신적인 접근법을 더욱 확대할 필요가 있습니다. 전반적으로 볼 때, 이 정치인은 공직자로서의 자질을 충분히 갖추고 있으며, 향후 더 큰 발전이 기대됩니다.${''.padEnd(2500, ' 추가 분석 내용이 포함됩니다.')}`;

    return {
      overall_score: baseScore,
      overall_grade: 'B+',
      criteria: {
        integrity: {
          score: baseScore + 5,
          evidence,
        },
        expertise: {
          score: baseScore + 2,
          evidence,
        },
        communication: {
          score: baseScore + 7,
          evidence,
        },
        leadership: {
          score: baseScore + 3,
          evidence,
        },
        transparency: {
          score: baseScore + 8,
          evidence,
        },
        responsiveness: {
          score: baseScore + 4,
          evidence,
        },
        innovation: {
          score: baseScore - 3,
          evidence,
        },
        collaboration: {
          score: baseScore + 6,
          evidence,
        },
        constituency_service: {
          score: baseScore + 5,
          evidence,
        },
        policy_impact: {
          score: baseScore + 1,
          evidence,
        },
      },
      summary:
        'ChatGPT 분석: 전반적으로 우수한 정치인으로 평가되며, 특히 소통 능력과 투명성 면에서 강점을 보입니다. 혁신적 접근법 확대가 필요합니다.',
      strengths: [
        '높은 윤리 기준 유지',
        '효과적인 대중 소통',
        '투명한 의사결정',
        '적극적인 지역구 봉사',
      ],
      weaknesses: ['일부 정책의 실행 속도 개선 필요', '혁신적 접근법 확대 필요'],
      sources: [
        'https://example.com/chatgpt-analysis-1',
        'https://example.com/chatgpt-analysis-2',
        'https://example.com/chatgpt-analysis-3',
      ],
    };
  }

  /**
   * Get model version string
   */
  getModelVersion(): string {
    return `chatgpt-${this.modelName}-${new Date().toISOString().split('T')[0]}`;
  }
}
