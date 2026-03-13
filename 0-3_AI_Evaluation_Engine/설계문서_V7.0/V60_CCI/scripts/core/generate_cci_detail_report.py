# -*- coding: utf-8 -*-
"""
V60 CCI 전략 상세보고서 생성기 (GPI 스타일)

MD 원본 → GPI CSS 템플릿 기반 HTML 변환
- GPI 보고서와 동일한 화이트 테마
- 정당별 색상 자동 적용
- 목차(TOC) 자동 생성
- PDF 다운로드 버튼 포함

사용법:
    python generate_cci_detail_report.py
    python generate_cci_detail_report.py --politician 정원오
"""

import re
import sys
import argparse
from pathlib import Path
import markdown

# ──────────────────── 경로 설정 ────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
V60_CCI_DIR = SCRIPT_DIR.parent.parent
REPORT_DIR = V60_CCI_DIR / '보고서'

# ──────────────────── 정치인 메타데이터 ────────────────────
POLITICIANS = {
    '정원오': {
        'id': '17270f25',
        'party': '더불어민주당',
        'position': '성동구청장 (3선)',
        'group': '2026 서울시장 후보 4인',
    },
    '박주민': {
        'id': '8c5dcc89',
        'party': '더불어민주당',
        'position': '국회의원 (3선, 은평갑)',
        'group': '2026 서울시장 후보 4인',
    },
    '오세훈': {
        'id': '62e7b453',
        'party': '국민의힘',
        'position': '서울특별시장 (민선 7~8기)',
        'group': '2026 서울시장 후보 4인',
    },
    '조은희': {
        'id': 'd0a5d6e1',
        'party': '국민의힘',
        'position': '전 서초구청장 (2선)',
        'group': '2026 서울시장 후보 4인',
    },
}

PARTY_COLORS = {
    '더불어민주당': {
        'primary': '#1a365d',
        'accent': '#1565C0',
        'bg_highlight': '#e8f0fe',
    },
    '국민의힘': {
        'primary': '#1a0808',
        'accent': '#B71C1C',
        'bg_highlight': '#fff0f0',
    },
}

# ──────────────────── GPI CSS (정원오_20260221_B.html 에서 추출) ────────────────────
GPI_CSS = r"""
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');

:root {
  --primary: %(primary)s;
  --accent: %(accent)s;
  --bg-highlight: %(bg_highlight)s;
  --bg: #ffffff;
  --bg-alt: #f7fafc;
  --text: #1a202c;
  --text-muted: #6b7280;
  --border: #e2e8f0;
  --border-dark: #cbd5e0;
  --success: #38a169;
  --warning: #c53030;
  --info: #1565c0;
  --gold: #92400e;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Noto Sans KR', 'Malgun Gothic', -apple-system, sans-serif;
  color: var(--text);
  background: #edf2f7;
  line-height: 1.8;
  font-size: 15px;
}
.document {
  max-width: 800px;
  margin: 40px auto;
  background: var(--bg);
  box-shadow: 0 4px 32px rgba(0,0,0,0.12);
  border-radius: 4px;
  overflow: hidden;
}

/* COVER */
.cover {
  padding: 72px 60px 56px;
  text-align: left;
  background: linear-gradient(135deg, var(--primary) 0%%, var(--accent) 100%%);
  color: #fff;
  position: relative;
}
.cover::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 3px;
  background: rgba(255,255,255,0.3);
}
.cover-badge {
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.6);
  margin-bottom: 20px;
}
.cover-title {
  font-size: 42px;
  font-weight: 700;
  letter-spacing: 4px;
  line-height: 1.1;
  margin-bottom: 8px;
}
.cover-subtitle {
  font-size: 15px;
  color: rgba(255,255,255,0.75);
  margin-bottom: 36px;
}
.cover-score-box {
  display: inline-block;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 8px;
  padding: 20px 32px;
  margin-bottom: 28px;
}
.cover-score-num {
  font-size: 52px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -2px;
}
.cover-score-grade {
  font-size: 14px;
  color: rgba(255,255,255,0.75);
  margin-top: 6px;
}
.cover-meta {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  border-top: 1px solid rgba(255,255,255,0.2);
  padding-top: 24px;
}
.cover-meta-item {}
.cover-meta-label {
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
  margin-bottom: 2px;
}
.cover-meta-value {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

/* CONTENT */
.content { padding: 48px 60px 64px; }

/* TOC */
.toc {
  background: var(--bg-alt);
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent);
  border-radius: 0 4px 4px 0;
  padding: 24px 28px;
  margin-bottom: 48px;
}
.toc-title {
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 14px;
}
.toc ol { padding-left: 20px; }
.toc li { margin-bottom: 6px; }
.toc a {
  color: var(--accent);
  text-decoration: none;
  font-size: 14px;
}
.toc a:hover { text-decoration: underline; }

/* HEADINGS */
h1 {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary);
  border-bottom: 2px solid var(--accent);
  padding-bottom: 10px;
  margin: 48px 0 24px;
}
h1:first-of-type { margin-top: 0; }
h2 {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
  margin: 28px 0 14px;
}
h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin: 20px 0 10px;
}
p {
  margin-bottom: 12px;
  text-align: justify;
}

/* INFO FIELDS */
.info-field {
  display: flex;
  border-bottom: 1px solid var(--border);
  padding: 10px 0;
  font-size: 14px;
}
.info-label {
  width: 160px;
  min-width: 160px;
  color: var(--text-muted);
  font-weight: 600;
}
.info-value { flex: 1; }

/* TABLES */
.table-wrap { overflow-x: auto; margin: 16px 0 24px; }
table {
  width: 100%%;
  border-collapse: collapse;
  font-size: 14px;
}
th {
  background: var(--primary);
  color: #fff;
  padding: 10px 14px;
  text-align: center;
  font-weight: 600;
  font-size: 13px;
}
td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  text-align: center;
  vertical-align: middle;
}
tr:nth-child(even) td { background: var(--bg-alt); }
tr:hover td { background: var(--bg-highlight); }
td:first-child {
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}
.highlight-col {
  background: var(--bg-highlight) !important;
  font-weight: 700;
  color: var(--accent);
}
th.highlight-col {
  background: var(--accent) !important;
  color: #fff;
}

/* CLAIM BOXES */
.claim {
  background: var(--bg-alt);
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent);
  border-radius: 0 6px 6px 0;
  padding: 16px 20px;
  margin: 16px 0;
  font-size: 14px;
}
.claim-label {
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--accent);
  font-weight: 700;
  margin-bottom: 6px;
}
.claim-success { border-left-color: var(--success); }
.claim-success .claim-label { color: var(--success); }
.claim-warning { border-left-color: var(--warning); }
.claim-warning .claim-label { color: var(--warning); }
.claim-independent { border-left-color: var(--info); }
.claim-independent .claim-label { color: var(--info); }

/* CATEGORY DETAIL */
.cat-detail {
  border: 1px solid var(--border);
  border-radius: 8px;
  margin: 20px 0;
  overflow: hidden;
}
.cat-detail-header {
  background: var(--primary);
  color: #fff;
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cat-detail-name { font-size: 15px; font-weight: 700; }
.cat-detail-score { font-size: 22px; font-weight: 800; }
.cat-detail-body { padding: 20px; }

/* BAR CHART */
.bar-chart { margin: 24px 0; }
.bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.bar-label {
  width: 80px;
  min-width: 80px;
  font-size: 13px;
  color: var(--text-muted);
  text-align: right;
}
.bar-track {
  flex: 1;
  background: #e9ecef;
  border-radius: 4px;
  height: 26px;
  overflow: hidden;
}
.bar-fill {
  height: 100%%;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: var(--accent);
  transition: width 0.3s;
}
.bar-fill span { white-space: nowrap; }
.bar-fill-top { background: var(--primary); }

/* GRADE TABLE */
.grade-table { margin: 24px 0; }
.grade-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}
.grade-row:last-child { border-bottom: none; }
.grade-letter {
  width: 40px;
  min-width: 40px;
  font-size: 20px;
  font-weight: 800;
  color: var(--text-muted);
  text-align: center;
}
.grade-range {
  width: 140px;
  min-width: 140px;
  color: var(--text-muted);
  font-size: 13px;
}
.grade-desc { flex: 1; }
.grade-current {
  background: var(--bg-highlight);
  border-left: 4px solid var(--accent);
  border-radius: 0 4px 4px 0;
}
.grade-current .grade-letter { color: var(--accent); }
.grade-current .grade-desc { font-weight: 700; color: var(--primary); }

/* NOTE / UTILITIES */
.note { font-size: 12px; color: var(--text-muted); margin: 8px 0; }
ul, ol { margin: 8px 0 16px 24px; }
li { margin-bottom: 4px; }

/* FOOTER */
.doc-footer {
  background: var(--primary);
  color: rgba(255,255,255,0.7);
  padding: 28px 32px;
  margin-top: 48px;
  border-radius: 4px;
}
.doc-footer-title {
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.4);
  margin-bottom: 10px;
}
.doc-footer-text { font-size: 12px; line-height: 1.8; }

/* CCI 전용 */
.cci-formula {
  background: var(--bg-alt);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px 16px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  text-align: center;
  margin: 12px 0;
  color: var(--accent);
  font-weight: 700;
}

/* RESPONSIVE */
@media (max-width: 600px) {
  .document { margin: 0; border-radius: 0; }
  .cover { padding: 40px 24px 32px; }
  .cover-title { font-size: 26px; letter-spacing: 2px; }
  .cover-score-num { font-size: 40px; }
  .content { padding: 32px 20px 40px; }
  .info-label { width: 110px; min-width: 110px; }
  .bar-label { width: 64px; min-width: 64px; font-size: 11px; }
  .toc { padding: 16px; }
  h1 { font-size: 18px; }
}

/* PDF BUTTON */
.pdf-download-btn {
  position: fixed;
  bottom: 32px;
  right: 32px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 14px 24px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
  z-index: 9999;
  transition: background 0.2s, transform 0.2s;
  font-family: inherit;
}
.pdf-download-btn:hover {
  filter: brightness(0.85);
  transform: translateY(-2px);
}

/* PRINT */
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  body { background: #fff !important; }
  .document { margin: 0 !important; box-shadow: none !important; max-width: 100%% !important; }
  .cover {
    break-after: page;
    background: linear-gradient(135deg, var(--primary) 0%%, var(--accent) 100%%) !important;
    color: #fff !important;
  }
  .cover-score-box {
    background: rgba(255,255,255,0.12) !important;
    border: 1px solid rgba(255,255,255,0.25) !important;
  }
  th {
    background: var(--primary) !important;
    color: #fff !important;
  }
  th.highlight-col {
    background: var(--accent) !important;
    color: #fff !important;
  }
  tr:nth-child(even) td { background: var(--bg-alt) !important; }
  .highlight-col { background: var(--bg-highlight) !important; }
  .grade-current {
    background: var(--bg-highlight) !important;
    border-left: 4px solid var(--accent) !important;
  }
  .cat-detail-header {
    background: var(--primary) !important;
    color: #fff !important;
  }
  .bar-fill { background: var(--accent) !important; }
  .bar-fill-top { background: var(--primary) !important; }
  .bar-track { background: #e9ecef !important; }
  .claim { border-left: 4px solid var(--accent) !important; }
  .claim-success { border-left-color: var(--success) !important; }
  .claim-warning { border-left-color: var(--warning) !important; }
  .doc-footer {
    background: var(--primary) !important;
    color: rgba(255,255,255,0.7) !important;
  }
  .toc {
    background: var(--bg-alt) !important;
    border-left: 4px solid var(--accent) !important;
  }
  .cat-detail { break-inside: avoid; }
  .claim { break-inside: avoid; }
  .bar-row { break-inside: avoid; }
  .grade-table { break-inside: avoid; }
  table { break-inside: avoid; }
  h1 { break-after: avoid; }
  .pdf-download-btn { display: none !important; }
}
"""


def extract_cover_data(md_text: str, name: str) -> dict:
    """MD 텍스트에서 표지용 데이터 추출"""
    data = {
        'cci_score': '',
        'cci_rank': '',
        'gpi_score': '',
        'a1_score': '',
        'a2_score': '',
    }

    # CCI 통합 점수
    m = re.search(r'CCI 통합 점수.*?\*\*(\d+)점\*\*', md_text)
    if m:
        data['cci_score'] = m.group(1)

    # CCI 순위
    m = re.search(r'CCI 순위.*?\*\*(\d+위\s*/\s*\d+명)\*\*', md_text)
    if m:
        data['cci_rank'] = m.group(1)

    # GPI
    m = re.search(r'GPI.*?\|\s*(\d+)점', md_text)
    if m:
        data['gpi_score'] = m.group(1)

    # Alpha 1
    m = re.search(r'Alpha 1.*?\|\s*(\d+)점', md_text)
    if m:
        data['a1_score'] = m.group(1)

    # Alpha 2
    m = re.search(r'Alpha 2.*?\|\s*(\d+)점', md_text)
    if m:
        data['a2_score'] = m.group(1)

    return data


def build_toc(md_text: str) -> str:
    """MD에서 # 장 제목을 추출하여 TOC HTML 생성"""
    toc_items = []
    for m in re.finditer(r'^# (\d+장\..+|별첨\s*\d+.+)', md_text, re.MULTILINE):
        title = m.group(1).strip()
        anchor = re.sub(r'[^가-힣a-zA-Z0-9]+', '-', title).strip('-').lower()
        toc_items.append(f'<li><a href="#{anchor}">{title}</a></li>')

    if not toc_items:
        return ''

    return f'''<div class="toc">
  <div class="toc-title">목차 — CCI 전략 상세보고서</div>
  <ol>
    {"".join(toc_items)}
  </ol>
</div>'''


def md_to_html_content(md_text: str, name: str) -> str:
    """Markdown을 GPI 스타일 HTML 콘텐츠로 변환"""

    # --- 전략 키워드 (코드 블록 스타일) 를 태그로 변환
    md_text = re.sub(r'`([^`]+)`', r'<code>\1</code>', md_text)

    # --- MD 전체를 변환 (헤더 포함, 아무것도 빼지 않음)

    # --- Markdown 변환
    html = markdown.markdown(
        md_text,
        extensions=['tables', 'fenced_code'],
        output_format='html5',
    )

    # --- 후처리: 테이블을 table-wrap으로 감싸기
    html = re.sub(r'(<table>)', r'<div class="table-wrap">\1', html)
    html = re.sub(r'(</table>)', r'\1</div>', html)

    # --- 후처리: blockquote → claim 박스
    def blockquote_to_claim(match):
        content = match.group(1).strip()
        # 강점 관련
        if any(kw in content for kw in ['강점', '우위', '최강', '1위']):
            cls = 'claim claim-success'
        # 약점/경고
        elif any(kw in content for kw in ['약점', '열위', '취약', '최하', '리스크']):
            cls = 'claim claim-warning'
        else:
            cls = 'claim claim-independent'
        return f'<div class="{cls}">{content}</div>'

    html = re.sub(r'<blockquote>\s*(.*?)\s*</blockquote>', blockquote_to_claim, html, flags=re.DOTALL)

    # --- 후처리: h1에 id 추가 (TOC 앵커용)
    def add_h1_id(match):
        text = match.group(1)
        anchor = re.sub(r'[^가-힣a-zA-Z0-9]+', '-', text).strip('-').lower()
        return f'<h1 id="{anchor}">{text}</h1>'

    html = re.sub(r'<h1>(.*?)</h1>', add_h1_id, html)

    # --- 후처리: 해당 정치인 이름 볼드 처리 (테이블 내)
    html = html.replace(f'<td>{name}</td>', f'<td><strong>{name}</strong></td>')

    # --- 후처리: hr 태그 제거 (CSS에서 h1 border-bottom으로 대체)
    html = re.sub(r'<hr\s*/?>', '', html)

    return html


def build_cover(name: str, meta: dict, cover_data: dict) -> str:
    """표지 HTML 생성"""
    return f'''<div class="cover">
    <div class="cover-badge">PoliticianFinder &middot; CCI 전략 상세보고서 V60 &middot; 2026-03-12</div>
    <div class="cover-title">{name}</div>
    <div class="cover-subtitle">{meta["party"]} &middot; {meta["position"]} &middot; {meta["group"]}</div>

    <div class="cover-score-box">
      <div class="cover-score-num">{cover_data["cci_score"]}점</div>
      <div class="cover-score-grade">CCI {cover_data["cci_rank"]} &nbsp;&middot;&nbsp; GPI {cover_data["gpi_score"]} / A1 {cover_data["a1_score"]} / A2 {cover_data["a2_score"]}</div>
    </div>

    <div class="cover-meta">
      <div class="cover-meta-item">
        <div class="cover-meta-label">평가일</div>
        <div class="cover-meta-value">2026년 3월 12일</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">경쟁 그룹</div>
        <div class="cover-meta-value">2026 서울시장 4인</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">평가 AI</div>
        <div class="cover-meta-value">Claude &middot; ChatGPT &middot; Gemini &middot; Grok</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">보고서 등급</div>
        <div class="cover-meta-value">비공개 전략 보고서 (유료)</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">CCI 공식</div>
        <div class="cover-meta-value">GPI&times;0.4 + A1&times;0.3 + A2&times;0.3</div>
      </div>
    </div>
  </div>'''


def build_footer(name: str) -> str:
    """푸터 HTML"""
    return f'''<div class="doc-footer">
      <div class="doc-footer-title">Disclaimer</div>
      <div class="doc-footer-text">
        본 보고서는 PoliticianFinder V60 CCI (Candidate Competitive Index) 시스템에 의해 자동 생성되었습니다.<br>
        4개 AI(Claude, ChatGPT, Gemini, Grok)의 독립적 평가를 종합한 결과이며, 특정 정치적 입장을 대변하지 않습니다.<br>
        GPI(Good Politician Index) 절대평가와 Alpha 상대평가를 결합한 CCI 점수는 후보 간 경쟁력 비교를 위한 참고 자료입니다.<br>
        &copy; 2026 PoliticianFinder. All rights reserved.
      </div>
    </div>'''


def generate_detail_report(name: str) -> Path:
    """단일 정치인의 CCI 상세보고서 HTML 생성"""

    if name not in POLITICIANS:
        print(f"[ERROR] 알 수 없는 정치인: {name}")
        return None

    meta = POLITICIANS[name]
    colors = PARTY_COLORS.get(meta['party'], PARTY_COLORS['더불어민주당'])

    # MD 파일 읽기
    md_path = REPORT_DIR / f'{name}_CCI_20260312.md'
    if not md_path.exists():
        print(f"[ERROR] MD 파일 없음: {md_path}")
        return None

    md_text = md_path.read_text(encoding='utf-8')
    print(f"[INFO] {name}: MD 읽기 완료 ({len(md_text):,}자, {len(md_text.splitlines())}줄)")

    # 데이터 추출
    cover_data = extract_cover_data(md_text, name)

    # TOC 생성
    toc_html = build_toc(md_text)

    # MD → HTML 변환
    content_html = md_to_html_content(md_text, name)

    # Cover 생성
    cover_html = build_cover(name, meta, cover_data)

    # Footer 생성
    footer_html = build_footer(name)

    # CSS (정당 색상 적용)
    css = GPI_CSS % colors

    # 전체 조립
    full_html = f'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>{name} CCI 전략 상세보고서 — PoliticianFinder V60</title>
<style>
{css}
</style>
</head>
<body>

<div class="document">

  {cover_html}

  <div class="content">
    {toc_html}
    {content_html}
    {footer_html}
  </div>

</div>

<button class="pdf-download-btn" onclick="window.print()">&#128196; PDF 다운로드</button>

</body>
</html>'''

    # 출력 파일
    out_path = REPORT_DIR / f'{name}_CCI_상세_20260312.html'
    out_path.write_text(full_html, encoding='utf-8')

    # 검증: 순수 텍스트 기준 반영률 (MD 문법 기호 제외)
    md_pure = re.sub(r'[#*|`>\-=\[\](){}_~]', '', md_text)  # MD 문법 기호 제거
    md_chars = len(re.sub(r'\s+', '', md_pure))
    html_text = re.sub(r'<[^>]+>', '', content_html)  # HTML 태그 제거
    html_chars = len(re.sub(r'\s+', '', html_text))
    ratio = html_chars / md_chars * 100 if md_chars > 0 else 0

    print(f"[OK] {name}: HTML 생성 완료 -> {out_path.name}")
    print(f"     순수 텍스트: MD {md_chars:,}자 -> HTML {html_chars:,}자 ({ratio:.1f}%%)")
    print(f"     파일 크기: {out_path.stat().st_size / 1024:.1f}KB")

    return out_path


def main():
    parser = argparse.ArgumentParser(description='CCI 전략 상세보고서 생성 (GPI 스타일)')
    parser.add_argument('--politician', '-p', help='특정 정치인만 생성 (예: 정원오)')
    args = parser.parse_args()

    targets = [args.politician] if args.politician else list(POLITICIANS.keys())

    print("=" * 60)
    print("V60 CCI 전략 상세보고서 생성기 (GPI 스타일)")
    print("=" * 60)

    results = []
    for name in targets:
        print(f"\n--- {name} ---")
        path = generate_detail_report(name)
        if path:
            results.append((name, path))

    print(f"\n{'=' * 60}")
    print(f"완료: {len(results)}/{len(targets)}개 생성")
    for name, path in results:
        print(f"  [OK] {path.name}")
    print("=" * 60)


if __name__ == '__main__':
    main()
