# 작업지시서: P4BA5

## 📋 기본 정보

- **작업 ID**: P4BA5
- **업무명**: 욕설 필터
- **Phase**: Phase 4
- **Area**: Backend APIs (BA)
- **서브 에이전트**: api-designer
- **작업 방식**: AI-Only

---

## 🎯 작업 목표

욕설 감지 및 필터링 유틸

---

## 🔧 사용 도구

```
[Claude 도구]
Read, Edit, Write, Grep, Glob, Bash

[기술 스택]
TypeScript, Next.js API Routes, Supabase, Zod

[전문 스킬]
api-builder, api-test
```

**도구 설명**:
- **Claude 도구**: Claude Code의 기본 기능 (Read, Write, Edit, Bash, Glob, Grep 등)
- **기술 스택**: 프로젝트에 사용되는 프레임워크 및 라이브러리
- **전문 스킬**: Anthropic 빌트인 스킬 (.claude/skills/*.md 참조)

## 🔗 의존성 정보

**의존성 체인**: 없음

이 작업은 독립적으로 시작할 수 있습니다.

---

## 📦 기대 결과물

**생성할 파일:**
1. `lib/utils/profanity-filter.ts` - 욕설 필터 유틸
2. `lib/utils/profanity-words.ts` - 욕설 단어 목록

**필터링 방식:**
- 완전 일치: 욕설 단어 그대로 포함 시
- 변형 감지: 자음 분리, 특수문자 삽입 등 (예: ㅅ1ㅂ, 시-발)
- 대체 문자: `***` 또는 원본 첫 글자 + `**` (예: 시**)

**설치 필요 패키지:**
```bash
npm install hangul-js
```

**구현해야 할 세부 항목**:

1. 욕설 단어 목록 정의 (profanity-words.ts)
2. 욕설 감지 함수 (containsProfanity)
3. 텍스트 필터링 함수 (filterProfanity)
4. 정규식 패턴 매칭 (변형된 욕설 감지)
5. 대체 문자 처리 (`***` 변환)
6. 한글 자음/모음 분리 처리

각 항목을 체계적으로 구현하고 테스트하세요.

---

## 💾 구현 파일 저장 위치

**루트 폴더**: `3_Backend_APIs/`

**파일 경로**:
```
3_Backend_APIs/
└── lib/
    └── utils/
        └── profanity-filter.ts
```

**절대 경로 별칭**: `@/` (예: `import ... from '@/lib/utils/profanity-filter'`)

---

## 📝 작업 지시사항

### 1. 준비 단계

- 프로젝트 루트 디렉토리에서 작업 시작
- 필요한 도구 확인: TypeScript/Next.js API Routes/Supabase/Zod
- 의존성 없음, 바로 시작 가능

### 2. 구현 단계

**구현해야 할 세부 항목**:

1. 욕설 단어 목록 정의
2. 욕설 감지 함수
3. 텍스트 필터링 함수
4. 정규식 패턴 매칭
5. 대체 문자 처리

각 항목을 체계적으로 구현하고 테스트하세요.

### 3. 검증 단계

- 작성한 코드의 정상 동작 확인
- 타입 체크 및 린트 통과
- 필요한 경우 단위 테스트 작성
- 코드 리뷰 준비

### 4. 완료 단계

- 생성된 파일 목록 확인
- PROJECT GRID 상태 업데이트
- 다음 의존 작업에 영향 확인

---

## ✅ 완료 기준

- [ ] 욕설 필터 기능이 정상적으로 구현됨
- [ ] 기대 결과물이 모두 생성됨
- [ ] 코드가 정상적으로 빌드/실행됨
- [ ] 타입 체크 및 린트 통과
- [ ] PROJECT GRID 상태 업데이트 완료
- [ ] API 엔드포인트가 정상적으로 응답함
- [ ] 요청/응답 스키마 검증 통과

---

**작업지시서 생성일**: 2025-11-06
**PROJECT GRID Version**: v4.0
