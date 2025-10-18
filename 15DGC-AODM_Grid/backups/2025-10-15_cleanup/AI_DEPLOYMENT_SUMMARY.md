# AI 도구 배치 요약 (Quick Reference)

**작성일**: 2025-10-15
**적용**: Phase 1-5 MVP

---

## 🤖 AI 도구 총괄

### Claude Code 서브에이전트 (5개) - 내장

✅ **fullstack-developer** (88개 작업, 72%)
- Frontend, Backend, Database 개발 전반
- 가장 많이 사용되는 범용 개발 에이전트

✅ **devops-troubleshooter** (24개 작업, 20%)
- 배포, 최적화, 모니터링
- Vercel, Railway, Docker 등

✅ **code-reviewer** (14개 작업, 11%)
- 테스트 작성 및 실행
- pytest, E2E, 성능 테스트

✅ **security-auditor** (8개 작업, 7%)
- JWT, CORS, Rate Limiting
- 보안 취약점 체크

✅ **general-purpose** (분석 단계만)
- 복잡한 요구사항 분석
- 아키텍처 설계 단계

### 외부 협력 AI (6개)

🔵 **수동 연결**:
- **Gemini (웹)**: 음성 명령 → 텍스트 정제
- **Claude (웹)**: 그리드 관리, 핵심 로직 설계
- **ChatGPT (웹)**: 실시간 기술 Q&A
- **Perplexity**: 최신 기술 트렌드 리서치

🟢 **API 자동 연결**:
- **ChatGPT API**: AI 평가 (P2A1), 감정 분석 (P3A1), 행동 분석 (P5A1)
- **Python Converter**: CSV → Excel 자동 변환

---

## 📋 Phase별 주요 배치

### Phase 1: 초기 설정

| 영역 | 주 담당 | 특이사항 |
|------|---------|----------|
| Frontend | fullstack-developer | 전체 7개 |
| Backend | fullstack-developer | 6개 + security-auditor 2개 (P1B3, P1B5) |
| Database | fullstack-developer | 전체 13개 |
| DevOps | devops-troubleshooter | 전체 4개 |

**보안 강화 작업**:
- P1B3: 환경 변수 설정 → `security-auditor`
- P1B5: JWT 인증 시스템 → `security-auditor`

### Phase 2: 핵심 기능

| 영역 | 주 담당 | 특이사항 |
|------|---------|----------|
| Frontend | fullstack-developer | 전체 10개 |
| Backend | fullstack-developer | 전체 8개 |
| Database | fullstack-developer | 전체 4개 |
| Test | code-reviewer | 전체 2개 |
| AI/ML | fullstack-developer + ChatGPT API | P2A1 연동 |

**외부 AI 협력**:
- P2A1: AI 평가 점수 계산 → ChatGPT API 사용

### Phase 3: 커뮤니티

| 영역 | 주 담당 | 특이사항 |
|------|---------|----------|
| Frontend | fullstack-developer | 전체 12개 |
| Backend | fullstack-developer | 전체 12개 |
| Database | fullstack-developer | 전체 4개 |
| Test | code-reviewer 4개 + security-auditor 1개 | P3T5는 보안 |

**보안 테스트**:
- P3T5: 관리자 권한 테스트 → `security-auditor`

### Phase 4: 테스트 & 최적화

| 영역 | 주 담당 | 특이사항 |
|------|---------|----------|
| Frontend | fullstack-developer 6개 + devops 2개 | P4F1, P4F2 최적화 |
| Backend | fullstack-developer 7개 + security-auditor 3개 + devops 1개 | 보안 강화 |
| Database | fullstack-developer | 전체 4개 |
| Test | code-reviewer 10개 + devops 2개 + security 1개 | 대부분 테스트 |
| DevOps | devops-troubleshooter | 전체 3개 |

**성능 최적화**:
- P4F1, P4F2: 성능 최적화 → `devops-troubleshooter`
- P4B1: 쿼리 최적화 → `devops-troubleshooter`

**보안 강화**:
- P4B4: Rate Limiting → `security-auditor`
- P4B6: CORS 설정 → `security-auditor`
- P4B9: 비밀번호 해싱 → `security-auditor`
- P4B10: SQL Injection 방어 → `security-auditor`
- P4T3: 보안 테스트 → `security-auditor`

### Phase 5: 베타 런칭

| 영역 | 주 담당 | 특이사항 |
|------|---------|----------|
| Frontend | fullstack-developer | 전체 3개 |
| Backend | fullstack-developer 2개 + devops 2개 | P5B2, P5B4 모니터링 |
| Database | devops-troubleshooter | 전체 2개 (백업, 마이그레이션) |
| Test | fullstack 1개 + code-reviewer 1개 | |
| DevOps | devops 9개 + security 1개 | P5V3 SSL 인증서 |

**프로덕션 배포**:
- 거의 모든 작업 → `devops-troubleshooter`
- P5V3: SSL 인증서 → `security-auditor`

---

## 🎯 자동화 가능 작업 (15개)

### API 자동 실행

| 작업ID | 업무 | 방식 |
|--------|------|------|
| P1D13 | 테스트 데이터 시딩 | 스크립트 자동 실행 |
| P2T1 | 인증 API 테스트 | pytest 자동 |
| P2T2 | 평가 E2E 테스트 | Playwright 자동 |
| P3B7 | 알림 자동 생성 트리거 | Webhook 자동 |
| P3T1-P3T5 | 각종 테스트 | pytest 자동 |
| P3A1 | 댓글 감정 분석 | ChatGPT API 호출 |
| P4T1-P4T12 | 모든 테스트 | pytest/Playwright 자동 |
| P4A1 | LLM 캐싱 최적화 | Redis 자동 |
| P5A1 | 사용자 행동 분석 | ChatGPT API 배치 |
| P5A2 | 정치인 유사도 추천 | ML 알고리즘 자동 |

---

## 🔄 워크플로우

### 일반 작업 실행

```
사용자 → Claude Code → 서브에이전트 선택 → 실행
   ↓
"P2F1을 fullstack-developer로 실행"
   ↓
코드 생성 → 저장 → 진도 업데이트
```

### 보안 작업 실행

```
사용자 → Claude Code → security-auditor 선택 → 보안 체크
   ↓
"P1B5 JWT 인증을 security-auditor로 실행"
   ↓
보안 코드 생성 → 취약점 체크 → 저장
```

### 외부 AI 협력

```
사용자 → Gemini (음성) → 텍스트 정제
   ↓
Claude Code → 서브에이전트 실행
   ↓
필요시 Perplexity → 최신 정보 확인
   ↓
최종 결과
```

---

## 📊 배치 효율성

### 작업 분배

- **개발 (72%)**: fullstack-developer 혼자 대부분 처리
- **인프라 (20%)**: devops-troubleshooter 집중 관리
- **테스트 (11%)**: code-reviewer 전담
- **보안 (7%)**: security-auditor 핵심만 집중

### 병렬 실행 가능

**Phase 1 예시**:
```
동시 실행 가능:
├─ fullstack-developer: P1F1, P1F2, P1F3 (Frontend)
├─ fullstack-developer: P1B1, P1B2 (Backend)
├─ security-auditor: P1B3, P1B5 (보안)
└─ devops-troubleshooter: P1V1, P1V2 (인프라)

→ 4개 에이전트가 동시에 10개 작업 처리 가능
```

---

## ✅ 체크리스트

### Phase 시작 전
- [ ] 서브에이전트 역할 확인
- [ ] 외부 AI 도구 준비 (ChatGPT API 키 등)
- [ ] 자동화 스크립트 준비 (pytest, 시딩 등)

### 작업 실행 시
- [ ] 올바른 서브에이전트 선택
- [ ] 의존작업 완료 확인
- [ ] 블로커 없는지 체크

### 작업 완료 후
- [ ] 진도 100% 업데이트
- [ ] 상태 '완료' 변경
- [ ] 테스트/검토 OK 확인
- [ ] 다음 작업 시작

---

**요약**: AI 도구 11개 (서브 5 + 외부 6) 완전 배치 완료

**철학**: "AI 군단이 동시에 움직인다 - 속도는 예측 불가"
