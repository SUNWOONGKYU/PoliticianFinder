#!/usr/bin/env python3
"""
Gemini CLI Production MCP Server
=================================

[PRODUCTION-READY] Gemini CLI MCP 서버 (Perplexity 연구 결과 적용)

핵심 개선사항:
1. @mcp.tool 함수를 헬퍼 클래스로 분리 (FunctionTool 오류 해결)
2. Windows subprocess 올바른 처리 (gemini.cmd, platform 체크)
3. HTTP Stateless 모드 (100+ 동시 요청 대응)
4. 완전한 에러 처리 (FileNotFoundError, TimeoutError, 비정상 종료)
5. asyncio.wait_for() 타임아웃 처리

비용 구조:
    - Gemini CLI 사용 = 무료/저렴 [OK]
    - Gemini API 직접 사용 = 비쌈 [ERROR]

설치:
    pip install fastmcp

실행:
    # 개발 모드 (STDIO)
    python gemini_mcp_server_production.py

    # 프로덕션 모드 (HTTP Stateless)
    python gemini_mcp_server_production.py --http --port 8000

    # Gunicorn 배포 (권장)
    gunicorn -k uvicorn.workers.UvicornWorker \
      --workers 9 \
      --bind 0.0.0.0:8000 \
      --timeout 120 \
      server:app

필수 조건:
    Gemini CLI 설치: npm install -g @google/generative-ai-cli
"""

import asyncio
import json
import logging
import os
import platform
import shutil
import sys
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastmcp import FastMCP

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)


class GeminiErrorType(Enum):
    """Gemini CLI 오류 타입"""
    NOT_FOUND = "gemini_cli_not_found"
    TIMEOUT = "execution_timeout"
    ERROR_OUTPUT = "gemini_error"
    UNEXPECTED_FAILURE = "unexpected_failure"


@dataclass
class GeminiExecutionResult:
    """Gemini CLI 실행 결과"""
    success: bool
    output: str
    error_type: Optional[GeminiErrorType] = None
    error_message: Optional[str] = None


class GeminiCLIWrapper:
    """
    [OK] Gemini CLI Wrapper (헬퍼 클래스)

    @mcp.tool 함수에서 재사용 가능한 헬퍼 클래스
    실제 subprocess 실행 로직 포함
    """

    def __init__(self, default_timeout: int = 600):
        """
        Args:
            default_timeout: 기본 타임아웃 (초)
        """
        self.default_timeout = default_timeout
        self.is_windows = platform.system() == "Windows"
        self.gemini_path = self._find_gemini_executable()

        logger.info(f"[OK] Gemini CLI found at: {self.gemini_path}")
        logger.info(f"[OK] Platform: {platform.system()}")

    def _find_gemini_executable(self) -> str:
        """
        Gemini CLI 실행 파일 찾기 (Windows/Linux/Mac 모두 대응)

        Returns:
            Gemini CLI 전체 경로

        Raises:
            RuntimeError: Gemini CLI를 찾을 수 없을 때
        """
        if self.is_windows:
            # Windows: gemini.cmd, gemini.exe, gemini 순서로 검색
            for name in ["gemini.cmd", "gemini.exe", "gemini"]:
                path = shutil.which(name)
                if path:
                    return path

            raise RuntimeError(
                "Gemini CLI not found on Windows. "
                "Install: npm install -g @google/generative-ai-cli"
            )
        else:
            # Linux/Mac: gemini 검색
            path = shutil.which("gemini")
            if path:
                return path

            raise RuntimeError(
                "Gemini CLI not found. "
                "Install: npm install -g @google/generative-ai-cli"
            )

    async def execute_command(
        self,
        *args,
        timeout: Optional[int] = None
    ) -> GeminiExecutionResult:
        """
        [OK] Gemini CLI 명령어 실행 (완전한 에러 처리)

        Args:
            *args: Gemini CLI 인자들 (예: "-p", "prompt", "--yolo")
            timeout: 타임아웃 (초), None이면 default_timeout 사용

        Returns:
            GeminiExecutionResult (success, output, error_type, error_message)

        Examples:
            >>> wrapper = GeminiCLIWrapper()
            >>> result = await wrapper.execute_command("-p", "Hello", "--yolo")
            >>> if result.success:
            >>>     print(result.output)
        """
        timeout = timeout or self.default_timeout
        cmd = [self.gemini_path] + list(args)

        logger.debug(f"[EXEC] {' '.join(cmd)}")

        try:
            # asyncio subprocess 생성 (non-blocking)
            # ① Node.js 메모리 제한으로 버퍼 크기 조절
            env = {**os.environ, "NODE_OPTIONS": "--max-old-space-size=512"}

            proc = await asyncio.create_subprocess_exec(
                cmd[0],
                *cmd[1:],
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=env
            )

            try:
                # ② 실시간 stdout 읽기 (버퍼 밀림 방지!)
                async def read_stream_realtime():
                    """stdout을 실시간으로 줄 단위 읽기"""
                    output_lines = []
                    async for line in proc.stdout:
                        output_lines.append(line.decode('utf-8', errors='replace'))
                    return "".join(output_lines)

                async def read_stderr_realtime():
                    """stderr를 실시간으로 읽기"""
                    error_lines = []
                    async for line in proc.stderr:
                        error_lines.append(line.decode('utf-8', errors='replace'))
                    return "".join(error_lines)

                # 타임아웃과 함께 실시간 읽기
                stdout_task = asyncio.create_task(read_stream_realtime())
                stderr_task = asyncio.create_task(read_stderr_realtime())

                # 프로세스 완료 대기 (타임아웃 적용)
                await asyncio.wait_for(proc.wait(), timeout=timeout)

                # stdout/stderr 읽기 완료
                stdout = await stdout_task
                stderr = await stderr_task

            except asyncio.TimeoutError:
                # 타임아웃 발생 시 프로세스 종료
                try:
                    proc.kill()
                    # 읽기 태스크도 취소
                    stdout_task.cancel()
                    stderr_task.cancel()
                except ProcessLookupError:
                    pass  # 이미 종료됨

                logger.warning(f"[TIMEOUT] {timeout}s")
                return GeminiExecutionResult(
                    success=False,
                    output="",
                    error_type=GeminiErrorType.TIMEOUT,
                    error_message=f"Command timed out after {timeout} seconds"
                )

            # 이미 디코딩됨 (실시간 읽기에서 처리)
            stdout_text = stdout
            stderr_text = stderr

            # 비정상 종료 코드 체크
            if proc.returncode != 0:
                logger.error(f"[ERROR] Exit code: {proc.returncode}")
                logger.error(f"[ERROR] Stderr: {stderr_text}")

                return GeminiExecutionResult(
                    success=False,
                    output=stdout_text,
                    error_type=GeminiErrorType.ERROR_OUTPUT,
                    error_message=stderr_text or f"Exit code: {proc.returncode}"
                )

            logger.debug(f"[OK] Success")
            return GeminiExecutionResult(
                success=True,
                output=stdout_text
            )

        except FileNotFoundError:
            logger.error("[ERROR] Gemini CLI not found")
            return GeminiExecutionResult(
                success=False,
                output="",
                error_type=GeminiErrorType.NOT_FOUND,
                error_message="Gemini CLI not found in PATH"
            )

        except Exception as e:
            logger.exception(f"[ERROR] Unexpected error: {e}")
            return GeminiExecutionResult(
                success=False,
                output="",
                error_type=GeminiErrorType.UNEXPECTED_FAILURE,
                error_message=f"Unexpected error: {str(e)}"
            )


# MCP 서버 초기화 (HTTP Stateless 모드)
mcp = FastMCP(
    name="Gemini CLI Server (Production)",
    version="2.0.0",
    stateless_http=True  # 100+ 동시 요청 대응
)


@mcp.tool
async def gemini_generate(
    prompt: str,
    timeout: int = 600  # 기본 타임아웃 10분 (600초)
) -> Dict[str, Any]:
    """
    [OK] Gemini CLI로 텍스트 생성

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
        - Gemini CLI: 무료 또는 저렴 [OK]
        - Gemini API: 토큰당 과금 [ERROR]
    """
    wrapper = GeminiCLIWrapper()
    result = await wrapper.execute_command("-p", prompt, "--yolo", timeout=timeout)

    if not result.success:
        # 오류 타입별 메시지
        if result.error_type == GeminiErrorType.NOT_FOUND:
            return {
                "success": False,
                "output": None,
                "error": "Gemini CLI is not installed. Please install it first."
            }
        elif result.error_type == GeminiErrorType.TIMEOUT:
            return {
                "success": False,
                "output": None,
                "error": f"Gemini operation timed out: {result.error_message}"
            }
        else:
            return {
                "success": False,
                "output": None,
                "error": f"Gemini operation failed: {result.error_message}"
            }

    return {
        "success": True,
        "output": result.output,
        "error": None
    }


@mcp.tool
async def gemini_generate_json(
    prompt: str,
    timeout: int = 180
) -> Dict[str, Any]:
    """
    [OK] Gemini CLI로 JSON 응답 생성 및 파싱

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
    wrapper = GeminiCLIWrapper()
    result = await wrapper.execute_command("-p", prompt, "--yolo", timeout=timeout)

    if not result.success:
        # 오류 타입별 메시지
        error_msg = result.error_message
        if result.error_type == GeminiErrorType.NOT_FOUND:
            error_msg = "Gemini CLI not installed"
        elif result.error_type == GeminiErrorType.TIMEOUT:
            error_msg = f"Timeout ({timeout}s)"

        return {
            "success": False,
            "data": None,
            "raw_output": None,
            "error": error_msg
        }

    raw_output = result.output

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
async def gemini_health_check() -> Dict[str, Any]:
    """
    [OK] Gemini CLI 상태 확인

    Returns:
        {
            "healthy": bool,
            "version": str or None,
            "platform": str,
            "gemini_path": str or None,
            "error": str or None
        }
    """
    try:
        wrapper = GeminiCLIWrapper()
        result = await wrapper.execute_command("--version", timeout=15)  # 6초 걸리므로 15초로 증가

        if result.success:
            return {
                "healthy": True,
                "version": result.output.strip(),
                "platform": platform.system(),
                "gemini_path": wrapper.gemini_path,
                "error": None
            }
        else:
            return {
                "healthy": False,
                "version": None,
                "platform": platform.system(),
                "gemini_path": None,
                "error": result.error_message
            }

    except Exception as e:
        return {
            "healthy": False,
            "version": None,
            "platform": platform.system(),
            "gemini_path": None,
            "error": str(e)
        }


def main():
    """MCP 서버 실행 (개발/프로덕션 모드)"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Gemini CLI Production MCP Server',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # 개발 모드 (STDIO)
  python gemini_mcp_server_production.py

  # 프로덕션 모드 (HTTP Stateless)
  python gemini_mcp_server_production.py --http --port 8000

  # Gunicorn 배포 (권장)
  gunicorn -k uvicorn.workers.UvicornWorker \\
    --workers 9 \\
    --bind 0.0.0.0:8000 \\
    --timeout 120 \\
    server:app
        """
    )

    parser.add_argument('--http', action='store_true',
                       help='Run in HTTP mode (stateless)')
    parser.add_argument('--host', default='127.0.0.1',
                       help='HTTP host (default: 127.0.0.1)')
    parser.add_argument('--port', type=int, default=8000,
                       help='HTTP port (default: 8000)')

    args = parser.parse_args()

    # Health check 실행 (시작 시)
    try:
        wrapper = GeminiCLIWrapper()
        logger.info(f"[OK] Gemini CLI ready: {wrapper.gemini_path}")
    except RuntimeError as e:
        logger.error(f"[ERROR] {e}")
        sys.exit(1)
    except Exception as e:
        logger.warning(f"[WARN] Health check error: {e}")

    # MCP 서버 실행
    if args.http:
        logger.info(f"[HTTP] Starting Gemini MCP Server (Stateless)")
        logger.info(f"   Host: {args.host}")
        logger.info(f"   Port: {args.port}")
        logger.info(f"   URL: http://{args.host}:{args.port}")

        mcp.run(transport="sse", host=args.host, port=args.port)
    else:
        logger.info(f"[STDIO] Starting Gemini MCP Server")
        mcp.run()


# Gunicorn용 ASGI app export
app = mcp.http_app()


if __name__ == "__main__":
    main()
