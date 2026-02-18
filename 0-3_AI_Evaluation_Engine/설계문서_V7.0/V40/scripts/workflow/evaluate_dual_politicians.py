#!/usr/bin/env python3
"""
V40 Agent Teams - 2명 정치인 동시 평가
In-Process 모드로 병렬 실행
"""

import os
import sys
from pathlib import Path
import subprocess
import json
from datetime import datetime
import concurrent.futures
import argparse
from typing import Dict, List

# UTF-8 출력 설정 (Windows)
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# V40 루트
SCRIPT_DIR = Path(__file__).parent
V40_ROOT = SCRIPT_DIR.parent.parent
CORE_DIR = V40_ROOT / 'scripts' / 'core'

sys.path.insert(0, str(V40_ROOT))
from dotenv import load_dotenv
load_dotenv(V40_ROOT / '.env')

from supabase import create_client

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

def get_politician_info(politician_id: str, politician_name: str) -> Dict:
    """정치인 정보 조회"""
    # instructions/1_politicians/ 폴더에서 정보 확인
    pol_file = V40_ROOT / 'instructions' / '1_politicians' / f'{politician_name}.md'

    if not pol_file.exists():
        raise ValueError(f"정치인 정보 파일이 없습니다: {pol_file}")

    # 파일에서 정당 정보 추출 (간단히)
    content = pol_file.read_text(encoding='utf-8')
    party = '알 수 없음'

    for line in content.split('\n'):
        if '소속 정당' in line or '정당' in line:
            if '|' in line:
                parts = line.split('|')
                if len(parts) >= 2:
                    party = parts[-1].strip()
                    break

    return {
        'id': politician_id,
        'name': politician_name,
        'party': party,
        'agent_id': f"evaluator_{politician_name.lower()}"
    }

class PoliticianEvaluator:
    """정치인 평가 에이전트"""

    def __init__(self, politician: Dict):
        self.politician = politician
        self.pol_id = politician['id']
        self.pol_name = politician['name']
        self.agent_id = politician['agent_id']
        self.results = []

    def log(self, message: str):
        """로그 출력"""
        timestamp = datetime.now().strftime('%H:%M:%S')
        print(f"[{timestamp}] [{self.agent_id}] {message}")

    def validate(self) -> bool:
        """데이터 검증"""
        self.log(f"{self.pol_name} - 데이터 검증 시작")

        try:
            cmd = [
                'python',
                str(CORE_DIR / 'validate_v40_fixed.py'),
                '--politician_id', self.pol_id,
                '--politician_name', self.pol_name,
                '--no-dry-run'
            ]

            result = subprocess.run(
                cmd,
                cwd=CORE_DIR,
                capture_output=True,
                text=True,
                encoding='utf-8'
            )

            if result.returncode == 0:
                self.log(f"{self.pol_name} - 검증 완료 ✅")
                return True
            else:
                self.log(f"{self.pol_name} - 검증 실패 ❌: {result.stderr}")
                return False

        except Exception as e:
            self.log(f"{self.pol_name} - 검증 오류: {e}")
            return False

    def calculate_scores(self) -> bool:
        """점수 계산"""
        self.log(f"{self.pol_name} - 점수 계산 시작")

        try:
            cmd = [
                'python',
                str(CORE_DIR / 'calculate_v40_scores.py'),
                '--politician_id', self.pol_id,
                '--politician_name', self.pol_name
            ]

            result = subprocess.run(
                cmd,
                cwd=CORE_DIR,
                capture_output=True,
                text=True,
                encoding='utf-8'
            )

            if result.returncode == 0:
                self.log(f"{self.pol_name} - 점수 계산 완료 ✅")

                # 결과 파싱 (간단히)
                if "최종 점수:" in result.stdout:
                    for line in result.stdout.split('\n'):
                        if "최종 점수:" in line:
                            self.log(f"{self.pol_name} - {line.strip()}")

                return True
            else:
                self.log(f"{self.pol_name} - 점수 계산 실패 ❌")
                return False

        except Exception as e:
            self.log(f"{self.pol_name} - 점수 계산 오류: {e}")
            return False

    def generate_report(self) -> bool:
        """보고서 생성"""
        self.log(f"{self.pol_name} - 보고서 생성 시작")

        try:
            cmd = [
                'python',
                str(CORE_DIR / 'generate_report_v40.py'),
                '--politician_id', self.pol_id,
                '--politician_name', self.pol_name
            ]

            result = subprocess.run(
                cmd,
                cwd=CORE_DIR,
                capture_output=True,
                text=True,
                encoding='utf-8'
            )

            if result.returncode == 0:
                self.log(f"{self.pol_name} - 보고서 생성 완료 ✅")
                return True
            else:
                self.log(f"{self.pol_name} - 보고서 생성 실패 ❌")
                return False

        except Exception as e:
            self.log(f"{self.pol_name} - 보고서 생성 오류: {e}")
            return False

    def run_full_evaluation(self) -> Dict:
        """전체 평가 프로세스 실행"""
        self.log(f"{self.pol_name} - 평가 시작")
        start_time = datetime.now()

        results = {
            'politician': self.pol_name,
            'agent_id': self.agent_id,
            'steps': {},
            'success': True
        }

        # Step 1: 검증
        results['steps']['validate'] = self.validate()
        if not results['steps']['validate']:
            results['success'] = False
            self.log(f"{self.pol_name} - 검증 실패로 중단")
            return results

        # Step 2: 점수 계산
        results['steps']['calculate'] = self.calculate_scores()
        if not results['steps']['calculate']:
            results['success'] = False

        # Step 3: 보고서 생성 (선택적)
        results['steps']['report'] = self.generate_report()

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        results['duration_seconds'] = duration

        self.log(f"{self.pol_name} - 평가 완료 ({duration:.1f}초)")

        return results

def run_parallel_evaluation(politicians: List[Dict]):
    """병렬 평가 실행"""

    print("=" * 100)
    print("V40 Agent Teams - 2명 정치인 동시 평가 (In-Process 모드)")
    print("=" * 100)
    print()

    print("📊 평가 대상:")
    for pol in politicians:
        print(f"  - {pol['name']} ({pol['party']})")
    print()

    print("🚀 In-Process 모드로 병렬 실행 시작...")
    print()

    start_time = datetime.now()

    # 병렬 실행
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        # 각 정치인에 대해 에이전트 생성 및 실행
        evaluators = [PoliticianEvaluator(pol) for pol in politicians]

        # 병렬로 평가 실행
        futures = {
            executor.submit(evaluator.run_full_evaluation): evaluator
            for evaluator in evaluators
        }

        # 결과 수집
        results = []
        for future in concurrent.futures.as_completed(futures):
            evaluator = futures[future]
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                print(f"❌ {evaluator.pol_name} 평가 중 오류: {e}")

    end_time = datetime.now()
    total_duration = (end_time - start_time).total_seconds()

    # 결과 요약
    print()
    print("=" * 100)
    print("평가 완료 요약")
    print("=" * 100)
    print()

    for result in results:
        status = "✅ 성공" if result['success'] else "❌ 실패"
        print(f"{result['politician']}: {status} ({result['duration_seconds']:.1f}초)")

        for step, success in result['steps'].items():
            step_status = "✅" if success else "❌"
            print(f"  - {step}: {step_status}")

    print()
    print(f"총 소요 시간: {total_duration:.1f}초")
    print()

    # 병렬 처리 효과
    sequential_time = sum(r['duration_seconds'] for r in results)
    speedup = sequential_time / total_duration if total_duration > 0 else 1

    print(f"📈 병렬 처리 효과:")
    print(f"  순차 실행 예상 시간: {sequential_time:.1f}초")
    print(f"  병렬 실행 실제 시간: {total_duration:.1f}초")
    print(f"  속도 향상: {speedup:.2f}x")
    print()

    print("=" * 100)

    # 결과를 JSON으로 저장
    output_file = V40_ROOT / f"agent_teams_result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'politicians': politicians,
            'results': results,
            'total_duration': total_duration,
            'speedup': speedup,
            'timestamp': datetime.now().isoformat()
        }, f, indent=2, ensure_ascii=False)

    print(f"📄 결과 저장: {output_file}")

    return results

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='V40 Agent Teams - 2명 정치인 동시 평가')

    parser.add_argument('--politician1_id', required=True, help='정치인 1 ID')
    parser.add_argument('--politician1_name', required=True, help='정치인 1 이름')
    parser.add_argument('--politician2_id', required=True, help='정치인 2 ID')
    parser.add_argument('--politician2_name', required=True, help='정치인 2 이름')

    args = parser.parse_args()

    # 정치인 정보 조회
    try:
        pol1 = get_politician_info(args.politician1_id, args.politician1_name)
        pol2 = get_politician_info(args.politician2_id, args.politician2_name)

        politicians = [pol1, pol2]

        run_parallel_evaluation(politicians)

    except Exception as e:
        print(f"❌ 오류: {e}")
        sys.exit(1)
