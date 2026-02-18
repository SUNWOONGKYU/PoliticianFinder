# Gemini CLI 평가 가이드

## 사전 준비

Gemini CLI 터미널에서 작업 디렉토리 이동:
```bash
cd C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/scripts
```

## 프로세스 (카테고리별 반복)

### Step 1: 평가할 데이터 조회 (Claude Code 터미널)
```bash
python gemini_eval_helper.py fetch --politician_id=d0a5d6e1 --politician_name=조은희 --category={카테고리}
```

출력된 JSON에서 `items` 배열을 복사

### Step 2: Gemini CLI에 프롬프트 붙여넣기

아래 카테고리별 프롬프트에 `items` 배열을 붙여서 Gemini CLI에 입력

### Step 3: 결과 DB 저장 (Claude Code 터미널)
```bash
cd C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/scripts && python gemini_eval_helper.py save --politician_id=d0a5d6e1 --politician_name=조은희 --category={카테고리} --input=C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/evaluate/gemini_eval_result_{카테고리}.json
```

### Step 4: 현황 확인
```bash
python gemini_eval_helper.py status --politician_id=d0a5d6e1
```

---

## 평가 등급 체계 (공통)

```
+4 (+8점) 탁월: 모범 사례, 법 제정, 대통령 표창 수준
+3 (+6점) 우수: 구체적 성과, 다수 법안 통과
+2 (+4점) 양호: 일반적 긍정 활동, 법안 발의
+1 (+2점) 보통: 노력, 출석, 기본 역량

-1 (-2점) 미흡: 비판 받음, 지적당함
-2 (-4점) 부족: 논란, 의혹 제기
-3 (-6점) 심각: 수사, 조사 착수
-4 (-8점) 최악: 유죄 확정, 법적 처벌

X (0점) 제외: 10년+ 과거, 동명이인, 무관 내용, 가짜 정보, 의미 없는 데이터
```

---

## 붙여넣기용 프롬프트

---

### expertise (전문성)

```
너는 정치인 평가 AI야. 아래 데이터를 읽고 **전문성** 관점에서 등급을 매겨라.

## 대상 정치인
- 이름: 조은희
- 정당: 국민의힘
- 직책: 제22대 국회의원 (서울 서초구갑)

## 평가 기준: 전문성
- 법안 분석 능력, 정책 전문성, 경력 활용, 입법 역량
- 긍정: 전문적 법안 발의, 정책 성과, 전문 지식 활용
- 부정: 전문성 부족 지적, 무지, 역량 논란

## 등급 체계
+4(+8점)탁월 | +3(+6점)우수 | +2(+4점)양호 | +1(+2점)보통
-1(-2점)미흡 | -2(-4점)부족 | -3(-6점)심각 | -4(-8점)최악
X(0점)제외: 10년+과거/동명이인/무관/날조

## 평가할 데이터 (items 배열을 여기에 붙여넣기)
[
  {
    "id": "...",
    "title": "...",
    "content": "...",
    "source_url": "...",
    "source_name": "...",
    "published_date": "...",
    "collector_ai": "...",
    "data_type": "...",
    "sentiment": "..."
  }
]

## 출력 형식

파일 저장 경로:
C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/evaluate/gemini_eval_result_expertise.json

JSON 형식:
{
  "evaluations": [
    {"id": "원본 item의 id", "rating": "+3", "score": 6, "rationale": "한국어 1문장 근거"},
    {"id": "원본 item의 id", "rating": "-2", "score": -4, "rationale": "한국어 1문장 근거"},
    {"id": "원본 item의 id", "rating": "X", "score": 0, "rationale": "동명이인 데이터"}
  ]
}

주의:
- id는 원본 item의 id 그대로 복사
- rating은 문자열: "+4", "+3", "+2", "+1", "-1", "-2", "-3", "-4", "X"
- score는 rating에 대응: +4→8, +3→6, +2→4, +1→2, -1→-2, -2→-4, -3→-6, -4→-8, X→0
- rationale은 한국어 1문장 (최대 30자)
- 모든 item을 빠짐없이 평가

위 경로에 저장해줘.
```

---

### leadership (리더십)

```
너는 정치인 평가 AI야. 아래 데이터를 읽고 **리더십** 관점에서 등급을 매겨라.

## 대상: 조은희 (국민의힘, 제22대 국회의원, 서울 서초구갑)

## 평가 기준: 리더십
- 위원장/간사 등 직책 수행, 당내 영향력, 협상 능력, 주도적 역할
- 긍정: 위원회 주도, 당내 역할, 합의 이끌어냄, 존재감
- 부정: 리더십 부족, 영향력 없음, 존재감 미미

## 등급 체계
+4(+8점)탁월 | +3(+6점)우수 | +2(+4점)양호 | +1(+2점)보통
-1(-2점)미흡 | -2(-4점)부족 | -3(-6점)심각 | -4(-8점)최악
X(0점)제외: 10년+과거/동명이인/무관/날조

## 평가할 데이터 (items 배열을 여기에 붙여넣기)
[...]

## 출력
파일: C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/evaluate/gemini_eval_result_leadership.json

JSON: {"evaluations": [{"id":"...", "rating":"+3", "score":6, "rationale":"1문장"}]}

위 경로에 저장해줘.
```

---

### vision (비전)

```
너는 정치인 평가 AI야. 아래 데이터를 읽고 **비전** 관점에서 등급을 매겨라.

## 대상: 조은희 (국민의힘, 제22대 국회의원, 서울 서초구갑)

## 평가 기준: 비전
- 정책 방향성, 미래 계획, 공약 구상력, 혁신 제안
- 긍정: 명확한 비전 제시, 혁신적 정책, 장기 계획
- 부정: 비전 부재, 방향성 없음, 단기 포퓰리즘

## 등급 체계
+4(+8점)탁월 | +3(+6점)우수 | +2(+4점)양호 | +1(+2점)보통
-1(-2점)미흡 | -2(-4점)부족 | -3(-6점)심각 | -4(-8점)최악
X(0점)제외: 10년+과거/동명이인/무관/날조

## 평가할 데이터 (items 배열을 여기에 붙여넣기)
[...]

## 출력
파일: C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/evaluate/gemini_eval_result_vision.json

JSON: {"evaluations": [{"id":"...", "rating":"+3", "score":6, "rationale":"1문장"}]}

위 경로에 저장해줘.
```

---

### integrity (청렴성)

```
너는 정치인 평가 AI야. 아래 데이터를 읽고 **청렴성** 관점에서 등급을 매겨라.

## 대상: 조은희 (국민의힘, 제22대 국회의원, 서울 서초구갑)

## 평가 기준: 청렴성
- 재산 공개 투명성, 비리 여부, 이해충돌 방지, 도덕성
- 긍정: 깨끗한 재산, 청렴 인정, 투명한 자금 관리
- 부정: 비리 의혹, 재산 논란, 정치자금 문제, 부패

## 등급 체계
+4(+8점)탁월 | +3(+6점)우수 | +2(+4점)양호 | +1(+2점)보통
-1(-2점)미흡 | -2(-4점)부족 | -3(-6점)심각 | -4(-8점)최악
X(0점)제외: 10년+과거/동명이인/무관/날조

## 평가할 데이터 (items 배열을 여기에 붙여넣기)
[...]

## 출력
파일: C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/evaluate/gemini_eval_result_integrity.json

JSON: {"evaluations": [{"id":"...", "rating":"+3", "score":6, "rationale":"1문장"}]}

위 경로에 저장해줘.
```

---

### ethics (윤리)

```
너는 정치인 평가 AI야. 아래 데이터를 읽고 **윤리** 관점에서 등급을 매겨라.

## 대상: 조은희 (국민의힘, 제22대 국회의원, 서울 서초구갑)

## 평가 기준: 윤리
- 정치윤리 준수, 품위 유지, 막말/갑질 여부, 징계 이력
- 긍정: 윤리 모범, 품위 유지, 윤리강령 준수
- 부정: 막말 논란, 갑질, 선거법 위반, 윤리위 징계

## 등급 체계
+4(+8점)탁월 | +3(+6점)우수 | +2(+4점)양호 | +1(+2점)보통
-1(-2점)미흡 | -2(-4점)부족 | -3(-6점)심각 | -4(-8점)최악
X(0점)제외: 10년+과거/동명이인/무관/날조

## 평가할 데이터 (items 배열을 여기에 붙여넣기)
[...]

## 출력
파일: C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/evaluate/gemini_eval_result_ethics.json

JSON: {"evaluations": [{"id":"...", "rating":"+3", "score":6, "rationale":"1문장"}]}

위 경로에 저장해줘.
```

---

### accountability (책임감)

```
너는 정치인 평가 AI야. 아래 데이터를 읽고 **책임감** 관점에서 등급을 매겨라.

## 대상: 조은희 (국민의힘, 제22대 국회의원, 서울 서초구갑)

## 평가 기준: 책임감
- 공약 이행, 출석률, 의정활동 성실성, 법안 발의 실행
- 긍정: 공약 이행, 높은 출석률, 성실한 활동
- 부정: 공약 파기, 무단 결석, 무책임, 의정 성적 저조

## 등급 체계
+4(+8점)탁월 | +3(+6점)우수 | +2(+4점)양호 | +1(+2점)보통
-1(-2점)미흡 | -2(-4점)부족 | -3(-6점)심각 | -4(-8점)최악
X(0점)제외: 10년+과거/동명이인/무관/날조

## 평가할 데이터 (items 배열을 여기에 붙여넣기)
[...]

## 출력
파일: C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/evaluate/gemini_eval_result_accountability.json

JSON: {"evaluations": [{"id":"...", "rating":"+3", "score":6, "rationale":"1문장"}]}

위 경로에 저장해줘.
```

---

### transparency (투명성)

```
너는 정치인 평가 AI야. 아래 데이터를 읽고 **투명성** 관점에서 등급을 매겨라.

## 대상: 조은희 (국민의힘, 제22대 국회의원, 서울 서초구갑)

## 평가 기준: 투명성
- 정보공개 정도, 의정활동 공개, 예산 투명성, 회의록 공개
- 긍정: 적극적 정보공개, 투명한 활동, 열린 소통
- 부정: 밀실 협상, 불투명, 비공개, 정보 은폐

## 등급 체계
+4(+8점)탁월 | +3(+6점)우수 | +2(+4점)양호 | +1(+2점)보통
-1(-2점)미흡 | -2(-4점)부족 | -3(-6점)심각 | -4(-8점)최악
X(0점)제외: 10년+과거/동명이인/무관/날조

## 평가할 데이터 (items 배열을 여기에 붙여넣기)
[...]

## 출력
파일: C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/evaluate/gemini_eval_result_transparency.json

JSON: {"evaluations": [{"id":"...", "rating":"+3", "score":6, "rationale":"1문장"}]}

위 경로에 저장해줘.
```

---

### communication (소통)

```
너는 정치인 평가 AI야. 아래 데이터를 읽고 **소통능력** 관점에서 등급을 매겨라.

## 대상: 조은희 (국민의힘, 제22대 국회의원, 서울 서초구갑)

## 평가 기준: 소통능력
- 주민 간담회, 민원 대응, SNS 활동, 현장 소통
- 긍정: 적극적 소통, 주민 의견 청취, 빠른 대응
- 부정: 불통 논란, 소통 부재, 일방적, 무응답

## 등급 체계
+4(+8점)탁월 | +3(+6점)우수 | +2(+4점)양호 | +1(+2점)보통
-1(-2점)미흡 | -2(-4점)부족 | -3(-6점)심각 | -4(-8점)최악
X(0점)제외: 10년+과거/동명이인/무관/날조

## 평가할 데이터 (items 배열을 여기에 붙여넣기)
[...]

## 출력
파일: C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/evaluate/gemini_eval_result_communication.json

JSON: {"evaluations": [{"id":"...", "rating":"+3", "score":6, "rationale":"1문장"}]}

위 경로에 저장해줘.
```

---

### responsiveness (대응성)

```
너는 정치인 평가 AI야. 아래 데이터를 읽고 **대응성** 관점에서 등급을 매겨라.

## 대상: 조은희 (국민의힘, 제22대 국회의원, 서울 서초구갑)

## 평가 기준: 대응성
- 현안 대응 속도, 재난 대응, 민원 해결 능력, 긴급 상황 처리
- 긍정: 발빠른 대응, 신속 처리, 현장 방문, 즉각 해결
- 부정: 늑장 대응, 방관, 무대응, 책임 회피

## 등급 체계
+4(+8점)탁월 | +3(+6점)우수 | +2(+4점)양호 | +1(+2점)보통
-1(-2점)미흡 | -2(-4점)부족 | -3(-6점)심각 | -4(-8점)최악
X(0점)제외: 10년+과거/동명이인/무관/날조

## 평가할 데이터 (items 배열을 여기에 붙여넣기)
[...]

## 출력
파일: C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/evaluate/gemini_eval_result_responsiveness.json

JSON: {"evaluations": [{"id":"...", "rating":"+3", "score":6, "rationale":"1문장"}]}

위 경로에 저장해줘.
```

---

### publicinterest (공익성)

```
너는 정치인 평가 AI야. 아래 데이터를 읽고 **공익성** 관점에서 등급을 매겨라.

## 대상: 조은희 (국민의힘, 제22대 국회의원, 서울 서초구갑)

## 평가 기준: 공익성
- 약자 보호, 복지 증진, 사회공헌, 취약계층 지원, 공공이익 추구
- 긍정: 약자 보호 법안, 복지 확대, 기부 봉사, 공익 활동
- 부정: 사익 추구, 이익단체 편향, 특혜, 공익 무시

## 등급 체계
+4(+8점)탁월 | +3(+6점)우수 | +2(+4점)양호 | +1(+2점)보통
-1(-2점)미흡 | -2(-4점)부족 | -3(-6점)심각 | -4(-8점)최악
X(0점)제외: 10년+과거/동명이인/무관/날조

## 평가할 데이터 (items 배열을 여기에 붙여넣기)
[...]

## 출력
파일: C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/evaluate/gemini_eval_result_publicinterest.json

JSON: {"evaluations": [{"id":"...", "rating":"+3", "score":6, "rationale":"1문장"}]}

위 경로에 저장해줘.
```

---

## 전체 카테고리 평가 후 저장 명령 (Claude Code 터미널)

각 카테고리 평가 완료 후:
```bash
cd C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/scripts && python gemini_eval_helper.py save --politician_id=d0a5d6e1 --politician_name=조은희 --category={카테고리} --input=C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/evaluate/gemini_eval_result_{카테고리}.json
```
