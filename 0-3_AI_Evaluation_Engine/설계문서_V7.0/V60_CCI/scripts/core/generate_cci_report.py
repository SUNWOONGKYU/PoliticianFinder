# -*- coding: utf-8 -*-
"""
V60 CCI 전략보고서 생성기

Type B: CCI 전략보고서 (정치인 전용, 비공개)
  1. 종합 대시보드 (CCI 점수 + 경쟁자 매트릭스)
  2. GPI 분석 (기존 GPI 보고서 내용)
  3. Alpha 1 민심·여론 분석
  4. Alpha 2 선거구조 분석
  5. 경쟁자 비교 (순위표)
  6. 전략 제언

사용법:
    python generate_cci_report.py --politician-id 17270f25 --group-name "2026 서울시장"
"""

import sys
import argparse
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'helpers'))
from common_cci import (
    supabase,
    ALPHA1_CATEGORIES, ALPHA2_CATEGORIES, ALPHA_CATEGORY_NAMES,
    TABLE_FINAL_SCORES_GPI, TABLE_ALPHA_SCORES, TABLE_CCI_SCORES,
    TABLE_COMPETITOR_GROUPS,
    get_politician_info, get_grade, print_status
)


def generate_report(politician_id: str, group_name: str = None) -> str:
    """CCI 전략보고서 HTML 생성"""
    info = get_politician_info(politician_id)
    if not info:
        print_status(f"정치인 {politician_id}를 찾을 수 없습니다.", 'error')
        return ''

    name = info['name']
    party = info.get('party', '')
    position = info.get('position', '')
    region = info.get('region', '')

    # CCI 점수 조회
    cci_query = supabase.table(TABLE_CCI_SCORES).select('*').eq('politician_id', politician_id)
    if group_name:
        group_result = supabase.table(TABLE_COMPETITOR_GROUPS).select('id').eq('group_name', group_name).execute()
        if group_result.data:
            cci_query = cci_query.eq('competitor_group_id', group_result.data[0]['id'])
    cci_result = cci_query.execute()

    if not cci_result.data:
        print_status("CCI 점수 없음 — calculate_cci_scores.py를 먼저 실행하세요.", 'error')
        return ''

    cci = cci_result.data[0]

    # GPI 점수 조회
    gpi_result = supabase.table(TABLE_FINAL_SCORES_GPI).select('*').eq('politician_id', politician_id).execute()
    gpi = gpi_result.data[0] if gpi_result.data else {}

    # Alpha 점수 조회
    alpha_result = supabase.table(TABLE_ALPHA_SCORES).select('*').eq('politician_id', politician_id).execute()
    alpha_by_cat = {a['category']: a for a in (alpha_result.data or [])}

    # 경쟁자 데이터
    competitors = []
    if cci.get('competitor_group_id'):
        comp_result = supabase.table(TABLE_CCI_SCORES).select('*').eq(
            'competitor_group_id', cci['competitor_group_id']
        ).order('cci_rank').execute()
        for c in (comp_result.data or []):
            c_info = get_politician_info(c['politician_id'])
            competitors.append({**c, 'name': c_info.get('name', '?') if c_info else '?',
                                'party': c_info.get('party', '?') if c_info else '?'})

    today = datetime.now().strftime('%Y-%m-%d')

    # CCI 등급 색상
    cci_score = cci.get('cci_score', 0)
    if cci_score >= 80:
        cci_color = '#10b981'
    elif cci_score >= 60:
        cci_color = '#3b82f6'
    elif cci_score >= 40:
        cci_color = '#f59e0b'
    else:
        cci_color = '#ef4444'

    # HTML 생성
    html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>CCI 전략보고서 — {name}</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: 'Malgun Gothic', sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }}
  .container {{ max-width: 1200px; margin: 0 auto; }}
  .header {{ background: linear-gradient(135deg, #1e1b4b, #312e81); padding: 30px; border-radius: 12px; margin-bottom: 20px; }}
  .header h1 {{ font-size: 28px; margin-bottom: 8px; }}
  .header .subtitle {{ color: #a5b4fc; font-size: 16px; }}
  .header .confidential {{ color: #f87171; font-size: 14px; margin-top: 8px; }}
  .card {{ background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 16px; }}
  .card h2 {{ color: #818cf8; font-size: 20px; margin-bottom: 16px; border-bottom: 1px solid #334155; padding-bottom: 8px; }}
  .score-big {{ font-size: 64px; font-weight: bold; color: {cci_color}; text-align: center; }}
  .score-label {{ text-align: center; color: #94a3b8; margin-top: 4px; }}
  .grid-3 {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }}
  .metric {{ background: #0f172a; border-radius: 8px; padding: 16px; text-align: center; }}
  .metric .value {{ font-size: 28px; font-weight: bold; }}
  .metric .label {{ color: #94a3b8; font-size: 13px; margin-top: 4px; }}
  table {{ width: 100%; border-collapse: collapse; }}
  th, td {{ padding: 10px 12px; text-align: left; border-bottom: 1px solid #334155; }}
  th {{ color: #818cf8; font-size: 13px; text-transform: uppercase; }}
  .rank-1 {{ color: #fbbf24; font-weight: bold; }}
  .rank-2 {{ color: #94a3b8; }}
  .bar {{ height: 8px; border-radius: 4px; background: #334155; }}
  .bar-fill {{ height: 100%; border-radius: 4px; }}
  .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }}
</style>
</head>
<body>
<div class="container">

<!-- 헤더 -->
<div class="header">
  <h1>CCI 전략보고서 — {name}</h1>
  <div class="subtitle">{party} | {position} | {region} | {group_name or '개별 분석'}</div>
  <div class="confidential">🔒 CONFIDENTIAL — 정치인 전용 비공개 보고서 | 작성일: {today}</div>
</div>

<!-- 1. 종합 대시보드 -->
<div class="card">
  <h2>1. 종합 대시보드</h2>
  <div class="score-big">{cci_score}</div>
  <div class="score-label">CCI 종합 점수 (100점 만점) | 순위: {cci.get('cci_rank', '?')}위 | {cci.get('cci_grade', '')}</div>
  <div class="grid-3" style="margin-top:20px;">
    <div class="metric">
      <div class="value" style="color:#3b82f6;">{cci.get('gpi_score', '?')}</div>
      <div class="label">GPI (40%) — 1000점 만점</div>
    </div>
    <div class="metric">
      <div class="value" style="color:#8b5cf6;">{cci.get('alpha1_total', '?')}</div>
      <div class="label">Alpha 1 민심·여론 (30%)</div>
    </div>
    <div class="metric">
      <div class="value" style="color:#06b6d4;">{cci.get('alpha2_total', '?')}</div>
      <div class="label">Alpha 2 선거구조 (30%)</div>
    </div>
  </div>
</div>

<!-- 2. GPI 분석 -->
<div class="card">
  <h2>2. GPI 분석 — 정치인 자질 평가</h2>
  <div class="grid-3">
    <div class="metric">
      <div class="value">{gpi.get('final_score', '?')}</div>
      <div class="label">GPI 점수 (200~1000)</div>
    </div>
    <div class="metric">
      <div class="value">{gpi.get('grade', '?')}</div>
      <div class="label">등급 ({gpi.get('grade_name', '')})</div>
    </div>
    <div class="metric">
      <div class="value">{gpi.get('total_evaluations', '?')}</div>
      <div class="label">평가 건수 (4AI)</div>
    </div>
  </div>
</div>

<!-- 3. Alpha 1 분석 -->
<div class="card">
  <h2>3. Alpha 1 — 민심·여론 분석</h2>
  <table>
    <tr><th>카테고리</th><th>점수</th><th>평균 레이팅</th><th>평가 건수</th></tr>
"""

    for cat in ALPHA1_CATEGORIES:
        a = alpha_by_cat.get(cat, {})
        cat_name = ALPHA_CATEGORY_NAMES.get(cat, cat)
        html += f"""    <tr>
      <td>{cat_name} ({cat})</td>
      <td><strong>{a.get('category_score', '?')}</strong></td>
      <td>{a.get('avg_rating', '?')}</td>
      <td>{a.get('total_evaluations', '?')}</td>
    </tr>\n"""

    html += f"""  </table>
  <div class="metric" style="margin-top:12px;">
    <div class="value" style="color:#8b5cf6;">{cci.get('alpha1_total', '?')}</div>
    <div class="label">Alpha 1 합계</div>
  </div>
</div>

<!-- 4. Alpha 2 분석 -->
<div class="card">
  <h2>4. Alpha 2 — 선거구조 분석</h2>
  <table>
    <tr><th>카테고리</th><th>점수</th><th>평균 레이팅</th><th>평가 건수</th></tr>
"""

    for cat in ALPHA2_CATEGORIES:
        a = alpha_by_cat.get(cat, {})
        cat_name = ALPHA_CATEGORY_NAMES.get(cat, cat)
        html += f"""    <tr>
      <td>{cat_name} ({cat})</td>
      <td><strong>{a.get('category_score', '?')}</strong></td>
      <td>{a.get('avg_rating', '?')}</td>
      <td>{a.get('total_evaluations', '?')}</td>
    </tr>\n"""

    html += f"""  </table>
  <div class="metric" style="margin-top:12px;">
    <div class="value" style="color:#06b6d4;">{cci.get('alpha2_total', '?')}</div>
    <div class="label">Alpha 2 합계</div>
  </div>
</div>

<!-- 5. 경쟁자 비교 -->
<div class="card">
  <h2>5. 경쟁자 비교</h2>
  <table>
    <tr><th>순위</th><th>후보</th><th>정당</th><th>GPI</th><th>Alpha1</th><th>Alpha2</th><th>CCI</th><th>등급</th></tr>
"""

    for c in competitors:
        rank_class = 'rank-1' if c.get('cci_rank') == 1 else ''
        is_me = '← ' if c['politician_id'] == politician_id else ''
        html += f"""    <tr class="{rank_class}">
      <td>{c.get('cci_rank', '?')}</td>
      <td>{is_me}{c['name']}</td>
      <td>{c['party']}</td>
      <td>{c.get('gpi_score', '?')}</td>
      <td>{c.get('alpha1_total', '?')}</td>
      <td>{c.get('alpha2_total', '?')}</td>
      <td><strong>{c.get('cci_score', '?')}</strong></td>
      <td>{c.get('cci_grade', '?')}</td>
    </tr>\n"""

    html += f"""  </table>
</div>

<!-- 6. 전략 제언 -->
<div class="card">
  <h2>6. 전략 제언</h2>
  <p style="color:#94a3b8; line-height:1.8;">
    본 CCI 전략보고서는 GPI(정치인 자질)·Alpha 1(민심·여론)·Alpha 2(선거구조) 3축을 종합한 경쟁력 분석입니다.<br>
    상세 전략 제언은 플래툰 포메이션 평가 완료 후 소대장(Opus)이 종합 분석하여 제공합니다.
  </p>
</div>

<div class="footer">
  CCI V60 — Candidate Relative Competitive Index | PoliticianFinder.com<br>
  Generated: {today} | 본 보고서는 AI 기반 분석으로 참고용이며, 실제 선거 결과를 보장하지 않습니다.
</div>

</div>
</body>
</html>"""

    return html


def main():
    parser = argparse.ArgumentParser(description='V60 CCI 전략보고서 생성')
    parser.add_argument('--politician-id', required=True, type=str)
    parser.add_argument('--group-name', type=str, help='경쟁자 그룹명')
    parser.add_argument('--output', type=str, help='출력 파일 경로')
    args = parser.parse_args()

    html = generate_report(args.politician_id, args.group_name)
    if not html:
        return

    info = get_politician_info(args.politician_id)
    name = info.get('name', 'unknown') if info else 'unknown'
    today = datetime.now().strftime('%Y%m%d')

    if args.output:
        output_path = Path(args.output)
    else:
        report_dir = Path(__file__).resolve().parent.parent.parent / '보고서'
        report_dir.mkdir(exist_ok=True)
        output_path = report_dir / f'{name}_CCI_{today}.html'

    output_path.write_text(html, encoding='utf-8')
    print_status(f"CCI 전략보고서 생성 완료: {output_path}", 'ok')


if __name__ == '__main__':
    main()
