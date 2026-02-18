#!/usr/bin/env python3
"""
V40 평가 프로세스 전체 점검 스크립트
새로운 Claude Code 세션이 평가를 진행할 때 문제가 없는지 검증
"""

import os
import sys
from pathlib import Path
import importlib.util

# UTF-8 출력 설정 (Windows)
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# V40 루트 경로
SCRIPT_DIR = Path(__file__).parent
V40_ROOT = SCRIPT_DIR.parent.parent

class ProcessVerifier:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.success = []

    def check(self, category, item, condition, error_msg=None, warning_msg=None):
        """검증 항목 체크"""
        if condition:
            self.success.append(f"[{category}] {item}")
            return True
        else:
            if error_msg:
                self.errors.append(f"[{category}] {item}: {error_msg}")
            elif warning_msg:
                self.warnings.append(f"[{category}] {item}: {warning_msg}")
            else:
                self.errors.append(f"[{category}] {item}: 실패")
            return False

    def print_results(self):
        """결과 출력"""
        print("\n" + "=" * 100)
        print("검증 결과")
        print("=" * 100)

        if self.success:
            print(f"\n✅ 성공: {len(self.success)}개")

        if self.warnings:
            print(f"\n⚠️  경고: {len(self.warnings)}개")
            for warning in self.warnings:
                print(f"  - {warning}")

        if self.errors:
            print(f"\n❌ 오류: {len(self.errors)}개")
            for error in self.errors:
                print(f"  - {error}")

        print("\n" + "=" * 100)

        if not self.errors and not self.warnings:
            print("🎉 모든 검증 통과! 평가 프로세스 실행 준비 완료!")
            return True
        elif not self.errors:
            print("⚠️  경고가 있지만 실행 가능합니다.")
            return True
        else:
            print("❌ 오류가 있습니다. 수정이 필요합니다.")
            return False

def verify_environment(verifier):
    """환경 설정 검증"""
    print("\n📋 1. 환경 설정 검증")
    print("-" * 100)

    # .env 파일 확인
    env_path = V40_ROOT / '.env'
    verifier.check(
        "환경설정",
        ".env 파일 존재",
        env_path.exists(),
        error_msg=".env 파일이 없습니다. 데이터베이스 연결 불가"
    )

    if env_path.exists():
        # .env 파일 내용 확인
        env_content = env_path.read_text(encoding='utf-8')

        verifier.check(
            "환경설정",
            "SUPABASE_URL 설정",
            "SUPABASE_URL=" in env_content,
            error_msg="SUPABASE_URL이 설정되지 않음"
        )

        verifier.check(
            "환경설정",
            "SUPABASE_SERVICE_KEY 설정",
            "SUPABASE_SERVICE_KEY=" in env_content,
            error_msg="SUPABASE_SERVICE_KEY가 설정되지 않음"
        )

    # Python 패키지 확인
    required_packages = ['supabase', 'dotenv', 'anthropic', 'openai']

    for package in required_packages:
        try:
            if package == 'dotenv':
                __import__('dotenv')
            else:
                __import__(package)
            verifier.check("환경설정", f"패키지 {package} 설치", True)
        except ImportError:
            verifier.check(
                "환경설정",
                f"패키지 {package} 설치",
                False,
                error_msg=f"pip install {package} 필요"
            )

def verify_directory_structure(verifier):
    """디렉토리 구조 검증"""
    print("\n📁 2. 디렉토리 구조 검증")
    print("-" * 100)

    required_dirs = [
        ("instructions/1_politicians", "정치인 정보"),
        ("instructions/2_collect", "수집 가이드"),
        ("instructions/3_evaluate", "평가 가이드"),
        ("scripts/core", "핵심 스크립트"),
        ("scripts/helpers", "헬퍼 스크립트"),
        ("scripts/workflow", "워크플로우 스크립트"),
        ("scripts/utils", "유틸리티 스크립트"),
        ("보고서", "보고서 저장")
    ]

    for dir_path, desc in required_dirs:
        full_path = V40_ROOT / dir_path
        verifier.check(
            "디렉토리",
            f"{desc} ({dir_path})",
            full_path.exists(),
            error_msg=f"디렉토리가 없습니다: {full_path}"
        )

def verify_documentation(verifier):
    """문서 검증"""
    print("\n📄 3. 필수 문서 검증")
    print("-" * 100)

    required_docs = [
        ("README.md", "프로젝트 개요"),
        ("CLAUDE.md", "Claude Code 작업 지침"),
        ("V40_문서_관계도.md", "문서 관계도"),
        ("instructions/V40_기본방침.md", "기본 방침"),
        ("instructions/V40_전체_프로세스_가이드.md", "전체 프로세스 가이드"),
        ("instructions/V40_오케스트레이션_가이드.md", "오케스트레이션 가이드"),
    ]

    for doc_path, desc in required_docs:
        full_path = V40_ROOT / doc_path
        verifier.check(
            "문서",
            f"{desc} ({doc_path})",
            full_path.exists(),
            error_msg=f"문서가 없습니다: {full_path}"
        )

def verify_core_scripts(verifier):
    """핵심 스크립트 검증"""
    print("\n🔧 4. 핵심 스크립트 검증")
    print("-" * 100)

    core_scripts = [
        ("scripts/core/calculate_v40_scores.py", "점수 계산"),
        ("scripts/core/generate_report_v40.py", "보고서 생성"),
        ("scripts/core/validate_v40_fixed.py", "데이터 검증"),
    ]

    for script_path, desc in core_scripts:
        full_path = V40_ROOT / script_path

        exists = full_path.exists()
        verifier.check(
            "핵심스크립트",
            f"{desc} ({script_path})",
            exists,
            error_msg=f"스크립트가 없습니다: {full_path}"
        )

        # 스크립트 문법 체크 (간단히)
        if exists:
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    code = f.read()
                compile(code, full_path, 'exec')
                verifier.check(
                    "스크립트문법",
                    f"{desc} 문법",
                    True
                )
            except SyntaxError as e:
                verifier.check(
                    "스크립트문법",
                    f"{desc} 문법",
                    False,
                    error_msg=f"문법 오류: {e}"
                )

def verify_helper_scripts(verifier):
    """헬퍼 스크립트 검증"""
    print("\n🛠️  5. 헬퍼 스크립트 검증")
    print("-" * 100)

    helper_scripts = [
        ("scripts/helpers/claude_eval_helper.py", "Claude 평가 헬퍼"),
        ("scripts/helpers/gemini_collect_helper.py", "Gemini 수집 헬퍼"),
        # Gemini 평가는 evaluate_gemini_subprocess.py에서 직접 구현 (헬퍼 불필요)
        ("scripts/helpers/codex_eval_helper.py", "ChatGPT 평가 헬퍼"),
        ("scripts/helpers/grok_eval_helper.py", "Grok 평가 헬퍼"),
    ]

    for script_path, desc in helper_scripts:
        full_path = V40_ROOT / script_path
        verifier.check(
            "헬퍼스크립트",
            f"{desc} ({script_path})",
            full_path.exists(),
            error_msg=f"스크립트가 없습니다: {full_path}"
        )

def verify_workflow_scripts(verifier):
    """워크플로우 스크립트 검증"""
    print("\n⚙️  6. 워크플로우 스크립트 검증")
    print("-" * 100)

    workflow_scripts = [
        ("scripts/workflow/collect_gemini_subprocess.py", "Gemini 수집"),
        ("scripts/workflow/collect_naver_v40_final.py", "Naver 수집"),
        ("scripts/workflow/evaluate_gemini_subprocess.py", "Gemini 평가"),
    ]

    for script_path, desc in workflow_scripts:
        full_path = V40_ROOT / script_path
        verifier.check(
            "워크플로우",
            f"{desc} ({script_path})",
            full_path.exists(),
            warning_msg=f"스크립트가 없습니다: {full_path}" if not full_path.exists() else None
        )

def verify_evaluation_guides(verifier):
    """평가 가이드 검증"""
    print("\n📖 7. 평가 가이드 검증")
    print("-" * 100)

    categories = [
        'expertise', 'leadership', 'vision', 'integrity', 'ethics',
        'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
    ]

    for i, cat in enumerate(categories, 1):
        guide_path = V40_ROOT / f"instructions/3_evaluate/cat{i:02d}_{cat}.md"
        verifier.check(
            "평가가이드",
            f"{cat} 가이드",
            guide_path.exists(),
            error_msg=f"평가 가이드가 없습니다: {guide_path}"
        )

def verify_politician_info(verifier):
    """정치인 정보 검증"""
    print("\n👤 8. 정치인 정보 검증")
    print("-" * 100)

    pol_dir = V40_ROOT / "instructions/1_politicians"

    if pol_dir.exists():
        pol_files = list(pol_dir.glob("*.md"))
        pol_files = [f for f in pol_files if f.name != "_TEMPLATE.md"]

        verifier.check(
            "정치인정보",
            "등록된 정치인 수",
            len(pol_files) > 0,
            warning_msg="등록된 정치인이 없습니다" if len(pol_files) == 0 else None
        )

        if len(pol_files) > 0:
            print(f"  등록된 정치인: {len(pol_files)}명")
            for pol_file in pol_files:
                pol_name = pol_file.stem

                # 파일 내용 간단 검증
                content = pol_file.read_text(encoding='utf-8')

                has_id = "politician_id" in content
                has_name = "성명" in content
                has_party = "소속 정당" in content

                verifier.check(
                    "정치인정보",
                    f"{pol_name} 정보 완성도",
                    has_id and has_name and has_party,
                    warning_msg=f"정보가 불완전합니다: {pol_file}" if not (has_id and has_name and has_party) else None
                )

def verify_database_connection(verifier):
    """데이터베이스 연결 검증"""
    print("\n🗄️  9. 데이터베이스 연결 검증")
    print("-" * 100)

    env_path = V40_ROOT / '.env'

    if not env_path.exists():
        verifier.check(
            "DB연결",
            "Supabase 연결 테스트",
            False,
            error_msg=".env 파일이 없어 연결 불가"
        )
        return

    try:
        from dotenv import load_dotenv
        load_dotenv(env_path)

        from supabase import create_client

        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')

        if not supabase_url or not supabase_key:
            verifier.check(
                "DB연결",
                "환경변수 로드",
                False,
                error_msg="SUPABASE_URL 또는 SUPABASE_SERVICE_KEY가 없음"
            )
            return

        supabase = create_client(supabase_url, supabase_key)

        # 테이블 존재 여부 확인
        result = supabase.table('evaluations_v40').select('id').limit(1).execute()

        verifier.check(
            "DB연결",
            "evaluations_v40 테이블 접근",
            True
        )

        # 다른 주요 테이블들도 확인
        tables = [
            'collected_data_v40',
            'ai_category_scores_v40',
            'ai_final_scores_v40'
        ]

        for table in tables:
            try:
                result = supabase.table(table).select('id').limit(1).execute()
                verifier.check(
                    "DB연결",
                    f"{table} 테이블 접근",
                    True
                )
            except Exception as e:
                verifier.check(
                    "DB연결",
                    f"{table} 테이블 접근",
                    False,
                    warning_msg=f"접근 실패: {e}"
                )

    except ImportError as e:
        verifier.check(
            "DB연결",
            "필수 패키지 import",
            False,
            error_msg=f"패키지 설치 필요: {e}"
        )
    except Exception as e:
        verifier.check(
            "DB연결",
            "Supabase 연결",
            False,
            error_msg=f"연결 실패: {e}"
        )

def verify_process_flow(verifier):
    """프로세스 흐름 검증"""
    print("\n🔄 10. 프로세스 흐름 검증")
    print("-" * 100)

    # V40_전체_프로세스_가이드.md 확인
    guide_path = V40_ROOT / "instructions/V40_전체_프로세스_가이드.md"

    if guide_path.exists():
        content = guide_path.read_text(encoding='utf-8')

        # 주요 Phase 언급 확인
        phases = [
            "Phase 0",
            "Phase 1",
            "Phase 2",
            "Phase 3",
            "Phase 4",
            "Phase 5"
        ]

        for phase in phases:
            verifier.check(
                "프로세스흐름",
                f"{phase} 설명 존재",
                phase in content,
                warning_msg=f"{phase} 설명이 없습니다"
            )

        # 필수 명령어 예시 확인
        essential_commands = [
            "collect_gemini_subprocess.py",
            "collect_naver_v40_final.py",
            "validate_v40_fixed.py",
            "calculate_v40_scores.py",
            "generate_report_v40.py"
        ]

        for cmd in essential_commands:
            verifier.check(
                "프로세스흐름",
                f"{cmd} 명령어 예시",
                cmd in content,
                warning_msg=f"{cmd} 사용법이 문서에 없습니다"
            )
    else:
        verifier.check(
            "프로세스흐름",
            "프로세스 가이드 문서",
            False,
            error_msg="V40_전체_프로세스_가이드.md가 없습니다"
        )

def verify_skill_instructions(verifier):
    """Skill 지침 검증"""
    print("\n🎯 11. Skill 지침 검증")
    print("-" * 100)

    # CLAUDE.md에서 Skill 관련 내용 확인
    claude_md = V40_ROOT / "CLAUDE.md"

    if claude_md.exists():
        content = claude_md.read_text(encoding='utf-8')

        # 배치 크기 규칙 확인
        verifier.check(
            "Skill지침",
            "배치 크기 규칙",
            "배치 크기" in content or "batch" in content,
            warning_msg="배치 크기 규칙이 명확하지 않습니다"
        )

        # Gemini CLI 프로세스 확인
        verifier.check(
            "Skill지침",
            "Gemini CLI 프로세스 설명",
            "Gemini CLI" in content,
            warning_msg="Gemini CLI 프로세스 설명이 없습니다"
        )
    else:
        verifier.check(
            "Skill지침",
            "CLAUDE.md 존재",
            False,
            error_msg="CLAUDE.md가 없습니다"
        )

def main():
    """메인 함수"""
    print("=" * 100)
    print("V40 평가 프로세스 전체 점검")
    print("새로운 Claude Code 세션이 평가를 진행할 때 문제가 없는지 검증")
    print("=" * 100)

    verifier = ProcessVerifier()

    # 각 검증 단계 실행
    verify_environment(verifier)
    verify_directory_structure(verifier)
    verify_documentation(verifier)
    verify_core_scripts(verifier)
    verify_helper_scripts(verifier)
    verify_workflow_scripts(verifier)
    verify_evaluation_guides(verifier)
    verify_politician_info(verifier)
    verify_database_connection(verifier)
    verify_process_flow(verifier)
    verify_skill_instructions(verifier)

    # 결과 출력
    success = verifier.print_results()

    return 0 if success else 1

if __name__ == '__main__':
    sys.exit(main())
