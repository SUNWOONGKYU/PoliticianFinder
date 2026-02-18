# -*- coding: utf-8 -*-
"""
🚫 DEPRECATED - 더 이상 사용하지 마세요! 🚫

이 스크립트는 2026-02-12부터 deprecated 되었습니다.

이유:
1. 4개 AI 모두 CLI/Direct 방식으로 전환
2. 각 AI Helper가 자체적으로 미평가 조회 기능 내장
3. API 방식과 실제 방식 불일치

⭐ 대신 사용하세요:
  - Claude: scripts/helpers/claude_eval_helper.py
  - ChatGPT: scripts/helpers/codex_eval_helper.py
  - Gemini: scripts/workflow/evaluate_gemini_subprocess.py
  - Grok: scripts/helpers/grok_eval_helper.py

📖 자세한 가이드: instructions/V40_추가평가_가이드.md

---

[아래는 기존 코드 - 참고용으로만 보관]

V40 미평가 데이터 전용 평가 스크립트 (API 방식 전용)

특정 AI가 평가하지 않은 데이터만 선택하여 평가합니다.
중복 평가를 방지하고, 미평가 데이터만 정확히 타겟팅합니다.

⚠️ ChatGPT, Grok만 지원 (API 방식)
   Claude, Gemini는 기존 CLI 방식 사용

사용법 (DEPRECATED):
    python evaluate_missing_v40.py --politician 박주민 --ai ChatGPT
    python evaluate_missing_v40.py --politician 박주민 --ai Grok --category ethics
"""

import os
import sys
import argparse
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv
import openai
# Grok는 필요시에만 import

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# API 클라이언트 (ChatGPT, Grok만)
openai.api_key = os.getenv('OPENAI_API_KEY')

# 테이블명
TABLE_COLLECTED = "collected_data_v40"
TABLE_EVALUATIONS = "evaluations_v40"

# 배치 크기
BATCH_SIZE = 25

# 카테고리 정의
CATEGORIES = [
    "expertise", "leadership", "vision", "integrity", "ethics",
    "accountability", "transparency", "communication", "responsiveness", "publicinterest"
]


def get_politician_id(politician_name):
    """정치인 이름으로 politician_id 조회"""
    result = supabase.table('politicians').select('id').eq('name', politician_name).execute()
    if not result.data:
        raise ValueError(f"정치인을 찾을 수 없습니다: {politician_name}")
    return result.data[0]['id']


def get_missing_data(politician_id, evaluator_ai, category=None):
    """특정 AI가 평가하지 않은 데이터 찾기 (검증 강화)"""
    # 1. 전체 수집 데이터 가져오기
    query = supabase.table(TABLE_COLLECTED).select('id, category, title, content, source_url, sentiment').eq('politician_id', politician_id)

    if category:
        query = query.eq('category', category)

    collected = query.execute()
    all_data = {row['id']: row for row in collected.data}

    # 2. 해당 AI가 이미 평가한 collected_data_id 가져오기
    eval_query = supabase.table(TABLE_EVALUATIONS).select('collected_data_id').eq('politician_id', politician_id).eq('evaluator_ai', evaluator_ai)

    if category:
        eval_query = eval_query.eq('category', category)

    evaluated = eval_query.execute()
    evaluated_ids = {row['collected_data_id'] for row in evaluated.data if row['collected_data_id']}  # null 제외

    # 3. 미평가 데이터 추출
    missing_ids = set(all_data.keys()) - evaluated_ids
    missing_data = [all_data[id] for id in missing_ids if id in all_data]

    # 4. 검증: 실제 미평가 수와 일치하는지 확인
    print(f"\n[미평가 데이터 검증]")
    print(f"  전체 수집: {len(all_data)}개")
    print(f"  평가 완료: {len(evaluated_ids)}개")
    print(f"  미평가: {len(missing_ids)}개")

    # 5. None이 포함되어 있는지 확인
    null_collected_ids = [row['collected_data_id'] for row in evaluated.data if row['collected_data_id'] is None]
    if null_collected_ids:
        print(f"  ⚠️ collected_data_id가 null인 평가: {len(null_collected_ids)}개")

    return missing_data


def load_instruction(category):
    """카테고리별 instruction 로드"""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    instruction_path = os.path.join(base_dir, 'instructions', '3_evaluate', f'cat_{category}.md')

    if not os.path.exists(instruction_path):
        print(f"⚠️ Instruction 파일 없음: {instruction_path}")
        return ""

    with open(instruction_path, 'r', encoding='utf-8') as f:
        return f.read()


def evaluate_with_chatgpt(data, category, instruction):
    """ChatGPT API로 평가"""
    prompt = f"""{instruction}

---

**평가 대상 데이터:**

제목: {data['title']}
내용: {data['content'][:1000]}...
출처: {data['source_url']}
감정: {data['sentiment']}

---

위 데이터를 {category} 카테고리 기준으로 평가하세요.
평가 등급: +4, +3, +2, +1, -1, -2, -3, -4, X (제외)
형식: [등급]|[이유 (50자 이내)]
"""

    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.3
        )

        result = response.choices[0].message.content.strip()

        # 파싱
        if '|' in result:
            parts = result.split('|', 1)
            rating_str = parts[0].strip()
            reasoning = parts[1].strip() if len(parts) > 1 else ""

            # 등급 변환 (문자열로 반환)
            if rating_str == 'X':
                return None, reasoning

            # rating을 문자열로 유지 (+4, +3, +2, +1, -1, -2, -3, -4)
            if rating_str in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']:
                return rating_str, reasoning

            # +부호 없는 경우 추가
            try:
                rating_num = int(rating_str)
                if rating_num > 0:
                    rating_str = f'+{rating_num}'
                if rating_str in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']:
                    return rating_str, reasoning
            except:
                pass

        return None, "파싱 실패"

    except Exception as e:
        print(f"  ❌ ChatGPT 평가 오류: {str(e)}")
        return None, str(e)


def evaluate_with_grok(data, category, instruction):
    """Grok API로 평가"""
    # Grok 사용 시에만 import
    try:
        from groq import Groq
        grok_client = Groq(api_key=os.getenv('GROK_API_KEY'))
    except ImportError:
        print("  ❌ groq 모듈이 설치되지 않았습니다. pip install groq")
        return None, "groq 모듈 없음"

    prompt = f"""{instruction}

---

**평가 대상 데이터:**

제목: {data['title']}
내용: {data['content'][:1000]}...
출처: {data['source_url']}
감정: {data['sentiment']}

---

위 데이터를 {category} 카테고리 기준으로 평가하세요.
평가 등급: +4, +3, +2, +1, -1, -2, -3, -4, X (제외)
형식: [등급]|[이유 (50자 이내)]
"""

    try:
        response = grok_client.chat.completions.create(
            model="grok-2-1212",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.3
        )

        result = response.choices[0].message.content.strip()

        # 파싱
        if '|' in result:
            parts = result.split('|', 1)
            rating_str = parts[0].strip()
            reasoning = parts[1].strip() if len(parts) > 1 else ""

            # 등급 변환 (문자열로 반환)
            if rating_str == 'X':
                return None, reasoning

            # rating을 문자열로 유지 (+4, +3, +2, +1, -1, -2, -3, -4)
            if rating_str in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']:
                return rating_str, reasoning

            # +부호 없는 경우 추가
            try:
                rating_num = int(rating_str)
                if rating_num > 0:
                    rating_str = f'+{rating_num}'
                if rating_str in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']:
                    return rating_str, reasoning
            except:
                pass

        return None, "파싱 실패"

    except Exception as e:
        print(f"  ❌ Grok 평가 오류: {str(e)}")
        return None, str(e)


def save_evaluation(politician_id, politician_name, collected_data_id, category, evaluator_ai, rating, reasoning, max_retries=3):
    """평가 결과 저장 (재시도 및 검증 포함)"""

    for attempt in range(max_retries):
        try:
            # 저장 시도
            supabase.table(TABLE_EVALUATIONS).insert({
                'politician_id': politician_id,
                'politician_name': politician_name,
                'collected_data_id': collected_data_id,
                'category': category,
                'evaluator_ai': evaluator_ai,
                'rating': rating,
                'reasoning': reasoning,
                'evaluated_at': datetime.utcnow().isoformat()
            }).execute()

            # 저장 확인
            verify = supabase.table(TABLE_EVALUATIONS).select('id').eq('politician_id', politician_id).eq('collected_data_id', collected_data_id).eq('evaluator_ai', evaluator_ai).eq('category', category).execute()

            if verify.data:
                return True  # 저장 성공 및 확인 완료
            else:
                # 저장했는데 확인 안됨 (이상한 경우)
                if attempt < max_retries - 1:
                    continue  # 재시도
                return False

        except Exception as e:
            error_msg = str(e)

            # 중복 오류: 실제로 DB에 있는지 확인
            if 'duplicate key' in error_msg or 'unique_evaluation_per_data' in error_msg:
                # 실제로 DB에 있는지 확인
                verify = supabase.table(TABLE_EVALUATIONS).select('id, rating').eq('politician_id', politician_id).eq('collected_data_id', collected_data_id).eq('evaluator_ai', evaluator_ai).eq('category', category).execute()

                if verify.data:
                    # 실제로 있음 - 업데이트 시도
                    try:
                        existing_id = verify.data[0]['id']
                        supabase.table(TABLE_EVALUATIONS).update({
                            'rating': rating,
                            'reasoning': reasoning,
                            'evaluated_at': datetime.utcnow().isoformat()
                        }).eq('id', existing_id).execute()
                        return True  # 업데이트 성공
                    except:
                        return True  # 업데이트 실패해도 이미 평가 있으므로 성공으로 간주
                else:
                    # 중복 오류인데 실제로는 없음 - 재시도
                    if attempt < max_retries - 1:
                        import time
                        time.sleep(0.5)  # 잠시 대기 후 재시도
                        continue
                    return False

            # 기타 오류
            if attempt < max_retries - 1:
                import time
                time.sleep(1)  # 1초 대기 후 재시도
                continue
            else:
                print(f"  ❌ 저장 오류 ({max_retries}회 시도 실패): {error_msg[:100]}")
                return False

    return False


def evaluate_missing(politician_name, evaluator_ai, category=None):
    """미평가 데이터 평가 실행"""
    print(f"\n{'='*80}")
    print(f"V40 미평가 데이터 평가 (개선 버전): {politician_name} - {evaluator_ai}")
    if category:
        print(f"카테고리: {category}")
    print(f"{'='*80}\n")
    print(f"개선 사항:")
    print(f"  ✅ 중복 체크 강화: 실제 DB 확인")
    print(f"  ✅ 재시도 로직: 최대 3회")
    print(f"  ✅ 저장 검증: 저장 후 확인")
    print(f"{'='*80}\n")

    # 1. politician_id 조회
    politician_id = get_politician_id(politician_name)
    print(f"✅ politician_id: {politician_id}\n")

    # 2. 미평가 데이터 조회
    missing_data = get_missing_data(politician_id, evaluator_ai, category)

    if not missing_data:
        print(f"✅ 미평가 데이터가 없습니다!")
        return

    print(f"📊 미평가 데이터: {len(missing_data)}개")

    # 3. 카테고리별 그룹화
    from collections import defaultdict
    data_by_category = defaultdict(list)
    for data in missing_data:
        data_by_category[data['category']].append(data)

    print("\n카테고리별 분포:")
    for cat, items in sorted(data_by_category.items(), key=lambda x: -len(x[1])):
        print(f"  {cat:20s}: {len(items):3d}개")

    # 4. 카테고리별 평가
    total_evaluated = 0
    total_excluded = 0

    for cat, items in sorted(data_by_category.items(), key=lambda x: -len(x[1])):
        print(f"\n{'='*80}")
        print(f"[{cat}] 평가 중... ({len(items)}개)")
        print(f"{'='*80}")

        # Instruction 로드
        instruction = load_instruction(cat)

        # 배치로 나누어 평가
        for i in range(0, len(items), BATCH_SIZE):
            batch = items[i:i+BATCH_SIZE]
            batch_num = (i // BATCH_SIZE) + 1
            total_batches = (len(items) + BATCH_SIZE - 1) // BATCH_SIZE

            print(f"\n  배치 {batch_num}/{total_batches} ({len(batch)}개)")

            for j, data in enumerate(batch):
                print(f"    [{j+1}/{len(batch)}] {data['title'][:50]}... ", end='')

                # AI별 평가 함수 선택 (ChatGPT, Grok만)
                if evaluator_ai == 'ChatGPT':
                    rating, reasoning = evaluate_with_chatgpt(data, cat, instruction)
                elif evaluator_ai == 'Grok':
                    rating, reasoning = evaluate_with_grok(data, cat, instruction)
                else:
                    print(f"❌ 지원하지 않는 AI: {evaluator_ai}")
                    print(f"⚠️ 이 스크립트는 ChatGPT, Grok만 지원합니다.")
                    print(f"   Claude, Gemini는 기존 CLI 방식을 사용하세요.")
                    continue

                # 저장
                if rating is not None:
                    if save_evaluation(politician_id, politician_name, data['id'], cat, evaluator_ai, rating, reasoning):
                        print(f"✅ [{rating}]")
                        total_evaluated += 1
                    else:
                        print(f"❌ 저장 실패")
                else:
                    print(f"⊗ [X 제외]")
                    total_excluded += 1

    # 5. 결과 요약
    print(f"\n{'='*80}")
    print(f"✅ 평가 완료")
    print(f"{'='*80}")
    print(f"  평가 완료: {total_evaluated}개")
    print(f"  제외 (X): {total_excluded}개")
    print(f"  총 처리: {total_evaluated + total_excluded}개")


def main():
    parser = argparse.ArgumentParser(
        description='V40 미평가 데이터 전용 평가 스크립트 (API 방식 전용)',
        epilog='⚠️ ChatGPT, Grok만 지원. Claude, Gemini는 기존 CLI 방식 사용'
    )
    parser.add_argument('--politician', required=True, help='정치인 이름')
    parser.add_argument('--ai', required=True, choices=['ChatGPT', 'Grok'], help='평가할 AI (API 방식만)')
    parser.add_argument('--category', choices=CATEGORIES, help='카테고리 (선택적)')

    args = parser.parse_args()

    evaluate_missing(args.politician, args.ai, args.category)


if __name__ == '__main__':
    main()
