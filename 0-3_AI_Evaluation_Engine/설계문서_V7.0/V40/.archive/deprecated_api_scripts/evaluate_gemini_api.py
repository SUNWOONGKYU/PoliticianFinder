# -*- coding: utf-8 -*-
"""
V40 Gemini API 자동 평가 스크립트

Gemini API를 사용해서 전체 카테고리를 자동으로 평가합니다.
"""

import os
import sys
import json
import subprocess
from dotenv import load_dotenv
import google.generativeai as genai
from supabase import create_client

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

# Gemini 설정
import warnings
warnings.filterwarnings('ignore', category=FutureWarning)

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-2.5-flash')

CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

CATEGORY_KR = {
    'expertise': '전문성', 'leadership': '리더십', 'vision': '비전',
    'integrity': '청렴성', 'ethics': '윤리성', 'accountability': '책임감',
    'transparency': '투명성', 'communication': '소통능력', 'responsiveness': '대응성',
    'publicinterest': '공익성'
}

SYSTEM_PROMPT = """등급(점수): +4(+8)탁월 | +3(+6)우수 | +2(+4)양호 | +1(+2)보통
-1(-2)미흡 | -2(-4)부족 | -3(-6)심각 | -4(-8)최악 | X(0)평가제외

판단: 긍정(성과/업적)→+4~+1 | 부정(논란/비판)→-1~-4
X판정: 10년+과거/동명이인/무관/날조 → 모수 제외

반드시 모든 항목을 빠짐없이 평가하세요. 항목 수와 evaluations 수가 동일해야 합니다.

JSON: {"evaluations":[{"id":"UUID","rating":"+4~-4 또는 X","rationale":"근거"}]}"""


def get_profile(politician_id):
    """정치인 프로필 조회"""
    try:
        result = supabase.table('politicians').select('*').eq('id', politician_id).execute()
        if result.data:
            return result.data[0]
    except:
        pass
    return {}


def fetch_data(politician_id, politician_name, category):
    """gemini_eval_helper.py fetch 실행"""
    cmd = [
        'python', 'gemini_eval_helper.py', 'fetch',
        f'--politician_id={politician_id}',
        f'--politician_name={politician_name}',
        f'--category={category}'
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')

    if result.returncode != 0:
        print(f"[ERROR] fetch 실패")
        return None

    try:
        # stdout에서 JSON만 추출 (첫 { 부터 마지막 } 까지)
        stdout = result.stdout
        start = stdout.find('{')
        end = stdout.rfind('}')
        if start >= 0 and end > start:
            json_str = stdout[start:end+1]
            data = json.loads(json_str)
            # categories 배열에서 첫 번째 항목 가져오기
            if 'categories' in data and data['categories']:
                cat_data = data['categories'][0]
                profile = get_profile(politician_id)
                return {
                    'profile': profile,
                    'items': cat_data.get('items', []),
                    'total_count': cat_data.get('need_evaluation', 0)
                }
        return None
    except json.JSONDecodeError as e:
        print(f"[ERROR] JSON 파싱 실패: {e}")
        return None


def evaluate_batch(profile, items, category):
    """Gemini API로 배치 평가"""
    profile_text = f"""**대상 정치인**: {profile['name']}
- 이름: {profile['name']}
- 신분: {profile.get('identity', 'N/A')}
- 직책: {profile.get('title', profile.get('position', 'N/A'))}
- 정당: {profile.get('party', 'N/A')}
- 지역: {profile.get('region', 'N/A')}

⚠️ **중요**: 반드시 위 정보와 일치하는 "{profile['name']}"에 대해 평가하세요."""

    items_text = ""
    for i, item in enumerate(items, 1):
        title = item.get('title', '')
        content = item.get('content', '')[:300]
        items_text += f"\n[{i}] ID: {item['id']}\n제목: {title}\n내용: {content}...\n"

    category_kr = CATEGORY_KR[category]

    user_prompt = f"""{profile_text}

**평가 카테고리**: {category_kr} ({category})

**평가 대상 데이터** ({len(items)}개):
{items_text}

각 항목에 대해 {category_kr} 관점에서 등급을 부여하고, JSON으로 응답하세요."""

    try:
        response = model.generate_content(
            f"{SYSTEM_PROMPT}\n\n{user_prompt}",
            generation_config=genai.GenerationConfig(
                max_output_tokens=16384,
                temperature=0.7
            )
        )

        text = response.text

        # JSON 추출
        if '```json' in text:
            start = text.find('```json') + 7
            end = text.find('```', start)
            json_str = text[start:end].strip()
        elif '```' in text:
            start = text.find('```') + 3
            end = text.find('```', start)
            json_str = text[start:end].strip()
        else:
            json_str = text.strip()

        return json.loads(json_str)

    except Exception as e:
        print(f"[ERROR] Gemini API 호출 실패: {e}")
        return None


def save_results(politician_id, politician_name, category, evaluations):
    """gemini_eval_helper.py save 실행"""
    # 임시 파일 저장
    temp_file = f'temp_gemini_{category}.json'
    with open(temp_file, 'w', encoding='utf-8') as f:
        json.dump(evaluations, f, ensure_ascii=False, indent=2)

    cmd = [
        'python', 'gemini_eval_helper.py', 'save',
        f'--politician_id={politician_id}',
        f'--politician_name={politician_name}',
        f'--category={category}',
        f'--input={temp_file}'
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')

    # 임시 파일 삭제
    if os.path.exists(temp_file):
        os.remove(temp_file)

    if result.returncode != 0:
        print(f"[ERROR] save 실패: {result.stderr}")
        return False

    print(result.stdout)
    return True


def main():
    import argparse

    parser = argparse.ArgumentParser(description='V40 Gemini API 자동 평가')
    parser.add_argument('--politician_id', required=True)
    parser.add_argument('--politician_name', required=True)
    parser.add_argument('--category', default='all')

    args = parser.parse_args()

    categories = CATEGORIES if args.category == 'all' else [args.category]

    for category in categories:
        print(f"\n[{category}] 평가 시작...")

        # 1. 데이터 fetch
        data = fetch_data(args.politician_id, args.politician_name, category)
        if not data or not data.get('items'):
            print(f"[{category}] 평가할 데이터 없음 (이미 완료)")
            continue

        items = data['items']
        profile = data['profile']
        total = len(items)

        print(f"[{category}] {total}개 항목 평가 중...")

        # 2. 배치로 나누기 (25개씩)
        batch_size = 25
        all_evaluations = []

        for i in range(0, total, batch_size):
            batch = items[i:i+batch_size]
            batch_num = i // batch_size + 1
            total_batches = (total + batch_size - 1) // batch_size

            print(f"  배치 {batch_num}/{total_batches} ({len(batch)}개)...")

            # 3. Gemini API 평가
            result = evaluate_batch(profile, batch, category)
            if not result or 'evaluations' not in result:
                print(f"  [ERROR] 배치 {batch_num} 평가 실패")
                continue

            all_evaluations.extend(result['evaluations'])
            print(f"  [OK] {len(result['evaluations'])}개 평가 완료")

        # 4. 결과 저장
        if all_evaluations:
            print(f"[{category}] 총 {len(all_evaluations)}개 결과 저장 중...")
            save_results(
                args.politician_id,
                args.politician_name,
                category,
                {'evaluations': all_evaluations}
            )
            print(f"[{category}] ✅ 완료")
        else:
            print(f"[{category}] ❌ 평가 결과 없음")

    print("\n전체 평가 완료!")


if __name__ == '__main__':
    main()
