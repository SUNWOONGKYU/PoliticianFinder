/**
 * Project Grid Task ID: P4BA7
 * 작업명: 자동 중재 시스템 - AI 분석기
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5
 * 설명: OpenAI API를 활용한 콘텐츠 분석 및 심각도 평가
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ContentAnalysisRequest {
  content: string;
  contentType: 'post' | 'comment';
  context?: {
    authorId?: string;
    previousViolations?: number;
  };
}

export interface ContentAnalysisResult {
  severity: number; // 0-100
  categories: ViolationCategory[];
  reasoning: string;
  confidence: number; // 0-1
  recommendations: string[];
}

export interface ViolationCategory {
  type: ViolationType;
  score: number; // 0-100
  examples: string[];
}

export type ViolationType =
  | 'profanity' // 욕설/비방
  | 'hate_speech' // 혐오 표현
  | 'spam' // 스팸/광고
  | 'personal_info' // 개인정보 노출
  | 'misinformation' // 허위정보
  | 'harassment' // 괴롭힘
  | 'violence' // 폭력적 표현
  | 'sexual_content'; // 성적 콘텐츠

// ============================================================================
// Constants
// ============================================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// 분석 시스템 프롬프트
const SYSTEM_PROMPT = `당신은 온라인 커뮤니티 콘텐츠 심사 전문가입니다.
정치인 정보 플랫폼의 콘텐츠를 분석하여 커뮤니티 가이드라인 위반 여부를 평가합니다.

## 평가 기준

다음 카테고리별로 0-100점으로 심각도를 평가하세요:

1. **욕설/비방 (profanity)**: 욕설, 모욕, 인신공격
2. **혐오 표현 (hate_speech)**: 특정 집단에 대한 차별, 혐오, 편견
3. **스팸/광고 (spam)**: 무관한 광고, 반복적 도배, 홍보성 콘텐츠
4. **개인정보 노출 (personal_info)**: 동의 없는 개인정보 공개
5. **허위정보 (misinformation)**: 사실관계가 명백히 틀린 정보
6. **괴롭힘 (harassment)**: 지속적이고 악의적인 괴롭힘
7. **폭력적 표현 (violence)**: 폭력 조장, 위협
8. **성적 콘텐츠 (sexual_content)**: 부적절한 성적 표현

## 점수 기준

- **0-30점**: 정상 범위 (경미하거나 문맥상 허용 가능)
- **31-70점**: 주의 필요 (관리자 검토 권장)
- **71-100점**: 심각한 위반 (즉시 조치 필요)

## 출력 형식

JSON 형식으로 다음 정보를 반환하세요:
{
  "severity": <전체 심각도 0-100>,
  "categories": [
    {
      "type": "<카테고리명>",
      "score": <카테고리별 점수 0-100>,
      "examples": ["<위반 사례1>", "<위반 사례2>"]
    }
  ],
  "reasoning": "<평가 근거 상세 설명>",
  "confidence": <신뢰도 0-1>,
  "recommendations": ["<권장 조치1>", "<권장 조치2>"]
}

## 중요 사항

- 정치적 의견 표현과 혐오 표현을 구분하세요
- 문맥을 고려하여 평가하세요
- 객관적이고 일관된 기준을 적용하세요
- 불확실한 경우 보수적으로 평가하세요`;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 환경 변수 검증
 */
function validateEnvironment(): void {
  if (!OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.'
    );
  }
}

/**
 * OpenAI API 호출
 */
async function callOpenAI(
  userPrompt: string,
  systemPrompt: string = SYSTEM_PROMPT
): Promise<string> {
  validateEnvironment();

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // 일관성을 위해 낮은 temperature
      response_format: { type: 'json_object' }, // JSON 모드 활성화
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI API 호출 실패: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error('OpenAI API 응답에 choices가 없습니다.');
  }

  return data.choices[0].message.content;
}

/**
 * AI 응답 파싱 및 검증
 */
function parseAIResponse(response: string): ContentAnalysisResult {
  try {
    const parsed = JSON.parse(response);

    // 필수 필드 검증
    if (
      typeof parsed.severity !== 'number' ||
      !Array.isArray(parsed.categories) ||
      typeof parsed.reasoning !== 'string' ||
      typeof parsed.confidence !== 'number' ||
      !Array.isArray(parsed.recommendations)
    ) {
      throw new Error('응답 형식이 올바르지 않습니다.');
    }

    // 값 범위 검증
    if (parsed.severity < 0 || parsed.severity > 100) {
      throw new Error('severity는 0-100 범위여야 합니다.');
    }

    if (parsed.confidence < 0 || parsed.confidence > 1) {
      throw new Error('confidence는 0-1 범위여야 합니다.');
    }

    // 카테고리 검증
    for (const category of parsed.categories) {
      if (
        typeof category.type !== 'string' ||
        typeof category.score !== 'number' ||
        !Array.isArray(category.examples)
      ) {
        throw new Error('카테고리 형식이 올바르지 않습니다.');
      }

      if (category.score < 0 || category.score > 100) {
        throw new Error('카테고리 점수는 0-100 범위여야 합니다.');
      }
    }

    return parsed as ContentAnalysisResult;
  } catch (error) {
    console.error('AI 응답 파싱 오류:', error);
    throw new Error(
      `AI 응답 파싱 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    );
  }
}

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * 콘텐츠 분석 (OpenAI GPT-4 사용)
 *
 * @param request 분석 요청 정보
 * @returns 분석 결과
 *
 * @example
 * const result = await analyzeContent({
 *   content: '이 시발새끼야',
 *   contentType: 'comment'
 * });
 * console.log(result.severity); // 85
 */
export async function analyzeContent(
  request: ContentAnalysisRequest
): Promise<ContentAnalysisResult> {
  try {
    // 입력 검증
    if (!request.content || request.content.trim().length === 0) {
      return {
        severity: 0,
        categories: [],
        reasoning: '빈 콘텐츠입니다.',
        confidence: 1.0,
        recommendations: [],
      };
    }

    // 사용자 프롬프트 생성
    const userPrompt = `
다음 ${request.contentType === 'post' ? '게시글' : '댓글'}을 분석해 주세요.

## 콘텐츠
${request.content}

## 추가 정보
- 콘텐츠 타입: ${request.contentType === 'post' ? '게시글' : '댓글'}
${request.context?.previousViolations ? `- 작성자 이전 위반 횟수: ${request.context.previousViolations}회` : ''}

위의 시스템 프롬프트에 따라 JSON 형식으로 분석 결과를 반환해 주세요.
`.trim();

    console.log('[AI 분석기] 분석 시작:', {
      contentType: request.contentType,
      contentLength: request.content.length,
      context: request.context,
    });

    // OpenAI API 호출
    const aiResponse = await callOpenAI(userPrompt);

    console.log('[AI 분석기] AI 응답 수신:', {
      responseLength: aiResponse.length,
    });

    // 응답 파싱
    const result = parseAIResponse(aiResponse);

    console.log('[AI 분석기] 분석 완료:', {
      severity: result.severity,
      confidence: result.confidence,
      categoriesCount: result.categories.length,
    });

    return result;
  } catch (error) {
    console.error('[AI 분석기] 오류:', error);

    // 오류 발생 시 안전한 기본값 반환
    return {
      severity: 50, // 중간값으로 보수적 평가 (관리자 검토 필요)
      categories: [],
      reasoning: `분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      confidence: 0,
      recommendations: ['관리자가 직접 검토해야 합니다.'],
    };
  }
}

// ============================================================================
// Batch Analysis
// ============================================================================

/**
 * 여러 콘텐츠 일괄 분석
 *
 * @param requests 분석 요청 배열
 * @returns 분석 결과 배열
 */
export async function analyzeBatch(
  requests: ContentAnalysisRequest[]
): Promise<ContentAnalysisResult[]> {
  const results: ContentAnalysisResult[] = [];

  for (const request of requests) {
    try {
      const result = await analyzeContent(request);
      results.push(result);

      // Rate limiting 방지를 위한 딜레이
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('[AI 분석기] 배치 분석 오류:', error);

      // 오류 발생 시 안전한 기본값 추가
      results.push({
        severity: 50,
        categories: [],
        reasoning: '배치 분석 중 오류 발생',
        confidence: 0,
        recommendations: ['관리자가 직접 검토해야 합니다.'],
      });
    }
  }

  return results;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 심각도 점수를 액션으로 변환
 *
 * @param severity 심각도 점수 (0-100)
 * @returns 권장 액션
 */
export function severityToAction(
  severity: number
): 'ignore' | 'review' | 'delete' {
  if (severity <= 30) {
    return 'ignore';
  } else if (severity <= 70) {
    return 'review';
  } else {
    return 'delete';
  }
}

/**
 * 카테고리별 최고 점수 추출
 *
 * @param categories 위반 카테고리 배열
 * @returns 최고 점수 카테고리
 */
export function getHighestScoringCategory(
  categories: ViolationCategory[]
): ViolationCategory | null {
  if (categories.length === 0) {
    return null;
  }

  return categories.reduce((max, category) =>
    category.score > max.score ? category : max
  );
}

/**
 * 분석 결과 요약
 *
 * @param result 분석 결과
 * @returns 요약 텍스트
 */
export function summarizeAnalysis(result: ContentAnalysisResult): string {
  const action = severityToAction(result.severity);
  const highestCategory = getHighestScoringCategory(result.categories);

  let summary = `심각도: ${result.severity}점 (${action === 'ignore' ? '정상' : action === 'review' ? '검토 필요' : '심각'})`;

  if (highestCategory) {
    summary += `\n주요 위반: ${highestCategory.type} (${highestCategory.score}점)`;
  }

  summary += `\n신뢰도: ${(result.confidence * 100).toFixed(0)}%`;
  summary += `\n\n평가 근거:\n${result.reasoning}`;

  if (result.recommendations.length > 0) {
    summary += `\n\n권장 조치:\n${result.recommendations.map((r) => `- ${r}`).join('\n')}`;
  }

  return summary;
}

// ============================================================================
// Exports
// ============================================================================

export default {
  analyzeContent,
  analyzeBatch,
  severityToAction,
  getHighestScoringCategory,
  summarizeAnalysis,
};
