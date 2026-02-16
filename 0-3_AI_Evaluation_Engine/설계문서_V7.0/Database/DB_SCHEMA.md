# Database Schema Reference

**최종 업데이트**: 2025-11-21
**마이그레이션 완료**: UUID → TEXT (8-10자) ID 변환 완료

---

## 📋 전체 테이블 개요

### 핵심 데이터 테이블
1. **politicians** - 정치인 기본 정보
2. **collected_data** - AI 평가 원본 데이터
3. **ai_category_scores** - 카테고리별 점수 (AI별)
4. **ai_final_scores** - 최종 점수 (AI별)
5. **ai_evaluations** - 다중 AI 종합 평가

### 연관 테이블
6. **posts** - 정치인 게시글
7. **inquiries** - 질의응답
8. **shares** - 공유 데이터
9. **politician_id_mapping** - ID 매핑 (더 이상 사용 안 함 - TEXT 타입 사용)

---

## 1️⃣ politicians 테이블

### 구조
```sql
CREATE TABLE politicians (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    party TEXT,
    position TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 제약조건
ALTER TABLE politicians ADD CONSTRAINT politicians_id_length
    CHECK (length(id) <= 10 AND length(id) > 0);
```

### ID 규칙
- **타입**: TEXT (최대 10자)
- **형식**:
  - 자동생성: 8자 해시 (예: `cd8c0263`)
  - 관리자 지정: 숫자/문자 조합 가능 (예: `10001`, `OH_001`, `V23_OH`)
- **목적**: UUID 대신 사람이 읽기 쉬운 ID 사용

### 주요 컬럼
- `id`: 정치인 고유 ID (PRIMARY KEY)
- `name`: 정치인 이름
- `party`: 소속 정당
- `position`: 직책

### 유효한 Enum 값

| 필드 | 유효값 |
|-----|-------|
| identity (신분) | 현직, 후보자, 예비후보자, 출마예정자, 출마자 |
| position_type (출마직종) | 국회의원, 광역단체장, 광역의원, 기초단체장, 기초의원, 교육감 |
| party (정당) | 더불어민주당, 국민의힘, 조국혁신당, 개혁신당, 진보당, 기본소득당, 사회민주당, 정의당, 무소속 |

---

## 2️⃣ collected_data 테이블

**Primary Key**: `collected_data_id`

### 전체 컬럼 목록:
```
- collected_data_id (PRIMARY KEY, BIGSERIAL)
- politician_id (TEXT, FK → politicians.id)
- ai_name (TEXT)
- category_name (TEXT)
- item_num (INT)
- data_title (TEXT)
- data_content (TEXT)
- data_source (TEXT)
- source_url (TEXT)
- collection_date (TIMESTAMP)
- rating (INT, -8~+8)
- rating_rationale (TEXT)
- source_type (TEXT)
```

### 중요 참고사항:
- **절대 `id`나 `item_id` 컬럼을 사용하지 마세요** - 존재하지 않습니다
- DELETE/UPDATE 작업 시 반드시 `collected_data_id`를 사용하세요
- `politician_id`는 TEXT 타입 (8-10자)
- `rating`은 -8 ~ +8 범위 (17단계)

---

## 3️⃣ ai_category_scores 테이블

### 구조
```sql
CREATE TABLE ai_category_scores (
    politician_id TEXT,
    ai_name TEXT,
    category_name TEXT,
    category_score INT,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (politician_id, ai_name, category_name),
    FOREIGN KEY (politician_id) REFERENCES politicians(id) ON DELETE CASCADE
);
```

### 주요 컬럼
- `politician_id`: 정치인 ID (TEXT)
- `ai_name`: AI 평가 주체 (예: "Claude", "ChatGPT", "Grok")
- `category_name`: 카테고리명
- `category_score`: 카테고리 점수 (20~100점)

### ⚠️ ai_name 필드 규칙
**평가 주체(AI 에이전트)를 구분하는 필드입니다. 모델명이 아닙니다!**

```python
# ✅ 올바른 값
"Claude"    # Claude 시스템 (Haiku, Sonnet, Opus 등 모든 모델)
"ChatGPT"   # ChatGPT 시스템
"Grok"      # Grok 시스템
"Gemini"    # Gemini 시스템

# ❌ 잘못된 값 (모델명 금지)
"claude-haiku-4-5-20251001"  # 금지
"gpt-4"                       # 금지
```

---

## 4️⃣ ai_final_scores 테이블

### 구조
```sql
CREATE TABLE ai_final_scores (
    politician_id TEXT,
    ai_name TEXT,
    total_score INT,
    grade_code TEXT,
    grade_name TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (politician_id, ai_name),
    FOREIGN KEY (politician_id) REFERENCES politicians(id) ON DELETE CASCADE
);
```

### 주요 컬럼
- `politician_id`: 정치인 ID (TEXT)
- `ai_name`: AI 평가 주체 (예: "Claude", "ChatGPT", "Grok")
- `total_score`: 총점 (200~1000점)
- `grade_code`: 등급 코드 (M/D/E/P/G/S/B/I)
- `grade_name`: 등급명 (매우낮음~최고)

### ⚠️ ai_name 필드 규칙
**ai_category_scores 테이블과 동일한 규칙 적용**
- "Claude", "ChatGPT", "Grok", "Gemini" 등 평가 주체명 사용
- 모델명(예: "claude-haiku-4-5-20251001") 사용 금지

---

## 5️⃣ ai_evaluations 테이블

### 구조
```sql
CREATE TABLE ai_evaluations (
    politician_id TEXT PRIMARY KEY,
    ai_count INT NOT NULL,
    avg_score INT NOT NULL,
    grade_code TEXT NOT NULL,
    grade_name TEXT NOT NULL,
    grade_emoji TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (politician_id) REFERENCES politicians(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_evaluations_avg_score ON ai_evaluations(avg_score DESC);
```

### 주요 컬럼
- `politician_id`: 정치인 ID (TEXT, PRIMARY KEY)
- `ai_count`: 참여 AI 개수
- `avg_score`: 평균 점수
- `grade_code`: 종합 등급 코드
- `grade_name`: 종합 등급명
- `grade_emoji`: 등급 이모지

---

## 6️⃣ posts 테이블

### 구조
```sql
CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    politician_id TEXT,
    title TEXT,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (politician_id) REFERENCES politicians(id) ON DELETE CASCADE
);
```

### 주요 컬럼
- `politician_id`: 정치인 ID (TEXT, FK)

---

## 7️⃣ inquiries 테이블

### 구조
```sql
CREATE TABLE inquiries (
    id BIGSERIAL PRIMARY KEY,
    politician_id TEXT,
    politician_name TEXT,
    question TEXT,
    answer TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (politician_id) REFERENCES politicians(id) ON DELETE CASCADE
);
```

### 주요 컬럼
- `politician_id`: 정치인 ID (TEXT, FK)

---

## 8️⃣ shares 테이블

### 구조
```sql
CREATE TABLE shares (
    id BIGSERIAL PRIMARY KEY,
    politician_id TEXT,
    share_type TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (politician_id) REFERENCES politicians(id) ON DELETE CASCADE
);
```

### 주요 컬럼
- `politician_id`: 정치인 ID (TEXT, FK)

---

## 9️⃣ politician_id_mapping 테이블

### 구조
```sql
CREATE TABLE politician_id_mapping (
    integer_id INT PRIMARY KEY,
    name TEXT,
    uuid_id TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (uuid_id) REFERENCES politicians(id) ON DELETE CASCADE
);
```

### 주요 컬럼
- `integer_id`: 레거시 정수 ID
- `name`: 정치인 이름
- `uuid_id`: 변환된 TEXT ID (8자)

---

## 📌 삭제된 테이블

다음 테이블들은 2025-11-21 정리 작업에서 삭제되었습니다:
- ~~`ai_item_scores`~~ - 항목별 점수 (사용 안 함)
- ~~`ai_scores`~~ - 레거시 점수 테이블 (사용 안 함)

---

## 🔄 마이그레이션 히스토리

### 2025-11-21: UUID → TEXT ID 변환
**변경된 테이블**: politicians, posts, inquiries, shares, politician_id_mapping

**변경 내용**:
- `politicians.id`: UUID(36자) → TEXT(8자)
- `posts.politician_id`: TEXT (8-char hex)
- `inquiries.politician_id`: TEXT (8-char hex)
- `shares.politician_id`: TEXT (8-char hex)
- `politician_id_mapping`: 더 이상 사용 안 함

**마이그레이션 스크립트**: `sql/migrate_all_tables_final.sql`

### 2025-11-21: 트리거 삭제 (컬럼명 불일치 문제)
**삭제된 트리거**:
- `trg_calculate_ai_final_score` (on ai_category_scores)
- `trg_update_combined_score` (on ai_final_scores)

**삭제 이유**:
- 트리거가 `final_score` 컬럼을 참조하지만 실제 테이블은 `total_score` 사용
- 데이터 저장 시 "column final_score does not exist" 에러 발생

**해결책**:
- 트리거 삭제 후 수동으로 점수 계산 및 저장
- 추후 필요 시 `total_score` 컬럼명에 맞춰 트리거 재생성 가능

---

## ⚠️ 주의사항

### collected_data 테이블 작업 시
```python
# ✅ 올바른 예시
result = supabase.table('collected_data').select('collected_data_id, item_num')
supabase.table('collected_data').delete().eq('collected_data_id', delete_id)

# ❌ 잘못된 예시 - 절대 사용 금지!
result = supabase.table('collected_data').select('id, item_num')  # 에러!
supabase.table('collected_data').delete().eq('id', delete_id)  # 에러!
supabase.table('collected_data').delete().eq('item_id', delete_id)  # 에러!
```

### politician_id 사용 시
```python
# ✅ TEXT 타입으로 처리
politician_id = "10001"  # 문자열
politician_id = "cd8c0263"  # 8자 해시

# ❌ UUID 타입 사용 금지
politician_id = "cd8c0263"  # TEXT 타입 (8-char hex) 사용
```

---

## 📊 테이블 관계도

```
politicians (id: TEXT)
    ├── collected_data (politician_id: TEXT)
    ├── ai_category_scores (politician_id: TEXT)
    ├── ai_final_scores (politician_id: TEXT)
    ├── ai_evaluations (politician_id: TEXT)
    ├── posts (politician_id: TEXT)
    ├── inquiries (politician_id: TEXT)
    ├── shares (politician_id: TEXT)
    └── politician_id_mapping (uuid_id: TEXT)
```

모든 외래 키는 `ON DELETE CASCADE` 설정됨
