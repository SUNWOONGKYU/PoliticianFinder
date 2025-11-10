# 작업지시서: P1BA4

## 📋 기본 정보

- **작업 ID**: P1BA4
- **업무명**: 비밀번호 재설정 API (Mock)
- **Phase**: Phase 1
- **Area**: Backend APIs (BA)
- **서브 에이전트**: api-designer
- **작업 방식**: AI-Only

---

## 🎯 작업 목표

Mock 이메일 전송 처리

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

**의존성 체인**: P1BI1, P1BI2

이 작업을 시작하기 전에 다음 작업이 완료되어야 합니다: P1BI1, P1BI2

---

## 📦 기대 결과물

- app/api/auth/reset-password/route.ts

**구현해야 할 세부 항목**:

1. API 라우트 파일 생성
2. 요청 스키마 정의 (Zod)
3. Mock 데이터 생성
4. Mock 응답 로직 구현
5. 에러 처리
6. API 문서 주석 작성

각 항목을 체계적으로 구현하고 테스트하세요.

---

## 📝 작업 지시사항

### 1. 준비 단계

- 프로젝트 루트 디렉토리에서 작업 시작
- 필요한 도구 확인: TypeScript/Next.js API Routes/Supabase/Zod
- 의존성 작업 완료 확인 (P1BI1) (P1BI2)

### 2. 구현 단계

**구현해야 할 세부 항목**:

1. API 라우트 파일 생성
2. 요청 스키마 정의 (Zod)
3. Mock 데이터 생성
4. Mock 응답 로직 구현
5. 에러 처리
6. API 문서 주석 작성

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

- [ ] 비밀번호 재설정 API (Mock) 기능이 정상적으로 구현됨
- [ ] 기대 결과물이 모두 생성됨
- [ ] 코드가 정상적으로 빌드/실행됨
- [ ] 타입 체크 및 린트 통과
- [ ] PROJECT GRID 상태 업데이트 완료
- [ ] API 엔드포인트가 정상적으로 응답함
- [ ] 요청/응답 스키마 검증 통과
- [ ] Mock 데이터가 올바르게 반환됨

---

**작업지시서 생성일**: 2025-11-06
**PROJECT GRID Version**: v4.0
