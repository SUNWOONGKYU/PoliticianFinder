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

# P3BA30 데이터
task_data = {
    "task_id": "P3BA30",
    "task_name": "Resend Email 연동",
    "phase": 3,
    "area": "BA",
    "status": "완료",
    "progress": 100,
    "assigned_agent": "Claude Code",
    "duration": "645분",
    "dependency_chain": ["P3BA1"],
    "tools": ["Resend", "Whois DNS", "Supabase Dashboard", "Vercel"],
    "generated_files": [
        "Supabase Email Templates (Dashboard 수정)",
        "Supabase SMTP Settings (Dashboard 설정)",
        "1_Frontend/supabase/functions/send-email-hook/index.ts (생성 후 미사용)"
    ],
    "instruction_file": "P3BA30.json",
    "test_history": "DKIM ✅ | SMTP ✅ | Email Delivery ✅ | www domain ✅ | Full Flow ✅",
    "build_result": "✅ 완료",
    "validation_result": "Complete",
    "remarks": "Resend SMTP - DKIM 인증, Supabase SMTP 연동, 이메일 템플릿 www 도메인 수정 완료"
}

# UPDATE (이미 존재하므로 UPDATE)
try:
    result = supabase.table('project_grid_tasks_revised').update(task_data).eq('task_id', 'P3BA30').execute()
    print("✅ P3BA30 업데이트 완료!")
    print(f"Task: {result.data[0]['task_id']} - {result.data[0]['task_name']}")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
