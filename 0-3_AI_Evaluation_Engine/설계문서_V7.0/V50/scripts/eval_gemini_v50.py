# -*- coding: utf-8 -*-
"""
V50 Gemini 평가 (Gemini API Direct)

Google Generative Language REST API를 사용하여 수집 데이터를 Gemini로 평가합니다.

모델: gemini-2.0-flash-lite (V50 저가 모델)
방식: generativelanguage.googleapis.com REST API
테이블: collected_data_v50, evaluations_v50
배치 크기: 25개
instructions 경로: instructions/3_evaluate_v50/

V40 대비 변경사항:
- evaluate_gemini_subprocess.py (CLI subprocess) -> 순수 REST API 호출
- 모델: gemini-2.5-flash -> gemini-2.0-flash-lite

사용법:
    python eval_gemini_v50.py --politician_id=ID --politician_name="이름" --category=expertise
    python eval_gemini_v50.py --politician_id=ID --politician_name="이름" --category=all
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
        load_dotenv(
            Path('C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/.env'),
            override=True
        )

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# V50 테이블
TABLE_COLLECTED = "collected_data_v50"
TABLE_EVALUATIONS = "evaluations_v50"

# Gemini API 엔드포인트
GEMINI_MODEL = "gemini-2.0-flash-lite"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

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
            .eq('evaluator_ai', 'Gemini')\
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


def call_gemini_api(prompt: str, timeout: int = 120) -> str:
    """Gemini REST API 호출, 응답 텍스트 반환"""
    if not GEMINI_API_KEY:
        print('  오류: GEMINI_API_KEY 환경변수가 없습니다.', file=sys.stderr)
        return ''

    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "maxOutputTokens": 4096,
            "temperature": 0.1,
        }
    }

    try:
        resp = requests.post(url, json=payload, timeout=timeout)
        if resp.status_code != 200:
            print(f'  Gemini API 오류: {resp.status_code} {resp.text[:300]}', file=sys.stderr)
            return ''

        data = resp.json()
        # 응답 텍스트 추출
        candidates = data.get('candidates', [])
        if not candidates:
            print('  Gemini 응답 없음 (candidates 비어있음)', file=sys.stderr)
            return ''

        content = candidates[0].get('content', {})
        parts = content.get('parts', [])
        if not parts:
            return ''

        return parts[0].get('text', '')

    except requests.Timeout:
        print(f'  Gemini API 타임아웃 ({timeout}초)', file=sys.stderr)
        return ''
    except Exception as e:
        print(f'  Gemini API 오류: {e}', file=sys.stderr)
        return ''


def parse_json_response(text: str) -> list:
    """응답 텍스트에서 JSON 배열 추출"""
    if not text:
        return []

    # ```json ... ``` 블록 처리
    if '```json' in text:
        start = text.find('```json') + 7
        end = text.find('```', start)
        text = text[start:end].strip()
    elif '```' in text:
        start = text.find('```') + 3
        end = text.find('```', start)
        text = text[start:end].strip()

    # JSON 배열 추출
    if '[' in text:
        start = text.find('[')
        end = text.rfind(']') + 1
        json_str = text[start:end]
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f'  JSON 파싱 오류: {e}', file=sys.stderr)
            return []

    return []


def evaluate_batch_gemini(items: list, politician_name: str, category: str, instruction_content: str = '') -> list:
    """Gemini API로 배치 평가"""
    prompt = build_prompt(items, politician_name, category, instruction_content)
    text = call_gemini_api(prompt)
    if not text:
        return []

    raw_results = parse_json_response(text)

    # 등급 검증 및 정규화
    valid_results = []
    for ev in raw_results:
        rating = str(ev.get('rating', '')).strip()
        # 숫자만 있는 경우 보정
        if rating in ['4', '3', '2', '1']:
            rating = '+' + rating
        if rating not in VALID_RATINGS:
            print(f'  잘못된 등급: {rating} -> X 처리', file=sys.stderr)
            rating = 'X'
        valid_results.append({
            'id': ev.get('id'),
            'rating': rating,
            'reasoning': ev.get('reasoning', ev.get('reason', ev.get('rationale', '')))
        })

    return valid_results


def save_evaluations(evaluations: list, politician_id: str, politician_name: str, category: str) -> int:
    """평가 결과 DB 저장"""
    saved = 0
    for ev in evaluations:
        rating = ev.get('rating', '')
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
                .eq('evaluator_ai', 'Gemini')\
                .eq('collected_data_id', collected_data_id)\
                .execute()
            if existing.data:
                saved += 1
                continue

            supabase.table(TABLE_EVALUATIONS).insert({
                'politician_id': politician_id,
                'politician_name': politician_name,
                'category': category,
                'evaluator_ai': 'Gemini',
                'collected_data_id': collected_data_id,
                'rating': rating,
                'reasoning': ev.get('reasoning', '')[:1000],
            }).execute()
            saved += 1
        except Exception as e:
            print(f'  저장 오류: {e}', file=sys.stderr)
    return saved


def main():
    parser = argparse.ArgumentParser(description='V50 Gemini 평가 (Gemini API Direct)')
    parser.add_argument('--politician_id', required=True, help='정치인 ID (8자리 hex)')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--category', default='all', help='카테고리 또는 "all"')
    parser.add_argument('--batch_size', type=int, default=25, help='배치 크기 (기본: 25)')
    args = parser.parse_args()

    if not GEMINI_API_KEY:
        print('오류: GEMINI_API_KEY 환경변수가 없습니다.', file=sys.stderr)
        sys.exit(1)

    categories = list(CATEGORY_MAP.keys()) if args.category == 'all' else [args.category]
    total_saved = 0

    print('=' * 70)
    print(f'V50 Gemini 평가: {args.politician_name} (모델: {GEMINI_MODEL})')
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

            results = evaluate_batch_gemini(batch, args.politician_name, cat, instruction_content)
            if results:
                saved = save_evaluations(results, args.politician_id, args.politician_name, cat)
                total_saved += saved
                print(f'완료 ({saved}개 저장)')
            else:
                print('실패')

            time.sleep(1)

    print('\n' + '=' * 70)
    print(f'V50 Gemini 평가 완료: 총 {total_saved}개 저장')
    print('=' * 70)


if __name__ == '__main__':
    main()
