# -*- coding: utf-8 -*-
"""
V40 Gemini CLI 자동 평가 스크립트 (V40 Final)

collected_data_v40 테이블 사용
gemini_eval_helper.py 활용
instruction 파일 기반 프롬프트 생성
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
sys.path.insert(0, str(V40_DIR))

# 환경 변수 로드
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

CATEGORY_MAP = {
    'expertise': ('cat01_expertise', '전문성'),
    'leadership': ('cat02_leadership', '리더십'),
    'vision': ('cat03_vision', '비전'),
    'integrity': ('cat04_integrity', '청렴성'),
    'ethics': ('cat05_ethics', '윤리성'),
    'accountability': ('cat06_accountability', '책임감'),
    'transparency': ('cat07_transparency', '투명성'),
    'communication': ('cat08_communication', '소통능력'),
    'responsiveness': ('cat09_responsiveness', '대응성'),
    'publicinterest': ('cat10_publicinterest', '공익성')
}


def fetch_unevaluated(politician_id, category):
    """gemini_eval_helper.py fetch 실행하여 미평가 데이터 조회"""
    cmd = [
        'python',
        str(V40_DIR / 'scripts' / 'helpers' / 'gemini_eval_helper.py'),
        'fetch',
        f'--politician_id={politician_id}',
        f'--politician_name=temp',
        f'--category={category}'
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')

    if result.returncode != 0:
        print(f"[ERROR] fetch 실패")
        return None

    try:
        # JSON 파싱
        stdout = result.stdout
        start = stdout.find('{')
        end = stdout.rfind('}')
        if start >= 0 and end > start:
            data = json.loads(stdout[start:end+1])
            if data['categories']:
                return data['categories'][0]
        return None
    except Exception as e:
        print(f"[ERROR] JSON 파싱 실패: {e}")
        return None


def load_instruction(category):
    """카테고리별 instruction 파일 로드"""
    cat_file, cat_kr = CATEGORY_MAP[category]
    instruction_path = V40_DIR / 'instructions' / '3_evaluate' / f'{cat_file}.md'

    if not instruction_path.exists():
        print(f"[WARNING] Instruction 파일 없음: {instruction_path}")
        return ""

    with open(instruction_path, 'r', encoding='utf-8') as f:
        return f.read()


def call_gemini_cli(prompt):
    """Gemini CLI 호출"""
    try:
        # Windows에서 gemini.cmd 사용
        gemini_cmd = 'gemini.cmd' if os.name == 'nt' else 'gemini'

        result = subprocess.run(
            [gemini_cmd, prompt],
            capture_output=True,
            text=True,
            encoding='utf-8',
            timeout=120
        )

        if result.returncode != 0:
            print(f"  [ERROR] Gemini CLI 실패: {result.stderr[:200]}")
            return None

        return result.stdout

    except subprocess.TimeoutExpired:
        print(f"  [ERROR] Gemini CLI 타임아웃")
        return None
    except FileNotFoundError:
        print(f"  [ERROR] Gemini CLI not found. Run: npm install -g @google/generative-ai-cli")
        return None
    except Exception as e:
        print(f"  [ERROR] Gemini CLI 호출 실패: {e}")
        return None


def build_prompt(politician_name, category, items):
    """평가 프롬프트 생성"""
    cat_file, cat_kr = CATEGORY_MAP[category]

    # Instruction 파일 경로
    instruction_path = f"설계문서_V7.0/V40/instructions/3_evaluate/{cat_file}.md"

    # Items를 JSON 형식으로 변환
    items_json = json.dumps(items, ensure_ascii=False, indent=2)

    prompt = f"""너는 정치인 평가 AI야. instruction 파일의 평가 기준을 읽고 데이터를 평가해라.

## 대상 정치인
- 이름: {politician_name}

## 카테고리: {category} ({cat_kr})

## 평가 기준 (instruction 파일 참조 - 반드시 읽어라)

**파일 위치:**
{instruction_path}

**작업:**
1. 위 파일에서 등급 판정 기준을 읽어라
2. 아래 데이터를 하나씩 읽고, 기준에 따라 등급(rating)을 매겨라
3. 각 데이터마다 rating과 rationale(한국어 1문장 근거)을 작성해라

## 등급 체계 (rating → score)

+4 → +8점 (탁월: 해당 카테고리에서 매우 뛰어난 성과/증거)
+3 → +6점 (우수: 해당 카테고리에서 뚜렷한 강점)
+2 → +4점 (양호: 해당 카테고리에서 긍정적 활동)
+1 → +2점 (보통: 기본적인 활동, 특별할 것 없음)
-1 → -2점 (미흡: 소극적이거나 기대 이하)
-2 → -4점 (부족: 명확한 문제점, 비판 근거 있음)
-3 → -6점 (심각: 중대한 문제, 논란)
-4 → -8점 (최악: 심각한 위반, 범법, 대형 스캔들)
X  → 0점  (제외: 10년+과거 자료 / 동명이인 / 해당 카테고리 무관 / 날조·조작)

## 평가 원칙
- {politician_name}이(가) **주인공**인 자료만 유효 평가 (단순 언급은 X)
- 동명이인(다른 소속·직업·지역) 자료는 반드시 X 처리
- 해당 카테고리({cat_kr})와 관련 없는 자료는 X 처리
- rating은 반드시 "+4", "+3", "+2", "+1", "-1", "-2", "-3", "-4", "X" 중 하나
- rationale은 한국어 1문장 (최대 50자)
- **모든 item을 빠짐없이 평가** (건너뛰기 금지)

## 평가할 데이터

{items_json}

## 출력

JSON 형식:
{{
  "evaluations": [
    {{
      "id": "원본 item의 id 그대로 복사",
      "rating": "+3",
      "rationale": "전문 분야 법안 발의 실적이 높음"
    }}
  ]
}}

## 주의사항
- id는 원본 item의 id를 **그대로** 복사 (절대 변경 금지)
- rating은 문자열: "+4", "+3", "+2", "+1", "-1", "-2", "-3", "-4", "X"
- rationale은 한국어 1문장 (근거 명확히)
- 모든 item을 빠짐없이 평가해라

위 instruction 파일의 평가 기준을 읽고, 모든 데이터를 평가하여 JSON으로 출력해줘."""

    return prompt


def save_evaluations(politician_id, politician_name, category, result_json):
    """gemini_eval_helper.py save 실행하여 결과 저장"""
    # 임시 파일 저장
    temp_file = V40_DIR / 'scripts' / 'helpers' / f'temp_gemini_{category}.json'

    with open(temp_file, 'w', encoding='utf-8') as f:
        json.dump(result_json, f, ensure_ascii=False, indent=2)

    # save 명령 실행
    cmd = [
        'python',
        str(V40_DIR / 'scripts' / 'helpers' / 'gemini_eval_helper.py'),
        'save',
        f'--politician_id={politician_id}',
        f'--politician_name={politician_name}',
        f'--category={category}',
        f'--input={temp_file}'
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')

    # 임시 파일 삭제
    if temp_file.exists():
        temp_file.unlink()

    if result.returncode != 0:
        print(f"  [ERROR] save 실패")
        return False

    print(result.stdout)
    return True


def main():
    import argparse

    parser = argparse.ArgumentParser(description='V40 Gemini CLI 자동 평가')
    parser.add_argument('--politician_id', required=True, help='정치인 ID (8자리 hex)')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--category', default='all', help='카테고리 (all 또는 특정 카테고리)')

    args = parser.parse_args()

    categories = CATEGORIES if args.category == 'all' else [args.category]

    for category in categories:
        print(f"\n{'='*60}")
        print(f"[{category}] 평가 시작...")
        print(f"{'='*60}")

        # 1. 미평가 데이터 조회
        cat_data = fetch_unevaluated(args.politician_id, category)
        if not cat_data or not cat_data.get('items'):
            print(f"[{category}] 평가할 데이터 없음 (이미 완료)")
            continue

        items = cat_data['items']
        total = len(items)
        print(f"[{category}] {total}개 항목 평가 중...")

        # 2. 배치로 나누기 (25개씩)
        batch_size = 25
        all_evaluations = []

        for i in range(0, total, batch_size):
            batch = items[i:i+batch_size]
            batch_num = i // batch_size + 1
            total_batches = (total + batch_size - 1) // batch_size

            print(f"\n  배치 {batch_num}/{total_batches} ({len(batch)}개)...")

            # 3. 프롬프트 생성
            prompt = build_prompt(args.politician_name, category, batch)

            # 4. Gemini CLI 호출
            response = call_gemini_cli(prompt)
            if not response:
                print(f"  [ERROR] 배치 {batch_num} 평가 실패")
                continue

            # 5. JSON 파싱
            try:
                # JSON 추출
                if '```json' in response:
                    start = response.find('```json') + 7
                    end = response.find('```', start)
                    json_str = response[start:end].strip()
                elif '```' in response:
                    start = response.find('```') + 3
                    end = response.find('```', start)
                    json_str = response[start:end].strip()
                else:
                    json_str = response.strip()

                result = json.loads(json_str)

                if 'evaluations' in result:
                    all_evaluations.extend(result['evaluations'])
                    print(f"  [OK] {len(result['evaluations'])}개 평가 완료")
                else:
                    print(f"  [ERROR] 평가 결과 없음")

            except Exception as e:
                print(f"  [ERROR] JSON 파싱 실패: {e}")
                continue

        # 6. 결과 저장
        if all_evaluations:
            print(f"\n[{category}] 총 {len(all_evaluations)}개 결과 저장 중...")
            save_evaluations(
                args.politician_id,
                args.politician_name,
                category,
                {'evaluations': all_evaluations}
            )
            print(f"[{category}] ✅ 완료")
        else:
            print(f"[{category}] ❌ 평가 결과 없음")

    print(f"\n{'='*60}")
    print("전체 평가 완료!")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
