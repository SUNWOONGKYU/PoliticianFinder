# -*- coding: utf-8 -*-
"""
V40 OpenAI Codex CLI 배치 평가 헬퍼 (최적화 버전)

Codex CLI를 사용하여 ChatGPT 평가를 수행합니다.
배치 평가 방식으로 성능 최적화 (Gemini와 동일한 패턴)

모델: ChatGPT gpt-5.1-codex-mini
비용: $0.05 (input) / $0.40 (output) per 1M tokens
      - ChatGPT Plus 구독 방식 (별도 API 요금 X, 토큰 요금만 발생)
      - gpt-5.1 대비 96% 저렴 (cost optimization)
배치 크기: 25개

개선 사항:
    - 배치 평가: 25개 → 1번 Codex CLI 호출 (이전: 25번)
    - 배치 저장: 1번 INSERT (이전: 25번)
    - common_eval_saver.py 사용 (Gemini와 동일)
    - 자동 재시도: Foreign key 오류 시 배치 크기 5개로 자동 재시도

사용법:
    python codex_eval_helper.py --politician_id=d0a5d6e1 --politician_name="조은희" --category=expertise
"""

import os
import sys
import json
import subprocess
import argparse
import html
from pathlib import Path
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

# 공통 저장 함수 import
from common_eval_saver import save_evaluations_batch_upsert

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

# 카테고리 정의
CATEGORY_MAP = {
    "expertise": "전문성",
    "leadership": "리더십",
    "vision": "비전",
    "integrity": "청렴성",
    "ethics": "윤리성",
    "accountability": "책임감",
    "transparency": "투명성",
    "communication": "소통능력",
    "responsiveness": "대응성",
    "publicinterest": "공익성"
}

# V40 등급 체계
VALID_RATINGS = ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4', 'X']


def get_unevaluated_data(politician_id, category):
    """
    미평가 데이터 조회 (최적화: 이미 평가된 데이터 사전 필터링)

    Returns:
        미평가 데이터 리스트
    """
    cat_lower = category.lower()

    # 1. 이미 평가된 collected_data_id
    eval_result = supabase.table(TABLE_EVALUATIONS)\
        .select('collected_data_id')\
        .eq('politician_id', politician_id)\
        .eq('evaluator_ai', 'ChatGPT')\
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


def evaluate_batch_with_codex(politician_name, category, data_items):
    """
    Codex CLI로 배치 평가 (Gemini와 동일한 패턴)

    Args:
        politician_name: 정치인 이름
        category: 카테고리
        data_items: 평가할 데이터 리스트 (배치)

    Returns:
        평가 결과 리스트 [{"id": "...", "rating": "...", "rationale": "..."}, ...]
    """
    cat_kor = CATEGORY_MAP.get(category.lower(), category)

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

    # 배치 평가 프롬프트 (Gemini와 유사)
    prompt = f"""정치인 {politician_name}의 {cat_kor} 관련 데이터를 평가하세요.

평가 기준:
- +4 (탁월): 모범 사례, 법 제정, 대통령 표창 수준
- +3 (우수): 구체적 성과, 다수 법안 통과
- +2 (양호): 일반적 긍정 활동, 법안 발의
- +1 (보통): 노력, 출석, 기본 역량
- -1 (미흡): 비판 받음, 지적당함
- -2 (부족): 논란, 의혹 제기
- -3 (심각): 수사, 조사 착수
- -4 (최악): 유죄 확정, 법적 처벌
- X (제외): 동명이인, 10년 이상 과거, 가짜 정보

다음 JSON 형식으로 응답하세요:

```json
{{
  "evaluations": [
    {{
      "id": "데이터 ID",
      "rating": "+3",
      "rationale": "평가 근거 (한국어 1문장)"
    }}
  ]
}}
```

평가할 데이터:

{json.dumps(data_json, ensure_ascii=False, indent=2)}

각 데이터에 대해 rating과 rationale을 제공하세요."""

    try:
        # Codex CLI 실행 (배치 평가)
        # gpt-5.1-codex-mini: ~1 credit per message (가장 저렴)
        result = subprocess.run(
            ['codex', 'exec', '-m', 'gpt-5.1-codex-mini'],
            input=prompt,
            capture_output=True,
            text=True,
            encoding='utf-8',
            timeout=300,  # 5분 (배치 평가는 시간이 더 걸림)
            shell=True
        )

        # Codex CLI는 verbose 출력을 stderr로 보냄 (정상 동작)
        # returncode와 stdout만 확인
        if result.returncode != 0 and not result.stdout:
            print(f"❌ Codex 실행 오류: {result.stderr[:200]}", file=sys.stderr)
            return []

        # 출력에서 JSON 추출 (stdout 우선, 없으면 stderr 확인)
        output = result.stdout if result.stdout else result.stderr
        if not output:
            print(f"⚠️ Codex 출력 없음", file=sys.stderr)
            return []

        # Codex의 verbose 헤더 제거 (assistant\n 이후부터가 실제 응답)
        if 'assistant\n' in output:
            output = output.split('assistant\n', 1)[1]

        # JSON 파싱 (Gemini와 동일한 로직)
        try:
            # JSON 블록 추출
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
                if '{' in json_str and '}' in json_str:
                    start_idx = json_str.find('{')
                    end_idx = json_str.rfind('}') + 1
                    json_str = json_str[start_idx:end_idx]

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
                    print(f"⚠️ 잘못된 등급: {rating}, X로 변경", file=sys.stderr)
                    rating = 'X'

                valid_evaluations.append({
                    "id": eval_item.get('id'),
                    "rating": rating,
                    "rationale": eval_item.get('rationale', eval_item.get('reasoning', ''))[:1000]
                })

            print(f"✅ Codex 평가 완료: {len(valid_evaluations)}개")
            return valid_evaluations

        except json.JSONDecodeError as e:
            print(f"❌ JSON 파싱 오류: {e}", file=sys.stderr)
            print(f"출력: {output[:500]}...", file=sys.stderr)
            return []

    except subprocess.TimeoutExpired:
        print(f"⏱️ 타임아웃 (5분 초과)", file=sys.stderr)
        return []
    except Exception as e:
        print(f"❌ 오류: {e}", file=sys.stderr)
        return []


def main():
    parser = argparse.ArgumentParser(description='V40 Codex CLI 배치 평가 (최적화)')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--category', required=True, help='카테고리')
    parser.add_argument('--batch_size', type=int, default=25, help='배치 크기 (기본 25)')

    args = parser.parse_args()

    print('=' * 80)
    print(f'Codex CLI 배치 평가: {args.politician_name} - {args.category}')
    print('=' * 80)
    print()

    # 미평가 데이터 조회
    unevaluated = get_unevaluated_data(args.politician_id, args.category)

    if not unevaluated:
        print('✅ 모든 데이터 평가 완료')
        return

    print(f'배치 크기: {args.batch_size}개')
    print()

    # 배치 처리
    total_saved = 0
    total_batches = (len(unevaluated) + args.batch_size - 1) // args.batch_size

    for batch_idx in range(0, len(unevaluated), args.batch_size):
        batch_data = unevaluated[batch_idx:batch_idx + args.batch_size]
        batch_num = (batch_idx // args.batch_size) + 1

        print(f'[배치 {batch_num}/{total_batches}] {len(batch_data)}개 평가 중...')

        # Codex로 배치 평가
        evaluations = evaluate_batch_with_codex(args.politician_name, args.category, batch_data)

        if not evaluations:
            print(f'❌ 배치 {batch_num} 평가 실패')
            continue

        # 배치 저장 (common_eval_saver 사용)
        result = save_evaluations_batch_upsert(
            politician_id=args.politician_id,
            politician_name=args.politician_name,
            category=args.category,
            evaluator_ai='ChatGPT',
            evaluations=evaluations,
            verbose=True
        )

        # Foreign key constraint 오류 발생 시 배치 크기 5개로 재시도
        if result.get('error') and 'foreign key constraint' in str(result.get('error', '')).lower():
            print(f'⚠️ Foreign key constraint 오류 발생. 배치 크기를 5개로 줄여서 재시도...')
            retry_saved = 0
            retry_size = 5

            for retry_idx in range(0, len(evaluations), retry_size):
                retry_batch = evaluations[retry_idx:retry_idx + retry_size]
                retry_num = (retry_idx // retry_size) + 1
                retry_total = (len(evaluations) + retry_size - 1) // retry_size

                print(f'  [재시도 {retry_num}/{retry_total}] {len(retry_batch)}개 저장 중...')

                retry_result = save_evaluations_batch_upsert(
                    politician_id=args.politician_id,
                    politician_name=args.politician_name,
                    category=args.category,
                    evaluator_ai='ChatGPT',
                    evaluations=retry_batch,
                    verbose=False
                )

                retry_saved += retry_result['saved']

            print(f'✅ 재시도 완료: {retry_saved}/{len(evaluations)}개 저장')
            total_saved += retry_saved
            print(f'[배치 {batch_num}/{total_batches}] 최종: {retry_saved}/{len(evaluations)}개')
        else:
            total_saved += result['saved']
            print(f'[배치 {batch_num}/{total_batches}] 저장: {result["saved"]}/{result["total"]}개')

        print()

    print('=' * 80)
    print(f'✅ 전체 완료: {total_saved}/{len(unevaluated)}개 저장')
    print('=' * 80)


if __name__ == '__main__':
    main()
