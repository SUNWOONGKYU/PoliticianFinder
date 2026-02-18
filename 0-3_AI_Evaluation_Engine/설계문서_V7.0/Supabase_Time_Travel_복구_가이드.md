# Supabase Time Travel 복구 가이드

**목적**: validate_v30.py가 946개 데이터를 잘못 삭제함 → 복구 필요

---

## 1. Supabase Dashboard 접속

**URL**: https://supabase.com/dashboard

1. 로그인
2. **PoliticianFinder 프로젝트** 선택

---

## 2. Backups 메뉴 이동

### 경로:
```
Dashboard → Database → Backups
```

또는:

```
Dashboard 왼쪽 메뉴 → Database 아이콘 → Backups 탭
```

---

## 3. Point-in-Time Recovery 확인

### Pro 플랜 확인:
- **Pro 플랜**: Point-in-Time Recovery (PITR) 가능 ✅
- **Free 플랜**: Daily backups만 가능 (정확한 시점 복구 불가)

### PITR 가능 시:

**복구 시점 선택:**
- **검증 실행 시각**: 약 20:00 ~ 21:00 (한국 시간)
- **복구 목표 시점**: **검증 실행 직전** (예: 19:50 또는 20:00 직전)

---

## 4. 복구 절차 (Pro 플랜)

### 방법 1: Point-in-Time Recovery (권장)

1. **Backups 페이지에서 "Point in Time" 버튼 클릭**

2. **복구 시점 선택:**
   ```
   Date: 2026-01-27
   Time: 19:50 UTC (한국 시간 20:50 기준 약 1시간 전)
   ```

3. **테이블 선택:**
   ```
   Table: collected_data_v30
   ```

4. **Preview Changes (선택사항):**
   - 복구될 데이터 미리보기

5. **Restore 버튼 클릭**

6. **복구 대기:**
   - 소요 시간: 약 5-10분
   - 진행 상황 표시됨

---

## 5. 복구 후 확인

### Python 스크립트로 확인:

```bash
cd C:\Development_PoliticianFinder_com\Developement_Real_PoliticianFinder\0-3_AI_Evaluation_Engine\설계문서_V7.0

python check_total_status.py
```

**기대 결과:**
```
전체: 1002/1000 ✅

AI별:
  Gemini:     752/750 ✅
  Perplexity: 250/250 ✅
```

만약 56개만 나오면 → 복구 실패 또는 다른 방법 필요

---

## 6. Free 플랜인 경우

### Daily Backups 사용:

1. **Backups 페이지 → Daily Backups 탭**

2. **최신 백업 선택:**
   ```
   날짜: 2026-01-27 또는 그 이전
   ```

3. **Restore 클릭**

**주의:**
- Daily backup은 **하루 전 자정(UTC)** 시점으로만 복구 가능
- 오늘 수집한 데이터가 포함되지 않을 수 있음

---

## 7. Time Travel 불가능한 경우

다음 두 가지 옵션:

### 옵션 A: 재수집 (확실)
```bash
cd V30/scripts

# Gemini 재수집 (738개, 약 1-1.5시간)
python collect_v30.py --politician_id=d0a5d6e1 --politician_name="조은희" --ai=Gemini

# Perplexity 재수집 (208개, 약 30-45분)
python collect_v30.py --politician_id=d0a5d6e1 --politician_name="조은희" --ai=Perplexity
```

### 옵션 B: 부분 재수집 (빠름)
```bash
# 부족분만 재수집
python collect_v30.py --politician_id=d0a5d6e1 --politician_name="조은희" --target=946
```

---

## 8. 복구 후 다음 단계

### 검증 스크립트 수정 필요!

**문제:**
- `validate_event_date.py`가 너무 엄격
- 정상 데이터를 "과거 사건"으로 오판하여 삭제

**해결:**
1. **검증 스크립트 수정** (validate_v30.py)
2. 또는 **검증 건너뛰고 바로 평가**

---

## 현재 시각 기준 정보

**검증 실행 시각**: 약 20:00 ~ 21:00 (2026-01-27)
**복구 목표**: 검증 실행 직전 (19:50 ~ 20:00)

**Supabase 시각은 UTC 기준:**
- 한국 시간 20:00 = UTC 11:00
- 한국 시간 19:50 = UTC 10:50

---

## 문의 및 지원

**Supabase Time Travel이 보이지 않으면:**
- Free 플랜일 가능성 높음
- Pro 플랜 업그레이드 필요 (월 $25)
- 또는 재수집 진행

**복구 후 결과를 알려주세요:**
- 복구 성공 → 검증 없이 평가 진행
- 복구 실패 → 재수집 진행
