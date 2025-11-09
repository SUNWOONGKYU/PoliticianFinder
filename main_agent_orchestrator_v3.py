"""
═════════════════════════════════════════════════════════════════════════════
Main Agent Orchestrator V3 - 중앙 조정 에이전트
10개 전문화 서브 에이전트를 동적으로 로드하고 병렬 실행
═════════════════════════════════════════════════════════════════════════════

【메인 에이전트의 역할】
1. 정치인 정보 수신 (politician_id, politician_name)
2. 10개 전문화 서브 에이전트 동적 로드
   - 위치: 0-3_AI_Evaluation_Engine/커스텀_서브_에이전트/
3. ThreadPoolExecutor로 10개 워커를 이용한 병렬 실행
4. 각 카테고리 평가 결과 수집
5. 통계 집계 (출처 비율, 키워드 균형, 등급 분포)
6. Supabase에 결과 저장
   - 위치: 0-4_Database/Supabase/

【사용법】
  python main_agent_orchestrator_v3.py \\
    --politician-id 282 \\
    --politician-name "서영교" \\
    --categories "1-10" \\
    --parallel

【출력】
  evaluation_result_v3_282_YYYYMMDD_HHMMSS.json
"""

import os
import sys
import json
import argparse
import importlib.util
from typing import Dict, List, Any, Callable
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path

# ============================================================================
# 1. 경로 설정
# ============================================================================

CURRENT_DIR = Path(__file__).parent
ENGINE_DIR = CURRENT_DIR / "0-3_AI_Evaluation_Engine"
SUB_AGENTS_DIR = ENGINE_DIR / "커스텀_서브_에이전트"
DATABASE_DIR = ENGINE_DIR / "Database"
SUPABASE_DIR = DATABASE_DIR / "Supabase"

# ============================================================================
# 2. 전문화 서브 에이전트 설정
# ============================================================================

SPECIALIZED_SUB_AGENTS = {
    1: {
        "file": SUB_AGENTS_DIR / "sub_agent_category_1_expertise.py",
        "function": "run_expertise_evaluation",
        "name": "전문성과 역량 (Expertise)",
    },
    2: {
        "file": SUB_AGENTS_DIR / "sub_agent_category_2_leadership.py",
        "function": "run_leadership_evaluation",
        "name": "리더십과 관리능력 (Leadership)",
    },
    3: {
        "file": SUB_AGENTS_DIR / "sub_agent_category_3_vision.py",
        "function": "run_vision_evaluation",
        "name": "비전과 정책능력 (Vision/Policy)",
    },
    4: {
        "file": SUB_AGENTS_DIR / "sub_agent_category_4_integrity.py",
        "function": "run_integrity_evaluation",
        "name": "청렴성 (Integrity)",
    },
    5: {
        "file": SUB_AGENTS_DIR / "sub_agent_category_5_morality.py",
        "function": "run_morality_evaluation",
        "name": "윤리성 (Morality/Ethics)",
    },
    6: {
        "file": SUB_AGENTS_DIR / "sub_agent_category_6_accountability.py",
        "function": "run_accountability_evaluation",
        "name": "책임성 (Accountability)",
    },
    7: {
        "file": SUB_AGENTS_DIR / "sub_agent_category_7_transparency.py",
        "function": "run_transparency_evaluation",
        "name": "투명성 (Transparency)",
    },
    8: {
        "file": SUB_AGENTS_DIR / "sub_agent_category_8_communication.py",
        "function": "run_communication_evaluation",
        "name": "소통능력 (Communication)",
    },
    9: {
        "file": SUB_AGENTS_DIR / "sub_agent_category_9_responsiveness.py",
        "function": "run_responsiveness_evaluation",
        "name": "대응성 (Responsiveness)",
    },
    10: {
        "file": SUB_AGENTS_DIR / "sub_agent_category_10_public_interest.py",
        "function": "run_public_interest_evaluation",
        "name": "공익추구 (Public Interest)",
    },
}

# ============================================================================
# 3. 서브 에이전트 로더
# ============================================================================

class SubAgentLoader:
    """카테고리별 전문화 서브 에이전트 동적 로더"""

    def __init__(self):
        self.loaded_modules = {}  # 캐시

    def load_sub_agent(self, category: int) -> Callable:
        """전문화 서브 에이전트 로드"""
        if category in self.loaded_modules:
            return self.loaded_modules[category]

        if category not in SPECIALIZED_SUB_AGENTS:
            raise ValueError(f"카테고리 {category}에 대한 서브 에이전트가 없습니다")

        agent_config = SPECIALIZED_SUB_AGENTS[category]
        file_path = str(agent_config["file"])
        function_name = agent_config["function"]

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"서브 에이전트 파일을 찾을 수 없습니다: {file_path}")

        # 모듈 동적 로드
        spec = importlib.util.spec_from_file_location(f"category_{category}", file_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        # 함수 추출
        if not hasattr(module, function_name):
            raise AttributeError(
                f"모듈에 함수 '{function_name}'이 없습니다: {file_path}"
            )

        func = getattr(module, function_name)
        self.loaded_modules[category] = func

        return func

    def call_sub_agent(
        self,
        category: int,
        politician_id: int,
        politician_name: str,
        verbose: bool = False,
    ) -> Dict[str, Any]:
        """전문화 서브 에이전트 호출"""
        func = self.load_sub_agent(category)
        return func(
            politician_id=politician_id,
            politician_name=politician_name,
            verbose=verbose,
        )

# ============================================================================
# 4. 통계 클래스
# ============================================================================

class EvaluationStatistics:
    """평가 통계"""

    def __init__(self):
        self.total_items = 0
        self.total_official = 0
        self.total_public = 0
        self.total_negative = 0
        self.total_positive = 0
        self.category_results = {}

    def add_result(self, category: int, result: Dict[str, Any]):
        """카테고리 결과 추가"""
        self.category_results[category] = result
        self.total_items += result.get("total_items", 0)
        self.total_official += int(result.get("official_ratio", 0) * result.get("total_items", 0))
        self.total_public += int(result.get("public_ratio", 0) * result.get("total_items", 0))
        self.total_negative += int(result.get("negative_ratio", 0) * result.get("total_items", 0))
        self.total_positive += int(result.get("positive_ratio", 0) * result.get("total_items", 0))

    def get_summary(self) -> Dict[str, Any]:
        """요약 통계"""
        if self.total_items == 0:
            return {
                "total_items": 0,
                "official_ratio": 0,
                "public_ratio": 0,
                "negative_ratio": 0,
                "positive_ratio": 0,
            }

        return {
            "total_items": self.total_items,
            "official_ratio": self.total_official / self.total_items,
            "public_ratio": self.total_public / self.total_items,
            "negative_ratio": self.total_negative / self.total_items,
            "positive_ratio": self.total_positive / self.total_items,
        }

# ============================================================================
# 5. 서브 에이전트 실행 함수
# ============================================================================

def execute_specialized_sub_agent(
    loader: SubAgentLoader,
    politician_id: int,
    politician_name: str,
    category: int,
) -> Dict[str, Any]:
    """전문화 서브 에이전트 실행"""
    try:
        print(f"  ▶ 카테고리 {category} (전문화 서브 에이전트) 시작...")

        result = loader.call_sub_agent(
            category=category,
            politician_id=politician_id,
            politician_name=politician_name,
            verbose=False,
        )

        total_count = result.get("total_items", 0)
        status = result.get("status", "오류")

        if status == "완료" and total_count > 0:
            print(f"  ✅ 카테고리 {category} 완료: {total_count}개 항목")
            return result
        else:
            print(f"  ⚠️  카테고리 {category} 미달: {total_count}개")
            return result

    except FileNotFoundError as e:
        print(f"  ⏭️  카테고리 {category}: 전문화 서브 에이전트 없음")
        return {
            "status": "건너뜀",
            "category": category,
            "error": str(e),
            "total_items": 0,
        }
    except Exception as e:
        error_msg = f"카테고리 {category} 오류: {str(e)}"
        print(f"  ❌ {error_msg}")
        return {
            "status": "오류",
            "category": category,
            "error": error_msg,
            "total_items": 0,
        }

# ============================================================================
# 6. 병렬 실행 함수
# ============================================================================

def execute_all_categories_parallel(
    loader: SubAgentLoader,
    politician_id: int,
    politician_name: str,
    categories: List[int] = None,
) -> Dict[int, Dict[str, Any]]:
    """모든 카테고리를 병렬로 실행"""
    if categories is None:
        categories = list(range(1, 11))

    num_workers = min(10, len(categories))

    print(f"\n【병렬 실행】{len(categories)}개 카테고리 (전문화 서브 에이전트)")
    print(f"  워커 수: {num_workers}")
    print("=" * 70)

    results = {}
    start_time = datetime.now()

    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        future_to_category = {
            executor.submit(
                execute_specialized_sub_agent,
                loader=loader,
                politician_id=politician_id,
                politician_name=politician_name,
                category=cat,
            ): cat
            for cat in categories
        }

        completed = 0
        for future in as_completed(future_to_category):
            category = future_to_category[future]
            result = future.result()
            results[category] = result
            completed += 1

            progress = f"[{completed}/{len(categories)}]"
            status_emoji = "✅" if result.get("status") == "완료" else (
                "⏭️" if result.get("status") == "건너뜀" else "⚠️"
            )
            print(f"{progress} {status_emoji} 카테고리 {category} 완료")

    elapsed = (datetime.now() - start_time).total_seconds()
    print(f"\n【병렬 실행 완료】소요 시간: {elapsed:.1f}초")

    return results

# ============================================================================
# 7. 메인 오케스트레이션 함수
# ============================================================================

def orchestrate_evaluation_v3(
    politician_id: int,
    politician_name: str,
    categories: List[int] = None,
    parallel: bool = True,
) -> Dict[str, Any]:
    """메인 오케스트레이터 V3 - 전문화 서브 에이전트 호출"""
    start_time = datetime.now()

    if categories is None:
        categories = list(range(1, 11))

    print("\n" + "=" * 70)
    print("【메인 에이전트 오케스트레이터 V3】")
    print("(전문화 카테고리별 서브 에이전트 호출 방식)")
    print(f"정치인: {politician_name} (ID: {politician_id})")
    print(f"카테고리: {len(categories)}개")
    print(f"실행 모드: {'병렬' if parallel else '순차'}")
    print(f"서브 에이전트 위치: {SUB_AGENTS_DIR}")
    print(f"데이터베이스 위치: {SUPABASE_DIR}")
    print("=" * 70)

    # 【서브 에이전트 로더 초기화】
    loader = SubAgentLoader()

    # 【카테고리 실행】
    if parallel:
        category_results = execute_all_categories_parallel(
            loader=loader,
            politician_id=politician_id,
            politician_name=politician_name,
            categories=categories,
        )
    else:
        category_results = {}
        print(f"\n【순차 실행】{len(categories)}개 카테고리")
        for i, category in enumerate(categories, 1):
            result = execute_specialized_sub_agent(
                loader=loader,
                politician_id=politician_id,
                politician_name=politician_name,
                category=category,
            )
            category_results[category] = result
            print(f"[{i}/{len(categories)}] 카테고리 {category} 완료")

    # 【결과 집계】
    stats = EvaluationStatistics()
    completed_count = 0
    skipped_count = 0
    error_count = 0

    for category in sorted(category_results.keys()):
        result = category_results[category]
        status = result.get("status", "오류")

        if status == "완료":
            stats.add_result(category, result)
            completed_count += 1
        elif status == "건너뜀":
            skipped_count += 1
        else:
            error_count += 1

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    # 【최종 상태 결정】
    if error_count == 0 and completed_count > 0:
        final_status = "부분완료" if skipped_count > 0 else "완료"
    elif completed_count > 0:
        final_status = "부분완료"
    else:
        final_status = "오류"

    summary_stats = stats.get_summary()

    # 【최종 보고서】
    result = {
        "status": final_status,
        "politician_id": politician_id,
        "politician_name": politician_name,
        "categories_total": len(categories),
        "categories_completed": completed_count,
        "categories_skipped": skipped_count,
        "categories_error": error_count,
        "total_items": summary_stats["total_items"],
        "official_ratio": summary_stats["official_ratio"],
        "public_ratio": summary_stats["public_ratio"],
        "negative_ratio": summary_stats["negative_ratio"],
        "positive_ratio": summary_stats["positive_ratio"],
        "results": category_results,
        "statistics": summary_stats,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "duration_seconds": duration,
    }

    # 【콘솔 출력】
    print(f"\n" + "=" * 70)
    print(f"【최종 보고서】{politician_name} 평가 완료")
    print("=" * 70)
    print(f"상태: {final_status}")
    print(f"완료 카테고리: {completed_count}/{len(categories)}")
    print(f"건너뜬 카테고리: {skipped_count} (아직 생성 안됨)")
    print(f"오류 카테고리: {error_count}")

    if summary_stats["total_items"] > 0:
        print(f"\n【데이터 통계】")
        print(f"  총 항목 수: {summary_stats['total_items']}개")
        print(f"  공식 출처: {summary_stats['official_ratio']*100:.1f}%")
        print(f"  공개 출처: {summary_stats['public_ratio']*100:.1f}%")
        print(f"  부정: {summary_stats['negative_ratio']*100:.1f}%")
        print(f"  긍정: {summary_stats['positive_ratio']*100:.1f}%")

    print(f"\n소요 시간: {duration:.1f}초")
    print("=" * 70)

    return result

# ============================================================================
# 8. 커맨드라인 인터페이스
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Main Agent Orchestrator V3 (Specialized Sub-agents)"
    )
    parser.add_argument("--politician-id", type=int, required=True, help="Politician ID")
    parser.add_argument("--politician-name", type=str, required=True, help="Politician Name")
    parser.add_argument("--categories", type=str, default="1-10", help="Categories (e.g., '1-10')")
    parser.add_argument("--parallel", action="store_true", default=True, help="Use parallel execution")
    parser.add_argument("--sequential", action="store_true", help="Use sequential execution")

    args = parser.parse_args()

    # 카테고리 파싱
    if "-" in args.categories:
        start, end = args.categories.split("-")
        categories = list(range(int(start), int(end) + 1))
    else:
        categories = [int(c.strip()) for c in args.categories.split(",")]

    parallel_mode = not args.sequential

    result = orchestrate_evaluation_v3(
        politician_id=args.politician_id,
        politician_name=args.politician_name,
        categories=categories,
        parallel=parallel_mode,
    )

    # 결과 저장
    output_file = (
        CURRENT_DIR / f"evaluation_result_v3_{args.politician_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    )
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"\n결과 저장: {output_file}")

    return result

if __name__ == "__main__":
    main()
