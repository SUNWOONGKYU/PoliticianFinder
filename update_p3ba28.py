#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys
import io
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# .env.local 로드
load_dotenv('1_Frontend/.env.local')

# Supabase 연결
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

# P3BA28 업데이트 데이터 (알림 배지 하드코딩 제거)
update_data = {
    "status": "완료",
    "progress": 100,
    "duration": "55분",
    "generated_files": [
        "1_Frontend/src/app/notifications/page.tsx (원본)",
        "1_Frontend/src/app/components/header.tsx (수정 - 하드코딩 제거)"
    ],
    "modification_history": [
        {
            "date": "2025-11-20",
            "type": "하드코딩 제거",
            "description": "알림 배지 숫자 하드코딩 제거 - 실제 DB 데이터로 대체",
            "files": ["1_Frontend/src/app/components/header.tsx"],
            "details": [
                "unreadCount state 추가",
                "notifications 테이블 조회 (is_read=false)",
                "조건부 렌더링 (unreadCount > 0)",
                "99+ 표시 구현",
                "로그인/로그아웃 상태 자동 처리"
            ],
            "before": "Desktop: <span>3</span> | Mobile: <span>3</span> (하드코딩)",
            "after": "{unreadCount > 0 && <span>{unreadCount > 99 ? '99+' : unreadCount}</span>}",
            "related_tasks": ["P3BA30"],
            "commit": "32bb416"
        },
        {
            "date": "2025-11-20",
            "type": "빌드 오류 수정",
            "description": "사용하지 않는 send-email-hook 삭제",
            "files": ["1_Frontend/supabase/functions/send-email-hook/"],
            "details": ["빌드 오류 유발 폴더 삭제", "P3BA30 작업에서 생성했으나 미사용"],
            "error": "Cannot find module 'https://esm.sh/standardwebhooks@1.0.0'",
            "commit": "32bb416"
        }
    ],
    "test_history": "Build ✅ | Type ✅ | Deploy ✅ | Badge Dynamic ✅",
    "build_result": "✅ 성공",
    "validation_result": "Complete",
    "remarks": "알림 배지 하드코딩 제거 완료 - 실시간 미읽음 알림 개수 표시"
}

# UPDATE
try:
    result = supabase.table('project_grid_tasks_revised').update(update_data).eq('task_id', 'P3BA28').execute()
    print("✅ P3BA28 업데이트 완료!")
    print(f"Task: {result.data[0]['task_id']} - {result.data[0]['task_name']}")
    print(f"Status: {result.data[0]['status']}")
    print(f"Progress: {result.data[0]['progress']}%")
    print(f"Duration: {result.data[0]['duration']}")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
