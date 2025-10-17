# PoliticianFinder - 13DGC-AODM 프로젝트 그리드

**프로젝트명**: 13DGC-AODM (13-Dimensional Grid-Controlled AI-Only Development Management)
**목적**: AI-Only 방법론으로 정치인 역량 평가 시스템 개발
**버전**: v2.0 (Supabase 기반)
**최종 업데이트**: 2025-10-16

**협력 AI 전략**: 60% Claude / 20% Gemini / 20% ChatGPT

---

## 🎯 프로젝트 개요

정치인의 역량을 **12차원 (12D-GCDM)** 으로 평가하는 시스템을 **AI-Only 방법론 (13DGC-AODM)** 으로 개발합니다.

### 핵심 원칙
- ✅ **AI-Only 개발**: 인간 수동 개입 없이 AI 에이전트만으로 개발
- ✅ **프로젝트 그리드 (Project Grid)**: CSV/Excel로 모든 작업 관리
- ✅ **4계층 AI 협업**: 사용자(Controller) - 메인(PM) - 서브(실행자) - 협력(외부 AI)
- ✅ **비용 최적화**: Claude 60% / Gemini 20% / ChatGPT 20% 전략

---

## 📊 프로젝트 그리드 (Project Grid) 사용법

### CSV 파일 (메인 에이전트용)
- **파일**: `project_grid_v2.0_supabase.csv`
- **용도**: 메인 에이전트 (Claude Code)가 직접 읽기/쓰기
- **형식**: CSV (UTF-8)

### Excel 파일 (사용자 확인용)
- **파일**: `project_grid_v2.0_supabase.xlsx`
- **용도**: 사용자가 보기 편하게 색상/서식 적용된 파일
- **색상 규칙**:
  - 🟨 **작업ID, 업무** 행: 노란색 배경
  - 🟩 **진도, 상태** 행: 초록색 배경
  - 🌸 **테스트/검토** 행: 분홍색 배경
  - ✅ 볼드 폰트, 자동 열 너비, 첫 행/열 고정

### 자동 변환 명령어

```bash
# 1회성 변환 (CSV → Excel)
python csv_to_excel.py

# 자동 감시 모드 (CSV 변경 시 자동 Excel 생성)
python auto_sync.py

# Windows 통합 실행
run_sync.bat
```

### 프로젝트 그리드 구조
- **13개 차원**: 1 (X-axis: 8 Phases) + 1 (Y-axis: 영역) + 11 (속성)
- **영역**: Frontend, Backend, Database, RLS Policies, Authentication, Test & QA, DevOps & Infra, Security
- **11개 속성**: 작업ID, 업무, 작업지시서, 담당AI, 진도, 상태, 테스트/검토, 자동화방식, 의존작업, 블로커, 비고

---

## 📚 평가 방법론

국내외 정치 평가 연구를 종합하여 개발했습니다.

### 주요 참고 자료
1. **GovTrack.us** (미국) - 의정활동 평가
2. **Center for Effective Lawmaking** - 입법 효율성
3. **Transparency International** - 청렴도 평가
4. **매니페스토 프로젝트** (한국) - 공약 이행
5. **국민권익위원회** (한국) - 청렴도 측정

---

## 📊 평가 체계

### 10개 평가 분야
```
1. 청렴성 (Integrity)
2. 전문성 (Competence)
3. 소통능력 (Communication)
4. 리더십 (Leadership)
5. 책임감 (Accountability)
6. 투명성 (Transparency)
7. 대응성 (Responsiveness)
8. 비전 (Vision)
9. 공익추구 (Public Interest)
10. 윤리성 (Ethics)
```

### 100개 평가 항목
- 의정활동: 35개 항목
- 정치 경력: 25개 항목
- 개인 정보: 15개 항목
- 경제/재산: 10개 항목
- 사회활동: 15개 항목

---

## 🔄 2단계 평가 시스템

### PPS (Political Possibility Score) - 정치적 가능성 지수 (출마 전)
훌륭한 정치인이 될 가능성 평가

### PCS (Politician Competitiveness Score) - 정치인 경쟁력 지수 (출마 후)
경쟁력 있는 정치인 평가

### 4가지 평가 케이스
```
1. 출마 전 기성 정치인: 80/100 항목 활용
2. 출마 전 신인 정치인: 40/100 항목 활용
3. 출마 후 기성 정치인: 95/100 항목 활용
4. 출마 후 신인 정치인: 70/100 항목 활용
```

---

## 🏆 등급 체계

| 등급 | 점수 | 의미 |
|------|------|------|
| S | 95+ | 최고 수준 |
| A | 85-94 | 우수 |
| B | 75-84 | 준수 |
| C | 65-74 | 개선 필요 |
| D | <65 | 상당한 보완 필요 |

---

## 🤖 AI 자동 평가 시스템

### 워크플로우
```
사용자 검색 → AI 데이터 수집 → 100개 항목 분석 
→ 10개 분야 평가 → 점수 산출 → 결과 제공
```

### 데이터 출처
- 국회 의안정보시스템
- 중앙선거관리위원회
- 국민권익위원회
- 대법원 종합법률정보
- 공개 언론 자료
- SNS 공개 데이터

---

## 📁 주요 문서

### 핵심 문서
- `FINAL_WORKFLOW.md` - 전체 워크플로우
- `MASTER_EVALUATION_SYSTEM.md` - 평가 알고리즘 전체
- `100_ITEMS_COLLECTION_GUIDE.md` - 100개 항목 정의

### 설계 문서
- `SCORING_SYSTEM_VARIATIONS.md` - 케이스별 점수 계산
- `DATA_COLLECTION_SCOPE.md` - 데이터 수집 범위
- `EVALUATION_WORKFLOW.md` - 평가 프로세스

### 개발 문서
- `tasks/` 폴더 - 32개 개발 작업지시서
- `PROJECT_STATUS_SUMMARY.md` - 프로젝트 현황

---

## 🚀 기술 스택

### Backend
- Python 3.11+
- FastAPI
- PostgreSQL (Supabase)
- Anthropic Claude API

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS

### DevOps
- Vercel (Frontend)
- Railway (Backend)
- GitHub Actions

---

## 📋 개발 현황

### ✅ 완료
- [x] 평가 체계 설계
- [x] 100개 항목 정의
- [x] 알고리즘 개발
- [x] 워크플로우 확정
- [x] 법적 안전성 검토

### 🔄 진행 중
- [ ] Database 모델 구현
- [ ] Backend API 개발
- [ ] AI 자동 평가 구현
- [ ] Frontend UI 개발

---

## ⚖️ 법적 안전성

### 우리는 "평가"만 제공합니다
```
✅ 정치인의 역량을 객관적으로 평가
❌ 당선 가능성 제공 금지
❌ 특정 후보 지지 유도 금지
✅ 투명한 알고리즘 공개
✅ 최종 판단은 유권자의 몫
```

---

## 📞 프로젝트 정보

**프로젝트**: PoliticianFinder
**위치**: `G:\내 드라이브\Developement\PoliticianFinder\13DGC-AODM_Grid\`
**상태**: Phase 1 완료 (2025-10-16), Phase 2 진행 예정

### 핵심 문서
- **`13DGC-AODM 방법론.md`**: 전체 방법론 설명서
- **`project_grid_v2.0_supabase.csv`**: 프로젝트 그리드 (CSV)
- **`project_grid_v2.0_supabase.xlsx`**: 프로젝트 그리드 (Excel, 확인용)
- **`GRID_FORMAT_RESTORATION.md`**: 그리드 복원 기록

### 자동화 스크립트
- **`csv_to_excel.py`**: CSV → Excel 변환
- **`auto_sync.py`**: 자동 동기화
- **`run_sync.bat`**: Windows 통합 실행

---

**작성일**: 2025-10-16
**방법론**: 13DGC-AODM v1.1
**협력 AI**: Claude 60% / Gemini 20% / ChatGPT 20%
**라이선스**: Private (비공개)
