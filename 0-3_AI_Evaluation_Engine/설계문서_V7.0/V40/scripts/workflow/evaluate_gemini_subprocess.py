#!/usr/bin/env python3
"""
V40 Gemini CLI Evaluation (Direct Subprocess)
==============================================

공식 평가 방식: Gemini CLI Direct Subprocess (재미나 CLI 다이렉트 서브프로세스)

모델: Gemini 2.5 Flash (Tier 1) → 2.0 Flash (레거시) → API fallback
방식: 3단계 Fallback (CLI → CLI → API, 자동 전환)
배치 크기: 25개
비용: CLI $0 / API Tier 1 요금

정의:
    - Python subprocess.run()으로 Gemini CLI를 직접 실행
    - stdin을 통한 프롬프트 전달
    - 4개 평가 AI 중 하나 (Claude Haiku 4.5, ChatGPT gpt-5.1-codex-mini, Gemini 2.0 Flash, Grok 3)

성능:
    - 평균 응답 시간: 27초/카테고리
    - subprocess 방식: DB 조회 → 평가 → 저장

평가 대상:
    - 카테고리 풀링 데이터 전체 (수집된 모든 데이터)
    - 25개씩 배치 처리 (Pre-filtering 적용)

Rating 시스템:
    - +4, +3, +2, +1, -1, -2, -3, -4 (8등급)
    - X = 제외 (평가 불가)
    - score = rating × 2

Usage:
    python evaluate_gemini_subprocess.py --politician "박주민" --category "expertise"
"""

import os
import sys
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
sys.path.insert(0, str(V40_DIR))
sys.path.insert(0, str(V40_DIR / 'scripts' / 'helpers'))

# Gemini CLI 인증 체크 유틸리티 (V40: 선택적 사용)
# from scripts.utils.gemini_auth_check import require_gemini_auth

# Subprocess 실행 함수 import
from collect_gemini_subprocess import execute_gemini_cli

# Supabase 클라이언트
from supabase import create_client, Client

# 공통 저장 함수 import (성능 개선)
from common_eval_saver import save_evaluations_batch_upsert, load_instruction, build_evaluation_prompt
from phase_tracker import require_phase_gate

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Supabase 설정
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase credentials not found in environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def load_collected_data_for_evaluation(
    politician_id: str,
    category: str
) -> list:
    """
    평가용 수집 데이터 로드 (V40)

    개선: 이미 평가된 데이터 사전 필터링 (Gemini CLI 호출 최소화)

    Args:
        politician_id: 정치인 ID
        category: 카테고리

    Returns:
        수집 데이터 리스트 (미평가 데이터만)
    """
    # 1. 모든 수집 데이터 로드
    all_data_result = supabase.table('collected_data_v40').select('*').eq(
        'politician_id', politician_id
    ).eq(
        'category', category
    ).order(
        'published_date', desc=True
    ).execute()

    all_data = all_data_result.data if all_data_result.data else []

    if not all_data:
        logger.info("[INFO] No collected data found")
        return []

    # 2. 이미 평가된 collected_data_id 조회 (Gemini만)
    evaluated_result = supabase.table('evaluations_v40').select(
        'collected_data_id'
    ).eq('politician_id', politician_id).eq(
        'evaluator_ai', 'Gemini'
    ).eq('category', category).execute()

    evaluated_ids = {
        row['collected_data_id']
        for row in (evaluated_result.data or [])
        if row.get('collected_data_id')
    }

    # 3. 미평가 데이터만 필터링
    unevaluated_data = [
        item for item in all_data
        if item.get('id') not in evaluated_ids
    ]

    logger.info(f"[INFO] Total: {len(all_data)}, Already evaluated: {len(evaluated_ids)}, To evaluate: {len(unevaluated_data)}")

    return unevaluated_data


def parse_gemini_evaluation(output: str) -> list:
    """
    Gemini 평가 응답 파싱

    Args:
        output: Gemini CLI stdout

    Returns:
        [
            {
                "id": str (UUID),
                "rating": str ("+4" ~ "-4" or "X"),
                "rationale": str
            },
            ...
        ]
    """
    try:
        # JSON 형식 추출
        if '```json' in output:
            start = output.find('```json') + 7
            end = output.find('```', start)
            json_str = output[start:end].strip()
        elif '```' in output:
            start = output.find('```') + 3
            end = output.find('```', start)
            json_str = output[start:end].strip()
        else:
            # JSON 블록 없으면 전체에서 { } 찾기
            json_str = output.strip()
            # 앞뒤 텍스트 제거
            if '{' in json_str and '}' in json_str:
                start_idx = json_str.find('{')
                end_idx = json_str.rfind('}') + 1
                json_str = json_str[start_idx:end_idx]

        data = json.loads(json_str)
        evaluations = data.get('evaluations', [])

        # 각 평가 검증
        valid_evaluations = []
        for eval_item in evaluations:
            rating = str(eval_item.get('rating', 'X')).strip()

            # 정수 → 문자열 정규화 (예: -1 → "-1", 3 → "+3")
            if rating not in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4', 'X']:
                try:
                    num = int(rating)
                    if 1 <= num <= 4:
                        rating = f'+{num}'
                    elif -4 <= num <= -1:
                        rating = str(num)
                    else:
                        logger.warning(f"[WARNING] Invalid rating: {rating}, setting to X")
                        rating = 'X'
                except:
                    logger.warning(f"[WARNING] Invalid rating format: {rating}, setting to X")
                    rating = 'X'

            valid_evaluations.append({
                "id": eval_item.get('id'),
                "rating": rating,
                "rationale": eval_item.get('rationale', '')
            })

        return valid_evaluations

    except json.JSONDecodeError as e:
        logger.error(f"[ERROR] JSON parse failed: {e}")
        logger.error(f"[DEBUG] Output: {output[:500]}...")
        return []

    except Exception as e:
        logger.exception(f"[ERROR] Response parse failed: {e}")
        return []


def save_evaluations_to_db(
    politician_id: str,
    politician_name: str,
    category: str,
    evaluations: list,
    data_map: dict
) -> int:
    """
    평가 결과 배치를 DB에 저장 (공통 함수 사용)

    개선 사항:
        - 기존: 각 평가마다 2번 HTTP 요청 (GET + PATCH/POST)
        - 개선: 배치당 1번 HTTP 요청 (Upsert)
        - 성능: 50배 빠름 (2,284번 → 46번 요청)

    Args:
        politician_id: 정치인 ID
        politician_name: 정치인 이름
        category: 카테고리
        evaluations: 평가 결과 리스트
        data_map: collected_data_id → data 매핑 (사용 안 함, 호환성 유지)

    Returns:
        저장된 평가 개수
    """
    # 공통 함수로 Batch Upsert 수행
    result = save_evaluations_batch_upsert(
        politician_id=politician_id,
        politician_name=politician_name,
        category=category,
        evaluator_ai='Gemini',
        evaluations=evaluations,
        verbose=False  # logger로 출력하므로 verbose=False
    )

    saved_count = result['saved']

    # 로그 출력 (logger는 end 파라미터 미지원)
    log_msg = f"[OK] Saved {saved_count}/{result['total']} evaluations"
    if result['skipped'] > 0:
        log_msg += f" (X: {result['skipped']})"
    if result['invalid'] > 0:
        log_msg += f" (Invalid: {result['invalid']})"
    logger.info(log_msg)

    return saved_count


def evaluate_category(
    politician_name: str,
    category: str
) -> Dict:
    """
    단일 카테고리 평가

    Args:
        politician_name: 정치인 이름
        category: 카테고리

    Returns:
        {
            "success": bool,
            "rating": int or "X",
            "reasoning": str,
            "error": str or None
        }
    """
    logger.info(f"[EVALUATE] Starting: {politician_name} - {category}")

    # politician_id 조회
    result = supabase.table('politicians').select('id').eq('name', politician_name).execute()

    if not result.data:
        logger.error(f"[ERROR] Politician not found: {politician_name}")
        return {
            "success": False,
            "rating": "X",
            "reasoning": "Politician not found",
            "error": "Politician not found in database"
        }

    politician_id = result.data[0]['id']

    # 수집 데이터 로드 (미평가 데이터만)
    collected_data = load_collected_data_for_evaluation(politician_id, category)

    if not collected_data:
        logger.info(f"[OK] All evaluations already completed for {politician_name} - {category}")
        return {
            "success": True,
            "rating": None,
            "reasoning": "All evaluations already completed",
            "error": None,
            "evaluations_saved": 0,
            "total_evaluations": 0,
            "total_collected": 0
        }

    logger.info(f"[INFO] Loaded {len(collected_data)} unevaluated items for {category}")

    # instruction 파일 로드 (1회만)
    instruction_content = load_instruction(category)
    if instruction_content:
        logger.info(f"[INFO] Instruction loaded for {category}")
    else:
        logger.warning(f"[WARNING] No instruction file for {category}")

    # 배치 처리 (V40 배치 크기: 25개)
    BATCH_SIZE = 25
    total_saved = 0
    all_evaluations = []

    for batch_idx in range(0, len(collected_data), BATCH_SIZE):
        batch_data = collected_data[batch_idx:batch_idx + BATCH_SIZE]
        batch_num = (batch_idx // BATCH_SIZE) + 1
        total_batches = (len(collected_data) + BATCH_SIZE - 1) // BATCH_SIZE

        logger.info(f"[BATCH {batch_num}/{total_batches}] Processing {len(batch_data)} items...")

        # 수집 데이터 JSON 형식 준비 (ID 포함, content 500자로 통일)
        data_json = []
        for item in batch_data:
            data_json.append({
                "id": item.get('id'),
                "date": item.get('published_date'),
                "title": item.get('title'),
                "content": item.get('content', '')[:500],
                "source": item.get('source_name')
            })

        # 통일된 평가 프롬프트 생성 (instruction 기반)
        prompt = build_evaluation_prompt(politician_name, category, data_json, instruction_content)

        # Gemini API 직접 실행 (CLI는 긴 프롬프트에서 hang 발생)
        from collect_gemini_subprocess import execute_gemini_api
        result = execute_gemini_api(prompt, timeout=120, max_retries=3)

        if not result['success']:
            logger.error(f"[ERROR] Batch {batch_num} failed: {result['error']}")
            continue

        # 응답 파싱
        batch_evaluations = parse_gemini_evaluation(result['output'])

        if not batch_evaluations:
            logger.warning(f"[WARNING] Batch {batch_num}: No evaluations returned")
            continue

        # collected_data_id → data 매핑 생성
        data_map = {item['id']: item for item in batch_data}

        # DB 저장
        saved_count = save_evaluations_to_db(
            politician_id,
            politician_name,
            category,
            batch_evaluations,
            data_map
        )

        total_saved += saved_count
        all_evaluations.extend(batch_evaluations)

        logger.info(f"[BATCH {batch_num}/{total_batches}] Saved {saved_count}/{len(batch_evaluations)} evaluations")

    logger.info(f"[OK] All batches complete: {total_saved}/{len(collected_data)} evaluations saved")

    return {
        "success": True,
        "evaluations_saved": total_saved,
        "total_evaluations": len(all_evaluations),
        "total_collected": len(collected_data),
        "error": None
    }


def main():
    """메인 실행 함수"""
    import argparse

    parser = argparse.ArgumentParser(
        description='V40 Gemini CLI Evaluation (Direct Subprocess)'
    )
    parser.add_argument('--politician', required=True, help='정치인 이름')
    parser.add_argument('--category', required=True,
                       choices=[
                           'expertise', 'leadership', 'vision', 'integrity', 'ethics',
                           'accountability', 'transparency', 'communication',
                           'responsiveness', 'publicinterest'
                       ],
                       help='카테고리')

    args = parser.parse_args()

    # ⚠️ V40: Gemini CLI 인증은 Google 계정으로 자동 처리됨
    # require_gemini_auth()

    # Phase Gate Check: Phase 2-2 완료 확인
    # politician_id 조회
    _result = supabase.table('politicians').select('id').eq('name', args.politician).execute()
    if _result.data:
        require_phase_gate(_result.data[0]['id'], '3')

    # 평가 실행
    result = evaluate_category(args.politician, args.category)

    if result['success']:
        print(f"\n[OK] Evaluation successful!")
        print(f"Evaluations saved: {result['evaluations_saved']}/{result.get('total_evaluations', 0)}")
        sys.exit(0)
    else:
        print(f"\n[ERROR] Evaluation failed: {result['error']}")
        sys.exit(1)


if __name__ == '__main__':
    main()
