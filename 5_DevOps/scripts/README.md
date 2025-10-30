# DevOps Area (O) - Scripts

배포 및 자동화 스크립트들이 위치합니다.

## 파일 구조 (예정)

```
scripts/
├── deploy.sh           # 배포 스크립트
├── backup.sh           # 데이터베이스 백업
├── seed-data.sh        # 초기 데이터 삽입
└── health-check.sh     # 서비스 헬스 체크
```

## Task ID 헤더 예시

```bash
#!/bin/bash
# Project Grid Task ID: P1O3
# 작업명: 배포 자동화 스크립트
# 생성시간: 2025-10-30 14:30
# 생성자: Claude-3.5-Sonnet

echo "Deploying PoliticianFinder..."
```
