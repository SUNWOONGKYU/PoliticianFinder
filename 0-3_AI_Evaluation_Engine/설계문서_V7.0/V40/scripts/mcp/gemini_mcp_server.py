#!/usr/bin/env python3
"""
Gemini CLI MCP 서버
===================

✅ Gemini CLI를 FastMCP로 래핑하여 표준화된 프로토콜로 제공합니다.

🎯 핵심: Gemini CLI 사용 = 비용 절감!
   - Gemini CLI: subprocess.run(['gemini', '-p', prompt, '--yolo'])
   - Gemini API 사용 ❌ (비용 높음)
   - Gemini CLI 사용 ✅ (비용 낮음)

📦 이 서버가 하는 일:
   1. MCP 프로토콜로 요청 받음 (클라이언트에서)
   2. Gemini CLI를 subprocess로 실행 (비용 절감!)
   3. CLI 결과를 MCP 프로토콜로 반환

설치:
    pip install fastmcp

실행:
    python gemini_mcp_server.py

    # STDIO 모드 (기본)
    python gemini_mcp_server.py

    # HTTP 모드
    python gemini_mcp_server.py --http --port 8000

필수 조건:
    ✅ Gemini CLI 설치 필수!
    npm install -g @google/generative-ai-cli
"""

import subprocess
import json
import sys
from pathlib import Path
from typing import Optional, Dict, Any
from fastmcp import FastMCP

# MCP 서버 초기화
mcp = FastMCP("Gemini CLI Server", version="1.0.0")


@mcp.tool
def gemini_generate(
    prompt: str,
    timeout: int = 180
) -> Dict[str, Any]:
    """
    ✅ Gemini CLI를 subprocess로 직접 실행 (API 비용 절감!)

    Args:
        prompt: 생성할 프롬프트
        timeout: 타임아웃 (초, 기본값: 180)

    Returns:
        {
            "success": bool,
            "output": str or None,
            "error": str or None
        }

    비용 구조:
        - Gemini CLI: 무료 또는 저렴 ✅
        - Gemini API: 토큰당 과금 ❌
    """
    try:
        # ✅ Gemini CLI를 subprocess로 실행 (비용 절감!)
        # 명령어: gemini -p "prompt" --yolo
        # --yolo: 자동 승인 (대화형 프롬프트 건너뛰기)
        result = subprocess.run(
            ['gemini', '-p', prompt, '--yolo'],  # ← Gemini CLI 직접 호출!
            capture_output=True,
            text=True,
            timeout=timeout
        )

        if result.returncode != 0:
            return {
                "success": False,
                "output": None,
                "error": f"Gemini CLI failed with code {result.returncode}: {result.stderr}"
            }

        return {
            "success": True,
            "output": result.stdout.strip(),
            "error": None
        }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "output": None,
            "error": f"Gemini CLI timeout after {timeout} seconds"
        }
    except FileNotFoundError:
        return {
            "success": False,
            "output": None,
            "error": "Gemini CLI not found. Install: npm install -g @google/generative-ai-cli"
        }
    except Exception as e:
        return {
            "success": False,
            "output": None,
            "error": f"Unexpected error: {str(e)}"
        }


@mcp.tool
def gemini_generate_json(
    prompt: str,
    timeout: int = 180
) -> Dict[str, Any]:
    """
    ✅ Gemini CLI를 사용하여 JSON 응답 생성 및 파싱

    Args:
        prompt: JSON을 요청하는 프롬프트
        timeout: 타임아웃 (초)

    Returns:
        {
            "success": bool,
            "data": Any (파싱된 JSON),
            "raw_output": str,
            "error": str or None
        }

    내부 동작:
        1. gemini_generate() 호출 (Gemini CLI 실행)
        2. 응답에서 JSON 추출 및 파싱
    """
    # [OK] Gemini CLI를 subprocess로 직접 실행
    try:
        cli_result = subprocess.run(
            ['gemini', '-p', prompt, '--yolo'],
            capture_output=True,
            text=True,
            timeout=timeout
        )

        if cli_result.returncode != 0:
            return {
                "success": False,
                "data": None,
                "raw_output": None,
                "error": f"Gemini CLI failed: {cli_result.stderr}"
            }

        raw_output = cli_result.stdout.strip()

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "data": None,
            "raw_output": None,
            "error": f"Gemini CLI timeout ({timeout}s)"
        }
    except FileNotFoundError:
        return {
            "success": False,
            "data": None,
            "raw_output": None,
            "error": "Gemini CLI not found"
        }
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "raw_output": None,
            "error": str(e)
        }

    # JSON 추출 시도
    try:
        # ```json ... ``` 형태에서 추출
        if '```json' in raw_output:
            start = raw_output.find('```json') + 7
            end = raw_output.find('```', start)
            json_str = raw_output[start:end].strip()
        elif '```' in raw_output:
            start = raw_output.find('```') + 3
            end = raw_output.find('```', start)
            json_str = raw_output[start:end].strip()
        else:
            json_str = raw_output

        # JSON 파싱
        data = json.loads(json_str)

        return {
            "success": True,
            "data": data,
            "raw_output": raw_output,
            "error": None
        }

    except json.JSONDecodeError as e:
        return {
            "success": False,
            "data": None,
            "raw_output": raw_output,
            "error": f"JSON parse error: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "raw_output": raw_output,
            "error": f"Unexpected error during JSON parsing: {str(e)}"
        }


@mcp.tool
def gemini_health_check() -> Dict[str, Any]:
    """
    Gemini CLI 상태 확인

    Returns:
        {
            "healthy": bool,
            "version": str or None,
            "error": str or None
        }
    """
    try:
        # Gemini CLI 버전 확인
        result = subprocess.run(
            ['gemini', '--version'],
            capture_output=True,
            text=True,
            timeout=5
        )

        if result.returncode == 0:
            return {
                "healthy": True,
                "version": result.stdout.strip(),
                "error": None
            }
        else:
            return {
                "healthy": False,
                "version": None,
                "error": f"Version check failed: {result.stderr}"
            }

    except FileNotFoundError:
        return {
            "healthy": False,
            "version": None,
            "error": "Gemini CLI not installed"
        }
    except Exception as e:
        return {
            "healthy": False,
            "version": None,
            "error": str(e)
        }


def main():
    """MCP 서버 실행"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Gemini CLI MCP Server',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # STDIO mode (default)
  python gemini_mcp_server.py

  # HTTP mode
  python gemini_mcp_server.py --http --port 8000

  # HTTP with host binding
  python gemini_mcp_server.py --http --host 0.0.0.0 --port 8000
        """
    )

    parser.add_argument('--http', action='store_true',
                       help='Run in HTTP mode instead of STDIO')
    parser.add_argument('--host', default='127.0.0.1',
                       help='HTTP host (default: 127.0.0.1)')
    parser.add_argument('--port', type=int, default=8000,
                       help='HTTP port (default: 8000)')

    args = parser.parse_args()

    # Health check 실행 (직접 subprocess로 확인)
    try:
        result = subprocess.run(
            ['gemini', '--version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            print(f"[OK] Gemini CLI {result.stdout.strip()}", file=sys.stderr)
        else:
            print(f"[WARN] Gemini CLI check failed", file=sys.stderr)
    except FileNotFoundError:
        print(f"[ERROR] Gemini CLI not installed", file=sys.stderr)
        print("   Install: npm install -g @google/generative-ai-cli", file=sys.stderr)
    except Exception as e:
        print(f"[WARN] Health check error: {e}", file=sys.stderr)

    # MCP 서버 실행
    if args.http:
        print(f"\n🚀 Starting Gemini MCP Server (HTTP mode)", file=sys.stderr)
        print(f"   Host: {args.host}", file=sys.stderr)
        print(f"   Port: {args.port}", file=sys.stderr)
        print(f"   URL: http://{args.host}:{args.port}\n", file=sys.stderr)

        mcp.run(transport="sse", host=args.host, port=args.port)
    else:
        print(f"\n🚀 Starting Gemini MCP Server (STDIO mode)\n", file=sys.stderr)
        mcp.run()


if __name__ == "__main__":
    main()
