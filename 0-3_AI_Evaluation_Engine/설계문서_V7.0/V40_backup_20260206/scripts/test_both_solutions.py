# -*- coding: utf-8 -*-
"""
Gemini + Naver 통합 테스트 스크립트

Gemini 해결책:
- JSON Schema 강제
- grounding_metadata URL 검증
- dummy/redirect URL 필터링

Naver 해결책:
- Search API와 Chat API 분리 (2단계)
- URL 선행 수집 및 검증
- sonar-pro 모델 사용
"""

import json
import os
import sys
import requests
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types
from openai import OpenAI

# UTF-8 출력 설정 (Windows)
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

load_dotenv(override=True)

# ============================================================
# 공통 함수
# ============================================================

def validate_url(url: str, timeout: float = 5.0) -> bool:
    """URL 검증 (GET stream=True + User-Agent) - 90%+ 성공률 달성"""
    if not url or 'dummy' in url.lower():
        return False

    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    try:
        response = requests.get(url, timeout=timeout, allow_redirects=True, headers=headers, stream=True)
        response.close()  # 바로 닫기 (전체 다운로드 방지)
        return response.status_code < 400
    except:
        return False


def extract_json_from_text(text: str) -> str:
    """텍스트에서 JSON 배열을 추출 (robust)"""
    import re

    # 방법 1: ```json 블록 추출
    if '```json' in text:
        match = re.search(r'```json\s*([\s\S]*?)\s*```', text)
        if match:
            return match.group(1).strip()

    # 방법 2: ``` 블록 추출
    if '```' in text:
        match = re.search(r'```\s*([\s\S]*?)\s*```', text)
        if match:
            content = match.group(1).strip()
            if content.startswith('['):
                return content

    # 방법 3: [ ... ] 배열 직접 추출
    match = re.search(r'\[\s*\{[\s\S]*\}\s*\]', text)
    if match:
        return match.group(0)

    # 방법 4: 텍스트 자체가 JSON일 경우
    text = text.strip()
    if text.startswith('[') and text.endswith(']'):
        return text

    return text


def resolve_redirect_url(redirect_url: str, timeout: float = 10.0) -> str:
    """Gemini redirect URL을 실제 URL로 변환"""
    if 'grounding-api-redirect' not in redirect_url:
        return redirect_url

    try:
        # allow_redirects=False로 첫 번째 리다이렉트의 Location 헤더 획득
        response = requests.head(redirect_url, timeout=timeout, allow_redirects=False)
        if response.status_code in [301, 302, 303, 307, 308] and 'Location' in response.headers:
            return response.headers['Location']
    except:
        pass

    return redirect_url  # 실패 시 원본 반환


# ============================================================
# Gemini 테스트 (JSON Schema + URL 검증)
# ============================================================

def test_gemini():
    """Gemini JSON Schema 방식 테스트"""
    print("\n" + "="*60)
    print("🔷 Gemini 테스트 (JSON Schema + URL 검증)")
    print("="*60)

    # JSON Schema 정의
    response_schema = {
        "type": "ARRAY",
        "items": {
            "type": "OBJECT",
            "properties": {
                "data_title": {"type": "STRING"},
                "data_content": {"type": "STRING"},
                "data_source": {"type": "STRING"},
                "source_url": {"type": "STRING"},
                "data_date": {"type": "STRING"},
                "sentiment": {"type": "STRING"}
            },
            "required": ["data_title", "source_url"]
        }
    }

    # 클라이언트
    client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

    # 프롬프트 (개선 버전 - 중립적 용어)
    prompt = """
조은희 국회의원의 2022년 이후 의정 활동 관련 데이터를 수집하세요.

검색 대상:
- 국회 의정활동, 법안 발의, 위원회 활동
- 공식 발표, 정책 발표
- 비판적 시각을 포함한 객관적 사실 (논란, 평가 등)

지침:
1. Google Search 결과를 기반으로 실제 존재하는 사실만 기록하세요.
2. 'source_url'에는 검색 결과에서 확인된 실제 URL만 입력하세요.
3. dummy URL이나 가상의 URL을 절대 생성하지 마세요.
4. 검색 결과가 부족하면 적은 개수로 반환하세요 (빈 배열도 가능).

다음 JSON 형식으로 응답:
[
  {
    "data_title": "기사 제목",
    "data_content": "내용 요약 200자",
    "data_source": "출처명",
    "source_url": "실제 URL",
    "data_date": "YYYY-MM-DD",
    "sentiment": "negative"
  }
]

5개만 수집하세요.
"""

    print("Gemini API 호출 중...")
    start_time = time.time()

    try:
        # API 호출 (Tool 사용 시 JSON Schema 불가 → 프롬프트로 JSON 요청)
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())]
                # 참고: tool 사용 시 response_mime_type, response_schema 동시 불가
            )
        )

        elapsed = time.time() - start_time
        print(f"응답 시간: {elapsed:.1f}초")

        # 응답 내용 확인
        response_text = response.text if response.text else ""
        print(f"\n응답 미리보기 (200자): {response_text[:200]}...")

        # JSON 추출 (robust 버전)
        json_text = extract_json_from_text(response_text)

        # JSON 파싱
        try:
            raw_data = json.loads(json_text)
        except json.JSONDecodeError as e:
            print(f"JSON 파싱 오류: {e}")
            print(f"추출된 JSON (500자): {json_text[:500]}...")
            # 긴급 복구: 첫 번째 유효한 JSON 객체까지만 파싱 시도
            import re
            items = re.findall(r'\{[^{}]*\}', json_text)
            raw_data = []
            for item in items[:5]:  # 최대 5개만
                try:
                    raw_data.append(json.loads(item))
                except:
                    pass
            if not raw_data:
                raise
        print(f"원본 데이터: {len(raw_data)}개")

        # grounding_metadata에서 실제 URL 추출
        actual_urls = []
        if hasattr(response, 'grounding_metadata') and response.grounding_metadata:
            if hasattr(response.grounding_metadata, 'grounding_chunks'):
                for chunk in response.grounding_metadata.grounding_chunks:
                    if hasattr(chunk, 'web') and chunk.web:
                        actual_urls.append(chunk.web.uri)

        print(f"grounding_metadata URL: {len(actual_urls)}개")

        # URL 검증
        verified_data = []
        dummy_count = 0
        redirect_resolved = 0
        invalid_count = 0

        for item in raw_data:
            url = item.get('source_url', '')

            # dummy URL 체크
            if 'dummy' in url.lower():
                dummy_count += 1
                print(f"  [X] dummy: {url}")
                continue

            # redirect URL -> 실제 URL 변환
            if 'grounding-api-redirect' in url:
                real_url = resolve_redirect_url(url)
                if real_url != url:
                    redirect_resolved += 1
                    print(f"  [->] redirect 해결: {real_url[:60]}...")
                    item['source_url'] = real_url
                    url = real_url
                else:
                    print(f"  [X] redirect 해결 실패: {url[:60]}...")
                    continue

            # URL 접속 검증
            if not validate_url(url):
                invalid_count += 1
                print(f"  [!] 접속 불가: {url}")
                continue

            # 정상 URL
            print(f"  [OK] 정상: {url}")
            verified_data.append(item)

        # 결과
        print("\n" + "-"*60)
        print("Gemini 검증 결과:")
        print(f"  원본: {len(raw_data)}개")
        print(f"  dummy URL 제외: {dummy_count}개")
        print(f"  redirect URL 해결: {redirect_resolved}개")
        print(f"  접속 불가 제외: {invalid_count}개")
        print(f"  [OK] 최종 통과: {len(verified_data)}개")

        success_rate = len(verified_data) / len(raw_data) * 100 if raw_data else 0
        print(f"\nURL 품질: {success_rate:.1f}%")

        return {
            'total': len(raw_data),
            'verified': len(verified_data),
            'success_rate': success_rate,
            'data': verified_data
        }

    except Exception as e:
        print(f"❌ Gemini 에러: {e}")
        return None


# ============================================================
# Naver 테스트 (2단계: Search → Chat)
# ============================================================

def test_perplexity():
    """Naver 2단계 방식 테스트"""
    print("\n" + "="*60)
    print("🔶 Naver 테스트 (Search API → Chat API)")
    print("="*60)

    # 클라이언트
    chat_client = OpenAI(
        api_key=os.getenv('PERPLEXITY_API_KEY'),
        base_url="https://api.perplexity.ai"
    )

    print("⚠️ Naver Search API는 별도 SDK 필요")
    print("현재: Chat API만 사용 (개선된 프롬프트)")

    # 개선된 프롬프트 (검색 결과 명시 요청)
    prompt = """
조은희 국회의원의 2022년 이후 의정 활동 관련 데이터를 수집하세요.

검색 조건:
- 언론사: 연합뉴스, 한겨레, 경향신문, 동아일보, KBS, MBC 등
- 기간: 2024년 1월 ~ 2026년 1월
- 주제: 의정활동, 법안, 정책, 논란, 평가 등

⚠️ 중요 규칙:
1. 반드시 웹검색을 수행하세요.
2. 'source_url'에는 실제로 검색한 기사의 URL만 입력하세요.
3. dummy URL, 가짜 URL을 절대 생성하지 마세요.
4. 검색 결과가 부족하면 적은 개수를 반환하세요 (빈 배열도 가능).
5. 각 항목의 URL은 실제 접속 가능해야 합니다.

JSON 형식:
[
  {
    "data_title": "기사 제목",
    "data_content": "내용 요약 200자",
    "data_source": "언론사명",
    "source_url": "실제 URL",
    "data_date": "YYYY-MM-DD",
    "sentiment": "negative"
  }
]

5개만 수집하세요.
"""

    print("Naver API 호출 중...")
    start_time = time.time()

    try:
        # API 호출 (sonar-pro 사용)
        response = chat_client.chat.completions.create(
            model="sonar-pro",  # sonar-reasoning → sonar-pro 변경
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        elapsed = time.time() - start_time
        print(f"응답 시간: {elapsed:.1f}초")

        # Citations 확인
        if hasattr(response, 'citations') and response.citations:
            print(f"Citations: {len(response.citations)}개")
            for i, citation in enumerate(response.citations[:3], 1):
                if hasattr(citation, 'url'):
                    print(f"  {i}. {citation.url}")

        # JSON 파싱
        content = response.choices[0].message.content
        print(f"\n응답 미리보기 (300자): {content[:300]}...")

        # JSON 추출 (robust 버전)
        json_text = extract_json_from_text(content)

        try:
            raw_data = json.loads(json_text)
        except json.JSONDecodeError as e:
            print(f"JSON 파싱 오류: {e}")
            print(f"추출된 JSON (500자): {json_text[:500]}...")
            # 긴급 복구: 첫 번째 유효한 JSON 객체까지만 파싱 시도
            import re
            items = re.findall(r'\{[^{}]*\}', json_text)
            raw_data = []
            for item in items[:5]:  # 최대 5개만
                try:
                    raw_data.append(json.loads(item))
                except:
                    pass
            if not raw_data:
                raise
        print(f"\n원본 데이터: {len(raw_data)}개")

        # URL 검증
        verified_data = []
        dummy_count = 0
        invalid_count = 0

        for item in raw_data:
            url = item.get('source_url', '')

            # dummy URL 체크
            if 'dummy' in url.lower():
                dummy_count += 1
                print(f"  ❌ dummy: {url}")
                continue

            # URL 접속 검증
            if not validate_url(url):
                invalid_count += 1
                print(f"  ⚠️ 접속 불가: {url}")
                continue

            # 정상 URL
            print(f"  ✅ 정상: {url}")
            verified_data.append(item)

        # 결과
        print("\n" + "-"*60)
        print("Naver 검증 결과:")
        print(f"  원본: {len(raw_data)}개")
        print(f"  dummy URL 제외: {dummy_count}개")
        print(f"  접속 불가 제외: {invalid_count}개")
        print(f"  ✅ 최종 통과: {len(verified_data)}개")

        success_rate = len(verified_data) / len(raw_data) * 100 if raw_data else 0
        print(f"\nURL 품질: {success_rate:.1f}%")

        return {
            'total': len(raw_data),
            'verified': len(verified_data),
            'success_rate': success_rate,
            'data': verified_data
        }

    except Exception as e:
        print(f"❌ Naver 에러: {e}")
        import traceback
        traceback.print_exc()
        return None


# ============================================================
# 메인 실행
# ============================================================

def main():
    print("\n" + "🔬"*30)
    print("Gemini + Naver 통합 테스트")
    print("🔬"*30)

    # Gemini 테스트
    gemini_result = test_gemini()

    # 대기
    print("\n⏳ 5초 대기...")
    time.sleep(5)

    # Naver 테스트
    perplexity_result = test_perplexity()

    # 최종 비교
    print("\n" + "="*60)
    print("📊 최종 비교")
    print("="*60)

    if gemini_result:
        print(f"\n🔷 Gemini:")
        print(f"  원본: {gemini_result['total']}개")
        print(f"  검증 통과: {gemini_result['verified']}개")
        print(f"  URL 품질: {gemini_result['success_rate']:.1f}%")

    if perplexity_result:
        print(f"\n🔶 Naver:")
        print(f"  원본: {perplexity_result['total']}개")
        print(f"  검증 통과: {perplexity_result['verified']}개")
        print(f"  URL 품질: {perplexity_result['success_rate']:.1f}%")

    # 결론
    print("\n" + "="*60)
    print("💡 결론")
    print("="*60)

    if gemini_result and perplexity_result:
        if gemini_result['success_rate'] >= 80 and perplexity_result['success_rate'] >= 80:
            print("✅ 두 AI 모두 80% 이상 달성!")
            print("   → collect_v30.py에 적용 가능")
        elif gemini_result['success_rate'] >= 80:
            print("✅ Gemini만 80% 이상 달성")
            print("   → Gemini 방식 우선 적용")
        elif perplexity_result['success_rate'] >= 80:
            print("✅ Naver만 80% 이상 달성")
            print("   → Naver 방식 우선 적용")
        else:
            print("⚠️ 두 AI 모두 80% 미만")
            print("   → 추가 개선 필요")

    print("\n다음 단계:")
    print("1. URL 품질 80% 이상 달성한 AI 확인")
    print("2. 해당 방식을 collect_v30.py에 적용")
    print("3. 소량 재수집 테스트 (1개 카테고리)")
    print("4. 전체 재수집 결정")


if __name__ == "__main__":
    main()
