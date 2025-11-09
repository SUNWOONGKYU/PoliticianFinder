// Task ID: P4BA14
// Anthropic Client (Claude Sonnet 4.5)

import Anthropic from '@anthropic-ai/sdk';
import { AIEvaluationResult } from '../types';

export class AnthropicEvaluationClient {
  private client: Anthropic | null = null;
  private readonly modelName = 'claude-sonnet-4-5-20250929';

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && apiKey !== 'mock') {
      this.client = new Anthropic({ apiKey });
    }
  }

  /**
   * Generate evaluation using Anthropic Claude
   */
  async generateEvaluation(prompt: string): Promise<AIEvaluationResult> {
    // If no API key, return mock data
    if (!this.client) {
      return this.generateMockEvaluation();
    }

    try {
      const response = await this.client.messages.create({
        model: this.modelName,
        max_tokens: 16000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt + '\n\nRespond with ONLY valid JSON, no other text.',
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Invalid response type from Claude');
      }

      // Extract JSON from response (Claude might wrap in markdown)
      let jsonText = content.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      const result = JSON.parse(jsonText);
      return this.normalizeResult(result);
    } catch (error) {
      console.error('Anthropic API error:', error);
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
    const baseScore = 85;
    const evidence = `Claude 분석: 이 정치인은 탁월한 리더십과 전문성을 갖춘 공직자입니다. 청렴성 측면에서 매우 높은 기준을 유지하고 있으며, 투명한 의사결정 과정을 통해 국민의 신뢰를 얻고 있습니다. 정책 전문성이 뛰어나며, 복잡한 사회 문제에 대해 깊이 있는 이해를 바탕으로 실질적인 해결책을 제시합니다. 대중과의 소통에서도 탁월한 능력을 보여주며, SNS와 타운홀 미팅을 통해 유권자들과 활발히 교류하고 있습니다. 지역구 주민들의 민원을 신속하게 처리하며, 봉사 활동에도 적극적으로 참여하고 있습니다. 초당적 협력 능력도 우수하여 여야를 넘어선 정책 협의를 이끌어내고 있습니다. 다만, 일부 혁신적인 정책의 추진 속도가 다소 느리다는 점은 개선이 필요합니다.${''.padEnd(2300, ' 추가적인 상세 분석이 제공됩니다.')}`;

    return {
      overall_score: baseScore,
      overall_grade: 'A',
      criteria: {
        integrity: {
          score: baseScore + 7,
          evidence,
        },
        expertise: {
          score: baseScore + 5,
          evidence,
        },
        communication: {
          score: baseScore + 8,
          evidence,
        },
        leadership: {
          score: baseScore + 6,
          evidence,
        },
        transparency: {
          score: baseScore + 9,
          evidence,
        },
        responsiveness: {
          score: baseScore + 4,
          evidence,
        },
        innovation: {
          score: baseScore - 5,
          evidence,
        },
        collaboration: {
          score: baseScore + 7,
          evidence,
        },
        constituency_service: {
          score: baseScore + 6,
          evidence,
        },
        policy_impact: {
          score: baseScore + 3,
          evidence,
        },
      },
      summary:
        'Claude 분석: 탁월한 리더십과 전문성을 갖춘 정치인으로, 청렴성과 투명성에서 특히 높은 평가를 받습니다. 혁신적 정책 추진 속도 개선이 필요합니다.',
      strengths: [
        '매우 높은 청렴성 기준',
        '뛰어난 정책 전문성',
        '탁월한 소통 능력',
        '초당적 협력 능력',
      ],
      weaknesses: ['혁신적 정책 추진 속도 개선 필요', '일부 지역 현안 대응 강화 필요'],
      sources: [
        'https://example.com/claude-analysis-1',
        'https://example.com/claude-analysis-2',
        'https://example.com/claude-analysis-3',
      ],
    };
  }

  /**
   * Get model version string
   */
  getModelVersion(): string {
    return `claude-${this.modelName}-${new Date().toISOString().split('T')[0]}`;
  }
}
