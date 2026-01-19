# -*- coding: utf-8 -*-
"""
V30 정치인 평가 테스트: 조은희 - 청렴성(integrity) 카테고리

이 스크립트는 조은희(Jo Eun-hui)의 청렴성 카테고리에 대해
V30 평가 시스템을 테스트합니다.

파라미터:
- politician_id: d0a5d6e1 (조은희)
- category: integrity (청렴성)
- ai_name: Claude
- limit: 10 (테스팅용 10개 항목만 평가)
"""

import os
import json
import re
import time
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv
import anthropic
from json_repair import repair_json

# UTF-8 설정
import sys
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv(override=True)

# 클라이언트 초기화
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

claude = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

# 상수
POLITICIAN_ID = 'd0a5d6e1'
POLITICIAN_NAME = '조은희'
CATEGORY = 'integrity'
CATEGORY_KOREAN = '청렴성'
AI_NAME = 'Claude'
LIMIT = 10  # 테스팅용 10개

# V30 등급 체계
VALID_RATINGS = ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']
RATING_TO_SCORE = {
    '+4': 8, '+3': 6, '+2': 4, '+1': 2,
    '-1': -2, '-2': -4, '-3': -6, '-4': -8
}

CATEGORY_MAP = {
    'expertise': '전문성',
    'leadership': '리더십',
    'vision': '비전',
    'integrity': '청렴성',
    'ethics': '윤리성',
    'accountability': '책임감',
    'transparency': '투명성',
    'communication': '소통능력',
    'responsiveness': '대응성',
    'publicinterest': '공익성'
}


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


def query_collected_data(limit=10):
    """수집된 데이터 조회 (limit 개)"""
    print(f"\n📊 데이터 조회 중...")
    print(f"   정치인: {POLITICIAN_NAME} ({POLITICIAN_ID})")
    print(f"   카테고리: {CATEGORY_KOREAN} ({CATEGORY})")
    print(f"   조회 건수: {limit}")

    try:
        result = supabase.table('collected_data_v30') \
            .select('*') \
            .eq('politician_id', POLITICIAN_ID) \
            .eq('category', CATEGORY) \
            .order('created_at', desc=True) \
            .limit(limit) \
            .execute()

        items = result.data if result.data else []
        print(f"   ✅ {len(items)}개 항목 로드됨")
        return items

    except Exception as e:
        print(f"   ❌ 조회 실패: {e}")
        return []


def evaluate_batch(items):
    """배치 평가"""
    print(f"\n🤖 Claude 평가 중...")

    # 평가할 데이터 목록 생성
    items_text = ""
    for i, item in enumerate(items, 1):
        content_preview = item.get('content', 'N/A')
        if len(content_preview) > 200:
            content_preview = content_preview[:200] + "..."

        items_text += f"""
[항목 {i}]
- ID: {item.get('id', '')}
- 제목: {item.get('title', 'N/A')}
- 내용: {content_preview}
- 출처: {item.get('source_name', item.get('source_url', 'N/A'))}
- 날짜: {item.get('published_date', 'N/A')}
- 수집AI: {item.get('collector_ai', 'N/A')}
"""

    # 프롬프트 생성
    prompt = f"""당신은 정치인 평가 전문가입니다.

**대상 정치인**: {POLITICIAN_NAME}

**평가 카테고리**: {CATEGORY_KOREAN} ({CATEGORY})

청렴성(integrity)은 부정 행위, 뇌물, 윤리 위반, 부패 행위 등의 부정적 기록이 있는지를 평가하는 카테고리입니다.

아래 데이터를 **객관적으로 평가**하여 등급을 부여하세요.

**등급 체계** (+4 ~ -4):
| 등급 | 판단 기준 |
|------|-----------|
| +4 | 탁월함 - 청렴성이 매우 우수함 |
| +3 | 우수함 - 청렴성이 좋음 |
| +2 | 양호함 - 청렴성이 기본 충족 |
| +1 | 보통 - 청렴성이 평균 수준 |
| -1 | 미흡함 - 청렴성 문제 지적됨 |
| -2 | 부족함 - 청렴성 논란 있음 |
| -3 | 매우 부족 - 청렴성 심각한 문제 |
| -4 | 극히 부족 - 정치인 부적합 |

**평가 기준**:
- 부정적 내용 (부패, 뇌물, 윤리 위반) → -1, -2, -3, -4 (심각도에 따라)
- 중립적 내용 → 0
- 긍정적 내용 (청렴성 칭찬) → +1, +2, +3, +4

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
      "rationale": "평가 근거 (2-4 문장 한글)"
    }}
  ]
}}
```
"""

    try:
        time.sleep(1)
        response = claude.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )
        content = response.content[0].text

        # JSON 추출
        json_str = extract_json(content)
        if not json_str:
            print(f"   ❌ JSON 파싱 실패")
            return []

        data = json.loads(json_str)
        evaluations = data.get('evaluations', [])

        # 유효성 검증 및 ID 매칭
        valid_evals = []
        for idx, ev in enumerate(evaluations):
            rating = str(ev.get('rating', '')).strip()
            # '+' 기호 없이 숫자만 온 경우 처리
            if rating in ['4', '3', '2', '1']:
                rating = '+' + rating
            if rating in VALID_RATINGS:
                ev['rating'] = rating
                ev['score'] = RATING_TO_SCORE.get(rating, 0)
                # items와 evaluations 순서 매칭하여 올바른 ID 할당
                if idx < len(items):
                    ev['id'] = items[idx].get('id')
                valid_evals.append(ev)

        print(f"   ✅ {len(valid_evals)}개 평가 완료")
        return valid_evals

    except Exception as e:
        print(f"   ❌ 평가 실패: {e}")
        return []


def save_evaluations(evaluations):
    """평가 결과 저장"""
    if not evaluations:
        return 0

    print(f"\n💾 결과 저장 중...")

    records = []
    for ev in evaluations:
        record = {
            'politician_id': POLITICIAN_ID,
            'politician_name': POLITICIAN_NAME,
            'category': CATEGORY,
            'evaluator_ai': AI_NAME,
            'collected_data_id': ev.get('id'),
            'rating': ev.get('rating'),
            'score': ev.get('score', RATING_TO_SCORE.get(ev.get('rating'), 0)),
            'reasoning': ev.get('rationale', '')[:1000],
            'evaluated_at': datetime.now().isoformat()
        }
        records.append(record)

    try:
        result = supabase.table('evaluations_v30').insert(records).execute()
        saved_count = len(result.data) if result.data else 0
        print(f"   ✅ {saved_count}개 저장 완료")
        return saved_count
    except Exception as e:
        error_msg = str(e)
        if "'code': '23505'" in error_msg or "duplicate key" in error_msg.lower():
            print(f"   ⚠️ 중복 저장 (이미 평가됨): 0개")
            return 0
        print(f"   ❌ 저장 실패: {error_msg}")
        return 0


def print_summary(items, evaluations):
    """평가 결과 요약"""
    print(f"\n{'='*70}")
    print(f"📋 평가 결과 요약")
    print(f"{'='*70}")

    if not evaluations:
        print("평가 결과 없음")
        return

    # 등급 분포
    rating_dist = {}
    for ev in evaluations:
        rating = ev.get('rating', 'unknown')
        rating_dist[rating] = rating_dist.get(rating, 0) + 1

    print(f"\n📊 등급 분포:")
    for rating in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']:
        count = rating_dist.get(rating, 0)
        if count > 0:
            print(f"   {rating}: {count}개")

    # 샘플 평가 출력
    print(f"\n📝 샘플 평가 (최대 3개):")
    for i, ev in enumerate(evaluations[:3], 1):
        item = None
        for it in items:
            if it.get('id') == ev.get('id'):
                item = it
                break

        if item:
            print(f"\n   [{i}] {item.get('title', 'N/A')}")
            print(f"       등급: {ev.get('rating')}")
            print(f"       근거: {ev.get('rationale', 'N/A')}")

    # 통계
    print(f"\n📈 평가 통계:")
    total_score = sum(ev.get('score', 0) for ev in evaluations)
    avg_score = total_score / len(evaluations) if evaluations else 0
    print(f"   총 평가: {len(evaluations)}개")
    print(f"   총 점수: {total_score}")
    print(f"   평균 점수: {avg_score:.2f}")


def main():
    print("\n" + "="*70)
    print("V30 정치인 평가 테스트: 조은희 - 청렴성(integrity)")
    print("="*70)

    # 1. 데이터 조회
    items = query_collected_data(limit=LIMIT)
    if not items:
        print("❌ 평가할 데이터 없음")
        return

    # 2. 배치 평가
    evaluations = evaluate_batch(items)
    if not evaluations:
        print("❌ 평가 실패")
        return

    # 3. 결과 저장
    saved_count = save_evaluations(evaluations)

    # 4. 요약 출력
    print_summary(items, evaluations)

    print(f"\n{'='*70}")
    print(f"✅ 테스트 완료")
    print(f"   저장된 평가: {saved_count}개")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    main()
