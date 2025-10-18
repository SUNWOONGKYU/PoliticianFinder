#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 3, 4, 5 작업지시서 자동 생성 스크립트
13DGC-AODM v1.1 방법론에 따라 64개 작업지시서 생성
"""

import csv
import os
from pathlib import Path

# CSV 파일 읽기
csv_file = 'project_grid_v2.0_supabase.csv'
rows = []
with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    rows = list(reader)

# tasks 폴더 생성
tasks_dir = Path('tasks')
tasks_dir.mkdir(exist_ok=True)

# Phase 3, 4, 5 컬럼 (인덱스 4, 5, 6)
phase_cols = {
    'Phase 3': 4,
    'Phase 4': 5,
    'Phase 5': 6
}

# 작업지시서 템플릿
def generate_task_doc(task_id, task_name, area, assigned_ai, dependencies, automation_type, phase):
    """작업지시서 생성"""

    # 자동화 방식에 따른 설명
    if 'ChatGPT' in automation_type:
        automation_note = """
## 자동화 방식
- **외부협력 (ChatGPT)**: 이 작업은 ChatGPT를 활용한 최종 성능 측정이 필요합니다.
- Claude Code가 구현 완료 후, ChatGPT를 통해 Lighthouse 성능 측정을 수행합니다.
"""
    elif 'Gemini검토' in automation_type:
        automation_note = """
## 자동화 방식
- **외부협력 (Gemini 검토)**: 이 작업은 Claude Code가 작성하고 Gemini가 검토합니다.
- Claude Code가 사용자 가이드를 작성한 후, Gemini를 통해 품질 검토를 받습니다.
"""
    elif 'Gemini' in automation_type:
        automation_note = """
## 자동화 방식
- **외부협력 (Gemini)**: 이 작업은 Gemini를 활용한 대량 키워드 분석이 필요합니다.
- Claude Code가 기본 구현 완료 후, Gemini를 통해 SEO 키워드 분석을 수행합니다.
"""
    else:
        automation_note = """
## 자동화 방식
- **AI-only**: 이 작업은 Claude Code가 직접 구현합니다.
- 담당 서브에이전트가 자동으로 작업을 완료합니다.
"""

    doc = f"""# {task_id}: {task_name}

## 작업 정보
- **Phase**: {phase}
- **영역**: {area}
- **담당 AI**: {assigned_ai}
- **의존 작업**: {dependencies if dependencies else '없음'}
- **자동화 방식**: {automation_type}

{automation_note}

## 작업 목표
{task_name} 기능을 구현합니다.

## 상세 요구사항

### 1. 기능 명세
- 작업 ID: {task_id}
- Phase: {phase}
- 담당 영역: {area}

### 2. 기술 스택
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **DevOps**: Vercel, GitHub Actions

### 3. 구현 세부사항
이 섹션은 담당 서브에이전트가 작업 시작 전에 프로젝트 구조를 파악하여 구체화합니다.

### 4. 데이터 모델
필요시 Supabase 테이블 스키마를 정의합니다.

### 5. API 엔드포인트
필요시 API Route 및 Edge Function을 정의합니다.

### 6. UI/UX 요구사항
필요시 컴포넌트 및 페이지 디자인을 정의합니다.

## 완료 기준
- [ ] 기능이 정상적으로 동작
- [ ] 타입스크립트 타입 안정성 확보
- [ ] 에러 처리 구현
- [ ] 테스트 작성 (해당 시)
- [ ] 코드 리뷰 통과

## 의존성
- **선행 작업**: {dependencies if dependencies else '없음'}
- **후행 작업**: 이 작업에 의존하는 작업은 프로젝트 그리드 참조

## 참고사항
- 13DGC-AODM v1.1 방법론 준수
- Phase {phase[-1]} 목표에 부합하는 구현
- 기존 코드베이스와의 일관성 유지

## 작업 진행 방식
1. 프로젝트 구조 파악
2. 관련 파일 검토
3. 구현 계획 수립
4. 코드 작성
5. 테스트 및 검증
6. 문서화

---
**생성일**: 2025-10-17
**방법론**: 13DGC-AODM v1.1
**담당**: {assigned_ai}
"""
    return doc

# 작업지시서 생성
created_count = 0
phase_count = {'Phase 3': 0, 'Phase 4': 0, 'Phase 5': 0}

for phase_name, col_idx in phase_cols.items():
    print(f"\n{'='*60}")
    print(f"{phase_name} 작업지시서 생성 중...")
    print(f"{'='*60}")

    # 각 영역별로 순회
    current_area = None

    for i, row in enumerate(rows):
        if len(row) <= 1:
            continue

        # 영역명 추출
        if row[0] and not row[1]:  # 영역 헤더 행
            current_area = row[0]
            continue

        # 작업ID 행 찾기
        if len(row) > 1 and row[1] == '작업ID':
            task_id = row[col_idx] if col_idx < len(row) else ''
            if not task_id or not task_id.startswith('P'):
                continue

            # 관련 정보 수집
            task_name = rows[i+1][col_idx] if i+1 < len(rows) and col_idx < len(rows[i+1]) else ''
            assigned_ai = rows[i+3][col_idx] if i+3 < len(rows) and col_idx < len(rows[i+3]) else 'fullstack-developer'
            automation_type = rows[i+7][col_idx] if i+7 < len(rows) and col_idx < len(rows[i+7]) else 'AI-only'
            dependencies = rows[i+8][col_idx] if i+8 < len(rows) and col_idx < len(rows[i+8]) else ''

            if not task_name or task_name == '대기':
                continue

            # 작업지시서 생성
            doc_content = generate_task_doc(
                task_id=task_id,
                task_name=task_name,
                area=current_area if current_area else 'General',
                assigned_ai=assigned_ai,
                dependencies=dependencies,
                automation_type=automation_type,
                phase=phase_name
            )

            # 파일 저장
            file_path = tasks_dir / f"{task_id}.md"
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(doc_content)

            created_count += 1
            phase_count[phase_name] += 1
            print(f"[OK] {task_id}: {task_name} ({automation_type})")

print(f"\n{'='*60}")
print(f"작업지시서 생성 완료!")
print(f"{'='*60}")
print(f"Phase 3: {phase_count['Phase 3']}개")
print(f"Phase 4: {phase_count['Phase 4']}개")
print(f"Phase 5: {phase_count['Phase 5']}개")
print(f"{'='*60}")
print(f"총 {created_count}개 작업지시서 생성됨")
print(f"저장 위치: {tasks_dir.absolute()}")
