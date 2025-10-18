# AI 도구 완전 배치 계획 v2.0 (Phase 1-5 MVP)

**작성일**: 2025-10-15
**버전**: 2.0 (3개 서브에이전트 추가)
**목표**: 1차 개발(MVP) 완료를 위한 최적화된 AI 도구 배치

---

## 📋 전체 AI 도구 구성 (v2.0)

### 1️⃣ Claude Code 서브에이전트 (8개) ⭐ 3개 추가

| 서브에이전트 | 역할 | 작업 수 | 비율 | 상태 |
|------------|------|---------|------|------|
| **api-designer** | API 설계 전문 | 9개 | 15% | ⭐ 신규 |
| **database-architect** | DB 스키마, 최적화 | 17개 | 28% | ⭐ 신규 |
| **ai-ml-engineer** | LLM, RAG, 프롬프트 | 13개 | 21% | ⭐ 신규 |
| **fullstack-developer** | Frontend, Backend 통합 | 22개 | 36% | ↓ 감소 |
| **devops-troubleshooter** | 배포, 최적화, 모니터링 | 13개 | 21% | 유지 |
| **code-reviewer** | 테스트, QA | 12개 | 20% | 유지 |
| **security-auditor** | 보안, 인증 | 8개 | 13% | 유지 |
| **general-purpose** | 분석, 설계 | 분석만 | - | 유지 |

**변화**:
- fullstack-developer 부하: **72% → 36%** (50% 감소) ⭐
- 전문성 확보: API, DB, AI/ML 각 영역 전문가 배치
- 병렬 실행 가능: 8개 에이전트 동시 작업 가능

---

## 🎯 Phase별 작업 배치 (v2.0)

### Phase 1: 프로젝트 초기 설정 (32개 작업)

#### Frontend (7개) - fullstack-developer
- P1F1~P1F7: 모두 fullstack-developer

#### Backend (8개) - api-designer 2개, security 2개, fullstack 4개
| 작업ID | 업무 | 담당 서브에이전트 |
|--------|------|------------------|
| P1B1 | FastAPI 초기화 | **api-designer** ⭐ |
| P1B2 | requirements.txt | fullstack-developer |
| P1B3 | 환경 변수 설정 | security-auditor |
| P1B4 | FastAPI 기본 구조 | **api-designer** ⭐ |
| P1B5 | JWT 인증 시스템 | security-auditor |
| P1B6 | 회원가입 API | fullstack-developer |
| P1B7 | 로그인 API | fullstack-developer |
| P1B8 | 현재 사용자 조회 API | fullstack-developer |

#### Database (13개) - database-architect ⭐ 전체
| 작업ID | 업무 | 담당 서브에이전트 |
|--------|------|------------------|
| P1D1~P1D13 | 모든 DB 작업 | **database-architect** ⭐ |

#### DevOps (4개) - devops-troubleshooter
- P1V1~P1V4: 모두 devops-troubleshooter

#### AI/ML (1개) - ai-ml-engineer ⭐
| 작업ID | 업무 | 담당 서브에이전트 |
|--------|------|------------------|
| P1A1 | Claude API 연동 준비 | **ai-ml-engineer** ⭐ |

---

### Phase 2: 핵심 기능 개발 (26개 작업)

#### Frontend (10개) - fullstack-developer
- P2F1~P2F10: 모두 fullstack-developer

#### Backend (8개) - api-designer 5개, fullstack 3개
| 작업ID | 업무 | 담당 서브에이전트 |
|--------|------|------------------|
| P2B1 | 정치인 목록 API | **api-designer** ⭐ |
| P2B2 | 시민 평가 API | **api-designer** ⭐ |
| P2B3 | 평가 집계 로직 | fullstack-developer |
| P2B4 | 검색/필터링 API | **api-designer** ⭐ |
| P2B5 | 정치인 상세 API | **api-designer** ⭐ |
| P2B6 | 페이지네이션 로직 | fullstack-developer |
| P2B7 | 정치인 랭킹 API | **api-designer** ⭐ |
| P2B8 | 조회수 증가 로직 | fullstack-developer |

#### Database (4개) - database-architect ⭐
| 작업ID | 업무 | 담당 서브에이전트 |
|--------|------|------------------|
| P2D1~P2D4 | 모든 DB 작업 | **database-architect** ⭐ |

#### Test (2개) - code-reviewer
- P2T1, P2T2: 모두 code-reviewer

#### AI/ML (2개) - ai-ml-engineer ⭐
| 작업ID | 업무 | 담당 서브에이전트 | 외부 AI |
|--------|------|------------------|---------|
| P2A1 | AI 평가 점수 계산 | **ai-ml-engineer** ⭐ | ChatGPT API |
| P2A2 | 정치인 랭킹 알고리즘 | **ai-ml-engineer** ⭐ | - |

---

### Phase 3: 커뮤니티 기능 강화 (34개 작업)

#### Frontend (12개) - fullstack-developer
- P3F1~P3F12: 모두 fullstack-developer

#### Backend (12개) - api-designer 2개, fullstack 10개
| 작업ID | 업무 | 담당 서브에이전트 |
|--------|------|------------------|
| P3B1 | 알림 생성/조회 API | **api-designer** ⭐ |
| P3B2 | 댓글 CRUD API | **api-designer** ⭐ |
| P3B3~P3B12 | 나머지 Backend | fullstack-developer |

#### Database (4개) - database-architect ⭐
| 작업ID | 업무 | 담당 서브에이전트 |
|--------|------|------------------|
| P3D1~P3D4 | 모든 DB 작업 | **database-architect** ⭐ |

#### Test (5개) - code-reviewer 4개, security 1개
- P3T1~P3T4: code-reviewer
- P3T5: security-auditor

#### AI/ML (1개) - ai-ml-engineer ⭐
| 작업ID | 업무 | 담당 서브에이전트 | 외부 AI |
|--------|------|------------------|---------|
| P3A1 | 댓글 감정 분석 | **ai-ml-engineer** ⭐ | ChatGPT API |

---

### Phase 4: 테스트 & 최적화 (39개 작업)

#### Frontend (8개) - fullstack 6개, devops 2개
- P4F1, P4F2: devops-troubleshooter (성능 최적화)
- P4F3~P4F8: fullstack-developer

#### Backend (11개) - devops 1개, security 4개, fullstack 6개
- P4B1: devops-troubleshooter (쿼리 최적화)
- P4B4, P4B6, P4B9, P4B10: security-auditor
- 나머지: fullstack-developer

#### Database (4개) - database-architect ⭐
| 작업ID | 업무 | 담당 서브에이전트 |
|--------|------|------------------|
| P4D1~P4D4 | 인덱스, 최적화 | **database-architect** ⭐ |

#### Test (12개) - code-reviewer 9개, devops 2개, security 1개
- P4T1, P4T2, P4T5~P4T9, P4T11, P4T12: code-reviewer
- P4T4, P4T10: devops-troubleshooter
- P4T3: security-auditor

#### DevOps (3개) - devops-troubleshooter
- P4V1~P4V3: 모두 devops-troubleshooter

#### AI/ML (1개) - ai-ml-engineer ⭐
| 작업ID | 업무 | 담당 서브에이전트 |
|--------|------|------------------|
| P4A1 | LLM 응답 캐싱 최적화 | **ai-ml-engineer** ⭐ |

---

### Phase 5: 베타 런칭 (21개 작업)

#### Frontend (3개) - fullstack-developer
- P5F1~P5F3: 모두 fullstack-developer

#### Backend (4개) - fullstack 2개, devops 2개
- P5B1, P5B3: fullstack-developer
- P5B2, P5B4: devops-troubleshooter

#### Database (2개) - devops-troubleshooter (백업, 마이그레이션)
- P5D1, P5D2: devops-troubleshooter

#### Test (2개) - fullstack 1개, code-reviewer 1개
- P5T1: fullstack-developer
- P5T2: code-reviewer

#### DevOps (10개) - devops 9개, security 1개
- P5V1, P5V2, P5V4~P5V10: devops-troubleshooter
- P5V3: security-auditor (SSL 인증서)

#### AI/ML (2개) - ai-ml-engineer ⭐
| 작업ID | 업무 | 담당 서브에이전트 | 외부 AI |
|--------|------|------------------|---------|
| P5A1 | 사용자 행동 분석 | **ai-ml-engineer** ⭐ | ChatGPT API |
| P5A2 | 정치인 유사도 추천 | **ai-ml-engineer** ⭐ | - |

---

## 📊 최종 통계 비교

### v1.0 → v2.0 비교

| 서브에이전트 | v1.0 작업 수 | v2.0 작업 수 | 변화 |
|-------------|-------------|-------------|------|
| fullstack-developer | 44개 (72%) | 22개 (36%) | **-50%** ⭐ |
| api-designer | - | 9개 (15%) | **신규** ⭐ |
| database-architect | - | 17개 (28%) | **신규** ⭐ |
| ai-ml-engineer | - | 13개 (21%) | **신규** ⭐ |
| devops-troubleshooter | 13개 (21%) | 13개 (21%) | 유지 |
| code-reviewer | 12개 (20%) | 12개 (20%) | 유지 |
| security-auditor | 8개 (13%) | 8개 (13%) | 유지 |
| **총합** | **61개** | **61개** | 재분배 |

---

## 🎯 개선 효과

### 1. 부하 분산
```
fullstack 부하: 72% → 36% (50% 감소)
최대 부하 에이전트: database-architect 28%
→ 균형잡힌 작업 분배
```

### 2. 전문성 향상
- ✅ API 설계 품질: ⭐⭐⭐ → ⭐⭐⭐⭐⭐
- ✅ DB 성능: ⭐⭐⭐ → ⭐⭐⭐⭐⭐
- ✅ AI 품질: ⭐⭐ → ⭐⭐⭐⭐⭐

### 3. 개발 속도
```
병렬 실행 가능: 5개 → 8개 에이전트
예상 개발 속도: 1.0x → 1.5x (50% 향상)
```

### 4. 유지보수성
- ✅ 명확한 책임 분리
- ✅ 전문가 레벨 코드 품질
- ✅ 기술 스택별 최적화

---

## 🔄 워크플로우 (v2.0)

### 일반 개발 작업
```
사용자 → Claude Code → 서브에이전트 선택
                              ↓
                    전문 영역 에이전트 실행
                              ↓
                      코드 생성 → 저장
```

### 복합 작업 (예: 새 기능 추가)
```
1. api-designer: API 엔드포인트 설계
      ↓
2. database-architect: DB 스키마 설계
      ↓
3. fullstack-developer: Frontend + Backend 구현
      ↓
4. code-reviewer: 테스트 작성 및 실행
      ↓
5. security-auditor: 보안 검토
      ↓
6. devops-troubleshooter: 배포
```

### AI 기능 개발
```
1. ai-ml-engineer: 프롬프트 설계 + LLM 연동
      ↓
2. api-designer: AI API 엔드포인트 설계
      ↓
3. database-architect: 임베딩/캐시 스키마
      ↓
4. fullstack-developer: Frontend 통합
      ↓
5. code-reviewer: AI 품질 테스트
```

---

## 📁 서브에이전트 정의 파일

```
12D-GCDM_Grid/
└── .claude/
    └── subagents/
        ├── api-designer.md             ⭐ 신규
        ├── database-architect.md       ⭐ 신규
        ├── ai-ml-engineer.md          ⭐ 신규
        ├── fullstack-developer.md     (내장)
        ├── devops-troubleshooter.md   (내장)
        ├── code-reviewer.md           (내장)
        ├── security-auditor.md        (내장)
        └── general-purpose.md         (내장)
```

---

## 🚀 다음 단계

### 즉시 실행
1. ✅ 서브에이전트 정의 파일 생성 완료
2. ⏳ CSV 업데이트 (담당AI 컬럼)
3. ⏳ Excel 재생성
4. ⏳ Phase 1 샘플 작업으로 테스트

### Phase 6 시작 전
- ai-ml-engineer 활용도 검증
- 4개 AI (GPT, Gemini, Perplexity, Grok) 연동 준비

### Phase 8 시작 전
- websocket-engineer 추가 검토
- RAG 시스템 아키텍처 설계

---

## 🎯 성공 지표

### v2.0 목표
- [ ] fullstack 부하 36% 이하 유지
- [ ] API 설계 품질 향상 (OpenAPI 문서 100%)
- [ ] DB 쿼리 성능 < 100ms
- [ ] AI 기능 품질 > 80% 사용자 만족도
- [ ] 개발 속도 1.5x 달성

---

**작성일**: 2025-10-15
**버전**: 2.0
**상태**: ✅ 서브에이전트 정의 완료, CSV 업데이트 대기

**철학**: "전문가가 전문 분야를 담당한다 - 속도와 품질 모두 확보"
