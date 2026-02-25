#!/usr/bin/env python3
"""
Gemini CLI 응답 테스트 - JSON 파싱 디버그
"""

import subprocess, json, os, re, tempfile

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def call_gemini_cli(prompt, timeout=120):
    """Gemini CLI 호출 (간단한 버전)"""
    models = ["gemini-2.5-flash", "gemini-2.0-flash"]

    for model in models:
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as tf:
                tf.write(prompt)
                tf_path = tf.name

            cmd = f'cat "{tf_path}" | gemini -m {model}'
            result = subprocess.run(cmd, shell=True, capture_output=True, timeout=timeout)
            os.unlink(tf_path)

            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.decode('utf-8', errors='replace').strip()
        except subprocess.TimeoutExpired:
            print(f"    Timeout with {model}")
            continue
        except FileNotFoundError:
            print("    ERROR: gemini CLI not found")
            return None

    return None

def parse_candidates(response_text):
    """Gemini 응답에서 후보자 데이터 파싱"""
    json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response_text)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError as e:
            print(f"  [NG] JSON 파싱 실패 (```json 블록): {e}")
            print(f"  Content: {json_match.group(1)[:200]}")
            pass

    try:
        return json.loads(response_text)
    except json.JSONDecodeError as e:
        print(f"  [NG] JSON 파싱 실패 (전체 응답): {e}")
        print(f"  Content: {response_text[:200]}")
        pass

    return []

# 테스트: 서울 광역단체장
print("=" * 70)
print("테스트: 서울 광역단체장 후보 수집")
print("=" * 70)

prompt = """대한민국 서울특별시 지방선거(2026년 6월) 광역단체장(시도지사) 선거에서
여론조사 기준으로 가장 유력한 후보 4명을 선정해주세요.

반드시 다음 JSON 형식으로만 답변하세요:
```json
[
  {
    "name": "홍길동",
    "party": "국민의힘",
    "position": "현직 지위 또는 직책",
    "poll_rank": 1,
    "poll_support": "35%",
    "birth_date": "1970-01-15",
    "gender": "male",
    "career": ["경력1", "경력2", "경력3", "경력4", "경력5"],
    "previous_position": "전 직책"
  }
]
```

주의:
- 실제 존재하는 후보만
- 여론조사 상위 1~4위 순서대로
- 완전한 정보만"""

print("\n[*] Gemini CLI 호출 중...")
response = call_gemini_cli(prompt, timeout=180)

if response:
    print(f"\n[OK] Gemini 응답 수신 ({len(response)} chars)")
    print(f"\n응답 (처음 500자):\n{response[:500]}")

    print(f"\n[>>] JSON 파싱 시도...")
    candidates = parse_candidates(response)

    if candidates:
        print(f"\n[OK] 파싱 성공! {len(candidates)}명 추출됨")
        for i, c in enumerate(candidates):
            print(f"  [{i+1}] {c.get('name')} ({c.get('party')})")
    else:
        print(f"\n[NG] 파싱 실패 - 후보자 데이터 없음")
else:
    print("\n[NG] Gemini 응답 없음")

print("\n" + "=" * 70)
