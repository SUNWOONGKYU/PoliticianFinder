# Action 폴더 - 실행 필수 파일 모음

**목적**: PROJECT GRID V5.0 실행에 필요한 핵심 파일만 정리
**생성일**: 2025-10-31
**버전**: V5.0 (Skills 통합)

---

## 📁 폴더 구조

```
action/
├── config/                              # 설정 파일
│   └── agent_mapping_config.json        # 중앙 매핑 설정 (v2.0, Skills 통합)
│
├── scripts/                             # 실행 스크립트
│   ├── agent_mapper.py                  # 매핑 모듈 (Skills 메서드 포함)
│   ├── update_tools_with_skills.py      # 도구 업데이트 스크립트
│   └── phase_batch_executor.py          # Phase 배치 생성기
│
├── data/                                # 작업 데이터
│   └── generated_grid_full_v4_10agents_with_skills.json  # 144개 작업 (백업)
│
├── docs/                                # 문서
│   ├── skills_mapping_strategy.md       # Skills 매핑 전략
│   └── SKILLS_INTEGRATION_COMPLETE.md   # 완료 보고서
│
├── batches/                             # Phase 배치 파일 (실행용)
│   ├── Phase_1_batch.txt                # Phase 1 (20 tasks)
│   ├── Phase_2_batch.txt                # Phase 2 (24 tasks)
│   ├── Phase_3_batch.txt                # Phase 3 (32 tasks)
│   ├── Phase_4_batch.txt                # Phase 4 (14 tasks)
│   ├── Phase_5_batch.txt                # Phase 5 (12 tasks)
│   ├── Phase_6_batch.txt                # Phase 6 (24 tasks)
│   ├── Phase_7_batch.txt                # Phase 7 (18 tasks)
│   ├── EXECUTION_GUIDE.md               # 실행 가이드
│   └── Phase_*_meta.json                # 메타데이터 (7개)
│
├── PROJECT_GRID/                        # ⭐ PROJECT GRID 전용 폴더
│   ├── grid/                            # PROJECT GRID 데이터
│   ├── viewer/                          # PROJECT GRID 뷰어
│   ├── manuals/                         # PROJECT GRID 매뉴얼
│   └── README.md                        # PROJECT GRID 가이드
│
└── README.md                            # 이 파일

```

---

## 🎯 사용 방법

### 1. Phase 배치 실행
```bash
# Phase 1 실행
1. batches/Phase_1_batch.txt 열기
2. 전체 내용 복사 (Ctrl+A → Ctrl+C)
3. Claude에게 붙여넣기
4. 자동 실행 대기
```

### 2. 도구 재업데이트 (필요시)
```bash
cd ../
python action/scripts/update_tools_with_skills.py
```

### 3. Phase 배치 재생성 (필요시)
```bash
cd ../
python action/scripts/phase_batch_executor.py
```

---

## 📋 파일 설명

### config/agent_mapping_config.json
**역할**: 전체 시스템의 중앙 설정
**포함 내용**:
- 9개 Custom Agents 정의
- 4개 Built-in Agents 매핑
- 15개 Skills 위치 및 매핑
- 6개 Area별 도구 구조
- 예외 처리 규칙

### scripts/agent_mapper.py
**역할**: 매핑 로직 실행 모듈
**주요 메서드**:
- `get_custom_agent()` - Task → Custom Agent
- `get_builtin_agent()` - Custom → Built-in Agent
- `get_tools_for_area()` - Area별 3요소 도구
- `get_skills_for_area()` - Area별 Skills (예외 처리)
- `format_tools_string()` - 통합 문자열 생성

### scripts/update_tools_with_skills.py
**역할**: JSON + 작업지시서 자동 업데이트
**기능**:
1. JSON 파일에 3요소 통합 도구 적용
2. 144개 작업지시서 도구 섹션 재작성
3. 예외 처리 자동 적용

### scripts/phase_batch_executor.py
**역할**: Phase별 배치 파일 생성
**기능**:
1. 144개 작업을 7개 Phase로 그룹화
2. 의존성 순서로 정렬
3. Agent 역할 + 작업지시서 통합 프롬프트 생성

### data/generated_grid_full_v4_10agents_with_skills.json
**역할**: 144개 작업 전체 데이터 (백업)
**포함 내용**:
- 작업 기본 정보 (ID, 이름, Phase, Area)
- 9개 Custom Agent 배정
- 3요소 통합 도구 (Claude Tools / Tech Stack / Skills)
- 의존성 체인
- 기대 결과물

### grid/generated_grid_full_v4_10agents_with_skills.json
**역할**: 프로젝트 그리드 최신 버전 (JSON)
**포함 내용**: data/ 폴더와 동일 (최신 업데이트 버전)

### grid/generated_grid_full_v4_10agents_with_skills.sql
**역할**: Supabase 업로드용 SQL (최신)
**용도**: Supabase 데이터베이스에 144개 작업 업로드

### viewer/project_grid_최종통합뷰어_v4.html
**역할**: 프로젝트 그리드 웹 뷰어 (최종 통합 버전)
**기능**:
- 144개 작업 시각화
- Phase별 필터링
- Area별 그룹화
- 의존성 트리 표시
- 작업 상세 정보 표시

### viewer/run_viewer.py
**역할**: 뷰어 실행 스크립트
**사용법**: `python viewer/run_viewer.py`
**기능**: 로컬 서버로 뷰어 실행

### manuals/PROJECT_GRID_매뉴얼_V4.0.md
**역할**: 프로젝트 그리드 사용 매뉴얼 (최신)
**포함 내용**:
- PROJECT GRID V4.0 개요
- 구조 및 속성 설명
- 사용 방법
- Phase별 가이드

### manuals/SUPABASE_연동가이드_V4.0.md
**역할**: Supabase 연동 가이드 (최신)
**포함 내용**:
- Supabase 설정 방법
- 스키마 업로드 방법
- 데이터 업로드 방법
- API 연동 방법

### supabase/SUPABASE_SCHEMA_V4.0.sql
**역할**: Supabase 데이터베이스 스키마 (최신)
**용도**: project_grid_tasks 테이블 생성

### docs/skills_mapping_strategy.md
**역할**: Skills 매핑 전략 문서
**포함 내용**:
- 15개 Skills 설명
- 6개 Area별 매핑 전략
- Primary/Secondary Skills 구분
- 예외 처리 규칙

### docs/SKILLS_INTEGRATION_COMPLETE.md
**역할**: Skills 통합 완료 보고서
**포함 내용**:
- 완료된 작업 6단계
- 파일 변경 사항
- 검증 결과
- 다음 단계

### batches/Phase_*_batch.txt (7개)
**역할**: 실행용 배치 프롬프트
**구조**:
```
Phase N 배치 실행
  ├── 실행 규칙
  ├── 작업 1 (Agent 역할 + 작업지시서)
  ├── 작업 2 (Agent 역할 + 작업지시서)
  ├── ...
  └── 최종 보고
```

### batches/EXECUTION_GUIDE.md
**역할**: 실행 가이드
**포함 내용**:
- Phase별 실행 방법
- 주의사항
- 팁
- 실행 로그 체크리스트

---

## ✅ 실행 체크리스트

### 준비 완료 항목
- [x] 9개 Custom Agents (.claude/agents/)
- [x] 15개 Anthropic Skills (.claude/skills/)
- [x] 144개 작업지시서 (../tasks/)
- [x] 7개 Phase 배치 (batches/)

### 실행 전 확인
- [ ] batches/EXECUTION_GUIDE.md 읽기
- [ ] Phase 1 배치 파일 확인
- [ ] 실행 환경 준비 (Claude Code)

### 실행 단계
- [ ] Phase 1 실행 (20 tasks)
- [ ] Phase 2 실행 (24 tasks)
- [ ] Phase 3 실행 (32 tasks)
- [ ] Phase 4 실행 (14 tasks)
- [ ] Phase 5 실행 (12 tasks)
- [ ] Phase 6 실행 (24 tasks)
- [ ] Phase 7 실행 (18 tasks)

---

## 🔗 관련 파일 (상위 디렉토리)

### 작업지시서
- `../tasks/*.md` - 144개 작업지시서 (3요소 도구 포함)

### Agent 정의
- `C:/Development_PoliticianFinder/.claude/agents/*.md` - 9개 Custom Agents

### Skills 정의
- `C:/Development_PoliticianFinder/.claude/skills/*.md` - 15개 Anthropic Skills

---

## 💡 빠른 실행 가이드

### Phase 1 실행
```
1. batches/Phase_1_batch.txt 열기
2. Ctrl+A (전체 선택)
3. Ctrl+C (복사)
4. Claude에게 붙여넣기
5. 완료 대기 (약 20-30분)
```

### Phase 2-7 실행
동일한 방법으로 순차 실행

---

## 📊 통계

- **총 작업**: 144개
- **Phase 수**: 7개
- **Custom Agents**: 9개
- **Anthropic Skills**: 15개
- **배치 파일 크기**: 합계 489,208 chars
- **예상 실행 시간**: Phase당 20-40분, 총 3-6시간

---

## 🚀 상태

- ✅ **시스템 준비**: 완료
- ✅ **파일 정리**: 완료
- ⏳ **Phase 1 실행**: 대기 중

**준비 완료! 언제든지 Phase 1 실행 가능합니다! 🎉**

---

**버전**: PROJECT GRID V5.0
**생성일**: 2025-10-31
**상태**: 실행 준비 완료
