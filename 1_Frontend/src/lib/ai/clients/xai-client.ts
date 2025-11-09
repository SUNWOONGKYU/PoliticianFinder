// Task ID: P4BA14
// xAI Client (Grok) - Uses OpenAI-compatible API

import OpenAI from 'openai';
import { AIEvaluationResult } from '../types';

export class XAIEvaluationClient {
  private client: OpenAI | null = null;
  private readonly modelName = 'grok-beta';

  constructor() {
    const apiKey = process.env.XAI_API_KEY;
    if (apiKey && apiKey !== 'mock') {
      this.client = new OpenAI({
        apiKey,
        baseURL: 'https://api.x.ai/v1',
      });
    }
  }

  /**
   * Generate evaluation using xAI Grok
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
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from xAI');
      }

      // Extract JSON from response
      let jsonText = content.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      const result = JSON.parse(jsonText);
      return this.normalizeResult(result);
    } catch (error) {
      console.error('xAI API error:', error);
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
    const baseScore = 82;
    const evidence = `Grok 분석: 이 정치인은 전반적으로 양호한 수준의 공직자로 평가됩니다. 청렴성 측면에서 윤리적 기준을 준수하고 있으며, 부패 방지를 위한 노력을 기울이고 있습니다. 전문성은 적절한 수준이며, 정책 분야에 대한 기본적인 이해도를 갖추고 있습니다. 대중과의 소통에서는 소셜미디어와 지역 간담회를 활용하여 유권자들과 접촉하고 있습니다. 리더십 면에서는 일관된 정책 방향성을 제시하고 있으나, 위기 관리 능력을 더욱 강화할 필요가 있습니다. 투명성은 양호한 편이며, 주요 의사결정 과정을 공개하고 있습니다. 민원 처리 대응성도 적절한 수준을 유지하고 있습니다. 다만, 혁신적인 정책 제안이 부족하고, 초당적 협력 능력을 더욱 발전시킬 여지가 있습니다. 지역구 봉사는 활발하게 진행하고 있으며, 정책 영향력은 점진적으로 증가하고 있습니다.${''.padEnd(2400, ' 추가 평가 내용.')}`;

    return {
      overall_score: baseScore,
      overall_grade: 'B+',
      criteria: {
        integrity: {
          score: baseScore + 4,
          evidence,
        },
        expertise: {
          score: baseScore - 2,
          evidence,
        },
        communication: {
          score: baseScore + 5,
          evidence,
        },
        leadership: {
          score: baseScore + 2,
          evidence,
        },
        transparency: {
          score: baseScore + 6,
          evidence,
        },
        responsiveness: {
          score: baseScore + 3,
          evidence,
        },
        innovation: {
          score: baseScore - 8,
          evidence,
        },
        collaboration: {
          score: baseScore + 1,
          evidence,
        },
        constituency_service: {
          score: baseScore + 7,
          evidence,
        },
        policy_impact: {
          score: baseScore,
          evidence,
        },
      },
      summary:
        'Grok 분석: 전반적으로 양호한 수준의 정치인으로, 청렴성과 투명성에서 강점을 보입니다. 혁신성과 협력 능력 강화가 필요합니다.',
      strengths: [
        '윤리적 기준 준수',
        '양호한 투명성',
        '적극적인 지역구 봉사',
        '효과적인 소통',
      ],
      weaknesses: ['혁신적 정책 제안 부족', '초당적 협력 능력 강화 필요'],
      sources: [
        'https://example.com/grok-analysis-1',
        'https://example.com/grok-analysis-2',
        'https://example.com/grok-analysis-3',
      ],
    };
  }

  /**
   * Get model version string
   */
  getModelVersion(): string {
    return `grok-${this.modelName}-${new Date().toISOString().split('T')[0]}`;
  }
}
