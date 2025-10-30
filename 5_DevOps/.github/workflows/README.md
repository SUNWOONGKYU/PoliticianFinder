# DevOps Area (O) - CI/CD Workflows

이 디렉토리에는 GitHub Actions 워크플로우 파일들이 위치합니다.

## 파일 구조 (예정)

```
.github/workflows/
├── ci.yml              # P1O1: Continuous Integration
├── cd.yml              # P1O2: Continuous Deployment
├── test.yml            # Phase별 테스트 자동화
└── monitoring.yml      # 모니터링 및 알림
```

## Git 통합 추적 시스템

모든 워크플로우 파일은 **Task ID 헤더**를 포함해야 합니다:

```yaml
# Project Grid Task ID: P1O1
# 작업명: CI 워크플로우 구현
# 생성시간: 2025-10-30 14:30
# 생성자: Claude-3.5-Sonnet

name: CI
...
```

## 주요 기능

- **CI (Continuous Integration)**: 코드 푸시 시 자동 빌드 및 테스트
- **CD (Continuous Deployment)**: main 브랜치 머지 시 자동 배포
- **테스트 자동화**: Phase별 E2E/API/Unit 테스트
- **모니터링**: Sentry, Vercel Analytics 연동
