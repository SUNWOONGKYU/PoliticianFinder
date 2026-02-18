#!/usr/bin/env python3
"""
간단한 MCP 테스트 - 짧은 프롬프트
"""

import asyncio
import json
from pathlib import Path
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
MCP_DIR = SCRIPT_DIR / "scripts" / "mcp"


async def test_simple_prompt():
    """간단한 프롬프트 테스트"""
    print("[TEST] MCP 간단 테스트 시작...")

    server_params = StdioServerParameters(
        command="python",
        args=[str(MCP_DIR / "gemini_mcp_server_production.py")]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            print("[TEST] gemini_generate 호출...")

            # 간단한 프롬프트 (Gemini CLI는 느림 - 25초 + MCP 오버헤드)
            result = await session.call_tool(
                "gemini_generate",
                arguments={
                    "prompt": "Say 'Hello World' in Korean.",
                    "timeout": 120  # 타임아웃 120초
                }
            )

            if result.content:
                response_text = result.content[0].text
                data = json.loads(response_text)

                print(f"\n{'='*60}")
                print(f"[OK] Success: {data.get('success')}")
                if data.get('success'):
                    print(f"[OK] Output:\n{data.get('output', '')}")
                else:
                    print(f"[ERROR] Error: {data.get('error')}")
                print(f"{'='*60}\n")

                return data.get('success')
            else:
                print("[ERROR] Empty response")
                return False


if __name__ == '__main__':
    success = asyncio.run(test_simple_prompt())
    if success:
        print("[OK] MCP is working! Ready for production.")
    else:
        print("[ERROR] MCP test failed.")
