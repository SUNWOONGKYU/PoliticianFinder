#!/usr/bin/env python3
"""
HTTP MCP 테스트 - warm start + HTTP 버퍼링 우회
"""

import asyncio
import json
import time
import httpx


async def test_http_mcp():
    """HTTP 모드로 MCP 서버 테스트"""
    print("[TEST] HTTP MCP 테스트 시작...")

    # HTTP MCP 엔드포인트
    url = "http://127.0.0.1:8001/mcp"

    start = time.time()

    # MCP 요청 (JSON-RPC)
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "gemini_generate",
            "arguments": {
                "prompt": "Say 'Hello World' in Korean.",
                "timeout": 120
            }
        }
    }

    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(url, json=payload)
            elapsed = time.time() - start

            print(f"\n{'='*60}")
            print(f"[OK] HTTP Status: {response.status_code}")
            print(f"[OK] Time: {elapsed:.1f}s")

            if response.status_code == 200:
                data = response.json()
                print(f"[OK] Response: {json.dumps(data, indent=2, ensure_ascii=False)[:200]}")
            else:
                print(f"[ERROR] Response: {response.text[:200]}")
            print(f"{'='*60}\n")

            return response.status_code == 200

    except Exception as e:
        elapsed = time.time() - start
        print(f"\n[ERROR] Failed after {elapsed:.1f}s: {e}\n")
        return False


if __name__ == '__main__':
    success = asyncio.run(test_http_mcp())
    if success:
        print("[OK] HTTP MCP is faster than STDIO!")
    else:
        print("[ERROR] HTTP MCP test failed.")
