"""
초고속 V24.5 Pooling 평가 시스템
27명 정치인 × 150개 뉴스를 1-2시간 내 완료

핵심 혁신:
1. 150개 뉴스를 한 번의 API 호출로 평가
2. 3개 AI 동시 병렬 실행
3. 27명을 9명씩 3개 그룹으로 병렬 처리
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime
from typing import List, Dict, Tuple
import anthropic
import openai
from collections import defaultdict

# API 설정
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROK_API_KEY = os.getenv("XAI_API_KEY")

# 평가 카테고리
CATEGORIES = [
    "Expertise", "Leadership", "Vision", "Integrity", "Ethics",
    "Accountability", "Transparency", "Communication", "Responsiveness", "PublicInterest"
]

CATEGORY_KOREAN = {
    "Expertise": "전문성",
    "Leadership": "리더십",
    "Vision": "비전",
    "Integrity": "청렴도",
    "Ethics": "윤리성",
    "Accountability": "책임감",
    "Transparency": "투명성",
    "Communication": "소통능력",
    "Responsiveness": "대응성",
    "PublicInterest": "공익성"
}

# 27명 정치인 목록 (이미 완료된 3명 제외)
REMAINING_POLITICIANS = [
    # TODO: 실제 정치인 이름으로 교체
    "정치인4", "정치인5", "정치인6",
    "정치인7", "정치인8", "정치인9",
    "정치인10", "정치인11", "정치인12",
    "정치인13", "정치인14", "정치인15",
    "정치인16", "정치인17", "정치인18",
    "정치인19", "정치인20", "정치인21",
    "정치인22", "정치인23", "정치인24",
    "정치인25", "정치인26", "정치인27",
    "정치인28", "정치인29", "정치인30"
]


class SuperFastPoolingEvaluator:
    """초고속 Pooling 평가 엔진"""

    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
        self.anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.grok_api_key = GROK_API_KEY

        # System Message (평가 기준 - 1회만 전송)
        self.system_message = self._load_evaluation_criteria()

    def _load_evaluation_criteria(self) -> str:
        """평가 기준 로드"""
        return """당신은 대한민국 정치인 평가 전문가입니다.

다음 기준으로 정치인을 평가하세요:

1. **Expertise (전문성)**: 정책 전문성, 분야 지식
2. **Leadership (리더십)**: 조직 관리, 결단력
3. **Vision (비전)**: 미래 비전, 정책 방향성
4. **Integrity (청렴도)**: 부패 없음, 도덕성
5. **Ethics (윤리성)**: 윤리적 판단, 가치관
6. **Accountability (책임감)**: 약속 이행, 책임 의식
7. **Transparency (투명성)**: 정보 공개, 투명한 의사결정
8. **Communication (소통능력)**: 국민과의 소통, 설명 능력
9. **Responsiveness (대응성)**: 민원 대응, 위기 관리
10. **PublicInterest (공익성)**: 공공의 이익 우선

평가 방법:
- 각 뉴스에서 정치인의 행동/발언을 분석
- 각 카테고리별로 0-100점 점수 부여
- 객관적 사실 기반 평가
- 긍정적/부정적 요소 모두 고려

출력 형식 (JSON):
{
  "politician": "정치인명",
  "news_scores": {
    "Expertise": [점수1, 점수2, ..., 점수150],
    "Leadership": [점수1, 점수2, ..., 점수150],
    ... (10개 카테고리)
  },
  "category_averages": {
    "Expertise": 평균점수,
    "Leadership": 평균점수,
    ... (10개 카테고리)
  }
}
"""

    def _load_news(self, politician_name: str) -> List[str]:
        """정치인별 150개 뉴스 로드"""
        # TODO: 실제 뉴스 데이터 로드 로직
        # 예: news_data/politician_name.json에서 로드

        news_file = f"news_data/{politician_name}_news.json"

        if os.path.exists(news_file):
            with open(news_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('news', [])
        else:
            print(f"⚠️ {politician_name}: 뉴스 파일 없음")
            return []

    async def evaluate_with_chatgpt(
        self,
        politician_name: str,
        news_list: List[str]
    ) -> Dict:
        """ChatGPT로 전체 평가 (1회 API 호출)"""

        print(f"  📊 ChatGPT 평가 시작: {politician_name}")

        # 모든 뉴스를 JSON으로 변환
        news_json = json.dumps(
            [{"index": i+1, "content": news} for i, news in enumerate(news_list)],
            ensure_ascii=False
        )

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": self.system_message},
                    {"role": "user", "content": f"""
정치인: {politician_name}

다음 150개 뉴스를 모두 분석하고, 10개 카테고리별로 각 뉴스에 대한 점수를 매겨주세요.

뉴스 목록:
{news_json}

위 형식의 JSON으로 출력하세요.
                    """}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)
            print(f"  ✅ ChatGPT 완료: {politician_name}")
            return result

        except Exception as e:
            print(f"  ❌ ChatGPT 오류: {politician_name} - {str(e)}")
            return None

    async def evaluate_with_grok(
        self,
        politician_name: str,
        news_list: List[str]
    ) -> Dict:
        """Grok으로 전체 평가 (1회 API 호출)"""

        print(f"  📊 Grok 평가 시작: {politician_name}")

        news_json = json.dumps(
            [{"index": i+1, "content": news} for i, news in enumerate(news_list)],
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
                            {"role": "system", "content": self.system_message},
                            {"role": "user", "content": f"""
정치인: {politician_name}

다음 150개 뉴스를 모두 분석하고, 10개 카테고리별로 각 뉴스에 대한 점수를 매겨주세요.

뉴스 목록:
{news_json}

위 형식의 JSON으로 출력하세요.
                            """}
                        ],
                        "temperature": 0.3
                    }
                ) as response:
                    data = await response.json()
                    result = json.loads(data['choices'][0]['message']['content'])
                    print(f"  ✅ Grok 완료: {politician_name}")
                    return result

        except Exception as e:
            print(f"  ❌ Grok 오류: {politician_name} - {str(e)}")
            return None

    async def evaluate_with_claude(
        self,
        politician_name: str,
        news_list: List[str]
    ) -> Dict:
        """Claude로 전체 평가 (1회 API 호출)"""

        print(f"  📊 Claude 평가 시작: {politician_name}")

        news_json = json.dumps(
            [{"index": i+1, "content": news} for i, news in enumerate(news_list)],
            ensure_ascii=False
        )

        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=16000,
                system=self.system_message,
                messages=[
                    {"role": "user", "content": f"""
정치인: {politician_name}

다음 150개 뉴스를 모두 분석하고, 10개 카테고리별로 각 뉴스에 대한 점수를 매겨주세요.

뉴스 목록:
{news_json}

위 형식의 JSON으로 출력하세요.
                    """}
                ],
                temperature=0.3
            )

            result = json.loads(response.content[0].text)
            print(f"  ✅ Claude 완료: {politician_name}")
            return result

        except Exception as e:
            print(f"  ❌ Claude 오류: {politician_name} - {str(e)}")
            return None

    async def evaluate_one_politician(self, politician_name: str) -> Dict:
        """한 명의 정치인을 3개 AI로 동시 평가"""

        print(f"\n🎯 평가 시작: {politician_name}")

        # 뉴스 로드
        news_list = self._load_news(politician_name)

        if not news_list:
            print(f"❌ {politician_name}: 뉴스 데이터 없음")
            return None

        print(f"  📰 뉴스 개수: {len(news_list)}개")

        # 3개 AI 동시 평가
        chatgpt_task = self.evaluate_with_chatgpt(politician_name, news_list)
        grok_task = self.evaluate_with_grok(politician_name, news_list)
        claude_task = self.evaluate_with_claude(politician_name, news_list)

        chatgpt_result, grok_result, claude_result = await asyncio.gather(
            chatgpt_task, grok_task, claude_task
        )

        # Pooling 점수 계산
        pooling_scores = self._calculate_pooling_scores(
            chatgpt_result, grok_result, claude_result
        )

        print(f"✅ 완료: {politician_name}")

        return {
            'politician': politician_name,
            'chatgpt': chatgpt_result,
            'grok': grok_result,
            'claude': claude_result,
            'pooling': pooling_scores
        }

    def _calculate_pooling_scores(
        self,
        chatgpt: Dict,
        grok: Dict,
        claude: Dict
    ) -> Dict:
        """3개 AI 점수를 평균하여 Pooling 점수 계산"""

        if not all([chatgpt, grok, claude]):
            return None

        pooling = {}

        for category in CATEGORIES:
            chatgpt_avg = chatgpt['category_averages'][category]
            grok_avg = grok['category_averages'][category]
            claude_avg = claude['category_averages'][category]

            pooling[category] = (chatgpt_avg + grok_avg + claude_avg) / 3

        return pooling

    async def evaluate_batch(self, politicians: List[str]) -> List[Dict]:
        """여러 정치인 병렬 평가"""

        print(f"\n{'='*60}")
        print(f"📦 배치 평가 시작: {len(politicians)}명")
        print(f"{'='*60}")

        tasks = [self.evaluate_one_politician(p) for p in politicians]
        results = await asyncio.gather(*tasks)

        return [r for r in results if r is not None]

    async def evaluate_all_27(self) -> List[Dict]:
        """27명 전체 평가 (3개 그룹으로 분할)"""

        print("\n" + "="*60)
        print("🚀 초고속 V24.5 Pooling 평가 시작")
        print("="*60)
        print(f"대상: 27명 정치인")
        print(f"방식: 3개 그룹 × 9명 병렬 처리")
        print(f"예상 시간: 1-2시간")
        print("="*60 + "\n")

        # 3개 그룹으로 분할 (API Rate Limit 고려)
        groups = [
            REMAINING_POLITICIANS[0:9],   # 그룹 1
            REMAINING_POLITICIANS[9:18],  # 그룹 2
            REMAINING_POLITICIANS[18:27]  # 그룹 3
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
            self._save_batch_results(group_results, group_num=i)

            print(f"\n✅ 그룹 {i} 완료!")
            print(f"  소요 시간: {group_elapsed:.1f}분")
            print(f"  전체 진행률: {len(all_results)}/27명 ({len(all_results)/27*100:.1f}%)")

        total_elapsed = (datetime.now() - start_time).total_seconds() / 60

        print(f"\n{'='*60}")
        print(f"🎉 전체 완료!")
        print(f"{'='*60}")
        print(f"평가 완료: {len(all_results)}/27명")
        print(f"총 소요 시간: {total_elapsed:.1f}분 ({total_elapsed/60:.2f}시간)")
        print(f"{'='*60}\n")

        return all_results

    def _save_batch_results(self, results: List[Dict], group_num: int):
        """배치 결과 저장"""

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"pooling_results_group{group_num}_{timestamp}.json"

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        print(f"  💾 저장 완료: {filename}")

        # DB 저장도 여기서 수행 가능
        # self._save_to_database(results)


async def main():
    """메인 실행 함수"""

    evaluator = SuperFastPoolingEvaluator()
    results = await evaluator.evaluate_all_27()

    # 최종 결과 저장
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    final_filename = f"pooling_results_all_27_{timestamp}.json"

    with open(final_filename, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"✅ 최종 결과 저장: {final_filename}")

    # 통계 출력
    print("\n📊 평가 통계:")
    for result in results:
        politician = result['politician']
        pooling = result['pooling']
        avg_score = sum(pooling.values()) / len(pooling)
        print(f"  {politician}: {avg_score:.2f}점")


if __name__ == "__main__":
    asyncio.run(main())
