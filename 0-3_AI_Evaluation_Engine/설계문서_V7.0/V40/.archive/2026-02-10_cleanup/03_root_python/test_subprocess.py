#!/usr/bin/env python3
"""
Subprocess 직접 테스트
"""

import asyncio
import time

async def test_gemini_version():
    """Gemini --version subprocess 테스트"""
    print("[TEST] Starting gemini.cmd --version...")

    start = time.time()

    try:
        proc = await asyncio.create_subprocess_exec(
            "gemini.cmd",
            "--version",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await asyncio.wait_for(
            proc.communicate(),
            timeout=30
        )

        elapsed = time.time() - start

        print(f"[OK] Completed in {elapsed:.1f}s")
        print(f"[OK] Output: {stdout.decode('utf-8').strip()}")
        print(f"[OK] Exit code: {proc.returncode}")

        if stderr:
            print(f"[WARN] Stderr: {stderr.decode('utf-8')}")

    except asyncio.TimeoutError:
        elapsed = time.time() - start
        print(f"[ERROR] Timeout after {elapsed:.1f}s")

    except Exception as e:
        elapsed = time.time() - start
        print(f"[ERROR] Failed after {elapsed:.1f}s: {e}")


if __name__ == '__main__':
    asyncio.run(test_gemini_version())
