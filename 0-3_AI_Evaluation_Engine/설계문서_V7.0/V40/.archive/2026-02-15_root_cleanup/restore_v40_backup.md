# V40 테이블/데이터 복원 가이드

## 상황
- V40 테이블이 실수로 DROP됨
- 조은희 평가 데이터 포함 모든 데이터 손실

## 복원 방법

### 1. 테이블 구조 복원 (필수)

**Supabase Dashboard → SQL Editor:**

```sql
-- V40/Database/create_v40_tables.sql 전체 내용 복사/붙여넣기 실행
```

또는:

```bash
cd V40/Database
# SQL 파일이 준비되어 있음
```

### 2. 데이터 복원 (PITR 사용)

**Supabase Pro 이상 플랜인 경우:**

#### 방법 A: Dashboard에서 복원

1. Supabase Dashboard 접속
2. Project Settings → Database → Backups
3. Point-in-Time Recovery 섹션
4. 테이블 삭제 이전 시점 선택 (예: 1시간 전)
5. Restore 클릭

#### 방법 B: CLI로 복원

```bash
# Supabase CLI 설치 (없는 경우)
npm install -g supabase

# 프로젝트 링크
supabase link --project-ref ooddlafwdpzgxfefgsrx

# 특정 시점으로 복원
supabase db restore --timestamp "2026-02-10T15:00:00Z"
```

**복원 가능 시간:**
- Pro 플랜: 최근 7일
- Team 플랜: 최근 14일
- Enterprise: 커스텀

### 3. Free 플랜인 경우 (PITR 없음)

데이터 복원 불가능. 대안:

1. **테이블만 재생성**
2. **데이터 재수집 시작**
   - 조은희부터 다시 수집
   - 박주민 등 다른 정치인도 재수집

### 4. 백업 확인

```python
# check_backup.py
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

# 백업 정보 확인 (REST API로 확인 불가, Dashboard 사용 필요)
print("Supabase Dashboard → Settings → Database → Backups에서 확인")
```

## 즉시 실행

### A. 테이블 복원 (지금 바로)

```bash
cd C:\Development_PoliticianFinder_com\Developement_Real_PoliticianFinder\0-3_AI_Evaluation_Engine\설계문서_V7.0\V40

# 1. Supabase Dashboard 열기
start https://supabase.com/dashboard/project/ooddlafwdpzgxfefgsrx

# 2. SQL Editor에서 실행
# Database/create_v40_tables.sql 파일 내용 복사/붙여넣기
```

### B. 데이터 복원 (PITR 가능 시)

Supabase Dashboard:
```
Settings → Database → Backups → Point-in-Time Recovery
→ 테이블 삭제 이전 시점 선택 → Restore
```

## 향후 방지책

### 1. 데이터 삭제 시 명확한 지시

**❌ 잘못된 요청:**
```
"V40 데이터 삭제해줘"
→ 테이블까지 삭제될 위험
```

**✅ 올바른 요청:**
```
"collected_data_v40, evaluations_v40, scores_v40 테이블의 레코드만 DELETE.
테이블 구조는 유지. DROP TABLE 절대 금지."
```

### 2. 백업 자동화

```sql
-- 정기 백업 스크립트
-- (Supabase는 자동 백업하지만, 수동 백업도 가능)

-- 특정 정치인 데이터만 백업
CREATE TABLE collected_data_v40_backup_20260210 AS
SELECT * FROM collected_data_v40;
```

### 3. 삭제 전 확인

```python
# 삭제 전 반드시 확인
print("삭제 예정:")
print(f"- 테이블: {table_name}")
print(f"- 레코드 수: {count}")
print("테이블 구조는 유지")

confirm = input("계속? (yes): ")
if confirm != "yes":
    exit()
```

## 긴급 연락처

Supabase Support (유료 플랜):
- Dashboard → Support
- 복원 지원 요청 가능
