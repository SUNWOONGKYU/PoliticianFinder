#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DNS 전파 상태 확인 스크립트
Resend 이메일 인증을 위한 DNS 레코드 검증

Usage:
    python check_dns_propagation.py
"""

import subprocess
import sys
import io
from typing import Dict, List, Tuple

# Windows 콘솔 인코딩 문제 해결
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def run_command(cmd: List[str]) -> Tuple[bool, str]:
    """명령어 실행 및 결과 반환"""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=10,
            encoding='utf-8',
            errors='ignore'
        )
        return True, result.stdout
    except Exception as e:
        return False, str(e)

def check_txt_record(domain: str, expected_contains: str = None) -> Dict:
    """TXT 레코드 확인"""
    print(f"\n🔍 Checking TXT record: {domain}")

    success, output = run_command(['nslookup', '-type=TXT', domain])

    if not success:
        return {
            'status': '❌',
            'message': f'Failed to query: {output}',
            'found': False
        }

    if 'can\'t find' in output.lower() or 'non-existent' in output.lower():
        return {
            'status': '⏳',
            'message': 'DNS record not propagated yet (waiting...)',
            'found': False
        }

    if expected_contains and expected_contains in output:
        return {
            'status': '✅',
            'message': f'Found! Record exists and contains expected value',
            'found': True,
            'output': output
        }
    elif expected_contains:
        return {
            'status': '⚠️',
            'message': f'Record exists but value might be incorrect',
            'found': True,
            'output': output
        }
    else:
        return {
            'status': '✅',
            'message': 'Record exists',
            'found': True,
            'output': output
        }

def check_mx_record(domain: str, expected_server: str = None) -> Dict:
    """MX 레코드 확인"""
    print(f"\n🔍 Checking MX record: {domain}")

    success, output = run_command(['nslookup', '-type=MX', domain])

    if not success:
        return {
            'status': '❌',
            'message': f'Failed to query: {output}',
            'found': False
        }

    if 'can\'t find' in output.lower() or 'non-existent' in output.lower():
        return {
            'status': '⏳',
            'message': 'DNS record not propagated yet (waiting...)',
            'found': False
        }

    if expected_server and expected_server in output:
        return {
            'status': '✅',
            'message': f'Found! MX record points to {expected_server}',
            'found': True,
            'output': output
        }
    elif expected_server:
        return {
            'status': '⚠️',
            'message': f'Record exists but server might be incorrect',
            'found': True,
            'output': output
        }
    else:
        return {
            'status': '✅',
            'message': 'Record exists',
            'found': True,
            'output': output
        }

def main():
    """메인 실행 함수"""
    print("=" * 70)
    print("🌐 DNS 전파 상태 확인")
    print("=" * 70)
    print("\n도메인: politicianfinder.ai.kr")
    print("목적: Resend 이메일 인증 DNS 레코드 검증")
    print("=" * 70)

    results = {}

    # 1. DKIM TXT 레코드 확인
    print("\n" + "─" * 70)
    print("1️⃣  DKIM 레코드 확인 (이메일 인증)")
    print("─" * 70)
    results['dkim'] = check_txt_record(
        'resend._domainkey.politicianfinder.ai.kr',
        'p=MIGfMA0GCS'
    )
    print(f"{results['dkim']['status']} {results['dkim']['message']}")

    # 2. SPF MX 레코드 확인
    print("\n" + "─" * 70)
    print("2️⃣  SPF MX 레코드 확인 (메일 서버)")
    print("─" * 70)
    results['spf_mx'] = check_mx_record(
        'send.politicianfinder.ai.kr',
        'feedback-smtp.us-east-1.amazonses.com'
    )
    print(f"{results['spf_mx']['status']} {results['spf_mx']['message']}")

    # 3. SPF TXT 레코드 확인
    print("\n" + "─" * 70)
    print("3️⃣  SPF TXT 레코드 확인 (발송 권한)")
    print("─" * 70)
    results['spf_txt'] = check_txt_record(
        'send.politicianfinder.ai.kr',
        'v=spf1 include:amazonses.com'
    )
    print(f"{results['spf_txt']['status']} {results['spf_txt']['message']}")

    # 4. DMARC TXT 레코드 확인
    print("\n" + "─" * 70)
    print("4️⃣  DMARC 레코드 확인 (정책)")
    print("─" * 70)
    results['dmarc'] = check_txt_record(
        '_dmarc.politicianfinder.ai.kr',
        'v=DMARC1'
    )
    print(f"{results['dmarc']['status']} {results['dmarc']['message']}")

    # 최종 결과 요약
    print("\n" + "=" * 70)
    print("📊 검증 결과 요약")
    print("=" * 70)

    total = len(results)
    passed = sum(1 for r in results.values() if r['status'] == '✅')
    waiting = sum(1 for r in results.values() if r['status'] == '⏳')
    failed = sum(1 for r in results.values() if r['status'] in ['❌', '⚠️'])

    print(f"\n전체 레코드: {total}개")
    print(f"  ✅ 통과: {passed}개")
    print(f"  ⏳ 대기 중: {waiting}개")
    print(f"  ❌ 실패/경고: {failed}개")

    if passed == total:
        print("\n" + "=" * 70)
        print("🎉 모든 DNS 레코드가 성공적으로 전파되었습니다!")
        print("=" * 70)
        print("\n✅ 다음 단계:")
        print("   1. Resend 대시보드에서 도메인 검증")
        print("   2. Supabase SMTP 설정")
        print("   3. 이메일 발송 테스트")
        print("\n이제 Claude Code에게 'DNS 전파 완료'라고 알려주세요!")
        return 0
    elif waiting > 0:
        print("\n" + "=" * 70)
        print("⏳ DNS 전파 대기 중...")
        print("=" * 70)
        print("\n아직 일부 레코드가 전파되지 않았습니다.")
        print("일반적으로 10분~2시간 정도 소요됩니다.")
        print("\n💡 권장 사항:")
        print("   - 10-15분 후에 다시 이 스크립트를 실행하세요")
        print("   - 명령어: python check_dns_propagation.py")
        return 1
    else:
        print("\n" + "=" * 70)
        print("⚠️  일부 레코드에 문제가 있습니다")
        print("=" * 70)
        print("\n후이즈 DNS 설정을 다시 확인해주세요.")
        return 2

if __name__ == '__main__':
    sys.exit(main())
