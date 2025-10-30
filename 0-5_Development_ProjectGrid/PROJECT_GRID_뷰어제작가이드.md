# PROJECT GRID 통합 뷰어 제작 가이드

> **목적**: 누구나 PROJECT GRID 매뉴얼을 기반으로 통합 뷰어를 제작할 수 있도록 안내

## 📋 목차
1. [개요](#개요)
2. [필수 기술 스택](#필수-기술-스택)
3. [핵심 기능 요구사항](#핵심-기능-요구사항)
4. [2D 카드 뷰 구현](#2d-카드-뷰-구현)
5. [3D 블록 뷰 구현](#3d-블록-뷰-구현)
6. [데이터 구조](#데이터-구조)
7. [필터링 및 검색](#필터링-및-검색)
8. [상세보기 팝업](#상세보기-팝업)

---

## 개요

PROJECT GRID 통합 뷰어는 프로젝트 작업을 시각적으로 관리하는 도구입니다.
- **2D 카드 뷰**: 작업을 카드 형태로 표시
- **3D 블록 뷰**: 작업을 3D 공간에서 Phase(X축) × Area(Y축)로 배치

---

## 필수 기술 스택

### 프론트엔드
- **HTML5**: 뷰어 구조
- **CSS3**: 스타일링 (Grid, Flexbox)
- **JavaScript (ES6+)**: 동적 기능

### 3D 시각화
- **Three.js** (r128 이상): 3D 블록 렌더링
- CDN: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`

### 데이터 소스 (선택)
- **Supabase**: PostgreSQL 데이터베이스
- **CSV**: 로컬 파일
- **Demo 모드**: 하드코딩된 샘플 데이터

---

## 핵심 기능 요구사항

### 1. 뷰 전환
- 2D 카드 뷰 ↔ 3D 블록 뷰 버튼으로 전환
- 기본값: 2D 카드 뷰

### 2. 21개 속성 표시
PROJECT_GRID_MANUAL_V2.0.md에 정의된 21개 속성을 모두 지원:

#### 필수 속성 (카드에 표시할 10개)
1. **작업ID** (Phase + Area + 번호)
2. **업무** (작업 설명)
3. **상태** (완료/진행 중/대기)
4. **서브 에이전트** (담당 AI)
5. **사용도구** (기술 스택)
6. **작업 방식** (AI-Only 등)
7. **의존성 체인** (선행 작업)
8. **블로커** (진행 방해 요소)
9. **진도** (0~100% 진행률)
10. **빌드결과** (✅ 성공 / ❌ 실패 / ⏳ 대기)
11. **종합검증결과** (✅ 통과 / 🔄 진행중 / ⏳ 대기)

#### 전체 속성 (팝업에 표시할 21개)
- 위 10개 + 나머지 11개 (생성파일, 생성자, 소요시간, 수정이력, 테스트내역, 의존성전파, 참고사항 등)

### 3. 용어 통일
- **"블록"** 사용 (❌ "큐브" 사용 금지)
- 매뉴얼 용어 준수 (예: "서브 에이전트", "작업 방식")

---

## 2D 카드 뷰 구현

### 레이아웃 구조
```
┌─────────────────────────────────────┐
│ 검색창 + 필터 (상태/검증)            │
├─────────────────────────────────────┤
│ 통계바 (전체/완료/진행중/대기)       │
├─────────────────────────────────────┤
│ Phase 탭 (Phase 1, 2, 3...)         │
├─────────────────────────────────────┤
│ ┌─ Area: Frontend ─────────────┐   │
│ │ [카드] [카드] [카드]          │   │
│ └──────────────────────────────┘   │
│ ┌─ Area: Backend ──────────────┐   │
│ │ [카드] [카드]                 │   │
│ └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 카드 구성
```html
┌─────────────────────────────────┐
│ [P1F1]           [완료 배지]     │ ← 헤더
├─────────────────────────────────┤
│ AuthContext 생성                 │ ← 업무명
├─────────────────────────────────┤
│ 서브 에이전트: fullstack-dev     │
│ 사용도구: React/TypeScript       │
│ 작업 방식: AI-Only               │
│ 의존성 체인: 없음                │
│ 블로커: 없음                     │
│ 진도: [====] 100%                │ ← 프로그레스 바
│ 빌드결과: ✅ 성공                │
│ 종합검증결과: ✅ 통과            │
├─────────────────────────────────┤
│ [📄 작업지시서] [📋 전체속성]    │ ← 버튼
└─────────────────────────────────┘
```

### 필터링 기능
**2가지 독립 필터**:

1. **상태 필터**
   - 전체 / 완료 / 진행중 / 대기중

2. **검증 필터** (중요!)
   - 전체 / ✅ 통과 / 🔄 진행중 / ⏳ 대기

**구현 예시**:
```javascript
function renderGrid() {
    let tasksToShow = filteredTasks.filter(task => {
        const statusMatch = currentStatusFilter === 'all' || getStatusClass(task) === currentStatusFilter;
        const validationMatch = currentValidationFilter === 'all' || getValidationClass(task) === currentValidationFilter;
        return statusMatch && validationMatch;
    });
    // ... 렌더링
}

function getValidationClass(task) {
    if (task.종합검증결과.includes('통과')) return 'pass';
    if (task.종합검증결과.includes('진행')) return 'inprogress';
    return 'waiting';
}
```

### 색상 코딩
- **완료**: 녹색 (#28a745)
- **진행중**: 노란색 (#ffc107)
- **대기중**: 회색 (#6c757d)

---

## 3D 블록 뷰 구현

### 좌표 시스템
```
Y (Area)
↑
│  [B] Backend
│  [F] Frontend
│
└────────────→ X (Phase)
    1   2   3
```

### 블록 배치 공식
```javascript
const posX = task.phase * 6;           // Phase 1부터 시작 (X=6, 12, 18...)
const posY = areaIndex * 5;            // Area 간격 5
const posZ = 0;                        // Z축 고정
```

### 블록 크기
- **블록 크기**: 2 × 2 × 2 (BoxGeometry)
- **간격**: Phase 간 6, Area 간 5

### 블록 색상 (상태별)
```javascript
const color = task.상태.includes('완료') ? 0x28a745 :   // 녹색
              task.상태.includes('진행') ? 0xffc107 :   // 노란색
              0x6c757d;                                 // 회색
```

### 텍스트 라벨 (블록 위)
- **상단**: 작업ID (예: P1F1) - 흰색, Bold 22px
- **하단**: 핵심 키워드 (예: Auth) - 연보라색, Bold 16px

```javascript
function createTaskIdLabel(taskId, keyword, x, y, z, color) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 80;

    // 배경
    context.fillStyle = 'rgba(0, 0, 0, 0.75)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // 작업ID
    context.fillStyle = '#ffffff';
    context.font = 'Bold 22px Arial';
    context.textAlign = 'center';
    context.fillText(taskId, 80, 28);

    // 키워드
    context.fillStyle = '#a0a0ff';
    context.font = 'Bold 16px Arial';
    context.fillText(keyword, 80, 54);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    sprite.position.set(x, y + 1.5, z);
    sprite.scale.set(2, 1, 1);
    scene.add(sprite);
}
```

### 축 표시
```javascript
// 축 헬퍼 (빨강=X, 초록=Y, 파랑=Z)
const axesHelper = new THREE.AxesHelper(30);
scene.add(axesHelper);

// X축 레이블 (Phase)
createTextLabel('X: Phase →', 20, 0, 0, 0xff0000);

// Y축 레이블 (Area)
createTextLabel('Y: Area ↑', 0, 20, 0, 0x00ff00);
```

### 카메라 설정
```javascript
camera.position.set(25, 15, 35);  // 블록이 보이는 초기 위치
camera.lookAt(12, 5, 0);          // 블록 중앙을 바라봄
```

### 인터랙션
- **마우스 드래그**: 카메라 회전
- **휠**: 줌 인/아웃
- **블록 클릭**: 전체 속성 팝업 표시

---

## 데이터 구조

### 작업 객체 예시
```javascript
{
    작업ID: 'P1F1',
    phase: 1,
    area: 'F',
    업무: 'AuthContext 생성',
    작업지시서: 'tasks/P1F1.md',
    서브에이전트: 'fullstack-developer',
    사용도구: 'React/TypeScript/Supabase',
    작업방식: 'AI-Only',
    의존성체인: '없음',
    진도: '100%',
    상태: '완료 (2025-10-16 14:30)',
    생성파일: ['AuthContext.tsx (2025-10-23 12:42:57)', 'useAuth.ts (2025-10-23 12:42:57)'],
    생성자: 'Claude-3.5-Sonnet',
    소요시간: '45분',
    수정이력: 'Supabase Auth 통합 완료',
    테스트내역: 'CR(15/15)@QA-01 → Test(24/24)@Test-01 → Build(성공)@CI',
    빌드결과: '✅ 성공',
    의존성전파: '✅ 이행',
    블로커: '없음',
    종합검증결과: '✅ 통과',
    종합검증상세: '✅ 통과 | 보고서: docs/P1F1_REPORT.md (2025-10-23 14:30)',
    참고사항: 'Context API 사용'
}
```

### Area 코드 매핑
```javascript
const AREA_NAMES = {
    'F': 'Frontend',
    'B': 'Backend',
    'D': 'Database',
    'T': 'Testing',
    'S': 'Security',
    'O': 'DevOps'
};
```

---

## 필터링 및 검색

### 검색 기능
```javascript
document.getElementById('searchInput').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    filteredTasks = search ? allTasks.filter(t =>
        t.작업ID.toLowerCase().includes(search) ||
        t.업무.toLowerCase().includes(search)
    ) : [...allTasks];
    renderGrid();
});
```

### Phase 필터
```javascript
function selectPhase(phase) {
    currentPhase = phase;
    renderGrid();
}
```

### 상태 + 검증 이중 필터
```javascript
// HTML
<button data-filter-type="status" data-filter="completed">완료</button>
<button data-filter-type="validation" data-filter="pass">✅ 통과</button>

// JavaScript
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const filterType = btn.dataset.filterType;
        const filterValue = btn.dataset.filter;

        if (filterType === 'status') {
            currentStatusFilter = filterValue;
        } else if (filterType === 'validation') {
            currentValidationFilter = filterValue;
        }
        renderGrid();
    });
});
```

---

## 상세보기 팝업

### 전체 21개 속성 표시
```javascript
function showFullDetail(taskId) {
    const task = allTasks.find(t => t.작업ID === taskId);

    const fileList = task.생성파일.map(f => {
        const fileName = f.split('(')[0].trim();
        return `<a href="#" onclick="openFile('${fileName}')">${f}</a>`;
    }).join('<br>');

    document.getElementById('popupContent').innerHTML = `
        <div class="attr-row">1. Phase: Phase ${task.phase}</div>
        <div class="attr-row">2. Area: ${AREA_NAMES[task.area]}</div>
        <div class="attr-row">3. 작업ID: ${task.작업ID}</div>
        ...
        <div class="attr-row">12. 생성파일: ${fileList}</div>
        ...
        <div class="attr-row">20. 종합검증결과: ${task.종합검증상세}</div>
        <div class="attr-row">21. 참고사항: ${task.참고사항}</div>
    `;

    document.getElementById('taskPopup').classList.add('active');
}
```

### 파일 링크 클릭
```javascript
function openFile(path) {
    if (DEMO_MODE) {
        alert(`📄 파일 경로:\n${path}\n\n실제 환경에서는 이 파일이 자동으로 열립니다.`);
    } else {
        window.open(path, '_blank');
    }
}
```

---

## 스타일 가이드

### 색상 팔레트
```css
--primary: #667eea;         /* 메인 보라색 */
--primary-dark: #764ba2;    /* 진한 보라색 */
--success: #28a745;         /* 완료 (녹색) */
--warning: #ffc107;         /* 진행중 (노란색) */
--secondary: #6c757d;       /* 대기중 (회색) */
--danger: #dc3545;          /* 실패 (빨간색) */
```

### 반응형 레이아웃
```css
@media (max-width: 768px) {
    .area-content {
        grid-template-columns: 1fr;  /* 모바일에서 1열 */
    }
}
```

---

## 체크리스트

### 필수 구현 항목
- [ ] 2D 카드 뷰 (Grid 레이아웃)
- [ ] 3D 블록 뷰 (Three.js)
- [ ] 뷰 전환 버튼
- [ ] 10개 핵심 속성 카드 표시
- [ ] 21개 전체 속성 팝업
- [ ] 상태 필터 (완료/진행중/대기)
- [ ] **검증 필터** (통과/진행중/대기) ⭐ 중요!
- [ ] Phase 탭
- [ ] 검색 기능
- [ ] 작업지시서 파일 링크
- [ ] 생성파일 링크
- [ ] 3D 블록에 작업ID + 키워드 라벨
- [ ] X/Y 축 표시 및 레이블
- [ ] 카메라 회전/줌 컨트롤
- [ ] 블록 클릭 시 상세보기

### 용어 준수
- [ ] "블록" 사용 (❌ "큐브" 금지)
- [ ] "서브 에이전트" (❌ "담당AI" 금지)
- [ ] 매뉴얼 속성명 정확히 사용

---

## 참고 파일

- **매뉴얼**: `⭐2_PROJECT_GRID_MANUAL_V2.0.md`
- **완성 예제**: `project_grid_최종통합뷰어_v3.html`

---

## 자주 묻는 질문 (FAQ)

**Q1. 데이터는 어디서 가져오나요?**
- Supabase PostgreSQL (실제 환경)
- CSV 파일 (로컬 환경)
- 하드코딩된 샘플 데이터 (데모 모드)

**Q2. 블록 크기를 조정하려면?**
```javascript
const geometry = new THREE.BoxGeometry(2, 2, 2);  // 크기 변경
const posX = task.phase * 6;  // 간격 조정
```

**Q3. 카드에 표시할 속성을 바꾸려면?**
- 매뉴얼에서 중요도가 높은 속성 선택
- 현재 10개: 작업ID, 업무, 상태, 서브에이전트, 사용도구, 작업방식, 의존성체인, 블로커, 진도, 빌드결과, 종합검증결과

**Q4. 필터가 작동하지 않아요**
- `data-filter-type`과 `data-filter` 속성 확인
- 상태 필터와 검증 필터가 **독립적으로** 작동해야 함

**Q5. 3D 블록이 화면에 안 보여요**
```javascript
camera.position.set(25, 15, 35);  // 카메라 위치
camera.lookAt(12, 5, 0);          // 블록 중심을 바라봄
```

---

## 버전 관리

- **v1.0**: 기본 2D/3D 뷰
- **v2.0**: 매뉴얼 준수, 19개 속성
- **v3.0**: 21개 속성, 검증 필터, 블록 용어 통일 ⭐ 최신

---

**제작자**: PROJECT GRID 개발팀
**마지막 수정**: 2025-10-24
**라이선스**: MIT
