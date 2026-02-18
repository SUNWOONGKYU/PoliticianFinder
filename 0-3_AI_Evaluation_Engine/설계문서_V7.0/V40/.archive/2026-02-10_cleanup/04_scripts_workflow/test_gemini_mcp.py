#!/usr/bin/env python3
"""
Gemini MCP 간단한 테스트
"""

import asyncio
import json
from pathlib import Path
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
MCP_DIR = V40_DIR / "scripts" / "mcp"


async def test_gemini_generate():
    """간단한 텍스트 생성 테스트"""
    server_params = StdioServerParameters(
        command="python",
        args=[str(MCP_DIR / "gemini_mcp_server_production.py")]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            print("[TEST] gemini_generate 테스트...")

            result = await session.call_tool(
                "gemini_generate",
                arguments={
                    "prompt": "안녕하세요를 영어로 번역해주세요.",
                    "timeout": 60
                }
            )

            if result.content:
                response_text = result.content[0].text
                data = json.loads(response_text)

                print(f"[OK] Success: {data.get('success')}")
                print(f"[OK] Output: {data.get('output', '')[:100]}...")
            else:
                print("[ERROR] Empty response")


async def test_gemini_health():
    """Health check 테스트"""
    server_params = StdioServerParameters(
        command="python",
        args=[str(MCP_DIR / "gemini_mcp_server_production.py")]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            print("[TEST] gemini_health_check 테스트...")

            result = await session.call_tool(
                "gemini_health_check",
                arguments={}
            )

            if result.content:
                response_text = result.content[0].text
                data = json.loads(response_text)

                print(f"[OK] Healthy: {data.get('healthy')}")
                print(f"[OK] Version: {data.get('version')}")
                print(f"[OK] Platform: {data.get('platform')}")
                print(f"[OK] Path: {data.get('gemini_path')}")
            else:
                print("[ERROR] Empty response")


async def main():
    """메인 테스트 함수"""
    print("="*60)
    print("Gemini MCP Production Test")
    print("="*60)

    # Health check
    await test_gemini_health()

    print()

    # 간단한 텍스트 생성
    await test_gemini_generate()

    print("="*60)


if __name__ == '__main__':
    asyncio.run(main())
