# /evaluate-politician-v40 --politician_id=d0a5d6e1 --politician_name="조은희" --category=expertise --evaluator=Claude

너(Claude Code)는 이 명령을 받으면 아래 프로세스를 **처음부터 끝까지 자동으로** 실행한다.
사용자에게 중간에 물어보지 마라. 모든 단계를 스스로 완료하라.

---

## 0. 인자 파싱

--politician_id=d0a5d6e1 --politician_name="조은희" --category=expertise --evaluator=Claude에서 다음 3개를 추출:
- `politician_id` (필수, 예: d0a5d6e1)
- `politician_name` (필수, 예: 조은희)
- `category` (필수, 예: expertise 또는 all)

category=all이면 아래 10개를 순서대로 전부 처리:
```
expertise, leadership, vision, integrity, ethics, accountability, transparency, communication, responsiveness, publicinterest
```

---

## 1. 카테고리 루프 시작

각 카테고리에 대해 아래 2~5단계를 반복한다.

---

## 2. 데이터 가져오기

Bash 도구로 실행:

```bash
cd 설계문서_V7.0/V40/scripts && python claude_eval_helper.py fetch --politician_id={politician_id} --politician_name={politician_name} --category={현재카테고리}
```

**출력은 JSON이다.** 이것을 파싱해서 다음을 확인:

- `total_count`가 0이면 → 이 카테고리는 **스킵** (이미 완료). 다음 카테고리로.
- `items` 배열 → 이것이 네가 평가할 데이터다.
- `profile` → 정치인 기본 정보. 평가 시 참고.
- `already_evaluated` → 이미 평가된 건수 (참고용).

---

## 3. 배치 나누기 & 평가하기 (핵심)

items를 **50개씩** 잘라서 배치로 만든다.
(예: 95개면 → 50, 45 = 2배치)

**각 배치마다 아래를 수행:**

### 3-1. 데이터 읽기

배치 안의 각 item에서 읽을 것:
- `id` (UUID) — 결과에 그대로 넣어야 함
- `title` — 기사/자료 제목
- `content` — 본문 (최대 500자 잘림)
- `source_name` / `source_url` — 출처
- `published_date` — 날짜
- `collector_ai` — 수집 AI (평가에 영향 없음, 무시해도 됨)

### 3-2. 평가 판단

각 item을 읽고, **현재 카테고리 관점에서** 등급을 부여한다.

```
등급 체계:
+4(+8점) 탁월 — 모범 사례, 법 제정, 대통령 표창 수준
+3(+6점) 우수 — 구체적 성과, 다수 법안 통과
+2(+4점) 양호 — 일반적 긍정 활동, 법안 발의
+1(+2점) 보통 — 노력, 출석, 기본 역량
-1(-2점) 미흡 — 비판 받음, 지적당함
-2(-4점) 부족 — 논란, 의혹 제기
-3(-6점) 심각 — 수사, 조사 착수
-4(-8점) 최악 — 유죄 확정, 법적 처벌
X (0점)  제외 — 아래 사유에 해당하면 반드시 X
```

**X 판정 (평가 제외) - 명백히 잘못된 데이터만:**
- 10년 이상 과거 사건 (2016년 이전)
- 동명이인 (명백히 다른 사람 - 정당/직책/지역 불일치)
- 가짜/날조 정보 (허위 사실)

**⚠️ 다음은 X가 아닌 낮은 평가로 처리:**
- 출석 명단, 회의 참석 → +1 (기본 직무 수행)
- 의안 제출 (내용 미상) → +1 (입법 활동 노력)
- 간단한 언급, 형식적 활동 → +1~+2 (최소한의 긍정)
- 간접적 관련 내용 → +1~+2 (관련성 인정)

**판단 원칙:**
- 긍정적 내용(성과, 업적, 칭찬) → +1 ~ +4
- 부정적 내용(논란, 비판, 문제) → -1 ~ -4
- **애매하면 낮은 점수라도 부여 (X는 확실한 오류만)**
- profile 정보와 일치하는 인물에 대해서만 평가
- rationale은 **반드시 한국어 1문장** (간결하게)

### 3-3. 결과 JSON 생성

이 형식을 **정확하게** 따라라:

```json
{
  "evaluations": [
    {"id": "원본 item의 UUID", "rating": "+3", "score": 6, "rationale": "규제개혁 성과로 행정 전문성 입증"},
    {"id": "원본 item의 UUID", "rating": "-2", "score": -4, "rationale": "예산 낭비 논란으로 전문성 의문 제기"},
    {"id": "원본 item의 UUID", "rating": "X", "score": 0, "rationale": "동명이인 데이터"}
  ]
}
```

**주의:**
- `id`는 fetch에서 받은 item의 `id` 값 그대로 복사 (UUID 형식)
- `rating`은 문자열: "+4", "+3", "+2", "+1", "-1", "-2", "-3", "-4", "X" 중 하나
- `score`는 rating에 대응: +4→8, +3→6, +2→4, +1→2, -1→-2, -2→-4, -3→-6, -4→-8, X→0
- `rationale`은 한국어 1문장
- evaluations 개수 = 배치 item 개수 (빠짐없이 전부)

---

## 4. DB에 저장

### 4-1. JSON 파일 쓰기

Write 도구로 파일 저장:
- 파일 경로: `설계문서_V7.0/V40/scripts/eval_result_{category}_batch_{N}.json`
- 내용: 3-3에서 만든 JSON

### 4-2. save 명령 실행

Bash 도구로 실행:

```bash
cd 설계문서_V7.0/V40/scripts && python claude_eval_helper.py save --politician_id={politician_id} --politician_name={politician_name} --category={현재카테고리} --input=eval_result_{category}_batch_{N}.json
```

출력에서 "OK:" 확인 → 성공.
"WARNING: 중복" → 이미 저장된 것, 정상.
"ERROR:" → 문제 발생. 사용자에게 보고.

### 4-3. 임시 파일 삭제

Bash 도구로:
```bash
rm 설계문서_V7.0/V40/scripts/eval_result_{category}_batch_{N}.json
```

### 4-4. 다음 배치로

남은 배치가 있으면 → 3단계로 돌아감.
모든 배치 완료 → 다음 카테고리로 (1단계 루프).

---

## 5. 최종 확인

모든 카테고리 완료 후, Bash 도구로:

```bash
cd 설계문서_V7.0/V40/scripts && python claude_eval_helper.py status --politician_id={politician_id}
```

결과를 사용자에게 보여준다.

---

## 속도 최적화 규칙 (반드시 지켜라)

1. **배치 크기 50개** — 10개씩 하면 너무 느리다. 50개씩 처리하라.
2. **출력 최소화** — 매 배치마다 장황하게 설명하지 마라. 진행 상황만 간단히:
   ```
   [expertise] 배치 1/2 완료 (50개 평가, 50개 저장)
   [expertise] 배치 2/2 완료 (45개 평가, 45개 저장)
   ```
3. **중간 보고 하지 마라** — "다음 배치를 진행할까요?" 같은 질문 금지. 끝까지 자동 진행.
4. **rationale 짧게** — 1문장, 최대 30자. 길게 쓰면 컨텍스트 낭비.
5. **fetch 결과를 변수처럼 기억** — 한 번 fetch하면 그 카테고리 전체 items를 기억하고 배치별로 잘라서 처리. 배치마다 다시 fetch하지 마라.

---

## 에러 처리

| 상황 | 대응 |
|------|------|
| fetch에서 items가 0개 | "이미 완료" 출력, 다음 카테고리로 |
| save에서 중복 에러 | 정상. 무시하고 진행 |
| save에서 다른 에러 | 사용자에게 에러 보고 후 다음 배치 계속 |
| Python 실행 에러 | .env 파일과 패키지 확인 안내 후 중단 |

---

## 실행 예시

사용자가 이렇게 입력하면:
```
/evaluate-politician-v40 --politician_id=d0a5d6e1 --politician_name=조은희 --category=expertise
```

너는 이렇게 진행한다:

```
1. Bash: python claude_eval_helper.py fetch --politician_id=d0a5d6e1 --politician_name=조은희 --category=expertise
2. JSON 파싱 → items 95개 확인
3. 배치1 (items 0~49): 50개 읽고 평가 → JSON 작성 → Write → save → 삭제
   [expertise] 배치 1/2 완료 (50개 저장)
4. 배치2 (items 50~94): 45개 읽고 평가 → JSON 작성 → Write → save → 삭제
   [expertise] 배치 2/2 완료 (45개 저장)
5. Bash: python claude_eval_helper.py status --politician_id=d0a5d6e1
6. 결과 출력
```

**전체 과정에서 사용자에게 질문하지 않는다. 자동으로 끝까지 실행한다.**
