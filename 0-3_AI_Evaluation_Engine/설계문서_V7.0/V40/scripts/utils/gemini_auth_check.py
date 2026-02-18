#!/usr/bin/env python3
"""
Gemini CLI 인증 및 설치 상태 확인 유틸리티
=========================================

⚠️ 중요: Google AI Pro 유료 계정 필수!

V40 시스템은 Gemini CLI를 사용하므로 Google AI Pro 유료 계정이 반드시 필요합니다.
무료 계정은 API quota 제한으로 인해 작동하지 않습니다.

사용법:
    from scripts.utils.gemini_auth_check import require_gemini_auth, check_gemini_cli_installed

    # 방법 1: 전체 체크 (설치 + 인증, 권장)
    require_gemini_auth()

    # 방법 2: 설치만 체크
    if not check_gemini_cli_installed():
        sys.exit(1)
"""

import sys
import subprocess
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def check_gemini_cli_installed() -> bool:
    """
    Gemini CLI 설치 상태 확인

    Returns:
        bool: 설치되어 있고 실행 가능하면 True, 아니면 False
    """
    import platform

    gemini_cmd = 'gemini.cmd' if platform.system() == 'Windows' else 'gemini'

    try:
        # Gemini CLI 버전 확인
        result = subprocess.run(
            [gemini_cmd, '--version'],
            capture_output=True,
            text=True,
            timeout=5
        )

        if result.returncode == 0:
            version = result.stdout.strip()
            logger.info(f"[CLI] ✅ Gemini CLI 설치 확인됨: {version}")
            return True
        else:
            logger.error("[CLI] ❌ Gemini CLI가 설치되어 있지 않거나 실행할 수 없습니다.")
            _show_install_guide()
            return False

    except FileNotFoundError:
        logger.error("[CLI] ❌ Gemini CLI를 찾을 수 없습니다.")
        _show_install_guide()
        return False

    except subprocess.TimeoutExpired:
        logger.error("[CLI] ❌ Gemini CLI 실행 시간 초과")
        _show_update_guide()
        return False

    except Exception as e:
        logger.error(f"[CLI] ❌ Gemini CLI 확인 중 오류: {e}")
        _show_install_guide()
        return False


def _show_install_guide():
    """Gemini CLI 설치 가이드 표시"""
    logger.error("")
    logger.error("=" * 70)
    logger.error("⚠️  Gemini CLI 설치 필요!")
    logger.error("=" * 70)
    logger.error("")
    logger.error("설치 방법:")
    logger.error("  npm install -g @google/gemini-cli")
    logger.error("")
    logger.error("설치 확인:")
    logger.error("  gemini --version")
    logger.error("")
    logger.error("=" * 70)


def _show_update_guide():
    """Gemini CLI 업데이트 가이드 표시"""
    logger.error("")
    logger.error("=" * 70)
    logger.error("⚠️  Gemini CLI 업데이트 필요!")
    logger.error("=" * 70)
    logger.error("")
    logger.error("Gemini CLI 장애 발생 시 가장 먼저 업데이트를 확인하세요!")
    logger.error("")
    logger.error("업데이트 방법:")
    logger.error("  1. 현재 버전 확인:")
    logger.error("     npm list -g @google/gemini-cli")
    logger.error("")
    logger.error("  2. 최신 버전으로 업데이트:")
    logger.error("     npm update -g @google/gemini-cli")
    logger.error("")
    logger.error("  3. 완전 재설치 (업데이트 실패 시):")
    logger.error("     npm uninstall -g @google/gemini-cli")
    logger.error("     npm install -g @google/gemini-cli")
    logger.error("")
    logger.error("  4. 업데이트 후 재실행:")
    logger.error("     python [스크립트명] [인자들]")
    logger.error("")
    logger.error("자세한 가이드:")
    logger.error("  instructions/2_collect/GEMINI_CLI_수집_가이드.md 섹션 7-1")
    logger.error("")
    logger.error("=" * 70)


def check_gemini_auth(show_guide: bool = True) -> bool:
    """
    Gemini CLI 인증 상태 확인

    ⚠️ 중요: Google AI Pro 유료 계정 필수!
    무료 계정은 API quota 제한으로 인해 작동하지 않습니다.

    Args:
        show_guide: 인증 안 되어 있을 때 가이드 표시 여부

    Returns:
        bool: 인증되어 있으면 True, 아니면 False
    """
    home_dir = Path.home()
    oauth_file = home_dir / '.gemini' / 'oauth_creds.json'

    if not oauth_file.exists():
        if show_guide:
            logger.error("")
            logger.error("=" * 70)
            logger.error("⚠️  Gemini CLI 인증이 필요합니다!")
            logger.error("=" * 70)
            logger.error("")
            logger.error("V40 시스템은 Google AI Pro 유료 계정이 필수입니다!")
            logger.error("")
            logger.error("무료 계정 문제:")
            logger.error("  ❌ API Quota 제한")
            logger.error("  ❌ 'You have exhausted your capacity' 오류")
            logger.error("  ❌ 작업 실패 및 불완전한 데이터")
            logger.error("")
            logger.error("유료 계정 인증 방법:")
            logger.error("")
            logger.error("  PowerShell에서 실행:")
            logger.error("  ─────────────────────────────────────────────────")
            logger.error("  cd C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40")
            logger.error("  $env:NO_BROWSER=\"true\"")
            logger.error("  npx @google/gemini-cli -p \"test\"")
            logger.error("  ─────────────────────────────────────────────────")
            logger.error("")
            logger.error("  그 후 브라우저에서 유료 계정으로 로그인하고")
            logger.error("  Authorization code를 터미널에 입력하세요.")
            logger.error("")
            logger.error("자세한 가이드:")
            logger.error("  instructions/2_collect/GEMINI_CLI_수집_가이드.md 섹션 2")
            logger.error("")
            logger.error("=" * 70)
        return False

    logger.info("[AUTH] ✅ Gemini CLI 인증 확인됨")
    logger.info(f"[AUTH] 인증 파일: {oauth_file}")

    # 인증 파일이 너무 오래되었는지 확인 (선택적)
    import time
    file_age_days = (time.time() - oauth_file.stat().st_mtime) / 86400
    if file_age_days > 30:
        logger.warning(f"[AUTH] ⚠️  인증이 {file_age_days:.0f}일 전에 생성되었습니다.")
        logger.warning("[AUTH] 문제 발생 시 재인증을 고려하세요.")

    return True


def require_gemini_auth():
    """
    Gemini CLI 설치 및 인증 확인 (문제 있으면 프로그램 종료)

    스크립트 시작 시 이 함수를 호출하여 다음을 확인합니다:
    1. Gemini CLI 설치 여부
    2. Gemini CLI 인증 상태

    문제가 있으면 가이드를 표시하고 프로그램을 종료합니다.

    사용법:
        from scripts.utils.gemini_auth_check import require_gemini_auth

        def main():
            require_gemini_auth()  # 설치 + 인증 확인
            # ... 나머지 코드
    """
    # 1단계: Gemini CLI 설치 확인
    if not check_gemini_cli_installed():
        logger.error("\n[FAILED] Gemini CLI가 설치되어 있지 않습니다.")
        logger.error("위의 가이드를 따라 설치한 후 다시 시도하세요.\n")
        sys.exit(1)

    # 2단계: Gemini CLI 인증 확인
    if not check_gemini_auth(show_guide=True):
        logger.error("\n[FAILED] Gemini CLI 인증이 필요합니다.")
        logger.error("위의 가이드를 따라 유료 계정으로 인증한 후 다시 시도하세요.\n")
        sys.exit(1)


if __name__ == "__main__":
    # 테스트용
    logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')

    print("\n=== Gemini CLI 인증 상태 테스트 ===\n")

    if check_gemini_auth():
        print("\n✅ 인증 완료! 스크립트를 실행할 수 있습니다.\n")
    else:
        print("\n❌ 인증 필요! 위의 가이드를 따라 인증하세요.\n")
