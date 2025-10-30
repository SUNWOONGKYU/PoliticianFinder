# Supabase 연동 가이드 V4.0

**PROJECT GRID를 Supabase에 연동하여 웹 기반으로 관리하는 방법**

---

## 📋 목차

1. [개요](#개요)
2. [Supabase 프로젝트 생성](#supabase-프로젝트-생성)
3. [테이블 생성 (스키마 적용)](#테이블-생성-스키마-적용)
4. [데이터 삽입 (Grid 생성)](#데이터-삽입-grid-생성)
5. [Viewer 연동](#viewer-연동)
6. [API 접근](#api-접근)
7. [문제 해결](#문제-해결)

---

## 개요

### 왜 Supabase를 사용하나?

- **PostgreSQL 기반**: 강력한 SQL 데이터베이스
- **REST API 자동 생성**: 별도 백엔드 불필요
- **Real-time 지원**: 데이터 변경 시 자동 반영
- **무료 플랜**: 소규모 프로젝트에 충분
- **Row Level Security**: 보안 정책 설정 가능

### V4.0 변경사항

- **6개 영역**: O(DevOps), D(Database), BI(Backend Infrastructure), BA(Backend APIs), F(Frontend), T(Test)
- **21개 속성**: 매뉴얼 V4.0 준수
- **Git 통합 추적**: Task ID 헤더 및 커밋 형식

---

## Supabase 프로젝트 생성

### 1단계: Supabase 가입

1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub 계정으로 가입

### 2단계: 새 프로젝트 생성

1. Dashboard에서 "New Project" 클릭
2. 프로젝트 정보 입력:
   - **Name**: `PoliticianFinder` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 생성 (저장 필수!)
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국 가장 가까움)
   - **Pricing Plan**: Free 선택

3. "Create new project" 클릭 (약 2분 소요)

### 3단계: API 키 확인

프로젝트 생성 후:

1. 좌측 메뉴에서 **Settings** > **API** 클릭
2. 다음 정보 복사 및 저장:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhb...` (긴 문자열)
   - **service_role key**: `eyJhb...` (더 긴 문자열, **비밀 유지!**)

---

## 테이블 생성 (스키마 적용)

### 방법 1: SQL Editor 사용 (추천)

1. 좌측 메뉴에서 **SQL Editor** 클릭
2. "New query" 클릭
3. `SUPABASE_SCHEMA_V4.0.sql` 파일 내용 전체 복사
4. SQL Editor에 붙여넣기
5. "Run" 버튼 클릭 (Ctrl + Enter)

**결과**: ✅ Success 메시지 표시

### 방법 2: CLI 사용

```bash
# Supabase CLI 설치 (한 번만)
npm install -g supabase

# 프로젝트 연결
supabase link --project-ref <project-id>

# 스키마 적용
supabase db push
```

### 확인

1. 좌측 메뉴에서 **Table Editor** 클릭
2. `project_grid_tasks` 테이블이 생성되었는지 확인
3. 샘플 데이터 6개가 삽입되었는지 확인

---

## 데이터 삽입 (Grid 생성)

### 옵션 1: Grid Generator 사용

```bash
# Grid Generator V4.0 실행
cd "C:\Development_PoliticianFinder\Developement_Real_PoliticianFinder\0-5_Development_ProjectGrid"
python project_grid_generator_v4.py
```

**출력**:
- `generated_grid_v4.sql`: INSERT SQL
- `generated_grid_v4.csv`: CSV 파일

### 옵션 2: 142개 작업 Grid 생성

1. `PoliticianFinder_개발업무_최종.md` 파일에서 작업 목록 추출
2. Grid Generator에 입력 형식으로 변환
3. SQL 또는 CSV 생성
4. Supabase에 업로드

#### SQL로 삽입

```bash
# SQL Editor에서 실행
# generated_grid_v4.sql 내용을 복사하여 붙여넣기
```

#### CSV로 삽입

1. **Table Editor** > `project_grid_tasks` 테이블 선택
2. 우측 상단 **Import data via spreadsheet** 클릭
3. `generated_grid_v4.csv` 파일 선택
4. 컬럼 매핑 확인
5. **Import** 클릭

---

## Viewer 연동

### 1단계: Viewer 설정 파일 수정

`project_grid_최종통합뷰어_v4.html` 파일 열기

```html
<!-- Supabase 설정 (파일 최상단에 추가) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
    // Supabase 설정
    const SUPABASE_URL = 'https://xxxxx.supabase.co';  // 본인의 URL
    const SUPABASE_ANON_KEY = 'eyJhb...';  // 본인의 anon key

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 데이터 로드 함수
    async function loadGridFromSupabase() {
        const { data, error } = await supabase
            .from('project_grid_tasks')
            .select('*')
            .order('phase', { ascending: true })
            .order('area', { ascending: true });

        if (error) {
            console.error('Supabase 로드 에러:', error);
            return [];
        }

        console.log('Supabase에서 로드한 작업:', data.length + '개');
        return data;
    }

    // 페이지 로드 시 Supabase에서 데이터 로드
    window.addEventListener('DOMContentLoaded', async () => {
        const tasks = await loadGridFromSupabase();
        // 기존 데이터 대신 Supabase 데이터 사용
        allTasks = tasks;
        filteredTasks = [...allTasks];
        renderGrid();
    });
</script>
```

### 2단계: Viewer 실행

```bash
# Python 실행 스크립트 사용
python run_viewer.py
```

**자동 실행**:
- 로컬 HTTP 서버 시작 (포트 8080)
- 브라우저 자동 열기
- URL: http://localhost:8080/project_grid_최종통합뷰어_v4.html

**확인**:
- Viewer에서 Supabase 데이터가 표시되는지 확인
- 브라우저 개발자 도구 콘솔에서 로그 확인

---

## API 접근

### REST API

Supabase는 자동으로 REST API를 생성합니다.

#### 1. 모든 작업 조회

```bash
curl -X GET "https://xxxxx.supabase.co/rest/v1/project_grid_tasks" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

#### 2. 특정 작업 조회

```bash
curl -X GET "https://xxxxx.supabase.co/rest/v1/project_grid_tasks?task_id=eq.P1O1" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

#### 3. Phase 1 작업만 조회

```bash
curl -X GET "https://xxxxx.supabase.co/rest/v1/project_grid_tasks?phase=eq.1" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

#### 4. 완료된 작업만 조회

```bash
curl -X GET "https://xxxxx.supabase.co/rest/v1/project_grid_tasks?status=like.완료*" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

#### 5. 작업 업데이트

```bash
curl -X PATCH "https://xxxxx.supabase.co/rest/v1/project_grid_tasks?task_id=eq.P1O1" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "progress": 100,
    "status": "완료 (2025-10-31 15:00)",
    "duration": "30분"
  }'
```

### JavaScript로 접근

```javascript
// 모든 작업 조회
const { data, error } = await supabase
    .from('project_grid_tasks')
    .select('*');

// Phase 1, Frontend 작업만 조회
const { data, error } = await supabase
    .from('project_grid_tasks')
    .select('*')
    .eq('phase', 1)
    .eq('area', 'F');

// 작업 업데이트
const { data, error } = await supabase
    .from('project_grid_tasks')
    .update({
        progress: 100,
        status: '완료 (2025-10-31 15:00)'
    })
    .eq('task_id', 'P1O1');

// 새 작업 추가
const { data, error } = await supabase
    .from('project_grid_tasks')
    .insert({
        phase: 1,
        area: 'O',
        task_id: 'P1O2',
        task_name: '새 작업',
        work_mode: 'AI-Only',
        progress: 0,
        status: '대기'
    });
```

### Python으로 접근

```python
from supabase import create_client, Client

# Supabase 클라이언트 생성
url: str = "https://xxxxx.supabase.co"
key: str = "YOUR_ANON_KEY"
supabase: Client = create_client(url, key)

# 모든 작업 조회
response = supabase.table('project_grid_tasks').select("*").execute()
tasks = response.data

# Phase 1 작업만 조회
response = supabase.table('project_grid_tasks').select("*").eq('phase', 1).execute()

# 작업 업데이트
response = supabase.table('project_grid_tasks').update({
    'progress': 100,
    'status': '완료 (2025-10-31 15:00)'
}).eq('task_id', 'P1O1').execute()
```

---

## 문제 해결

### 1. RLS 정책 오류

**증상**: `permission denied for table project_grid_tasks`

**해결**:

1. **SQL Editor**에서 실행:

```sql
-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'project_grid_tasks';

-- RLS 정책 재생성
DROP POLICY IF EXISTS "Allow authenticated read access" ON project_grid_tasks;
DROP POLICY IF EXISTS "Allow authenticated write access" ON project_grid_tasks;

CREATE POLICY "Allow public read access"
    ON project_grid_tasks
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public write access"
    ON project_grid_tasks
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);
```

### 2. CORS 오류

**증상**: `Access-Control-Allow-Origin` 에러

**해결**: Supabase는 기본적으로 CORS를 허용하지만, 문제 발생 시:

1. **Authentication** > **URL Configuration**
2. **Site URL** 및 **Redirect URLs** 추가
3. `http://localhost:8080` 추가

### 3. API 키 오류

**증상**: `Invalid API key`

**해결**:

1. **Settings** > **API** 에서 키 재확인
2. `anon public` 키 사용 (service_role은 서버용)
3. 키에 공백이 없는지 확인

### 4. 데이터가 표시되지 않음

**해결**:

1. 브라우저 개발자 도구 콘솔 확인
2. Network 탭에서 Supabase 요청 확인
3. Supabase Dashboard > **Table Editor**에서 데이터 확인
4. SQL Editor에서 직접 쿼리:

```sql
SELECT COUNT(*) FROM project_grid_tasks;
SELECT * FROM project_grid_tasks LIMIT 10;
```

### 5. Real-time 구독

Viewer에서 실시간 업데이트를 받으려면:

```javascript
// Real-time 구독
const channel = supabase
    .channel('project_grid_changes')
    .on('postgres_changes', {
        event: '*',  // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'project_grid_tasks'
    }, (payload) => {
        console.log('데이터 변경:', payload);
        // Grid 다시 로드
        loadGridFromSupabase();
    })
    .subscribe();
```

---

## 추가 리소스

### Supabase 문서

- 공식 문서: https://supabase.com/docs
- JavaScript 클라이언트: https://supabase.com/docs/reference/javascript
- REST API: https://supabase.com/docs/guides/api

### PROJECT GRID 문서

- 매뉴얼 V4.0: `PROJECT_GRID_매뉴얼_V4.0.md`
- 스키마: `SUPABASE_SCHEMA_V4.0.sql`
- Generator: `project_grid_generator_v4.py`
- Viewer: `project_grid_최종통합뷰어_v4.html`

---

## 체크리스트

### Supabase 설정
- [ ] Supabase 프로젝트 생성
- [ ] API 키 복사 및 저장
- [ ] 스키마 적용 (`SUPABASE_SCHEMA_V4.0.sql`)
- [ ] 샘플 데이터 확인 (6개 작업)

### Grid 생성
- [ ] Grid Generator V4.0 실행
- [ ] SQL 또는 CSV 생성
- [ ] Supabase에 데이터 삽입
- [ ] Table Editor에서 확인

### Viewer 연동
- [ ] Viewer 파일에 Supabase 설정 추가
- [ ] `run_viewer.py` 실행
- [ ] 브라우저에서 데이터 확인
- [ ] Real-time 구독 설정 (선택)

### 테스트
- [ ] REST API로 데이터 조회
- [ ] 작업 업데이트 테스트
- [ ] 필터링 기능 확인
- [ ] 검색 기능 확인

---

**작성일**: 2025-10-31
**버전**: V4.0
**작성자**: Claude-Sonnet-4.5
