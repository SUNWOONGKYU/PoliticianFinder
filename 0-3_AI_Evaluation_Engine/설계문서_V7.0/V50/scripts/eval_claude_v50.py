# -*- coding: utf-8 -*-
"""
V50 Claude 평가 (Anthropic API Direct)

Anthropic API를 사용하여 수집 데이터를 Claude Haiku 4.5로 평가합니다.

모델: claude-haiku-4-5-20251001
테이블: collected_data_v50, evaluations_v50
배치 크기: 25개
instructions 경로: instructions/3_evaluate_v50/

사용법:
    python eval_claude_v50.py --politician_id=ID --politician_name="이름" --category=expertise
    python eval_claude_v50.py --politician_id=ID --politician_name="이름" --category=all
"""

import sys
import io
import os
import json
import html
import time
import argparse
import requests
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# UTF-8 출력 설정
if sys.platform == 'win32':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    except AttributeError:
        pass

# 경로 설정: V50/scripts/ -> V50/
SCRIPT_DIR = Path(__file__).resolve().parent
V50_DIR = SCRIPT_DIR.parent

# .env 로드: V50_DIR 우선, 그 다음 상위 디렉터리 탐색
_env_path = V50_DIR / '.env'
if _env_path.exists():
    load_dotenv(_env_path, override=True)
else:
    _search = V50_DIR
    for _ in range(6):
        if (_search / '.env').exists():
            load_dotenv(_search / '.env', override=True)
            break
        _search = _search.parent
    else:
        # 최후 수단: 알려진 경로
        load_dotenv(
            Path('C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/.env'),
            override=True
        )

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')

# V50 테이블
TABLE_COLLECTED = "collected_data_v50"
TABLE_EVALUATIONS = "evaluations_v50"

CATEGORY_MAP = {
    'expertise': '전문성',
    'leadership': '리더십',
    'vision': '비전',
    'integrity': '청렴성',
    'ethics': '윤리성',
    'accountability': '책임감',
    'transparency': '투명성',
    'communication': '소통능력',
    'responsiveness': '대응성',
    'publicinterest': '공익성',
}

CAT_PREFIX_MAP = {
    'expertise': 'cat01', 'leadership': 'cat02', 'vision': 'cat03',
    'integrity': 'cat04', 'ethics': 'cat05', 'accountability': 'cat06',
    'transparency': 'cat07', 'communication': 'cat08',
    'responsiveness': 'cat09', 'publicinterest': 'cat10',
}

VALID_RATINGS = ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4', 'X']


def load_instruction(category: str) -> str:
    """V50 instructions/3_evaluate_v50/ 에서 카테고리 평가 기준 로드"""
    prefix = CAT_PREFIX_MAP.get(category.lower(), '')
    if not prefix:
        return ''
    path = V50_DIR / 'instructions' / '3_evaluate_v50' / f'{prefix}_{category.lower()}.md'
    if not path.exists():
        return ''
    try:
        import re
        content = path.read_text(encoding='utf-8')
        # Section 3 추출: "## 3." 부터 "## 4." 직전까지
        match = re.search(r'(## 3\..*?)(?=\n## 4\.)', content, re.DOTALL)
        if match:
            return match.group(1).strip()
        return content[:2000]
    except Exception:
        return ''


def get_unevaluated(politician_id: str, category: str) -> list:
    """미평가 데이터 조회 (Supabase 1000행 제한 대응: pagination)"""
    # 이미 평가된 collected_data_id 수집
    evaluated_ids = set()
    offset = 0
    while True:
        r = supabase.table(TABLE_EVALUATIONS)\
            .select('collected_data_id')\
            .eq('politician_id', politician_id)\
            .eq('evaluator_ai', 'Claude')\
            .eq('category', category)\
            .range(offset, offset + 999)\
            .execute()
        batch = r.data or []
        for row in batch:
            if row.get('collected_data_id'):
                evaluated_ids.add(row['collected_data_id'])
        if len(batch) < 1000:
            break
        offset += 1000

    # 전체 수집 데이터 조회
    all_items = []
    offset = 0
    while True:
        r = supabase.table(TABLE_COLLECTED)\
            .select('*')\
            .eq('politician_id', politician_id)\
            .eq('category', category)\
            .range(offset, offset + 999)\
            .execute()
        batch = r.data or []
        all_items.extend(batch)
        if len(batch) < 1000:
            break
        offset += 1000

    unevaluated = [item for item in all_items if item['id'] not in evaluated_ids]
    print(f'  총 데이터: {len(all_items)}개, 이미 평가: {len(evaluated_ids)}개, 평가할 데이터: {len(unevaluated)}개')
    return unevaluated


def build_prompt(items: list, politician_name: str, category: str, instruction_content: str = '') -> str:
    """평가 프롬프트 생성"""
    cat_kor = CATEGORY_MAP.get(category, category)

    instruction_section = f'\n[평가 기준]\n{instruction_content}\n' if instruction_content else ''

    items_text = ''
    for i, item in enumerate(items):
        title = html.unescape(item.get('title', ''))
        content = html.unescape(item.get('content', ''))[:400]
        source = html.unescape(item.get('source_name', ''))
        date = item.get('published_date', '')
        items_text += (
            f'\n[항목 {i+1}] (ID: {item["id"]})\n'
            f'제목: {title}\n'
            f'내용: {content}\n'
            f'출처: {source}\n'
            f'날짜: {date}\n---\n'
        )

    prompt = (
        f'당신은 정치인 평가 AI입니다. '
        f'아래 {len(items)}개 데이터를 각각 평가하고 JSON 배열로 답변하세요.\n\n'
        f'정치인: {politician_name}\n'
        f'평가 카테고리: {cat_kor}\n'
        f'{instruction_section}'
        f'{items_text}\n'
        f'[평가 등급]\n'
        f'+4(탁월), +3(우수), +2(양호), +1(보통), '
        f'-1(미흡), -2(부족), -3(심각), -4(최악), '
        f'X(제외)\n\n'
        f'반드시 아래 JSON 배열 형식으로만 답변하세요:\n'
        f'[\n  {{"id": "항목ID", "rating": "+3", "reasoning": "평가근거 200자이내"}},\n  ...\n]\n\n'
        f'JSON 배열만 출력하세요:'
    )
    return prompt


def evaluate_batch_claude(items: list, politician_name: str, category: str, instruction_content: str = '') -> list:
    """Claude Haiku 4.5 API로 배치 평가"""
    prompt = build_prompt(items, politician_name, category, instruction_content)

    headers = {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
    }
    payload = {
        'model': 'claude-haiku-4-5-20251001',
        'max_tokens': 4096,
        'messages': [{'role': 'user', 'content': prompt}],
    }

    try:
        resp = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers=headers,
            json=payload,
            timeout=120,
        )
        if resp.status_code != 200:
            print(f'  API 오류: {resp.status_code} {resp.text[:200]}', file=sys.stderr)
            return []

        data = resp.json()
        text = data['content'][0]['text']

        if '[' in text:
            start = text.find('[')
            end = text.rfind(']') + 1
            results = json.loads(text[start:end])
            return results
        return []
    except Exception as e:
        print(f'  오류: {e}', file=sys.stderr)
        return []


def save_evaluations(evaluations: list, politician_id: str, politician_name: str, category: str) -> int:
    """평가 결과 DB 저장"""
    saved = 0
    for ev in evaluations:
        rating = str(ev.get('rating', '')).strip()
        # 숫자만 있는 경우 보정 (예: "3" -> "+3")
        if rating.lstrip('-').isdigit() and not rating.startswith('+') and not rating.startswith('-'):
            rating = '+' + rating
        if rating not in VALID_RATINGS:
            continue

        collected_data_id = ev.get('id', '')
        if not collected_data_id:
            continue

        try:
            # 중복 체크
            existing = supabase.table(TABLE_EVALUATIONS)\
                .select('id')\
                .eq('politician_id', politician_id)\
                .eq('category', category)\
                .eq('evaluator_ai', 'Claude')\
                .eq('collected_data_id', collected_data_id)\
                .execute()
            if existing.data:
                saved += 1  # 이미 존재, 성공으로 집계
                continue

            supabase.table(TABLE_EVALUATIONS).insert({
                'politician_id': politician_id,
                'politician_name': politician_name,
                'category': category,
                'evaluator_ai': 'Claude',
                'collected_data_id': collected_data_id,
                'rating': rating,
                'reasoning': ev.get('reasoning', ev.get('reason', ''))[:1000],
            }).execute()
            saved += 1
        except Exception as e:
            print(f'  저장 오류: {e}', file=sys.stderr)
    return saved


def main():
    parser = argparse.ArgumentParser(description='V50 Claude 평가 (Anthropic API Direct)')
    parser.add_argument('--politician_id', required=True, help='정치인 ID (8자리 hex)')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--category', default='all', help='카테고리 또는 "all"')
    parser.add_argument('--batch_size', type=int, default=25, help='배치 크기 (기본: 25)')
    args = parser.parse_args()

    if not ANTHROPIC_API_KEY:
        print('오류: ANTHROPIC_API_KEY 환경변수가 없습니다.', file=sys.stderr)
        sys.exit(1)

    categories = list(CATEGORY_MAP.keys()) if args.category == 'all' else [args.category]
    total_saved = 0

    print('=' * 70)
    print(f'V50 Claude 평가: {args.politician_name}')
    print('=' * 70)

    for cat in categories:
        print(f'\n[{cat}] 평가 시작...')

        unevaluated = get_unevaluated(args.politician_id, cat)
        if not unevaluated:
            print(f'  [{cat}] 완료 (미평가 없음)')
            continue

        # instruction 로드
        instruction_content = load_instruction(cat)
        if instruction_content:
            print(f'  평가 기준 로드 완료: {cat}')
        else:
            print(f'  평가 기준 없음 (기본 기준 적용)')

        total_batches = (len(unevaluated) + args.batch_size - 1) // args.batch_size

        for i in range(0, len(unevaluated), args.batch_size):
            batch = unevaluated[i:i + args.batch_size]
            batch_num = i // args.batch_size + 1
            print(f'  [{cat}] 배치 {batch_num}/{total_batches} 처리 중 ({len(batch)}개)...', end=' ', flush=True)

            results = evaluate_batch_claude(batch, args.politician_name, cat, instruction_content)
            if results:
                saved = save_evaluations(results, args.politician_id, args.politician_name, cat)
                total_saved += saved
                print(f'완료 ({saved}개 저장)')
            else:
                print('실패')

            time.sleep(1)

    print('\n' + '=' * 70)
    print(f'V50 Claude 평가 완료: 총 {total_saved}개 저장')
    print('=' * 70)


if __name__ == '__main__':
    main()
