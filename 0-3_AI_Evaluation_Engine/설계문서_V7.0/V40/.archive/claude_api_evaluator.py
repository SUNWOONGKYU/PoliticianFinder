# -*- coding: utf-8 -*-
"""
Claude API Direct Evaluator for V40
Uses Anthropic API to evaluate collected data with Claude Haiku 4.5
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

# UTF-8 output
if sys.platform == 'win32':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    except AttributeError:
        pass

# Load env
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
# Walk up to find .env file
env_path = V40_DIR
for _ in range(5):
    if (env_path / '.env').exists():
        break
    env_path = env_path.parent
load_dotenv(env_path / '.env', override=True)
# Also try direct known path
if not os.getenv('SUPABASE_URL'):
    load_dotenv(Path('C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/.env'), override=True)

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')

CATEGORY_MAP = {
    'expertise': '\uc804\ubb38\uc131',
    'leadership': '\ub9ac\ub354\uc2ed',
    'vision': '\ube44\uc804',
    'integrity': '\uccad\ub834\uc131',
    'ethics': '\uc724\ub9ac\uc131',
    'accountability': '\ucc45\uc784\uac10',
    'transparency': '\ud22c\uba85\uc131',
    'communication': '\uc18c\ud1b5\ub2a5\ub825',
    'responsiveness': '\ub300\uc751\uc131',
    'publicinterest': '\uacf5\uc775\uc131'
}

VALID_RATINGS = ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4', 'X']

TABLE_COLLECTED = "collected_data_v40"
TABLE_EVALUATIONS = "evaluations_v40"


def get_unevaluated(politician_id, category):
    """Get unevaluated data for Claude"""
    eval_result = supabase.table(TABLE_EVALUATIONS)\
        .select('collected_data_id')\
        .eq('politician_id', politician_id)\
        .eq('evaluator_ai', 'Claude')\
        .eq('category', category)\
        .execute()
    evaluated_ids = {r['collected_data_id'] for r in (eval_result.data or []) if r.get('collected_data_id')}

    collected = supabase.table(TABLE_COLLECTED)\
        .select('*')\
        .eq('politician_id', politician_id)\
        .eq('category', category)\
        .execute()

    return [item for item in (collected.data or []) if item['id'] not in evaluated_ids]


def evaluate_batch_claude(items, politician_name, category):
    """Evaluate a batch of items using Claude Haiku 4.5 API"""
    cat_kor = CATEGORY_MAP.get(category, category)

    items_text = ''
    for i, item in enumerate(items):
        title = html.unescape(item.get('title', ''))
        content = html.unescape(item.get('content', ''))[:400]
        source = html.unescape(item.get('source_name', ''))
        date = item.get('published_date', '')
        items_text += (
            f'\n[\ud56d\ubaa9 {i+1}] (ID: {item["id"]})\n'
            f'\uc81c\ubaa9: {title}\n'
            f'\ub0b4\uc6a9: {content}\n'
            f'\ucd9c\ucc98: {source}\n'
            f'\ub0a0\uc9dc: {date}\n---\n'
        )

    prompt = (
        f'\ub2f9\uc2e0\uc740 \uc815\uce58\uc778 \ud3c9\uac00 AI\uc785\ub2c8\ub2e4. '
        f'\uc544\ub798 {len(items)}\uac1c \ub370\uc774\ud130\ub97c \uac01\uac01 \ud3c9\uac00\ud558\uace0 '
        f'JSON \ubc30\uc5f4\ub85c \ub2f5\ubcc0\ud558\uc138\uc694.\n\n'
        f'\uc815\uce58\uc778: {politician_name}\n'
        f'\ud3c9\uac00 \uce74\ud14c\uace0\ub9ac: {cat_kor}\n\n'
        f'{items_text}\n'
        f'[\ud3c9\uac00 \ub4f1\uae09]\n'
        f'+4(\ud0c1\uc6d4), +3(\uc6b0\uc218), +2(\uc591\ud638), +1(\ubcf4\ud1b5), '
        f'-1(\ubbf8\ud761), -2(\ubd80\uc871), -3(\ub9e4\uc6b0\ubd80\uc871), -4(\uadf9\ud788\ubd80\uc871), '
        f'X(\uc81c\uc678)\n\n'
        f'\ubc18\ub4dc\uc2dc \uc544\ub798 JSON \ubc30\uc5f4 \ud615\uc2dd\uc73c\ub85c\ub9cc \ub2f5\ubcc0\ud558\uc138\uc694:\n'
        f'[\n  {{"id": "\ud56d\ubaa9ID", "rating": "+3", "reasoning": "\ud3c9\uac00\uadfc\uac70 200\uc790\uc774\ub0b4"}},\n  ...\n]\n\n'
        f'JSON \ubc30\uc5f4\ub9cc \ucd9c\ub825\ud558\uc138\uc694:'
    )

    headers = {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
    }

    payload = {
        'model': 'claude-haiku-4-5-20251001',
        'max_tokens': 4096,
        'messages': [{'role': 'user', 'content': prompt}]
    }

    try:
        resp = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers=headers,
            json=payload,
            timeout=120
        )
        if resp.status_code != 200:
            print(f'  API error: {resp.status_code} {resp.text[:200]}', file=sys.stderr)
            return []

        data = resp.json()
        content = data['content'][0]['text']

        if '[' in content:
            start = content.find('[')
            end = content.rfind(']') + 1
            json_str = content[start:end]
            results = json.loads(json_str)
            return results
        return []
    except Exception as e:
        print(f'  Error: {e}', file=sys.stderr)
        return []


def save_evaluations(evaluations, politician_id, politician_name, category):
    """Save evaluations to DB"""
    saved = 0
    for ev in evaluations:
        rating = str(ev.get('rating', '')).strip()
        if rating not in VALID_RATINGS:
            if rating.isdigit() and int(rating) > 0:
                rating = '+' + rating
        if rating not in VALID_RATINGS:
            continue

        collected_data_id = ev.get('id', '')
        if not collected_data_id:
            continue

        try:
            # Check if already exists
            existing = supabase.table(TABLE_EVALUATIONS)\
                .select('id')\
                .eq('politician_id', politician_id)\
                .eq('category', category)\
                .eq('evaluator_ai', 'Claude')\
                .eq('collected_data_id', collected_data_id)\
                .execute()

            if existing.data:
                saved += 1  # Already exists, count as success
                continue

            supabase.table(TABLE_EVALUATIONS).insert({
                'politician_id': politician_id,
                'politician_name': politician_name,
                'category': category,
                'evaluator_ai': 'Claude',
                'collected_data_id': collected_data_id,
                'rating': rating,
                'reasoning': ev.get('reasoning', '')[:1000]
            }).execute()
            saved += 1
        except Exception as e:
            # Try without collected_data_id constraint
            try:
                supabase.table(TABLE_EVALUATIONS).insert({
                    'politician_id': politician_id,
                    'politician_name': politician_name,
                    'category': category,
                    'evaluator_ai': 'Claude',
                    'collected_data_id': collected_data_id,
                    'rating': rating,
                    'reasoning': ev.get('reasoning', '')[:1000]
                }).execute()
                saved += 1
            except Exception as e2:
                print(f'  Save error: {e2}', file=sys.stderr)
    return saved


def main():
    parser = argparse.ArgumentParser(description='Claude API Evaluator for V40')
    parser.add_argument('--politician_id', required=True)
    parser.add_argument('--politician_name', required=True)
    parser.add_argument('--category', default='all', help='Category or "all"')
    parser.add_argument('--batch_size', type=int, default=25)

    args = parser.parse_args()

    categories = list(CATEGORY_MAP.keys()) if args.category == 'all' else [args.category]
    total_saved = 0

    for cat in categories:
        unevaluated = get_unevaluated(args.politician_id, cat)
        if not unevaluated:
            print(f'{cat}: Already done')
            continue

        print(f'{cat}: {len(unevaluated)} items to evaluate')

        for i in range(0, len(unevaluated), args.batch_size):
            batch = unevaluated[i:i + args.batch_size]
            batch_num = i // args.batch_size + 1
            total_batches = (len(unevaluated) + args.batch_size - 1) // args.batch_size
            print(f'  Batch {batch_num}/{total_batches}: evaluating {len(batch)} items...', end=' ', flush=True)

            results = evaluate_batch_claude(batch, args.politician_name, cat)
            if results:
                saved = save_evaluations(results, args.politician_id, args.politician_name, cat)
                print(f'saved {saved}/{len(batch)}')
                total_saved += saved
            else:
                print('failed')

            time.sleep(1)

    print(f'\nTotal Claude evaluations saved: {total_saved}')


if __name__ == '__main__':
    main()
