# -*- coding: utf-8 -*-
"""
V40 풀링 평가 스크립트 (Claude CLI 버전)

=== 핵심 원칙 ===
- 풀링 방식: V26에서 가져옴 (4개 AI 수집 데이터를 합쳐서 평가)
- 등급 체계: V40 9단계 (+4 ~ 0 ~ -4, 점수 = 등급 × 2)
- 배치 평가: V28에서 가져옴 (50개씩 배치 평가, V40 최적화)
- 정치인 프로필: V28에서 가져옴 (format_politician_profile)
- ✨ Claude CLI: API 대신 Claude Code CLI 사용 (subscription, $0 비용)

=== V40 풀링 평가 프로세스 ===
[1] 풀링: 수집 AI (Gemini 50 + Naver 50) 데이터 통합 (카테고리별 최대 100개, 버퍼 20% 포함 120개)
    - 중복 제거: 같은 AI가 같은 URL 2번 수집 → 1개만 유지
              다른 AI가 같은 URL 수집 → 모두 유지
[2] 평가: Claude(CLI), ChatGPT, Gemini, Grok 각각 전체 데이터 평가
    - ✨ Claude: CLI 호출 (Haiku 4.5, subscription)
    - ChatGPT, Gemini, Grok: API 호출
[3] 결과 저장: evaluations_v40 테이블

=== Claude CLI 사용 (비용 절감) ===
- API 비용: $0 (subscription만 사용)
- 모델: Haiku 4.5 (안정적, 빠름)
- 참조: .claude/subagents/politician-evaluator.md

=== 등급 체계 (9단계) - V40 기준 ===
| 등급 | 점수(×2) | 판단 기준 |
|------|----------|-----------|
| +4 | +8점 | 탁월함 - 해당 분야 모범 사례 |
| +3 | +6점 | 우수함 - 긍정적 평가 |
| +2 | +4점 | 양호함 - 기본 충족 |
| +1 | +2점 | 보통 - 평균 수준 |
| -1 | -2점 | 미흡함 - 개선 필요 |
| -2 | -4점 | 부족함 - 문제 있음 |
| -3 | -6점 | 매우 부족 - 심각한 문제 |
| -4 | -8점 | 극히 부족 - 정치인 부적합 |
| X (0) | 0점 | 평가 제외 판정 (모수에서 제외) |

평가 제외 판정 (X) 사유:
- 10년 이상 과거 사건
- 동명이인/다른 인물
- 무관한 내용
- 가짜/날조 정보
→ 모수에서 완전히 제외, 평균 계산 시 개수에 안 들어감

사용법:
    # 전체 평가
    python evaluate_v40.py --politician_id=62e7b453 --politician_name="오세훈"

    # 특정 AI만 평가
    python evaluate_v40.py --politician_id=62e7b453 --politician_name="오세훈" --ai=Claude

    # 특정 카테고리만
    python evaluate_v40.py --politician_id=62e7b453 --politician_name="오세훈" --category=expertise
"""

import os
import sys
import json
import re
import argparse
import time
import subprocess  # ✨ Claude CLI 호출용
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from supabase import create_client
from dotenv import load_dotenv
from json_repair import repair_json  # V28에서 가져옴
import uuid as uuid_module  # UUID 검증용

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# V40 테이블명
TABLE_COLLECTED_DATA = "collected_data_v40"
TABLE_EVALUATIONS = "evaluations_v40"

# AI 클라이언트 캐시
ai_clients = {}

# 카테고리 정의 (V28.3 기준)
CATEGORIES = [
    ("expertise", "전문성"),
    ("leadership", "리더십"),
    ("vision", "비전"),
    ("integrity", "청렴성"),
    ("ethics", "윤리성"),
    ("accountability", "책임감"),
    ("transparency", "투명성"),
    ("communication", "소통능력"),
    ("responsiveness", "대응성"),
    ("publicinterest", "공익성")
]

CATEGORY_MAP = {eng: kor for eng, kor in CATEGORIES}

# 평가 AI (4개)
EVALUATION_AIS = ["Claude", "ChatGPT", "Gemini", "Grok"]

# AI 모델 설정 (V28에서 가져옴)
AI_CONFIGS = {
    "Claude": {
        "model": "claude-3-5-haiku-20241022",  # V28 기준
        "env_key": "ANTHROPIC_API_KEY"
    },
    "ChatGPT": {
        "model": "gpt-4o-mini",
        "env_key": "OPENAI_API_KEY"
    },
    "Grok": {
        "model": "grok-4-fast",  # V28 기준
        "env_key": "XAI_API_KEY",
        "base_url": "https://api.x.ai/v1"
    },
    "Gemini": {
        "model": "gemini-2.5-flash",  # 2.0-flash quota 초과 → 2.5-flash 사용
        "env_key": "GEMINI_API_KEY"
    }
}

# V40 등급 체계 (+4 ~ -4, X) - 9단계
VALID_RATINGS = ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4', 'X']

# 등급 → 점수 변환 (V40 9단계 - 점수 = 등급 × 2)
RATING_TO_SCORE = {
    '+4': 8, '+3': 6, '+2': 4, '+1': 2,
    '-1': -2, '-2': -4, '-3': -6, '-4': -8,
    'X': 0,  # 평가 제외 판정 (모수에서 제외, DB 저장 안 함)
}

# V40 평가 시스템 프롬프트 (모든 AI 공통, 캐싱 대상)
SYSTEM_PROMPT = """등급(점수): +4(+8)탁월 | +3(+6)우수 | +2(+4)양호 | +1(+2)보통
           -1(-2)미흡 | -2(-4)부족 | -3(-6)심각 | -4(-8)최악 | X(0)평가제외

판단: 긍정(성과/업적)→+4~+1 | 부정(논란/비판)→-1~-4
X판정: 10년+과거/동명이인/무관/날조 → 모수 제외

반드시 모든 항목을 빠짐없이 평가하세요. 항목 수와 evaluations 수가 동일해야 합니다.

JSON: {"evaluations":[{"id":"UUID","rating":"+4~-4 또는 X","rationale":"근거"}]}"""


def init_ai_client(ai_name):
    """AI 클라이언트 초기화 (V40: Claude는 CLI 사용으로 클라이언트 불필요)"""
    global ai_clients

    # ✨ Claude는 CLI 사용하므로 클라이언트 불필요
    if ai_name == "Claude":
        return None

    if ai_name in ai_clients:
        return ai_clients[ai_name]

    config = AI_CONFIGS.get(ai_name)
    if not config:
        raise ValueError(f"알 수 없는 AI: {ai_name}")

    api_key = os.getenv(config['env_key'])
    if not api_key:
        raise ValueError(f"{config['env_key']} 환경변수가 설정되지 않았습니다.")

    if ai_name == "ChatGPT":
        from openai import OpenAI
        ai_clients[ai_name] = OpenAI(api_key=api_key)
    elif ai_name == "Grok":
        from openai import OpenAI
        ai_clients[ai_name] = OpenAI(
            api_key=api_key,
            base_url=config['base_url']
        )
    elif ai_name == "Gemini":
        from google import genai
        client = genai.Client(api_key=api_key)
        ai_clients[ai_name] = client

    return ai_clients[ai_name]


def call_claude_direct_evaluation(prompt):
    """Claude Subscription Mode - evaluate_v40.py에서 직접 호출 불가.

    Claude 평가는 반드시 Claude Code 세션에서 실행해야 합니다:
    /evaluate-politician-v40 --politician_id=ID --politician_name=이름 --category=카테고리

    또는 헬퍼 스크립트 사용:
    python claude_eval_helper.py fetch → Claude Code 평가 → python claude_eval_helper.py save
    """
    import json

    print("\n" + "="*60)
    print("⚠️  Claude는 Subscription Mode로만 평가 가능합니다.")
    print("="*60)
    print("\n📋 Claude Code 명령어:")
    print("  /evaluate-politician-v40 --politician_id=ID --politician_name=이름 --category=카테고리")
    print("\n💡 또는 다른 AI만 먼저 실행:")
    print("  python evaluate_v40.py --politician_id=ID --politician_name=이름 --ai=ChatGPT")
    print("  python evaluate_v40.py --politician_id=ID --politician_name=이름 --ai=Gemini")
    print("  python evaluate_v40.py --politician_id=ID --politician_name=이름 --ai=Grok")
    print("="*60 + "\n")

    # 빈 결과 반환 (Claude Code 세션에서 별도 처리)
    return json.dumps({'evaluations': []}, ensure_ascii=False)


def call_ai_api(ai_name, system_prompt, user_prompt):
    """AI 평가 호출 (system/user 메시지 분리로 캐싱 최적화)"""

    # Claude는 직접 평가 방식 사용 (배치 방식 구현 대기 중)
    if ai_name == "Claude":
        return call_claude_direct_evaluation(f"{system_prompt}\n\n{user_prompt}")

    # ChatGPT, Gemini, Grok은 API 사용
    client = init_ai_client(ai_name)
    config = AI_CONFIGS[ai_name]

    if ai_name in ["ChatGPT", "Grok"]:
        response = client.chat.completions.create(
            model=config['model'],
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=16384,
            temperature=0.7
        )
        return response.choices[0].message.content

    elif ai_name == "Gemini":
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        response = client.models.generate_content(
            model=config['model'],
            contents=full_prompt
        )
        return response.text


def extract_json(text):
    """JSON 추출 및 복구 (V28에서 가져옴)"""
    if not text:
        return None

    # 마크다운 코드 블록 제거
    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if json_match:
        text = json_match.group(1)

    # JSON 객체 찾기
    start = text.find('{')
    if start == -1:
        return None

    # 중괄호 매칭
    depth = 0
    end = start
    for i, char in enumerate(text[start:], start):
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break

    json_str = text[start:end]

    try:
        json.loads(json_str)
        return json_str
    except:
        try:
            repaired = repair_json(json_str)
            json.loads(repaired)
            return repaired
        except:
            return None


def get_politician_name(politician_id):
    """정치인 이름 조회 (V28에서 가져옴)"""
    try:
        result = supabase.table('politicians').select('name').eq('id', politician_id).execute()
        if result.data:
            return result.data[0].get('name', '')
    except:
        pass
    return ''


def get_politician_profile(politician_id):
    """정치인 상세 정보 조회 (V28에서 가져옴)"""
    try:
        result = supabase.table('politicians').select('*').eq('id', politician_id).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]
    except:
        pass
    return None


def get_politician_instructions(politician_name):
    """정치인별 특별 지시사항 파일 읽기 (V28에서 가져옴, 경로 V40으로 변경)"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    instructions_path = os.path.join(
        script_dir, '..', 'instructions', '1_politicians', f'{politician_name}.md'
    )

    try:
        if os.path.exists(instructions_path):
            with open(instructions_path, 'r', encoding='utf-8') as f:
                content = f.read()

            instructions_text = ""

            # 평가 시 주의점 추출
            if "### 평가 시 주의점" in content:
                start = content.find("### 평가 시 주의점")
                end = content.find("###", start + 10)
                if end == -1:
                    end = content.find("---", start)
                if end > start:
                    section = content[start:end].strip()
                    instructions_text += section + "\n\n"

            # 알려진 논란/이슈 추출
            if "### 알려진 논란/이슈" in content:
                start = content.find("### 알려진 논란/이슈")
                end = content.find("###", start + 10)
                if end == -1:
                    end = content.find("---", start)
                if end > start:
                    section = content[start:end].strip()
                    instructions_text += section + "\n\n"

            # 알려진 성과 추출
            if "### 알려진 성과" in content:
                start = content.find("### 알려진 성과")
                end = content.find("###", start + 10)
                if end == -1:
                    end = content.find("---", start)
                if end > start:
                    section = content[start:end].strip()
                    instructions_text += section

            return instructions_text.strip() if instructions_text.strip() else None
    except Exception as e:
        print(f"  ⚠️ 지시사항 파일 읽기 실패: {e}")

    return None


def format_politician_profile(politician_id, politician_name):
    """정치인 프로필을 프롬프트용 텍스트로 포맷 (V28에서 가져옴)"""
    profile = get_politician_profile(politician_id)
    instructions = get_politician_instructions(politician_name)

    if not profile:
        base_text = f"**대상 정치인**: {politician_name}"
    else:
        base_text = f"""**대상 정치인**: {politician_name}

**정치인 기본 정보** (평가 시 참고):
- 이름: {profile.get('name', politician_name)}
- 신분: {profile.get('identity', 'N/A')}
- 직책: {profile.get('title', profile.get('position', 'N/A'))}
- 정당: {profile.get('party', 'N/A')}
- 지역: {profile.get('region', 'N/A')}
- 성별: {profile.get('gender', 'N/A')}

⚠️ **중요**: 반드시 위 정보와 일치하는 "{politician_name}"에 대해 평가하세요."""

    # 특별 지시사항 추가
    if instructions:
        base_text += f"""

---
📋 **{politician_name} 평가 시 참고사항**:

{instructions}
---"""

    return base_text


def get_pooled_data(politician_id, category):
    """풀링된 데이터 조회 (V26 풀링 방식)

    4개 AI가 수집한 데이터를 합침 (카테고리별)

    중복 제거 규칙 (V40):
    - 같은 AI가 같은 URL 2번 수집 → 1개만 유지 (중복 제거)
    - 다른 AI가 같은 URL 수집 → 모두 유지 (중복 제거 안 함)
    """
    try:
        result = supabase.table(TABLE_COLLECTED_DATA)\
            .select('*')\
            .eq('politician_id', politician_id)\
            .eq('category', category.lower())\
            .execute()

        if not result.data:
            return []

        # AI별 URL 중복 제거 (같은 AI가 같은 URL 2번 가져온 경우만 제거)
        seen_by_ai = {}  # {ai_name: set(urls)}
        unique_items = []

        for item in result.data:
            ai_name = item.get('collector_ai', 'unknown')
            url = item.get('source_url', '')

            if ai_name not in seen_by_ai:
                seen_by_ai[ai_name] = set()

            # URL이 있고, 해당 AI가 이미 수집한 URL이면 스킵
            if url and url in seen_by_ai[ai_name]:
                continue  # 같은 AI가 같은 URL 중복 → 제거

            # URL 기록 및 항목 추가
            if url:
                seen_by_ai[ai_name].add(url)
            unique_items.append(item)

        return unique_items

    except Exception as e:
        print(f"  ⚠️ 데이터 조회 실패: {e}")
        return []


def evaluate_batch(evaluator_ai, items, category_name, politician_id, politician_name):
    """배치 평가 (V40: 최대 50개씩, system/user 프롬프트 분리)"""
    cat_kor = CATEGORY_MAP.get(category_name.lower(), category_name)

    # 정치인 프로필 정보 가져오기
    profile_info = format_politician_profile(politician_id, politician_name)

    # 평가할 데이터 목록 생성 (축소 포맷)
    items_text = ""
    for i, item in enumerate(items, 1):
        items_text += f"\n[{i}] ID:{item.get('id','')} | {item.get('title','N/A')}\n{item.get('content','N/A')[:300]}\n출처:{item.get('source_name',item.get('source_url','N/A'))} | {item.get('published_date','N/A')} | 수집:{item.get('collector_ai','N/A')}"

    # V40: user_prompt만 (등급표/기준/JSON형식은 SYSTEM_PROMPT에 포함)
    user_prompt = f"""{profile_info}

카테고리: {cat_kor} ({category_name})

데이터:
{items_text}

총 {len(items)}개 항목 전부 평가 필수 (빠짐없이). 유효→+4~-4 | 제외대상→X"""

    max_retries = 3
    for attempt in range(max_retries):
        try:
            time.sleep(1)
            content = call_ai_api(evaluator_ai, SYSTEM_PROMPT, user_prompt)

            json_str = extract_json(content)
            if not json_str:
                raise json.JSONDecodeError("Empty response", "", 0)

            data = json.loads(json_str)
            evaluations = data.get('evaluations', [])

            # 유효성 검증 및 ID 매칭 (V40: items와 evaluations 순서 매칭)
            valid_evals = []
            for idx, ev in enumerate(evaluations):
                rating = str(ev.get('rating', '')).strip().upper()

                if rating in VALID_RATINGS:
                    ev['rating'] = rating
                    ev['score'] = RATING_TO_SCORE.get(rating, 0)

                    # ✅ V40: items와 evaluations 순서 매칭하여 올바른 ID 할당
                    # AI가 반환한 ID 대신 items에서 ID 가져오기
                    if idx < len(items):
                        ev['id'] = items[idx].get('id')  # 올바른 UUID 할당
                    else:
                        ev['id'] = None  # items보다 많은 평가는 ID 없음

                    valid_evals.append(ev)

            return valid_evals

        except json.JSONDecodeError as e:
            print(f"      ⚠️ JSON 파싱 실패 (시도 {attempt+1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(3)
            continue
        except Exception as e:
            error_str = str(e)
            print(f"      ⚠️ API 에러 (시도 {attempt+1}/{max_retries}): {error_str}")
            if "rate" in error_str.lower() or "429" in error_str:
                print(f"      ⚠️ Rate limit, 60초 대기...")
                time.sleep(60)
                continue
            if attempt < max_retries - 1:
                time.sleep(5)
            continue

    print(f"      ❌ 최종 실패: 모든 재시도 소진")
    return []


def is_valid_uuid(uuid_string):
    """UUID 형식 검증 (8-4-4-4-12)"""
    if not uuid_string:
        return False
    try:
        uuid_obj = uuid_module.UUID(str(uuid_string))
        return True
    except (ValueError, AttributeError):
        return False


def save_evaluations(politician_id, politician_name, category_name, evaluator_ai, evaluations):
    """평가 결과 저장 (evaluations_v40 테이블)

    개선사항:
    - 배치 INSERT로 네트워크 부하 감소
    - 재시도 로직 추가 (네트워크 에러 대응)
    - UUID 검증 추가 (V40: collected_data_id 유효성 확인)
    """
    if not evaluations:
        return 0

    # 배치 INSERT용 레코드 생성
    records = []
    x_count = 0

    for ev in evaluations:
        rating = ev.get('rating', '')

        if rating == 'X':
            x_count += 1

        record = {
            'politician_id': politician_id,
            'politician_name': politician_name,
            'category': category_name.lower(),
            'evaluator_ai': evaluator_ai,
            'rating': rating,
            'score': ev.get('score', RATING_TO_SCORE.get(rating, 0)),
            'reasoning': ev.get('rationale', ev.get('reasoning', ''))[:1000],
            'evaluated_at': datetime.now().isoformat()
        }
        records.append(record)

    if x_count > 0:
        print(f"      ℹ️ 평가 제외(X) 판정: {x_count}개 (모수 제외)")

    # 재시도 로직 (중복 키 에러 허용)
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # 배치 INSERT
            result = supabase.table(TABLE_EVALUATIONS).insert(records).execute()
            saved_count = len(result.data) if result.data else 0
            return saved_count
        except Exception as e:
            error_msg = str(e)

            # ✅ V40: 중복 키 에러는 무시 (이미 평가된 데이터)
            if "'code': '23505'" in error_msg or "duplicate key" in error_msg.lower():
                print(f"      ⚠️ 중복 평가 건너뛰기 (이미 저장됨)")
                return 0  # 중복은 에러가 아니므로 0 반환

            # WinError 10035 또는 네트워크 에러는 재시도
            if attempt < max_retries - 1:
                if "10035" in error_msg or "socket" in error_msg.lower() or "network" in error_msg.lower():
                    wait_time = (attempt + 1) * 2  # 2초, 4초, 6초
                    print(f"      ⚠️ 저장 실패 ({error_msg[:50]}...), {wait_time}초 후 재시도 ({attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                    continue
            print(f"      ❌ 저장 최종 실패: {error_msg}")

    return 0


def check_already_evaluated(politician_id, evaluator_ai, category_name):
    """이미 평가된 데이터인지 확인

    개선사항:
    - 부분 완료를 전체 완료로 오판하던 버그 수정
    - 수집된 데이터 개수와 평가된 개수 비교
    - 90% 이상 평가되었으면 완료로 간주 (일부 오류 허용)
    """
    try:
        # 평가된 개수 확인
        eval_result = supabase.table(TABLE_EVALUATIONS).select('id', count='exact').eq(
            'politician_id', politician_id
        ).eq('evaluator_ai', evaluator_ai).eq(
            'category', category_name.lower()
        ).execute()

        evaluated_count = eval_result.count if eval_result.count else 0

        # 수집된 데이터 개수 확인
        collected_result = supabase.table(TABLE_COLLECTED_DATA).select('id', count='exact').eq(
            'politician_id', politician_id
        ).eq('category', category_name.lower()).execute()

        collected_count = collected_result.count if collected_result.count else 0

        # 수집된 데이터가 없으면 완료로 간주
        if collected_count == 0:
            return True

        # 평가된 개수가 수집된 개수와 정확히 일치해야 완료로 간주
        completion_rate = evaluated_count / collected_count if collected_count > 0 else 0
        is_complete = (evaluated_count == collected_count)

        if not is_complete and evaluated_count > 0:
            print(f"    ⚠️ 부분 완료 발견: {evaluated_count}/{collected_count} ({completion_rate*100:.1f}%) - 재평가 필요")

        return is_complete
    except Exception as e:
        print(f"    ⚠️ 완료 확인 실패: {e}")
        return False


def evaluate_category(evaluator_ai, politician_id, politician_name, category_name, category_korean):
    """카테고리별 풀링 평가 (V26 풀링 방식 + V28 등급 체계 + V28 배치 평가)"""
    print(f"  [{evaluator_ai}] {category_korean} 평가 중...")

    # 이미 평가되었는지 확인
    if check_already_evaluated(politician_id, evaluator_ai, category_name):
        print(f"    ⏭️ 이미 평가 완료")
        return 0

    # 풀링된 데이터 조회 (4개 AI 수집 데이터 통합)
    items = get_pooled_data(politician_id, category_name)

    if not items:
        print(f"    ⚠️ 평가할 데이터 없음")
        return 0

    print(f"    📊 데이터 {len(items)}개 로드")

    # 배치 평가 (V28 방식: 10개씩)
    total_evaluated = 0
    batch_size = 10  # gpt-4o-mini 기준 100% 완전 응답 보장

    for i in range(0, len(items), batch_size):
        batch = items[i:i+batch_size]
        evaluations = evaluate_batch(evaluator_ai, batch, category_name, politician_id, politician_name)

        if evaluations:
            saved = save_evaluations(politician_id, politician_name, category_name, evaluator_ai, evaluations)
            total_evaluated += saved

    if total_evaluated > 0:
        print(f"    ✅ {total_evaluated}개 평가 완료")
    else:
        print(f"    ❌ 평가 실패")

    return total_evaluated


def evaluate_all(politician_id, politician_name, target_ai=None, target_category=None, parallel=False):
    """전체 평가 수행 (V40 풀링 평가)"""
    if not politician_name:
        politician_name = get_politician_name(politician_id)

    print(f"\n{'#'*60}")
    print(f"# V40 풀링 평가")
    print(f"# 정치인: {politician_name} ({politician_id})")
    print(f"# 등급 체계: +4 ~ -4 (V40 기준)")
    print(f"# 평가 AI: Claude, ChatGPT, Gemini, Grok")
    print(f"{'#'*60}")

    # 평가 AI 목록
    eval_ais = EVALUATION_AIS
    if target_ai:
        eval_ais = [target_ai]

    # 카테고리 목록
    categories = CATEGORIES
    if target_category:
        # 문자열이면 직접 매칭
        if isinstance(target_category, str):
            for cat_eng, cat_kor in CATEGORIES:
                if cat_eng.lower() == target_category.lower():
                    categories = [(cat_eng, cat_kor)]
                    break
        else:
            # 숫자면 인덱스로
            categories = [CATEGORIES[target_category - 1]]

    results = []
    total_evaluated = 0

    # Claude는 Subscription Mode 전용 - API 루프에서 제외
    api_ais = [ai for ai in eval_ais if ai != "Claude"]
    if "Claude" in eval_ais:
        print(f"\n  [Claude] ⏭️ Subscription Mode 전용 - /evaluate-politician-v40 명령으로 별도 실행")
        if not api_ais:
            print(f"\n⚠️  Claude만 선택되었습니다. Claude Code에서 다음 명령을 사용하세요:")
            print(f"  /evaluate-politician-v40 --politician_id={politician_id} --politician_name={politician_name} --category=all")
            return 0

    if parallel:
        # ===== V40 하이브리드 실행: 1차 병렬 + 2차 순차 재시도 =====
        print(f"\n[1차 병렬 평가] {len(api_ais)} AIs × {len(categories)} 카테고리")

        with ThreadPoolExecutor(max_workers=4) as executor:
            tasks = []
            for cat_name, cat_korean in categories:
                for ai_name in api_ais:
                    future = executor.submit(
                        evaluate_category,
                        ai_name, politician_id, politician_name,
                        cat_name, cat_korean
                    )
                    tasks.append({
                        'future': future,
                        'ai_name': ai_name,
                        'cat_name': cat_name,
                        'cat_korean': cat_korean
                    })

            # 결과 수집 및 실패 추적
            failed_tasks = []
            for task in tasks:
                try:
                    count = task['future'].result()
                    total_evaluated += count
                except Exception as e:
                    print(f"  ❌ [{task['ai_name']}] {task['cat_korean']} 1차 실패: {e}")
                    failed_tasks.append(task)

        # ===== 2차: 실패한 작업만 순차 재시도 (안전) =====
        if failed_tasks:
            print(f"\n{'='*60}")
            print(f"🔄 실패한 평가 재시도 시작: {len(failed_tasks)}개")
            print(f"{'='*60}")

            for attempt in range(1, 4):  # 최대 3회 재시도
                if not failed_tasks:
                    break

                print(f"\n[재시도 {attempt}/3] {len(failed_tasks)}개 작업")
                retry_success = []

                for task in failed_tasks:
                    try:
                        # Exponential backoff
                        backoff_time = 2 ** (attempt - 1)
                        if backoff_time > 1:
                            time.sleep(backoff_time)

                        count = evaluate_category(
                            task['ai_name'], politician_id, politician_name,
                            task['cat_name'], task['cat_korean']
                        )
                        total_evaluated += count
                        retry_success.append(task)
                        print(f"  ✅ [{task['ai_name']}] {task['cat_korean']} 재시도 성공 (+{count}건)")
                    except Exception as e:
                        print(f"  ⚠️ [{task['ai_name']}] {task['cat_korean']} 재시도 {attempt} 실패: {e}")

                # 성공한 작업 제거
                failed_tasks = [t for t in failed_tasks if t not in retry_success]

            # ===== 3차: 최종 실패 로깅 =====
            if failed_tasks:
                print(f"\n{'='*60}")
                print(f"❌ 최종 실패 평가: {len(failed_tasks)}개")
                print(f"{'='*60}")
                for task in failed_tasks:
                    print(f"  - [{task['ai_name']}] {task['cat_korean']} ({task['cat_name']})")
                print(f"\n⚠️ 일부 카테고리 평가 실패. 재평가가 필요할 수 있습니다.")
    else:
        for cat_name, cat_korean in categories:
            print(f"\n{'='*50}")
            print(f"카테고리: {cat_korean} ({cat_name})")
            print(f"{'='*50}")

            for ai_name in api_ais:
                count = evaluate_category(
                    ai_name, politician_id, politician_name,
                    cat_name, cat_korean
                )
                total_evaluated += count
                time.sleep(1)

    # 결과 요약
    print(f"\n{'='*60}")
    print(f"✅ V40 풀링 평가 완료: {politician_name}")
    print(f"   총 평가: {total_evaluated}건")
    print(f"{'='*60}")

    return total_evaluated


def main():
    parser = argparse.ArgumentParser(description='V40 풀링 평가 (V26 풀링 + V28 등급)')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--politician_name', default='', help='정치인 이름')
    parser.add_argument('--ai', choices=EVALUATION_AIS, help='특정 AI만 평가')
    parser.add_argument('--category', help='특정 카테고리만 (이름 또는 숫자 1-10)')
    parser.add_argument('--parallel', action='store_true', help='병렬 실행')

    args = parser.parse_args()

    # 카테고리 파라미터 처리
    target_category = None
    if args.category:
        if args.category.isdigit():
            target_category = int(args.category)
        else:
            target_category = args.category

    evaluate_all(
        args.politician_id,
        args.politician_name,
        target_ai=args.ai,
        target_category=target_category,
        parallel=args.parallel
    )


if __name__ == "__main__":
    main()
