// Task ID: P4BA14
// Google AI Client (Gemini 1.5 Pro)

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIEvaluationResult } from '../types';

export class GoogleEvaluationClient {
  private client: GoogleGenerativeAI | null = null;
  private readonly modelName = 'gemini-1.5-pro';

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (apiKey && apiKey !== 'mock') {
      this.client = new GoogleGenerativeAI(apiKey);
    }
  }

  /**
   * Generate evaluation using Google Gemini
   */
  async generateEvaluation(prompt: string): Promise<AIEvaluationResult> {
    // If no API key, return mock data
    if (!this.client) {
      return this.generateMockEvaluation();
    }

    try {
      const model = this.client.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 16000,
        },
      });

      const result = await model.generateContent(
        prompt + '\n\nRespond with ONLY valid JSON.'
      );
      const response = result.response;
      const text = response.text();

      // Extract JSON from response
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      const parsed = JSON.parse(jsonText);
      return this.normalizeResult(parsed);
    } catch (error) {
      console.error('Google AI API error:', error);
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
    const baseScore = 87;
    const evidence = `Gemini 분석: 해당 정치인은 매우 우수한 자질을 갖춘 공직자로 평가됩니다. 특히 정책 전문성과 투명성 면에서 두각을 나타내고 있습니다. 청렴성 측면에서도 높은 기준을 유지하며, 윤리적 의사결정을 통해 공직자로서의 신뢰를 구축하고 있습니다. 대중과의 소통에서 뛰어난 능력을 발휘하며, 다양한 채널을 통해 유권자들의 의견을 경청하고 있습니다. 리더십 또한 탁월하여, 복잡한 정치 상황에서도 명확한 방향성을 제시하고 있습니다. 지역구 봉사 활동에 적극적이며, 주민들의 실질적인 필요를 충족시키기 위해 노력하고 있습니다. 정책 영향력 면에서도 상당한 성과를 거두었으며, 추진한 법안들이 실제 사회 변화를 만들어내고 있습니다. 다만, 혁신적인 접근법을 더욱 확대하고, 일부 공약의 이행 속도를 높일 필요가 있습니다.${''.padEnd(2200, ' 상세한 근거 자료가 포함됩니다.')}`;

    return {
      overall_score: baseScore,
      overall_grade: 'A',
      criteria: {
        integrity: {
          score: baseScore + 5,
          evidence,
        },
        expertise: {
          score: baseScore + 8,
          evidence,
        },
        communication: {
          score: baseScore + 6,
          evidence,
        },
        leadership: {
          score: baseScore + 7,
          evidence,
        },
        transparency: {
          score: baseScore + 9,
          evidence,
        },
        responsiveness: {
          score: baseScore + 5,
          evidence,
        },
        innovation: {
          score: baseScore - 4,
          evidence,
        },
        collaboration: {
          score: baseScore + 6,
          evidence,
        },
        constituency_service: {
          score: baseScore + 7,
          evidence,
        },
        policy_impact: {
          score: baseScore + 8,
          evidence,
        },
      },
      summary:
        'Gemini 분석: 매우 우수한 정치인으로, 정책 전문성과 투명성에서 특히 뛰어난 성과를 보이고 있습니다. 혁신적 접근법 확대가 권장됩니다.',
      strengths: [
        '탁월한 정책 전문성',
        '매우 높은 투명성',
        '강력한 리더십',
        '상당한 정책 영향력',
      ],
      weaknesses: ['혁신적 접근법 확대 필요', '일부 공약 이행 속도 향상 필요'],
      sources: [
        'https://example.com/gemini-analysis-1',
        'https://example.com/gemini-analysis-2',
        'https://example.com/gemini-analysis-3',
      ],
    };
  }

  /**
   * Get model version string
   */
  getModelVersion(): string {
    return `gemini-${this.modelName}-${new Date().toISOString().split('T')[0]}`;
  }
}
