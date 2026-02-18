#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V40 Sentiment-Targeted Recollection Script
==========================================

Purpose:
    Fix sentiment ratio violations by collecting targeted data.
    Uses Gemini CLI to search for specific sentiment+data_type combinations.

Rules (V40_기본방침.md Section 6):
    OFFICIAL 10-10-80: negative >= 10%, positive >= 10%, free 80%
    PUBLIC 20-20-60: negative >= 20%, positive >= 20%, free 60%

Usage:
    # Check what needs to be collected (dry run)
    python recollect_sentiment_targeted.py --politician_id 62e7b453 --politician_name "오세훈" --dry-run

    # Execute targeted recollection
    python recollect_sentiment_targeted.py --politician_id 62e7b453 --politician_name "오세훈"

    # Single politician
    python recollect_sentiment_targeted.py --politician_id 17270f25 --politician_name "정원오"
"""

import os
import sys
import json
import math
import re
import subprocess
import platform
import argparse
import time
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', line_buffering=True)

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent  # workflow/
V40_DIR = SCRIPT_DIR.parent.parent  # V40/

# .env 로드
for env_path in [V40_DIR.parent.parent / '.env', V40_DIR.parent / '.env', V40_DIR / '.env']:
    if env_path.exists():
        load_dotenv(env_path, override=True)
        break

from supabase import create_client
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

TABLE_COLLECTED = "collected_data_v40"

CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

CATEGORY_KR = {
    'expertise': '전문성', 'leadership': '리더십', 'vision': '비전',
    'integrity': '청렴성', 'ethics': '윤리성', 'accountability': '책임감',
    'transparency': '투명성', 'communication': '소통능력',
    'responsiveness': '대응성', 'publicinterest': '공익성'
}

# Sentiment ratio rules (V40_기본방침.md Section 6)
RULES = [
    ('official', 'negative', 10),
    ('official', 'positive', 10),
    ('public', 'negative', 20),
    ('public', 'positive', 20),
]

# Gemini CLI models (3-tier fallback)
GEMINI_CLI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash']
GEMINI_API_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash']
QUOTA_KEYWORDS = ['exhausted', 'quota', 'rate limit', 'capacity', 'exceeded', 'temporarily']

# Search keyword templates for targeted collection
NEGATIVE_KEYWORDS = {
    'expertise': '전문성 부족, 역량 논란, 자격 의문, 전문지식 결여, 정책 실패',
    'leadership': '리더십 부재, 지도력 논란, 통솔력 문제, 조직 갈등, 리더십 위기',
    'vision': '비전 부재, 정책 표류, 미래전략 부족, 비전 논란, 방향성 혼란',
    'integrity': '비리, 부패, 불법, 특혜, 뇌물, 횡령, 배임, 청렴성 논란',
    'ethics': '윤리 위반, 도덕성 논란, 비윤리적, 윤리 문제, 품위 손상',
    'accountability': '무책임, 책임 회피, 책임 전가, 직무 유기, 의무 불이행',
    'transparency': '불투명, 정보 은폐, 비공개, 투명성 부족, 비밀주의',
    'communication': '불통, 소통 부재, 독단, 일방적, 시민 무시',
    'responsiveness': '늑장 대응, 무대응, 민원 무시, 대응 실패, 위기관리 미흡',
    'publicinterest': '사익 추구, 공익 훼손, 이해충돌, 특혜 의혹, 공공이익 무시'
}

POSITIVE_KEYWORDS = {
    'expertise': '전문성 인정, 역량 우수, 정책 성과, 전문지식, 업무 탁월',
    'leadership': '탁월한 리더십, 지도력 인정, 통합 리더십, 조직 혁신, 리더십 성과',
    'vision': '미래 비전, 혁신 정책, 전략적 비전, 발전 계획, 비전 제시',
    'integrity': '청렴, 공정, 투명 경영, 청렴도 우수, 깨끗한 공직자',
    'ethics': '도덕적 모범, 윤리 의식, 품격, 도덕성 인정, 윤리적 행동',
    'accountability': '책임감, 약속 이행, 의무 수행, 책임 완수, 신뢰 구축',
    'transparency': '정보 공개, 투명한 행정, 공개 원칙, 투명성 강화, 알 권리 보장',
    'communication': '소통 우수, 시민 소통, 열린 대화, 소통 노력, 경청',
    'responsiveness': '신속 대응, 민원 해결, 위기관리, 즉각 대응, 현장 방문',
    'publicinterest': '공익 실현, 시민 위한, 공공이익, 사회 기여, 공익 증진'
}


def calculate_shortfalls(politician_id: str) -> list:
    """
    Calculate sentiment ratio shortfalls from DB.

    Returns:
        List of (category, data_type, sentiment, current, total, pct, min_pct, needed)
    """
    # Paginated fetch
    all_rows = []
    offset = 0
    while True:
        r = supabase.table(TABLE_COLLECTED).select(
            'category, data_type, sentiment'
        ).eq('politician_id', politician_id).range(offset, offset + 999).execute()
        batch = r.data or []
        all_rows.extend(batch)
        if len(batch) < 1000:
            break
        offset += 1000

    counts = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
    for row in all_rows:
        cat = (row.get('category') or '').lower()
        dt = (row.get('data_type') or '').lower()
        sent = (row.get('sentiment') or 'free').lower()
        if cat and dt:
            counts[cat][dt][sent] += 1

    shortfalls = []
    for cat in CATEGORIES:
        for dt, sent, min_pct in RULES:
            c = counts[cat][dt]
            total = sum(c.values())
            if total == 0:
                continue
            current = c.get(sent, 0)
            pct = current / total * 100
            if pct < min_pct:
                needed = math.ceil((total * min_pct / 100 - current) / (1 - min_pct / 100))
                needed = max(needed, 1)
                shortfalls.append((cat, dt, sent, current, total, pct, min_pct, needed))

    return shortfalls


def build_targeted_prompt(politician_name: str, category: str, data_type: str, sentiment: str, count: int) -> str:
    """
    Build a Gemini CLI prompt for targeted sentiment collection.
    """
    cat_kr = CATEGORY_KR.get(category, category)
    current_year = datetime.now().year

    if data_type == 'official':
        period_years = 4
        source_desc = "정부/공공기관 공식 사이트 (.go.kr 도메인)"
        source_examples = "국회, 감사원, 법원, 행정부처, 지방자치단체 공식 사이트"
    else:
        period_years = 2
        source_desc = "언론 기사, 블로그, 커뮤니티 등 공공 매체"
        source_examples = "조선일보, 중앙일보, 한겨레, KBS, MBC, SBS 등 뉴스 사이트"

    start_year = current_year - period_years

    if sentiment == 'negative':
        keywords = NEGATIVE_KEYWORDS.get(category, '논란, 비판, 문제')
        sentiment_desc = f"부정적(negative) 내용 — 비판, 논란, 문제점, 지적, 실패 등"
        sentiment_instruction = f"""
CRITICAL: You MUST find NEGATIVE/critical content about {politician_name}.
Search keywords: {keywords}
Every item MUST have "sentiment": "negative" in the JSON.
Content must describe criticism, controversy, problems, or failures."""
    else:  # positive
        keywords = POSITIVE_KEYWORDS.get(category, '성과, 업적, 기여')
        sentiment_desc = f"긍정적(positive) 내용 — 성과, 업적, 기여, 인정 등"
        sentiment_instruction = f"""
CRITICAL: You MUST find POSITIVE/praising content about {politician_name}.
Search keywords: {keywords}
Every item MUST have "sentiment": "positive" in the JSON.
Content must describe achievements, contributions, praise, or recognition."""

    # Request extra items as buffer
    request_count = count + 2

    prompt = f"""
You MUST collect exactly {request_count} items about Korean politician {politician_name}'s {cat_kr}({category}).

MANDATORY REQUIREMENTS:
1. ALL items must be from: {source_desc}
   Examples: {source_examples}
2. ALL items must be: {sentiment_desc}
3. Period: {start_year}-{current_year} (within {period_years} years)
4. Use REAL URLs with actual publish dates
5. Each item must have unique content (no duplicates)

{sentiment_instruction}

SEARCH STRATEGY:
- Search for: "{politician_name} {keywords}"
- {"Focus on .go.kr domains ONLY for OFFICIAL sources" if data_type == "official" else "Focus on news articles and media reports"}
- Find real, verifiable news/reports

JSON FORMAT RULES:
1. "date": MUST be exact "YYYY-MM-DD" format
2. "sentiment": MUST be "{sentiment}" for ALL items
3. "url": MUST be real source URL (NOT Google redirect URLs)
4. "data_type": MUST be "{data_type}" for ALL items

Return ONLY valid JSON:

{{
  "events": [
    {{
      "date": "YYYY-MM-DD",
      "title": "제목",
      "content": "내용 (200자 이내, 왜 {sentiment}인지 명확히)",
      "url": "출처 URL",
      "sentiment": "{sentiment}",
      "data_type": "{data_type}",
      "source_name": "출처명"
    }}
  ]
}}

Start with {{ and end with }}. No markdown, no explanation. EXACTLY {request_count} items.
"""
    return prompt


def execute_gemini_cli(prompt: str, timeout: int = 1800, max_retries: int = 3) -> dict:
    """Execute Gemini CLI with 3-tier fallback."""
    gemini_cmd = 'gemini.cmd' if platform.system() == 'Windows' else 'gemini'

    # Step 1 & 2: CLI models
    for model_name in GEMINI_CLI_MODELS:
        print(f"    [CLI] Trying {model_name}...", flush=True)

        for attempt in range(max_retries):
            try:
                if attempt > 0:
                    time.sleep(5 * attempt)

                result = subprocess.run(
                    [gemini_cmd, '-m', model_name, '--yolo'],
                    input=prompt,
                    capture_output=True, text=True,
                    timeout=timeout,
                    encoding='utf-8', errors='replace'
                )

                if result.returncode == 0:
                    if any(kw in result.stdout.lower() for kw in QUOTA_KEYWORDS):
                        print(f"    [QUOTA] {model_name} exhausted", flush=True)
                        break  # next model
                    return {"success": True, "output": result.stdout}
                else:
                    if any(kw in result.stderr.lower() for kw in QUOTA_KEYWORDS):
                        print(f"    [QUOTA] {model_name} exhausted", flush=True)
                        break
                    if attempt < max_retries - 1:
                        continue
                    return {"success": False, "error": result.stderr[:300]}

            except subprocess.TimeoutExpired:
                if attempt < max_retries - 1:
                    continue
                return {"success": False, "error": f"Timeout {timeout}s"}
            except FileNotFoundError:
                return {"success": False, "error": "Gemini CLI not found"}

    # Step 3: API fallback
    print(f"    [API] Falling back to REST API...", flush=True)
    return execute_gemini_api(prompt)


def execute_gemini_api(prompt: str, timeout: int = 120) -> dict:
    """Gemini REST API fallback."""
    import requests as http_requests

    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return {"success": False, "error": "GEMINI_API_KEY not set"}

    API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

    for model_name in GEMINI_API_MODELS:
        url = f'{API_BASE}/{model_name}:generateContent?key={api_key}'
        payload = {'contents': [{'parts': [{'text': prompt}]}]}

        try:
            resp = http_requests.post(url, json=payload, timeout=timeout)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get('candidates', [])
                if candidates:
                    text = candidates[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                    if text and not any(kw in text.lower() for kw in QUOTA_KEYWORDS):
                        return {"success": True, "output": text}
            elif resp.status_code == 429:
                continue
        except Exception:
            continue

    return {"success": False, "error": "All API models exhausted"}


def parse_response(output: str) -> list:
    """Parse Gemini response JSON."""
    try:
        if '```json' in output:
            start = output.find('```json') + 7
            end = output.find('```', start)
            json_str = output[start:end].strip()
        elif '```' in output:
            start = output.find('```') + 3
            end = output.find('```', start)
            json_str = output[start:end].strip()
        else:
            json_str = output.strip()

        data = json.loads(json_str)
        return data.get('events', [])
    except json.JSONDecodeError:
        # Try to find JSON object in the text
        match = re.search(r'\{[\s\S]*"events"[\s\S]*\}', output)
        if match:
            try:
                data = json.loads(match.group())
                return data.get('events', [])
            except json.JSONDecodeError:
                pass
        return []


def save_events(politician_id: str, politician_name: str, category: str,
                events: list, target_data_type: str, target_sentiment: str) -> int:
    """Save collected events to DB."""
    saved = 0
    now = datetime.now()

    for event in events:
        try:
            url = event.get('url', '')
            title = str(event.get('title', ''))[:200]

            if not title and not url:
                continue

            # Skip Google redirect URLs
            if url and 'vertexaisearch.cloud.google.com' in url:
                continue

            # Determine data_type: trust the response, but verify with URL
            resp_data_type = event.get('data_type', target_data_type).lower()
            if url and '.go.kr' in url.lower():
                data_type = 'official'
            else:
                data_type = resp_data_type if resp_data_type in ('official', 'public') else target_data_type

            # Use target sentiment (what we asked for)
            sentiment = target_sentiment

            # Date validation
            event_date = event.get('date', '')
            if event_date:
                try:
                    dt = datetime.strptime(event_date[:10], '%Y-%m-%d')
                    period = 4 if data_type == 'official' else 2
                    cutoff = now - timedelta(days=365 * period)
                    if dt < cutoff:
                        continue  # Out of period
                except (ValueError, TypeError):
                    pass

            content = str(event.get('content', ''))

            record = {
                'politician_id': politician_id,
                'politician_name': politician_name,
                'category': category,
                'data_type': data_type,
                'sentiment': sentiment,
                'collector_ai': 'Gemini',
                'title': title,
                'content': content[:2000],
                'summary': content[:500],
                'source_url': url,
                'source_name': str(event.get('source_name', 'Gemini Search')),
                'published_date': event_date if event_date else None,
                'is_verified': False,
                'created_at': now.isoformat()
            }

            supabase.table(TABLE_COLLECTED).insert(record).execute()
            saved += 1

        except Exception as e:
            err = str(e)
            if 'duplicate' in err.lower() or '23505' in err:
                continue  # Skip duplicates
            print(f"      Save error: {err[:100]}", flush=True)

    return saved


def run_targeted_recollection(politician_id: str, politician_name: str, dry_run: bool = False):
    """Main function: calculate shortfalls and recollect targeted data."""

    print(f"\n{'=' * 70}", flush=True)
    print(f"  V40 Sentiment Targeted Recollection - {politician_name}", flush=True)
    print(f"{'=' * 70}", flush=True)

    # Step 1: Calculate shortfalls
    shortfalls = calculate_shortfalls(politician_id)

    if not shortfalls:
        print(f"\n  All sentiment ratios are OK! No recollection needed.", flush=True)
        return

    total_needed = sum(s[7] for s in shortfalls)
    print(f"\n  Violations: {len(shortfalls)}, Total items needed: {total_needed}", flush=True)
    print(f"\n  {'Category':<14} {'Type':<10} {'Sentiment':<10} {'Now':>5} {'Total':>6} {'Pct':>6} {'Min':>5} {'Need':>5}", flush=True)
    print(f"  {'-' * 65}", flush=True)

    for cat, dt, sent, cur, tot, pct, mp, need in shortfalls:
        print(f"  {CATEGORY_KR[cat]:<14} {dt.upper():<10} {sent:<10} {cur:>5} {tot:>6} {pct:>5.1f}% {mp:>4}% +{need:>4}", flush=True)

    if dry_run:
        print(f"\n  [DRY RUN] Would collect {total_needed} items. Use without --dry-run to execute.", flush=True)
        return

    # Step 2: Execute targeted collection
    print(f"\n  Starting targeted collection...\n", flush=True)

    total_saved = 0
    total_attempted = 0

    for i, (cat, dt, sent, cur, tot, pct, mp, need) in enumerate(shortfalls):
        total_attempted += 1
        cat_kr = CATEGORY_KR[cat]
        print(f"  [{i+1}/{len(shortfalls)}] {cat_kr} {dt.upper()} {sent}: +{need} needed", flush=True)

        # Build targeted prompt
        prompt = build_targeted_prompt(politician_name, cat, dt, sent, need)

        # Execute Gemini CLI
        result = execute_gemini_cli(prompt, timeout=300)

        if not result.get('success'):
            print(f"    ERROR: {result.get('error', 'Unknown')[:150]}", flush=True)
            time.sleep(3)
            continue

        # Parse response
        events = parse_response(result['output'])
        print(f"    Parsed {len(events)} events from response", flush=True)

        if not events:
            print(f"    WARNING: No events parsed", flush=True)
            time.sleep(3)
            continue

        # Save to DB
        saved = save_events(politician_id, politician_name, cat, events, dt, sent)
        total_saved += saved
        print(f"    Saved {saved} events to DB", flush=True)

        # Cooldown between requests
        time.sleep(3)

    # Step 3: Verify results
    print(f"\n{'=' * 70}", flush=True)
    print(f"  Results: {total_saved}/{total_needed} items saved", flush=True)
    print(f"{'=' * 70}", flush=True)

    # Re-check shortfalls
    remaining = calculate_shortfalls(politician_id)
    if not remaining:
        print(f"\n  ALL sentiment ratios now pass!", flush=True)
    else:
        remaining_needed = sum(s[7] for s in remaining)
        print(f"\n  Remaining violations: {len(remaining)}, still need: {remaining_needed} items", flush=True)
        print(f"  Run this script again to collect more.", flush=True)


def main():
    parser = argparse.ArgumentParser(
        description='V40 Sentiment-Targeted Recollection',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument('--politician_id', required=True, help='Politician ID (8-char hex)')
    parser.add_argument('--politician_name', required=True, help='Politician name')
    parser.add_argument('--dry-run', action='store_true', help='Check shortfalls only, no collection')
    args = parser.parse_args()

    run_targeted_recollection(args.politician_id, args.politician_name, args.dry_run)


if __name__ == '__main__':
    main()
