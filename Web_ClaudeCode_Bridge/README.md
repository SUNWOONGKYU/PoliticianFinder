# Web ↔ ClaudeCode Bridge

> 웹사이트와 Claude Code 간 정보 교환 인터페이스

---

## 📋 개요

이 폴더는 **웹사이트**와 **Claude Code** 사이에서 정보를 주고받는 **브리지(Bridge)** 역할을 합니다.

---

## 📂 구조

```
Web_ClaudeCode_Bridge/
├── inbox/     # Claude Code가 읽을 파일 (웹사이트 → Claude Code)
└── outbox/    # Claude Code가 생성한 파일 (Claude Code → 웹사이트)
```

---

## 🔄 작업 흐름

### 1. 웹사이트 → Claude Code (inbox)

```
웹사이트에서 작업 지시 생성
    ↓
inbox/에 JSON 파일 저장
    ↓
Claude Code가 읽고 작업 수행
```

**예시 파일: `inbox/task_P1F1.json`**
```json
{
  "task_id": "P1F1",
  "task_name": "회원가입 페이지 개발",
  "instruction": "회원가입 페이지를 만들어주세요",
  "files_to_generate": [
    "3_개발/3-1_Frontend/pages/signup.html"
  ]
}
```

### 2. Claude Code → 웹사이트 (outbox)

```
Claude Code가 작업 완료
    ↓
Claude Code가 프로젝트 그리드 DB 업데이트 (Supabase)
    ↓
Claude Code가 뷰어 업데이트
    ↓
outbox/에 결과 보고 JSON 저장
    ↓
웹사이트는 뷰어에서 결과 확인
```

**예시 파일: `outbox/result_P1F1.json`**
```json
{
  "task_id": "P1F1",
  "작업_내용": "회원가입 페이지 개발 완료",
  "생성_파일": [
    "3_개발/3-1_Frontend/pages/signup.html",
    "3_개발/3-1_Frontend/css/signup.css",
    "3_개발/3-1_Frontend/js/signup.js"
  ],
  "빌드_결과": "✅ 성공",
  "테스트_결과": "Test(10/10) ✅",
  "프로젝트_그리드_DB": "✅ Supabase 반영 완료",
  "뷰어_업데이트": "✅ 완료",
  "확인_방법": "프로젝트 그리드 뷰어에서 Task P1F1을 확인해주세요",
  "완료_시간": "2025-11-17T14:30:00Z"
}
```

**중요:**
- 프로젝트 그리드 DB 업데이트는 **Claude Code가 직접 수행**
- 웹사이트는 **결과를 확인만** 함 (업데이트 X)

---

## 📝 파일 네이밍 규칙

### inbox (입력)
- 형식: `task_{TASK_ID}.json`
- 예시: `task_P1F1.json`, `task_P3BA2.json`

### outbox (출력)
- 형식: `result_{TASK_ID}.json`
- 예시: `result_P1F1.json`, `result_P3BA2.json`

---

## 🎯 사용 사례

### 1. 프로젝트 그리드 자동화
- 웹사이트에서 Task 클릭 → inbox에 지시서 생성
- Claude Code가 작업 수행
- Claude Code가 프로젝트 그리드 DB 업데이트
- Claude Code가 뷰어 업데이트
- outbox에 결과 보고 저장
- 웹사이트는 뷰어에서 결과 확인

### 2. CI/CD 통합
- Git push → inbox에 배포 지시
- Claude Code가 빌드/테스트 수행
- Claude Code가 프로젝트 그리드 DB 업데이트
- outbox에 배포 결과 보고
- 웹사이트에서 뷰어로 배포 상태 확인

### 3. 실시간 모니터링
- 웹사이트가 주기적으로 outbox 확인
- 또는 프로젝트 그리드 뷰어로 실시간 진행률 확인

---

## ⚠️ 주의사항

1. **파일 삭제**: 처리 완료된 파일은 주기적으로 삭제
2. **충돌 방지**: 동일한 Task ID로 여러 파일 생성 금지
3. **보안**: 민감한 정보(API Key 등)는 포함하지 않기

---

## 📌 핵심 원칙

**Claude Code의 역할:**
1. ✅ 작업 수행 (파일 생성, 빌드, 테스트)
2. ✅ 프로젝트 그리드 DB 업데이트 (Supabase 직접 반영)
3. ✅ 프로젝트 그리드 뷰어 업데이트
4. ✅ outbox에 결과 보고서 작성

**웹사이트의 역할:**
1. ✅ inbox에 작업 지시 생성
2. ✅ outbox에서 결과 보고 확인
3. ✅ 프로젝트 그리드 뷰어로 최종 결과 확인
4. ❌ 프로젝트 그리드 DB 업데이트 (불가능!)

---

**작성일**: 2025-11-17
**버전**: v2.0 (프로젝트 그리드 업데이트 주체 명확화)
