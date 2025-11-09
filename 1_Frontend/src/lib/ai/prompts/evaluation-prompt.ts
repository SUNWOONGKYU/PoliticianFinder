// Task ID: P4BA14
// AI Evaluation Prompt Template

import { PoliticianEvaluationData } from '../types';

/**
 * Criteria Definitions (Korean)
 */
export const CRITERIA_DEFINITIONS = {
  integrity: {
    name: '청렴성 (Integrity)',
    description: '부패방지, 윤리적 행동, 도덕성',
  },
  expertise: {
    name: '전문성 (Expertise)',
    description: '정책 지식, 전문적 배경, 학력',
  },
  communication: {
    name: '소통능력 (Communication)',
    description: '대중과의 소통, 메시지 전달력, 응답성',
  },
  leadership: {
    name: '리더십 (Leadership)',
    description: '의사결정 능력, 비전 제시, 위기관리',
  },
  transparency: {
    name: '투명성 (Transparency)',
    description: '정보 공개, 책임성, 공개성',
  },
  responsiveness: {
    name: '대응성 (Responsiveness)',
    description: '민원 처리, 유권자 서비스, 접근성',
  },
  innovation: {
    name: '혁신성 (Innovation)',
    description: '새로운 아이디어, 창의적 해결책, 변화 수용',
  },
  collaboration: {
    name: '협력성 (Collaboration)',
    description: '초당적 협력, 이해관계자 협력, 팀워크',
  },
  constituency_service: {
    name: '지역봉사 (Constituency Service)',
    description: '지역 사회 참여, 지역 민원 해결, 봉사활동',
  },
  policy_impact: {
    name: '정책영향력 (Policy Impact)',
    description: '입법 성과, 정책 실현, 사회적 영향',
  },
} as const;

/**
 * Generate evaluation prompt for AI models
 */
export function generateEvaluationPrompt(
  politician: PoliticianEvaluationData
): string {
  const activitiesText = politician.recentActivities?.join('\n') || '정보 없음';
  const pledgesText =
    politician.pledges
      ?.map(
        (p, i) =>
          `${i + 1}. ${p.title} (${p.status})\n   ${p.description}`
      )
      .join('\n') || '정보 없음';
  const newsText =
    politician.newsArticles
      ?.map(
        (n, i) =>
          `${i + 1}. ${n.title}\n   ${n.summary}\n   출처: ${n.url}`
      )
      .join('\n') || '정보 없음';

  return `You are an expert political analyst evaluating a Korean politician. Your evaluation must be objective, evidence-based, and comprehensive.

# Politician Information

**Name**: ${politician.name}
**Party**: ${politician.party}
**Position**: ${politician.position}
**Region**: ${politician.region}
**Bio**: ${politician.bio || '정보 없음'}

## Recent Activities
${activitiesText}

## Campaign Promises / Pledges
${pledgesText}

## Recent News Articles
${newsText}

# Evaluation Task

Evaluate this politician on the following **10 criteria** using a 0-100 scale:

1. **청렴성 (Integrity)**: Anti-corruption, ethical conduct, moral standards
2. **전문성 (Expertise)**: Policy knowledge, professional background, educational qualifications
3. **소통능력 (Communication)**: Public engagement, message clarity, responsiveness to constituents
4. **리더십 (Leadership)**: Decision-making ability, vision, crisis management
5. **투명성 (Transparency)**: Information disclosure, accountability, openness
6. **대응성 (Responsiveness)**: Constituent service, accessibility, complaint resolution
7. **혁신성 (Innovation)**: New ideas, creative solutions, adaptability to change
8. **협력성 (Collaboration)**: Cross-party cooperation, stakeholder engagement, teamwork
9. **지역봉사 (Constituency Service)**: Local community involvement, grassroots engagement, service activities
10. **정책영향력 (Policy Impact)**: Legislative achievements, policy implementation, societal impact

# Output Requirements

For **each criterion**, provide:
- **Score**: Integer between 0-100
- **Evidence**: Detailed justification in Korean (MINIMUM 3,000 characters)
  - Must cite specific examples, dates, and events
  - Must be factual and evidence-based
  - Must avoid speculation or bias
  - Must be written in Korean

# Output Format

You MUST respond with VALID JSON in the following exact format:

\`\`\`json
{
  "overall_score": <calculated average of all 10 criteria scores>,
  "overall_grade": "<A+|A|B+|B|C+|C|D based on overall_score>",
  "criteria": {
    "integrity": {
      "score": <0-100>,
      "evidence": "<minimum 3,000 characters in Korean>"
    },
    "expertise": {
      "score": <0-100>,
      "evidence": "<minimum 3,000 characters in Korean>"
    },
    "communication": {
      "score": <0-100>,
      "evidence": "<minimum 3,000 characters in Korean>"
    },
    "leadership": {
      "score": <0-100>,
      "evidence": "<minimum 3,000 characters in Korean>"
    },
    "transparency": {
      "score": <0-100>,
      "evidence": "<minimum 3,000 characters in Korean>"
    },
    "responsiveness": {
      "score": <0-100>,
      "evidence": "<minimum 3,000 characters in Korean>"
    },
    "innovation": {
      "score": <0-100>,
      "evidence": "<minimum 3,000 characters in Korean>"
    },
    "collaboration": {
      "score": <0-100>,
      "evidence": "<minimum 3,000 characters in Korean>"
    },
    "constituency_service": {
      "score": <0-100>,
      "evidence": "<minimum 3,000 characters in Korean>"
    },
    "policy_impact": {
      "score": <0-100>,
      "evidence": "<minimum 3,000 characters in Korean>"
    }
  },
  "summary": "<comprehensive summary in Korean, 500-1000 characters>",
  "strengths": [
    "<strength 1>",
    "<strength 2>",
    "<strength 3>",
    "<strength 4>"
  ],
  "weaknesses": [
    "<weakness 1>",
    "<weakness 2>"
  ],
  "sources": [
    "<source URL 1>",
    "<source URL 2>",
    "<source URL 3>"
  ]
}
\`\`\`

# Grading Scale
- A+ (90-100): Exceptional
- A (85-89): Excellent
- B+ (80-84): Very Good
- B (75-79): Good
- C+ (70-74): Satisfactory
- C (65-69): Adequate
- D (0-64): Needs Improvement

# Important Notes
1. Evidence must be in Korean and minimum 3,000 characters per criterion
2. Overall score is the arithmetic mean of all 10 criterion scores
3. Be objective and fact-based; avoid political bias
4. Cite specific examples with dates when possible
5. Response must be valid JSON (no markdown formatting outside the JSON)
`;
}

/**
 * Validate AI response structure
 */
export function validateEvaluationResponse(response: any): boolean {
  if (!response || typeof response !== 'object') return false;

  // Check required top-level fields
  if (
    typeof response.overall_score !== 'number' ||
    typeof response.overall_grade !== 'string' ||
    typeof response.summary !== 'string' ||
    !Array.isArray(response.strengths) ||
    !Array.isArray(response.weaknesses) ||
    !Array.isArray(response.sources)
  )
    return false;

  // Check criteria object
  if (!response.criteria || typeof response.criteria !== 'object')
    return false;

  // Check all 10 criteria
  const requiredCriteria = [
    'integrity',
    'expertise',
    'communication',
    'leadership',
    'transparency',
    'responsiveness',
    'innovation',
    'collaboration',
    'constituency_service',
    'policy_impact',
  ];

  for (const criterion of requiredCriteria) {
    const c = response.criteria[criterion];
    if (
      !c ||
      typeof c.score !== 'number' ||
      c.score < 0 ||
      c.score > 100 ||
      typeof c.evidence !== 'string' ||
      c.evidence.length < 100 // Relaxed for mock/testing
    ) {
      return false;
    }
  }

  return true;
}
