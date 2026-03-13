#!/usr/bin/env python3
"""
V50 Soldier 스크립트 (분대원 실행 진입점)
- 분대원(Subagent)이 호출하는 메인 스크립트
- 1. n8n webhook POST (시작 신호)
- 2. Supabase processing_status polling (done 대기)
- 3. 결과 반환 -> 분대원 완료

Usage:
    python soldier_v50.py --politician_id ID --politician_name "이름" --webhook_url URL
"""
import os
import sys
import json
import time
import requests
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# 환경 로드 (V50/.env 우선)
V50_DIR = Path(__file__).resolve().parent.parent
for env_path in [V50_DIR / '.env', V50_DIR.parent / '.env']:
    if env_path.exists():
        load_dotenv(env_path, override=True)
        break

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

POLL_INTERVAL = 30   # 30초마다 상태 확인
TIMEOUT = 7200       # 2시간 최대 대기


def post_webhook(webhook_url: str, politician_id: str, politician_name: str) -> bool:
    """n8n webhook에 시작 신호 POST"""
    payload = {
        "politician_id": politician_id,
        "politician_name": politician_name
    }
    try:
        response = requests.post(webhook_url, json=payload, timeout=30)
        if response.status_code == 200:
            return True
        else:
            print(
                f"[WARN] webhook 응답 코드: {response.status_code}",
                file=sys.stderr
            )
            return False
    except requests.exceptions.Timeout:
        print("[ERROR] webhook POST timeout", file=sys.stderr)
        return False
    except Exception as e:
        print(f"[ERROR] webhook POST 실패: {e}", file=sys.stderr)
        return False


def poll_until_done(politician_id: str, timeout: int = TIMEOUT) -> tuple:
    """
    Supabase politicians 테이블의 processing_status를 polling하여
    done 또는 failed 상태가 될 때까지 대기

    Returns:
        (success: bool, reason: str)
        - (True, 'done')    : 처리 완료
        - (False, 'failed') : 처리 실패
        - (False, 'timeout'): 타임아웃
    """
    elapsed = 0
    last_status = ''

    while elapsed < timeout:
        try:
            result = supabase.table('politicians')\
                .select('processing_status')\
                .eq('id', politician_id)\
                .execute()

            if result.data:
                status = result.data[0].get('processing_status', '')

                # 상태 변경 시 출력
                if status != last_status:
                    print(f"  [STATUS] {last_status or 'unknown'} -> {status} (경과: {elapsed}초)")
                    last_status = status

                if status == 'done':
                    return True, 'done'
                elif status == 'failed':
                    return False, 'failed'
            else:
                print(f"  [WARN] politician_id={politician_id} DB 레코드 없음", file=sys.stderr)

        except Exception as e:
            print(f"  [WARN] polling 오류: {e}", file=sys.stderr)

        time.sleep(POLL_INTERVAL)
        elapsed += POLL_INTERVAL

    return False, 'timeout'


def get_final_score(politician_id: str) -> dict:
    """
    처리 완료 후 최종 점수 조회

    Returns:
        {"final_score": int, "grade": str, "grade_name": str} or {}
    """
    try:
        result = supabase.table('ai_final_scores_v50')\
            .select('final_score, grade, grade_name')\
            .eq('politician_id', politician_id)\
            .execute()

        if result.data:
            return result.data[0]
    except Exception as e:
        print(f"  [WARN] 점수 조회 실패: {e}", file=sys.stderr)
    return {}


def main():
    import argparse

    parser = argparse.ArgumentParser(description='V50 Soldier - 분대원 실행 진입점')
    parser.add_argument('--politician_id', required=True, help='정치인 ID (8자리 hex)')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--webhook_url', required=True, help='n8n webhook URL')
    args = parser.parse_args()

    print(f"[{args.politician_name}] 시작 -> webhook POST")
    print(f"  politician_id: {args.politician_id}")
    print(f"  webhook_url: {args.webhook_url}")

    # Step 1: n8n webhook POST
    ok = post_webhook(args.webhook_url, args.politician_id, args.politician_name)
    if not ok:
        print(f"[{args.politician_name}] webhook 실패", file=sys.stderr)
        sys.exit(1)

    print(f"[{args.politician_name}] webhook 전송 완료 -> n8n 처리 중 (polling 시작)")
    print(f"  poll_interval={POLL_INTERVAL}초, timeout={TIMEOUT}초 ({TIMEOUT//3600}시간)")

    # Step 2: Supabase processing_status polling
    success, reason = poll_until_done(args.politician_id)

    # Step 3: 결과 반환
    if success:
        score_info = get_final_score(args.politician_id)
        if score_info:
            print(
                f"[{args.politician_name}] 완료 "
                f"-> {score_info.get('final_score', '?')}점 "
                f"{score_info.get('grade', '?')}등급 "
                f"({score_info.get('grade_name', '?')})"
            )
        else:
            print(f"[{args.politician_name}] 완료 (점수 정보 없음)")
        sys.exit(0)
    else:
        print(f"[{args.politician_name}] 실패: {reason}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
