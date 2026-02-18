# -*- coding: utf-8 -*-
"""
V40 Grok 평가 헬퍼 (배치 평가 + instruction 기반 프롬프트)

xAI Agent Tools API 방식으로 Grok 평가를 수행합니다.

모델: Grok 3 (grok-3)
방식: xAI Agent Tools API (curl subprocess)
배치 크기: 25개 (배치 평가로 전환)
비용: $0.30/M input, $0.50/M output

개선 사항 (V40 점수 수렴 해결):
    - 1-by-1 평가 → 25개 배치 평가로 전환
    - instruction 파일 로드하여 프롬프트에 반영
    - SCC 패턴 프롬프트 (Summarize-Checklist-Calibrate)
    - +3 편향 방지를 위한 앵커 예시 포함

사용법:
    python grok_eval_helper.py --politician_id=8c5dcc89 --politician_name="박주민" --category=expertise
"""

import os
import sys
import json
import html
import subprocess
import argparse
from pathlib import Path
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# 공통 저장 함수 import
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
from common_eval_saver import save_evaluations_batch_upsert, check_phase2_gate, load_instruction, build_evaluation_prompt
from phase_tracker import require_phase_gate

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# 테이블명
TABLE_COLLECTED = "collected_data_v40"
TABLE_EVALUATIONS = "evaluations_v40"

# V40 등급 체계
VALID_RATINGS = ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4', 'X']


def get_unevaluated_data(politician_id, category):
    """미평가 데이터 조회"""
    cat_lower = category.lower()

    # 1. 이미 평가된 collected_data_id
    eval_result = supabase.table(TABLE_EVALUATIONS)\
        .select('collected_data_id')\
        .eq('politician_id', politician_id)\
        .eq('evaluator_ai', 'Grok')\
        .eq('category', cat_lower)\
        .execute()
    evaluated_ids = {item['collected_data_id'] for item in (eval_result.data or []) if item.get('collected_data_id')}

    # 2. 전체 수집 데이터
    collected_result = supabase.table(TABLE_COLLECTED)\
        .select('*')\
        .eq('politician_id', politician_id)\
        .eq('category', cat_lower)\
        .execute()

    all_items = collected_result.data or []

    # 3. 미평가 필터링
    unevaluated = [item for item in all_items if item['id'] not in evaluated_ids]

    total = len(all_items)
    already_evaluated = len(evaluated_ids)
    to_evaluate = len(unevaluated)

    print(f'📊 총 데이터: {total}개, 이미 평가: {already_evaluated}개, 평가할 데이터: {to_evaluate}개')

    return unevaluated


def extract_grok_response_text(raw_output):
    """xAI Agent Tools API 응답에서 텍스트 추출

    Args:
        raw_output: curl stdout (JSON string)

    Returns:
        assistant 응답 텍스트 또는 None
    """
    try:
        api_response = json.loads(raw_output)

        content_text = None
        if 'output' in api_response and isinstance(api_response['output'], list) and len(api_response['output']) > 0:
            first_output = api_response['output'][0]

            if 'content' in first_output:
                content_field = first_output['content']

                if isinstance(content_field, list) and len(content_field) > 0:
                    first_content = content_field[0]
                    if isinstance(first_content, dict) and 'text' in first_content:
                        content_text = first_content['text']
                    else:
                        content_text = str(first_content)
                elif isinstance(content_field, str):
                    content_text = content_field

            if not content_text and 'role' in first_output and first_output['role'] == 'assistant':
                content_text = first_output.get('content', '')

        return content_text

    except json.JSONDecodeError:
        return None


def evaluate_batch_with_grok(politician_name, category, data_items, instruction_content=''):
    """
    Grok xAI API로 배치 평가 (instruction 기반 프롬프트)

    Args:
        politician_name: 정치인 이름
        category: 카테고리
        data_items: 평가할 데이터 리스트 (배치)
        instruction_content: 미리 로드된 instruction 내용

    Returns:
        평가 결과 리스트 [{"id": "...", "rating": "...", "rationale": "..."}, ...]
    """
    # 배치 데이터 JSON 형식 준비
    data_json = []
    for item in data_items:
        data_json.append({
            "id": item.get('id'),
            "title": html.unescape(item.get('title', '')),
            "content": html.unescape(item.get('content', ''))[:500],
            "source": html.unescape(item.get('source_name', '')),
            "date": item.get('published_date', '')
        })

    # 통일된 프롬프트 생성 (instruction 기반)
    prompt = build_evaluation_prompt(politician_name, category, data_json, instruction_content)

    try:
        api_key = os.getenv('XAI_API_KEY')
        if not api_key:
            print(f"  ❌ XAI_API_KEY 환경변수 없음", file=sys.stderr)
            return []

        # Agent Tools API 페이로드 (배치 평가)
        payload = {
            "model": "grok-3",
            "input": [
                {"role": "user", "content": prompt}
            ],
            "tools": []
        }

        # payload를 임시 파일에 저장 (Windows 명령줄 길이 제한 회피)
        import tempfile
        payload_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, encoding='utf-8')
        payload_file.write(json.dumps(payload, ensure_ascii=False))
        payload_file.close()

        try:
            # curl 명령어로 API 호출 (파일에서 데이터 읽기)
            curl_cmd = [
                'curl',
                '-s',
                '-X', 'POST',
                'https://api.x.ai/v1/responses',
                '-H', 'Content-Type: application/json',
                '-H', f'Authorization: Bearer {api_key}',
                '-d', f'@{payload_file.name}'
            ]

            result = subprocess.run(
                curl_cmd,
                capture_output=True,
                text=True,
                encoding='utf-8',
                timeout=300  # 배치 평가는 시간이 더 걸림
            )
        finally:
            os.unlink(payload_file.name)

        if result.returncode != 0:
            print(f"  ❌ Grok 실행 오류: {result.stderr[:200]}", file=sys.stderr)
            return []

        raw_output = result.stdout
        if not raw_output:
            print(f"  ⚠️ Grok 출력 없음", file=sys.stderr)
            return []

        # 응답 텍스트 추출
        content_text = extract_grok_response_text(raw_output)
        if not content_text:
            print(f"  ⚠️ assistant 응답 없음", file=sys.stderr)
            print(f"  응답 구조: {raw_output[:500]}", file=sys.stderr)
            return []

        # JSON 파싱
        try:
            if '```json' in content_text:
                start = content_text.find('```json') + 7
                end = content_text.find('```', start)
                json_str = content_text[start:end].strip()
            elif '```' in content_text:
                start = content_text.find('```') + 3
                end = content_text.find('```', start)
                json_str = content_text[start:end].strip()
            elif '{' in content_text and '}' in content_text:
                start = content_text.find('{')
                end = content_text.rfind('}') + 1
                json_str = content_text[start:end].strip()
            else:
                json_str = content_text.strip()

            data = json.loads(json_str)
            evaluations = data.get('evaluations', [])

            # 각 평가 검증 및 정규화
            valid_evaluations = []
            for eval_item in evaluations:
                rating = str(eval_item.get('rating', '')).strip().upper()

                # 등급 정규화 (4 → +4)
                if rating in ['4', '3', '2', '1']:
                    rating = '+' + rating

                if rating not in VALID_RATINGS:
                    print(f"  ⚠️ 잘못된 등급: {rating}, X로 변경", file=sys.stderr)
                    rating = 'X'

                valid_evaluations.append({
                    "id": eval_item.get('id'),
                    "rating": rating,
                    "rationale": eval_item.get('rationale', eval_item.get('reasoning', ''))[:1000]
                })

            print(f"  ✅ Grok 평가 완료: {len(valid_evaluations)}개")
            return valid_evaluations

        except json.JSONDecodeError as e:
            print(f"  ❌ JSON 파싱 오류: {e}", file=sys.stderr)
            print(f"  출력: {content_text[:500]}...", file=sys.stderr)
            return []

    except subprocess.TimeoutExpired:
        print(f"  ⏱️ 타임아웃 (5분 초과)", file=sys.stderr)
        return []
    except Exception as e:
        print(f"  ❌ 오류: {e}", file=sys.stderr)
        return []


def main():
    parser = argparse.ArgumentParser(description='V40 Grok 배치 평가 (instruction 기반)')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--category', required=True, help='카테고리')
    parser.add_argument('--batch_size', type=int, default=25, help='배치 크기')
    parser.add_argument('--skip-gate', action='store_true', help='Phase 2-2 게이트 검증 건너뛰기')

    args = parser.parse_args()

    print('=' * 80)
    print(f'Grok 배치 평가: {args.politician_name} - {args.category}')
    print('=' * 80)
    print()

    # Phase Gate Check: Phase 2-2 완료 확인
    if args.skip_gate:
        print('⚠️ --skip-gate 옵션: Phase Gate 검증 건너뜀')
        print()
    else:
        # 1차: Phase Tracker Gate (선행 Phase 완료 여부)
        require_phase_gate(args.politician_id, '3')

        # 2차: 데이터 수량 Gate (기존 유지)
        gate = check_phase2_gate(args.politician_id, args.category)
        if not gate['pass']:
            print('⛔ 데이터 수량 게이트 실패 - 평가 불가!')
            for v in gate['violations']:
                print(f'  - {v}')
            print('수집 데이터 기준 미충족. 재수집 후 다시 실행하세요.')
            print('Tip: 다른 AI가 이미 평가 완료한 경우 --skip-gate 옵션을 사용하세요.')
            sys.exit(1)
        if gate.get('warnings'):
            print(f'⚠️ 데이터 수량 경고 {len(gate["warnings"])}건 (평가 진행):')
            for w in gate['warnings']:
                print(f'  - {w}')
            print()

    # 미평가 데이터 조회
    unevaluated = get_unevaluated_data(args.politician_id, args.category)

    if not unevaluated:
        print('✅ 모든 데이터 평가 완료')
        return

    # instruction 파일 로드 (1회만)
    instruction_content = load_instruction(args.category)
    if instruction_content:
        print(f'📋 평가 기준 로드 완료: {args.category}')
    else:
        print(f'⚠️ 평가 기준 파일 없음 (일반 기준 적용)')

    print(f'배치 크기: {args.batch_size}개')
    print()

    # 배치 처리
    total_saved = 0
    total_batches = (len(unevaluated) + args.batch_size - 1) // args.batch_size

    for batch_idx in range(0, len(unevaluated), args.batch_size):
        batch_data = unevaluated[batch_idx:batch_idx + args.batch_size]
        batch_num = (batch_idx // args.batch_size) + 1

        print(f'[배치 {batch_num}/{total_batches}] {len(batch_data)}개 평가 중...')

        # Grok xAI API로 배치 평가 (instruction 포함)
        evaluations = evaluate_batch_with_grok(args.politician_name, args.category, batch_data, instruction_content)

        if not evaluations:
            print(f'  ❌ 배치 {batch_num} 평가 실패')
            continue

        # 배치 저장 (공통 함수 사용)
        result = save_evaluations_batch_upsert(
            politician_id=args.politician_id,
            politician_name=args.politician_name,
            category=args.category,
            evaluator_ai='Grok',
            evaluations=evaluations,
            verbose=True
        )

        total_saved += result['saved']
        print(f'  [배치 {batch_num}/{total_batches}] 저장: {result["saved"]}/{result["total"]}개')
        print()

    print('=' * 80)
    print(f'✅ 전체 완료: {total_saved}/{len(unevaluated)}개 저장')
    print('=' * 80)


if __name__ == '__main__':
    main()
