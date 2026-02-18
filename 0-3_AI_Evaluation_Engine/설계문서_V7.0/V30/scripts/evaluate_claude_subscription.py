# -*- coding: utf-8 -*-
"""
V30 Claude 평가 스크립트 (Subscription Mode)

✨ 핵심 특징:
- API 비용 $0 (Claude Code subscription 사용)
- subprocess 없음, claude.cmd 호출 없음
- Native Python evaluation logic
- Supabase 직접 연동

사용법:
    python evaluate_claude_subscription.py --politician_id=f9e00370 --politician_name=김민석 --category=responsiveness
"""

import os
import sys
import json
import argparse
import time
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

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

# 카테고리 정의
CATEGORY_MAP = {
    "expertise": "전문성",
    "leadership": "리더십",
    "vision": "비전",
    "integrity": "청렴성",
    "ethics": "윤리성",
    "accountability": "책임감",
    "transparency": "투명성",
    "communication": "소통능력",
    "responsiveness": "대응성",
    "publicinterest": "공익성"
}

# 등급 → 점수 변환
RATING_TO_SCORE = {
    '+4': 8, '+3': 6, '+2': 4, '+1': 2,
    '-1': -2, '-2': -4, '-3': -6, '-4': -8
}

VALID_RATINGS = ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']


def get_politician_profile(politician_id, politician_name):
    """정치인 프로필 조회"""
    try:
        result = supabase.table('politicians').select('*').eq('id', politician_id).execute()
        profile = result.data[0] if result.data else {}

        profile_text = f"""**대상 정치인**: {politician_name}

**정치인 기본 정보**:
- 이름: {profile.get('name', politician_name)}
- 신분: {profile.get('identity', 'N/A')}
- 직책: {profile.get('title', 'N/A')}
- 정당: {profile.get('party', 'N/A')}
- 지역: {profile.get('region', 'N/A')}

⚠️ **중요**: 반드시 위 정보와 일치하는 "{politician_name}"에 대해 평가하세요."""

        return profile_text
    except Exception as e:
        print(f"  ⚠️ 프로필 조회 실패: {e}")
        return f"**대상 정치인**: {politician_name}"


def get_unevaluated_data(politician_id, category):
    """미평가 데이터 조회 (Claude 평가 기준)"""
    try:
        # 1. 이미 평가된 데이터 ID 조회
        evaluated_result = supabase.table('evaluations_v30')\
            .select('collected_data_id')\
            .eq('politician_id', politician_id)\
            .eq('evaluator_ai', 'Claude')\
            .eq('category', category.lower())\
            .execute()

        evaluated_ids = {
            item['collected_data_id']
            for item in evaluated_result.data
            if item.get('collected_data_id')
        }

        print(f"  📊 이미 평가됨: {len(evaluated_ids)}개")

        # 2. 수집된 데이터 조회 (풀링: 4개 AI 수집 데이터 통합)
        collected_result = supabase.table('collected_data_v30')\
            .select('*')\
            .eq('politician_id', politician_id)\
            .eq('category', category.lower())\
            .execute()

        print(f"  📊 수집된 데이터: {len(collected_result.data)}개")

        # 3. 미평가 데이터 필터링
        unevaluated_items = [
            item for item in collected_result.data
            if item['id'] not in evaluated_ids
        ]

        # 4. AI별 URL 중복 제거
        seen_by_ai = {}
        unique_items = []

        for item in unevaluated_items:
            ai_name = item.get('collector_ai', 'unknown')
            url = item.get('source_url', '')

            if ai_name not in seen_by_ai:
                seen_by_ai[ai_name] = set()

            # 같은 AI가 같은 URL 중복 → 제거
            if url and url in seen_by_ai[ai_name]:
                continue

            if url:
                seen_by_ai[ai_name].add(url)
            unique_items.append(item)

        print(f"  📊 미평가 데이터: {len(unique_items)}개 (중복 제거 후)")
        return unique_items

    except Exception as e:
        print(f"  ❌ 데이터 조회 실패: {e}")
        return []


def format_batch_prompt(batch, politician_name, category, profile_text):
    """배치 평가 프롬프트 생성 (다른 AI와 동일한 프롬프트 사용)"""
    cat_kor = CATEGORY_MAP.get(category.lower(), category)

    # 배치 데이터 포맷 (수집 단계에서 이미 30% 요약됨)
    items_text = ""
    for idx, item in enumerate(batch, 1):
        items_text += f"""
[항목 {idx}]
- ID: {item.get('id', '')}
- 제목: {item.get('title', 'N/A')}
- 내용: {item.get('content', 'N/A')}
- 출처: {item.get('source_name', item.get('source_url', 'N/A'))}
- 날짜: {item.get('published_date', 'N/A')}
- 수집AI: {item.get('collector_ai', 'N/A')}
"""

    # ⚠️ 중요: 다른 AI(ChatGPT, Gemini, Grok)와 동일한 프롬프트 사용!
    # 공정성을 위해 프롬프트 내용/길이 동일하게 유지
    prompt = f"""당신은 정치인 평가 전문가입니다.

{profile_text}

**평가 카테고리**: {cat_kor} ({category})

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
      "id": "데이터 ID 값",
      "rating": "+4, +3, +2, +1, -1, -2, -3, -4 중 하나",
      "rationale": "평가 근거 (1문장)"
    }}
  ]
}}
```"""

    return prompt


def save_evaluations_batch(politician_id, politician_name, category, evaluations_data, batch_items):
    """평가 결과 배치 저장"""
    if not evaluations_data:
        return 0

    records = []

    for idx, ev in enumerate(evaluations_data):
        rating = str(ev.get('rating', '')).strip()

        # '+' 기호 없이 숫자만 온 경우 처리
        if rating in ['4', '3', '2', '1']:
            rating = '+' + rating

        if rating not in VALID_RATINGS:
            print(f"    ⚠️ 잘못된 등급 건너뛰기: {rating}")
            continue

        # items와 evaluations 순서 매칭하여 올바른 ID 할당
        if idx < len(batch_items):
            collected_data_id = batch_items[idx]['id']
        else:
            print(f"    ⚠️ 평가 항목이 배치 크기 초과, 건너뛰기")
            continue

        record = {
            'politician_id': politician_id,
            'politician_name': politician_name,
            'category': category.lower(),
            'evaluator_ai': 'Claude',
            'collected_data_id': collected_data_id,
            'rating': rating,
            'score': RATING_TO_SCORE[rating],
            'reasoning': ev.get('rationale', ev.get('reasoning', ''))[:1000],
            'evaluated_at': datetime.now().isoformat()
        }
        records.append(record)

    if not records:
        print(f"    ⚠️ 저장할 유효한 평가 없음")
        return 0

    # 배치 저장
    try:
        result = supabase.table('evaluations_v30').insert(records).execute()
        saved_count = len(result.data) if result.data else 0
        return saved_count
    except Exception as e:
        error_msg = str(e)
        if 'duplicate key' in error_msg.lower() or '23505' in error_msg:
            print(f"    ⚠️ 중복 평가 건너뛰기")
            return 0
        print(f"    ❌ 저장 실패: {e}")
        return 0


def evaluate_interactive(politician_id, politician_name, category, batch_size=50):
    """
    대화형 평가 모드 (Claude Code Subscription)

    ✨ 핵심: subprocess 없음, API 호출 없음!
    - Claude Code 세션 내에서 직접 평가 수행
    - 사용자(Claude Code)가 프롬프트를 보고 평가 생성
    - 생성된 평가를 파싱하여 DB 저장
    """
    print(f"\n{'#'*60}")
    print(f"# V30 Claude 평가 (Subscription Mode)")
    print(f"# 정치인: {politician_name} ({politician_id})")
    print(f"# 카테고리: {CATEGORY_MAP.get(category.lower(), category)} ({category})")
    print(f"# 배치 크기: {batch_size}")
    print(f"{'#'*60}\n")

    # 1. 정치인 프로필 조회
    print("[1/4] 정치인 프로필 조회 중...")
    profile_text = get_politician_profile(politician_id, politician_name)

    # 2. 미평가 데이터 조회
    print("\n[2/4] 미평가 데이터 조회 중...")
    unevaluated_items = get_unevaluated_data(politician_id, category)

    if not unevaluated_items:
        print("\n✅ 모든 데이터 평가 완료!")
        return 0

    # 3. 배치 평가
    print(f"\n[3/4] 배치 평가 시작 (총 {len(unevaluated_items)}개)")
    total_saved = 0

    for i in range(0, len(unevaluated_items), batch_size):
        batch = unevaluated_items[i:i+batch_size]
        batch_num = i // batch_size + 1

        print(f"\n{'='*60}")
        print(f"배치 {batch_num} / {(len(unevaluated_items) + batch_size - 1) // batch_size}")
        print(f"{'='*60}")

        # 프롬프트 생성 및 출력
        prompt = format_batch_prompt(batch, politician_name, category, profile_text)

        print("\n" + "="*60)
        print("📋 평가 프롬프트:")
        print("="*60)
        print(prompt)
        print("="*60)

        print("\n⏸️  위 프롬프트를 읽고 평가를 생성해주세요.")
        print("⚠️  이 평가는 Claude Code subscription mode로 실행되므로 API 비용이 청구되지 않습니다.")
        print("\n다음 형식으로 JSON 응답을 입력하세요:")
        print("""```json
{
  "evaluations": [
    {
      "id": "데이터 ID",
      "rating": "+4 또는 -2 등",
      "rationale": "평가 근거"
    }
  ]
}
```""")

        print("\n평가 JSON 입력 (여러 줄 입력 후 빈 줄로 종료):")

        # 사용자 입력 대기 (멀티라인)
        lines = []
        while True:
            try:
                line = input()
                if line.strip() == "":
                    break
                lines.append(line)
            except EOFError:
                break

        response_text = "\n".join(lines)

        # JSON 파싱
        try:
            # 마크다운 코드 블록 제거
            import re
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response_text)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = response_text

            data = json.loads(json_str)
            evaluations = data.get('evaluations', [])

            if not evaluations:
                print("  ⚠️ 평가 결과 없음, 다음 배치로...")
                continue

            # 저장
            saved = save_evaluations_batch(
                politician_id, politician_name, category,
                evaluations, batch
            )
            total_saved += saved
            print(f"  ✅ {saved}개 평가 저장 완료")

        except json.JSONDecodeError as e:
            print(f"  ❌ JSON 파싱 실패: {e}")
            print(f"  입력된 텍스트: {response_text[:200]}...")
            continue

        # 다음 배치 전 대기
        if i + batch_size < len(unevaluated_items):
            time.sleep(1)

    # 4. 결과 요약
    print(f"\n{'='*60}")
    print(f"✅ 평가 완료: {politician_name} - {CATEGORY_MAP.get(category.lower(), category)}")
    print(f"   총 저장: {total_saved}건")
    print(f"{'='*60}")

    return total_saved


def evaluate_from_file(politician_id, politician_name, category, eval_file, batch_size=10):
    """
    파일 기반 평가 모드

    사전에 생성된 평가 JSON 파일을 읽어서 저장
    (Claude Code가 평가를 파일로 저장한 경우 사용)
    """
    print(f"\n{'#'*60}")
    print(f"# V30 Claude 평가 (파일 모드)")
    print(f"# 정치인: {politician_name} ({politician_id})")
    print(f"# 카테고리: {CATEGORY_MAP.get(category.lower(), category)} ({category})")
    print(f"# 평가 파일: {eval_file}")
    print(f"{'#'*60}\n")

    # 평가 파일 읽기
    try:
        with open(eval_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ 파일 읽기 실패: {e}")
        return 0

    evaluations = data.get('evaluations', [])
    if not evaluations:
        print("⚠️ 평가 데이터 없음")
        return 0

    # 미평가 데이터 조회 (ID 매칭용)
    unevaluated_items = get_unevaluated_data(politician_id, category)
    if not unevaluated_items:
        print("✅ 모든 데이터 평가 완료!")
        return 0

    # 배치 저장
    total_saved = 0
    for i in range(0, len(evaluations), batch_size):
        batch_evals = evaluations[i:i+batch_size]
        batch_items = unevaluated_items[i:i+batch_size]

        saved = save_evaluations_batch(
            politician_id, politician_name, category,
            batch_evals, batch_items
        )
        total_saved += saved

    print(f"\n✅ 평가 완료: 총 {total_saved}건 저장")
    return total_saved


def main():
    parser = argparse.ArgumentParser(description='V30 Claude 평가 (Subscription Mode)')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--category', required=True, help='카테고리 영문명')
    parser.add_argument('--batch_size', type=int, default=50, help='배치 크기 (기본: 50, 최적화됨)')
    parser.add_argument('--eval_file', help='평가 JSON 파일 경로 (파일 모드)')
    parser.add_argument('--mode', choices=['interactive', 'file'], default='interactive',
                        help='평가 모드: interactive(대화형) 또는 file(파일)')

    args = parser.parse_args()

    if args.mode == 'file' or args.eval_file:
        if not args.eval_file:
            print("❌ 파일 모드는 --eval_file 필요")
            return
        evaluate_from_file(
            args.politician_id,
            args.politician_name,
            args.category,
            args.eval_file,
            args.batch_size
        )
    else:
        evaluate_interactive(
            args.politician_id,
            args.politician_name,
            args.category,
            args.batch_size
        )


if __name__ == "__main__":
    main()
