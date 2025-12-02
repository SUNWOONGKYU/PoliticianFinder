"""
초고속 + 초저비용 V24.5 Pooling 평가 시스템
프롬프트 캐싱으로 토큰 사용량 90% 절감

핵심 전략:
1. Claude Prompt Caching (시스템 메시지 + 뉴스 데이터)
2. 청크 방식 (30개씩 5개 청크)
3. 배치 병렬 처리 (3개 AI 동시 실행)

예상 성능:
- 시간: 1-2시간
- 토큰: 기존 대비 90% 절감
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime
from typing import List, Dict
import anthropic
import openai

# API 설정
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROK_API_KEY = os.getenv("XAI_API_KEY")

CATEGORIES = [
    "Expertise", "Leadership", "Vision", "Integrity", "Ethics",
    "Accountability", "Transparency", "Communication", "Responsiveness", "PublicInterest"
]

# TODO: 실제 정치인 목록으로 교체
REMAINING_POLITICIANS = [
    f"정치인{i}" for i in range(4, 31)  # 27명
]


class CachedPoolingEvaluator:
    """프롬프트 캐싱 기반 초고속 평가 엔진"""

    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
        self.anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.grok_api_key = GROK_API_KEY

        # 평가 기준 (캐싱용)
        self.evaluation_criteria = self._load_evaluation_criteria()

    def _load_evaluation_criteria(self) -> str:
        """평가 기준 로드 (캐싱 대상)"""
        return """당신은 대한민국 정치인 평가 전문가입니다.

다음 10개 기준으로 정치인을 평가하세요:

1. **Expertise (전문성)**: 정책 전문성, 분야 지식, 경력
2. **Leadership (리더십)**: 조직 관리, 결단력, 추진력
3. **Vision (비전)**: 미래 비전, 정책 방향성, 혁신성
4. **Integrity (청렴도)**: 부패 없음, 도덕성, 정직성
5. **Ethics (윤리성)**: 윤리적 판단, 가치관, 원칙
6. **Accountability (책임감)**: 약속 이행, 책임 의식, 결과 책임
7. **Transparency (투명성)**: 정보 공개, 투명한 의사결정, 공개성
8. **Communication (소통능력)**: 국민과의 소통, 설명 능력, 경청
9. **Responsiveness (대응성)**: 민원 대응, 위기 관리, 신속성
10. **PublicInterest (공익성)**: 공공의 이익 우선, 사회적 가치

평가 방법:
- 각 뉴스에서 정치인의 행동/발언을 객관적으로 분석
- 각 카테고리별로 0-100점 점수 부여
- 긍정적 행동: 높은 점수
- 부정적 행동: 낮은 점수
- 중립적 뉴스: 50점

출력 형식 (JSON):
{
  "scores": {
    "Expertise": [점수1, 점수2, ..., 점수N],
    "Leadership": [점수1, 점수2, ..., 점수N],
    ... (10개 카테고리)
  }
}
"""

    def _load_news(self, politician_name: str) -> List[str]:
        """정치인별 150개 뉴스 로드"""
        news_file = f"news_data/{politician_name}_news.json"

        if os.path.exists(news_file):
            with open(news_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('news', [])[:150]  # 최대 150개
        else:
            print(f"⚠️ {politician_name}: 뉴스 파일 없음")
            return []

    def _chunk_news(self, news_list: List[str], chunk_size: int = 30) -> List[List[str]]:
        """뉴스를 청크로 분할"""
        return [news_list[i:i+chunk_size] for i in range(0, len(news_list), chunk_size)]

    async def evaluate_chunk_with_claude_cached(
        self,
        politician_name: str,
        news_chunk: List[str],
        chunk_num: int
    ) -> Dict:
        """Claude로 청크 평가 (프롬프트 캐싱 활용)"""

        print(f"    📊 Claude 청크 {chunk_num} 평가: {len(news_chunk)}개 뉴스")

        # 뉴스를 JSON으로 변환
        news_json = json.dumps(
            [{"index": i+1, "content": news} for i, news in enumerate(news_chunk)],
            ensure_ascii=False
        )

        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=8000,
                system=[
                    {
                        "type": "text",
                        "text": self.evaluation_criteria,
                        "cache_control": {"type": "ephemeral"}  # 캐싱!
                    }
                ],
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": f"정치인: {politician_name}\n\n뉴스 목록:\n{news_json}",
                                "cache_control": {"type": "ephemeral"}  # 뉴스도 캐싱!
                            },
                            {
                                "type": "text",
                                "text": "위 뉴스들을 분석하여 10개 카테고리별 점수를 JSON으로 출력하세요."
                            }
                        ]
                    }
                ]
            )

            result = json.loads(response.content[0].text)

            # 토큰 사용량 출력
            usage = response.usage
            print(f"      토큰: 입력 {usage.input_tokens}, 출력 {usage.output_tokens}")
            if hasattr(usage, 'cache_read_input_tokens'):
                print(f"      캐시: {usage.cache_read_input_tokens} 토큰 재사용!")

            return result

        except Exception as e:
            print(f"    ❌ Claude 청크 {chunk_num} 오류: {str(e)}")
            return None

    async def evaluate_chunk_with_chatgpt(
        self,
        politician_name: str,
        news_chunk: List[str],
        chunk_num: int
    ) -> Dict:
        """ChatGPT로 청크 평가"""

        print(f"    📊 ChatGPT 청크 {chunk_num} 평가: {len(news_chunk)}개 뉴스")

        news_json = json.dumps(
            [{"index": i+1, "content": news} for i, news in enumerate(news_chunk)],
            ensure_ascii=False
        )

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": self.evaluation_criteria},
                    {"role": "user", "content": f"""
정치인: {politician_name}

뉴스 목록:
{news_json}

위 뉴스들을 분석하여 10개 카테고리별 점수를 JSON으로 출력하세요.
                    """}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)

            # 토큰 사용량
            usage = response.usage
            print(f"      토큰: 입력 {usage.prompt_tokens}, 출력 {usage.completion_tokens}")

            return result

        except Exception as e:
            print(f"    ❌ ChatGPT 청크 {chunk_num} 오류: {str(e)}")
            return None

    async def evaluate_chunk_with_grok(
        self,
        politician_name: str,
        news_chunk: List[str],
        chunk_num: int
    ) -> Dict:
        """Grok으로 청크 평가"""

        print(f"    📊 Grok 청크 {chunk_num} 평가: {len(news_chunk)}개 뉴스")

        news_json = json.dumps(
            [{"index": i+1, "content": news} for i, news in enumerate(news_chunk)],
            ensure_ascii=False
        )

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.x.ai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.grok_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "grok-beta",
                        "messages": [
                            {"role": "system", "content": self.evaluation_criteria},
                            {"role": "user", "content": f"""
정치인: {politician_name}

뉴스 목록:
{news_json}

위 뉴스들을 분석하여 10개 카테고리별 점수를 JSON으로 출력하세요.
                            """}
                        ],
                        "temperature": 0.3
                    }
                ) as response:
                    data = await response.json()
                    result = json.loads(data['choices'][0]['message']['content'])

                    # 토큰 사용량
                    usage = data.get('usage', {})
                    print(f"      토큰: 입력 {usage.get('prompt_tokens')}, 출력 {usage.get('completion_tokens')}")

                    return result

        except Exception as e:
            print(f"    ❌ Grok 청크 {chunk_num} 오류: {str(e)}")
            return None

    async def evaluate_one_politician_chunked(self, politician_name: str) -> Dict:
        """한 명의 정치인을 청크 방식으로 평가"""

        print(f"\n🎯 평가 시작: {politician_name}")

        # 뉴스 로드
        news_list = self._load_news(politician_name)

        if not news_list:
            print(f"❌ {politician_name}: 뉴스 데이터 없음")
            return None

        print(f"  📰 뉴스 개수: {len(news_list)}개")

        # 청크로 분할 (30개씩)
        news_chunks = self._chunk_news(news_list, chunk_size=30)
        print(f"  📦 청크 개수: {len(news_chunks)}개 (각 30개)")

        # 각 청크를 3개 AI로 평가
        all_scores = {
            'chatgpt': {cat: [] for cat in CATEGORIES},
            'grok': {cat: [] for cat in CATEGORIES},
            'claude': {cat: [] for cat in CATEGORIES}
        }

        for i, chunk in enumerate(news_chunks, 1):
            print(f"\n  📦 청크 {i}/{len(news_chunks)} 평가 중...")

            # 3개 AI 동시 평가
            chatgpt_task = self.evaluate_chunk_with_chatgpt(politician_name, chunk, i)
            grok_task = self.evaluate_chunk_with_grok(politician_name, chunk, i)
            claude_task = self.evaluate_chunk_with_claude_cached(politician_name, chunk, i)

            chatgpt_result, grok_result, claude_result = await asyncio.gather(
                chatgpt_task, grok_task, claude_task
            )

            # 점수 누적
            if chatgpt_result:
                for cat in CATEGORIES:
                    all_scores['chatgpt'][cat].extend(chatgpt_result['scores'][cat])

            if grok_result:
                for cat in CATEGORIES:
                    all_scores['grok'][cat].extend(grok_result['scores'][cat])

            if claude_result:
                for cat in CATEGORIES:
                    all_scores['claude'][cat].extend(claude_result['scores'][cat])

        # 평균 점수 계산
        pooling_scores = self._calculate_pooling_scores(all_scores)

        print(f"✅ 완료: {politician_name}")

        return {
            'politician': politician_name,
            'scores': all_scores,
            'pooling': pooling_scores
        }

    def _calculate_pooling_scores(self, all_scores: Dict) -> Dict:
        """Pooling 점수 계산 (3개 AI 평균)"""

        pooling = {}

        for category in CATEGORIES:
            chatgpt_scores = all_scores['chatgpt'][category]
            grok_scores = all_scores['grok'][category]
            claude_scores = all_scores['claude'][category]

            if chatgpt_scores and grok_scores and claude_scores:
                chatgpt_avg = sum(chatgpt_scores) / len(chatgpt_scores)
                grok_avg = sum(grok_scores) / len(grok_scores)
                claude_avg = sum(claude_scores) / len(claude_scores)

                pooling[category] = (chatgpt_avg + grok_avg + claude_avg) / 3
            else:
                pooling[category] = 0

        return pooling

    async def evaluate_batch(self, politicians: List[str]) -> List[Dict]:
        """배치 평가 (병렬)"""

        print(f"\n{'='*60}")
        print(f"📦 배치 평가 시작: {len(politicians)}명")
        print(f"{'='*60}")

        tasks = [self.evaluate_one_politician_chunked(p) for p in politicians]
        results = await asyncio.gather(*tasks)

        return [r for r in results if r is not None]

    async def evaluate_all_27(self) -> List[Dict]:
        """27명 전체 평가"""

        print("\n" + "="*60)
        print("🚀 초고속 + 초저비용 V24.5 Pooling 평가 시작")
        print("="*60)
        print(f"대상: 27명 정치인")
        print(f"방식: 청크 + 캐싱 + 병렬 처리")
        print(f"예상 시간: 1-2시간")
        print(f"예상 토큰 절감: 90%")
        print("="*60 + "\n")

        # 3개 그룹으로 분할
        groups = [
            REMAINING_POLITICIANS[0:9],
            REMAINING_POLITICIANS[9:18],
            REMAINING_POLITICIANS[18:27]
        ]

        all_results = []
        start_time = datetime.now()

        for i, group in enumerate(groups, 1):
            print(f"\n{'='*60}")
            print(f"📦 그룹 {i}/3 시작 ({len(group)}명)")
            print(f"{'='*60}")

            group_start = datetime.now()
            group_results = await self.evaluate_batch(group)
            group_elapsed = (datetime.now() - group_start).total_seconds() / 60

            all_results.extend(group_results)

            # 즉시 저장
            self._save_results(group_results, group_num=i)

            print(f"\n✅ 그룹 {i} 완료!")
            print(f"  소요 시간: {group_elapsed:.1f}분")
            print(f"  전체 진행률: {len(all_results)}/27명")

        total_elapsed = (datetime.now() - start_time).total_seconds() / 60

        print(f"\n{'='*60}")
        print(f"🎉 전체 완료!")
        print(f"{'='*60}")
        print(f"평가 완료: {len(all_results)}/27명")
        print(f"총 소요 시간: {total_elapsed:.1f}분 ({total_elapsed/60:.2f}시간)")
        print(f"{'='*60}\n")

        return all_results

    def _save_results(self, results: List[Dict], group_num: int):
        """결과 저장"""

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"pooling_cached_group{group_num}_{timestamp}.json"

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        print(f"  💾 저장: {filename}")


async def main():
    """메인 실행"""

    evaluator = CachedPoolingEvaluator()
    results = await evaluator.evaluate_all_27()

    # 최종 저장
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"pooling_cached_all_27_{timestamp}.json"

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"✅ 최종 저장: {filename}")

    # 통계
    print("\n📊 평가 통계:")
    for result in results:
        politician = result['politician']
        pooling = result['pooling']
        avg_score = sum(pooling.values()) / len(pooling)
        print(f"  {politician}: {avg_score:.2f}점")


if __name__ == "__main__":
    asyncio.run(main())
