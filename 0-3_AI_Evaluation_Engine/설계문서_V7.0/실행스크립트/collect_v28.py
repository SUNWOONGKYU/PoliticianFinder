# -*- coding: utf-8 -*-
"""
V28 수집/검증/재수집 통합 스크립트

핵심 변경 (V28):
1. PUBLIC 기간: 1년 → 2년 확대
2. 수집/평가 분리: 수집 AI ≠ 평가 AI
3. 부정 주제 20% 의무화: 반드시 부정적 내용만 수집

V28 추가 (검증/재수집 통합):
4. 검증 단계: URL 실제 존재 확인, source_type 규칙 검증
5. 재수집 단계: 검증 실패분 자동 재수집

프로세스:
[1] 수집 (collect): 각 AI가 50개 수집
[2] 검증 (validate): URL 확인, source_type 검증
[3] 재수집 (recollect): 검증 실패분 재수집
[4] 평가는 evaluate_v28.py에서 다른 AI가 수행

사용법:
    # 전체 파이프라인 (수집→검증→재수집)
    python collect_v28.py --politician_id=62e7b453 --politician_name="오세훈" --mode=all

    # 수집만
    python collect_v28.py --politician_id=62e7b453 --politician_name="오세훈" --mode=collect

    # 검증만
    python collect_v28.py --politician_id=62e7b453 --politician_name="오세훈" --mode=validate

    # 재수집만
    python collect_v28.py --politician_id=62e7b453 --politician_name="오세훈" --mode=recollect

    # 특정 AI만 실행
    python collect_v28.py --politician_id=62e7b453 --politician_name="오세훈" --ai=Claude --mode=all

    # 병렬 실행
    python collect_v28.py --politician_id=62e7b453 --politician_name="오세훈" --parallel --mode=all
"""

import os
import sys
import json
import re
import argparse
import time
import requests  # V28: URL 검증용
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from supabase import create_client
from dotenv import load_dotenv
from json_repair import repair_json  # Claude JSON 파싱 문제 해결용

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드 (override=True로 .env 우선)
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# V28 테이블명
TABLE_COLLECTED_DATA = "collected_data_v28"

# AI 클라이언트 (필요 시 초기화)
ai_clients = {}

# 카테고리 정의
CATEGORIES = [
    ("Expertise", "전문성"),
    ("Leadership", "리더십"),
    ("Vision", "비전"),
    ("Integrity", "청렴성"),
    ("Ethics", "윤리성"),
    ("Accountability", "책임성"),
    ("Transparency", "투명성"),
    ("Communication", "소통능력"),
    ("Responsiveness", "대응성"),
    ("PublicInterest", "공익성")
]

# AI 모델 설정
AI_CONFIGS = {
    "Claude": {
        "model": "claude-3-5-haiku-20241022",
        "env_key": "ANTHROPIC_API_KEY"
    },
    "ChatGPT": {
        "model": "gpt-4o-mini",
        "env_key": "OPENAI_API_KEY"
    },
    "Grok": {
        "model": "grok-4-fast",
        "env_key": "XAI_API_KEY"
    },
    "Gemini": {
        "model": "gemini-2.0-flash",
        "env_key": "GEMINI_API_KEY"
    }
}


def get_exact_count(table_name, filters=None):
    """
    정확한 개수 조회 (Supabase 기본 limit 1000 문제 방지)

    ⚠️ 중요: Supabase select()는 기본 1000개만 반환
    → count='exact' 옵션 필수!

    사용법:
        count = get_exact_count('collected_data_v28', {
            'politician_id': 'f9e00370',
            'ai_name': 'Claude'
        })
    """
    try:
        query = supabase.table(table_name).select('*', count='exact')
        if filters:
            for key, value in filters.items():
                if value is not None:
                    query = query.eq(key, value)
        response = query.limit(1).execute()  # 데이터는 1개만, count만 사용
        return response.count if response.count else 0
    except Exception as e:
        print(f"  ⚠️ count 조회 실패: {e}")
        return 0


def check_politician_exists(politician_id):
    """정치인 ID 사전 등록 확인 (필수!)"""
    try:
        result = supabase.table('politicians').select('id, name').eq('id', politician_id).execute()
        if result.data and len(result.data) > 0:
            return True, result.data[0].get('name', '')
        return False, None
    except Exception as e:
        print(f"❌ 정치인 확인 에러: {e}")
        return False, None


def init_ai_client(ai_name):
    """AI 클라이언트 초기화"""
    global ai_clients

    if ai_name in ai_clients:
        return ai_clients[ai_name]

    config = AI_CONFIGS.get(ai_name)
    if not config:
        raise ValueError(f"알 수 없는 AI: {ai_name}")

    api_key = os.getenv(config['env_key'])
    if not api_key:
        raise ValueError(f"{config['env_key']} 환경변수가 설정되지 않았습니다.")

    if ai_name == "Claude":
        import anthropic
        ai_clients[ai_name] = anthropic.Anthropic(api_key=api_key)
    elif ai_name == "ChatGPT":
        from openai import OpenAI
        ai_clients[ai_name] = OpenAI(api_key=api_key)
    elif ai_name == "Grok":
        from openai import OpenAI
        ai_clients[ai_name] = OpenAI(
            api_key=api_key,
            base_url="https://api.x.ai/v1"
        )
    elif ai_name == "Gemini":
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        ai_clients[ai_name] = genai.GenerativeModel(config['model'])

    return ai_clients[ai_name]


def get_date_range():
    """V28 기간 제한 계산 (PUBLIC 2년으로 확대)"""
    evaluation_date = datetime.now()
    official_start = evaluation_date - timedelta(days=365*4)
    public_start = evaluation_date - timedelta(days=365*2)  # V28: 1년 → 2년

    return {
        'evaluation_date': evaluation_date.strftime('%Y-%m-%d'),
        'official_start': official_start.strftime('%Y-%m-%d'),
        'official_end': evaluation_date.strftime('%Y-%m-%d'),
        'public_start': public_start.strftime('%Y-%m-%d'),
        'public_end': evaluation_date.strftime('%Y-%m-%d'),
    }


def get_category_description(category_num):
    """카테고리 설명 반환"""
    descriptions = {
        1: """전문성 (Expertise)
【영문 정의】The level of knowledge, skills, and experience required to perform duties effectively
【한글 정의】정책 전문성, 행정 경험, 분야별 전문 지식
[O] 해당: 정책 수립 능력, 전문 지식, 학력/경력, 행정 경험, 법안 발의
[X] 비해당: 조직 관리(리더십), 혁신 아이디어(비전), 약속 이행(책임성)""",

        2: """리더십 (Leadership)
【영문 정의】The ability to effectively lead organizations and people to achieve goals
【한글 정의】조직 관리 능력, 위기 대응, 의사결정 능력
[O] 해당: 조직 관리, 위기 대응, 갈등 조정, 당내 리더십
[X] 비해당: 정책 전문성(전문성), 장기 계획(비전)""",

        3: """비전 (Vision)
【영문 정의】The ability to predict the future and present long-term goals
【한글 정의】장기적 계획, 혁신성, 미래 전망
[O] 해당: 장기 발전 계획, 미래 전략, 혁신 정책, 개혁 의지
[X] 비해당: 현재 정책 능력(전문성), 조직 혁신(리더십)""",

        4: """청렴성 (Integrity)
【영문 정의】The quality of not engaging in financial or material corruption
【한글 정의】부패 방지, 윤리 준수, 이해충돌 회피
[O] 해당: 금품/뇌물 수수, 횡령, 배임, 비리, 이해충돌, 불법 정치자금
[X] 비해당: 정치적 중립성(책임성), 정치적 편향성(윤리성)""",

        5: """윤리성 (Ethics)
【영문 정의】The quality of maintaining social norms and moral dignity
【한글 정의】도덕성, 사회적 책임, 공정성
[O] 해당: 도덕성, 인격, 공정성, 인권 존중, 발언의 적절성
[X] 비해당: 금품 수수(청렴성), 공약 불이행(책임성)""",

        6: """책임성 (Accountability)
【영문 정의】The quality of taking responsibility for promises and performance
【한글 정의】약속 이행, 성과 책임, 투명한 보고
[O] 해당: 공약 이행, 성과 책임, 잘못 인정, 정치적 책임
[X] 비해당: 부패/비리(청렴성), 정보 공개(투명성)""",

        7: """투명성 (Transparency)
【영문 정의】The quality of disclosing information and decision-making processes
【한글 정의】정보 공개, 소통 개방성, 설명 책임
[O] 해당: 정보 공개, 의사결정 과정 공개, 정치자금 공개
[X] 비해당: 금품 수수(청렴성), SNS 소통(소통능력)""",

        8: """소통능력 (Communication)
【영문 정의】The ability to effectively convey messages to citizens
【한글 정의】시민 소통, 언론 대응, 정책 홍보
[O] 해당: 시민 소통, 언론 대응, SNS 활용, 의견 수렴
[X] 비해당: 정보 공개(투명성), 민원 처리(대응성)""",

        9: """대응성 (Responsiveness)
【영문 정의】The ability to respond quickly and appropriately to citizens' needs
【한글 정의】민원 대응, 신속한 조치, 현장 중심
[O] 해당: 민원 처리, 신속한 조치, 현장 방문, 위기 대응 속도
[X] 비해당: 위기 관리 능력(리더십), 정책 소통(소통능력)""",

        10: """공익성 (PublicInterest)
【영문 정의】The attitude of prioritizing public interest over private interest
【한글 정의】공공 이익 우선, 사회적 형평성, 약자 보호
[O] 해당: 공공 이익 우선, 약자/소외계층 보호, 복지 정책
[X] 비해당: 사적 이익 추구(청렴성), 정책 전문성(전문성)"""
    }
    return descriptions.get(category_num, "")


def get_politician_profile(politician_id):
    """DB에서 정치인 프로필 조회"""
    try:
        result = supabase.table('politicians').select('*').eq('id', politician_id).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]
    except Exception as e:
        print(f"  ⚠️ 프로필 조회 실패: {e}")
    return None


def get_politician_instructions(politician_name):
    """정치인별 특별 지시사항 파일 읽기"""
    # 스크립트 위치 기준으로 경로 계산
    script_dir = os.path.dirname(os.path.abspath(__file__))
    instructions_path = os.path.join(
        script_dir, '..', 'instructions_v28', '1_politicians', f'{politician_name}.md'
    )

    try:
        if os.path.exists(instructions_path):
            with open(instructions_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # 특별 지시사항 섹션만 추출
            instructions_text = ""

            # 수집 시 주의점 추출
            if "### 수집 시 주의점" in content:
                start = content.find("### 수집 시 주의점")
                end = content.find("###", start + 10)
                if end == -1:
                    end = content.find("---", start)
                if end > start:
                    section = content[start:end].strip()
                    instructions_text += section + "\n\n"

            # 알려진 논란/이슈 추출
            if "### 알려진 논란/이슈" in content:
                start = content.find("### 알려진 논란/이슈")
                end = content.find("###", start + 10)
                if end == -1:
                    end = content.find("---", start)
                if end > start:
                    section = content[start:end].strip()
                    instructions_text += section + "\n\n"

            # 알려진 성과 추출
            if "### 알려진 성과" in content:
                start = content.find("### 알려진 성과")
                end = content.find("###", start + 10)
                if end == -1:
                    end = content.find("---", start)
                if end > start:
                    section = content[start:end].strip()
                    instructions_text += section + "\n\n"

            # ⚠️ 수집 제외 주제 추출 (V28 - CRITICAL!)
            if "## ⚠️ 수집 제외 주제" in content:
                start = content.find("## ⚠️ 수집 제외 주제")
                # "---" 또는 "### 평가 시 주의점"까지 추출
                end = content.find("### 평가 시 주의점", start)
                if end == -1:
                    end = content.find("---", start)
                if end > start:
                    section = content[start:end].strip()
                    # 중요도 강조를 위해 맨 앞에 추가
                    instructions_text = section + "\n\n" + instructions_text

            # 출처 힌트 추출
            if "## 출처 힌트" in content:
                start = content.find("## 출처 힌트")
                end = content.find("---", start)
                if end > start:
                    section = content[start:end].strip()
                    instructions_text += section

            return instructions_text.strip() if instructions_text.strip() else None
    except Exception as e:
        print(f"  ⚠️ 지시사항 파일 읽기 실패: {e}")

    return None


def get_category_instructions(category_num):
    """
    카테고리별 수집 지침서에서 핵심 규칙 추출 (V28)

    2_collect/cat{num}_{name}.md 파일에서:
    - 8-1. 중복 수집 금지
    - 8-2. URL 규칙
    섹션을 추출하여 프롬프트에 포함
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # 카테고리 번호 → 파일명 매핑
    cat_files = {
        1: 'cat01_expertise.md',
        2: 'cat02_leadership.md',
        3: 'cat03_vision.md',
        4: 'cat04_integrity.md',
        5: 'cat05_ethics.md',
        6: 'cat06_accountability.md',
        7: 'cat07_transparency.md',
        8: 'cat08_communication.md',
        9: 'cat09_responsiveness.md',
        10: 'cat10_publicinterest.md'
    }

    filename = cat_files.get(category_num)
    if not filename:
        return None

    instructions_path = os.path.join(
        script_dir, '..', 'instructions_v28', '2_collect', filename
    )

    try:
        if os.path.exists(instructions_path):
            with open(instructions_path, 'r', encoding='utf-8') as f:
                content = f.read()

            rules_text = ""

            # 8-1. 중복 수집 금지 섹션 추출
            if "## 8-1. 중복 수집 금지" in content:
                start = content.find("## 8-1. 중복 수집 금지")
                end = content.find("## 8-2.", start)
                if end == -1:
                    end = content.find("## 9.", start)
                if end > start:
                    section = content[start:end].strip()
                    rules_text += section + "\n\n"

            # 8-2. URL 규칙 섹션 추출
            if "## 8-2. URL 규칙" in content:
                start = content.find("## 8-2. URL 규칙")
                end = content.find("## 9.", start)
                if end == -1:
                    end = content.find("---", start)
                if end > start:
                    section = content[start:end].strip()
                    rules_text += section

            return rules_text.strip() if rules_text.strip() else None
    except Exception as e:
        print(f"  ⚠️ 카테고리 지침 파일 읽기 실패: {e}")

    return None


def format_politician_profile(politician_id, politician_name):
    """정치인 프로필을 프롬프트용 텍스트로 포맷 (특별 지시사항 포함)"""
    profile = get_politician_profile(politician_id)
    instructions = get_politician_instructions(politician_name)

    if not profile:
        base_text = f"**대상 정치인**: {politician_name}"
    else:
        base_text = f"""**대상 정치인**: {politician_name}

**정치인 기본 정보** (동명이인 주의):
- 이름: {profile.get('name', politician_name)}
- 신분: {profile.get('identity', 'N/A')}
- 직책: {profile.get('title', profile.get('position', 'N/A'))}
- 정당: {profile.get('party', 'N/A')}
- 지역: {profile.get('region', 'N/A')}
- 성별: {profile.get('gender', 'N/A')}

⚠️ **중요**: 반드시 위 정보와 일치하는 "{politician_name}"의 데이터만 수집하세요."""

    # 특별 지시사항 추가
    if instructions:
        base_text += f"""

---
📋 **{politician_name} 특별 지시사항**:

{instructions}
---"""

    return base_text


def extract_json(content):
    """다양한 방식으로 JSON 추출 시도 (Claude JSON 파싱 문제 해결 - json_repair 사용)"""
    if not content or not content.strip():
        return None

    content = content.strip()
    json_str = None

    # 방법 1: ```json 블록
    json_match = re.search(r'```json\s*([\s\S]*?)\s*```', content)
    if json_match:
        json_str = json_match.group(1).strip()
    else:
        # 방법 2: ``` 블록 (언어 명시 없음)
        code_match = re.search(r'```\s*([\s\S]*?)\s*```', content)
        if code_match:
            json_str = code_match.group(1).strip()
        else:
            # 방법 3: { } 직접 추출 (가장 바깥 중괄호)
            brace_match = re.search(r'\{[\s\S]*\}', content)
            if brace_match:
                json_str = brace_match.group(0)
            else:
                json_str = content

    # 방법 4: json_repair로 자동 수정 (Claude JSON 문제 완전 해결)
    # - trailing comma 제거
    # - 누락된 comma 추가
    # - 기타 JSON 문법 오류 수정
    if json_str:
        try:
            json_str = repair_json(json_str)
        except Exception:
            # repair 실패 시 기존 방식으로 폴백
            json_str = re.sub(r',\s*([}\]])', r'\1', json_str)

    return json_str


def call_ai_api(ai_name, prompt):
    """AI API 호출 (Claude JSON 문제 해결 적용)"""
    client = init_ai_client(ai_name)
    config = AI_CONFIGS[ai_name]

    try:
        if ai_name == "Claude":
            # Claude 3.5 Haiku - 다른 AI와 동일한 설정으로 변경
            # temperature 1.0 = 더 창의적/다양한 응답
            # 시스템 프롬프트 제거 = 제한 없이 응답
            response = client.messages.create(
                model=config['model'],
                max_tokens=8000,
                temperature=1.0,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text

        elif ai_name in ["ChatGPT", "Grok"]:
            response = client.chat.completions.create(
                model=config['model'],
                max_tokens=8000,
                temperature=1.0,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content

        elif ai_name == "Gemini":
            response = client.generate_content(
                prompt,
                generation_config={
                    'temperature': 1.0,
                    'max_output_tokens': 8000,
                }
            )
            return response.text

    except Exception as e:
        raise e


def collect_and_evaluate_batch(politician_id, politician_name, ai_name, category_num,
                               source_type, is_negative=False, count=5):
    """
    V27.0: 수집 + 평가 통합 (rating 포함)

    각 AI가 자기가 수집한 데이터를 직접 평가
    """
    cat_eng, cat_kor = CATEGORIES[category_num - 1]
    source_desc = "언론 보도" if source_type == "PUBLIC" else "공공기록/공식자료"
    topic_type = "부정 주제" if is_negative else "자유 평가"
    dates = get_date_range()

    print(f"    [{ai_name}] {topic_type} {count}개 - {source_desc}")

    cat_desc = get_category_description(category_num)
    profile_info = format_politician_profile(politician_id, politician_name)
    category_rules = get_category_instructions(category_num)  # V28: 카테고리별 규칙 로드

    # 기간 제한을 더 강조
    if source_type == "OFFICIAL":
        date_range = f"{dates['official_start']} ~ {dates['official_end']}"
        date_years = "4년"
    else:
        date_range = f"{dates['public_start']} ~ {dates['public_end']}"
        date_years = "2년"

    date_restriction = f"""
████████████████████████████████████████████████████████████
🚨🚨🚨 **기간 제한 - 반드시 준수!** 🚨🚨🚨
████████████████████████████████████████████████████████████

**{source_type} 데이터는 반드시 다음 기간 내에서만 수집:**

    📅 허용 기간: **{date_range}** (최근 {date_years})

❌ 이 기간 밖의 데이터는 **절대 수집 금지!**
❌ 기간 위반 시 해당 데이터는 **삭제 처리됨!**

████████████████████████████████████████████████████████████
"""

    # V28: 부정 주제 20% 의무화 + 수집만 (평가는 분리)
    if is_negative:
        collection_instruction = f"""
🚨 **[필수] 부정적 주제 수집 (20% 의무)** 🚨

⚠️ 이 요청은 반드시 **부정적인 내용**만 수집해야 합니다!

1. {politician_name}의 **부정적인 측면**만 {count}개 수집하세요:
   - 논란, 비판, 스캔들, 의혹, 실패
   - 문제점, 비리, 갈등, 반대 여론
   - 정책 실패, 공약 불이행, 부적절한 발언

2. **긍정적인 내용은 절대 포함하지 마세요!**
   - 성과, 업적, 칭찬 → ❌ 금지
   - 논란/비판/문제점만 → ✅ 허용

3. 부정적 내용을 찾기 어려우면:
   - 상대적으로 미흡한 부분
   - 비판받은 정책이나 결정
   - 반대 의견이 있었던 사안

**이 요청에서는 부정적 주제만 수집합니다. 평가는 나중에 별도로 진행됩니다.**
"""
    else:
        collection_instruction = """
**수집 방식 - 자유 수집 (80%)** ⚖️ 균형 필수!:

🚨🚨🚨 **균형 잡힌 수집 의무화** 🚨🚨🚨

**반드시 긍정:부정 = 50:50 비율로 수집!**

✅ **긍정적 내용 50% 필수** (업적, 성과, 칭찬, 기여, 발전):
   - 정책 성과, 입법 활동, 국정 운영 성과
   - 사회 기여, 협력, 합의, 문제 해결
   - 전문성 발휘, 리더십 인정, 호평

❌ **부정적 내용 50% 이하** (논란, 비판, 의혹, 실패):
   - 이미 부정 주제 20%가 별도 수집됨
   - 자유 수집에서 부정만 수집하면 안 됨!

⚠️ **부정적 뉴스만 수집 시 전체 응답 무효 처리!**

정치인의 실제 활동, 정책, 발언, 성과 등을 **균형 있게** 조사하세요.
**평가는 나중에 별도로 진행됩니다** (지금은 수집만)
"""

    # V28: 출처 유형별 규칙 (강화)
    if source_type == "OFFICIAL":
        source_url_rule = """**출처 규칙 (OFFICIAL 공식자료)**:
- source_url: 불필요 (빈 값 OK)
- data_source: 기관명 필수

📌 **OFFICIAL 출처 예시**:
- 지방자치단체: 구청, 군청, 시청, 도청 (예: "서초구청", "성동구청", "서울시", "경기도")
- 중앙기관: 국회, 중앙선거관리위원회, 감사원, 대법원, 헌법재판소
- 정부부처: 행정안전부, 기획재정부, 외교부, 국방부 등
- 공공기관: 한국은행, 금융감독원, 국민연금공단 등

🚨 **OFFICIAL에서 절대 사용 금지**:
- 나무위키, 위키피디아 (→ PUBLIC임)
- 언론사 (→ PUBLIC임)
- SNS (→ PUBLIC임)"""
    else:
        source_url_rule = """**출처 규칙 (PUBLIC 공개자료)**:

📌 **PUBLIC 출처 예시**:
1. **언론사** (URL 필수!):
   - 조선일보, 중앙일보, 동아일보, 한겨레, 경향신문
   - 연합뉴스, 뉴스1, 뉴시스, SBS, KBS, MBC, JTBC
   - 🚨 실제 존재하는 URL만! 가짜 URL 생성 절대 금지!

2. **위키** (URL 필수!):
   - 나무위키, 위키피디아
   - 🚨 실제 페이지 URL만!

3. **SNS** (URL 불필요):
   - 트위터, 페이스북, 유튜브, 인스타그램
   - data_source에 플랫폼명 기재

🚨 **PUBLIC에서 절대 사용 금지**:
- 구청, 군청, 시청, 국회 등 공식기관 (→ OFFICIAL임)
- URL을 모르는 언론 기사 (수집하지 마세요)"""

    # V28: 수집만 (평가는 분리 - 다른 AI가 나중에 평가)
    prompt = f"""당신은 정치인 관련 데이터를 수집하는 AI입니다.

{profile_info}

{date_restriction}

{collection_instruction}

**출처 유형**: {source_desc}
{source_url_rule}

**수집 카테고리**: {cat_kor} ({cat_eng})
{cat_desc}

**반드시 {count}개**의 데이터를 수집하세요. (평가는 나중에 별도로 진행)

⚠️ **필수 규칙**:
- "데이터 없음", "기록 없음", "증거 없음" 같은 항목은 절대 금지
- 반드시 **{count}개를 모두 수집** (적게 반환하지 마세요)
- **rating은 포함하지 마세요** (나중에 다른 AI가 평가)

🚨 **기간 엄수 (필수!)**:
- 지정된 기간 범위 외의 데이터는 **절대 수집 금지**
- 기간 외 데이터 수집 시 전체 응답 무효 처리됨

{category_rules if category_rules else '''🚨 **중복 금지 (필수!)**:
- **동일한 주제/사건은 최대 1개만** 수집
- 같은 사건을 다른 날짜/출처로 반복 수집 절대 금지

🚨 **URL 규칙 (필수!)**:
- **SNS**: URL 불필요
- **웹사이트 (언론, 위키 등)**: URL 필수
- 가짜 URL 생성 절대 금지'''}

다음 JSON 형식으로 반환:
```json
{{
  "items": [
    {{
      "item_num": 1,
      "data_title": "제목 (20자 이내)",
      "data_content": "내용 (100-300자, 사실 위주)",
      "data_source": "출처명 또는 기관명",
      "source_url": "실제 URL (웹사이트 기반 필수, SNS는 빈 값 가능)",
      "data_date": "YYYY-MM-DD"
    }}
  ]
}}
```
"""

    max_retries = 3
    for attempt in range(max_retries):
        try:
            time.sleep(1.5)
            content = call_ai_api(ai_name, prompt)

            # JSON 파싱 (extract_json 사용 - Claude 문제 해결)
            json_str = extract_json(content)
            if not json_str:
                raise json.JSONDecodeError("Empty response", "", 0)

            data = json.loads(json_str)
            items = data.get('items', [])

            # V28: 유효성 검증 (rating 없이 수집만)
            valid_items = []
            for item in items:
                # 필수 필드 확인 (rating 제외)
                if item.get('data_title') and item.get('data_content'):
                    item['source_type'] = source_type
                    item['rating'] = None  # V28: 수집 시 rating 없음 (나중에 평가)
                    valid_items.append(item)

            print(f"      → {len(valid_items)}개 수집 완료 (평가 대기)")
            return valid_items[:count]

        except json.JSONDecodeError as e:
            print(f"      ⚠️ JSON 파싱 에러: {e}")
            if attempt < max_retries - 1:
                time.sleep(3)
            continue
        except Exception as e:
            error_str = str(e)
            if "rate" in error_str.lower() or "429" in error_str:
                print(f"      ⚠️ Rate limit, 60초 대기...")
                time.sleep(60)
                continue
            print(f"      ❌ 에러: {e}")
            if attempt < max_retries - 1:
                time.sleep(5)
            continue

    return []


def get_max_item_num(politician_id, category_name, ai_name):
    """현재 DB에 저장된 최대 item_num 조회"""
    try:
        response = supabase.table(TABLE_COLLECTED_DATA).select('item_num').eq(
            'politician_id', politician_id
        ).eq('category_name', category_name).eq('ai_name', ai_name).order('item_num', desc=True).limit(1).execute()

        if response.data:
            return response.data[0]['item_num']
        return 0
    except Exception:
        return 0


def get_category_count(politician_id, category_name, ai_name):
    """현재 DB에 저장된 카테고리 데이터 개수 조회"""
    try:
        response = supabase.table(TABLE_COLLECTED_DATA).select('collected_data_id', count='exact').eq(
            'politician_id', politician_id
        ).eq('category_name', category_name).eq('ai_name', ai_name).execute()
        return response.count if response.count else 0
    except Exception:
        return 0


def save_to_db(politician_id, category_name, ai_name, items):
    """DB에 저장 (rating 포함)"""
    if not items:
        return 0

    start_num = get_max_item_num(politician_id, category_name, ai_name) + 1
    dates = get_date_range()
    saved = 0

    # V28: model_name 자동 추출
    model_name = AI_CONFIGS.get(ai_name, {}).get('model', '')

    for idx, item in enumerate(items):
        actual_item_num = start_num + idx

        try:
            data = {
                'politician_id': politician_id,
                'ai_name': ai_name,
                'model_name': model_name,  # V28: 모델명 추가
                'category_name': category_name,
                'item_num': actual_item_num,
                'data_title': item.get('data_title', ''),
                'data_content': item.get('data_content', ''),
                'data_source': item.get('data_source', ''),
                'source_url': item.get('source_url', ''),
                'source_type': item.get('source_type', ''),
                'data_date': item.get('data_date', ''),
                'collection_date': datetime.now().isoformat(),
                # V27: rating 포함
                'rating': item.get('rating'),
                'rating_rationale': item.get('rating_rationale', ''),
                'evaluation_date': datetime.now().isoformat(),
                # 메타데이터
                'collection_version': 'V28',
                'official_date_start': dates['official_start'],
                'official_date_end': dates['official_end'],
                'public_date_start': dates['public_start'],
                'public_date_end': dates['public_end'],
            }
            supabase.table(TABLE_COLLECTED_DATA).insert(data).execute()
            saved += 1
        except Exception as e:
            print(f"      ❌ DB 저장 실패: {e}")

    return saved


def collect_category(politician_id, politician_name, ai_name, category_num):
    """카테고리별 50개 수집+평가"""
    cat_eng, cat_kor = CATEGORIES[category_num - 1]
    MAX_ROUNDS = 5  # V27.1: 4번 → 5번으로 증가

    print(f"\n  [{ai_name}] 카테고리 {category_num}: {cat_kor}")

    current_count = get_category_count(politician_id, cat_eng, ai_name)
    if current_count >= 50:
        print(f"    ✅ 이미 {current_count}개 완료")
        return

    for round_num in range(1, MAX_ROUNDS + 1):
        current_count = get_category_count(politician_id, cat_eng, ai_name)
        needed = 50 - current_count

        if needed <= 0:
            print(f"    ✅ 50개 달성!")
            break

        print(f"    라운드 {round_num}/{MAX_ROUNDS}: 현재 {current_count}개, {needed}개 필요")

        round_items = []

        if round_num == 1:
            # Phase 1: 부정 주제 10개
            neg_official = collect_and_evaluate_batch(politician_id, politician_name, ai_name, category_num, 'OFFICIAL', True, 5)
            neg_public = collect_and_evaluate_batch(politician_id, politician_name, ai_name, category_num, 'PUBLIC', True, 5)
            round_items.extend(neg_official)
            round_items.extend(neg_public)

            # Phase 2: 자유 평가 40개
            free_official = collect_and_evaluate_batch(politician_id, politician_name, ai_name, category_num, 'OFFICIAL', False, 20)
            free_public = collect_and_evaluate_batch(politician_id, politician_name, ai_name, category_num, 'PUBLIC', False, 20)
            round_items.extend(free_official)
            round_items.extend(free_public)
        else:
            # 추가 수집
            half = needed // 2
            add_official = collect_and_evaluate_batch(politician_id, politician_name, ai_name, category_num, 'OFFICIAL', False, half + (needed % 2))
            add_public = collect_and_evaluate_batch(politician_id, politician_name, ai_name, category_num, 'PUBLIC', False, half)
            round_items.extend(add_official)
            round_items.extend(add_public)

        if round_items:
            saved = save_to_db(politician_id, cat_eng, ai_name, round_items)
            print(f"    → 저장: {saved}개")

    final_count = get_category_count(politician_id, cat_eng, ai_name)
    status = "✅" if final_count >= 50 else "⚠️"
    print(f"    {status} 최종: {final_count}/50개")


def collect_all_categories(politician_id, politician_name, ai_name):
    """단일 AI로 전체 10개 카테고리 수집+평가"""
    dates = get_date_range()

    print(f"\n{'='*60}")
    print(f"V28 독립 방식 - {ai_name}")
    print(f"{'='*60}")
    print(f"정치인: {politician_name} (ID: {politician_id})")
    print(f"OFFICIAL: {dates['official_start']} ~ {dates['official_end']}")
    print(f"PUBLIC: {dates['public_start']} ~ {dates['public_end']}")
    print(f"{'='*60}")

    for i in range(1, 11):
        collect_category(politician_id, politician_name, ai_name, i)

    # 최종 상태
    print(f"\n{'='*60}")
    print(f"[{ai_name}] 최종 상태")
    print(f"{'='*60}")

    total = 0
    for cat_eng, cat_kor in CATEGORIES:
        count = get_category_count(politician_id, cat_eng, ai_name)
        total += count
        status = "✅" if count >= 50 else "⚠️"
        print(f"  {status} {cat_kor}: {count}/50개")

    print(f"\n  총 {total}/500개")
    print(f"{'='*60}")


def collect_all_ais(politician_id, politician_name, parallel=False):
    """4개 AI 전체 실행"""
    ai_list = ["Claude", "ChatGPT", "Grok", "Gemini"]

    print("="*60)
    print("V28 독립 방식 - 4개 AI 전체")
    print("="*60)
    print(f"정치인: {politician_name} (ID: {politician_id})")
    print(f"병렬 실행: {'예' if parallel else '아니오'}")
    print("="*60)

    if parallel:
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {
                executor.submit(collect_all_categories, politician_id, politician_name, ai): ai
                for ai in ai_list
            }

            for future in as_completed(futures):
                ai = futures[future]
                try:
                    future.result()
                    print(f"\n✅ {ai} 완료!")
                except Exception as e:
                    print(f"\n❌ {ai} 실패: {e}")
    else:
        for ai in ai_list:
            collect_all_categories(politician_id, politician_name, ai)

    # 최종 상태
    print("\n" + "="*60)
    print("전체 상태")
    print("="*60)

    for ai in ai_list:
        total = 0
        for cat_eng, cat_kor in CATEGORIES:
            count = get_category_count(politician_id, cat_eng, ai)
            total += count
        status = "✅" if total >= 500 else "⚠️"
        print(f"  {status} {ai}: {total}/500개")

    print("\n" + "="*60)
    print("V28 수집 완료!")
    print("="*60)


# ============================================================
# V28: 검증 함수
# ============================================================

# OFFICIAL 출처 키워드 (이것들은 OFFICIAL이어야 함)
OFFICIAL_KEYWORDS = [
    '구청', '군청', '시청', '도청', '국회', '선관위', '선거관리위원회',
    '감사원', '대법원', '헌법재판소', '검찰', '대검찰청', '경찰청',
    '행정안전부', '기획재정부', '외교부', '국방부', '법무부', '교육부',
    '정부', '청와대', '대통령실', '총리실', '의안정보', '정치자금포털',
    '한국은행', '금융감독원', '국민연금', '공단'
]

# PUBLIC 출처 키워드 (이것들은 PUBLIC이어야 함)
PUBLIC_KEYWORDS = [
    '일보', '신문', '뉴스', '타임스', '헤럴드', 'MBC', 'KBS', 'SBS', 'JTBC',
    'YTN', 'TV', '방송', '미디어', '위키', '나무위키', '위키피디아',
    '트위터', '페이스북', '유튜브', '인스타그램', 'SNS'
]


def check_url_exists(url, timeout=5):
    """
    URL이 실제 존재하는지 확인 (HTTP HEAD 요청)

    Returns:
        (bool, str): (존재 여부, 상태 메시지)
    """
    if not url or url.strip() == '':
        return True, "URL 없음 (허용)"

    # 명백히 가짜 URL 패턴
    fake_patterns = [
        r'/articles?/\d{1,6}$',  # /articles/123456
        r'/\d{8}\.html$',  # /12345678.html
        r'example\.com',
        r'idxno=\d{1,3}$',  # idxno=2, idxno=33 등 너무 낮은 번호
    ]

    for pattern in fake_patterns:
        if re.search(pattern, url):
            return False, f"가짜 URL 패턴 감지: {pattern}"

    try:
        response = requests.head(url, timeout=timeout, allow_redirects=True)
        if response.status_code == 200:
            return True, "OK"
        elif response.status_code in [301, 302, 303, 307, 308]:
            return True, f"리다이렉트 ({response.status_code})"
        elif response.status_code == 403:
            return True, "접근 제한 (403) - 존재는 함"
        elif response.status_code == 404:
            return False, "404 Not Found"
        else:
            return False, f"HTTP {response.status_code}"
    except requests.exceptions.Timeout:
        return False, "Timeout"
    except requests.exceptions.ConnectionError:
        return False, "연결 실패"
    except Exception as e:
        return False, f"오류: {str(e)[:30]}"


def check_source_type_validity(source_type, data_source):
    """
    source_type과 data_source가 일치하는지 검증

    Returns:
        (bool, str): (유효 여부, 상태 메시지)
    """
    if not data_source:
        return True, "출처 없음"

    data_source_lower = data_source.lower()

    # OFFICIAL인데 PUBLIC 키워드 포함
    if source_type == 'OFFICIAL':
        for keyword in PUBLIC_KEYWORDS:
            if keyword.lower() in data_source_lower or keyword in data_source:
                return False, f"OFFICIAL인데 '{keyword}' 포함 → PUBLIC이어야 함"

    # PUBLIC인데 OFFICIAL 키워드 포함
    if source_type == 'PUBLIC':
        for keyword in OFFICIAL_KEYWORDS:
            if keyword in data_source:
                return False, f"PUBLIC인데 '{keyword}' 포함 → OFFICIAL이어야 함"

    return True, "OK"


def validate_data(politician_id, ai_name=None):
    """
    수집된 데이터 검증

    검증 항목:
    1. URL 존재 여부 (PUBLIC 언론/위키만)
    2. source_type 규칙 준수
    3. 기간 위반 체크 (V28 추가)
    4. 동일 제목 중복 체크 (V28 추가)

    검증 실패 데이터는 삭제됨
    """
    print("\n" + "="*60)
    print("V28 데이터 검증 (기간/중복 체크 추가)")
    print("="*60)

    # 기간 기준 계산
    dates = get_date_range()
    official_start = dates['official_start']
    public_start = dates['public_start']

    # 대상 AI 목록
    if ai_name and ai_name.lower() != 'all':
        ai_list = [ai_name]
    else:
        ai_list = list(AI_CONFIGS.keys())

    total_checked = 0
    total_failed = 0
    total_duplicates = 0

    for ai in ai_list:
        print(f"\n[{ai}] 검증 중...")

        # 해당 AI의 전체 데이터 조회 (중복 체크를 위해)
        all_data = []
        offset = 0
        limit = 100

        while True:
            response = supabase.table(TABLE_COLLECTED_DATA).select(
                'collected_data_id, source_type, data_source, source_url, data_date, data_title, category_name'
            ).eq('politician_id', politician_id).eq('ai_name', ai).range(
                offset, offset + limit - 1
            ).execute()

            if not response.data:
                break

            all_data.extend(response.data)

            if len(response.data) < limit:
                break
            offset += limit

        ai_checked = len(all_data)
        ai_failed = 0
        failed_ids = []

        # === 1~3단계: 개별 항목 검증 ===
        for item in all_data:
            item_id = item['collected_data_id']
            source_type = item['source_type']
            data_source = item['data_source'] or ''
            source_url = item['source_url'] or ''
            data_date = item['data_date'] or ''

            failed_reasons = []

            # 1. source_type 검증
            is_valid, msg = check_source_type_validity(source_type, data_source)
            if not is_valid:
                failed_reasons.append(msg)

            # 2. URL 검증 (PUBLIC 언론/위키만)
            if source_type == 'PUBLIC' and source_url:
                is_news_or_wiki = any(kw in data_source for kw in ['일보', '신문', '뉴스', '위키', 'MBC', 'KBS', 'SBS', 'JTBC'])
                if is_news_or_wiki:
                    url_valid, url_msg = check_url_exists(source_url)
                    if not url_valid:
                        failed_reasons.append(f"URL 검증 실패: {url_msg}")

            # 3. 기간 위반 체크 (V28 추가)
            if data_date:
                if source_type == 'PUBLIC' and data_date < public_start:
                    failed_reasons.append(f"기간 위반: {data_date} < {public_start}")
                elif source_type == 'OFFICIAL' and data_date < official_start:
                    failed_reasons.append(f"기간 위반: {data_date} < {official_start}")

            # 검증 실패 시 기록
            if failed_reasons:
                ai_failed += 1
                failed_ids.append((item_id, '; '.join(failed_reasons)))

        # === 4단계: 동일 제목 중복 체크 (V28 추가) ===
        # 카테고리별로 제목 중복 확인
        from collections import defaultdict
        title_groups = defaultdict(list)
        for item in all_data:
            key = (item['category_name'], item['data_title'])
            title_groups[key].append(item['collected_data_id'])

        duplicate_ids = []
        for (cat, title), ids in title_groups.items():
            if len(ids) > 1:
                # 첫 번째만 남기고 나머지 삭제
                duplicate_ids.extend(ids[1:])

        # 이미 failed_ids에 있는 것 제외
        failed_id_set = set(fid for fid, _ in failed_ids)
        duplicate_ids = [did for did in duplicate_ids if did not in failed_id_set]

        if duplicate_ids:
            print(f"  📋 동일 제목 중복: {len(duplicate_ids)}개 삭제 예정")
            total_duplicates += len(duplicate_ids)

        # === 삭제 처리 ===
        all_delete_ids = [fid for fid, _ in failed_ids] + duplicate_ids

        if failed_ids:
            print(f"  ⚠️ 검증 실패: {ai_failed}개")
            for item_id, reason in failed_ids[:5]:
                print(f"    - ID {item_id}: {reason[:50]}")
            if len(failed_ids) > 5:
                print(f"    ... 외 {len(failed_ids) - 5}개")

        if all_delete_ids:
            for item_id in all_delete_ids:
                try:
                    supabase.table(TABLE_COLLECTED_DATA).delete().eq(
                        'collected_data_id', item_id
                    ).execute()
                except Exception as e:
                    print(f"    삭제 실패 (ID {item_id}): {e}")

            print(f"  🗑️ 총 {len(all_delete_ids)}개 삭제 완료 (검증실패: {ai_failed}, 중복: {len(duplicate_ids)})")
        else:
            print(f"  ✅ 모두 통과 ({ai_checked}개)")

        total_checked += ai_checked
        total_failed += ai_failed

    print("\n" + "-"*60)
    print(f"검증 완료: 총 {total_checked}개")
    print(f"  - 검증 실패 삭제: {total_failed}개")
    print(f"  - 중복 제목 삭제: {total_duplicates}개")
    print("-"*60)

    return total_failed + total_duplicates


def recollect_failed(politician_id, politician_name, ai_name=None):
    """
    검증 실패로 삭제된 데이터 재수집

    각 카테고리별로 50개 미만인 경우 부족분 재수집
    """
    print("\n" + "="*60)
    print("V28 재수집")
    print("="*60)

    # 대상 AI 목록
    if ai_name and ai_name.lower() != 'all':
        ai_list = [ai_name]
    else:
        ai_list = list(AI_CONFIGS.keys())

    total_recollected = 0

    for ai in ai_list:
        print(f"\n[{ai}] 부족분 확인...")
        init_ai_client(ai)  # AI 클라이언트 초기화

        ai_recollected = 0

        for cat_idx, (cat_eng, cat_kor) in enumerate(CATEGORIES):
            category_num = cat_idx + 1  # 1-based index

            # 현재 개수 확인
            current_count = get_category_count(politician_id, cat_eng, ai)
            target_count = 50

            if current_count < target_count:
                shortage = target_count - current_count
                print(f"  {cat_kor}: {current_count}/50 → {shortage}개 재수집 필요")

                # 재수집 (collect_and_evaluate_batch 직접 호출)
                try:
                    # OFFICIAL과 PUBLIC 비율 유지 (각 25개씩)
                    official_count = get_exact_count(TABLE_COLLECTED_DATA, {
                        'politician_id': politician_id,
                        'ai_name': ai,
                        'category_name': cat_eng,
                        'source_type': 'OFFICIAL'
                    })
                    public_count = get_exact_count(TABLE_COLLECTED_DATA, {
                        'politician_id': politician_id,
                        'ai_name': ai,
                        'category_name': cat_eng,
                        'source_type': 'PUBLIC'
                    })

                    official_shortage = max(0, 25 - official_count)
                    public_shortage = max(0, 25 - public_count)

                    if official_shortage > 0:
                        print(f"    OFFICIAL {official_shortage}개 재수집...")
                        items = collect_and_evaluate_batch(
                            politician_id, politician_name, ai, category_num,
                            'OFFICIAL', False, official_shortage
                        )
                        if items:
                            saved = save_to_db(politician_id, cat_eng, ai, items)
                            ai_recollected += saved

                    if public_shortage > 0:
                        print(f"    PUBLIC {public_shortage}개 재수집...")
                        items = collect_and_evaluate_batch(
                            politician_id, politician_name, ai, category_num,
                            'PUBLIC', False, public_shortage
                        )
                        if items:
                            saved = save_to_db(politician_id, cat_eng, ai, items)
                            ai_recollected += saved

                except Exception as e:
                    print(f"    ⚠️ 재수집 실패: {e}")

        if ai_recollected > 0:
            print(f"  📥 {ai}: {ai_recollected}개 재수집 완료")
        else:
            print(f"  ✅ {ai}: 재수집 불필요")

        total_recollected += ai_recollected

    print("\n" + "-"*60)
    print(f"재수집 완료: 총 {total_recollected}개")
    print("-"*60)

    return total_recollected


def run_full_pipeline(politician_id, politician_name, ai_name=None, parallel=False):
    """
    전체 파이프라인 실행: 수집 → 검증 → 재수집 (최대 3회 반복)
    """
    print("\n" + "="*60)
    print("V28 전체 파이프라인 시작")
    print("="*60)
    print(f"정치인: {politician_name} (ID: {politician_id})")
    print("프로세스: 수집 → 검증 → 재수집 (최대 3회)")
    print("="*60)

    # 1단계: 수집
    print("\n" + "▶"*20)
    print("1단계: 수집")
    print("▶"*20)

    if ai_name and ai_name.lower() != 'all':
        collect_all_categories(politician_id, politician_name, ai_name)
    else:
        collect_all_ais(politician_id, politician_name, parallel)

    # 2~3단계: 검증 → 재수집 (최대 3회 반복)
    max_iterations = 3
    for iteration in range(1, max_iterations + 1):
        print(f"\n" + "▶"*20)
        print(f"2단계: 검증 (반복 {iteration}/{max_iterations})")
        print("▶"*20)

        failed_count = validate_data(politician_id, ai_name)

        if failed_count == 0:
            print("\n✅ 모든 데이터 검증 통과!")
            break

        print(f"\n" + "▶"*20)
        print(f"3단계: 재수집 (반복 {iteration}/{max_iterations})")
        print("▶"*20)

        recollected = recollect_failed(politician_id, politician_name, ai_name)

        if recollected == 0:
            print("\n✅ 재수집할 데이터 없음!")
            break

        if iteration == max_iterations:
            print(f"\n⚠️ 최대 반복 횟수({max_iterations})에 도달. 일부 데이터 부족할 수 있음.")

    # 최종 상태 출력
    print("\n" + "="*60)
    print("파이프라인 완료 - 최종 상태")
    print("="*60)

    if ai_name and ai_name.lower() != 'all':
        ai_list = [ai_name]
    else:
        ai_list = list(AI_CONFIGS.keys())

    for ai in ai_list:
        total = 0
        for cat_eng, cat_kor in CATEGORIES:
            count = get_category_count(politician_id, cat_eng, ai)
            total += count
        status = "✅" if total >= 500 else "⚠️"
        print(f"  {status} {ai}: {total}/500개")

    print("\n" + "="*60)
    print("다음 단계: python evaluate_v28.py --politician_id=...")
    print("="*60)


def main():
    parser = argparse.ArgumentParser(description='V28 수집/검증/재수집 통합 스크립트')
    parser.add_argument('--politician_id', type=str, required=True, help='정치인 ID')
    parser.add_argument('--politician_name', type=str, required=True, help='정치인 이름')
    parser.add_argument('--ai', type=str, default='all', help='실행할 AI (Claude, ChatGPT, Grok, Gemini, all)')
    parser.add_argument('--parallel', action='store_true', help='병렬 실행')
    parser.add_argument('--mode', type=str, default='all',
                        choices=['all', 'collect', 'validate', 'recollect'],
                        help='실행 모드: all(전체), collect(수집만), validate(검증만), recollect(재수집만)')
    args = parser.parse_args()

    # ⚠️ 정치인 ID 사전 등록 확인 (필수!)
    exists, db_name = check_politician_exists(args.politician_id)
    if not exists:
        print("="*60)
        print("❌ 오류: 정치인 ID가 DB에 등록되어 있지 않습니다!")
        print("="*60)
        print(f"politician_id: {args.politician_id}")
        print(f"\n먼저 politicians 테이블에 등록해주세요.")
        print("="*60)
        sys.exit(1)

    print(f"✅ 정치인 확인: {db_name} (ID: {args.politician_id})")
    print(f"📋 실행 모드: {args.mode}")

    # 모드별 실행
    if args.mode == 'all':
        # 전체 파이프라인: 수집 → 검증 → 재수집
        run_full_pipeline(args.politician_id, args.politician_name, args.ai, args.parallel)

    elif args.mode == 'collect':
        # 수집만
        if args.ai.lower() == 'all':
            collect_all_ais(args.politician_id, args.politician_name, args.parallel)
        else:
            collect_all_categories(args.politician_id, args.politician_name, args.ai)

    elif args.mode == 'validate':
        # 검증만
        validate_data(args.politician_id, args.ai)

    elif args.mode == 'recollect':
        # 재수집만
        recollect_failed(args.politician_id, args.politician_name, args.ai)


if __name__ == "__main__":
    main()
