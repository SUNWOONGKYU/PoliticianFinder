# PoliticianFinder AI Evaluation Engine V2.0 - 실행 가이드

**작성일**: 2025-10-26
**버전**: 2.0

---

## 📋 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [설치 방법](#설치-방법)
3. [Supabase 설정](#supabase-설정)
4. [데이터 수집 실행](#데이터-수집-실행)
5. [결과 확인](#결과-확인)
6. [트러블슈팅](#트러블슈팅)

---

## 🖥️ 시스템 요구사항

- **Python**: 3.10 이상
- **Supabase**: 프로젝트 계정 필요
- **Anthropic API**: Claude API 키 필요
- **메모리**: 최소 2GB RAM
- **네트워크**: 인터넷 연결 필수

---

## 📦 설치 방법

### 1. 저장소 클론
```bash
cd "G:\내 드라이브\Developement\PoliticianFinder\Developement_Real_PoliticianFinder\AI_Evaluation_Engine_V2.0"
```

### 2. Python 패키지 설치
```bash
pip install -r requirements.txt
```

### 3. 환경 변수 설정
```bash
# .env.example을 .env로 복사
cp .env.example .env

# .env 파일 편집
nano .env
```

**.env 파일 내용:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

---

## 🗄️ Supabase 설정

### 1. Supabase 프로젝트 생성
1. https://supabase.com 접속
2. 새 프로젝트 생성
3. Project URL과 Service Key 복사

### 2. 스키마 설치
```bash
# Supabase SQL Editor에서 실행
# sql/schema.sql 파일 내용 전체 복사 & 실행
```

**또는 Supabase CLI 사용:**
```bash
supabase db push sql/schema.sql
```

### 3. 설치 확인
```sql
-- 테이블 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- 예상 결과:
-- politicians
-- collected_data
-- ai_item_scores
-- ai_category_scores
-- ai_final_scores
-- combined_final_scores
```

---

## 🚀 데이터 수집 실행

### 1. 기본 실행
```bash
python src/data_collector.py
```

### 2. 실행 과정
```
1. 테스트 정치인 3명 등록:
   - 이재명 (경기도지사)
   - 오세훈 (서울특별시장)
   - 김동연 (경기도지사)

2. 각 정치인별로:
   - 10개 분야 병렬 수집 (서브 에이전트)
   - 분야당 10개 항목 수집
   - 항목당 최소 10개 데이터 수집 목표
   - 총 100개 항목 × 10개 = 1,000개 데이터 목표

3. 자동 점수 계산:
   - Bayesian Prior 7.0 적용
   - 항목 점수 → 분야 점수 → 최종 점수
   - 8단계 등급 자동 부여
```

### 3. 예상 소요 시간
```
정치인 1명당:
- 순차 처리: 약 50분 (100개 항목 × 30초)
- 병렬 처리: 약 5분 (10개 분야 병렬)

총 3명:
- 약 15분 소요 (병렬 처리 기준)
```

---

## 📊 결과 확인

### 1. 콘솔 출력
```
============================================================
📊 이재명 평가 결과
============================================================

종합 점수: 75.3점
등급: 🥇 Gold (G)
평가 AI: 1개

AI별 상세:
  Claude: 75.3점 🥇 Gold
    분야: 10/10, 항목: 100/100, 데이터: 523개

============================================================
```

### 2. Supabase 데이터베이스 확인

**종합 순위 조회:**
```sql
SELECT * FROM v_combined_rankings;
```

**AI별 점수 상세:**
```sql
SELECT * FROM v_ai_scores_detail
WHERE name = '이재명';
```

**분야별 점수:**
```sql
SELECT * FROM v_ai_category_details
WHERE name = '이재명' AND ai_name = 'Claude'
ORDER BY category_num;
```

**항목별 점수:**
```sql
SELECT * FROM v_ai_item_details
WHERE name = '이재명' AND ai_name = 'Claude'
ORDER BY category_num, item_num;
```

**데이터 수집 현황:**
```sql
SELECT * FROM v_data_collection_status
WHERE name = '이재명'
ORDER BY category_num, item_num;
```

### 3. 예상 결과 예시

**정치인별 점수 분포 (예상):**
```
이재명: 72~78점 (Gold ~ Platinum)
오세훈: 70~76점 (Gold ~ Platinum)
김동연: 68~74점 (Gold ~ Platinum)
```

**초기 데이터 수집 특성:**
- 대부분 항목: 5~15개 데이터 수집
- 일부 항목: 1~4개 (데이터 부족)
- 소수 항목: 0개 (데이터 없음 → Prior 7.0 사용)

---

## 🔧 트러블슈팅

### 문제 1: Supabase 연결 오류
```
Error: Unable to connect to Supabase
```

**해결:**
```bash
# .env 파일 확인
cat .env

# SUPABASE_URL과 SUPABASE_SERVICE_KEY가 올바른지 확인
# Service Key는 anon key가 아닌 service_role key 사용
```

### 문제 2: Anthropic API 오류
```
Error: Invalid API key
```

**해결:**
```bash
# API 키 확인
# https://console.anthropic.com/settings/keys

# .env 파일 업데이트
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 문제 3: 데이터 수집이 너무 느림
```
30분 지나도 진행 안됨
```

**해결:**
```python
# src/data_collector.py 수정
MIN_DATA_PER_ITEM = 5  # 10 → 5로 변경 (빠른 테스트)
MAX_ATTEMPTS_PER_ITEM = 10  # 20 → 10으로 변경
```

### 문제 4: JSON 파싱 오류
```
Error: Invalid JSON response from AI
```

**원인:**
- Claude가 JSON 형식을 올바르게 생성하지 못함

**해결:**
- 프롬프트 개선 필요 (자동 재시도됨)
- 정상 작동: 실패한 항목은 건너뛰고 계속 진행

### 문제 5: DB 트리거가 점수 계산 안함
```
ai_final_scores 테이블이 비어있음
```

**해결:**
```sql
-- 트리거 확인
SELECT * FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- 없으면 schema.sql 재실행
-- sql/schema.sql 전체 복사 & 실행

-- 강제 재계산
SELECT recalculate_all_scores();
```

---

## 📈 다음 단계

### Phase 1 완료 후:
1. ✅ 3명 정치인 데이터 수집 완료
2. ✅ 점수 산출 확인
3. ✅ 8단계 등급 확인

### Phase 2: 확장
1. 정치인 추가 (10명 → 50명 → 100명)
2. 다른 AI 추가 (ChatGPT, Gemini, Grok, Perplexity)
3. 자동 재수집 시스템 구축
4. 웹 UI 연동

---

## 🎯 핵심 철학

### "시간이 지나면 데이터가 쌓이고, 진실로 수렴한다"

- **초기 (0~6개월)**: 데이터 부족, 왜곡 ±2점 (받아들임)
- **중기 (6개월~1년)**: 데이터 증가, 왜곡 ±1점 (정확도 향상)
- **장기 (1년 이상)**: 충분한 데이터, 왜곡 ±0.5점 (진실 수렴)

---

**작성일**: 2025-10-26
**버전**: 2.0
**상태**: ✅ 실행 준비 완료

**작성자**: PoliticianFinder 개발팀

**문의**: issues@politicianfinder.kr
