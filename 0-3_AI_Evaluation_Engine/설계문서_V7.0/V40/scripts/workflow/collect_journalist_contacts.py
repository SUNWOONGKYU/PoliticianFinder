#!/usr/bin/env python3
"""
언론사 정치부 기자 이메일 수집 스크립트
Gemini CLI를 사용하여 지역별 주요 언론사 정치부 기자 연락처 수집

사용법:
  python collect_journalist_contacts.py --type 광역
  python collect_journalist_contacts.py --type 기초
  python collect_journalist_contacts.py --type 전체
"""

import subprocess
import json
import csv
import os
import sys
import time
import re
import argparse
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
V40_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))
OUTPUT_DIR = os.path.join(V40_DIR, "reports")
os.makedirs(OUTPUT_DIR, exist_ok=True)

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
        "해운대구", "사하구", "금정구", "강서구", "연제구", "수영구", "사상구",
        "기장군"
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
    """Gemini CLI 호출 (3단계 fallback, shell=True for npm PATH)"""
    models = ["gemini-2.5-flash", "gemini-2.0-flash"]

    for model in models:
        try:
            # shell=True: npm global PATH에서 gemini를 찾기 위해 필요
            # prompt를 파일로 전달하여 shell escaping 문제 회피
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as tf:
                tf.write(prompt)
                tf_path = tf.name

            cmd = f'cat "{tf_path}" | gemini -m {model}'
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                timeout=timeout
            )
            os.unlink(tf_path)

            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.decode('utf-8', errors='replace').strip()
        except subprocess.TimeoutExpired:
            print(f"  Timeout with {model}, trying next...")
            try:
                os.unlink(tf_path)
            except:
                pass
            continue
        except FileNotFoundError:
            print("  ERROR: gemini CLI not found in PATH")
            return None

    # REST API fallback
    try:
        from dotenv import load_dotenv
        load_dotenv(os.path.join(V40_DIR, ".env"))
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            import urllib.request
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
            payload = json.dumps({
                "contents": [{"parts": [{"text": prompt}]}]
            })
            req = urllib.request.Request(url, data=payload.encode(), headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read())
                return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        print(f"  REST API fallback failed: {e}")

    return None


def parse_journalist_data(response_text):
    """Gemini 응답에서 기자 데이터 파싱"""
    # Try JSON extraction first
    json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response_text)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # Try direct JSON
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        pass

    # Return raw text for manual parsing
    return {"raw": response_text}


def collect_metro_region(region):
    """광역시도 1개에 대한 기자 수집"""
    prompt = f"""대한민국 {region} 지역의 정치 보도를 하는 주요 언론사 5곳(유명한 순서)과
각 언론사의 정치부 기자 2명의 이름과 업무용 이메일 주소를 알려주세요.

반드시 다음 JSON 형식으로만 답변하세요 (다른 텍스트 없이):
```json
[
  {{
    "언론사": "OO일보",
    "기자1_이름": "홍길동",
    "기자1_이메일": "hong@example.com",
    "기자2_이름": "김철수",
    "기자2_이메일": "kim@example.com"
  }}
]
```

주의사항:
- 실제로 존재하는 기자와 실제 이메일만 답변해주세요
- 확인할 수 없으면 "확인불가"라고 적어주세요
- 지역 언론사 + 전국 언론사 혼합 가능
- {region} 지역 정치를 집중 보도하는 언론사 우선"""

    print(f"  Querying Gemini for {region}...")
    response = call_gemini_cli(prompt)
    if not response:
        print(f"  WARNING: No response for {region}")
        return []

    data = parse_journalist_data(response)

    if isinstance(data, list):
        for item in data:
            item["지역"] = region
            item["구분"] = "광역"
        return data
    elif isinstance(data, dict) and "raw" in data:
        print(f"  WARNING: Could not parse JSON for {region}, saving raw")
        return [{"지역": region, "구분": "광역", "raw": data["raw"]}]
    else:
        return [{"지역": region, "구분": "광역", "raw": str(data)}]


def collect_basic_regions_batch(sido, districts):
    """기초자치단체 배치 수집 (시도 단위)"""
    district_list = ", ".join(districts)
    prompt = f"""대한민국 {sido}의 기초자치단체({district_list}) 각각에 대해:
해당 지역 정치 보도를 하는 주요 언론사 5곳(유명한 순서)과
각 언론사의 정치부 기자 2명의 이름과 업무용 이메일을 알려주세요.

반드시 다음 JSON 형식으로만 답변하세요:
```json
[
  {{
    "지역": "OO시/구/군",
    "언론사": "OO일보",
    "기자1_이름": "홍길동",
    "기자1_이메일": "hong@example.com",
    "기자2_이름": "김철수",
    "기자2_이메일": "kim@example.com"
  }}
]
```

주의사항:
- 실제로 존재하는 기자와 실제 이메일만 답변
- 확인 불가하면 "확인불가"라고 적기
- 지역 언론사(OO일보, OO신문) + 전국 언론사 혼합 가능
- 해당 기초자치단체 정치를 보도하는 언론사 우선"""

    print(f"  Querying Gemini for {sido} ({len(districts)} districts)...")
    response = call_gemini_cli(prompt, timeout=180)
    if not response:
        print(f"  WARNING: No response for {sido}")
        return []

    data = parse_journalist_data(response)

    results = []
    if isinstance(data, list):
        for item in data:
            item["구분"] = "기초"
            if "지역" not in item:
                item["지역"] = sido
            results.append(item)
    elif isinstance(data, dict) and "raw" in data:
        print(f"  WARNING: Could not parse JSON for {sido}, saving raw")
        results.append({"지역": sido, "구분": "기초", "raw": data["raw"]})
    else:
        results.append({"지역": sido, "구분": "기초", "raw": str(data)})

    return results


def save_to_csv(all_data, filename):
    """CSV 파일로 저장"""
    filepath = os.path.join(OUTPUT_DIR, filename)
    fieldnames = ["구분", "지역", "언론사", "기자1_이름", "기자1_이메일", "기자2_이름", "기자2_이메일", "raw"]

    with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for row in all_data:
            writer.writerow(row)

    print(f"\nSaved: {filepath} ({len(all_data)} rows)")
    return filepath


def save_to_json(all_data, filename):
    """JSON 파일로 저장"""
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    print(f"Saved: {filepath}")
    return filepath


def main():
    parser = argparse.ArgumentParser(description="언론사 정치부 기자 이메일 수집")
    parser.add_argument("--type", choices=["광역", "기초", "전체"], default="전체",
                        help="수집 범위 (광역/기초/전체)")
    args = parser.parse_args()

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    all_data = []

    # 광역단체장
    if args.type in ("광역", "전체"):
        print("=" * 60)
        print("광역단체장 지역별 언론사 기자 수집")
        print("=" * 60)
        for i, region in enumerate(METRO_REGIONS):
            print(f"\n[{i+1}/{len(METRO_REGIONS)}] {region}")
            results = collect_metro_region(region)
            all_data.extend(results)
            print(f"  -> {len(results)} outlets collected")
            if i < len(METRO_REGIONS) - 1:
                time.sleep(3)

        # 중간 저장
        save_to_csv(all_data, f"기자연락처_광역_{timestamp}.csv")
        save_to_json(all_data, f"기자연락처_광역_{timestamp}.json")

    # 기초단체장
    if args.type in ("기초", "전체"):
        print("\n" + "=" * 60)
        print("기초단체장 지역별 언론사 기자 수집")
        print("=" * 60)
        basic_data = []
        for i, (sido, districts) in enumerate(BASIC_REGIONS.items()):
            print(f"\n[{i+1}/{len(BASIC_REGIONS)}] {sido} ({len(districts)}개 시군구)")
            results = collect_basic_regions_batch(sido, districts)
            basic_data.extend(results)
            all_data.extend(results)
            print(f"  -> {len(results)} entries collected")
            if i < len(BASIC_REGIONS) - 1:
                time.sleep(5)

        save_to_csv(basic_data, f"기자연락처_기초_{timestamp}.csv")
        save_to_json(basic_data, f"기자연락처_기초_{timestamp}.json")

    # 전체 통합 저장
    if args.type == "전체":
        save_to_csv(all_data, f"기자연락처_전체_{timestamp}.csv")
        save_to_json(all_data, f"기자연락처_전체_{timestamp}.json")

    print("\n" + "=" * 60)
    print(f"수집 완료! 총 {len(all_data)} entries")
    print(f"저장 위치: {OUTPUT_DIR}/")
    print("=" * 60)


if __name__ == "__main__":
    main()
