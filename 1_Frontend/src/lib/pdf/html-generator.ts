// Task ID: P4BA15
// HTML Generator for PDF Reports (without React rendering)

import 'server-only';
import {
  PoliticianForReport,
  EvaluationForReport,
  EvaluationHistory,
  CriterionData,
} from './types';

/**
 * Evaluation criteria with Korean names
 */
const CRITERIA_NAMES: Record<string, string> = {
  integrity: '청렴도',
  expertise: '전문성',
  communication: '소통능력',
  leadership: '리더십',
  transparency: '투명성',
  responsiveness: '대응성',
  innovation: '혁신성',
  collaboration: '협업능력',
  constituency_service: '지역구 서비스',
  policy_impact: '정책 영향력',
};

/**
 * Get grade color
 */
function getGradeColor(grade: string): string {
  switch (grade.toUpperCase()) {
    case 'S':
      return '#8B5CF6';
    case 'A':
      return '#3B82F6';
    case 'B':
      return '#10B981';
    case 'C':
      return '#F59E0B';
    case 'D':
      return '#EF4444';
    default:
      return '#6B7280';
  }
}

/**
 * Format date to Korean format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = { textContent: text } as any;
  const textarea = document.createElement('textarea');
  textarea.textContent = text;
  return textarea.innerHTML;
}

/**
 * Generate HTML for PDF report
 */
export function generateReportHTML(
  politician: PoliticianForReport,
  evaluation: EvaluationForReport,
  history: EvaluationHistory[]
): string {
  // Extract criteria data
  const criteriaData: CriterionData[] = Object.keys(CRITERIA_NAMES).map((key) => ({
    name: key,
    nameKo: CRITERIA_NAMES[key],
    score: (evaluation.detailed_analysis as any)[`${key}_score`] || 0,
    evidence: (evaluation.detailed_analysis as any)[`${key}_evidence`] || '',
  }));

  const gradeColor = getGradeColor(evaluation.overall_grade);

  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>AI 평가 리포트 - ${politician.name}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap');

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Noto Sans KR', sans-serif;
        font-size: 11pt;
        line-height: 1.8;
        color: #1f2937;
        background: #ffffff;
      }

      .page {
        padding: 30mm 20mm;
        position: relative;
        min-height: 297mm;
      }

      /* Cover Page */
      .cover {
        text-align: center;
        padding: 60mm 0;
        page-break-after: always;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 257mm;
      }

      .cover-title {
        font-size: 32pt;
        font-weight: 900;
        margin-bottom: 20mm;
        color: #111827;
        letter-spacing: -1px;
      }

      .cover-politician {
        font-size: 28pt;
        font-weight: 700;
        margin-bottom: 15mm;
        color: #374151;
      }

      .cover-grade {
        display: inline-block;
        font-size: 72pt;
        font-weight: 900;
        padding: 20mm 30mm;
        border-radius: 20px;
        margin-bottom: 15mm;
        letter-spacing: 5px;
        background-color: ${gradeColor};
        color: #ffffff;
      }

      .cover-score {
        font-size: 24pt;
        font-weight: 500;
        color: #6b7280;
        margin-bottom: 10mm;
      }

      .cover-date {
        font-size: 14pt;
        color: #9ca3af;
        margin-top: 20mm;
      }

      /* Section Styles */
      .section {
        page-break-inside: avoid;
        margin-bottom: 15mm;
      }

      .section-title {
        font-size: 20pt;
        font-weight: 700;
        color: #111827;
        border-bottom: 3px solid #3b82f6;
        padding-bottom: 5mm;
        margin-bottom: 8mm;
        page-break-after: avoid;
      }

      .subsection-title {
        font-size: 16pt;
        font-weight: 600;
        color: #374151;
        margin-top: 8mm;
        margin-bottom: 4mm;
        page-break-after: avoid;
      }

      /* Summary Box */
      .summary-box {
        background: #f3f4f6;
        border-left: 5px solid #3b82f6;
        padding: 6mm;
        margin: 5mm 0;
        border-radius: 5px;
        page-break-inside: avoid;
      }

      .summary-text {
        font-size: 12pt;
        line-height: 1.8;
        color: #374151;
      }

      /* Score Grid */
      .score-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 5mm;
        margin: 5mm 0;
      }

      .score-card {
        background: #ffffff;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        padding: 5mm;
        page-break-inside: avoid;
      }

      .score-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 3mm;
      }

      .score-card-name {
        font-size: 13pt;
        font-weight: 600;
        color: #111827;
      }

      .score-card-value {
        font-size: 18pt;
        font-weight: 700;
        color: #3b82f6;
      }

      .score-bar-container {
        width: 100%;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
      }

      .score-bar {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        border-radius: 4px;
      }

      /* Criteria Detail */
      .criteria-detail {
        border-left: 4px solid #3b82f6;
        padding-left: 5mm;
        margin-bottom: 8mm;
        page-break-inside: avoid;
      }

      .criteria-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 3mm;
      }

      .criteria-name {
        font-size: 15pt;
        font-weight: 600;
        color: #111827;
      }

      .criteria-score {
        font-size: 18pt;
        font-weight: 700;
        color: #3b82f6;
      }

      .criteria-evidence {
        font-size: 11pt;
        line-height: 1.9;
        color: #4b5563;
        text-align: justify;
        white-space: pre-wrap;
        word-break: keep-all;
      }

      /* List Items */
      .list-container {
        margin: 5mm 0;
      }

      .list-item {
        background: #f9fafb;
        border-left: 4px solid #10b981;
        padding: 4mm;
        margin-bottom: 3mm;
        border-radius: 4px;
        page-break-inside: avoid;
      }

      .list-item.weakness {
        border-left-color: #ef4444;
      }

      .list-item-text {
        font-size: 11pt;
        line-height: 1.7;
        color: #374151;
      }

      /* History Chart */
      .chart-container {
        margin: 8mm 0;
        padding: 6mm;
        background: #f9fafb;
        border-radius: 8px;
        page-break-inside: avoid;
      }

      .chart-title {
        font-size: 14pt;
        font-weight: 600;
        color: #111827;
        margin-bottom: 5mm;
        text-align: center;
      }

      .chart-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 3mm 0;
        border-bottom: 1px solid #e5e7eb;
      }

      .chart-item:last-child {
        border-bottom: none;
      }

      .chart-date {
        font-size: 11pt;
        font-weight: 500;
        color: #6b7280;
        min-width: 30mm;
      }

      .chart-bar {
        flex: 1;
        height: 12px;
        background: #e5e7eb;
        border-radius: 6px;
        margin: 0 4mm;
        position: relative;
        overflow: hidden;
      }

      .chart-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        border-radius: 6px;
      }

      .chart-score {
        font-size: 12pt;
        font-weight: 700;
        color: #111827;
        min-width: 15mm;
        text-align: right;
      }

      .chart-grade {
        font-size: 11pt;
        font-weight: 600;
        color: #6b7280;
        min-width: 10mm;
        text-align: center;
      }

      /* Page Break Control */
      .page-break {
        page-break-after: always;
      }

      .avoid-break {
        page-break-inside: avoid;
      }

      /* Footer */
      .report-footer {
        margin-top: 15mm;
        padding-top: 5mm;
        border-top: 2px solid #e5e7eb;
        text-align: center;
        font-size: 9pt;
        color: #9ca3af;
      }
    </style>
  </head>
  <body>
    <!-- Cover Page -->
    <div class="cover">
      <div class="cover-title">AI 종합 평가 리포트</div>
      <div class="cover-politician">${politician.name} 의원</div>
      <div class="cover-grade">${evaluation.overall_grade}</div>
      <div class="cover-score">종합 점수: ${evaluation.overall_score}점</div>
      <div class="cover-date">${formatDate(evaluation.evaluation_date)}</div>
    </div>

    <!-- Overview Page -->
    <div class="page">
      <div class="section">
        <h2 class="section-title">종합 평가</h2>

        <div class="summary-box">
          <div class="summary-text">
            ${
              evaluation.summary ||
              '이 리포트는 AI 분석을 통해 생성된 정치인 평가 자료입니다. 10개의 핵심 기준을 바탕으로 종합적인 평가가 이루어졌습니다.'
            }
          </div>
        </div>

        <h3 class="subsection-title">평가 개요</h3>
        <div class="score-grid">
          <div class="score-card">
            <div class="score-card-header">
              <span class="score-card-name">종합 점수</span>
              <span class="score-card-value">${evaluation.overall_score}</span>
            </div>
            <div class="score-bar-container">
              <div class="score-bar" style="width: ${evaluation.overall_score}%"></div>
            </div>
          </div>
          <div class="score-card">
            <div class="score-card-header">
              <span class="score-card-name">등급</span>
              <span class="score-card-value" style="color: ${gradeColor}">${evaluation.overall_grade}</span>
            </div>
            <div class="score-bar-container">
              <div class="score-bar" style="width: ${evaluation.overall_score}%; background: ${gradeColor}"></div>
            </div>
          </div>
        </div>
      </div>

      ${
        evaluation.strengths && evaluation.strengths.length > 0
          ? `
      <div class="section avoid-break">
        <h3 class="subsection-title">강점</h3>
        <div class="list-container">
          ${evaluation.strengths.map((strength) => `<div class="list-item"><div class="list-item-text">${strength}</div></div>`).join('')}
        </div>
      </div>
      `
          : ''
      }

      ${
        evaluation.weaknesses && evaluation.weaknesses.length > 0
          ? `
      <div class="section avoid-break">
        <h3 class="subsection-title">개선 필요 영역</h3>
        <div class="list-container">
          ${evaluation.weaknesses.map((weakness) => `<div class="list-item weakness"><div class="list-item-text">${weakness}</div></div>`).join('')}
        </div>
      </div>
      `
          : ''
      }
    </div>

    <!-- Detailed Criteria Page 1 -->
    <div class="page page-break">
      <div class="section">
        <h2 class="section-title">상세 평가 기준</h2>
        ${criteriaData
          .slice(0, 5)
          .map(
            (criterion, index) => `
          <div class="criteria-detail">
            <div class="criteria-header">
              <span class="criteria-name">${index + 1}. ${criterion.nameKo}</span>
              <span class="criteria-score">${criterion.score}점</span>
            </div>
            <div class="criteria-evidence">${criterion.evidence}</div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>

    <!-- Detailed Criteria Page 2 -->
    <div class="page page-break">
      <div class="section">
        <h2 class="section-title">상세 평가 기준 (계속)</h2>
        ${criteriaData
          .slice(5, 10)
          .map(
            (criterion, index) => `
          <div class="criteria-detail">
            <div class="criteria-header">
              <span class="criteria-name">${index + 6}. ${criterion.nameKo}</span>
              <span class="criteria-score">${criterion.score}점</span>
            </div>
            <div class="criteria-evidence">${criterion.evidence}</div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>

    ${
      history && history.length > 0
        ? `
    <!-- History Chart Page -->
    <div class="page">
      <div class="section">
        <h2 class="section-title">평가 변화 추이</h2>
        <div class="chart-container">
          <div class="chart-title">시계열 점수 변화</div>
          ${history
            .slice(0, 10)
            .map(
              (item) => `
            <div class="chart-item">
              <div class="chart-date">${formatDate(item.evaluation_date)}</div>
              <div class="chart-bar">
                <div class="chart-bar-fill" style="width: ${item.overall_score}%"></div>
              </div>
              <div class="chart-score">${item.overall_score}점</div>
              <div class="chart-grade">${item.overall_grade}</div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <div class="report-footer">
        <p>이 리포트는 AI 분석을 기반으로 생성되었습니다.</p>
        <p>생성일: ${formatDate(new Date().toISOString())}</p>
        ${evaluation.ai_model_version ? `<p>AI 모델: ${evaluation.ai_model_version}</p>` : ''}
      </div>
    </div>
    `
        : ''
    }
  </body>
</html>`;
}
