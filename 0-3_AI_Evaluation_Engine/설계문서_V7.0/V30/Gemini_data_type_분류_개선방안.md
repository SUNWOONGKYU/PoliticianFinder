# Gemini data_type 분류 오류 개선 방안

**작성일**: 2026-01-21
**목적**: Gemini 수집 시 OFFICIAL/PUBLIC 분류 오류 방지

---

## 🚨 발견된 문제

### 문제 상황 (2026-01-18 조은희 수집)

```
기대값:
- Gemini 76개 수집
- OFFICIAL: ~38개 (50%)
- PUBLIC: ~38개 (50%)

실제값:
- Gemini 76개 수집
- OFFICIAL: 0개 (0%) ← ❌ 문제!
- PUBLIC: 76개 (100%) ← ❌ 전부 PUBLIC으로 잘못 분류
```

**결과**: 데이터 무효화 → 전체 재수집 필요

---

## 🔍 원인 분석

### 1. JSON 출력 형식에 data_type 필드 누락

**현재 프롬프트** (collect_v30.py Line 686-696):
```python
## JSON 출력 형식
```json
[
  {
    "title": "제목 (20자 이내)",
    "content": "내용 (100-300자)",
    "source": "출처명",
    "source_url": "https://...",
    "date": "YYYY-MM-DD",
    "sentiment": "positive/negative/neutral"  # ← data_type 없음!
  }
]
```
```

**문제점**:
- ❌ data_type 필드가 JSON 형식에 없음
- ❌ AI가 data_type을 반환하지 않음
- ❌ 기본값 'public'으로 저장됨 (추정)

### 2. OFFICIAL vs PUBLIC 구분 기준 불명확

**현재 프롬프트** (collect_v30.py Line 674):
```python
- 유형: OFFICIAL  # 또는 PUBLIC
```

**문제점**:
- ❌ "OFFICIAL"이라는 단어만 표시
- ❌ 무엇이 OFFICIAL인지 설명 없음
- ❌ 무엇이 PUBLIC인지 설명 없음
- ❌ 구분 기준이 모호함

### 3. Gemini 역할 설명 불충분

**현재 프롬프트** (collect_v30.py Line 611-622):
```python
elif ai_name == "Gemini":
    role_desc = "한국 콘텐츠 전문 (뉴스, SNS, 블로그, 커뮤니티)로 수집합니다."
    search_instruction = """
수집 대상 (한국 콘텐츠 특화):
1. 한국 언론: 조선일보, 중앙일보...
2. 한국 SNS: YouTube, Instagram...
3. 한국 커뮤니티: 나무위키, 디시인사이드...
4. 한국 위키피디아 (한글)
"""
```

**문제점**:
- ❌ OFFICIAL 데이터 수집 방법 없음
- ❌ PUBLIC 데이터만 언급됨
- ❌ data_type 구분 지침 없음

---

## ✅ 개선 방안

### 1. JSON 출력 형식에 data_type 필드 추가

**개선 후**:
```python
## JSON 출력 형식
```json
[
  {
    "title": "제목 (20자 이내)",
    "content": "내용 (100-300자)",
    "source": "출처명",
    "source_url": "https://...",
    "date": "YYYY-MM-DD",
    "data_type": "OFFICIAL 또는 PUBLIC (필수!)",  # ← 추가!
    "sentiment": "positive/negative/neutral"
  }
]
```

⚠️ data_type 필드 필수!
- 현재 수집 중인 유형({data_type.upper()})을 그대로 사용하세요
- 절대 변경하지 마세요!
```

### 2. OFFICIAL vs PUBLIC 명확한 구분 기준 제시

**개선 후**:
```python
## 📋 데이터 유형 구분 (매우 중요!)

현재 수집 유형: {data_type.upper()}

### OFFICIAL 데이터란?
✅ 객관적으로 확인 가능한 공식 활동/기록
- 국회 의정활동: 법안 발의, 국정감사, 위원회 질의, 대정부질문
- 공식 발표: 기자회견, 성명서, 공약, 정책 제안
- 공적 기록: 경력, 학력, 수상, 임명, 선거 이력
- 정당 활동: 당직, 공식 행사, 당론 발표

📍 핵심: 누가 수집해도 내용이 동일한 '사실'
📍 출처: .go.kr, assembly.go.kr, 정당 공식 사이트, 공식 활동 보도

### PUBLIC 데이터란?
✅ 의견, 평가, 여론, 분석이 포함된 콘텐츠
- 뉴스 기사: 정치인에 대한 언론 보도 및 해석
- 전문가 평가: 칼럼, 사설, 논평
- 여론/반응: SNS 반응, 커뮤니티 의견, 블로그 분석
- 인터뷰: 정치인 또는 제3자 인터뷰

📍 핵심: 출처마다 시각이 다를 수 있는 '의견/평가'
📍 출처: 뉴스, 블로그, SNS, 커뮤니티, 칼럼

⚠️ 현재 유형이 {data_type.upper()}이므로,
   모든 결과의 data_type은 "{data_type.upper()}"이어야 합니다!
```

### 3. Gemini 역할 설명 개선 (data_type 별 지침)

**개선 후**:
```python
elif ai_name == "Gemini":
    role_desc = "Google Search 기반 한국 콘텐츠 전문 수집 (OFFICIAL + PUBLIC 모두 담당)"

    if data_type == "official":
        search_instruction = """
## OFFICIAL 데이터 수집 지침

### 우선 검색 대상:
1. 국회 사이트 (.go.kr):
   - 의안정보시스템: 법안 발의, 처리 상태
   - 국회의원 프로필: 경력, 학력, 위원회 활동
   - 국정감사/조사: 질의 내용, 지적 사항

2. 정부/공공기관 (.go.kr):
   - 정부 보도자료
   - 공공기관 발표 자료
   - 공식 행사 기록

3. 정당 공식 사이트:
   - 당직 정보
   - 공식 활동 내역
   - 당론 발표

4. OFFICIAL 활동을 보도한 뉴스:
   - "의원 법안 발의" 뉴스 → ✅ OFFICIAL
   - "국정감사에서 질의" 뉴스 → ✅ OFFICIAL
   - 공식 활동 '사실' 중심 보도 → ✅ OFFICIAL

### Google Search 전략:
- site:assembly.go.kr {politician_name} 법안
- site:xxx.go.kr {politician_name} 보도자료
- "{politician_name} 의정활동"
- "{politician_name} 법안 발의"
- "{politician_name} 국정감사"

### ⚠️ 주의사항:
- OFFICIAL은 '사실'만 수집
- 의견/평가가 포함된 기사는 제외
- .go.kr 도메인 우선 검색
"""
    else:  # public
        search_instruction = """
## PUBLIC 데이터 수집 지침

### 우선 검색 대상:
1. 한국 언론사:
   - 종합지: 조선일보, 중앙일보, 동아일보, 한겨레, 경향신문
   - 방송사: KBS, MBC, SBS, JTBC
   - 통신사: 연합뉴스, 뉴시스

2. 한국 SNS:
   - YouTube: 한국 정치 채널, 뉴스 채널
   - Instagram: 정치인 계정, 뉴스 계정
   - 네이버 블로그: 정치 블로거, 전문가 칼럼

3. 한국 커뮤니티:
   - 나무위키: 정치인 문서
   - 디시인사이드: 정치 갤러리
   - 클리앙: 정치 게시판
   - 오늘의유머: 정치 게시판

### Google Search 전략:
- "{politician_name} 뉴스" site:chosun.com
- "{politician_name} 평가" site:hani.co.kr
- "{politician_name} 여론" site:dcinside.com
- "{politician_name}" site:youtube.com

### ⚠️ 주의사항:
- PUBLIC은 '의견/평가/여론' 수집
- 순수 사실만 있는 보도는 제외 (그건 OFFICIAL)
- 다양한 출처에서 수집
"""
```

### 4. 응답 검증 로직 추가

**collect_v30.py에 추가**:
```python
def validate_collected_data(data, expected_data_type):
    """수집된 데이터 검증"""
    if not data:
        return True  # 빈 배열은 통과

    errors = []

    for idx, item in enumerate(data):
        # 1. data_type 필드 존재 확인
        if 'data_type' not in item:
            errors.append(f"항목 {idx+1}: data_type 필드 누락")
            continue

        # 2. data_type 값 검증
        item_type = item['data_type'].lower()
        expected_type = expected_data_type.lower()

        if item_type != expected_type:
            errors.append(
                f"항목 {idx+1}: data_type 불일치 "
                f"(기대: {expected_type}, 실제: {item_type})"
            )

    if errors:
        print(f"\n⚠️ 데이터 검증 실패:")
        for error in errors:
            print(f"  - {error}")
        return False

    return True

# 수집 함수에서 사용
def collect_for_category_item(...):
    # ... 기존 코드 ...

    # AI 호출
    collected = call_ai_with_prompt(client, prompt, ai_name, data_type)

    # 검증 추가!
    if not validate_collected_data(collected, data_type):
        print(f"❌ {ai_name} 응답 검증 실패: data_type 불일치")
        return []

    # ... DB 저장 ...
```

### 5. 수집 후 자동 검증 스크립트

**새 파일: verify_collection.py**
```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V30 수집 데이터 자동 검증 스크립트
수집 완료 후 즉시 실행하여 data_type 분포 확인
"""

import os
import sys
from collections import Counter
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

def verify_politician_collection(politician_id):
    """정치인별 수집 데이터 검증"""

    supabase = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    )

    # 전체 데이터 조회
    response = supabase.table('collected_data_v30') \
        .select('collector_ai, data_type, category') \
        .eq('politician_id', politician_id) \
        .execute()

    if not response.data:
        print(f"❌ 데이터 없음: politician_id={politician_id}")
        return False

    total = len(response.data)

    # AI별 data_type 분포
    print(f"\n📊 수집 데이터 검증: {total}개")
    print("=" * 60)

    ai_counter = Counter([item['collector_ai'] for item in response.data])

    for ai_name in ['Gemini', 'Perplexity', 'Grok']:
        ai_items = [item for item in response.data if item['collector_ai'] == ai_name]
        if not ai_items:
            continue

        type_counter = Counter([item['data_type'] for item in ai_items])
        official_count = type_counter.get('official', 0)
        public_count = type_counter.get('public', 0)

        print(f"\n{ai_name}: {len(ai_items)}개")
        print(f"  - OFFICIAL: {official_count}개 ({official_count/len(ai_items)*100:.1f}%)")
        print(f"  - PUBLIC: {public_count}개 ({public_count/len(ai_items)*100:.1f}%)")

        # Gemini 검증 (75% = OFFICIAL 50 + PUBLIC 25)
        if ai_name == "Gemini":
            # 카테고리당 75개 × 10개 = 750개 기대
            expected_total = 750
            expected_official = 500  # 카테고리당 50개
            expected_public = 250    # 카테고리당 25개

            official_ratio = official_count / len(ai_items)
            public_ratio = public_count / len(ai_items)

            # 50-25 비율 확인 (오차 ±5%)
            if not (0.60 <= official_ratio <= 0.72):  # ~66.7%
                print(f"  ⚠️ OFFICIAL 비율 이상: {official_ratio*100:.1f}% (기대: 66.7%)")
                return False

            if not (0.28 <= public_ratio <= 0.40):  # ~33.3%
                print(f"  ⚠️ PUBLIC 비율 이상: {public_ratio*100:.1f}% (기대: 33.3%)")
                return False

            print(f"  ✅ 비율 정상 (OFFICIAL:PUBLIC = 2:1)")

        # Perplexity 검증 (25% = PUBLIC 25만)
        elif ai_name == "Perplexity":
            if official_count > 0:
                print(f"  ❌ OFFICIAL 데이터 발견: {official_count}개 (기대: 0개)")
                return False
            print(f"  ✅ PUBLIC만 수집 (OFFICIAL 없음)")

    print("\n" + "=" * 60)
    print("✅ 모든 검증 통과")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python verify_collection.py <politician_id>")
        sys.exit(1)

    politician_id = sys.argv[1]
    success = verify_politician_collection(politician_id)
    sys.exit(0 if success else 1)
```

---

## 📋 적용 체크리스트

### collect_v30.py 수정
- [ ] JSON 출력 형식에 data_type 필드 추가
- [ ] OFFICIAL vs PUBLIC 구분 기준 명시
- [ ] Gemini data_type별 지침 추가
- [ ] validate_collected_data() 함수 추가
- [ ] 수집 함수에서 검증 호출

### 새 파일 생성
- [ ] verify_collection.py 생성
- [ ] 실행 권한 부여
- [ ] .gitignore 확인

### 테스트
- [ ] 소규모 테스트 (1개 카테고리)
- [ ] data_type 분포 확인
- [ ] verify_collection.py 실행
- [ ] 검증 통과 확인

### 문서 업데이트
- [ ] V30_기본방침.md 업데이트
- [ ] V30_전체_프로세스_가이드.md 업데이트
- [ ] README.md에 검증 절차 추가

---

## 🎯 기대 효과

### Before (문제 상황)
```
Gemini 수집 → data_type 전부 'public' → 재수집 필요 → 시간 낭비
```

### After (개선 후)
```
Gemini 수집 → data_type 자동 검증 → 오류 즉시 발견 → 즉시 재시도 → 시간 절약
```

### 예방 효과
- ✅ data_type 필드 누락 방지
- ✅ OFFICIAL/PUBLIC 혼동 방지
- ✅ 수집 직후 오류 발견
- ✅ 재작업 최소화

---

**작성**: Claude Code
**참고**: DATA_CORRUPTION_REPORT.md (2026-01-20)
**위치**: `0-3_AI_Evaluation_Engine/설계문서_V7.0/V30/Gemini_data_type_분류_개선방안.md`
