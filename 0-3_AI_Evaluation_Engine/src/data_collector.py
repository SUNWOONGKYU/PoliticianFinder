"""
PoliticianFinder AI Evaluation Engine V2.0
데이터 수집 스크립트 (Claude AI - 10개 서브 에이전트 병렬 처리)

작성일: 2025-10-26
버전: 2.0

핵심 기능:
- Claude AI 기반 데이터 수집
- 10개 분야별 병렬 처리 (10개 서브 에이전트)
- Supabase 직접 저장 (JSON 파일 제거)
- Bayesian Prior 7.0 자동 계산 (DB 트리거)
- 최소 10개 데이터 수집 노력 (최선)
"""

import os
import asyncio
from typing import List, Dict, Optional
from datetime import datetime
from supabase import create_client, Client
from anthropic import Anthropic

# ============================================================================
# 설정
# ============================================================================

# Supabase 설정
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Anthropic 설정
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# 수집 설정
MIN_DATA_PER_ITEM = 10  # 항목당 최소 수집 목표 (최선)
MAX_ATTEMPTS_PER_ITEM = 20  # 항목당 최대 시도 횟수

# 100개 평가 항목 정의 (카테고리별 10개씩)
EVALUATION_CATEGORIES = {
    1: "청렴성 (Integrity)",
    2: "전문성 (Professional Competence)",
    3: "소통능력 (Communication)",
    4: "정책능력 (Policy Making)",
    5: "리더십 (Leadership)",
    6: "책임성 (Accountability)",
    7: "투명성 (Transparency)",
    8: "혁신성 (Innovation)",
    9: "포용성 (Inclusiveness)",
    10: "효율성 (Efficiency)"
}

# ============================================================================
# Supabase & Anthropic 클라이언트 초기화
# ============================================================================

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)

# ============================================================================
# 데이터 수집 함수
# ============================================================================

async def collect_single_data(
    politician_id: str,
    politician_name: str,
    job_type: str,
    category_num: int,
    item_num: int,
    ai_name: str,
    attempt: int
) -> Optional[Dict]:
    """
    단일 데이터 수집 (AI API 호출)

    Args:
        politician_id: 정치인 ID
        politician_name: 정치인 이름
        job_type: 직종 (국회의원, 광역단체장 등)
        category_num: 분야 번호 (1~10)
        item_num: 항목 번호 (1~10)
        ai_name: AI 이름 (Claude)
        attempt: 시도 번호 (중복 방지)

    Returns:
        수집된 데이터 딕셔너리 또는 None
    """

    category_name = EVALUATION_CATEGORIES[category_num]

    # AI 프롬프트 구성
    prompt = f"""
당신은 대한민국 정치인 평가 전문가입니다.

정치인: {politician_name} ({job_type})
평가 분야: {category_name}
평가 항목: {category_num}-{item_num}

다음 작업을 수행하세요:

1. 해당 정치인의 {category_name} 관련 데이터를 1개 수집하세요.
2. 뉴스 기사, 공식 기록, 통계 등 신뢰할 수 있는 출처에서 수집하세요.
3. 수집한 데이터를 기반으로 0.0~1.0 사이의 점수를 매기세요.
   - 1.0 = 매우 좋음 (긍정적)
   - 0.5 = 보통
   - 0.0 = 매우 나쁨 (부정적)

4. 다음 JSON 형식으로 응답하세요:
{{
    "title": "데이터 제목 (예: 법안 발의 20건)",
    "content": "데이터 내용 요약 (100자 이내)",
    "url": "출처 URL",
    "score": 0.85,
    "reliability": 0.9,
    "data_type": "뉴스/공식기록/통계"
}}

중요: 이전 시도({attempt}번째)와 다른 새로운 데이터를 수집하세요.
중요: 데이터가 없으면 "NO_DATA"라고만 응답하세요.
"""

    try:
        # Claude API 호출
        message = anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        response_text = message.content[0].text.strip()

        # 데이터 없음 처리
        if "NO_DATA" in response_text:
            return None

        # JSON 파싱
        import json

        # JSON 추출 (```json ... ``` 형식 처리)
        if "```json" in response_text:
            json_start = response_text.find("```json") + 7
            json_end = response_text.find("```", json_start)
            json_text = response_text[json_start:json_end].strip()
        elif "```" in response_text:
            json_start = response_text.find("```") + 3
            json_end = response_text.find("```", json_start)
            json_text = response_text[json_start:json_end].strip()
        else:
            json_text = response_text

        data = json.loads(json_text)

        # 필수 필드 검증
        required_fields = ["title", "content", "url", "score", "reliability", "data_type"]
        for field in required_fields:
            if field not in data:
                print(f"  ❌ 필수 필드 누락: {field}")
                return None

        # 점수 범위 검증
        if not (0.0 <= data["score"] <= 1.0):
            print(f"  ❌ 점수 범위 오류: {data['score']}")
            return None

        return data

    except Exception as e:
        print(f"  ❌ AI API 오류: {e}")
        return None


async def collect_item_data(
    politician_id: str,
    politician_name: str,
    job_type: str,
    category_num: int,
    item_num: int,
    ai_name: str = "Claude"
) -> List[Dict]:
    """
    단일 항목 데이터 수집 (최소 10개 목표)

    Args:
        politician_id: 정치인 ID
        politician_name: 정치인 이름
        job_type: 직종
        category_num: 분야 번호
        item_num: 항목 번호
        ai_name: AI 이름

    Returns:
        수집된 데이터 리스트
    """

    print(f"\n  항목 {category_num}-{item_num} 수집 시작 (목표: {MIN_DATA_PER_ITEM}개)")

    collected = []
    attempt = 0

    while len(collected) < MIN_DATA_PER_ITEM and attempt < MAX_ATTEMPTS_PER_ITEM:
        attempt += 1

        # AI에게 데이터 수집 요청
        data = await collect_single_data(
            politician_id,
            politician_name,
            job_type,
            category_num,
            item_num,
            ai_name,
            attempt
        )

        if data:
            # Supabase 저장
            try:
                supabase.table('collected_data').insert({
                    'politician_id': politician_id,
                    'ai_name': ai_name,
                    'category_num': category_num,
                    'item_num': item_num,
                    'data_type': data['data_type'],
                    'data_title': data['title'],
                    'data_content': data['content'],
                    'data_url': data['url'],
                    'data_score': data['score'],
                    'reliability': data['reliability']
                }).execute()

                collected.append(data)
                print(f"    ✓ [{len(collected)}/{MIN_DATA_PER_ITEM}] {data['title'][:50]}...")

            except Exception as e:
                print(f"    ❌ DB 저장 오류: {e}")
        else:
            # 더 이상 데이터 없음
            if attempt >= 5:
                print(f"    ⚠️  데이터 고갈 (시도 {attempt}회)")
                break

    # 결과 요약
    if len(collected) >= MIN_DATA_PER_ITEM:
        print(f"  ✅ 완료: {len(collected)}개 수집")
    elif len(collected) > 0:
        print(f"  ⚠️  부족: {len(collected)}개만 수집 (목표: {MIN_DATA_PER_ITEM}개)")
    else:
        print(f"  🚫 실패: 데이터 없음")

    return collected


async def collect_category_data(
    politician_id: str,
    politician_name: str,
    job_type: str,
    category_num: int,
    ai_name: str = "Claude"
) -> Dict:
    """
    단일 분야 데이터 수집 (10개 항목)

    Args:
        politician_id: 정치인 ID
        politician_name: 정치인 이름
        job_type: 직종
        category_num: 분야 번호
        ai_name: AI 이름

    Returns:
        수집 결과 딕셔너리
    """

    category_name = EVALUATION_CATEGORIES[category_num]
    print(f"\n{'='*60}")
    print(f"분야 {category_num}: {category_name}")
    print(f"{'='*60}")

    total_collected = 0

    # 10개 항목 순차 수집
    for item_num in range(1, 11):
        collected = await collect_item_data(
            politician_id,
            politician_name,
            job_type,
            category_num,
            item_num,
            ai_name
        )
        total_collected += len(collected)

    print(f"\n분야 {category_num} 완료: 총 {total_collected}개 데이터 수집")

    return {
        'category_num': category_num,
        'category_name': category_name,
        'total_collected': total_collected,
        'target': MIN_DATA_PER_ITEM * 10
    }


async def collect_politician_data(
    politician_id: str,
    politician_name: str,
    job_type: str,
    ai_name: str = "Claude"
) -> Dict:
    """
    단일 정치인 전체 데이터 수집 (100개 항목, 10개 분야 병렬)

    Args:
        politician_id: 정치인 ID
        politician_name: 정치인 이름
        job_type: 직종
        ai_name: AI 이름

    Returns:
        수집 결과 딕셔너리
    """

    print("\n" + "="*60)
    print(f"정치인: {politician_name} ({job_type})")
    print(f"AI: {ai_name}")
    print(f"목표: 100개 항목 × {MIN_DATA_PER_ITEM}개 = {MIN_DATA_PER_ITEM * 100}개 데이터")
    print("="*60)

    start_time = datetime.now()

    # 10개 분야 병렬 처리 (서브 에이전트)
    tasks = []
    for category_num in range(1, 11):
        task = collect_category_data(
            politician_id,
            politician_name,
            job_type,
            category_num,
            ai_name
        )
        tasks.append(task)

    # 병렬 실행
    results = await asyncio.gather(*tasks)

    # 결과 집계
    total_collected = sum([r['total_collected'] for r in results])
    total_target = MIN_DATA_PER_ITEM * 100

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    print("\n" + "="*60)
    print("🎉 수집 완료!")
    print("="*60)
    print(f"정치인: {politician_name}")
    print(f"수집 데이터: {total_collected}개 (목표: {total_target}개)")
    print(f"소요 시간: {duration:.1f}초")
    print(f"속도: {total_collected / duration:.1f}개/초")
    print("="*60)

    return {
        'politician_id': politician_id,
        'politician_name': politician_name,
        'total_collected': total_collected,
        'total_target': total_target,
        'duration': duration,
        'results': results
    }


async def get_politician_scores(politician_id: str) -> Dict:
    """
    정치인 점수 조회 (DB 트리거가 자동 계산)

    Args:
        politician_id: 정치인 ID

    Returns:
        점수 정보 딕셔너리
    """

    try:
        # AI별 최종 점수 조회
        ai_scores = supabase.table('ai_final_scores').select('*').eq(
            'politician_id', politician_id
        ).execute()

        # 종합 최종 점수 조회
        combined_score = supabase.table('combined_final_scores').select('*').eq(
            'politician_id', politician_id
        ).single().execute()

        return {
            'ai_scores': ai_scores.data,
            'combined_score': combined_score.data
        }

    except Exception as e:
        print(f"❌ 점수 조회 오류: {e}")
        return None


def print_politician_scores(politician_name: str, scores: Dict):
    """
    정치인 점수 출력

    Args:
        politician_name: 정치인 이름
        scores: 점수 딕셔너리
    """

    if not scores:
        print("점수 없음")
        return

    print("\n" + "="*60)
    print(f"📊 {politician_name} 평가 결과")
    print("="*60)

    # 종합 점수
    combined = scores['combined_score']
    print(f"\n종합 점수: {combined['combined_score']}점")
    print(f"등급: {combined['grade_emoji']} {combined['grade_name']} ({combined['grade_code']})")
    print(f"평가 AI: {combined['ai_count']}개")

    # AI별 점수
    print(f"\nAI별 상세:")
    for ai_score in scores['ai_scores']:
        print(f"  {ai_score['ai_name']}: {ai_score['total_score']}점 "
              f"{ai_score['grade_emoji']} {ai_score['grade_name']}")
        print(f"    분야: {ai_score['categories_completed']}/10, "
              f"항목: {ai_score['items_completed']}/100, "
              f"데이터: {ai_score['total_data_count']}개")

    print("="*60)


# ============================================================================
# 메인 함수
# ============================================================================

async def main():
    """메인 실행 함수"""

    print("\n" + "="*60)
    print("PoliticianFinder AI Evaluation Engine V2.0")
    print("데이터 수집 시작")
    print("="*60)

    # 테스트 정치인 3명
    test_politicians = [
        {
            'name': '이재명',
            'job_type': '광역단체장',
            'party': '더불어민주당',
            'region': '경기도',
            'current_position': '경기도지사'
        },
        {
            'name': '오세훈',
            'job_type': '광역단체장',
            'party': '국민의힘',
            'region': '서울특별시',
            'current_position': '서울특별시장'
        },
        {
            'name': '김동연',
            'job_type': '광역단체장',
            'party': '무소속',
            'region': '경기도',
            'current_position': '경기도지사'
        }
    ]

    # 정치인별 수집 및 평가
    for politician_info in test_politicians:
        # 정치인 DB 등록/조회
        result = supabase.table('politicians').select('*').eq(
            'name', politician_info['name']
        ).execute()

        if result.data:
            politician_id = result.data[0]['id']
            print(f"\n기존 정치인: {politician_info['name']} (ID: {politician_id})")
        else:
            # 신규 등록
            result = supabase.table('politicians').insert({
                'name': politician_info['name'],
                'job_type': politician_info['job_type'],
                'party': politician_info['party'],
                'region': politician_info['region'],
                'current_position': politician_info['current_position']
            }).execute()
            politician_id = result.data[0]['id']
            print(f"\n신규 정치인 등록: {politician_info['name']} (ID: {politician_id})")

        # 데이터 수집 (Claude AI)
        collection_result = await collect_politician_data(
            politician_id,
            politician_info['name'],
            politician_info['job_type'],
            ai_name="Claude"
        )

        # 점수 조회 (DB 트리거가 자동 계산)
        await asyncio.sleep(2)  # 트리거 계산 대기
        scores = await get_politician_scores(politician_id)

        # 점수 출력
        print_politician_scores(politician_info['name'], scores)

    print("\n" + "="*60)
    print("🎉 전체 수집 완료!")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
