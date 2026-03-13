# CCI (Candidate Relative Competitive Index) — 출마자 상대적 경쟁력 지수

**작성일**: 2026-03-11
**버전**: V60 초안

---

## 전체 구조

```
CCI (Candidate Relative Competitive Index) — 출마자 상대적 경쟁력 지수
│
├── GPI (40%) — 훌륭한 정치인 지수 (Good Politician Index, V40 기존 평가 점수)
│   ├── 적격성 (30%) — 전문성, 리더십, 비전
│   ├── 도덕성 (40%) — 청렴성, 윤리성, 책임성, 투명성
│   └── 진정성 (30%) — 소통능력, 대응성, 공익성
│
├── Alpha 1: 민심·여론 (30%) — Public Sentiment
│   ├── 여론동향 — 여론조사 추이 + 바람 효과 [Nate Silver, 강원택(2010)]
│   ├── 이미지·내러티브 — 미디어 논조 + SNS + 브랜드 일관성 [Prior(2006), 한규섭]
│   └── 리스크 — 네거티브 취약점 역산 [이재묵(2018), Geer]
│
└── Alpha 2: 선거구조 (30%) — Electoral Structure
    ├── 정당경쟁력 — 정당 지지율 + 정당 프리미엄 + PVI [강원택(2016), Cook PVI]
    ├── 후보자경쟁력 — 현직효과 + 인지도 + 공천 상태 [Jacobson(2004), 황아란(2016)]
    └── 지역기반 — 연고 + 조직동원력 + 지역 서비스 [이갑윤(2011), Fenno(1978)]
```

---

## 용어 정의

| 항목 | 정의 |
|------|------|
| **CCI** | Candidate Relative Competitive Index — 출마자 상대적 경쟁력 지수 |
| **GPI** | Good Politician Index — 훌륭한 정치인 지수 (V40 기존 평가 점수) |
| **Alpha 1** | 민심·여론 (Public Sentiment) — 국민이 이 후보를 어떻게 보고 있는가 |
| **Alpha 2** | 선거구조 (Electoral Structure) — 이 후보가 선거에서 이길 구조적 조건이 있는가 |

---

## GPI 3축 상세 (V40 기존)

| 축 | 영문 | 비중 | 하위 카테고리 | 학술 근거 |
|----|------|------|-------------|----------|
| **적격성** | Competence | 30% (3개×10%) | 전문성, 리더십, 비전 | Stoker et al.(2024), Volden & Wiseman |
| **도덕성** | Integrity | 40% (4개×10%) | 청렴성, 윤리성, 책임성, 투명성 | Transparency International, UN SDG 16, OECD |
| **진정성** | Authenticity | 30% (3개×10%) | 소통능력, 대응성, 공익성 | Slough et al.(World Bank), LEVER(유럽) |

**원논문**: Valgardsson et al. (2024) "The Good Politician: Competence, Integrity and Authenticity in Seven Democracies", Political Studies (SAGE)

---

## Alpha 1 + Alpha 2 매핑 근거

기존 CCI 연구에서 도출된 5개 카테고리를 GPI/Alpha 구조로 재배치:

| 기존 5개 카테고리 | 재배치 위치 | 설명 |
|-----------------|-----------|------|
| 여론·지지기반 | 여론조사/바람 → **Alpha 1 여론동향**, 정당 프리미엄 → **Alpha 2 정당경쟁력** | 분리 배치 |
| 후보자 경쟁력 | 경력 → **GPI 적격성**, 현직/인지도/공천 → **Alpha 2 후보자경쟁력** | GPI 겹침 분리 |
| 지역 밀착도 | → **Alpha 2 지역기반** | 전체 이동 |
| 이미지·내러티브 | → **Alpha 1 이미지·내러티브** | 전체 이동 |
| 리스크 지수 | 도덕성 → **GPI 도덕성**, 네거티브 취약점 → **Alpha 1 리스크** | GPI 겹침 분리 |

---

## 직위별 가중치 차등 (논문 근거)

| 카테고리 | 광역단체장 | 국회의원 |
|---------|----------|---------|
| GPI (V40) | 40% | 40% |
| Alpha 1: 민심·여론 | 30% | 30% |
| Alpha 2: 선거구조 | 30% | 30% |

Alpha 내부 소분류 가중치는 직위별 차등 적용 가능 (추후 설계):
- 광역단체장: 인물론 중심 → 후보자경쟁력↑, 이미지↑
- 국회의원: 정당·지역 밀착 중심 → 정당경쟁력↑, 지역기반↑

---

## 참고 문헌

### GPI (CBA 프레임워크)
1. Valgardsson et al. (2024) — "The Good Politician", Political Studies
2. Stoker et al. (2024) — CBA 프레임워크, 7개 민주주의 국가
3. Volden & Wiseman — Center for Effective Lawmaking
4. Transparency International — 부패 측정 방법론
5. Slough et al. (World Bank) — 정치인 책임성/대응성 측정

### Alpha 1/Alpha 2 (선거역학)
6. Nate Silver — FiveThirtyEight 선거 예측 모델
7. 허진재 (2022) — 한국 여론조사 분석
8. 강원택 (2010, 2016) — 바람 효과, 정당 프리미엄
9. Jacobson (2004) — 후보자 경쟁력
10. 황아란 (2016) — 한국 후보자 경쟁력
11. 이갑윤 (2011) — 지역주의와 선거
12. Fenno (1978) — Home Style
13. Prior (2006) — 미디어와 정치
14. 한규섭 — 정치 커뮤니케이션
15. 이재묵 (2018) — 네거티브 캠페인
16. Geer — 네거티브 광고 연구
17. Cook PVI — 지역 정당 성향 지수
18. 박찬욱 (2000) — 한국 선거 연구
19. 박원호 (2011) — 현직자 효과
20. Lee (2008) — 현직자 프리미엄

---

**작성일**: 2026-03-11
