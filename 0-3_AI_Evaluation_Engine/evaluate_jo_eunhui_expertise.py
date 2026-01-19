# -*- coding: utf-8 -*-
"""
조은희 정치인 expertise 카테고리 데이터 10개 평가 스크립트

작업:
1. collected_data_v30에서 조은희(d0a5d6e1) expertise 데이터 10개 조회
2. Claude AI로 평가 (등급: +4 ~ -4)
3. evaluations_v30 테이블에 저장

등급 체계:
+4: 탁월함 (전문성 모범 사례)
+3: 우수함 (긍정적 평가)
+2: 양호함 (기본 충족)
+1: 보통 (평균 수준)
-1: 미흡함 (개선 필요)
-2: 부족함 (문제 있음)
-3: 매우 부족 (심각한 문제)
-4: 극히 부족 (정치인 부적합)
"""

import os
import sys
import json
import re
import time
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv
import anthropic

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 환경 변수 로드
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path, override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# Anthropic 클라이언트
anthropic_client = anthropic.Anthropic(
    api_key=os.getenv('ANTHROPIC_API_KEY')
)

# 정치인 정보
POLITICIAN_ID = 'd0a5d6e1'
POLITICIAN_NAME = '조은희'
CATEGORY = 'expertise'
CATEGORY_KOREAN = '전문성'

# 등급 → 점수 변환
RATING_TO_SCORE = {
    '+4': 8, '+3': 6, '+2': 4, '+1': 2,
    '-1': -2, '-2': -4, '-3': -6, '-4': -8
}

VALID_RATINGS = ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']


def fetch_expertise_data(limit=10):
    """collected_data_v30에서 expertise 데이터 조회"""
    print(f"\n[1단계] 데이터 조회 중...")
    print(f"  - 정치인: {POLITICIAN_NAME} ({POLITICIAN_ID})")
    print(f"  - 카테고리: {CATEGORY_KOREAN} ({CATEGORY})")
    print(f"  - 조회 개수: {limit}개")

    try:
        result = supabase.table('collected_data_v30')\
            .select('*')\
            .eq('politician_id', POLITICIAN_ID)\
            .eq('category', CATEGORY)\
            .limit(limit)\
            .execute()

        if result.data:
            print(f"  ✅ {len(result.data)}개 데이터 조회 완료\n")
            return result.data
        else:
            print(f"  ⚠️ 데이터 없음\n")
            return []
    except Exception as e:
        print(f"  ❌ 조회 실패: {e}\n")
        return []


def extract_json(text):
    """JSON 추출 및 파싱"""
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
        return json.loads(json_str)
    except:
        return None


def evaluate_with_claude(items):
    """Claude로 배치 평가"""
    print(f"[2단계] Claude AI 평가 중...")
    print(f"  - 평가 항목: {len(items)}개")

    # 평가 데이터 텍스트 생성
    items_text = ""
    for i, item in enumerate(items, 1):
        items_text += f"""
[항목 {i}]
- ID: {item.get('id', '')}
- 제목: {item.get('title', 'N/A')}
- 내용: {item.get('content', 'N/A')[:300]}...
- 출처: {item.get('source_name', item.get('source_url', 'N/A'))}
- 날짜: {item.get('published_date', 'N/A')}
- 수집AI: {item.get('collector_ai', 'N/A')}
"""

    prompt = f"""당신은 정치인 평가 전문가입니다.

**대상 정치인**: {POLITICIAN_NAME}

**정치인 기본 정보** (평가 시 참고):
- 이름: 조은희
- 신분: 국회의원
- 정당: 국민의힘
- 지역: 서울 서초구을
- 주요 경력: 서울시의원, 서초구청장

**평가 카테고리**: {CATEGORY_KOREAN} ({CATEGORY})

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
      "rationale": "평가 근거 (1-2문장)"
    }}
  ]
}}
```
"""

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = anthropic_client.messages.create(
                model="claude-3-5-haiku-20241022",
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}]
            )

            content = response.content[0].text
            data = extract_json(content)

            if not data:
                raise Exception("JSON 파싱 실패")

            evaluations = data.get('evaluations', [])

            # 유효성 검증
            valid_evals = []
            for idx, ev in enumerate(evaluations):
                rating = str(ev.get('rating', '')).strip()
                # '+' 기호 없이 숫자만 온 경우 처리
                if rating in ['4', '3', '2', '1']:
                    rating = '+' + rating

                if rating in VALID_RATINGS:
                    # items와 순서 매칭하여 올바른 ID 할당
                    if idx < len(items):
                        ev['id'] = items[idx].get('id')
                        ev['rating'] = rating
                        ev['score'] = RATING_TO_SCORE.get(rating, 0)
                        valid_evals.append(ev)

            print(f"  ✅ 평가 완료: {len(valid_evals)}개\n")
            return valid_evals

        except Exception as e:
            print(f"  ⚠️ 평가 실패 (시도 {attempt+1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(3)
                continue

    print(f"  ❌ 최종 평가 실패\n")
    return []


def save_evaluations(evaluations):
    """evaluations_v30 테이블에 저장"""
    print(f"[3단계] 평가 결과 저장 중...")

    if not evaluations:
        print(f"  ⚠️ 저장할 평가 없음\n")
        return 0

    # 배치 INSERT용 레코드 생성
    records = []
    for ev in evaluations:
        record = {
            'politician_id': POLITICIAN_ID,
            'politician_name': POLITICIAN_NAME,
            'category': CATEGORY,
            'evaluator_ai': 'Claude',
            'collected_data_id': ev.get('id'),
            'rating': ev.get('rating'),
            'score': ev.get('score'),
            'reasoning': ev.get('rationale', '')[:1000],
            'evaluated_at': datetime.now().isoformat()
        }
        records.append(record)

    # 저장
    max_retries = 3
    for attempt in range(max_retries):
        try:
            result = supabase.table('evaluations_v30').insert(records).execute()
            saved_count = len(result.data) if result.data else 0
            print(f"  ✅ {saved_count}개 저장 완료\n")
            return saved_count
        except Exception as e:
            error_msg = str(e)

            # 중복 키 에러는 무시
            if "'code': '23505'" in error_msg or "duplicate key" in error_msg.lower():
                print(f"  ⚠️ 중복 평가 건너뛰기 (이미 저장됨)\n")
                return 0

            # 재시도
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 2
                print(f"  ⚠️ 저장 실패, {wait_time}초 후 재시도 ({attempt + 1}/{max_retries})")
                time.sleep(wait_time)
                continue

            print(f"  ❌ 저장 최종 실패: {error_msg}\n")

    return 0


def main():
    """메인 실행"""
    print(f"\n{'='*60}")
    print(f"조은희 정치인 expertise 카테고리 평가")
    print(f"{'='*60}")

    # 1. 데이터 조회
    items = fetch_expertise_data(limit=10)
    if not items:
        print("❌ 평가할 데이터가 없습니다.")
        return

    # 2. Claude 평가
    evaluations = evaluate_with_claude(items)
    if not evaluations:
        print("❌ 평가 실패")
        return

    # 3. 결과 저장
    saved_count = save_evaluations(evaluations)

    # 4. 결과 보고
    print(f"{'='*60}")
    print(f"✅ 평가 완료")
    print(f"  - 정치인: {POLITICIAN_NAME} ({POLITICIAN_ID})")
    print(f"  - 카테고리: {CATEGORY_KOREAN}")
    print(f"  - 평가 항목: {len(items)}개")
    print(f"  - 저장된 평가: {saved_count}개")
    print(f"{'='*60}\n")

    # 평가 결과 미리보기
    if evaluations:
        print(f"평가 결과 미리보기:")
        print(f"{'-'*60}")
        for i, ev in enumerate(evaluations[:5], 1):  # 처음 5개만
            print(f"{i}. 등급: {ev.get('rating')} (점수: {ev.get('score')})")
            print(f"   근거: {ev.get('rationale', 'N/A')}")
            print()


if __name__ == "__main__":
    main()
