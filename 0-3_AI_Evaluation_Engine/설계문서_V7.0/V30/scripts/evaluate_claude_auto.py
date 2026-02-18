# -*- coding: utf-8 -*-
"""
V30 Claude 자동 평가 스크립트 (Subscription Mode - Fully Automated)

✨ 핵심 특징:
- API 비용 $0 (Claude Code subscription 사용)
- subprocess 없음, claude.cmd 호출 없음
- 완전 자동화 (사용자 입력 불필요)
- Claude Code가 평가 생성 → 즉시 DB 저장

사용법:
    # 1. 이 스크립트를 실행하여 평가 작업 생성
    python evaluate_claude_auto.py --politician_id=f9e00370 --politician_name=김민석 --category=responsiveness --output=eval_task.md

    # 2. Claude Code에게 eval_task.md 실행 요청
    "eval_task.md 파일의 평가 작업을 수행해주세요"

    # 3. Claude Code가 평가 결과를 eval_result.json으로 저장

    # 4. 결과를 DB에 저장
    python evaluate_claude_auto.py --politician_id=f9e00370 --politician_name=김민석 --category=responsiveness --import_results=eval_result.json
"""

import os
import sys
import json
import argparse
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

        return profile
    except Exception as e:
        print(f"  ⚠️ 프로필 조회 실패: {e}")
        return {}


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

        # 2. 수집된 데이터 조회
        collected_result = supabase.table('collected_data_v30')\
            .select('*')\
            .eq('politician_id', politician_id)\
            .eq('category', category.lower())\
            .execute()

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

            if url and url in seen_by_ai[ai_name]:
                continue

            if url:
                seen_by_ai[ai_name].add(url)
            unique_items.append(item)

        return unique_items

    except Exception as e:
        print(f"  ❌ 데이터 조회 실패: {e}")
        return []


def create_evaluation_task(politician_id, politician_name, category, output_file):
    """평가 작업 파일 생성 (Claude Code가 실행할 태스크)"""
    print(f"\n{'='*60}")
    print(f"V30 Claude 평가 작업 생성")
    print(f"{'='*60}")

    # 프로필 조회
    profile = get_politician_profile(politician_id, politician_name)
    cat_kor = CATEGORY_MAP.get(category.lower(), category)

    # 미평가 데이터 조회
    unevaluated_items = get_unevaluated_data(politician_id, category)

    if not unevaluated_items:
        print(f"\n✅ {politician_name} - {cat_kor}: 모든 데이터 평가 완료!")
        return False

    print(f"\n📊 미평가 데이터: {len(unevaluated_items)}개")

    # 데이터를 JSON으로 저장 (Claude Code가 읽을 수 있도록)
    data_file = output_file.replace('.md', '_data.json')
    with open(data_file, 'w', encoding='utf-8') as f:
        json.dump({
            'politician_id': politician_id,
            'politician_name': politician_name,
            'category': category,
            'profile': profile,
            'items': unevaluated_items
        }, f, ensure_ascii=False, indent=2)

    # 평가 작업 마크다운 생성
    task_content = f"""# V30 Claude 평가 작업 (Subscription Mode)

**정치인**: {politician_name} ({politician_id})
**카테고리**: {cat_kor} ({category})
**미평가 데이터**: {len(unevaluated_items)}개

---

## 🎯 작업 지시

당신(Claude Code)은 **subscription mode**로 이 평가를 수행합니다.
- ✅ API 비용 $0
- ✅ 현재 세션에서 직접 평가 생성

---

## 📋 정치인 정보

- **이름**: {profile.get('name', politician_name)}
- **신분**: {profile.get('identity', 'N/A')}
- **직책**: {profile.get('title', 'N/A')}
- **정당**: {profile.get('party', 'N/A')}
- **지역**: {profile.get('region', 'N/A')}

⚠️ **중요**: 반드시 위 정보와 일치하는 "{politician_name}"에 대해 평가하세요.

---

## 📊 등급 체계 (+4 ~ -4)

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

---

## 📂 데이터 파일

평가할 데이터는 다음 파일에 있습니다:
```
{data_file}
```

이 파일을 읽고 각 항목에 대해 평가를 수행하세요.

---

## 📝 평가 수행 방법

1. **데이터 파일 읽기**:
   ```python
   import json
   with open('{data_file}', 'r', encoding='utf-8') as f:
       task_data = json.load(f)
   items = task_data['items']
   ```

2. **각 항목 평가**:
   - 제목, 내용, 출처, 날짜를 분석
   - {cat_kor} 관점에서 객관적 평가
   - +4 ~ -4 등급 부여
   - 1문장 근거 작성

3. **결과 JSON 생성**:
   ```json
   {{
     "politician_id": "{politician_id}",
     "politician_name": "{politician_name}",
     "category": "{category}",
     "evaluator_ai": "Claude",
     "evaluated_at": "2026-01-21T...",
     "evaluations": [
       {{
         "collected_data_id": "UUID",
         "rating": "+4 또는 -2 등",
         "score": 8 또는 -4 등,
         "reasoning": "평가 근거 1문장"
       }}
     ]
   }}
   ```

4. **결과 파일 저장**:
   ```python
   output_file = '{output_file.replace(".md", "_result.json")}'
   with open(output_file, 'w', encoding='utf-8') as f:
       json.dump(result, f, ensure_ascii=False, indent=2)
   ```

---

## ✅ 체크리스트

- [ ] {data_file} 파일 읽기
- [ ] {len(unevaluated_items)}개 항목 모두 평가
- [ ] 각 항목에 +4~-4 등급 부여
- [ ] 평가 근거 1문장씩 작성
- [ ] 결과를 {output_file.replace(".md", "_result.json")}에 저장
- [ ] 저장 완료 메시지 출력

---

## 🚀 실행 명령

평가 완료 후 다음 명령으로 DB에 저장:
```bash
python evaluate_claude_auto.py --politician_id={politician_id} --politician_name={politician_name} --category={category} --import_results={output_file.replace(".md", "_result.json")}
```

---

**작업 시작 시간**: {datetime.now().isoformat()}
**예상 소요**: 약 {len(unevaluated_items) // 10 + 1}분 (배치당 30초)
"""

    # 파일 저장
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(task_content)

    print(f"\n✅ 평가 작업 파일 생성 완료:")
    print(f"   - 작업 파일: {output_file}")
    print(f"   - 데이터 파일: {data_file}")
    print(f"\n📋 다음 단계:")
    print(f"   1. Claude Code에게 요청: '{output_file} 파일의 평가 작업을 수행해주세요'")
    print(f"   2. 평가 완료 후 결과 파일 확인: {output_file.replace('.md', '_result.json')}")
    print(f"   3. DB 저장: python evaluate_claude_auto.py --import_results=...")

    return True


def import_evaluation_results(politician_id, politician_name, category, results_file):
    """평가 결과를 DB에 저장"""
    print(f"\n{'='*60}")
    print(f"V30 평가 결과 DB 저장")
    print(f"{'='*60}")

    # 결과 파일 읽기
    try:
        with open(results_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ 파일 읽기 실패: {e}")
        return 0

    evaluations = data.get('evaluations', [])
    if not evaluations:
        print("⚠️ 평가 데이터 없음")
        return 0

    print(f"📊 평가 결과: {len(evaluations)}개")

    # DB 저장
    records = []
    skipped = 0

    for ev in evaluations:
        rating = str(ev.get('rating', '')).strip()

        # 등급 정규화
        if rating in ['4', '3', '2', '1']:
            rating = '+' + rating

        if rating not in VALID_RATINGS:
            print(f"  ⚠️ 잘못된 등급 건너뛰기: {rating}")
            skipped += 1
            continue

        record = {
            'politician_id': politician_id,
            'politician_name': politician_name,
            'category': category.lower(),
            'evaluator_ai': 'Claude',
            'collected_data_id': ev.get('collected_data_id'),
            'rating': rating,
            'score': ev.get('score', RATING_TO_SCORE.get(rating, 0)),
            'reasoning': ev.get('reasoning', '')[:1000],
            'evaluated_at': ev.get('evaluated_at', datetime.now().isoformat())
        }
        records.append(record)

    if not records:
        print("⚠️ 저장할 유효한 평가 없음")
        return 0

    # 배치 INSERT
    try:
        result = supabase.table('evaluations_v30').insert(records).execute()
        saved_count = len(result.data) if result.data else 0

        print(f"\n✅ DB 저장 완료:")
        print(f"   - 저장: {saved_count}개")
        print(f"   - 건너뜀: {skipped}개")
        print(f"   - 총: {len(evaluations)}개")

        return saved_count

    except Exception as e:
        error_msg = str(e)
        if 'duplicate key' in error_msg.lower() or '23505' in error_msg:
            print(f"⚠️ 중복 평가 건너뛰기 (이미 저장됨)")
            return 0
        print(f"❌ 저장 실패: {e}")
        return 0


def main():
    parser = argparse.ArgumentParser(description='V30 Claude 자동 평가 (Subscription Mode)')
    parser.add_argument('--politician_id', help='정치인 ID')
    parser.add_argument('--politician_name', help='정치인 이름')
    parser.add_argument('--category', help='카테고리 영문명')
    parser.add_argument('--output', default='eval_task.md', help='출력 파일명 (작업 생성 시)')
    parser.add_argument('--import_results', help='평가 결과 JSON 파일 (저장 시)')

    args = parser.parse_args()

    if args.import_results:
        # 결과 저장 모드
        if not all([args.politician_id, args.politician_name, args.category]):
            print("❌ --import_results 사용 시 --politician_id, --politician_name, --category 필요")
            return

        import_evaluation_results(
            args.politician_id,
            args.politician_name,
            args.category,
            args.import_results
        )
    else:
        # 작업 생성 모드
        if not all([args.politician_id, args.politician_name, args.category]):
            print("❌ --politician_id, --politician_name, --category 필요")
            return

        create_evaluation_task(
            args.politician_id,
            args.politician_name,
            args.category,
            args.output
        )


if __name__ == "__main__":
    main()
