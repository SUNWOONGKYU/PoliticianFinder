# V40 AI 평가 엔진 - Agent Teams 가이드

## Agent Teams 개요

V40 정치인 평가를 **정치인별로 팀메이트를 배정**하여 병렬 실행한다.

### 팀 구성

| 역할 | 담당 | 작업 |
|------|------|------|
| **팀 리드** | 메인 세션 | 총괄 조율, 결과 취합 |
| **팀메이트 1** | 정치인 A | 전체 파이프라인 (수집→검증→평가→점수→보고서) |
| **팀메이트 2** | 정치인 B | 전체 파이프라인 (수집→검증→평가→점수→보고서) |

각 팀메이트는 배정된 정치인의 **전체 V40 파이프라인**을 독립 실행한다.

### 전체 파이프라인 (팀메이트당)

```
Phase 1: 데이터 수집 (collect_v40.py)
Phase 2: 검증/중복제거 (validate_v40_fixed.py --no-dry-run)
Phase 3: 4개 AI 평가 (evaluate_v40.py)
Phase 4: 점수 계산 (calculate_v40_scores.py)
Phase 5: 보고서 생성 (generate_report_v40.py)
```

### 핵심 스크립트 경로

```
V40/
├── scripts/core/
│   ├── validate_v40_fixed.py    # 검증/중복제거
│   ├── evaluate_v40.py          # 4개 AI 평가
│   ├── calculate_v40_scores.py  # 점수 계산
│   └── generate_report_v40.py   # 보고서 생성
├── scripts/helpers/
│   ├── gemini_collect_helper.py # Gemini CLI 수집 헬퍼
│   ├── claude_eval_helper.py    # Claude 평가 헬퍼
│   └── gemini_eval_helper.py    # Gemini 평가 헬퍼
└── scripts/workflow/
    └── run_v40_workflow.py      # 워크플로우 자동화
```

상위 디렉토리:
```
0-3_AI_Evaluation_Engine/
└── collect_v40.py               # 데이터 수집 (Gemini CLI + Naver API)
```

### V40 시스템 핵심 규칙

- **수집 채널**: 2개 (Gemini CLI + Naver API)
- **평가 AI**: 4개 (Claude, ChatGPT, Gemini, Grok)
- **카테고리**: 10개 (expertise, leadership, vision, integrity, ethics, accountability, transparency, communication, responsiveness, publicinterest)
- **등급**: +4 ~ -4, X (9단계), score = rating x 2
- **점수 공식**: category_score = (6.0 + avg_score * 0.5) * 10
- **최종 점수**: round(min(sum(10 categories), 1000)), 범위 200~1000
- **배치 크기**: 25
- **기간 제한**: OFFICIAL 4년, PUBLIC 2년
- **감성 유형**: negative / positive / free (neutral 아님)
- **보고서 파일명**: 보고서/{정치인명}_{YYYYMMDD}.md

---

## 스폰 프롬프트 템플릿

### 2명 동시 평가

```
V40 정치인 평가를 위한 agent team을 생성해줘.

팀메이트 2명을 각각 정치인 1명씩 배정:

팀메이트 1 - {정치인A 이름} (ID: {politician_id_A})
팀메이트 2 - {정치인B 이름} (ID: {politician_id_B})

각 팀메이트는 배정된 정치인의 전체 V40 파이프라인을 실행:
1. collect_v40.py로 데이터 수집
2. validate_v40_fixed.py --no-dry-run으로 검증/중복제거
3. evaluate_v40.py로 4개 AI 평가
4. calculate_v40_scores.py로 점수 계산
5. generate_report_v40.py로 보고서 생성

작업 디렉토리: 0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/
```

### 사용 예시

```
V40 정치인 평가를 위한 agent team을 생성해줘.

팀메이트 2명을 각각 정치인 1명씩 배정:

팀메이트 1 - 이재명 (ID: abc12345)
팀메이트 2 - 한동훈 (ID: def67890)

각 팀메이트는 배정된 정치인의 전체 V40 파이프라인을 실행:
1. collect_v40.py로 데이터 수집
2. validate_v40_fixed.py --no-dry-run으로 검증/중복제거
3. evaluate_v40.py로 4개 AI 평가
4. calculate_v40_scores.py로 점수 계산
5. generate_report_v40.py로 보고서 생성

작업 디렉토리: 0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/
```

### 팀 리드 역할

팀 리드(메인 세션)는:
1. 팀메이트 스폰 및 정치인 배정
2. 진행 상황 모니터링
3. 오류 발생 시 재시도 지시
4. 최종 결과 취합 및 보고
