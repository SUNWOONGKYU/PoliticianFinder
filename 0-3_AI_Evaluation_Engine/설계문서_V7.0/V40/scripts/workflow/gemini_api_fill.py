#!/usr/bin/env python3
"""
Gemini REST API 보충 수집 스크립트
- CLI 건너뛰고 REST API만 사용 (빠름)
- 두 API 키 교대 사용으로 할당량 극대화
- 카테고리별 목표 수량 자동 확인 후 부족분만 수집
- 자동 할당량 감지 및 키 전환

Usage:
    python gemini_api_fill.py --politician "명재성" --target 60
    python gemini_api_fill.py --politician "이재준" --target 60 --max-rounds 20
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
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)
sys.stderr = open(sys.stderr.fileno(), mode='w', encoding='utf-8', buffering=1)

# V40 paths
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent

# .env 로드 (V40/.env 우선)
from dotenv import load_dotenv
for env_path in [V40_DIR / '.env', V40_DIR.parent / '.env']:
    if env_path.exists():
        load_dotenv(env_path, override=True)
        break

from supabase import create_client
import requests as http_requests

# Supabase client
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

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

# API 설정
API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
API_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash']

# 최대 3개 API 키 (교대 사용)
API_KEYS = []
for env_name in ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3']:
    k = os.getenv(env_name, '')
    if k:
        API_KEYS.append(k)

if not API_KEYS:
    logger.error("GEMINI_API_KEY가 설정되지 않았습니다!")
    sys.exit(1)

current_key_idx = 0
consecutive_429_count = 0


def get_current_key():
    """현재 사용할 API 키 반환"""
    return API_KEYS[current_key_idx % len(API_KEYS)]


def switch_key():
    """다음 API 키로 전환"""
    global current_key_idx
    if len(API_KEYS) > 1:
        current_key_idx = (current_key_idx + 1) % len(API_KEYS)
        logger.info(f"[KEY] Switched to key #{current_key_idx + 1}")
        return True
    return False


def call_gemini_api(prompt: str, max_retries: int = 2) -> dict:
    """
    Gemini REST API 직접 호출
    Returns: {"success": bool, "output": str, "quota_exhausted": bool}
    """
    global consecutive_429_count

    api_key = get_current_key()

    for model_name in API_MODELS:
        url = f'{API_BASE}/{model_name}:generateContent?key={api_key}'
        payload = {'contents': [{'parts': [{'text': prompt}]}]}

        for attempt in range(max_retries):
            try:
                if attempt > 0:
                    time.sleep(5 * attempt)

                resp = http_requests.post(url, json=payload, timeout=120)

                if resp.status_code == 200:
                    consecutive_429_count = 0
                    data = resp.json()
                    candidates = data.get('candidates', [])
                    if candidates:
                        text = candidates[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                        if text:
                            return {"success": True, "output": text, "quota_exhausted": False}
                    continue

                elif resp.status_code == 429:
                    consecutive_429_count += 1
                    logger.warning(f"[429] {model_name} quota exhausted (key #{current_key_idx + 1})")
                    # Try switching key
                    if switch_key():
                        api_key = get_current_key()
                        url = f'{API_BASE}/{model_name}:generateContent?key={api_key}'
                        continue
                    return {"success": False, "output": None, "quota_exhausted": True}

                elif resp.status_code == 404:
                    break  # Try next model

                else:
                    logger.error(f"[ERROR] {model_name}: HTTP {resp.status_code}")
                    continue

            except http_requests.exceptions.Timeout:
                logger.error(f"[TIMEOUT] {model_name}")
                continue
            except Exception as e:
                logger.error(f"[ERROR] {model_name}: {e}")
                continue

    return {"success": False, "output": None, "quota_exhausted": consecutive_429_count >= 4}


def parse_events(output: str) -> list:
    """Gemini 응답에서 이벤트 파싱"""
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
    except:
        return []


def save_events(politician_id: str, politician_name: str, category: str, events: list) -> int:
    """이벤트를 DB에 저장 (중복 체크 + 기간 필터)"""
    saved = 0
    now = datetime.now()

    for event in events:
        try:
            url = event.get('url', '')

            # 중복 체크
            if url:
                existing = supabase.table('collected_data_v40').select('id').eq(
                    'politician_id', politician_id
                ).eq('source_url', url).execute()
                if existing.data:
                    continue

            # 기간 필터
            date_str = event.get('date', '')
            if date_str:
                try:
                    event_date = datetime.strptime(date_str[:10], '%Y-%m-%d')
                    is_official = '.go.kr' in url.lower() if url else False
                    cutoff = now - timedelta(days=365 * (4 if is_official else 2))
                    if event_date < cutoff:
                        continue
                except:
                    pass

            # 저장
            insert_data = {
                'politician_id': politician_id,
                'politician_name': politician_name,
                'category': category,
                'published_date': event.get('date'),
                'title': event.get('title', ''),
                'content': event.get('content', ''),
                'source_url': url,
                'source_name': event.get('source_name', 'Gemini Search'),
                'summary': event.get('content', '')[:200],
                'collector_ai': 'Gemini',
                'data_type': 'official' if '.go.kr' in url.lower() else 'public' if url else 'public',
                'sentiment': event.get('sentiment', 'free'),
                'is_verified': False,
                'created_at': datetime.utcnow().isoformat()
            }
            supabase.table('collected_data_v40').insert(insert_data).execute()
            saved += 1
        except Exception as e:
            logger.debug(f"[SAVE ERROR] {e}")
            continue

    return saved


def get_current_counts(politician_id: str) -> dict:
    """현재 Gemini 수집 수량 조회"""
    counts = {}
    for cat in CATEGORIES:
        result = supabase.table('collected_data_v40').select('id', count='exact').eq(
            'politician_id', politician_id
        ).eq('category', cat).eq('collector_ai', 'Gemini').execute()
        counts[cat] = result.count if result.count is not None else len(result.data)
    return counts


def load_category_instruction(category: str) -> str:
    """카테고리별 instruction 파일 로드"""
    cat_num = CATEGORIES.index(category) + 1
    inst_file = V40_DIR / 'instructions' / '3_evaluate' / f'cat{cat_num:02d}_{category}.md'
    if inst_file.exists():
        with open(inst_file, 'r', encoding='utf-8') as f:
            content = f.read()
        # Section 4와 Section 11 추출
        sections = {}
        current_section = None
        for line in content.split('\n'):
            if line.startswith('## ') and ('Section' in line or '섹션' in line):
                for s in ['4', '11']:
                    if f'Section {s}' in line or f'섹션 {s}' in line:
                        current_section = s
            elif line.startswith('## ') and current_section:
                current_section = None
            elif current_section:
                sections.setdefault(current_section, []).append(line)
        return '\n'.join(sections.get('4', [])) + '\n' + '\n'.join(sections.get('11', []))
    return ''


def load_politician_info(politician_name: str) -> str:
    """정치인 정보 파일 로드"""
    pol_file = V40_DIR / 'instructions' / '1_politicians' / f'{politician_name}.md'
    if pol_file.exists():
        with open(pol_file, 'r', encoding='utf-8') as f:
            return f.read()[:2000]
    return ''


def build_prompt(politician_name: str, category: str) -> str:
    """수집용 프롬프트 생성"""
    category_kr = CATEGORY_KR.get(category, category)
    current_year = datetime.now().year
    instruction = load_category_instruction(category)
    pol_info = load_politician_info(politician_name)

    prompt = f"""당신은 한국 정치인 평가를 위한 데이터 수집 AI입니다.

## 대상 정치인
{pol_info if pol_info else f'이름: {politician_name}'}

## 수집 카테고리: {category_kr} ({category})

## 기간 제한
- OFFICIAL 데이터 (.go.kr 등 공식 사이트): {current_year - 4}년 ~ {current_year}년 (최근 4년)
- PUBLIC 데이터 (뉴스, 블로그 등): {current_year - 2}년 ~ {current_year}년 (최근 2년)

{f'## 평가 기준 참고{chr(10)}{instruction}' if instruction else ''}

## 출력 형식
반드시 아래 JSON 형식으로 10개의 이벤트를 출력하세요:

```json
{{
  "events": [
    {{
      "date": "YYYY-MM-DD",
      "title": "제목",
      "content": "내용 설명 (100자 이상)",
      "url": "https://실제URL",
      "sentiment": "positive|negative|free"
    }}
  ]
}}
```

## 중요 규칙
1. 반드시 10개 이벤트를 수집하세요
2. 실제 존재하는 URL을 포함하세요
3. sentiment는 negative(부정), positive(긍정), free(중립) 중 하나
4. 기간 제한을 반드시 준수하세요
5. {politician_name}의 {category_kr} 관련 활동/뉴스를 수집하세요
"""
    return prompt


def main():
    parser = argparse.ArgumentParser(description='Gemini REST API 보충 수집')
    parser.add_argument('--politician', required=True, help='정치인 이름')
    parser.add_argument('--target', type=int, default=60, help='카테고리별 목표 수량')
    parser.add_argument('--max-rounds', type=int, default=20, help='카테고리별 최대 라운드')
    parser.add_argument('--categories', nargs='+', help='특정 카테고리만 수집')
    args = parser.parse_args()

    politician_name = args.politician
    target = args.target
    max_rounds = args.max_rounds

    # 정치인 ID 조회
    result = supabase.table('politicians').select('id, name').eq('name', politician_name).execute()
    if not result.data:
        logger.error(f"정치인을 찾을 수 없습니다: {politician_name}")
        sys.exit(1)
    politician_id = result.data[0]['id']

    logger.info(f"{'='*60}")
    logger.info(f"Gemini REST API 보충 수집")
    logger.info(f"정치인: {politician_name} ({politician_id})")
    logger.info(f"목표: {target}개/카테고리, 최대 {max_rounds}라운드")
    logger.info(f"API 키: {len(API_KEYS)}개")
    logger.info(f"{'='*60}")

    # 현재 수량 확인
    counts = get_current_counts(politician_id)
    categories_to_fill = args.categories or CATEGORIES

    total_added = 0

    for cat in categories_to_fill:
        if cat not in CATEGORIES:
            logger.warning(f"[SKIP] Unknown category: {cat}")
            continue

        current = counts.get(cat, 0)
        needed = max(0, target - current)

        if needed == 0:
            logger.info(f"[SKIP] {cat}: {current}/{target} (이미 충분)")
            continue

        logger.info(f"\n{'='*40}")
        logger.info(f"[START] {cat} ({CATEGORY_KR[cat]}): {current}/{target} (필요: {needed})")

        prompt = build_prompt(politician_name, cat)
        cat_added = 0
        all_quota_exhausted = False

        for round_num in range(1, max_rounds + 1):
            # 현재 수량 재확인
            curr = counts.get(cat, 0) + cat_added
            if curr >= target:
                logger.info(f"  [DONE] {cat}: {curr}/{target} 달성!")
                break

            result = call_gemini_api(prompt)

            if result['quota_exhausted']:
                logger.warning(f"  [QUOTA] 모든 API 키 소진! {cat} R{round_num}")
                all_quota_exhausted = True
                break

            if result['success'] and result['output']:
                events = parse_events(result['output'])
                if events:
                    saved = save_events(politician_id, politician_name, cat, events)
                    cat_added += saved
                    logger.info(f"  [R{round_num}] +{saved} (누적: {current + cat_added}/{target})")
                else:
                    logger.warning(f"  [R{round_num}] 파싱 실패")
            else:
                logger.warning(f"  [R{round_num}] API 호출 실패")

            time.sleep(2)  # Rate limit 방지

        total_added += cat_added
        logger.info(f"[END] {cat}: {current} → {current + cat_added} (+{cat_added})")

        if all_quota_exhausted:
            logger.error("\n[ABORT] 모든 API 키 할당량 소진. 수집 중단.")
            break

    # 최종 결과
    final_counts = get_current_counts(politician_id)
    logger.info(f"\n{'='*60}")
    logger.info(f"최종 결과: {politician_name}")
    logger.info(f"{'='*60}")
    total_gemini = 0
    for cat in CATEGORIES:
        c = final_counts.get(cat, 0)
        total_gemini += c
        status = "OK" if c >= target else f"부족({c}/{target})"
        logger.info(f"  {cat:20s}: {c:3d} [{status}]")
    logger.info(f"  {'Total':20s}: {total_gemini}")
    logger.info(f"  이번 수집 추가: +{total_added}")
    logger.info(f"{'='*60}")


if __name__ == '__main__':
    main()
