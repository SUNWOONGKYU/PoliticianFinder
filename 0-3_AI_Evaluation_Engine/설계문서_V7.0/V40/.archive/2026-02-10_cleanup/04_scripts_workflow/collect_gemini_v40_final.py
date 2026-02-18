#!/usr/bin/env python3
"""
V40 Gemini CLI Perfect Instruction-Based Collection
===================================================

완벽한 Instruction 파일 기반 수집:
- instructions/2_collect/prompts/gemini_official.md (36개, 3-3-30 센티멘트)
- instructions/2_collect/prompts/gemini_public.md (24개, 4-4-16 센티멘트)
- instructions/2_collect/cat01~10.md (카테고리별 상세 지침)

V40 정확한 배분:
- OFFICIAL: 36개 (30 + 20% 버퍼), negative 3 / positive 3 / free 30
- PUBLIC: 24개 (20 + 20% 버퍼), negative 4 / positive 4 / free 16
- OFFICIAL 기간: 4년, PUBLIC 기간: 2년

사용법:
    python collect_gemini_v40_final.py --politician "박주민" --category expertise
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
from typing import Dict, List, Optional
from dotenv import load_dotenv

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
INSTRUCTIONS_DIR = V40_DIR / "instructions" / "2_collect"
PROMPTS_DIR = INSTRUCTIONS_DIR / "prompts"

sys.path.insert(0, str(V40_DIR))

# Gemini CLI 인증 체크 유틸리티
from scripts.utils.gemini_auth_check import require_gemini_auth

# .env 파일 로드
ENV_PATH = V40_DIR.parent / '.env'
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

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
    raise RuntimeError("Supabase credentials not found")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 카테고리별 한글명
CATEGORY_KR_MAP = {
    'expertise': '전문성', 'leadership': '리더십', 'vision': '비전',
    'integrity': '청렴성', 'ethics': '윤리성', 'accountability': '책임감',
    'transparency': '투명성', 'communication': '소통능력',
    'responsiveness': '대응성', 'publicinterest': '공익성'
}


def load_instruction_file(file_path: Path) -> str:
    """Instruction 파일 로드"""
    if not file_path.exists():
        raise FileNotFoundError(f"Instruction file not found: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    logger.debug(f"[LOAD] Loaded instruction: {file_path.name}")
    return content


def extract_prompt_body(content: str) -> str:
    """PROMPT_BODY 섹션 추출"""
    match = re.search(r'---PROMPT_BODY_START---\s*(.+?)\s*---PROMPT_BODY_END---',
                     content, re.DOTALL)
    if match:
        return match.group(1).strip()

    logger.warning("[WARN] PROMPT_BODY section not found, using full content")
    return content


def load_category_instruction(category: str) -> Dict[str, str]:
    """카테고리별 instruction 로드"""
    cat_num = {
        'expertise': '01', 'leadership': '02', 'vision': '03',
        'integrity': '04', 'ethics': '05', 'accountability': '06',
        'transparency': '07', 'communication': '08',
        'responsiveness': '09', 'publicinterest': '10'
    }.get(category, '01')

    cat_file = INSTRUCTIONS_DIR / f"cat{cat_num}_{category}.md"

    if not cat_file.exists():
        logger.error(f"[ERROR] Category instruction not found: {cat_file}")
        raise FileNotFoundError(f"Category instruction missing: {cat_file}")

    content = load_instruction_file(cat_file)

    # topic_instruction 추출
    topic_match = re.search(r'## 수집 주제\s*(.+?)(?=##|$)', content, re.DOTALL)
    topic = topic_match.group(1).strip() if topic_match else "관련 활동 및 기록"

    # search_keywords 추출
    keywords_match = re.search(r'## 검색 키워드\s*(.+?)(?=##|$)', content, re.DOTALL)
    keywords = keywords_match.group(1).strip() if keywords_match else f"{CATEGORY_KR_MAP.get(category, category)}"

    logger.debug(f"[CAT] Loaded {category}: {len(topic)} chars topic, {len(keywords)} chars keywords")

    return {
        "topic_instruction": topic,
        "search_keywords": keywords
    }


def build_prompt(
    template: str,
    politician_name: str,
    politician_id: str,
    category: str,
    data_type: str,
    period_years: int
) -> str:
    """프롬프트 템플릿에 플레이스홀더 치환 (완벽 버전)"""

    # 카테고리 instruction 로드
    try:
        cat_inst = load_category_instruction(category)
    except FileNotFoundError as e:
        logger.error(f"[ERROR] {e}")
        cat_inst = {"topic_instruction": "", "search_keywords": ""}

    # 날짜 계산
    current_date = datetime.now()
    start_date = current_date - timedelta(days=365 * period_years)
    date_limit = start_date.strftime("%Y-%m-%d")

    # 이미 수집된 URL 조회 (중복 방지 - 같은 AI만 체크)
    try:
        existing = supabase.table('collected_data_v40').select('source_url').eq(
            'politician_id', politician_id
        ).eq('category', category).eq('data_type', data_type).eq(
            'collector_ai', 'Gemini'
        ).execute()

        if existing.data and len(existing.data) > 0:
            exclude_urls = "\n".join([item['source_url'] for item in existing.data[:50]])  # 최대 50개
            logger.info(f"[DUPLICATE] Found {len(existing.data)} existing URLs for {category}/{data_type}")
        else:
            exclude_urls = "없음"
    except Exception as e:
        logger.warning(f"[WARN] Failed to load existing URLs: {e}")
        exclude_urls = "없음"

    # 기본 플레이스홀더 치환
    prompt = template
    prompt = prompt.replace('{politician_full}', politician_name)
    prompt = prompt.replace('{politician_id}', politician_id)
    prompt = prompt.replace('{category}', category)
    prompt = prompt.replace('{category_kr}', CATEGORY_KR_MAP.get(category, category))
    prompt = prompt.replace('{topic_instruction}', cat_inst['topic_instruction'])
    prompt = prompt.replace('{search_keywords}', cat_inst['search_keywords'])
    prompt = prompt.replace('{date_limit}', f"{date_limit} 이후")
    prompt = prompt.replace('{exclude_urls}', exclude_urls)

    # data_type별 remaining, extra_keyword, domain_hint 계산 (20% 버퍼 포함)
    if data_type == 'official':
        base_count = 30
        buffer_count = int(base_count * 0.2)  # 6개
        total_count = base_count + buffer_count  # 36개

        prompt = prompt.replace('{remaining}', str(total_count))
        prompt = prompt.replace('{extra_keyword}', '법안 발의')
        prompt = prompt.replace('{domain_hint}', 'site:assembly.go.kr OR site:korea.go.kr')

        logger.info(f"[OFFICIAL] Target: {total_count} items (base {base_count} + buffer {buffer_count})")
    else:  # public
        base_count = 20
        buffer_count = int(base_count * 0.2)  # 4개
        total_count = base_count + buffer_count  # 24개

        prompt = prompt.replace('{remaining}', str(total_count))
        prompt = prompt.replace('{extra_keyword}', '뉴스 보도')
        prompt = prompt.replace('{domain_hint}', '')

        logger.info(f"[PUBLIC] Target: {total_count} items (base {base_count} + buffer {buffer_count})")

    logger.debug(f"[PROMPT] Built prompt: {len(prompt)} characters")
    return prompt


def execute_gemini_cli(prompt: str, timeout: int = 600) -> Dict:
    """Gemini CLI 실행"""
    gemini_cmd = 'gemini.cmd' if platform.system() == 'Windows' else 'gemini'

    logger.info(f"[GEMINI] Executing CLI (timeout: {timeout}s)...")

    try:
        result = subprocess.run(
            [gemini_cmd, '--yolo'],
            input=prompt,
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding='utf-8',
            errors='replace'
        )

        if result.returncode == 0:
            logger.info("[OK] Gemini CLI execution successful")
            return {"success": True, "output": result.stdout, "error": None}
        else:
            logger.error(f"[ERROR] Gemini CLI failed: {result.stderr}")
            logger.error("")
            logger.error("⚠️  Gemini CLI 오류 발생 시 가장 먼저 업데이트를 확인하세요!")
            logger.error("    npm update -g @google/gemini-cli")
            logger.error("")
            return {"success": False, "output": result.stdout, "error": result.stderr}

    except subprocess.TimeoutExpired:
        logger.error(f"[TIMEOUT] Gemini CLI timed out after {timeout}s")
        logger.error("")
        logger.error("⚠️  타임아웃 발생 시 Gemini CLI 업데이트를 확인하세요!")
        logger.error("    npm update -g @google/gemini-cli")
        logger.error("")
        return {"success": False, "output": None, "error": f"Timeout after {timeout}s"}

    except FileNotFoundError:
        logger.error(f"[ERROR] Gemini CLI not found: {gemini_cmd}")
        logger.error("")
        logger.error("⚠️  Gemini CLI 설치 필요:")
        logger.error("    npm install -g @google/gemini-cli")
        logger.error("")
        return {"success": False, "output": None, "error": "Gemini CLI not found"}

    except Exception as e:
        logger.exception(f"[ERROR] Unexpected error: {e}")
        logger.error("")
        logger.error("⚠️  오류 발생 시 Gemini CLI 업데이트를 먼저 확인하세요!")
        logger.error("    npm update -g @google/gemini-cli")
        logger.error("")
        return {"success": False, "output": None, "error": str(e)}


def parse_gemini_response(output: str) -> Dict:
    """Gemini CLI 응답 파싱"""
    try:
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
            # JSON 객체 찾기 시도
            json_match = re.search(r'\{[\s\S]*"items"[\s\S]*\}', output)
            if json_match:
                json_str = json_match.group(0)
            else:
                json_str = output

        data = json.loads(json_str)

        items_count = len(data.get('items', []))
        logger.info(f"[PARSE] Parsed {items_count} items from response")

        return data

    except json.JSONDecodeError as e:
        logger.error(f"[ERROR] JSON parse failed: {e}")
        logger.debug(f"[DEBUG] Output preview: {output[:500]}...")
        return {"items": []}

    except Exception as e:
        logger.exception(f"[ERROR] Response parse failed: {e}")
        return {"items": []}


def validate_and_save(
    politician_name: str,
    politician_id: str,
    category: str,
    items: list,
    data_type: str,
    expected_sentiment: Dict[str, int]
) -> int:
    """
    데이터 검증 및 저장

    Args:
        expected_sentiment: {'negative': 3, 'positive': 3, 'free': 30} 형식
    """
    if not items:
        logger.warning("[WARN] No items to save")
        return 0

    # 센티멘트 분포 확인
    sentiment_count = {'negative': 0, 'positive': 0, 'free': 0}
    for item in items:
        sent = item.get('sentiment', 'free')
        if sent in sentiment_count:
            sentiment_count[sent] += 1

    logger.info(f"[SENTIMENT] Distribution: {sentiment_count}")
    logger.info(f"[SENTIMENT] Expected: {expected_sentiment}")

    saved_count = 0

    for item in items:
        try:
            # 중복 체크 (URL 기준)
            url = item.get('source_url', '')
            if not url:
                logger.debug("[SKIP] No URL provided")
                continue

            existing = supabase.table('collected_data_v40').select('id').eq(
                'politician_id', politician_id
            ).eq('source_url', url).execute()

            if existing.data:
                logger.debug(f"[SKIP] Duplicate URL: {url[:50]}...")
                continue

            # 데이터 저장
            insert_data = {
                'politician_id': politician_id,
                'politician_name': politician_name,
                'category': category,
                'published_date': item.get('data_date', ''),
                'title': item.get('data_title', ''),
                'content': item.get('data_content', ''),
                'source_url': url,
                'source_name': item.get('data_source', 'Gemini Search'),
                'summary': item.get('data_content', '')[:200],
                'collector_ai': 'Gemini',
                'data_type': data_type,
                'sentiment': item.get('sentiment', 'free'),
                'is_verified': False,
                'created_at': datetime.utcnow().isoformat()
            }

            supabase.table('collected_data_v40').insert(insert_data).execute()
            saved_count += 1

            logger.debug(f"[SAVE] Saved: {item.get('data_title', 'N/A')[:50]}")

        except Exception as e:
            logger.error(f"[ERROR] Failed to save item: {e}")
            continue

    logger.info(f"[OK] Saved {saved_count}/{len(items)} items")
    return saved_count


def collect_category(
    politician_name: str,
    category: str,
    period_years: int = 4
) -> Dict:
    """
    단일 카테고리 데이터 수집 (OFFICIAL + PUBLIC)

    V40 배분:
    - OFFICIAL: 36개 (30 + 20% 버퍼), 센티멘트 3-3-30
    - PUBLIC: 24개 (20 + 20% 버퍼), 센티멘트 4-4-16
    """
    logger.info(f"\n{'='*60}")
    logger.info(f"[COLLECT] Starting: {politician_name} - {category}")
    logger.info(f"{'='*60}\n")

    # politician_id 조회
    result = supabase.table('politicians').select('id, name').eq('name', politician_name).execute()

    if not result.data:
        logger.error(f"[ERROR] Politician not found: {politician_name}")
        return {"success": False, "events_collected": 0, "error": "Politician not found"}

    politician_id = result.data[0]['id']
    total_collected = 0

    # 1. OFFICIAL 수집 (36개, 4년 기간)
    logger.info(f"[OFFICIAL] Collecting OFFICIAL data (36 items)...")
    official_template_file = PROMPTS_DIR / "gemini_official.md"

    if official_template_file.exists():
        official_content = load_instruction_file(official_template_file)
        official_prompt_body = extract_prompt_body(official_content)
        official_prompt = build_prompt(
            official_prompt_body, politician_name, politician_id,
            category, 'official', period_years=4
        )

        official_result = execute_gemini_cli(official_prompt, timeout=600)

        if official_result['success']:
            official_parsed = parse_gemini_response(official_result['output'])
            official_items = official_parsed.get('items', [])

            # 센티멘트 기대값: 3-3-30
            official_saved = validate_and_save(
                politician_name, politician_id, category,
                official_items, 'official',
                expected_sentiment={'negative': 3, 'positive': 3, 'free': 30}
            )
            total_collected += official_saved
            logger.info(f"[OK] OFFICIAL: {official_saved} items saved\n")
        else:
            logger.error(f"[ERROR] OFFICIAL collection failed: {official_result['error']}\n")
    else:
        logger.error(f"[ERROR] OFFICIAL template not found: {official_template_file}\n")

    # 2. PUBLIC 수집 (24개, 2년 기간)
    logger.info(f"[PUBLIC] Collecting PUBLIC data (24 items)...")
    public_template_file = PROMPTS_DIR / "gemini_public.md"

    if public_template_file.exists():
        public_content = load_instruction_file(public_template_file)
        public_prompt_body = extract_prompt_body(public_content)
        public_prompt = build_prompt(
            public_prompt_body, politician_name, politician_id,
            category, 'public', period_years=2
        )

        public_result = execute_gemini_cli(public_prompt, timeout=600)

        if public_result['success']:
            public_parsed = parse_gemini_response(public_result['output'])
            public_items = public_parsed.get('items', [])

            # 센티멘트 기대값: 4-4-16
            public_saved = validate_and_save(
                politician_name, politician_id, category,
                public_items, 'public',
                expected_sentiment={'negative': 4, 'positive': 4, 'free': 16}
            )
            total_collected += public_saved
            logger.info(f"[OK] PUBLIC: {public_saved} items saved\n")
        else:
            logger.error(f"[ERROR] PUBLIC collection failed: {public_result['error']}\n")
    else:
        logger.error(f"[ERROR] PUBLIC template not found: {public_template_file}\n")

    logger.info(f"\n{'='*60}")
    logger.info(f"[COMPLETE] {category}: {total_collected} total items")
    logger.info(f"{'='*60}\n")

    return {
        "success": True,
        "events_collected": total_collected,
        "error": None
    }


def main():
    """메인 실행 함수"""
    import argparse

    parser = argparse.ArgumentParser(
        description='V40 Gemini CLI Perfect Instruction-Based Collection'
    )
    parser.add_argument('--politician', required=True, help='정치인 이름')
    parser.add_argument('--category', required=True,
                       choices=[
                           'expertise', 'leadership', 'vision', 'integrity', 'ethics',
                           'accountability', 'transparency', 'communication',
                           'responsiveness', 'publicinterest'
                       ],
                       help='카테고리')

    args = parser.parse_args()

    # ⚠️ 필수: Gemini CLI 인증 확인 (Google AI Pro 유료 계정)
    require_gemini_auth()

    # 수집 실행
    result = collect_category(args.politician, args.category)

    if result['success']:
        print(f"\n[SUCCESS] Collection complete!")
        print(f"Total items collected: {result['events_collected']}")
        sys.exit(0)
    else:
        print(f"\n[FAILED] Collection failed: {result['error']}")
        sys.exit(1)


if __name__ == '__main__':
    main()
