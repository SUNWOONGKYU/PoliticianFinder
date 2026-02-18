#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
4개 AI의 웹 검색 능력 비교 테스트
"""

import sys
import os
from dotenv import load_dotenv
from anthropic import Anthropic
from openai import OpenAI
from google import genai
from google.genai import types

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# .env 파일 로드
load_dotenv(override=True)

# API 키
CLAUDE_API_KEY = os.getenv("ANTHROPIC_API_KEY")
CHATGPT_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")

def test_claude():
    """Claude 웹 검색 테스트"""
    print("\n" + "="*70)
    print("1. Claude (Anthropic)")
    print("="*70)

    if not CLAUDE_API_KEY:
        print("❌ ANTHROPIC_API_KEY 없음")
        return None

    try:
        client = Anthropic(api_key=CLAUDE_API_KEY)

        response = client.beta.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=2000,
            betas=["web-search-2025-03-05"],
            tools=[{
                "type": "web_search_20250305",
                "name": "web_search",
                "max_uses": 5
            }],
            messages=[{
                "role": "user",
                "content": "조은희 의원의 최근 뉴스 3개를 검색해서 제목과 URL을 알려주세요 (2024-2026년)"
            }]
        )

        # 응답 텍스트 추출
        result = ""
        for block in response.content:
            if type(block).__name__ == 'BetaTextBlock' and hasattr(block, 'text'):
                result += block.text

        print("\n✅ Claude 응답:")
        print("-" * 70)
        print(result[:800] if result else "응답 없음")
        print("-" * 70)

        # URL 개수 세기
        url_count = result.count('http') if result else 0
        print(f"\n📊 발견된 URL: 약 {url_count}개")

        return {
            "success": True,
            "has_search": True,
            "url_count": url_count,
            "response_length": len(result)
        }

    except Exception as e:
        print(f"\n❌ 오류: {e}")
        return {"success": False, "error": str(e)}

def test_chatgpt():
    """ChatGPT 웹 검색 테스트"""
    print("\n" + "="*70)
    print("2. ChatGPT (OpenAI)")
    print("="*70)

    if not CHATGPT_API_KEY:
        print("❌ OPENAI_API_KEY 없음")
        return None

    try:
        client = OpenAI(api_key=CHATGPT_API_KEY)

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user",
                "content": "조은희 의원의 최근 뉴스 3개를 검색해서 제목과 URL을 알려주세요 (2024-2026년)"
            }],
            max_tokens=2000
        )

        result = response.choices[0].message.content

        print("\n✅ ChatGPT 응답:")
        print("-" * 70)
        print(result[:800])
        print("-" * 70)

        # URL 개수 세기
        url_count = result.count('http')
        print(f"\n📊 발견된 URL: 약 {url_count}개")

        # 검색 가능 여부 확인
        has_search = url_count > 0 and 'http' in result

        return {
            "success": True,
            "has_search": has_search,
            "url_count": url_count,
            "response_length": len(result)
        }

    except Exception as e:
        print(f"\n❌ 오류: {e}")
        return {"success": False, "error": str(e)}

def test_gemini():
    """Gemini 웹 검색 테스트"""
    print("\n" + "="*70)
    print("3. Gemini (Google)")
    print("="*70)

    if not GEMINI_API_KEY:
        print("❌ GEMINI_API_KEY 없음")
        return None

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents="조은희 의원의 최근 뉴스 3개를 검색해서 제목과 URL을 알려주세요 (2024-2026년)",
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())]
            )
        )

        result = response.text

        print("\n✅ Gemini 응답:")
        print("-" * 70)
        print(result[:800])
        print("-" * 70)

        # Grounding metadata 확인
        actual_urls = []
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                gm = candidate.grounding_metadata
                if hasattr(gm, 'grounding_chunks') and gm.grounding_chunks:
                    for chunk in gm.grounding_chunks:
                        if hasattr(chunk, 'web') and hasattr(chunk.web, 'uri'):
                            actual_urls.append(chunk.web.uri)

        print(f"\n📊 실제 검색 URL: {len(actual_urls)}개")
        print(f"📊 응답 텍스트 내 URL: 약 {result.count('http')}개")

        return {
            "success": True,
            "has_search": True,
            "url_count": len(actual_urls),
            "response_length": len(result)
        }

    except Exception as e:
        print(f"\n❌ 오류: {e}")
        return {"success": False, "error": str(e)}

def test_perplexity():
    """Perplexity 웹 검색 테스트"""
    print("\n" + "="*70)
    print("4. Perplexity")
    print("="*70)

    if not PERPLEXITY_API_KEY:
        print("❌ PERPLEXITY_API_KEY 없음")
        return None

    try:
        client = OpenAI(
            api_key=PERPLEXITY_API_KEY,
            base_url="https://api.perplexity.ai"
        )

        response = client.chat.completions.create(
            model="llama-3.1-sonar-small-128k-online",
            messages=[{
                "role": "user",
                "content": "조은희 의원의 최근 뉴스 3개를 검색해서 제목과 URL을 알려주세요 (2024-2026년)"
            }],
            max_tokens=2000
        )

        result = response.choices[0].message.content

        print("\n✅ Perplexity 응답:")
        print("-" * 70)
        print(result[:800])
        print("-" * 70)

        # URL 개수 세기
        url_count = result.count('http')
        print(f"\n📊 발견된 URL: 약 {url_count}개")

        return {
            "success": True,
            "has_search": True,
            "url_count": url_count,
            "response_length": len(result)
        }

    except Exception as e:
        print(f"\n❌ 오류: {e}")
        return {"success": False, "error": str(e)}

def main():
    print("="*70)
    print("AI 웹 검색 능력 비교 테스트")
    print("="*70)
    print("\n목표: 조은희 의원 최근 뉴스 3개 검색")
    print("기간: 2024-2026년")

    results = {}

    # 각 AI 테스트
    results['Claude'] = test_claude()
    results['ChatGPT'] = test_chatgpt()
    results['Gemini'] = test_gemini()
    results['Perplexity'] = test_perplexity()

    # 최종 비교
    print("\n\n" + "="*70)
    print("최종 비교 결과")
    print("="*70)
    print()

    comparison = []
    for ai_name, result in results.items():
        if result and result.get('success'):
            comparison.append({
                'name': ai_name,
                'has_search': result.get('has_search', False),
                'url_count': result.get('url_count', 0),
                'response_length': result.get('response_length', 0)
            })

    # 표 형식 출력
    print(f"{'AI':<15} {'웹 검색':<10} {'URL 개수':<12} {'응답 길이':<12}")
    print("-" * 70)
    for item in comparison:
        search_status = "✅ 가능" if item['has_search'] else "❌ 불가능"
        print(f"{item['name']:<15} {search_status:<10} {item['url_count']:<12} {item['response_length']:<12}")

    print("\n" + "="*70)
    print("결론:")
    print("="*70)
    print()

    # URL 개수 기준 정렬
    sorted_by_urls = sorted(
        [c for c in comparison if c['has_search']],
        key=lambda x: x['url_count'],
        reverse=True
    )

    if sorted_by_urls:
        winner = sorted_by_urls[0]
        print(f"🥇 수집 능력 1위: {winner['name']}")
        print(f"   - 실제 검색 URL: {winner['url_count']}개")
        print()

        if len(sorted_by_urls) > 1:
            print("순위:")
            for i, item in enumerate(sorted_by_urls, 1):
                print(f"   {i}. {item['name']}: {item['url_count']}개 URL")

    print("\n" + "="*70)

if __name__ == "__main__":
    main()
