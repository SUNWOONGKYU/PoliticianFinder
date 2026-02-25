#!/usr/bin/env python3
"""
전국 광역단체장 & 기초단체장 후보 수집 프로그램
여론조사 기준 상위 1~4위 후보의 기본정보 수집 및 DB 저장

사용법:
    python collect_all_candidates_nationwide.py [--metro-only] [--basic-only]
"""

import subprocess, json, os, sys, time, re, tempfile, uuid
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

# 경로 설정
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
V40_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))
INSTRUCTIONS_DIR = os.path.join(V40_DIR, "instructions", "1_politicians")
OUTPUT_DIR = os.path.join(V40_DIR, "reports")
os.makedirs(INSTRUCTIONS_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 환경 설정
load_dotenv(os.path.join(V40_DIR, ".env"))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 17개 광역시도
METRO_REGIONS = [
    "서울특별시", "부산광역시", "대구광역시", "인천광역시",
    "광주광역시", "대전광역시", "울산광역시", "세종특별자치시",
    "경기도", "강원특별자치도", "충청북도", "충청남도",
    "전북특별자치도", "전라남도", "경상북도", "경상남도", "제주특별자치도"
]

# 기초자치단체 (시도별 그룹)
BASIC_REGIONS = {
    "서울특별시": [
        "종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구",
        "성북구", "강북구", "도봉구", "노원구", "은평구", "서대문구", "마포구",
        "양천구", "강서구", "구로구", "금천구", "영등포구", "동작구", "관악구",
        "서초구", "강남구", "송파구", "강동구"
    ],
    "부산광역시": [
        "중구", "서구", "동구", "영도구", "부산진구", "동래구", "남구", "북구",
        "해운대구", "사하구", "금정구", "강서구", "연제구", "수영구", "사상구", "기장군"
    ],
    "대구광역시": [
        "중구", "동구", "서구", "남구", "북구", "수성구", "달서구", "달성군", "군위군"
    ],
    "인천광역시": [
        "중구", "동구", "미추홀구", "연수구", "남동구", "부평구", "계양구",
        "서구", "강화군", "옹진군"
    ],
    "광주광역시": ["동구", "서구", "남구", "북구", "광산구"],
    "대전광역시": ["동구", "중구", "서구", "유성구", "대덕구"],
    "울산광역시": ["중구", "남구", "동구", "북구", "울주군"],
    "세종특별자치시": ["세종시"],
    "경기도": [
        "수원시", "성남시", "의정부시", "안양시", "부천시", "광명시", "평택시",
        "동두천시", "안산시", "고양시", "과천시", "구리시", "남양주시", "오산시",
        "시흥시", "군포시", "의왕시", "하남시", "용인시", "파주시", "이천시",
        "안성시", "김포시", "화성시", "광주시", "양주시", "포천시", "여주시",
        "연천군", "가평군", "양평군"
    ],
    "강원특별자치도": [
        "춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시",
        "홍천군", "횡성군", "영월군", "평창군", "정선군", "철원군", "화천군",
        "양구군", "인제군", "고성군", "양양군"
    ],
    "충청북도": [
        "청주시", "충주시", "제천시", "보은군", "옥천군", "영동군",
        "증평군", "진천군", "괴산군", "음성군", "단양군"
    ],
    "충청남도": [
        "천안시", "공주시", "보령시", "아산시", "서산시", "논산시", "계룡시",
        "당진시", "금산군", "부여군", "서천군", "청양군", "홍성군", "예산군", "태안군"
    ],
    "전북특별자치도": [
        "전주시", "군산시", "익산시", "정읍시", "남원시", "김제시",
        "완주군", "진안군", "무주군", "장수군", "임실군", "순창군",
        "고창군", "부안군"
    ],
    "전라남도": [
        "목포시", "여수시", "순천시", "나주시", "광양시",
        "담양군", "곡성군", "구례군", "고흥군", "보성군", "화순군", "장흥군",
        "강진군", "해남군", "영암군", "무안군", "함평군", "영광군", "장성군",
        "완도군", "진도군", "신안군"
    ],
    "경상북도": [
        "포항시", "경주시", "김천시", "안동시", "구미시", "영주시", "영천시",
        "상주시", "문경시", "경산시",
        "의성군", "청송군", "영양군", "영덕군", "청도군", "고령군",
        "성주군", "칠곡군", "예천군", "봉화군", "울진군", "울릉군"
    ],
    "경상남도": [
        "창원시", "진주시", "통영시", "사천시", "김해시", "밀양시",
        "거제시", "양산시",
        "의령군", "함안군", "창녕군", "고성군", "남해군", "하동군",
        "산청군", "함양군", "거창군", "합천군"
    ],
    "제주특별자치도": ["제주시", "서귀포시"]
}

def call_gemini_cli(prompt, timeout=120):
    """Gemini CLI 호출"""
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
            print(f"    Timeout with {model}, trying next...")
            try:
                os.unlink(tf_path)
            except:
                pass
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
        except json.JSONDecodeError:
            pass

    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        pass

    return []

def collect_metro_candidates(region):
    """광역단체장 후보 수집"""
    prompt = f"""대한민국 {region} 지방선거(2026년 6월) 광역단체장(시도지사) 선거에서
여론조사 기준으로 가장 유력한 후보 4명을 선정해주세요.

반드시 다음 JSON 형식으로만 답변하세요:
```json
[
  {{
    "name": "홍길동",
    "party": "국민의힘",
    "position": "현직 지위 또는 직책",
    "poll_rank": 1,
    "poll_support": "35%",
    "birth_date": "1970-01-15",
    "gender": "male",
    "career": ["경력1", "경력2", "경력3", "경력4", "경력5"],
    "previous_position": "전 직책"
  }}
]
```

주의:
- 실제 존재하는 후보만
- 여론조사 상위 1~4위 순서대로
- 완전한 정보만"""

    print(f"    Querying {region}...")
    response = call_gemini_cli(prompt, timeout=180)
    if not response:
        return []

    return parse_candidates(response)

def collect_basic_candidates(sido, district):
    """기초단체장 후보 수집"""
    prompt = f"""대한민국 {sido} {district} 지방선거(2026년 6월) 기초단체장({district}시장/군수/구청장) 선거에서
여론조사 기준으로 가장 유력한 후보 4명을 선정해주세요.

반드시 다음 JSON 형식으로만 답변하세요:
```json
[
  {{
    "name": "홍길동",
    "party": "국민의힘",
    "position": "현직 지위 또는 직책",
    "poll_rank": 1,
    "poll_support": "35%",
    "birth_date": "1970-01-15",
    "gender": "male",
    "career": ["경력1", "경력2", "경력3", "경력4", "경력5"],
    "previous_position": "전 직책"
  }}
]
```

주의:
- 실제 존재하는 후보만
- 여론조사 상위 1~4위 순서대로
- 완전한 정보만"""

    response = call_gemini_cli(prompt, timeout=120)
    if not response:
        return []

    return parse_candidates(response)

def save_to_db(candidates, region, region_type):
    """DB에 저장"""
    saved_count = 0
    for candidate in candidates:
        try:
            # 고유 ID 생성
            politician_id = str(uuid.uuid4())[:8]

            # 필수 필드 구성
            data = {
                "id": politician_id,
                "name": candidate.get("name", ""),
                "party": candidate.get("party", ""),
                "position": candidate.get("position", ""),
                "previous_position": candidate.get("previous_position", ""),
                "region": region if region_type == "metro" else region.split()[0],
                "district": region if region_type == "basic" else "",
                "birth_date": candidate.get("birth_date", ""),
                "gender": candidate.get("gender", "male"),
                "identity": "현직" if "현직" in candidate.get("position", "") else "출마예정자",
                "title": "광역단체장" if region_type == "metro" else "기초단체장",
                "career": candidate.get("career", [])
            }

            # DB 저장
            result = supabase.table("politicians").insert(data).execute()
            saved_count += 1

            # MD 파일 생성
            create_md_file(data)

        except Exception as e:
            print(f"      ERROR saving {candidate.get('name', 'Unknown')}: {str(e)[:100]}")

    return saved_count

def create_md_file(politician_data):
    """MD 파일 생성"""
    name = politician_data["name"]
    filepath = os.path.join(INSTRUCTIONS_DIR, f"{name}.md")

    # 이미 존재하면 스킵
    if os.path.exists(filepath):
        return

    content = f"""# 정치인 정보 - {name}

---

## 기본 정보

| 필드 | 값 |
|------|-----|
| **politician_id** | {politician_data['id']} |
| **성명** | {name} |
| **현 직책** | {politician_data.get('position', '')} |
| **소속 정당** | {politician_data.get('party', '')} |
| **출마 직종** | {politician_data.get('title', '')} |
| **지역** | {politician_data.get('region', '')} |
| **지역구** | {politician_data.get('district', '')} |
| **성별** | {politician_data.get('gender', '')} |
| **생년월일** | {politician_data.get('birth_date', '')} |

---

**V40 정치인 정보 - {name}**
**작성일**: {datetime.now().strftime('%Y-%m-%d')}
"""

    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
    except Exception as e:
        print(f"      ERROR creating MD for {name}: {str(e)[:100]}")

def main():
    print("=" * 70)
    print("전국 광역/기초단체장 후보 수집 프로그램 (여론조사 기준 상위 1~4위)")
    print("=" * 70)

    total_saved = 0
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Phase 1: 광역단체장 (17개)
    print("\n[PHASE 1] 광역단체장 후보 수집 (17개 지역)")
    print("-" * 70)
    metro_candidates = []
    for i, region in enumerate(METRO_REGIONS):
        print(f"  [{i+1}/17] {region}")
        candidates = collect_metro_candidates(region)
        if candidates:
            saved = save_to_db(candidates, region, "metro")
            total_saved += saved
            metro_candidates.extend(candidates)
            print(f"    -> {saved}명 저장")
        time.sleep(5)  # Rate limit 방지

    print(f"\n광역단체장: {total_saved}명 저장")

    # Phase 2: 기초단체장 (226개)
    print("\n[PHASE 2] 기초단체장 후보 수집 (226개 지역)")
    print("-" * 70)
    basic_count = 0
    for sido_idx, (sido, districts) in enumerate(BASIC_REGIONS.items()):
        print(f"  [{sido_idx+1}/{len(BASIC_REGIONS)}] {sido} ({len(districts)}개 지역)")
        sido_saved = 0
        for dist_idx, district in enumerate(districts):
            candidates = collect_basic_candidates(sido, district)
            if candidates:
                saved = save_to_db(candidates, f"{sido} {district}", "basic")
                total_saved += saved
                sido_saved += saved
                basic_count += len(candidates)

            # 지역마다 대기 (Rate limit 방지)
            if (dist_idx + 1) % 5 == 0:
                time.sleep(3)

        print(f"    -> {sido_saved}명 저장")
        time.sleep(10)  # 시도별 대기

    print(f"\n기초단체장: {basic_count // 4 if basic_count > 0 else 0}개 지역 수집")

    # 최종 보고
    print("\n" + "=" * 70)
    print(f"수집 완료!")
    print(f"총 저장: {total_saved}명")
    print(f"저장 위치: {INSTRUCTIONS_DIR}/")
    print("=" * 70)

if __name__ == "__main__":
    main()
