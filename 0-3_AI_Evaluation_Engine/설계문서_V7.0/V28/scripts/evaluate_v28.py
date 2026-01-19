# -*- coding: utf-8 -*-
"""
V28 평가 스크립트 (수집/평가 분리)

핵심 원칙: "수집 세션 ≠ 평가 세션"
- Claude가 수집 → 다른 Claude 세션이 평가
- 같은 AI지만 다른 API 호출(세션)에서 평가
- 수집 시점의 컨텍스트 없이 객관적으로 평가

사용법:
    # Claude 수집 데이터를 Claude(다른 세션)가 평가
    python evaluate_v28.py --politician_id=17270f25 --ai=Claude

    # 전체 AI 평가 실행
    python evaluate_v28.py --politician_id=17270f25 --all
"""

import os
import sys
import json
import re
import argparse
import time
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv
from json_repair import repair_json

# UTF-8 출력 설정 및 버퍼링 비활성화
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', line_buffering=True)

# 환경 변수 로드 (override=True로 .env 우선)
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# V28 테이블명
TABLE_COLLECTED_DATA = "collected_data_v28"

# AI 클라이언트
ai_clients = {}

# AI 설정
AI_CONFIGS = {
    "Claude": {
        "model": "claude-3-5-haiku-20241022",
        "env_key": "ANTHROPIC_API_KEY"
    },
    "ChatGPT": {
        "model": "gpt-4o-mini",
        "env_key": "OPENAI_API_KEY"
    },
    "Grok": {
        "model": "grok-4-fast",  # V28: grok-3-fast → grok-4-fast 통일
        "env_key": "XAI_API_KEY"
    },
    "Gemini": {
        "model": "gemini-2.0-flash",
        "env_key": "GEMINI_API_KEY"
    }
}

# 카테고리 정의
CATEGORIES = [
    ("Expertise", "전문성"),
    ("Leadership", "리더십"),
    ("Vision", "비전"),
    ("Integrity", "청렴성"),
    ("Ethics", "윤리성"),
    ("Accountability", "책임성"),
    ("Transparency", "투명성"),
    ("Communication", "소통능력"),
    ("Responsiveness", "대응성"),
    ("PublicInterest", "공익성")
]

CATEGORY_MAP = {eng: kor for eng, kor in CATEGORIES}


def get_exact_count(table_name, filters=None):
    """
    정확한 개수 조회 (Supabase 기본 limit 1000 문제 방지)

    ⚠️ 중요: Supabase select()는 기본 1000개만 반환
    → count='exact' 옵션 필수!

    사용법:
        count = get_exact_count('collected_data_v28', {
            'politician_id': 'f9e00370',
            'ai_name': 'Claude'
        })
    """
    try:
        query = supabase.table(table_name).select('*', count='exact')
        if filters:
            for key, value in filters.items():
                if value is not None:
                    query = query.eq(key, value)
        response = query.limit(1).execute()  # 데이터는 1개만, count만 사용
        return response.count if response.count else 0
    except Exception as e:
        print(f"  ⚠️ count 조회 실패: {e}")
        return 0


def init_ai_client(ai_name):
    """AI 클라이언트 초기화"""
    global ai_clients

    if ai_name in ai_clients:
        return ai_clients[ai_name]

    config = AI_CONFIGS.get(ai_name)
    if not config:
        raise ValueError(f"알 수 없는 AI: {ai_name}")

    api_key = os.getenv(config['env_key'])
    if not api_key:
        raise ValueError(f"{config['env_key']} 환경변수가 설정되지 않았습니다.")

    if ai_name == "Claude":
        import anthropic
        ai_clients[ai_name] = anthropic.Anthropic(api_key=api_key)
    elif ai_name == "ChatGPT":
        from openai import OpenAI
        ai_clients[ai_name] = OpenAI(api_key=api_key)
    elif ai_name == "Grok":
        from openai import OpenAI
        ai_clients[ai_name] = OpenAI(
            api_key=api_key,
            base_url="https://api.x.ai/v1"
        )
    elif ai_name == "Gemini":
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        ai_clients[ai_name] = genai.GenerativeModel(config['model'])

    return ai_clients[ai_name]


def call_ai_api(ai_name, prompt):
    """AI API 호출"""
    client = init_ai_client(ai_name)
    config = AI_CONFIGS[ai_name]

    if ai_name == "Claude":
        response = client.messages.create(
            model=config['model'],
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text

    elif ai_name in ["ChatGPT", "Grok"]:
        response = client.chat.completions.create(
            model=config['model'],
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4096,
            temperature=0.7
        )
        return response.choices[0].message.content

    elif ai_name == "Gemini":
        response = client.generate_content(prompt)
        return response.text


def extract_json(text):
    """JSON 추출 및 복구"""
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


def get_unevaluated_data(politician_id, collector_ai, category_name):
    """평가 안 된 데이터 조회 (rating이 NULL인 것)"""
    response = supabase.table(TABLE_COLLECTED_DATA).select('*').eq(
        'politician_id', politician_id
    ).eq('ai_name', collector_ai).eq(
        'category_name', category_name
    ).is_('rating', 'null').execute()

    return response.data


def evaluate_batch(evaluator_ai, items, category_name, politician_id, politician_name):
    """배치 평가 (최대 10개씩)"""
    cat_kor = CATEGORY_MAP.get(category_name, category_name)

    # 정치인 프로필 정보 가져오기
    profile_info = format_politician_profile(politician_id, politician_name)

    # 평가할 데이터 목록 생성
    items_text = ""
    for i, item in enumerate(items, 1):
        items_text += f"""
[항목 {i}]
- ID: {item['collected_data_id']}
- 제목: {item['data_title']}
- 내용: {item['data_content']}
- 출처: {item['data_source']}
- 날짜: {item['data_date']}
"""

    prompt = f"""당신은 정치인 평가 전문가입니다.

{profile_info}

**평가 카테고리**: {cat_kor} ({category_name})

아래 데이터를 **객관적으로 평가**하여 등급을 부여하세요.

**등급 체계** (+4 ~ -4):
| 등급 | 판단 기준 | 점수 |
|------|-----------|------|
| +4 | 탁월함 - 해당 분야 모범 사례 | +8 |
| +3 | 우수함 - 긍정적 평가 | +6 |
| +2 | 양호함 - 기본 충족 | +4 |
| +1 | 보통 - 평균 수준 | +2 |
| -1 | 미흡함 - 개선 필요 | -2 |
| -2 | 부족함 - 문제 있음 | -4 |
| -3 | 매우 부족 - 심각한 문제 | -6 |
| -4 | 극히 부족 - 정치인 부적합 | -8 |

**평가 기준**:
- 긍정적 내용 (성과, 업적, 칭찬) → +4, +3, +2
- 경미한 긍정 (보통, 평범) → +1
- 부정적 내용 (논란, 비판, 문제) → -1, -2, -3, -4 (심각도에 따라)

**평가할 데이터**:
{items_text}

**반드시 모든 항목에 대해 평가하세요.**

다음 JSON 형식으로 반환:
```json
{{
  "evaluations": [
    {{
      "id": "collected_data_id 값",
      "rating": "+4, +3, +2, +1, -1, -2, -3, -4 중 하나",
      "rationale": "평가 근거 (1문장)"
    }}
  ]
}}
```
"""

    max_retries = 3
    for attempt in range(max_retries):
        try:
            time.sleep(1)
            content = call_ai_api(evaluator_ai, prompt)

            json_str = extract_json(content)
            if not json_str:
                raise json.JSONDecodeError("Empty response", "", 0)

            data = json.loads(json_str)
            evaluations = data.get('evaluations', [])

            # 유효성 검증 (V28: +4 ~ -4 숫자 문자열)
            valid_evals = []
            valid_ratings = ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']
            for ev in evaluations:
                rating = str(ev.get('rating', '')).strip()
                # '+' 기호 없이 숫자만 온 경우 처리
                if rating in ['4', '3', '2', '1']:
                    rating = '+' + rating
                if rating in valid_ratings:
                    ev['rating'] = rating
                    valid_evals.append(ev)

            return valid_evals

        except json.JSONDecodeError as e:
            if attempt < max_retries - 1:
                time.sleep(3)
            continue
        except Exception as e:
            error_str = str(e)
            if "rate" in error_str.lower() or "429" in error_str:
                print(f"      ⚠️ Rate limit, 60초 대기...")
                time.sleep(60)
                continue
            if attempt < max_retries - 1:
                time.sleep(5)
            continue

    return []


def update_rating(collected_data_id, rating, rationale, evaluator_ai):
    """rating 업데이트 (기존 컬럼만 사용)"""
    try:
        supabase.table(TABLE_COLLECTED_DATA).update({
            'rating': rating,
            'rating_rationale': rationale
        }).eq('collected_data_id', collected_data_id).execute()
        return True
    except Exception as e:
        print(f"      ⚠️ 업데이트 실패: {e}")
        return False


def evaluate_category(politician_id, politician_name, collector_ai, evaluator_ai, category_name):
    """카테고리별 평가"""
    cat_kor = CATEGORY_MAP.get(category_name, category_name)

    # 평가 안 된 데이터 조회
    items = get_unevaluated_data(politician_id, collector_ai, category_name)

    if not items:
        print(f"    {cat_kor}: 평가할 데이터 없음 (이미 완료)")
        return 0

    print(f"    {cat_kor}: {len(items)}개 평가 중...", end=" ")

    evaluated_count = 0
    batch_size = 10

    for i in range(0, len(items), batch_size):
        batch = items[i:i+batch_size]
        evaluations = evaluate_batch(evaluator_ai, batch, category_name, politician_id, politician_name)

        for ev in evaluations:
            item_id = ev.get('id')
            rating = ev.get('rating')
            rationale = ev.get('rationale', '')

            if item_id and rating:
                if update_rating(item_id, rating, rationale, evaluator_ai):
                    evaluated_count += 1

    print(f"→ {evaluated_count}개 완료")
    return evaluated_count


def get_politician_name(politician_id):
    """정치인 이름 조회"""
    try:
        result = supabase.table('politicians').select('name').eq('id', politician_id).execute()
        if result.data:
            return result.data[0].get('name', '')
    except:
        pass
    return ''


def get_politician_profile(politician_id):
    """정치인 상세 정보 조회"""
    try:
        result = supabase.table('politicians').select('*').eq('id', politician_id).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]
    except:
        pass
    return None


def get_politician_instructions(politician_name):
    """정치인별 특별 지시사항 파일 읽기 (평가용)"""
    # 스크립트 위치 기준으로 경로 계산
    script_dir = os.path.dirname(os.path.abspath(__file__))
    instructions_path = os.path.join(
        script_dir, '..', 'instructions_v28', '1_politicians', f'{politician_name}.md'
    )

    try:
        if os.path.exists(instructions_path):
            with open(instructions_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # 평가 관련 섹션만 추출
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
    """정치인 프로필을 프롬프트용 텍스트로 포맷 (특별 지시사항 포함)"""
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

    # 특별 지시사항 추가 (평가용)
    if instructions:
        base_text += f"""

---
📋 **{politician_name} 평가 시 참고사항**:

{instructions}
---"""

    return base_text


def run_evaluation(politician_id, ai_name):
    """평가 실행 (같은 AI의 다른 세션이 평가)"""
    politician_name = get_politician_name(politician_id)

    print("=" * 60)
    print(f"V28 평가 (수집/평가 세션 분리)")
    print("=" * 60)
    print(f"정치인: {politician_name} ({politician_id})")
    print(f"AI: {ai_name} (수집 세션 → 평가 세션)")
    print("=" * 60)

    total_evaluated = 0

    for cat_eng, cat_kor in CATEGORIES:
        # 같은 AI가 수집한 것을 같은 AI(다른 세션)가 평가
        count = evaluate_category(
            politician_id, politician_name,
            ai_name, ai_name, cat_eng  # collector = evaluator (다른 세션)
        )
        total_evaluated += count

    print("=" * 60)
    print(f"평가 완료: {total_evaluated}개")
    print("=" * 60)


def run_all_evaluation(politician_id):
    """전체 AI 평가 실행"""
    politician_name = get_politician_name(politician_id)

    print("=" * 60)
    print(f"V28 전체 AI 평가")
    print("=" * 60)
    print(f"정치인: {politician_name} ({politician_id})")
    print("=" * 60)

    ai_list = ["Claude", "ChatGPT", "Grok", "Gemini"]

    for ai_name in ai_list:
        print(f"\n[{ai_name}] 수집 데이터 → {ai_name} 평가 (다른 세션)")

        total_evaluated = 0
        for cat_eng, cat_kor in CATEGORIES:
            count = evaluate_category(
                politician_id, politician_name,
                ai_name, ai_name, cat_eng
            )
            total_evaluated += count

        if total_evaluated > 0:
            print(f"  → 총 {total_evaluated}개 평가 완료")
        else:
            print(f"  → 평가할 데이터 없음")

    print("\n" + "=" * 60)
    print("전체 평가 완료!")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description='V28 평가 스크립트')
    parser.add_argument('--politician_id', type=str, required=True, help='정치인 ID')
    parser.add_argument('--ai', type=str, help='평가할 AI (Claude, ChatGPT, Grok, Gemini)')
    parser.add_argument('--all', action='store_true', help='전체 AI 평가')

    args = parser.parse_args()

    if args.all:
        run_all_evaluation(args.politician_id)
    elif args.ai:
        run_evaluation(args.politician_id, args.ai)
    else:
        print("사용법:")
        print("  단일 AI: python evaluate_v28.py --politician_id=ID --ai=Claude")
        print("  전체 AI: python evaluate_v28.py --politician_id=ID --all")


if __name__ == "__main__":
    main()
