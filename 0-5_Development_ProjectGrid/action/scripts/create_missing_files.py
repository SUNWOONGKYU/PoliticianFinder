#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
누락된 README.md와 .gitignore 파일 자동 생성
"""

from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent

AREAS = {
    "2_Backend_Infrastructure": {
        "name": "Backend Infrastructure (BI)",
        "desc": "모든 API가 사용하는 기반 코드 - Supabase 클라이언트, 미들웨어, 기본 설정",
        "tech": "TypeScript, Supabase SDK, Next.js Middleware"
    },
    "3_Backend_APIs": {
        "name": "Backend APIs (BA)",
        "desc": "비즈니스 로직을 구현하는 REST API 엔드포인트",
        "tech": "TypeScript, Next.js API Routes, Supabase"
    },
    "4_Database": {
        "name": "Database (D)",
        "desc": "데이터베이스 스키마, 마이그레이션, 트리거, RLS 정책",
        "tech": "PostgreSQL, Supabase, SQL"
    },
    "5_DevOps": {
        "name": "DevOps (O)",
        "desc": "CI/CD, 배포, 인프라 설정 및 자동화",
        "tech": "GitHub Actions, Vercel, Docker"
    },
    "6_Test": {
        "name": "Test (T)",
        "desc": "E2E 테스트, API 테스트, 부하 테스트, 품질 보증",
        "tech": "Playwright, Jest, Vitest, Supertest"
    }
}

GITIGNORE_CONTENT = """# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Production build
build/
dist/
.next/
out/

# Misc
.DS_Store
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Cache
.cache/
.vercel/
.turbo/

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python

# Database
*.db
*.sqlite
*.sqlite3
"""

def create_readme(area_path: Path, area_info: dict):
    """README.md 생성"""
    readme_content = f"""# {area_info['name']}

## 개요
{area_info['desc']}

## 기술 스택
{area_info['tech']}

## 작업 시 규칙

### 파일 명명 규칙
모든 파일명에 Task ID 포함:
```
{{TaskID}}_{{설명}}.{{확장자}}
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
{area_path.name}/
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
- [ ] Git 브랜치 생성 (grid/{{TaskID}}/{{작업명}})
- [ ] Task 폴더 생성
- [ ] Task ID 헤더 주석 포함하여 파일 생성
- [ ] 테스트 코드 작성
- [ ] Git 커밋 (Task ID 포함)

---
PROJECT GRID V5.0 - {area_info['name']}
"""

    readme_file = area_path / "README.md"
    with open(readme_file, 'w', encoding='utf-8') as f:
        f.write(readme_content)

    return readme_file

def create_gitignore(area_path: Path):
    """.gitignore 생성"""
    gitignore_file = area_path / ".gitignore"
    with open(gitignore_file, 'w', encoding='utf-8') as f:
        f.write(GITIGNORE_CONTENT)

    return gitignore_file

def main():
    print("=" * 70)
    print("누락된 파일 자동 생성")
    print("=" * 70)
    print()

    created_files = []

    for area_folder, area_info in AREAS.items():
        area_path = PROJECT_ROOT / area_folder

        if not area_path.exists():
            print(f"[SKIP] {area_folder} - 폴더 없음")
            continue

        print(f"\n{area_info['name']} ({area_folder})")

        # README.md 생성
        readme_file = area_path / "README.md"
        if not readme_file.exists():
            created = create_readme(area_path, area_info)
            created_files.append(created)
            print(f"  + README.md 생성")
        else:
            print(f"  - README.md 이미 존재")

        # .gitignore 생성
        gitignore_file = area_path / ".gitignore"
        if not gitignore_file.exists():
            created = create_gitignore(area_path)
            created_files.append(created)
            print(f"  + .gitignore 생성")
        else:
            print(f"  - .gitignore 이미 존재")

    print()
    print("=" * 70)
    print(f"완료! 총 {len(created_files)}개 파일 생성됨")
    print("=" * 70)

if __name__ == "__main__":
    main()
