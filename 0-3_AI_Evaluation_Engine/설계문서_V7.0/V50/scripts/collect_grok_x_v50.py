#!/usr/bin/env python3
"""
V50 Grok X(Twitter) 수집 스크립트 (V50 신규 채널)
- V40에 없는 새 채널: X(Twitter) 실시간 데이터
- xAI Live Search API 사용 (web_search_preview tool)
- 목표: 12개/카테고리 (전체 120개 중 10%)
- 기간: 최근 2년 이내 (PUBLIC 기준, 센티멘트 구분 없이 전부 free)

Usage:
    python collect_grok_x_v50.py --politician_id ID --politician_name "이름" --category expertise
    python collect_grok_x_v50.py --politician_id ID --politician_name "이름"  (전체 카테고리)
"""

import os
import sys
import json
import time
import argparse
import logging
from pathlib import Path
from datetime import datetime, timedelta

# Encoding fix for Windows
if sys.platform == 'win32':
    try:
        sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)
        sys.stderr = open(sys.stderr.fileno(), mode='w', encoding='utf-8', buffering=1)
    except Exception:
        pass

# V50 paths
SCRIPT_DIR = Path(__file__).resolve().parent
V50_DIR = SCRIPT_DIR.parent

# .env 로드 (V50/.env 우선)
from dotenv import load_dotenv
for env_path in [V50_DIR / '.env', V50_DIR.parent / '.env']:
    if env_path.exists():
        load_dotenv(env_path, override=True)
        break

import requests as http_requests
from supabase import create_client

# Supabase client
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# xAI API 설정
XAI_API_KEY = os.getenv('XAI_API_KEY', '')
XAI_API_URL = 'https://api.x.ai/v1/responses'
XAI_MODEL = 'grok-3-mini'

# 테이블명
TABLE_COLLECTED = "collected_data_v50"

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

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

# 카테고리별 X 검색 키워드 (트위터 특화)
CATEGORY_X_KEYWORDS = {
    'expertise': ['전문성', '정책 발의', '법안'],
    'leadership': ['리더십', '지도력', '결단'],
    'vision': ['비전', '공약', '계획'],
    'integrity': ['청렴', '비리', '의혹'],
    'ethics': ['윤리', '도덕', '갑질'],
    'accountability': ['책임', '사과', '해명'],
    'transparency': ['투명', '공개', '정보'],
    'communication': ['소통', '민원', '답변'],
    'responsiveness': ['대응', '입장 발표', '반응'],
    'publicinterest': ['공익', '지역 발전', '봉사']
}

# 수집 목표
TARGET_PER_CATEGORY = 12


def build_x_search_prompt(politician_name: str, category: str) -> str:
    """X(Twitter) 검색용 프롬프트 생성"""
    category_kr = CATEGORY_KR.get(category, category)
    keywords = CATEGORY_X_KEYWORDS.get(category, [category_kr])
    current_year = datetime.now().year
    cutoff_year = current_year - 2

    keyword_str = ', '.join(keywords)

    prompt = f"""한국 정치인 "{politician_name}"에 관한 X(Twitter) 및 소셜미디어 데이터를 수집해주세요.

## 수집 목표
- 카테고리: {category_kr} ({category})
- 검색 키워드: {keyword_str}
- 기간: {cutoff_year}년 ~ {current_year}년 (최근 2년 이내)
- 플랫폼: site:x.com OR site:twitter.com
- 목표: 12개 결과
- sentiment: 전부 free (긍정/부정 구분 없음)

## 검색 쿼리 예시
- "{politician_name} {keywords[0]} site:x.com"
- "{politician_name} {keywords[0]} site:twitter.com"

## 출력 형식
반드시 아래 JSON 형식으로 12개의 결과를 출력하세요:

```json
{{
  "posts": [
    {{
      "date": "YYYY-MM-DD",
      "title": "게시물 제목 또는 주요 내용 요약",
      "content": "트윗/게시물 내용 또는 반응 요약 (50자 이상)",
      "url": "https://x.com/... 또는 https://twitter.com/...",
      "source_name": "X(Twitter)",
      "sentiment": "positive|negative|free",
      "author": "계정명 또는 익명"
    }}
  ]
}}
```

## 중요 규칙
1. 반드시 12개 결과를 수집하세요
2. 기간 제한({cutoff_year}년 이후)을 반드시 준수하세요
3. sentiment는 반드시 "free"로 통일하세요 (긍정/부정 구분 없음)
4. {politician_name}의 {category_kr} 관련 트윗/반응을 수집하세요
5. 실제 존재하는 URL을 포함하세요 (없으면 x.com/search 형식 사용)
"""
    return prompt


def call_xai_live_search(prompt: str, max_retries: int = 3) -> dict:
    """
    xAI Live Search API 호출 (web_search_preview tool 사용)
    Returns: {"success": bool, "output": str, "error": str}
    """
    if not XAI_API_KEY:
        return {"success": False, "output": None, "error": "XAI_API_KEY not set"}

    payload = {
        'model': XAI_MODEL,
        'input': [{'role': 'user', 'content': prompt}],
        'tools': [{"type": "web_search_preview"}]
    }

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {XAI_API_KEY}'
    }

    for attempt in range(max_retries):
        try:
            if attempt > 0:
                time.sleep(5 * attempt)

            resp = http_requests.post(
                XAI_API_URL,
                headers=headers,
                json=payload,
                timeout=60
            )

            if resp.status_code == 200:
                data = resp.json()
                # xAI responses API 응답 구조 파싱
                output_items = data.get('output', [])
                for output_item in output_items:
                    if output_item.get('type') == 'message':
                        content_list = output_item.get('content', [])
                        for content_item in content_list:
                            if content_item.get('type') == 'output_text':
                                text = content_item.get('text', '')
                                if text:
                                    return {"success": True, "output": text, "error": None}
                return {"success": False, "output": None, "error": "응답 파싱 실패"}

            elif resp.status_code == 429:
                logger.warning(f"[429] Rate limit. attempt {attempt+1}/{max_retries}")
                time.sleep(10 * (attempt + 1))
                continue

            else:
                logger.error(f"[ERROR] HTTP {resp.status_code}: {resp.text[:200]}")
                return {"success": False, "output": None, "error": f"HTTP {resp.status_code}"}

        except http_requests.exceptions.Timeout:
            logger.error(f"[TIMEOUT] attempt {attempt+1}/{max_retries}")
            continue
        except Exception as e:
            logger.error(f"[ERROR] {e}")
            return {"success": False, "output": None, "error": str(e)}

    return {"success": False, "output": None, "error": f"max_retries({max_retries}) exceeded"}


def parse_posts(output: str) -> list:
    """Grok 응답에서 게시물 파싱"""
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
        return data.get('posts', [])
    except Exception:
        return []


def get_current_counts(politician_id: str) -> dict:
    """현재 Grok-X 수집 수량 조회 (페이지네이션 적용)"""
    counts = {}
    for cat in CATEGORIES:
        offset = 0
        total = 0
        while True:
            result = supabase.table(TABLE_COLLECTED).select('id').eq(
                'politician_id', politician_id
            ).eq('category', cat).eq('collector_ai', 'Grok-X').range(offset, offset + 999).execute()
            batch = result.data or []
            total += len(batch)
            if len(batch) < 1000:
                break
            offset += 1000
        counts[cat] = total
    return counts


def save_posts(politician_id: str, politician_name: str, category: str, posts: list) -> int:
    """게시물을 DB에 저장 (중복 체크 + 기간 필터)"""
    saved = 0
    now = datetime.now()
    cutoff = now - timedelta(days=365 * 2)  # PUBLIC: 최근 2년

    for post in posts:
        try:
            url = post.get('url', '')

            # 중복 체크
            if url:
                existing = supabase.table(TABLE_COLLECTED).select('id').eq(
                    'politician_id', politician_id
                ).eq('source_url', url).execute()
                if existing.data:
                    continue

            # 기간 필터 (PUBLIC 2년)
            date_str = post.get('date', '')
            if date_str:
                try:
                    post_date = datetime.strptime(date_str[:10], '%Y-%m-%d')
                    if post_date < cutoff:
                        continue
                except Exception:
                    pass

            insert_data = {
                'politician_id': politician_id,
                'politician_name': politician_name,
                'category': category,
                'published_date': post.get('date'),
                'title': post.get('title', ''),
                'content': post.get('content', ''),
                'source_url': url if url else f'https://x.com/search?q={politician_name}',
                'source_name': post.get('source_name', 'X(Twitter)'),
                'summary': post.get('content', '')[:200],
                'collector_ai': 'Grok-X',
                'source_type': 'PUBLIC',
                'sentiment': 'free',  # Grok-X는 센티멘트 구분 없이 전부 free
                'is_verified': False,
                'created_at': datetime.utcnow().isoformat()
            }
            supabase.table(TABLE_COLLECTED).insert(insert_data).execute()
            saved += 1
        except Exception as e:
            logger.debug(f"[SAVE ERROR] {e}")
            continue

    return saved


def collect_category(politician_id: str, politician_name: str, category: str) -> dict:
    """단일 카테고리 X(Twitter) 수집"""
    logger.info(f"[START] {category} ({CATEGORY_KR.get(category, category)})")

    counts = get_current_counts(politician_id)
    current = counts.get(category, 0)

    if current >= TARGET_PER_CATEGORY:
        logger.info(f"[SKIP] {category}: {current}/{TARGET_PER_CATEGORY} (이미 충분)")
        return {'category': category, 'collected': 0, 'total': current}

    needed = TARGET_PER_CATEGORY - current
    logger.info(f"  현재: {current}/{TARGET_PER_CATEGORY} (필요: {needed})")

    prompt = build_x_search_prompt(politician_name, category)
    result = call_xai_live_search(prompt)

    if not result['success']:
        logger.error(f"  [FAIL] API 호출 실패: {result.get('error', '')}")
        return {'category': category, 'collected': 0, 'total': current}

    posts = parse_posts(result['output'])
    if not posts:
        logger.warning(f"  [WARN] 파싱된 게시물 없음")
        return {'category': category, 'collected': 0, 'total': current}

    saved = save_posts(politician_id, politician_name, category, posts)
    logger.info(f"  [OK] +{saved} 저장 (총 {current + saved}/{TARGET_PER_CATEGORY})")

    return {'category': category, 'collected': saved, 'total': current + saved}


def main():
    parser = argparse.ArgumentParser(description='V50 Grok X(Twitter) 수집 (신규 채널)')
    parser.add_argument('--politician_id', required=True, help='정치인 ID (8자리 hex)')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--category', help='특정 카테고리만 수집 (미지정 시 전체)')
    args = parser.parse_args()

    if not XAI_API_KEY:
        logger.error("XAI_API_KEY가 설정되지 않았습니다!")
        sys.exit(1)

    logger.info(f"{'='*60}")
    logger.info(f"V50 Grok X(Twitter) 수집 (신규 채널)")
    logger.info(f"정치인: {args.politician_name} ({args.politician_id})")
    logger.info(f"모델: {XAI_MODEL} | Live Search 활성화")
    logger.info(f"목표: {TARGET_PER_CATEGORY}개/카테고리 | 테이블: {TABLE_COLLECTED}")
    logger.info(f"{'='*60}")

    categories_to_collect = [args.category] if args.category else CATEGORIES

    total_added = 0
    results = []

    for cat in categories_to_collect:
        if cat not in CATEGORIES:
            logger.warning(f"[SKIP] Unknown category: {cat}")
            continue

        result = collect_category(args.politician_id, args.politician_name, cat)
        results.append(result)
        total_added += result['collected']

        if cat != categories_to_collect[-1]:
            time.sleep(3)  # API rate limit 방지

    # 최종 결과
    logger.info(f"\n{'='*60}")
    logger.info(f"최종 결과: {args.politician_name}")
    logger.info(f"{'='*60}")
    for r in results:
        cat = r['category']
        status = "OK" if r['total'] >= TARGET_PER_CATEGORY else f"부족({r['total']}/{TARGET_PER_CATEGORY})"
        logger.info(f"  {cat:20s}: {r['total']:3d} [{status}]")
    logger.info(f"  이번 수집 추가: +{total_added}")
    logger.info(f"{'='*60}")


if __name__ == '__main__':
    main()
