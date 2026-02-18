#!/usr/bin/env python3
"""
Gemini API MCP 테스트
====================

빠른 속도 확인: 2-3초 vs Gemini CLI 25초
"""

import asyncio
import json
import time
from pathlib import Path
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
MCP_DIR = SCRIPT_DIR / "scripts" / "mcp"


async def test_health_check():
    """Health check 테스트"""
    print("[TEST] Health Check...")

    server_params = StdioServerParameters(
        command="python",
        args=[str(MCP_DIR / "gemini_api_mcp_server.py")]
    )

    start = time.time()

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            result = await session.call_tool(
                "gemini_health_check",
                arguments={}
            )

            elapsed = time.time() - start

            if result.content:
                response_text = result.content[0].text
                data = json.loads(response_text)

                print(f"[OK] Healthy: {data.get('healthy')}")
                print(f"[OK] Model: {data.get('model')}")
                print(f"[OK] API Key: {data.get('api_key_configured')}")
                print(f"[OK] Time: {elapsed:.1f}s\n")

                return data.get('healthy')
            else:
                print(f"[ERROR] Empty response\n")
                return False


async def test_simple_generate():
    """간단한 텍스트 생성 테스트"""
    print("[TEST] Simple Generate...")

    server_params = StdioServerParameters(
        command="python",
        args=[str(MCP_DIR / "gemini_api_mcp_server.py")]
    )

    start = time.time()

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            result = await session.call_tool(
                "gemini_generate",
                arguments={
                    "prompt": "Say 'Hello World' in Korean.",
                    "timeout": 30
                }
            )

            elapsed = time.time() - start

            if result.content:
                response_text = result.content[0].text
                data = json.loads(response_text)

                print(f"[OK] Success: {data.get('success')}")
                if data.get('success'):
                    print(f"[OK] Output: {data.get('output', '')[:100]}")
                    print(f"[OK] Time: {elapsed:.1f}s ← Gemini CLI는 25초!")
                else:
                    print(f"[ERROR] Error: {data.get('error')}")
                    print(f"[ERROR] Time: {elapsed:.1f}s")

                print()
                return data.get('success')
            else:
                print(f"[ERROR] Empty response\n")
                return False


async def test_json_generate():
    """JSON 생성 테스트"""
    print("[TEST] JSON Generate...")

    server_params = StdioServerParameters(
        command="python",
        args=[str(MCP_DIR / "gemini_api_mcp_server.py")]
    )

    prompt = """다음 JSON 형식으로 응답해주세요:
```json
{
  "greeting": "안녕하세요",
  "language": "Korean",
  "success": true
}
```"""

    start = time.time()

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            result = await session.call_tool(
                "gemini_generate_json",
                arguments={
                    "prompt": prompt,
                    "timeout": 30
                }
            )

            elapsed = time.time() - start

            if result.content:
                response_text = result.content[0].text
                data = json.loads(response_text)

                print(f"[OK] Success: {data.get('success')}")
                if data.get('success'):
                    print(f"[OK] Parsed JSON: {json.dumps(data.get('data'), ensure_ascii=False)}")
                    print(f"[OK] Time: {elapsed:.1f}s")
                else:
                    print(f"[ERROR] Error: {data.get('error')}")
                    print(f"[ERROR] Time: {elapsed:.1f}s")

                print()
                return data.get('success')
            else:
                print(f"[ERROR] Empty response\n")
                return False


async def main():
    """메인 테스트"""
    print("="*60)
    print("Gemini API MCP Server Test")
    print("="*60)
    print()

    # Health check
    health = await test_health_check()
    if not health:
        print("[ERROR] Health check failed. Check GEMINI_API_KEY.")
        return

    # 간단한 생성
    success1 = await test_simple_generate()

    # JSON 생성
    success2 = await test_json_generate()

    print("="*60)
    if success1 and success2:
        print("[OK] All tests passed!")
        print("[OK] Gemini API MCP Server is ready for production.")
    else:
        print("[ERROR] Some tests failed.")
    print("="*60)


if __name__ == '__main__':
    asyncio.run(main())
