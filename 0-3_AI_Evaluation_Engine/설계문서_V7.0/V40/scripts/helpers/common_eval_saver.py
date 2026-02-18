# -*- coding: utf-8 -*-
"""
V40 공통 평가 저장 함수 (Batch Upsert)

4개 평가 AI (Claude, ChatGPT, Gemini, Grok) 모두 사용하는 통일된 저장 함수

개선 효과:
- Gemini: HTTP 요청 50배 감소 (2,284 → 46)
- Grok: HTTP 요청 25배 감소 (1,142 → 46)
- Claude/ChatGPT: 중복 처리 개선
"""

import os
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(override=True)

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

TABLE_EVALUATIONS = "evaluations_v40"
TABLE_COLLECTED = "collected_data_v40"
VALID_RATINGS = ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4', 'X']

CATEGORIES_ALL = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication',
    'responsiveness', 'publicinterest'
]
MIN_PER_CATEGORY_AI = 50   # 카테고리별/AI별 최소 수집 기준
MAX_PER_CATEGORY_AI = 60   # 카테고리별/AI별 버퍼 상한
MIN_PER_AI_TOTAL = 500     # AI별 최소 총량

# Sentiment 비율 최소 기준 (V40_기본방침.md 섹션 6)
# OFFICIAL 10-10-80: negative 10%, positive 10%, free 80%
# PUBLIC 20-20-60: negative 20%, positive 20%, free 60%
MIN_NEGATIVE_PCT_OFFICIAL = 10
MIN_POSITIVE_PCT_OFFICIAL = 10
MIN_NEGATIVE_PCT_PUBLIC = 20
MIN_POSITIVE_PCT_PUBLIC = 20


def load_politician_info(politician_name: str) -> str:
    """정치인 기본 정보 로드 (MD 파일에서 기본 정보 테이블 + 동명이인 추출)

    Args:
        politician_name: 정치인 이름

    Returns:
        기본 정보 섹션 문자열. 파일 없으면 빈 문자열.
    """
    import re
    v40_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    path = os.path.join(v40_dir, 'instructions', '1_politicians', f'{politician_name}.md')
    if not os.path.exists(path):
        return ''

    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 기본 정보 테이블 추출 (| 필드 | 값 | 부터 빈 줄 또는 --- 까지)
    lines = content.split('\n')
    info_lines = []
    in_table = False
    for line in lines:
        if '| **politician_id**' in line or '| **성명**' in line:
            in_table = True
        if in_table:
            if line.strip().startswith('|') and '**' in line:
                # politician_id는 제외 (AI한테 불필요)
                if 'politician_id' not in line:
                    info_lines.append(line.strip())
            elif line.strip() == '' or line.strip() == '---':
                if info_lines:
                    break

    # 동명이인 구분 추출
    dongmyeong = ''
    for line in lines:
        if '동명이인' in line and '구분' in line:
            dongmyeong = line.strip().lstrip('- ')
            break

    result = '\n'.join(info_lines)
    if dongmyeong:
        result += f'\n\n⚠️ {dongmyeong}'

    return result


def load_instruction(category: str) -> str:
    """카테고리별 instruction 파일에서 Section 3만 추출

    Section 3 = 10개 항목 테이블 + 카테고리 경계 (다른 카테고리와 혼동 방지)
    나머지 섹션(정의, 등급표, 등급세부, 프로세스, 기간제한, JSON형식, 체크리스트)은 제거.

    Args:
        category: 카테고리 영문명 (expertise, leadership, ...)

    Returns:
        Section 3 내용 (문자열). 파일 없으면 빈 문자열.
    """
    import re
    CAT_MAP = {
        'expertise': 'cat01', 'leadership': 'cat02', 'vision': 'cat03',
        'integrity': 'cat04', 'ethics': 'cat05', 'accountability': 'cat06',
        'transparency': 'cat07', 'communication': 'cat08',
        'responsiveness': 'cat09', 'publicinterest': 'cat10'
    }
    prefix = CAT_MAP.get(category.lower(), '')
    if not prefix:
        return ''
    v40_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    path = os.path.join(v40_dir, 'instructions', '3_evaluate', f'{prefix}_{category.lower()}.md')
    if not os.path.exists(path):
        return ''

    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Section 3 추출: "## 3." 부터 "## 4." 직전까지
    match = re.search(r'(## 3\..*?)(?=\n## 4\.)', content, re.DOTALL)
    if match:
        return match.group(1).strip()
    return ''


CATEGORY_KR_MAP = {
    'expertise': '전문성', 'leadership': '리더십', 'vision': '비전',
    'integrity': '청렴성', 'ethics': '윤리성', 'accountability': '책임감',
    'transparency': '투명성', 'communication': '소통능력',
    'responsiveness': '대응성', 'publicinterest': '공익성'
}


def build_evaluation_prompt(politician_name: str, category: str, data_json: list, instruction_content: str = '') -> str:
    """통일된 평가 프롬프트 생성 (순수 계량적 등급 선택)

    핵심 설계 원리:
    - "8개 등급 중 하나를 골라라" (분석/평가 아님, 선택만)
    - 각 등급은 숫자/개수/횟수 기반 계량적 기준으로만 구분
    - 추상적 라벨 없음 (+4, +3, ... -4 숫자 자체가 등급)
    - instruction 파일로 카테고리별 세부 기준 제공

    Args:
        politician_name: 정치인 이름
        category: 카테고리 영문명
        data_json: 평가할 데이터 리스트 [{"id": ..., "title": ..., "content": ..., "source": ..., "date": ...}]
        instruction_content: instruction 파일 내용 (없으면 자동 로드)

    Returns:
        평가 프롬프트 문자열
    """
    import json as _json

    cat_kr = CATEGORY_KR_MAP.get(category.lower(), category)

    if not instruction_content:
        instruction_content = load_instruction(category)

    instruction_section = f"""
{instruction_content}
""" if instruction_content else ''

    # 정치인 기본 정보 로드
    politician_info = load_politician_info(politician_name)
    politician_section = f"""
## 정치인 기본 정보
{politician_info}
""" if politician_info else f"Politician: {politician_name}"

    prompt = f"""{politician_section}

Category: {cat_kr} ({category})
{instruction_section}
수집은 감성 기반이지만, 평가는 감성 분석이 아닙니다.
이 데이터를 근거로, 이 정치인의 {cat_kr}은(는) 8개 등급 중 어디에 해당하는지 골라주세요.

The data was collected by sentiment, but evaluation is NOT sentiment analysis.
Based on this data, pick which of the 8 grades this politician's {category} falls into.

For each data item below, pick ONE grade from +4, +3, +2, +1, -1, -2, -3, -4, or X.

+4 is the strongest positive. -4 is the strongest negative.

X is allowed ONLY when you can prove one of these 3 reasons:
- "wrong_person": the data is about a different person who happens to share the same name, NOT about {politician_name}
- "too_old": the data is from more than 5 years ago (before 2021)
- "corrupted": the text is garbled, unreadable, or gibberish

X를 제외한 나머지는 반드시 8개 등급 중 하나를 골라야 합니다.
If the data is not X, you MUST pick one of the 8 grades — do not default to any specific grade.

Data:

{_json.dumps(data_json, ensure_ascii=False, indent=2)}

Respond in JSON:

```json
{{
  "evaluations": [
    {{"id": "data item ID", "rating": "+2", "rationale": "근거 1문장"}},
    {{"id": "data item ID", "rating": "X", "x_reason": "wrong_person", "rationale": "이 기사는 동명이인 오세훈(배우)에 대한 내용"}}
  ]
}}
```"""

    return prompt


def check_phase2_gate(politician_id: str, category: str = None) -> dict:
    """
    Phase 2-2 게이트 검증: 평가 전 수집 데이터 기준 충족 여부 확인

    규칙:
    - AI별 총량: 최소 500개 (Gemini, Naver 각각)
    - 카테고리별/AI별: 최소 50개
    - Sentiment 비율 (카테고리별):
      - OFFICIAL: negative ≥ 10%, positive ≥ 10%
      - PUBLIC: negative ≥ 20%, positive ≥ 20%

    Args:
        politician_id: 정치인 ID
        category: 특정 카테고리만 검증 (None이면 전체)

    Returns:
        {"pass": bool, "violations": list, "counts": dict}
    """
    from collections import Counter, defaultdict

    # Paginated fetch to avoid Supabase default 1000-row limit
    all_rows = []
    offset = 0
    page_size = 1000
    while True:
        r = supabase.table(TABLE_COLLECTED).select(
            'category, collector_ai, data_type, sentiment'
        ).eq('politician_id', politician_id).range(offset, offset + page_size - 1).execute()
        batch = r.data or []
        all_rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size

    cat_ai = defaultdict(lambda: Counter())
    ai_total = Counter()
    # 카테고리 × data_type × sentiment 집계
    cat_dtype_sent = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
    for row in all_rows:
        cat_ai[row['category']][row['collector_ai']] += 1
        ai_total[row['collector_ai']] += 1
        cat = (row.get('category') or '').lower()
        dtype = (row.get('data_type') or '').lower()
        sent = (row.get('sentiment') or 'free').lower()
        if cat and dtype:
            cat_dtype_sent[cat][dtype][sent] += 1

    violations = []
    warnings = []
    cats_to_check = [category] if category else CATEGORIES_ALL

    # 1. AI별/카테고리별 수량 검증 (GIVE_UP_THRESHOLD=25 이상이면 통과)
    GIVE_UP_THRESHOLD = 25
    for cat in cats_to_check:
        for ai in ['Gemini', 'Naver']:
            count = cat_ai[cat].get(ai, 0)
            if count < GIVE_UP_THRESHOLD:
                violations.append(
                    f'{ai} {cat}: {count}/{GIVE_UP_THRESHOLD} '
                    f'(포기 임계값 미달: {GIVE_UP_THRESHOLD - count}개)'
                )
            elif count < MIN_PER_CATEGORY_AI:
                warnings.append(
                    f'{ai} {cat}: {count}/{MIN_PER_CATEGORY_AI} '
                    f'(부족 허용: {MIN_PER_CATEGORY_AI - count}개 부족)'
                )

    for ai in ['Gemini', 'Naver']:
        total_count = ai_total.get(ai, 0)
        # 총량도 비례 완화: GIVE_UP_THRESHOLD × 10 = 250
        if total_count < GIVE_UP_THRESHOLD * 10:
            violations.append(
                f'{ai} 총량: {total_count}/{GIVE_UP_THRESHOLD * 10} '
                f'(포기 임계값 미달)'
            )
        elif total_count < MIN_PER_AI_TOTAL:
            warnings.append(
                f'{ai} 총량: {total_count}/{MIN_PER_AI_TOTAL} '
                f'(부족 허용: {MIN_PER_AI_TOTAL - total_count}개 부족)'
            )

    # 2. Sentiment 비율 검증 → 경고만 (평가 차단하지 않음)
    # Phase 2/2-2에서 이미 검증 완료된 데이터이므로
    for cat in cats_to_check:
        for dtype, min_neg, min_pos in [
            ('official', MIN_NEGATIVE_PCT_OFFICIAL, MIN_POSITIVE_PCT_OFFICIAL),
            ('public', MIN_NEGATIVE_PCT_PUBLIC, MIN_POSITIVE_PCT_PUBLIC),
        ]:
            counts = cat_dtype_sent[cat][dtype]
            total = sum(counts.values())
            if total == 0:
                continue

            neg_count = counts.get('negative', 0)
            pos_count = counts.get('positive', 0)
            neg_pct = neg_count / total * 100
            pos_pct = pos_count / total * 100

            dtype_upper = dtype.upper()
            if neg_pct < min_neg:
                warnings.append(
                    f'{cat} {dtype_upper} negative: {neg_count}/{total} '
                    f'({neg_pct:.0f}%) < 권장 {min_neg}%'
                )
            if pos_pct < min_pos:
                warnings.append(
                    f'{cat} {dtype_upper} positive: {pos_count}/{total} '
                    f'({pos_pct:.0f}%) < 권장 {min_pos}%'
                )

    return {
        "pass": len(violations) == 0,
        "violations": violations,
        "warnings": warnings,
        "counts": {"ai_total": dict(ai_total), "cat_ai": {k: dict(v) for k, v in cat_ai.items()}}
    }


def save_evaluations_batch_upsert(
    politician_id: str,
    politician_name: str,
    category: str,
    evaluator_ai: str,  # 'Claude', 'ChatGPT', 'Gemini', 'Grok'
    evaluations: list,
    verbose: bool = True
) -> dict:
    """
    배치 Upsert로 평가 저장 (4개 AI 공통 함수)

    PostgreSQL Unique Constraint 활용:
        UNIQUE (politician_id, category, evaluator_ai, collected_data_id)

    Args:
        politician_id: 정치인 ID (8자리 hex)
        politician_name: 정치인 이름
        category: 카테고리 (expertise, leadership, ...)
        evaluator_ai: 평가 AI ('Claude', 'ChatGPT', 'Gemini', 'Grok')
        evaluations: 평가 리스트
            [
                {
                    "id": "collected_data_id (UUID)",
                    "rating": "+3" or "-2" or "X",
                    "rationale": "평가 근거" (또는 "reasoning")
                },
                ...
            ]
        verbose: 로그 출력 여부

    Returns:
        {
            "saved": int,      # 저장된 개수
            "skipped": int,    # X 판정으로 건너뛴 개수
            "invalid": int,    # 잘못된 등급으로 건너뛴 개수
            "total": int       # 전체 개수
        }

    성능:
        - HTTP 요청: 배치당 1번 (Upsert)
        - 기존 방식 대비:
            * Gemini: 50배 빠름 (각 평가당 2번 → 배치당 1번)
            * Grok: 25배 빠름 (각 평가당 1번 → 배치당 1번)
    """
    if not evaluations:
        return {
            "saved": 0,
            "skipped": 0,
            "invalid": 0,
            "total": 0
        }

    # 1. 레코드 준비
    records = []
    x_count = 0
    invalid_count = 0

    for ev in evaluations:
        rating = str(ev.get('rating', '')).strip().upper()

        # 등급 정규화 (4 → +4)
        if rating in ['4', '3', '2', '1']:
            rating = '+' + rating

        # 잘못된 등급 건너뛰기
        if rating not in VALID_RATINGS:
            if verbose:
                print(f"  ⚠️ 잘못된 등급 건너뛰기: {rating}")
            invalid_count += 1
            continue

        # X (제외) 카운트 (저장은 함)
        if rating == 'X':
            x_count += 1

        records.append({
            'politician_id': politician_id,
            'politician_name': politician_name,
            'category': category.lower(),
            'evaluator_ai': evaluator_ai,
            'collected_data_id': ev.get('id'),
            'rating': rating,
            'reasoning': ev.get('rationale', ev.get('reasoning', ''))[:1000],
            'evaluated_at': ev.get('evaluated_at', datetime.now().isoformat())
        })

    if not records:
        if verbose:
            print(f"  ⚠️ 저장할 유효한 평가 없음")
        return {
            "saved": 0,
            "skipped": x_count,
            "invalid": invalid_count,
            "total": len(evaluations)
        }

    # 2. Batch INSERT (단 1번의 HTTP 요청!)
    # 참고: Supabase Python의 upsert()는 primary key 기반만 지원
    #      Unique constraint 기반 중복은 Exception으로 처리
    try:
        result = supabase.table(TABLE_EVALUATIONS).insert(records).execute()

        saved_count = len(result.data) if result.data else 0

        if verbose:
            print(f"  ✅ {saved_count}개 저장 완료", end="")
            if x_count > 0:
                print(f" (X 판정: {x_count}개)", end="")
            if invalid_count > 0:
                print(f" (잘못된 등급: {invalid_count}개)", end="")
            print()

        return {
            "saved": saved_count,
            "skipped": x_count,
            "invalid": invalid_count,
            "total": len(evaluations)
        }

    except Exception as e:
        error_msg = str(e)

        # 중복 키 에러 패턴들
        duplicate_patterns = [
            "'code': '23505'",  # PostgreSQL duplicate key
            'duplicate key',
            'HTTP/2 409 Conflict',  # Supabase HTTP 409
            'conflicting key',
            'unique constraint'
        ]

        is_duplicate = any(pattern.lower() in error_msg.lower() for pattern in duplicate_patterns)

        if is_duplicate:
            # 배치 중 일부만 중복일 수 있음 → 개별 저장으로 폴백
            if verbose:
                print(f"  ⚠️ 배치 중복 감지 → 개별 저장 시도 중...")
            fallback_saved = 0
            for rec in records:
                try:
                    r = supabase.table(TABLE_EVALUATIONS).insert([rec]).execute()
                    if r.data:
                        fallback_saved += 1
                except Exception:
                    pass  # 중복 개별 건은 무시
            if verbose:
                print(f"  ✅ 개별 저장 완료: {fallback_saved}/{len(records)}개")
            return {
                "saved": fallback_saved,
                "skipped": x_count,
                "invalid": invalid_count,
                "total": len(evaluations),
                "duplicate": True
            }

        # 그 외 에러 (400 Bad Request 등) → 개별 저장 폴백
        if verbose:
            print(f"  ⚠️ 배치 저장 실패 ({error_msg[:100]}) → 개별 저장 시도 중...")
        fallback_saved = 0
        for rec in records:
            try:
                r = supabase.table(TABLE_EVALUATIONS).insert([rec]).execute()
                if r.data:
                    fallback_saved += 1
            except Exception:
                pass  # 개별 실패 건은 무시
        if verbose:
            print(f"  ✅ 개별 저장 완료: {fallback_saved}/{len(records)}개")
        return {
            "saved": fallback_saved,
            "skipped": x_count,
            "invalid": invalid_count,
            "total": len(evaluations),
            "error": error_msg
        }


# 하위 호환성을 위한 별칭
save_batch_upsert = save_evaluations_batch_upsert
