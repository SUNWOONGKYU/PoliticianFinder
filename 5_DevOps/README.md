# DevOps (O)

## 개요
CI/CD, 배포, 인프라 설정 및 자동화

## 기술 스택
GitHub Actions, Vercel, Docker

## 작업 시 규칙

### 파일 명명 규칙
모든 파일명에 Task ID 포함:
```
{TaskID}_{설명}.{확장자}
```

**예시:**
- `P2BA1_auth_api.ts`
- `P2BA1_auth_test.spec.ts`
- `P1D2_politicians_migration.sql`

### Task ID 헤더 주석 포함
모든 소스코드 파일 상단에 포함:
```typescript
/**
 * Project Grid Task ID: P2BA1
 * 작업명: 사용자 인증 API
 * 생성시간: 2025-10-31 14:30
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P2BI1 (API 기반 구조)
 * 설명: JWT 기반 사용자 인증
 */
```

### Git 커밋 형식
```bash
[P2BA1] feat: 사용자 인증 API 구현

- P2BA1_auth_api.ts 생성
- 인증 로직 구현
- 테스트 코드 추가

소요시간: 45분
생성자: Claude-Sonnet-4.5
```

## 폴더 구조
```
5_DevOps/
├── (작업 시작 시 Task 폴더 생성)
├── P2BA1/
│   ├── P2BA1_auth_api.ts
│   ├── P2BA1_auth_test.spec.ts
│   └── P2BA1_README.md
└── README.md (이 파일)
```

## 작업 시작 체크리스트
- [ ] PROJECT GRID에서 Task 정보 확인
- [ ] 의존성 작업 완료 여부 확인
- [ ] Git 브랜치 생성 (grid/{TaskID}/{작업명})
- [ ] Task 폴더 생성
- [ ] Task ID 헤더 주석 포함하여 파일 생성
- [ ] 테스트 코드 작성
- [ ] Git 커밋 (Task ID 포함)

---
PROJECT GRID V5.0 - DevOps (O)
