#!/usr/bin/env python3
"""
V40 Gemini CLI Direct Subprocess Collection
==========================================

공식 수집 방식: Gemini 3단계 Fallback (CLI → CLI → API)

모델: Gemini 2.5 Flash (Tier 1) → 2.0 Flash (레거시) → API fallback
방식: CLI Subprocess (Google 계정 인증) + API fallback (Tier 1 키)
비용: CLI $0 / API Tier 1 요금 (할당량 소진 시 자동 전환)

정의:
    - Python subprocess.run()으로 Gemini CLI를 직접 실행
    - stdin을 통한 프롬프트 전달
    - MCP(Model Context Protocol) 불필요
    - Google Search Grounding 기반 자동 검색

성능:
    - 평균 응답 시간: 27초/카테고리
    - subprocess 방식: DB 조회 → 수집 → 저장

Usage:
    python collect_gemini_subprocess.py --politician "박주민" --category "expertise"
"""

import os
import sys
import subprocess
import platform
import json
import re
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from dotenv import load_dotenv

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
INSTRUCTIONS_DIR = V40_DIR / "instructions" / "2_collect"
sys.path.insert(0, str(V40_DIR))

# Gemini CLI 인증 체크 유틸리티
from scripts.utils.gemini_auth_check import require_gemini_auth

# .env 파일 로드 (여러 경로 탐색, override=True로 시스템 환경변수보다 .env 우선)
_env_candidates = [
    V40_DIR / '.env',              # V40/.env
    V40_DIR.parent / '.env',       # 설계문서_V7.0/.env
    V40_DIR.parent.parent / '.env',  # 0-3_AI_Evaluation_Engine/.env
]
_env_loaded = False
for _env_path in _env_candidates:
    if _env_path.exists():
        load_dotenv(_env_path, override=True)
        _env_loaded = True
        break
if not _env_loaded:
    load_dotenv(override=True)  # 현재 디렉토리에서 찾기

# Supabase 클라이언트
from supabase import create_client, Client

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Supabase 설정
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase credentials not found in environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def _load_politician_info(politician_name: str) -> str:
    """정치인 기본 정보 로드 (MD 파일에서 기본 정보 테이블 + 동명이인 추출)"""
    pol_file = V40_DIR / 'instructions' / '1_politicians' / f'{politician_name}.md'
    if not pol_file.exists():
        return f'성명: {politician_name}'

    with open(pol_file, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    info_lines = []
    in_table = False
    for line in lines:
        if '| **politician_id**' in line or '| **성명**' in line:
            in_table = True
        if in_table:
            if line.strip().startswith('|') and '**' in line:
                if 'politician_id' not in line:
                    info_lines.append(line.strip())
            elif line.strip() == '' or line.strip() == '---':
                if info_lines:
                    break

    dongmyeong = ''
    for line in lines:
        if '동명이인' in line and '구분' in line:
            dongmyeong = line.strip().lstrip('- ')
            break

    result = '\n'.join(info_lines)
    if dongmyeong:
        result += f'\n\n⚠️ {dongmyeong}'
    return result


def load_category_instruction(category: str) -> Dict:
    """
    카테고리별 instruction 로드
    - 섹션 4: 10개 평가 항목 추출
    - 섹션 11: 검색 키워드 추출 (긍정/부정/자유)
    """
    cat_num = {
        'expertise': '01', 'leadership': '02', 'vision': '03',
        'integrity': '04', 'ethics': '05', 'accountability': '06',
        'transparency': '07', 'communication': '08',
        'responsiveness': '09', 'publicinterest': '10'
    }.get(category, '01')

    cat_file = INSTRUCTIONS_DIR / f"cat{cat_num}_{category}.md"

    if not cat_file.exists():
        logger.warning(f"Category instruction not found: {cat_file}")
        return {
            "section_4": "",
            "section_11": ""
        }

    with open(cat_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # === 섹션 4 전체 추출 ===
    section_4_match = re.search(r'(##\s*4\..*?평가 범위.*?\n.*?)(?=\n##\s*5\.)', content, re.DOTALL)
    section_4 = section_4_match.group(1).strip() if section_4_match else ""

    # === 섹션 11 전체 추출 ===
    section_11_match = re.search(r'(##\s*11\..*?검색 키워드.*?\n.*?)(?=\n##\s*12\.|\n##\s*13\.|\Z)', content, re.DOTALL)
    section_11 = section_11_match.group(1).strip() if section_11_match else ""

    logger.info(f"[CAT] Loaded {category}: section_4={len(section_4)} chars, section_11={len(section_11)} chars")

    return {
        "section_4": section_4,
        "section_11": section_11
    }


# ============================================================
# 3단계 Fallback 시스템 (Tier 1 최적화):
#   Step 1: CLI gemini-2.5-flash (Tier 1 적용, 300RPM/1000RPD)
#   Step 2: CLI gemini-2.0-flash (레거시, Free Tier만 가능)
#   Step 3: API fallback (GEMINI_API_KEY, Tier 1)
#
# 원리: 할당량 소진 시 자동으로 다음 단계로 전환
#       할당량 회복 시 다시 Step 1부터 시도 (유기적 순환)
# ============================================================

# CLI 모델 시도 순서 (Step 1 → Step 2)
# gemini-2.5-flash 우선: Tier 1 적용 모델 (300 RPM, 1000 RPD)
# gemini-2.0-flash 후순위: 레거시 모델 (Free Tier만, Tier 1 미적용)
GEMINI_CLI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash']

# API fallback 모델 시도 순서 (Step 3)
# API도 동일하게 gemini-2.5-flash 우선 (Tier 1 적용)
GEMINI_API_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']

# Quota 소진 감지 키워드
QUOTA_KEYWORDS = ['exhausted', 'quota', 'rate limit', 'capacity', 'exceeded', 'temporarily']


def execute_gemini_api(prompt: str, timeout: int = 120, max_retries: int = 3) -> Dict:
    """
    [Step 3] Gemini REST API 직접 호출 (Tier 1 Paid Quota 활용)

    ⚠️ Python 라이브러리(google.generativeai)는 Free Tier quota만 인식하는 버그가 있어
    REST API를 직접 호출하여 Tier 1 Paid Quota(10K RPD)를 정상 사용합니다.

    Args:
        prompt: 프롬프트
        timeout: 타임아웃 (초)
        max_retries: 최대 재시도 횟수

    Returns:
        {"success": bool, "output": str or None, "error": str or None}
    """
    import time
    import requests as http_requests

    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        logger.error("[ERROR] GEMINI_API_KEY not set")
        return {"success": False, "output": None, "error": "GEMINI_API_KEY not set"}

    API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

    # 여러 모델을 순차 시도
    for model_name in GEMINI_API_MODELS:
        url = f'{API_BASE}/{model_name}:generateContent?key={api_key}'
        payload = {'contents': [{'parts': [{'text': prompt}]}]}
        logger.info(f"[Step 3] REST API trying model: {model_name}")

        for attempt in range(max_retries):
            try:
                if attempt > 0:
                    wait_time = 10 * attempt
                    logger.info(f"[RETRY] API {model_name} attempt {attempt + 1}/{max_retries} after {wait_time}s...")
                    time.sleep(wait_time)

                resp = http_requests.post(url, json=payload, timeout=timeout)

                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get('candidates', [])
                    if candidates:
                        text = candidates[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                        if text:
                            if any(kw in text.lower() for kw in QUOTA_KEYWORDS):
                                logger.warning(f"[QUOTA] API {model_name} returned quota message, trying next...")
                                break
                            logger.info(f"[OK] Gemini REST API ({model_name}) call successful")
                            return {"success": True, "output": text, "error": None}
                    logger.warning(f"[WARN] Empty response from {model_name}")
                    continue

                elif resp.status_code == 429:
                    err_data = resp.json() if resp.headers.get('content-type', '').startswith('application/json') else {}
                    err_msg = err_data.get('error', {}).get('message', '')
                    logger.warning(f"[QUOTA] API {model_name} 429: {err_msg[:150]}")
                    # retry_delay 추출하여 대기
                    if 'retry' in err_msg.lower() and attempt < max_retries - 1:
                        import re
                        delay_match = re.search(r'retry in (\d+)', err_msg.lower())
                        if delay_match:
                            wait = int(delay_match.group(1)) + 2
                            logger.info(f"[WAIT] Retrying after {wait}s...")
                            time.sleep(wait)
                            continue
                    break  # 다음 모델로

                elif resp.status_code == 404:
                    logger.warning(f"[SKIP] API {model_name} not found")
                    break  # 다음 모델로

                else:
                    logger.error(f"[ERROR] API {model_name} status {resp.status_code}: {resp.text[:200]}")
                    if attempt < max_retries - 1:
                        continue
                    break

            except http_requests.exceptions.Timeout:
                logger.error(f"[TIMEOUT] API {model_name} timed out after {timeout}s")
                if attempt < max_retries - 1:
                    continue
                break

            except Exception as e:
                logger.error(f"[ERROR] API {model_name} error: {str(e)[:200]}")
                if attempt < max_retries - 1:
                    continue
                break

    return {"success": False, "output": None, "error": "All 3 steps exhausted (CLI models + API models)"}


def _try_cli_model(prompt: str, model_name: str, timeout: int, max_retries: int) -> Dict:
    """
    단일 CLI 모델로 실행 시도 (내부 함수)

    Returns:
        {"success": bool, "output": str, "error": str, "quota_exhausted": bool}
    """
    import time

    gemini_cmd = 'gemini.cmd' if platform.system() == 'Windows' else 'gemini'

    for attempt in range(max_retries):
        try:
            if attempt > 0:
                wait_time = 5 * attempt
                logger.info(f"[RETRY] CLI {model_name} attempt {attempt + 1}/{max_retries} after {wait_time}s...")
                time.sleep(wait_time)

            result = subprocess.run(
                [gemini_cmd, '-m', model_name, '--yolo'],
                input=prompt,
                capture_output=True,
                text=True,
                timeout=timeout,
                encoding='utf-8',
                errors='replace'
            )

            if result.returncode == 0:
                stdout_lower = result.stdout.lower()
                if any(kw in stdout_lower for kw in QUOTA_KEYWORDS):
                    logger.warning(f"[QUOTA] CLI {model_name} quota exhausted (detected in output)")
                    return {"success": False, "output": None, "error": "quota", "quota_exhausted": True}
                logger.info(f"[OK] Gemini CLI ({model_name}) execution successful")
                return {"success": True, "output": result.stdout, "error": None, "quota_exhausted": False}
            else:
                stderr_lower = result.stderr.lower()
                if any(kw in stderr_lower for kw in QUOTA_KEYWORDS):
                    logger.warning(f"[QUOTA] CLI {model_name} quota exhausted (detected in stderr)")
                    return {"success": False, "output": None, "error": "quota", "quota_exhausted": True}
                else:
                    logger.error(f"[ERROR] CLI {model_name} failed: {result.stderr[:300]}")
                    return {"success": False, "output": result.stdout, "error": result.stderr, "quota_exhausted": False}

        except subprocess.TimeoutExpired:
            logger.error(f"[TIMEOUT] CLI {model_name} timed out after {timeout}s")
            if attempt < max_retries - 1:
                continue
            return {"success": False, "output": None, "error": f"Timeout after {timeout}s", "quota_exhausted": False, "timed_out": True}

        except FileNotFoundError:
            logger.error(f"[ERROR] Gemini CLI not found: {gemini_cmd}")
            return {"success": False, "output": None, "error": "CLI not found", "quota_exhausted": False}

        except Exception as e:
            logger.exception(f"[ERROR] CLI {model_name} unexpected error: {e}")
            if attempt < max_retries - 1:
                continue
            return {"success": False, "output": None, "error": str(e), "quota_exhausted": False}

    return {"success": False, "output": None, "error": f"CLI {model_name} failed after {max_retries} attempts", "quota_exhausted": False}


def execute_gemini_cli(prompt: str, timeout: int = 3600, max_retries: int = 3) -> Dict:
    """
    Gemini 3단계 Fallback 실행 (Tier 1 최적화):
      Step 1: CLI gemini-2.5-flash (Tier 1 적용, 우선)
      Step 2: CLI gemini-2.0-flash (레거시 Free Tier)
      Step 3: API fallback (모든 CLI quota 소진 시)

    Args:
        prompt: 프롬프트
        timeout: 타임아웃 (초, 기본값 3600 = 1시간)
        max_retries: 최대 재시도 횟수 (기본값 3)

    Returns:
        {"success": bool, "output": str or None, "error": str or None}
    """
    # Step 1 & Step 2: CLI 모델 순차 시도
    for i, model_name in enumerate(GEMINI_CLI_MODELS):
        step_num = i + 1
        logger.info(f"[Step {step_num}] Trying CLI model: {model_name}")

        result = _try_cli_model(prompt, model_name, timeout, max_retries)

        if result['success']:
            return {"success": True, "output": result['output'], "error": None}

        if result.get('quota_exhausted'):
            logger.warning(f"[Step {step_num}] CLI {model_name} quota exhausted, moving to next step...")
            continue  # 다음 CLI 모델 또는 API로
        elif result.get('timed_out'):
            logger.warning(f"[Step {step_num}] CLI {model_name} timed out, trying next step (API fallback)...")
            continue  # 타임아웃도 다음 단계(API fallback)로
        else:
            # quota/timeout이 아닌 다른 에러 → 그대로 반환
            return {"success": False, "output": result.get('output'), "error": result.get('error')}

    # Step 3: 모든 CLI 모델 quota 소진 → API fallback
    logger.warning(f"[Step 3] All CLI models exhausted, falling back to API...")
    return execute_gemini_api(prompt, timeout=120, max_retries=max_retries)


def parse_gemini_response(output: str) -> Dict:
    """
    Gemini CLI 응답 파싱

    Args:
        output: Gemini CLI stdout

    Returns:
        {
            "events": [{"date", "title", "content", "url", "sentiment"}],
            "summary": str
        }
    """
    try:
        # DEBUG: 응답 길이 확인
        logger.info(f"[DEBUG] Response length: {len(output)} chars")

        # DEBUG: 응답 처음 500자 확인
        logger.info(f"[DEBUG] Response preview (first 500 chars): {output[:500]}")

        # JSON 형식 추출
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

        # DEBUG: 추출된 JSON 확인
        logger.info(f"[DEBUG] Extracted JSON length: {len(json_str)} chars")
        logger.info(f"[DEBUG] Extracted JSON preview: {json_str[:500]}")

        data = json.loads(json_str)
        return data

    except json.JSONDecodeError as e:
        logger.error(f"[ERROR] JSON parse failed: {e}")
        logger.error(f"[ERROR] Failed to parse: {output[:1000]}")
        return {"events": [], "summary": "Parse error"}

    except Exception as e:
        logger.exception(f"[ERROR] Response parse failed: {e}")
        logger.error(f"[ERROR] Full output: {output[:1000]}")
        return {"events": [], "summary": "Parse error"}


def save_to_db(
    politician_name: str,
    category: str,
    events: list,
    data_type: str = "official"
) -> int:
    """
    수집된 이벤트를 DB에 저장

    Args:
        politician_name: 정치인 이름
        category: 카테고리
        events: 이벤트 리스트
        data_type: 데이터 타입 (기본: official)

    Returns:
        저장된 이벤트 수
    """
    # politician_id 조회
    result = supabase.table('politicians').select('id, name').eq('name', politician_name).execute()

    if not result.data:
        logger.error(f"[ERROR] Politician not found: {politician_name}")
        return 0

    politician_id = result.data[0]['id']
    saved_count = 0

    for event in events:
        try:
            # 중복 체크 (URL 기준)
            url = event.get('url', '')
            if url:
                existing = supabase.table('collected_data_v40').select('id').eq(
                    'politician_id', politician_id
                ).eq('source_url', url).execute()

                if existing.data:
                    logger.debug(f"[SKIP] Duplicate URL: {url}")
                    continue

            # 기간 필터링 (수집일 기준)
            event_date_str = event.get('date')
            if event_date_str:
                try:
                    event_date = datetime.strptime(event_date_str[:10], '%Y-%m-%d')
                    now = datetime.now()

                    # data_type이 URL로부터 결정될 수 있으므로, 임시로 판단
                    # .go.kr 도메인이면 OFFICIAL (4년), 아니면 PUBLIC (2년)
                    is_official = '.go.kr' in url.lower() if url else False
                    period_years = 4 if is_official else 2
                    cutoff = now - timedelta(days=365 * period_years)

                    if event_date < cutoff:
                        logger.debug(f"[SKIP] Out of period: {event_date_str} (cutoff: {cutoff.strftime('%Y-%m-%d')})")
                        continue
                except:
                    pass  # 날짜 파싱 실패 시 그냥 저장

            # 이벤트 저장
            insert_data = {
                'politician_id': politician_id,
                'politician_name': result.data[0]['name'],
                'category': category,
                'published_date': event.get('date'),
                'title': event.get('title', ''),
                'content': event.get('content', ''),
                'source_url': url,
                'source_name': event.get('source_name', 'Gemini Search'),
                'summary': event.get('content', '')[:200],
                'collector_ai': 'Gemini',
                'data_type': data_type,
                'sentiment': event.get('sentiment', 'free'),
                'is_verified': False,
                'created_at': datetime.utcnow().isoformat()
            }

            supabase.table('collected_data_v40').insert(insert_data).execute()
            saved_count += 1
            logger.debug(f"[SAVE] Event saved: {event.get('title', 'N/A')}")

        except Exception as e:
            logger.error(f"[ERROR] Failed to save event: {e}")
            continue

    logger.info(f"[OK] Saved {saved_count}/{len(events)} events")
    return saved_count


def collect_category(
    politician_name: str,
    category: str,
    period_years: int = 2
) -> Dict:
    """
    단일 카테고리 데이터 수집

    Args:
        politician_name: 정치인 이름
        category: 카테고리
        period_years: 수집 기간 (년, 기본값 2)

    Returns:
        {
            "success": bool,
            "events_collected": int,
            "error": str or None
        }
    """
    logger.info(f"[COLLECT] Starting: {politician_name} - {category}")

    # 카테고리별 instruction 로드 (Section 4: 평가 범위, Section 11: 검색 키워드)
    instruction = load_category_instruction(category)

    current_year = datetime.now().year

    # 카테고리별 한글명
    category_kr_map = {
        'expertise': '전문성', 'leadership': '리더십', 'vision': '비전',
        'integrity': '청렴성', 'ethics': '윤리성', 'accountability': '책임감',
        'transparency': '투명성', 'communication': '소통능력',
        'responsiveness': '대응성', 'publicinterest': '공익성'
    }
    category_kr = category_kr_map.get(category, category)

    # OFFICIAL과 PUBLIC 기간 계산
    official_start_year = current_year - 4  # OFFICIAL: 4년
    public_start_year = current_year - 2    # PUBLIC: 2년

    # 정치인 기본 정보 로드
    politician_info = _load_politician_info(politician_name)

    # 동명이인 정보 추출
    dongmyeong_warning = ''
    pol_file = V40_DIR / 'instructions' / '1_politicians' / f'{politician_name}.md'
    if pol_file.exists():
        with open(pol_file, 'r', encoding='utf-8') as f:
            pol_content = f.read()
        for line in pol_content.split('\n'):
            if '동명이인' in line and ('구분' in line or '특정' in line):
                dongmyeong_warning = line.strip().lstrip('- *')
                break

    prompt = f"""
## 정치인 기본 정보
{politician_info}

You MUST collect exactly 10 items about Korean politician {politician_name} ({category_kr} category).

⚠️⚠️⚠️ 동명이인 주의 (CRITICAL - MUST READ) ⚠️⚠️⚠️
{dongmyeong_warning if dongmyeong_warning else f'이 정치인은 위 기본 정보에 명시된 "{politician_name}"입니다.'}
- 위 기본 정보(현 직책, 소속 정당, 출마 지역)에 해당하는 사람의 데이터만 수집하세요.
- 다른 직업, 다른 소속, 다른 지역의 동명이인 데이터를 수집하면 안 됩니다.
- 확실하지 않은 경우 수집하지 마세요.

평가 범위 (10개 평가 항목):
{instruction['section_4']}

검색 키워드 (긍정/부정/자유):
{instruction['section_11']}

Task: Search Google and collect EXACTLY 10 items about {politician_name}'s {category_kr}.

MANDATORY REQUIREMENTS:
1. OFFICIAL (.go.kr): EXACTLY 6 items, period: {official_start_year}-{current_year}
2. PUBLIC (news/blogs): EXACTLY 4 items, period: {public_start_year}-{current_year}
3. Total: EXACTLY 10 items - DO NOT return less than 10!
4. Use REAL URLs with actual publish dates
5. Follow the search keywords and evaluation criteria above
6. DO NOT include any data about namesakes (동명이인) - verify each item matches the politician profile above

⚠️ CRITICAL JSON FORMAT RULES:
1. "date": MUST be exact date in "YYYY-MM-DD" format
   - ✅ CORRECT: "2024-03-15", "2023-07-01"
   - ❌ WRONG: "2022-2026", "2025-03-XX", "2024-03"
2. "sentiment": MUST be lowercase - only "negative", "positive", or "free"
   - ✅ CORRECT: "negative", "positive", "free"
   - ❌ WRONG: "Negative", "Positive", "Free"
3. "url": MUST be real source URL - NO Google redirect URLs
   - ✅ CORRECT: "https://news.example.com/article/12345"
   - ❌ WRONG: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/..."

Return ONLY valid JSON, no other text:

{{
  "events": [
    {{
      "date": "YYYY-MM-DD",
      "title": "제목",
      "content": "내용 (200자 이내)",
      "url": "출처 URL",
      "sentiment": "negative/positive/free"
    }}
    // ... EXACTLY 10 items total
  ]
}}

Start with {{ and end with }}. No markdown, no explanation.
"""

    # Gemini CLI 실행 (타임아웃 30분)
    result = execute_gemini_cli(prompt, timeout=1800)

    if not result['success']:
        return {
            "success": False,
            "events_collected": 0,
            "error": result['error']
        }

    # 응답 파싱
    parsed = parse_gemini_response(result['output'])

    # DB 저장
    saved_count = save_to_db(politician_name, category, parsed.get('events', []))

    logger.info(f"[OK] Collection complete: {saved_count} events")

    return {
        "success": True,
        "events_collected": saved_count,
        "error": None
    }


def main():
    """메인 실행 함수"""
    import argparse

    parser = argparse.ArgumentParser(
        description='V40 Gemini CLI Direct Subprocess Collection'
    )
    parser.add_argument('--politician', required=True, help='정치인 이름')
    parser.add_argument('--category', required=True,
                       choices=[
                           'expertise', 'leadership', 'vision', 'integrity', 'ethics',
                           'accountability', 'transparency', 'communication',
                           'responsiveness', 'publicinterest'
                       ],
                       help='카테고리')
    parser.add_argument('--period', type=int, default=2,
                       help='수집 기간 (년, 기본값: 2)')

    args = parser.parse_args()

    # ⚠️ 필수: Gemini CLI 인증 확인 (Google AI Pro 유료 계정)
    # require_gemini_auth()  # 임시 비활성화: 서버 용량 부족 시 타임아웃 방지

    # 수집 실행
    result = collect_category(args.politician, args.category, args.period)

    if result['success']:
        print(f"\n[OK] Collection successful!")
        print(f"Events collected: {result['events_collected']}")
        sys.exit(0)
    else:
        print(f"\n[ERROR] Collection failed: {result['error']}")
        sys.exit(1)


if __name__ == '__main__':
    main()
