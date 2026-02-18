# Supabase Pro PITR 복구 가이드

**긴급 복구 필요!**
- 삭제된 데이터: 946개
- 현재 남은 데이터: 56개
- 삭제 시각: 확인 필요

---

## 🚨 즉시 실행: Dashboard 복구

### 1단계: Supabase Dashboard 접속

```
https://supabase.com/dashboard/project/ooddlafwdpzgxfefgsrx
```

### 2단계: Backups 메뉴 이동

```
왼쪽 메뉴 → Settings → Database → Backups (또는 Point in Time Recovery)
```

### 3단계: 복구 시점 선택

**삭제가 일어난 시각 확인:**

현재 시각: 2026-01-27 (오늘)

**복구할 시점:**
- 검증 스크립트 실행 전 (오늘 오전?)
- 1002개 수집 완료 직후

**백업 보관 기간:**
- Supabase Pro: 최대 7일

### 4단계: 복구 실행

**옵션 1: 전체 데이터베이스 복구 (권장 ❌)**
- 위험: 다른 테이블도 덮어씌움
- 실행 전 현재 상태 백업 필수

**옵션 2: 특정 테이블만 복구 (권장 ✅)**

```sql
-- 1. 백업에서 임시 테이블로 복구
-- (Dashboard에서 특정 시점 선택 → 별도 프로젝트로 복구)

-- 2. 데이터 추출
SELECT * FROM collected_data_v30
WHERE politician_id = 'd0a5d6e1';

-- 3. 현재 프로젝트로 복사
INSERT INTO collected_data_v30 (...)
SELECT ... FROM <복구된_데이터>;
```

---

## 📋 Dashboard에서 확인할 내용

### 백업 존재 여부
- [ ] Daily backups 활성화?
- [ ] PITR 활성화?
- [ ] 보관 기간: 7일?

### 복구 가능 시점
- [ ] 오늘 00:00 백업?
- [ ] 삭제 전 시각 백업?
- [ ] 수집 완료 시점 백업?

---

## 🔍 삭제 시각 추정

**검증 로그 확인:**

```bash
# 검증 스크립트 실행 시각 확인
ls -lh /c/Users/home/AppData/Local/Temp/claude/C--Development-PoliticianFinder-com-Developement-Real-PoliticianFinder-0-3-AI-Evaluation-Engine------V7-0/tasks/bcf00d0.output
```

**결과:**
```
# 파일 수정 시각 = 검증 실행 시각
# 이 시각 '직전'으로 복구하면 됨
```

---

## ⚡ 빠른 복구 프로세스

### 방법 A: Dashboard UI 사용 (가장 쉬움)

1. Dashboard → Settings → Database
2. "Point in Time Recovery" 클릭
3. 슬라이더로 시점 선택 (검증 실행 전)
4. "Restore" 클릭
5. 확인 대화상자에서 "Restore" 재확인

**주의:**
- 전체 데이터베이스가 해당 시점으로 롤백됨
- 복구 후 데이터는 복구 시점 이후 모든 변경사항 사라짐
- 56개 데이터도 사라질 수 있음 (복구 시점에 없었다면)

### 방법 B: 별도 프로젝트로 복구 (안전)

1. 새 Supabase 프로젝트 생성 (임시)
2. 백업에서 해당 프로젝트로 복구
3. SQL로 데이터 추출:
   ```sql
   COPY (
     SELECT * FROM collected_data_v30
     WHERE politician_id = 'd0a5d6e1'
   ) TO '/tmp/backup.csv' WITH CSV HEADER;
   ```
4. 원본 프로젝트로 다시 임포트

---

## 🎯 지금 당장 할 것

1. **Supabase Dashboard 열기**
   ```
   https://supabase.com/dashboard/project/ooddlafwdpzgxfefgsrx/settings/database
   ```

2. **Backups 탭 확인**
   - PITR 활성화 여부
   - 백업 목록 확인
   - 복구 가능 시점 확인

3. **삭제 시각 확인**
   ```bash
   stat /c/Users/home/AppData/Local/Temp/claude/C--Development-PoliticianFinder-com-Developement-Real-PoliticianFinder-0-3-AI-Evaluation-Engine------V7-0/tasks/bcf00d0.output
   ```

4. **즉시 보고**
   - PITR 활성화되어 있나요?
   - 백업이 몇 개나 보이나요?
   - 삭제 시각은 언제인가요?

---

## 🚨 중요 참고

**Supabase Pro PITR:**
- 활성화되어 있어야 사용 가능
- 활성화 전 데이터는 복구 불가능
- 비용: $100/month (Pro 플랜 포함)

**복구 전 확인:**
- 현재 56개 데이터 백업 먼저!
- 복구 후 손실될 수 있음

**복구 불가능한 경우:**
- PITR 비활성화
- 백업 보관 기간 초과 (7일)
- Pro 플랜 아님 (확인 필요)

---

**즉시 Dashboard 확인하세요!**

https://supabase.com/dashboard/project/ooddlafwdpzgxfefgsrx/settings/database
