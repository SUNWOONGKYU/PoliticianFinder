# -*- coding: utf-8 -*-
"""
V26.0 풀링 방식 평가 스크립트 (2단계: 평가 전용)

핵심 원칙: "모두가 찾은 것을 각자가 평가"
핵심 장점: 타이밍 분리 = 객관성 확보

[1단계: 수집] - collect_v26_pool.py
- 4개 AI가 각각 50개 수집 (rating 없이)
- 카테고리당 200개 풀 생성

[2단계: 평가] - 이 스크립트
- 200개 풀에 대해 각 AI가 독립 평가
- 수집 AI ≠ 평가 AI (타이밍 다름)
- 결과: 800개 평가 (4 AI × 200개)

사용법:
    # 단일 AI 평가
    python evaluate_v26_pool.py --politician_id=62e7b453 --ai=Claude

    # 전체 4개 AI 평가
    python evaluate_v26_pool.py --politician_id=62e7b453 --ai=all

    # 특정 카테고리만 평가
    python evaluate_v26_pool.py --politician_id=62e7b453 --ai=all --category=1
"""

import os
import sys
import json
import argparse
import time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv()

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# V26.0 테이블명
TABLE_COLLECTED_DATA = "collected_data_v26"
TABLE_RATINGS = "ai_ratings_v26"

# AI 클라이언트 (필요 시 초기화)
ai_clients = {}

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

# 알파벳 등급
ALPHABET_GRADES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

# AI 모델 설정
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
        "model": "grok-3-mini",
        "env_key": "XAI_API_KEY"
    },
    "Gemini": {
        "model": "gemini-2.0-flash",
        "env_key": "GEMINI_API_KEY"
    }
}


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
    """AI API 호출 (통합)"""
    client = init_ai_client(ai_name)
    config = AI_CONFIGS[ai_name]

    try:
        if ai_name == "Claude":
            response = client.messages.create(
                model=config['model'],
                max_tokens=8000,
                temperature=1.0,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text

        elif ai_name in ["ChatGPT", "Grok"]:
            response = client.chat.completions.create(
                model=config['model'],
                max_tokens=8000,
                temperature=1.0,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content

        elif ai_name == "Gemini":
            response = client.generate_content(
                prompt,
                generation_config={
                    'temperature': 1.0,
                    'max_output_tokens': 8000,
                }
            )
            return response.text

    except Exception as e:
        raise e


def get_pool_data(politician_id, category_name):
    """풀 데이터 조회 (200개 전체)"""
    all_data = []
    offset = 0
    limit = 1000

    while True:
        response = supabase.table(TABLE_COLLECTED_DATA).select(
            'collected_data_id, politician_id, ai_name, category_name, item_num, '
            'data_title, data_content, data_source, source_url, source_type'
        ).eq(
            'politician_id', politician_id
        ).eq(
            'category_name', category_name
        ).range(offset, offset + limit - 1).execute()

        if not response.data:
            break

        all_data.extend(response.data)

        if len(response.data) < limit:
            break

        offset += limit

    return all_data


def check_already_evaluated(politician_id, category_name, evaluator_ai):
    """이미 평가된 데이터 확인"""
    try:
        response = supabase.table(TABLE_RATINGS).select(
            'collected_data_id', count='exact'
        ).eq(
            'politician_id', politician_id
        ).eq(
            'category_name', category_name
        ).eq(
            'evaluator_ai_name', evaluator_ai
        ).execute()

        return response.count if response.count else 0
    except Exception:
        return 0


def get_category_description(category_eng):
    """카테고리 설명 반환 - V24와 동일한 상세 설명 (영문 정의 포함)"""
    descriptions = {
        "Expertise": """전문성 (Expertise)
【영문 정의】The level of knowledge, skills, and experience required to perform duties effectively
【한글 정의】정책 전문성, 행정 경험, 분야별 전문 지식

[O] 전문성에 해당: 정책 수립 능력, 전문 지식, 학력/경력, 행정 경험, 분야별 전문성, 법안 발의
[X] 전문성 아님: 조직 관리/위기 대응(리더십2), 혁신 아이디어(비전3), 약속 이행(책임성6)""",

        "Leadership": """리더십 (Leadership)
【영문 정의】The ability to effectively lead organizations and people to achieve goals
【한글 정의】조직 관리 능력, 위기 대응, 의사결정 능력

[O] 리더십에 해당: 조직 관리, 팀 구성, 위기 대응, 갈등 조정, 의사결정, 당내 리더십, 정치적 영향력
[X] 리더십 아님: 정책 전문성(전문성1), 장기 계획(비전3), 공약 이행(책임성6), 시민 소통(소통8)""",

        "Vision": """비전 (Vision)
【영문 정의】The ability to predict the future and present long-term goals
【한글 정의】장기적 계획, 혁신성, 미래 전망

[O] 비전에 해당: 장기 발전 계획, 미래 전략, 혁신 정책, 창의성, 변화 주도, 개혁 의지
[X] 비전 아님: 현재 정책 능력(전문성1), 조직 혁신(리더십2), 단기 공약 이행(책임성6)""",

        "Integrity": """청렴성 (Integrity)
【영문 정의】The quality of not engaging in financial or material corruption
【한글 정의】부패 방지, 윤리 준수, 이해충돌 회피

[O] 청렴성에 해당: 금품/뇌물 수수, 횡령, 배임, 비리, 공직자 윤리 위반, 행동강령 위반, 이해충돌, 겸직 문제, 사적 이익 추구, 불법 정치자금, 선거법 위반, 직권 남용, 부적절한 청탁
[X] 청렴성 아님: 정치적 중립성(책임성6), 정치적 편향성(윤리성5), 당내 갈등(리더십2), 정책 전문성(전문성1), 당적 변경(책임성6), 정보 공개(투명성7)""",

        "Ethics": """윤리성 (Ethics)
【영문 정의】The quality of maintaining social norms and moral dignity
【한글 정의】도덕성, 사회적 책임, 공정성

[O] 윤리성에 해당: 도덕성, 가치관, 인격, 사회적 책임, 공익 의식, 공정성, 차별 없는 태도, 성평등, 인권 존중, 발언의 적절성, 품위
[X] 윤리성 아님: 금품 수수(청렴성4), 공약 불이행(책임성6), 정보 은폐(투명성7), 소외계층 정책(공익성10)""",

        "Accountability": """책임성 (Accountability)
【영문 정의】The quality of taking responsibility for promises and performance
【한글 정의】약속 이행, 성과 책임, 투명한 보고

[O] 책임성에 해당: 공약 이행, 약속 준수, 성과 책임, 결과 책임, 잘못 인정, 사과, 정치적 책임, 인사 책임, 법적 책임 수용, 정치적 중립성 유지
[X] 책임성 아님: 부패/비리(청렴성4), 정보 공개(투명성7), 민원 처리(대응성9), 정책 능력(전문성1)""",

        "Transparency": """투명성 (Transparency)
【영문 정의】The quality of disclosing information and decision-making processes
【한글 정의】정보 공개, 소통 개방성, 설명 책임

[O] 투명성에 해당: 정보 공개, 자료 공개, 의사결정 과정 공개, 정치자금 공개, 설명 책임, 회의록/기록 공개, 투명한 의사결정 절차
[X] 투명성 아님: 금품 수수(청렴성4), 공약 이행 보고(책임성6), SNS 소통(소통8), 민원 응답(대응성9)""",

        "Communication": """소통능력 (Communication)
【영문 정의】The ability to effectively convey messages to citizens
【한글 정의】시민 소통, 언론 대응, 정책 홍보

[O] 소통능력에 해당: 시민 소통, 경청, 언론 대응, 인터뷰, 정책 설명, 홍보, SNS 활용, 온라인 소통, 의견 수렴
[X] 소통능력 아님: 정보 공개(투명성7), 민원 처리(대응성9), 조직 내 소통(리더십2), 공약 설명(책임성6)""",

        "Responsiveness": """대응성 (Responsiveness)
【영문 정의】The ability to respond quickly and appropriately to citizens' needs
【한글 정의】민원 대응, 신속한 조치, 현장 중심

[O] 대응성에 해당: 민원 처리, 민원 응답, 신속한 조치, 위기 대응 속도, 현장 방문, 현장 중심 행정, 즉각적 문제 해결, 시민 요구 반영
[X] 대응성 아님: 위기 관리 능력(리더십2), 정책 소통(소통8), 정보 공개(투명성7), 약속 이행(책임성6)""",

        "PublicInterest": """공익성 (PublicInterest)
【영문 정의】The attitude of prioritizing public interest over private interest
【한글 정의】공공 이익 우선, 사회적 형평성, 약자 보호

[O] 공익성에 해당: 공공 이익 우선, 사익 배제, 사회적 형평성, 불평등 해소, 약자/소외계층 보호, 복지 정책, 사회안전망, 지역 균형 발전
[X] 공익성 아님: 사적 이익 추구(청렴성4), 정책 전문성(전문성1), 공약 이행(책임성6), 도덕성(윤리성5)"""
    }
    return descriptions.get(category_eng, category_eng)


def evaluate_batch(ai_name, category_name, items, batch_size=25):
    """
    배치 평가 (여러 항목을 한 번에 평가)

    API 호출 최적화를 위해 25개씩 묶어서 평가
    ⚠️ V26.1: 인덱스 기반으로 변경 (AI가 UUID를 정확히 복사하지 못하는 문제 해결)
    """
    cat_desc = get_category_description(category_name)

    # 인덱스 → UUID 매핑 테이블 생성
    idx_to_uuid = {}
    for idx, item in enumerate(items, 1):
        idx_to_uuid[idx] = item['collected_data_id']

    # 평가할 항목들 포맷팅 (UUID 대신 인덱스만 표시)
    items_text = ""
    for idx, item in enumerate(items, 1):
        items_text += f"""
---
[항목 {idx}]
제목: {item['data_title']}
내용: {item['data_content']}
출처: {item['data_source']}
유형: {item['source_type']}
수집 AI: {item['ai_name']}
---
"""

    prompt = f"""당신은 정치인 평가 AI입니다.

**평가 카테고리**: {cat_desc}

**등급 체계** (8단계):
- A (매우우수, +8점): 탁월한 성과, 모범 사례
- B (우수, +6점): 뛰어난 성과
- C (양호, +4점): 평균 이상 성과
- D (보통, +2점): 평균적 수준
- E (미흡, -2점): 기대에 미달
- F (부족, -4점): 문제가 있음
- G (매우부족, -6점): 심각한 문제
- H (심각, -8점): 중대한 결함

아래 항목들을 평가하세요. 각 항목에 대해 A~H 등급을 부여하고 간단한 근거를 작성하세요.

{items_text}

다음 JSON 형식으로 응답하세요 (item_index는 항목 번호입니다):
```json
{{
  "evaluations": [
    {{
      "item_index": 1,
      "rating": "A",
      "rating_rationale": "평가 근거"
    }}
  ]
}}
```
"""

    max_retries = 3
    for attempt in range(max_retries):
        try:
            time.sleep(0.5)  # 최적화: 1.5초 → 0.5초

            content = call_ai_api(ai_name, prompt)

            # JSON 파싱
            json_start = content.find('```json')
            json_end = content.find('```', json_start + 7)

            if json_start != -1 and json_end != -1:
                json_str = content[json_start + 7:json_end].strip()
            else:
                json_str = content.strip()

            data = json.loads(json_str)
            evaluations = data.get('evaluations', [])

            # 유효성 검증 및 인덱스 → UUID 변환
            valid_evals = []
            for eval_item in evaluations:
                rating = str(eval_item.get('rating', '')).strip().upper()
                if rating not in ALPHABET_GRADES:
                    continue

                # 인덱스 → UUID 변환
                item_index = eval_item.get('item_index')
                if item_index is None:
                    # 구버전 호환: collected_data_id가 있으면 사용
                    collected_data_id = eval_item.get('collected_data_id')
                    if collected_data_id and len(str(collected_data_id)) >= 32:
                        eval_item['rating'] = rating
                        valid_evals.append(eval_item)
                    continue

                # 인덱스를 정수로 변환
                try:
                    idx = int(item_index)
                except (ValueError, TypeError):
                    continue

                # 유효한 인덱스인지 확인
                if idx not in idx_to_uuid:
                    continue

                # UUID로 변환하여 저장
                valid_evals.append({
                    'collected_data_id': idx_to_uuid[idx],
                    'rating': rating,
                    'rating_rationale': eval_item.get('rating_rationale', '')
                })

            return valid_evals

        except json.JSONDecodeError as e:
            print(f"      ⚠️ JSON 파싱 에러: {e}")
            if attempt < max_retries - 1:
                time.sleep(3)
            continue
        except Exception as e:
            error_str = str(e)
            if "ResourceExhausted" in error_str or "429" in error_str or "rate" in error_str.lower():
                print(f"      ⚠️ Rate limit, 60초 대기...")
                time.sleep(60)
                continue
            print(f"      ❌ 에러: {e}")
            if attempt < max_retries - 1:
                time.sleep(5)
            continue

    return []


def save_evaluations(politician_id, category_name, evaluator_ai, evaluations, pool_data):
    """평가 결과 저장"""
    # collected_data_id → original_collector_ai 매핑
    id_to_collector = {item['collected_data_id']: item['ai_name'] for item in pool_data}

    saved = 0
    for eval_item in evaluations:
        collected_data_id = eval_item.get('collected_data_id')

        try:
            data = {
                'collected_data_id': collected_data_id,
                'evaluator_ai_name': evaluator_ai,
                'politician_id': politician_id,
                'category_name': category_name,
                'rating': eval_item['rating'],
                'rating_rationale': eval_item.get('rating_rationale', ''),
                'evaluation_date': datetime.now().isoformat(),
                'evaluation_version': 'V26.0',
                'original_collector_ai': id_to_collector.get(collected_data_id, '')
            }

            supabase.table(TABLE_RATINGS).insert(data).execute()
            saved += 1
        except Exception as e:
            print(f"      ❌ 저장 실패: {e}")

    return saved


def evaluate_category(politician_id, category_name, evaluator_ai, batch_size=25):
    """카테고리 평가 (200개 전체)"""
    cat_kor = dict(CATEGORIES).get(category_name, category_name)

    print(f"\n{'='*60}")
    print(f"[{evaluator_ai}] 카테고리: {cat_kor} 평가")
    print(f"{'='*60}")

    # 이미 평가된 개수 확인
    already_evaluated = check_already_evaluated(politician_id, category_name, evaluator_ai)
    if already_evaluated > 0:
        print(f"  ⚠️ 이미 {already_evaluated}개 평가됨")

    # 풀 데이터 조회
    pool_data = get_pool_data(politician_id, category_name)
    total_pool = len(pool_data)

    if total_pool == 0:
        print(f"  ⚠️ 풀 데이터 없음! collect_v26_pool.py를 먼저 실행하세요.")
        return

    print(f"  풀 크기: {total_pool}개")

    # 이미 평가된 ID 조회
    evaluated_ids = set()
    if already_evaluated > 0:
        response = supabase.table(TABLE_RATINGS).select('collected_data_id').eq(
            'politician_id', politician_id
        ).eq('category_name', category_name).eq('evaluator_ai_name', evaluator_ai).execute()

        if response.data:
            evaluated_ids = {item['collected_data_id'] for item in response.data}

    # 평가할 항목 필터링
    items_to_evaluate = [item for item in pool_data if item['collected_data_id'] not in evaluated_ids]

    if not items_to_evaluate:
        print(f"  ✅ 모든 항목 평가 완료!")
        return

    print(f"  평가 대상: {len(items_to_evaluate)}개")

    # 배치 단위로 평가
    all_evaluations = []
    for i in range(0, len(items_to_evaluate), batch_size):
        batch = items_to_evaluate[i:i + batch_size]
        print(f"    배치 {i//batch_size + 1}/{(len(items_to_evaluate) + batch_size - 1)//batch_size} ({len(batch)}개)")

        evals = evaluate_batch(evaluator_ai, category_name, batch, batch_size)
        all_evaluations.extend(evals)

        print(f"      → {len(evals)}개 평가 완료")

    # 저장
    saved = save_evaluations(politician_id, category_name, evaluator_ai, all_evaluations, pool_data)
    print(f"\n  ✅ DB 저장: {saved}개")


def evaluate_all_categories(politician_id, evaluator_ai, target_category=None):
    """전체 카테고리 평가"""
    print("="*60)
    print(f"V26.0 풀링 평가 - {evaluator_ai}")
    print("="*60)
    print(f"정치인 ID: {politician_id}")
    print(f"평가 AI: {evaluator_ai}")
    print(f"⚠️ 수집 AI와 다른 세션 = 독립적 판단 = 객관성!")
    print("="*60)

    if target_category:
        # 특정 카테고리만
        cat_eng = CATEGORIES[target_category - 1][0]
        evaluate_category(politician_id, cat_eng, evaluator_ai)
    else:
        # 전체 카테고리
        for cat_eng, cat_kor in CATEGORIES:
            evaluate_category(politician_id, cat_eng, evaluator_ai)

    print(f"\n✅ {evaluator_ai} 평가 완료!")


def evaluate_all_ais(politician_id, target_category=None, parallel=False):
    """4개 AI 전체 평가"""
    ai_list = ["Claude", "ChatGPT", "Grok", "Gemini"]

    print("="*60)
    print(f"V26.0 풀링 평가 - 4개 AI 전체")
    print("="*60)
    print(f"정치인 ID: {politician_id}")
    print(f"AI: {', '.join(ai_list)}")
    print(f"병렬 실행: {'예' if parallel else '아니오'}")
    print("="*60)

    if parallel:
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {
                executor.submit(evaluate_all_categories, politician_id, ai, target_category): ai
                for ai in ai_list
            }

            for future in as_completed(futures):
                ai = futures[future]
                try:
                    future.result()
                    print(f"\n✅ {ai} 평가 완료!")
                except Exception as e:
                    print(f"\n❌ {ai} 평가 실패: {e}")
    else:
        for ai in ai_list:
            evaluate_all_categories(politician_id, ai, target_category)

    # 평가 상태 확인
    print("\n" + "="*60)
    print("평가 상태 확인")
    print("="*60)

    for cat_eng, cat_kor in CATEGORIES:
        counts = []
        total = 0
        for ai in ai_list:
            count = check_already_evaluated(politician_id, cat_eng, ai)
            counts.append(f"{ai}: {count}")
            total += count

        status = "✅" if total >= 800 else "⚠️"
        print(f"{status} {cat_kor}: {total}/800 ({', '.join(counts)})")

    print("\n" + "="*60)
    print("풀링 평가 완료!")
    print("다음 단계: python calculate_v26_pool_scores.py --politician_id=...")
    print("="*60)


def main():
    parser = argparse.ArgumentParser(description='V26.0 풀링 방식 평가')
    parser.add_argument('--politician_id', type=str, required=True, help='정치인 ID')
    parser.add_argument('--ai', type=str, default='all',
                        help='평가할 AI (Claude, ChatGPT, Grok, Gemini, all)')
    parser.add_argument('--category', type=int, default=None,
                        help='특정 카테고리만 평가 (1-10)')
    parser.add_argument('--parallel', action='store_true', help='병렬 실행')
    args = parser.parse_args()

    if args.ai.lower() == 'all':
        evaluate_all_ais(args.politician_id, args.category, args.parallel)
    else:
        evaluate_all_categories(args.politician_id, args.ai, args.category)


if __name__ == "__main__":
    main()
