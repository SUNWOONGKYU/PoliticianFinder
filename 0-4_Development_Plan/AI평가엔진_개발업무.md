# AI 평가 엔진 개발 업무

**작성일**: 2025-10-30
**대상**: AI 평가 엔진 개발팀 (별도 Claude Code 세션)
**프로젝트**: PoliticianFinder AI 평가 시스템

---

## 프로젝트 개요

**목적**: 5개 AI 모델을 활용하여 정치인의 활동과 역량을 객관적으로 평가하는 엔진 개발

**현황**:
- ✅ Claude API 연동 완료
- 🔄 ChatGPT, Gemini, Grok, Perplexity 추가 예정 (점진적 확장)

**평가 방식**:
- 10개 분야별 점수 산정 (0-100점)
- 5개 AI 결과 통합 (평균, 가중치 적용)
- 시계열 데이터 저장 (평가 추이 분석)

---

## 평가 분야 (10개)

1. **청렴성** - 부정부패 방지, 이해충돌 회피
2. **전문성** - 정책 지식, 전문 역량
3. **소통능력** - 시민과의 대화, 경청
4. **리더십** - 의사결정, 팀워크
5. **책임감** - 공약 이행, 의무 수행
6. **투명성** - 정보 공개, 재산 신고
7. **대응성** - 민원 처리, 위기 관리
8. **비전** - 미래 계획, 정책 방향
9. **공익추구** - 지역/국가 이익 우선
10. **윤리성** - 도덕성, 법규 준수

---

## 개발 업무 목록 (90개)

### Phase 1: AI API 연동 (5개 AI)

**🔗 그룹 A: Claude API (완료)**
1. ✅ Claude API 클라이언트 설정 및 인증
2. ✅ Claude API 호출 테스트 및 응답 파싱

**🔗 그룹 B: ChatGPT API**
3. ⚡ ChatGPT API 클라이언트 설정
4. ⚡ ChatGPT API 호출 로직 구현
5. ⬅️ ChatGPT 응답 파싱 및 에러 핸들링 (← 3,4)

**🔗 그룹 C: Gemini API**
6. ⚡ Gemini API 클라이언트 설정
7. ⚡ Gemini API 호출 로직 구현
8. ⬅️ Gemini 응답 파싱 및 에러 핸들링 (← 6,7)

**🔗 그룹 D: Grok API**
9. ⚡ Grok API 클라이언트 설정
10. ⚡ Grok API 호출 로직 구현
11. ⬅️ Grok 응답 파싱 및 에러 핸들링 (← 9,10)

**🔗 그룹 E: Perplexity API**
12. ⚡ Perplexity API 클라이언트 설정
13. ⚡ Perplexity API 호출 로직 구현
14. ⬅️ Perplexity 응답 파싱 및 에러 핸들링 (← 12,13)

**의존성**: 그룹 B, C, D, E는 병렬 진행 가능
**병렬성**: 4개 API 동시 개발 가능

---

### Phase 2: 프롬프트 설계 및 관리

**🔗 그룹 F: 프롬프트 설계**
15. ⬅️ 10개 분야별 평가 프롬프트 템플릿 설계 (← Phase 1)
16. ⚡ 정치인 데이터 전처리 로직 (공식 정보 → AI 입력 포맷)
17. ⚡ 프롬프트 변수 치환 시스템 (정치인명, 활동 내역 등)
18. ⬅️ 5개 AI별 프롬프트 최적화 (← 15,16,17)

**🔗 그룹 G: 프롬프트 버전 관리**
19. ⚡ 프롬프트 버전 관리 시스템 (v1.0, v1.1...)
20. ⚡ 프롬프트 A/B 테스트 기능
21. ⬅️ 프롬프트 성능 비교 대시보드 (← 19,20)

**의존성**: Phase 2는 Phase 1 완료 후 시작
**병렬성**: 그룹 F, G 병렬 진행 가능

---

### Phase 3: 평가 로직 개발

**🔗 그룹 H: 점수 산정**
22. ⬅️ AI 응답에서 점수 추출 로직 (← Phase 2)
23. ⚡ 10개 분야별 점수 매핑
24. ⚡ 점수 정규화 (0-100점 스케일)
25. ⬅️ 5개 AI 점수 통합 로직 (평균/가중치) (← 22,23,24)

**🔗 그룹 I: 평가 결과 생성**
26. ⚡ 종합 평가 점수 계산
27. ⚡ 강점/개선점 추출 로직
28. ⚡ 평가 코멘트 생성
29. ⬅️ 평가 리포트 JSON 생성 (← 26,27,28)

**🔗 그룹 J: 시계열 데이터**
30. ⚡ 평가 이력 저장 로직
31. ⚡ 6개월 추이 데이터 집계
32. ⬅️ 시계열 차트 데이터 포맷 생성 (← 30,31)

**의존성**: Phase 3는 Phase 2 완료 후 시작
**병렬성**: 그룹 H 완료 후 I, J 병렬 진행 가능

---

### Phase 4: 데이터베이스 설계

**🔗 그룹 K: 테이블 설계**
33. ⚡ ai_models 테이블 (5개 AI 정보)
34. ⚡ evaluation_criteria 테이블 (10개 분야 정의)
35. ⚡ ai_evaluations 테이블 (평가 메인)
36. ⚡ evaluation_scores 테이블 (분야별 점수)
37. ⚡ evaluation_history 테이블 (평가 이력)
38. ⚡ prompt_templates 테이블 (프롬프트 버전)
39. ⚡ ai_api_logs 테이블 (API 호출 로그)

**🔗 그룹 L: 인덱스 및 제약**
40. ⬅️ 평가 데이터 인덱스 생성 (← 33-39)
41. ⬅️ 복합 인덱스 생성 (← 33-39)
42. ⬅️ Foreign Key 제약 조건 설정 (← 33-39)
43. ⬅️ RLS 정책 설정 (← 33-39)

**🔗 그룹 M: 트리거**
44. ⬅️ 평가 완료 시 통계 업데이트 트리거 (← 40-43)
45. ⬅️ 시계열 데이터 자동 집계 트리거 (← 40-43)

**의존성**: Phase 4는 독립적 (Phase 1-3과 병렬 가능)
**병렬성**: 그룹 K 완료 후 L, M 병렬 진행

---

### Phase 5: API 엔드포인트 개발

**🔗 그룹 N: 평가 요청 API**
46. ⬅️ POST /api/evaluate - 정치인 평가 요청 (← Phase 1-3)
47. ⬅️ 평가 요청 큐 관리 (동시 요청 제어) (← 46)
48. ⬅️ 평가 진행 상태 조회 API (← 46)

**🔗 그룹 O: 평가 결과 조회 API**
49. ⚡ GET /api/evaluations/:id - 평가 상세 조회
50. ⚡ GET /api/evaluations - 평가 목록 조회
51. ⚡ GET /api/evaluations/:id/history - 평가 이력 조회
52. ⚡ GET /api/evaluations/:id/chart - 시계열 차트 데이터

**🔗 그룹 P: 관리 API**
53. ⚡ POST /api/admin/prompts - 프롬프트 업데이트
54. ⚡ GET /api/admin/logs - AI 호출 로그 조회
55. ⚡ POST /api/admin/reeval - 평가 재실행

**의존성**: 그룹 N은 Phase 1-3 완료 후, O/P는 Phase 4 완료 후
**병렬성**: 그룹 O, P 병렬 개발 가능

---

### Phase 6: 보안 및 모니터링

**🔗 그룹 Q: API 보안**
56. ⚡ AI API 키 암호화 저장 (Supabase Vault)
57. ⚡ API 호출 Rate Limiting (AI별 제한)
58. ⚡ 평가 요청 인증 및 권한 검증
59. ⚡ AI 프롬프트 Injection 방어

**🔗 그룹 R: 모니터링**
60. ⚡ AI API 호출 성공률 모니터링
61. ⚡ AI API 비용 추적 시스템
62. ⚡ 평가 처리 시간 모니터링
63. ⚡ AI API 장애 알림 시스템

**🔗 그룹 S: 로깅**
64. ⚡ AI 호출 로그 기록 (요청/응답)
65. ⚡ 평가 에러 로그 수집
66. ⚡ 프롬프트 성능 로그 분석

**의존성**: Phase 6은 Phase 5 완료 후
**병렬성**: 그룹 Q, R, S 병렬 진행 가능

---

### Phase 7: 테스트

**🔗 그룹 T: 단위 테스트**
67. ⚡ AI API 호출 Mock 테스트 (5개)
68. ⚡ 프롬프트 생성 테스트
69. ⚡ 점수 정규화 로직 테스트
70. ⚡ 평가 통합 로직 테스트

**🔗 그룹 U: 통합 테스트**
71. ⬅️ 전체 평가 프로세스 E2E 테스트 (← Phase 1-6)
72. ⬅️ 5개 AI 동시 호출 테스트 (← 71)
73. ⬅️ 평가 결과 DB 저장 검증 (← 71)

**🔗 그룹 V: 성능 테스트**
74. ⬅️ AI API 응답 시간 측정 (← 71-73)
75. ⬅️ 동시 평가 요청 부하 테스트 (← 71-73)
76. ⬅️ 비용 효율성 테스트 (← 71-73)

**의존성**: Phase 7은 Phase 1-6 완료 후
**병렬성**: 그룹 T 병렬 진행, 그룹 U 완료 후 V

---

### Phase 8: 최적화 및 배포

**🔗 그룹 W: 성능 최적화**
77. ⬅️ AI API 응답 캐싱 (동일 정치인 재평가 방지) (← Phase 7)
78. ⬅️ 프롬프트 최적화 (토큰 수 절감) (← Phase 7)
79. ⬅️ 평가 큐 최적화 (우선순위 관리) (← Phase 7)

**🔗 그룹 X: 배포**
80. ⚡ Supabase Edge Function 배포 (평가 실행)
81. ⚡ 환경변수 설정 (프로덕션)
82. ⬅️ API 엔드포인트 문서화 (← 80,81)

**🔗 그룹 Y: 데이터 시딩**
83. ⚡ ai_models 데이터 삽입 (5개)
84. ⚡ evaluation_criteria 데이터 삽입 (10개)
85. ⚡ 초기 프롬프트 템플릿 삽입

**의존성**: Phase 8은 Phase 7 완료 후
**병렬성**: 그룹 W, X, Y 병렬 진행 가능

---

### Phase 9: 점진적 확장

**🔗 그룹 Z: AI 모델 추가 (점진적)**
86. ⬅️ ChatGPT API 프로덕션 활성화 (← Phase 1-8)
87. ⬅️ Gemini API 프로덕션 활성화 (← 86)
88. ⬅️ Grok API 프로덕션 활성화 (← 87)
89. ⬅️ Perplexity API 프로덕션 활성화 (← 88)
90. ⬅️ 5개 AI 통합 검증 (← 89)

**의존성**: Phase 9는 Phase 8 완료 후 점진적 확장
**병렬성**: 순차 진행 (안정성 확보)

---

## 기술 스택

### AI API
- Claude 3.5 (Anthropic) ✅
- GPT-4 (OpenAI) 🔄
- Gemini Pro (Google) 🔄
- Grok (X.AI) 🔄
- Perplexity 🔄

### Backend
- Supabase Edge Functions (Deno)
- TypeScript
- Supabase Database (PostgreSQL)

### 모니터링
- Supabase Logs
- Sentry (에러 추적)

---

## API 입출력 스펙

### 평가 요청 (POST /api/evaluate)

**Request**:
```json
{
  "politician_id": "pol_12345",
  "request_type": "full",
  "ai_models": ["claude", "chatgpt", "gemini", "grok", "perplexity"]
}
```

**Response**:
```json
{
  "evaluation_id": "eval_67890",
  "status": "processing",
  "estimated_time": null
}
```

### 평가 결과 조회 (GET /api/evaluations/:id)

**Response**:
```json
{
  "evaluation_id": "eval_67890",
  "politician_id": "pol_12345",
  "status": "completed",
  "created_at": "2025-11-01T10:00:00Z",
  "overall_score": 78.5,
  "scores_by_ai": {
    "claude": 80,
    "chatgpt": 77,
    "gemini": 79,
    "grok": 78,
    "perplexity": 78.5
  },
  "scores_by_criteria": {
    "청렴성": 85,
    "전문성": 80,
    "소통능력": 75,
    "리더십": 78,
    "책임감": 82,
    "투명성": 77,
    "대응성": 74,
    "비전": 79,
    "공익추구": 80,
    "윤리성": 76
  },
  "strengths": [
    "높은 청렴성과 투명한 재산 공개",
    "전문 분야에서의 뛰어난 역량"
  ],
  "improvements": [
    "시민과의 소통 강화 필요",
    "민원 대응 속도 개선 필요"
  ],
  "summary": "전체적으로 균형잡힌 역량을 보이며..."
}
```

### 시계열 데이터 (GET /api/evaluations/:id/chart)

**Response**:
```json
{
  "politician_id": "pol_12345",
  "data_points": [
    {
      "date": "2025-05-01",
      "claude": 75,
      "chatgpt": 73,
      "gemini": 76,
      "grok": 74,
      "perplexity": 75,
      "average": 74.6
    },
    {
      "date": "2025-06-01",
      "claude": 77,
      "chatgpt": 75,
      "gemini": 78,
      "grok": 76,
      "perplexity": 77,
      "average": 76.6
    }
  ]
}
```

---

## 우선순위

### 최우선 (MVP)
1. ✅ Claude API 연동 (완료)
2. 프롬프트 설계 (10개 분야)
3. 평가 로직 개발
4. 데이터베이스 구축
5. 기본 API 엔드포인트

### 2순위
6. ChatGPT, Gemini API 추가
7. 시계열 데이터 집계
8. 보안 강화

### 3순위
9. Grok, Perplexity API 추가
10. 프롬프트 A/B 테스트
11. 성능 최적화

---

## 연동 프로젝트

**PoliticianFinder**에서 다음 작업 진행:
- 평가 엔진 API 호출
- 평가 결과 UI 표시 (시계열 그래프 포함)
- 평가 결제 처리
- 정치인 본인 인증

---

**총 업무 수**: 90개
**단계**: Phase 1-9
**의존성/병렬성/인접성 표시 완료**