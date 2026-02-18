# Gemini CLI 수집 가이드

## 사전 준비

Gemini CLI 터미널에서 작업 디렉토리 이동:
```bash
cd C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/scripts
```

## 프로세스 (카테고리별 반복)

### Step 1: 필요량 확인 (Claude Code 터미널)
```bash
python gemini_collect_helper.py fetch --politician_id=d0a5d6e1 --politician_name=조은희 --category={카테고리}
```

### Step 2: Gemini CLI에 프롬프트 붙여넣기

### Step 3: 결과 DB 저장 (Claude Code 터미널)
```bash
cd C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/scripts && python gemini_collect_helper.py save --politician_id=d0a5d6e1 --politician_name=조은희 --category={카테고리} --input=C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/collect/gemini_result_{카테고리}.json
```

### Step 4: 현황 확인
```bash
python gemini_collect_helper.py status --politician_id=d0a5d6e1
```

---

## 붙여넣기용 프롬프트

---

### communication (소통)

```
너는 구글 검색을 사용해서 한국 정치인 관련 뉴스/문서 URL을 수집하는 역할이야.

## 작업 방식 (반드시 지켜라)
1. 아래 검색어들을 구글에서 하나씩 검색해라
2. 검색 결과에 나오는 실제 URL을 그대로 복사해라
3. 각 결과의 제목, 내용, URL을 JSON으로 정리해라
4. 네가 아는 지식으로 URL을 만들지 마라. 반드시 구글 검색 결과에서 가져와라.

## 대상 정치인
- 이름: 조은희
- 정당: 국민의힘
- 직책: 제22대 국회의원 (서울 서초구갑)

## 카테고리: communication (소통)

## 검색어 목록 (하나씩 구글 검색 실행)

### OFFICIAL 검색 (36개 목표)
1. "조은희" site:assembly.go.kr
2. "조은희 의원" site:likms.assembly.go.kr
3. "조은희" site:korea.kr
4. "조은희 의원" site:moleg.go.kr
5. "조은희" 국회 발언 site:go.kr
6. "조은희" 국정감사 site:assembly.go.kr
7. "조은희" 토론회 site:go.kr
8. "조은희" 간담회 site:assembly.go.kr
9. "조은희" 질의 site:assembly.go.kr
10. "조은희 의원" 보도자료 site:go.kr
11. "조은희" 공청회 site:go.kr
12. "조은희" 세미나 site:assembly.go.kr

negative 3개 필요:
13. "조은희" 불통 site:go.kr
14. "조은희" 소통 부재 site:assembly.go.kr
15. "조은희" 논란 site:go.kr

positive 3개 필요:
16. "조은희" 소통 성과 site:go.kr
17. "조은희" 우수 의원 site:assembly.go.kr

### PUBLIC 검색 (24개 목표)
18. "조은희 의원" 소통
19. "조은희 의원" 간담회
20. "조은희 의원" 주민
21. "조은희" 서초구 민원
22. "조은희 의원" 기자회견
23. "조은희 의원" SNS
24. "조은희 의원" 인터뷰
25. "조은희 의원" 토론
26. "조은희 의원" 서초구 현장
27. "조은희 의원" 간담

negative 4개 필요:
28. "조은희 의원" 불통 논란
29. "조은희 의원" 소통 비판
30. "조은희 의원" 일방적

positive 4개 필요:
31. "조은희 의원" 소통 칭찬
32. "조은희 의원" 주민 호응

## 수집 규칙
- 각 검색어로 구글 검색을 실행하고, 결과 페이지에서 URL을 직접 가져와라
- 검색 결과가 없는 검색어는 건너뛰어라
- 같은 URL이 여러 검색어에서 나오면 한 번만 포함
- 조은희(국민의힘 국회의원)에 대한 것만 수집 (동명이인 제외)
- OFFICIAL: .go.kr 도메인만, 2022년 이후
- PUBLIC: 뉴스/블로그 등, 2024년 이후

## 출력

파일 저장 경로:
C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/collect/gemini_result_communication.json

JSON 형식:
[
  {
    "title": "검색 결과에 나온 실제 제목",
    "content": "기사 본문 요약 100~200자 (구체적 사실: 날짜, 장소, 법안명 등 포함)",
    "source": "매체명",
    "source_url": "구글 검색 결과에서 복사한 실제 전체 URL",
    "date": "2025-01-15",
    "data_type": "official 또는 public",
    "sentiment": "negative 또는 positive 또는 free"
  }
]

## 절대 금지
- URL을 네가 만들거나 추측하지 마라
- 도메인만 넣지 마라 (예: "https://www.assembly.go.kr" 만 넣기 금지)
- 구글 검색 결과에 나온 URL을 그대로 복사해라
- 최소 50개, 최대 60개 수집

위 검색어들을 구글에서 검색 시작해서 결과를 위 경로에 저장해줘.
```

---

### accountability (책임감)

```
너는 구글 검색을 사용해서 한국 정치인 관련 뉴스/문서 URL을 수집하는 역할이야.

## 작업 방식
1. 아래 검색어들을 구글에서 하나씩 검색해라
2. 검색 결과의 실제 URL을 그대로 복사해라
3. URL을 만들거나 추측하지 마라. 구글 검색 결과에서만 가져와라.

## 대상: 조은희 (국민의힘, 제22대 국회의원, 서울 서초구갑)
## 카테고리: accountability (책임감)

## 검색어 목록

### OFFICIAL (36개 목표, .go.kr, 2022~현재)
1. "조은희" 법안 발의 site:likms.assembly.go.kr
2. "조은희" 출석 site:assembly.go.kr
3. "조은희" 국정감사 site:assembly.go.kr
4. "조은희" 예산 site:assembly.go.kr
5. "조은희" 위원회 site:assembly.go.kr
6. "조은희" 본회의 site:assembly.go.kr
7. "조은희" 대표발의 site:likms.assembly.go.kr
8. "조은희" 공약 site:go.kr
9. "조은희" 결산 site:assembly.go.kr
10. "조은희 의원" site:assembly.go.kr 의정활동
11. "조은희" 무단 결석 site:assembly.go.kr
12. "조은희" 공약 이행 site:go.kr

### PUBLIC (24개 목표, 뉴스 등, 2024~현재)
13. "조은희 의원" 공약
14. "조은희 의원" 의정활동 평가
15. "조은희 의원" 출석률
16. "조은희 의원" 법안 성과
17. "조은희 의원" 책임
18. "조은희 의원" 약속
19. "조은희 의원" 성실
20. "조은희 의원" 공약 파기
21. "조은희 의원" 무책임
22. "조은희 의원" 의정 성적

## 출력
파일: C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/collect/gemini_result_accountability.json

JSON: [{"title":"검색결과 실제 제목","content":"구체적 요약 100~200자","source":"매체명","source_url":"구글검색결과에서 복사한 전체URL","date":"2025-01-15","data_type":"official/public","sentiment":"negative/positive/free"}]

절대 금지: URL 만들기/추측, 도메인만 넣기. 최소 50개~최대 60개.
구글 검색 시작해서 위 경로에 저장해줘.
```

---

### responsiveness (대응성)

```
너는 구글 검색을 사용해서 한국 정치인 관련 뉴스/문서 URL을 수집하는 역할이야.

## 작업 방식
1. 아래 검색어들을 구글에서 하나씩 검색해라
2. 검색 결과의 실제 URL을 그대로 복사해라
3. URL을 만들거나 추측하지 마라.

## 대상: 조은희 (국민의힘, 제22대 국회의원, 서울 서초구갑)
## 카테고리: responsiveness (대응성)

## 검색어 목록

### OFFICIAL (36개, .go.kr, 2022~현재)
1. "조은희" 긴급 질의 site:assembly.go.kr
2. "조은희" 대정부질문 site:assembly.go.kr
3. "조은희" 현안 site:assembly.go.kr
4. "조은희" 재난 site:go.kr
5. "조은희" 민원 site:go.kr
6. "조은희" 대응 site:assembly.go.kr
7. "조은희" 현장 방문 site:go.kr
8. "조은희" 긴급현안질의 site:assembly.go.kr
9. "조은희" 서초구 site:go.kr
10. "조은희" 안전 site:go.kr
11. "조은희" 늑장 site:go.kr
12. "조은희" 신속 대응 site:go.kr

### PUBLIC (24개, 뉴스 등, 2024~현재)
13. "조은희 의원" 대응
14. "조은희 의원" 현장
15. "조은희 의원" 민원 해결
16. "조은희 의원" 서초구 문제
17. "조은희 의원" 재난 대응
18. "조은희 의원" 늑장 대응
19. "조은희 의원" 방관
20. "조은희 의원" 발빠른
21. "조은희 의원" 긴급
22. "조은희 의원" 주민 요구

## 출력
파일: C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/collect/gemini_result_responsiveness.json

JSON: [{"title":"실제 제목","content":"구체적 요약 100~200자","source":"매체명","source_url":"구글검색 실제URL","date":"2025-01-15","data_type":"official/public","sentiment":"negative/positive/free"}]

절대 금지: URL 만들기/추측, 도메인만 넣기. 최소 50개~최대 60개.
구글 검색 시작해서 위 경로에 저장해줘.
```

---

### integrity (청렴성)

```
너는 구글 검색을 사용해서 한국 정치인 관련 뉴스/문서 URL을 수집하는 역할이야.

## 작업 방식
1. 아래 검색어들을 구글에서 하나씩 검색해라
2. 검색 결과의 실제 URL을 그대로 복사해라
3. URL을 만들거나 추측하지 마라.

## 대상: 조은희 (국민의힘, 제22대 국회의원, 서울 서초구갑)
## 카테고리: integrity (청렴성)

## 검색어 목록

### OFFICIAL (36개, .go.kr, 2022~현재)
1. "조은희" 재산 site:peti.go.kr
2. "조은희" 정치자금 site:nec.go.kr
3. "조은희" 재산신고 site:go.kr
4. "조은희" 공직자윤리 site:go.kr
5. "조은희" 후원금 site:nec.go.kr
6. "조은희" 이해충돌 site:assembly.go.kr
7. "조은희" 청렴 site:go.kr
8. "조은희" 겸직 site:assembly.go.kr
9. "조은희" 선거비용 site:nec.go.kr
10. "조은희" 재산 공개 site:go.kr

### PUBLIC (24개, 뉴스 등, 2024~현재)
11. "조은희 의원" 재산
12. "조은희 의원" 비리
13. "조은희 의원" 청렴
14. "조은희 의원" 부패
15. "조은희 의원" 이해충돌
16. "조은희 의원" 정치자금
17. "조은희 의원" 후원금
18. "조은희 의원" 도덕
19. "조은희 의원" 의혹
20. "조은희 의원" 깨끗한

## 출력
파일: C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/collect/gemini_result_integrity.json

JSON: [{"title":"실제 제목","content":"구체적 요약 100~200자","source":"매체명","source_url":"구글검색 실제URL","date":"2025-01-15","data_type":"official/public","sentiment":"negative/positive/free"}]

절대 금지: URL 만들기/추측, 도메인만 넣기. 최소 50개~최대 60개.
구글 검색 시작해서 위 경로에 저장해줘.
```

---

### transparency (투명성)

```
너는 구글 검색을 사용해서 한국 정치인 관련 뉴스/문서 URL을 수집하는 역할이야.

## 작업 방식
1. 아래 검색어들을 구글에서 하나씩 검색해라
2. 검색 결과의 실제 URL을 그대로 복사해라
3. URL을 만들거나 추측하지 마라.

## 대상: 조은희 (국민의힘, 제22대 국회의원, 서울 서초구갑)
## 카테고리: transparency (투명성)

## 검색어 목록

### OFFICIAL (36개, .go.kr, 2022~현재)
1. "조은희" 정보공개 site:assembly.go.kr
2. "조은희" 회의록 site:likms.assembly.go.kr
3. "조은희" 의안 site:likms.assembly.go.kr
4. "조은희" 예산 공개 site:assembly.go.kr
5. "조은희" 공개 site:go.kr
6. "조은희" 의정활동 site:assembly.go.kr
7. "조은희" 심사 site:assembly.go.kr
8. "조은희" 보고 site:go.kr
9. "조은희" 의사록 site:assembly.go.kr
10. "조은희" 속기록 site:assembly.go.kr

### PUBLIC (24개, 뉴스 등, 2024~현재)
11. "조은희 의원" 투명
12. "조은희 의원" 정보공개
13. "조은희 의원" 밀실
14. "조은희 의원" 불투명
15. "조은희 의원" 공개
16. "조은희 의원" 열린
17. "조은희 의원" 비공개
18. "조은희 의원" 의정활동 공개
19. "조은희 의원" 예산 투명
20. "조은희 의원" 국민 알권리

## 출력
파일: C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/collect/gemini_result_transparency.json

JSON: [{"title":"실제 제목","content":"구체적 요약 100~200자","source":"매체명","source_url":"구글검색 실제URL","date":"2025-01-15","data_type":"official/public","sentiment":"negative/positive/free"}]

절대 금지: URL 만들기/추측, 도메인만 넣기. 최소 50개~최대 60개.
구글 검색 시작해서 위 경로에 저장해줘.
```

---

### vision (비전)

```
너는 구글 검색을 사용해서 한국 정치인 관련 뉴스/문서 URL을 수집하는 역할이야.

## 작업 방식
1. 아래 검색어들을 구글에서 하나씩 검색해라
2. 검색 결과의 실제 URL을 그대로 복사해라
3. URL을 만들거나 추측하지 마라.

## 대상: 조은희 (국민의힘, 제22대 국회의원, 서울 서초구갑)
## 카테고리: vision (비전)

## 검색어 목록

### OFFICIAL (36개, .go.kr, 2022~현재)
1. "조은희" 정책 site:assembly.go.kr
2. "조은희" 공약 site:go.kr
3. "조은희" 비전 site:assembly.go.kr
4. "조은희" 법안 취지 site:likms.assembly.go.kr
5. "조은희" 제안 설명 site:likms.assembly.go.kr
6. "조은희" 미래 site:go.kr
7. "조은희" 계획 site:assembly.go.kr
8. "조은희" 전략 site:go.kr
9. "조은희" 혁신 site:go.kr
10. "조은희" 발전 방안 site:assembly.go.kr

### PUBLIC (24개, 뉴스 등, 2024~현재)
11. "조은희 의원" 정책
12. "조은희 의원" 비전
13. "조은희 의원" 공약
14. "조은희 의원" 미래
15. "조은희 의원" 계획
16. "조은희 의원" 구상
17. "조은희 의원" 청사진
18. "조은희 의원" 비전 부재
19. "조은희 의원" 정책 방향
20. "조은희 의원" 혁신

## 출력
파일: C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/collect/gemini_result_vision.json

JSON: [{"title":"실제 제목","content":"구체적 요약 100~200자","source":"매체명","source_url":"구글검색 실제URL","date":"2025-01-15","data_type":"official/public","sentiment":"negative/positive/free"}]

절대 금지: URL 만들기/추측, 도메인만 넣기. 최소 50개~최대 60개.
구글 검색 시작해서 위 경로에 저장해줘.
```

---

### ethics (윤리)

```
너는 구글 검색을 사용해서 한국 정치인 관련 뉴스/문서 URL을 수집하는 역할이야.

## 작업 방식
1. 아래 검색어들을 구글에서 하나씩 검색해라
2. 검색 결과의 실제 URL을 그대로 복사해라
3. URL을 만들거나 추측하지 마라.

## 대상: 조은희 (국민의힘, 제22대 국회의원, 서울 서초구갑)
## 카테고리: ethics (윤리)

## 검색어 목록

### OFFICIAL (36개, .go.kr, 2022~현재)
1. "조은희" 윤리 site:assembly.go.kr
2. "조은희" 징계 site:assembly.go.kr
3. "조은희" 윤리위 site:assembly.go.kr
4. "조은희" 품위 site:assembly.go.kr
5. "조은희" 윤리강령 site:go.kr
6. "조은희" 선거법 site:nec.go.kr
7. "조은희" 정치윤리 site:go.kr
8. "조은희" 행동강령 site:assembly.go.kr
9. "조은희" 도덕 site:go.kr
10. "조은희" 법안 윤리 site:likms.assembly.go.kr

### PUBLIC (24개, 뉴스 등, 2024~현재)
11. "조은희 의원" 윤리
12. "조은희 의원" 막말
13. "조은희 의원" 갑질
14. "조은희 의원" 논란
15. "조은희 의원" 도덕성
16. "조은희 의원" 품위
17. "조은희 의원" 선거법 위반
18. "조은희 의원" 징계
19. "조은희 의원" 사과
20. "조은희 의원" 모범

## 출력
파일: C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/collect/gemini_result_ethics.json

JSON: [{"title":"실제 제목","content":"구체적 요약 100~200자","source":"매체명","source_url":"구글검색 실제URL","date":"2025-01-15","data_type":"official/public","sentiment":"negative/positive/free"}]

절대 금지: URL 만들기/추측, 도메인만 넣기. 최소 50개~최대 60개.
구글 검색 시작해서 위 경로에 저장해줘.
```

---

### leadership (리더십)

```
너는 구글 검색을 사용해서 한국 정치인 관련 뉴스/문서 URL을 수집하는 역할이야.

## 작업 방식
1. 아래 검색어들을 구글에서 하나씩 검색해라
2. 검색 결과의 실제 URL을 그대로 복사해라
3. URL을 만들거나 추측하지 마라.

## 대상: 조은희 (국민의힘, 제22대 국회의원, 서울 서초구갑)
## 카테고리: leadership (리더십)

## 검색어 목록

### OFFICIAL (36개, .go.kr, 2022~현재)
1. "조은희" 위원장 site:assembly.go.kr
2. "조은희" 간사 site:assembly.go.kr
3. "조은희" 당직 site:go.kr
4. "조은희" 원내 site:assembly.go.kr
5. "조은희" 교섭 site:assembly.go.kr
6. "조은희" 주재 site:assembly.go.kr
7. "조은희" 대표 site:assembly.go.kr
8. "조은희" 위원 site:assembly.go.kr
9. "조은희" 특위 site:assembly.go.kr
10. "조은희" 소위 site:assembly.go.kr

### PUBLIC (24개, 뉴스 등, 2024~현재)
11. "조은희 의원" 리더십
12. "조은희 의원" 위원장
13. "조은희 의원" 당내
14. "조은희 의원" 영향력
15. "조은희 의원" 원내부대표
16. "조은희 의원" 주도
17. "조은희 의원" 연대
18. "조은희 의원" 협상
19. "조은희 의원" 존재감
20. "조은희 의원" 역할

## 출력
파일: C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/collect/gemini_result_leadership.json

JSON: [{"title":"실제 제목","content":"구체적 요약 100~200자","source":"매체명","source_url":"구글검색 실제URL","date":"2025-01-15","data_type":"official/public","sentiment":"negative/positive/free"}]

절대 금지: URL 만들기/추측, 도메인만 넣기. 최소 50개~최대 60개.
구글 검색 시작해서 위 경로에 저장해줘.
```

---

### publicinterest (공익)

```
너는 구글 검색을 사용해서 한국 정치인 관련 뉴스/문서 URL을 수집하는 역할이야.

## 작업 방식
1. 아래 검색어들을 구글에서 하나씩 검색해라
2. 검색 결과의 실제 URL을 그대로 복사해라
3. URL을 만들거나 추측하지 마라.

## 대상: 조은희 (국민의힘, 제22대 국회의원, 서울 서초구갑)
## 카테고리: publicinterest (공익)

## 검색어 목록

### OFFICIAL (36개, .go.kr, 2022~현재)
1. "조은희" 공익 site:assembly.go.kr
2. "조은희" 봉사 site:go.kr
3. "조은희" 약자 보호 site:assembly.go.kr
4. "조은희" 복지 site:assembly.go.kr
5. "조은희" 사회공헌 site:go.kr
6. "조은희" 시민 site:assembly.go.kr
7. "조은희" 기부 site:go.kr
8. "조은희" 취약계층 site:assembly.go.kr
9. "조은희" 돌봄 site:likms.assembly.go.kr
10. "조은희" 인권 site:go.kr

### PUBLIC (24개, 뉴스 등, 2024~현재)
11. "조은희 의원" 공익
12. "조은희 의원" 봉사
13. "조은희 의원" 기부
14. "조은희 의원" 사회공헌
15. "조은희 의원" 약자
16. "조은희 의원" 복지
17. "조은희 의원" 돌봄
18. "조은희 의원" 사익
19. "조은희 의원" 이익단체
20. "조은희 의원" 취약계층

## 출력
파일: C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/collect/gemini_result_publicinterest.json

JSON: [{"title":"실제 제목","content":"구체적 요약 100~200자","source":"매체명","source_url":"구글검색 실제URL","date":"2025-01-15","data_type":"official/public","sentiment":"negative/positive/free"}]

절대 금지: URL 만들기/추측, 도메인만 넣기. 최소 50개~최대 60개.
구글 검색 시작해서 위 경로에 저장해줘.
```

---

### expertise (전문성)

```
너는 구글 검색을 사용해서 한국 정치인 관련 뉴스/문서 URL을 수집하는 역할이야.

## 작업 방식
1. 아래 검색어들을 구글에서 하나씩 검색해라
2. 검색 결과의 실제 URL을 그대로 복사해라
3. URL을 만들거나 추측하지 마라.

## 대상: 조은희 (국민의힘, 제22대 국회의원, 서울 서초구갑)
## 카테고리: expertise (전문성)

## 검색어 목록

### OFFICIAL (36개, .go.kr, 2022~현재)
1. "조은희" 전문 site:assembly.go.kr
2. "조은희" 법안 분석 site:likms.assembly.go.kr
3. "조은희" 경력 site:assembly.go.kr
4. "조은희" 전문위원 site:assembly.go.kr
5. "조은희" 학력 site:go.kr
6. "조은희" 정책 분석 site:assembly.go.kr
7. "조은희" 입법 site:likms.assembly.go.kr
8. "조은희" 연구 site:go.kr
9. "조은희" 검토 site:assembly.go.kr
10. "조은희" 조사 site:assembly.go.kr

### PUBLIC (24개, 뉴스 등, 2024~현재)
11. "조은희 의원" 전문성
12. "조은희 의원" 전문가
13. "조은희 의원" 정책 역량
14. "조은희 의원" 입법 성과
15. "조은희 의원" 경력
16. "조은희 의원" 법안 분석
17. "조은희 의원" 전문 분야
18. "조은희 의원" 역량 부족
19. "조은희 의원" 무지
20. "조은희 의원" 학력

## 출력
파일: C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/collect/gemini_result_expertise.json

JSON: [{"title":"실제 제목","content":"구체적 요약 100~200자","source":"매체명","source_url":"구글검색 실제URL","date":"2025-01-15","data_type":"official/public","sentiment":"negative/positive/free"}]

절대 금지: URL 만들기/추측, 도메인만 넣기. 최소 50개~최대 60개.
구글 검색 시작해서 위 경로에 저장해줘.
```

---

## 수집 후 저장 명령 (Claude Code 터미널)

각 카테고리 수집 완료 후:
```bash
cd C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/scripts && python gemini_collect_helper.py save --politician_id=d0a5d6e1 --politician_name=조은희 --category={카테고리} --input=C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/results/collect/gemini_result_{카테고리}.json
```
