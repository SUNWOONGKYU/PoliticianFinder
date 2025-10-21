# 서브에이전트 할당 가이드 (초안)

## 개요
11D-GCDM 그리드의 "담당AI" 컬럼에 적절한 서브에이전트를 할당하기 위한 가이드입니다.

## Claude Code 사용 가능한 서브에이전트 목록

### 1. general-purpose
- **역할**: 범용 작업, 복잡한 멀티스텝 태스크
- **도구**: 모든 도구 사용 가능
- **적합한 작업**:
  - 키워드/파일 검색이 필요한 복잡한 작업
  - 여러 단계를 거쳐야 하는 연구 작업
  - 명확하지 않은 요구사항 분석

### 2. fullstack-developer ⭐ (가장 많이 사용)
- **역할**: 프론트엔드, 백엔드, 데이터베이스 개발
- **도구**: Read, Write, Edit, Bash
- **적합한 작업**:
  - Next.js, React 컴포넌트 개발
  - REST API, GraphQL 엔드포인트 개발
  - Supabase, PostgreSQL 데이터베이스 설계
  - API 통합 작업
  - 전체 기능 구현

### 3. security-auditor
- **역할**: 보안 검토, 취약점 분석, 인증 구현
- **도구**: Read, Write, Edit, Bash
- **적합한 작업**:
  - 코드 보안 취약점 검토
  - JWT, OAuth2 인증 구현
  - CORS, CSP 설정
  - 암호화 관련 작업
  - OWASP 컴플라이언스 체크

### 4. devops-troubleshooter
- **역할**: 배포, 모니터링, 성능 최적화, 문제 해결
- **도구**: Read, Write, Edit, Bash, Grep
- **적합한 작업**:
  - CI/CD 파이프라인 구축
  - Docker, Vercel 배포 설정
  - 로그 분석 및 디버깅
  - 성능 최적화 (번들 크기, 이미지 최적화)
  - 모니터링 및 알림 설정
  - 부하 테스트

### 5. code-reviewer
- **역할**: 코드 품질 검토, 리팩토링, 테스트
- **도구**: Read, Write, Edit, Bash, Grep
- **적합한 작업**:
  - 코드 리뷰 및 품질 체크
  - 단위 테스트 작성
  - 통합 테스트 작성
  - 리팩토링 제안
  - 유지보수성 개선

---

## Phase별 권장 서브에이전트 할당

### Phase 1: 프로젝트 초기 설정
```
영역          작업 유형                    권장 에이전트
Frontend      프로젝트 초기화              fullstack-developer
              TypeScript/Tailwind 설정     fullstack-developer
Backend       Supabase 설정                fullstack-developer
              환경변수 설정                security-auditor
Database      스키마 설계                  fullstack-developer
              마이그레이션 설정            fullstack-developer
DevOps        Git 설정                     devops-troubleshooter
              Vercel 연동                  devops-troubleshooter
Test          테스트 환경 구축             code-reviewer
```

### Phase 2: 핵심 기능 개발
```
영역          작업 유형                    권장 에이전트
Frontend      컴포넌트 개발                fullstack-developer
              상태 관리                    fullstack-developer
Backend       REST API 개발                fullstack-developer
              비즈니스 로직                fullstack-developer
Database      CRUD 작업                    fullstack-developer
              인덱싱                       fullstack-developer
AI/ML         OpenAI API 통합              fullstack-developer
              프롬프트 엔지니어링          general-purpose
Test          단위 테스트                  code-reviewer
```

### Phase 3: 커뮤니티 기능 강화
```
영역          작업 유형                    권장 에이전트
Frontend      실시간 UI (알림, 댓글)       fullstack-developer
Backend       WebSocket 구현               fullstack-developer
              실시간 동기화                fullstack-developer
Database      관계형 쿼리 최적화           fullstack-developer
Test          통합 테스트                  code-reviewer
              E2E 테스트                   code-reviewer
```

### Phase 4: 테스트 & 최적화
```
영역          작업 유형                    권장 에이전트
Frontend      이미지 최적화                devops-troubleshooter
              번들 크기 최적화             devops-troubleshooter
Backend       API 성능 최적화              devops-troubleshooter
              캐싱 전략                    fullstack-developer
Database      쿼리 최적화                  fullstack-developer
              인덱스 튜닝                  devops-troubleshooter
DevOps        부하 테스트                  devops-troubleshooter
              모니터링 설정                devops-troubleshooter
Test          성능 테스트                  devops-troubleshooter
              보안 테스트                  security-auditor
```

### Phase 5: 베타 런칭
```
영역          작업 유형                    권장 에이전트
Frontend      최종 UI 검토                 code-reviewer
Backend       프로덕션 설정                devops-troubleshooter
              보안 강화                    security-auditor
Database      백업 전략                    devops-troubleshooter
DevOps        배포 자동화                  devops-troubleshooter
              롤백 전략                    devops-troubleshooter
Test          통합 테스트 전체 실행        code-reviewer
```

---

## 작업 유형별 서브에이전트 매칭

### 개발 작업
- **UI/UX 컴포넌트**: `fullstack-developer`
- **API 엔드포인트**: `fullstack-developer`
- **데이터베이스 스키마**: `fullstack-developer`
- **상태 관리**: `fullstack-developer`

### 품질/테스트 작업
- **단위 테스트**: `code-reviewer`
- **통합 테스트**: `code-reviewer`
- **E2E 테스트**: `code-reviewer`
- **코드 리뷰**: `code-reviewer`

### 보안 작업
- **인증/인가**: `security-auditor`
- **암호화**: `security-auditor`
- **취약점 분석**: `security-auditor`
- **OWASP 체크**: `security-auditor`

### 인프라/배포 작업
- **CI/CD**: `devops-troubleshooter`
- **Docker/컨테이너**: `devops-troubleshooter`
- **배포 설정**: `devops-troubleshooter`
- **모니터링**: `devops-troubleshooter`
- **성능 최적화**: `devops-troubleshooter`

### 복잡한 연구/분석
- **요구사항 분석**: `general-purpose`
- **아키텍처 설계**: `general-purpose`
- **기술 스택 선정**: `general-purpose`

---

## 할당 예시 (PoliticianFinder 프로젝트)

### Frontend 영역
```csv
작업ID,업무,담당AI
P1F1,Next.js 14 프로젝트 초기화,fullstack-developer
P2F1,정치인 카드 컴포넌트 개발,fullstack-developer
P3F1,알림 벨 컴포넌트,fullstack-developer
P4F1,이미지 최적화,devops-troubleshooter
P4F2,번들 크기 최적화,devops-troubleshooter
```

### Backend 영역
```csv
작업ID,업무,담당AI
P1B1,Supabase 초기 설정,fullstack-developer
P2B1,정치인 검색 API,fullstack-developer
P3B1,댓글 시스템 API,fullstack-developer
P4B1,API 응답 속도 최적화,devops-troubleshooter
```

### Database 영역
```csv
작업ID,업무,담당AI
P1D1,ERD 설계,fullstack-developer
P2D1,Politician 테이블 생성,fullstack-developer
P4D1,쿼리 성능 최적화,devops-troubleshooter
```

### Test 영역
```csv
작업ID,업무,담당AI
P1T1,Jest 환경 설정,code-reviewer
P2T1,컴포넌트 단위 테스트,code-reviewer
P3T1,API 통합 테스트,code-reviewer
P4T1,성능 테스트,devops-troubleshooter
```

### DevOps 영역
```csv
작업ID,업무,담당AI
P1DO1,Git 저장소 설정,devops-troubleshooter
P1DO2,Vercel 프로젝트 연동,devops-troubleshooter
P4DO1,CI/CD 파이프라인,devops-troubleshooter
P5DO1,프로덕션 배포,devops-troubleshooter
```

### AI/ML 영역
```csv
작업ID,업무,담당AI
P2AI1,OpenAI API 통합,fullstack-developer
P2AI2,정치인 평가 프롬프트,general-purpose
P3AI1,댓글 감정 분석,fullstack-developer
```

---

## 블로커 유형별 대응 에이전트

| 블로커 유형 | 대응 에이전트 | 역할 |
|------------|--------------|------|
| 의존성 대기 | general-purpose | 의존성 분석 및 우선순위 재조정 |
| 기술 이슈 | devops-troubleshooter | 디버깅 및 문제 해결 |
| 요구사항 불명확 | general-purpose | 요구사항 명확화 및 문서화 |
| 외부 의존 | fullstack-developer | API 연동 및 대체 방안 |
| 보안 우려 | security-auditor | 보안 검토 및 개선 |

---

## 업데이트 방법

1. **CSV 파일에서 담당AI 컬럼 수정**
   ```csv
   영역,속성,Phase 1,Phase 2,...
   Frontend,,,,
   ,작업ID,P1F1,P2F1,
   ,업무,Next.js 초기화,카드 컴포넌트,
   ,담당AI,fullstack-developer,fullstack-developer,  ← 여기 수정
   ```

2. **Excel 재생성**
   ```bash
   python3 automation/csv_to_excel_with_colors.py project_grid_v1.0_XY.csv
   ```

3. **Claude Code에 지시**
   ```
   "P2F1 작업을 fullstack-developer 서브에이전트로 실행해줘"
   ```

---

## 참고사항

- **기본 원칙**: 대부분의 개발 작업은 `fullstack-developer`
- **최적화/배포**: `devops-troubleshooter`
- **보안 관련**: `security-auditor`
- **테스트/리뷰**: `code-reviewer`
- **불명확한 작업**: `general-purpose`로 시작해서 분석 후 재할당

이 가이드는 초안이므로, 실제 프로젝트 진행하면서 업데이트하시기 바랍니다.

---

**작성일**: 2025-10-14
**버전**: v1.0 (초안)
**상태**: 연구 및 검증 필요
