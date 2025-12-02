"""
초고속 + 초저비용 V24.5 Pooling 평가 시스템 (DB 버전)
프롬프트 캐싱으로 토큰 사용량 90% 절감

핵심 전략:
1. collected_data 테이블에서 평가 데이터 로드 (OFFICIAL, PUBLIC, NEWS 포함)
2. Claude Prompt Caching (시스템 메시지 + 평가 데이터)
3. 청크 방식 (30개씩 5개 청크)
4. 배치 병렬 처리 (3개 AI 동시 실행)

예상 성능:
- 시간: 1-2시간
- 토큰: 기존 대비 90% 절감
"""

import asyncio
import aiohttp
import json
import os
import sys
from datetime import datetime
from typing import List, Dict
import anthropic
import openai
from supabase import create_client
from dotenv import load_dotenv

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv()

# API 설정
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROK_API_KEY = os.getenv("XAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

CATEGORIES = [
    "Expertise", "Leadership", "Vision", "Integrity", "Ethics",
    "Accountability", "Transparency", "Communication", "Responsiveness", "PublicInterest"
]

# 정치인 ID 매핑
POLITICIAN_IDS = {
    '김동연': '17270f25',
    '오세훈': '62e7b453',
    '한동훈': '5516976b'
}


class CachedPoolingEvaluator:
    """프롬프트 캐싱 기반 초고속 평가 엔진 (DB 버전)"""

    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
        self.anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.grok_api_key = GROK_API_KEY
        self.supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

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

    def _get_politician_id(self, politician_name: str) -> str:
        """정치인 이름으로 ID 조회"""
        if politician_name in POLITICIAN_IDS:
            return POLITICIAN_IDS[politician_name]

        # DB에서 조회
        response = self.supabase.table('politicians').select('id').eq('name', politician_name).execute()

        if response.data:
            politician_id = response.data[0]['id']
            POLITICIAN_IDS[politician_name] = politician_id
            return politician_id

        return None

    def _load_evaluation_data_from_db(self, politician_name: str) -> List[str]:
        """DB에서 평가 데이터 로드 (collected_data 테이블)"""

        politician_id = self._get_politician_id(politician_name)

        if not politician_id:
            print(f"⚠️ {politician_name}: 정치인 ID를 찾을 수 없음")
            return []

        print(f"  📂 {politician_name} (ID: {politician_id}) 데이터 로딩...")

        # collected_data 테이블에서 전체 데이터 조회
        response = self.supabase.table('collected_data').select(
            'data_title, data_content, ai_name, category_name, source_type'
        ).eq('politician_id', politician_id).execute()

        if not response.data:
            print(f"⚠️ {politician_name}: DB에 데이터 없음")
            return []

        print(f"  📊 총 {len(response.data)}개 항목 발견")

        # 평가 데이터 형식으로 변환 (제목 + 내용)
        data_list = []
        for item in response.data:
            title = item.get('data_title', '')
            content = item.get('data_content', '')
            ai = item.get('ai_name', 'Unknown')
            category = item.get('category_name', '')
            source_type = item.get('source_type', '')

            # 평가 데이터 텍스트 생성
            data_text = f"[{ai} | {category} | {source_type}] {title}\n{content}"
            data_list.append(data_text)

        print(f"  ✅ {len(data_list)}개 평가 데이터 로드 완료 (전체 사용)")
        return data_list

    def _chunk_data(self, data_list: List[str], chunk_size: int = 30) -> List[List[str]]:
        """평가 데이터를 청크로 분할"""
        return [data_list[i:i+chunk_size] for i in range(0, len(data_list), chunk_size)]

    async def evaluate_chunk_with_claude_cached(
        self,
        politician_name: str,
        data_chunk: List[str],
        chunk_num: int
    ) -> Dict:
        """Claude로 청크 평가 (프롬프트 캐싱 활용)"""

        print(f"    📊 Claude 청크 {chunk_num} 평가: {len(data_chunk)}개 항목")

        # 평가 데이터를 JSON으로 변환
        data_json = json.dumps(
            [{"index": i+1, "content": data} for i, data in enumerate(data_chunk)],
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
                                "text": f"정치인: {politician_name}\n\n평가 데이터 목록:\n{data_json}",
                                "cache_control": {"type": "ephemeral"}  # 데이터 캐싱!
                            },
                            {
                                "type": "text",
                                "text": "위 평가 데이터들을 분석하여 10개 카테고리별 점수를 JSON으로 출력하세요."
                            }
                        ]
                    }
                ]
            )

            result = json.loads(response.content[0].text)

            # 토큰 사용량 출력
            usage = response.usage
            print(f"      토큰: 입력 {usage.input_tokens}, 출력 {usage.output_tokens}")
            if hasattr(usage, 'cache_creation_input_tokens') and usage.cache_creation_input_tokens:
                print(f"      캐시 생성: {usage.cache_creation_input_tokens} 토큰")
            if hasattr(usage, 'cache_read_input_tokens') and usage.cache_read_input_tokens:
                print(f"      캐시 재사용: {usage.cache_read_input_tokens} 토큰 (절약!)")

            print(f"      ✅ Claude 청크 {chunk_num} 완료")
            return result

        except Exception as e:
            print(f"      ❌ Claude 청크 {chunk_num} 오류: {str(e)}")
            return None

    async def evaluate_chunk_with_chatgpt(
        self,
        politician_name: str,
        data_chunk: List[str],
        chunk_num: int
    ) -> Dict:
        """ChatGPT로 청크 평가"""

        print(f"    📊 ChatGPT 청크 {chunk_num} 평가: {len(data_chunk)}개 항목")

        data_json = json.dumps(
            [{"index": i+1, "content": data} for i, data in enumerate(data_chunk)],
            ensure_ascii=False
        )

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": self.evaluation_criteria},
                    {"role": "user", "content": f"""
정치인: {politician_name}

평가 데이터 목록:
{data_json}

위 평가 데이터들을 분석하여 10개 카테고리별 점수를 JSON으로 출력하세요.
                    """}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)
            print(f"      ✅ ChatGPT 청크 {chunk_num} 완료")
            return result

        except Exception as e:
            print(f"      ❌ ChatGPT 청크 {chunk_num} 오류: {str(e)}")
            return None

    async def evaluate_chunk_with_grok(
        self,
        politician_name: str,
        data_chunk: List[str],
        chunk_num: int
    ) -> Dict:
        """Grok으로 청크 평가"""

        print(f"    📊 Grok 청크 {chunk_num} 평가: {len(data_chunk)}개 항목")

        data_json = json.dumps(
            [{"index": i+1, "content": data} for i, data in enumerate(data_chunk)],
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

평가 데이터 목록:
{data_json}

위 평가 데이터들을 분석하여 10개 카테고리별 점수를 JSON으로 출력하세요.
                            """}
                        ],
                        "temperature": 0.3
                    }
                ) as response:
                    data = await response.json()
                    result = json.loads(data['choices'][0]['message']['content'])
                    print(f"      ✅ Grok 청크 {chunk_num} 완료")
                    return result

        except Exception as e:
            print(f"      ❌ Grok 청크 {chunk_num} 오류: {str(e)}")
            return None

    async def evaluate_one_politician_chunked(self, politician_name: str) -> Dict:
        """한 명의 정치인을 청크 방식으로 평가"""

        print(f"\n🎯 평가 시작: {politician_name}")

        # DB에서 평가 데이터 로드
        data_list = self._load_evaluation_data_from_db(politician_name)

        if not data_list:
            print(f"❌ {politician_name}: 평가 데이터 없음")
            return None

        # 청크로 분할 (30개씩)
        data_chunks = self._chunk_data(data_list, chunk_size=30)
        print(f"  📦 {len(data_chunks)}개 청크로 분할 완료")

        # 각 청크별 결과 저장
        all_chatgpt_scores = {cat: [] for cat in CATEGORIES}
        all_grok_scores = {cat: [] for cat in CATEGORIES}
        all_claude_scores = {cat: [] for cat in CATEGORIES}

        # 청크별 평가
        for i, chunk in enumerate(data_chunks, 1):
            print(f"\n  📦 청크 {i}/{len(data_chunks)} 평가 중...")

            # 3개 AI 동시 평가
            chatgpt_task = self.evaluate_chunk_with_chatgpt(politician_name, chunk, i)
            grok_task = self.evaluate_chunk_with_grok(politician_name, chunk, i)
            claude_task = self.evaluate_chunk_with_claude_cached(politician_name, chunk, i)

            chatgpt_result, grok_result, claude_result = await asyncio.gather(
                chatgpt_task, grok_task, claude_task
            )

            # 결과 누적
            if chatgpt_result and 'scores' in chatgpt_result:
                for cat in CATEGORIES:
                    all_chatgpt_scores[cat].extend(chatgpt_result['scores'].get(cat, []))

            if grok_result and 'scores' in grok_result:
                for cat in CATEGORIES:
                    all_grok_scores[cat].extend(grok_result['scores'].get(cat, []))

            if claude_result and 'scores' in claude_result:
                for cat in CATEGORIES:
                    all_claude_scores[cat].extend(claude_result['scores'].get(cat, []))

        # 카테고리별 평균 계산
        chatgpt_avg = {cat: sum(scores)/len(scores) if scores else 0
                       for cat, scores in all_chatgpt_scores.items()}
        grok_avg = {cat: sum(scores)/len(scores) if scores else 0
                    for cat, scores in all_grok_scores.items()}
        claude_avg = {cat: sum(scores)/len(scores) if scores else 0
                      for cat, scores in all_claude_scores.items()}

        # Pooling 점수 계산
        pooling_scores = {}
        for cat in CATEGORIES:
            pooling_scores[cat] = (chatgpt_avg[cat] + grok_avg[cat] + claude_avg[cat]) / 3

        print(f"\n✅ {politician_name} 평가 완료!")
        print(f"  평가 데이터 수: {len(data_list)}개")
        print(f"  Pooling 평균: {sum(pooling_scores.values())/len(pooling_scores):.2f}점")

        return {
            'politician': politician_name,
            'chatgpt_avg': chatgpt_avg,
            'grok_avg': grok_avg,
            'claude_avg': claude_avg,
            'pooling': pooling_scores,
            'data_count': len(data_list)
        }

    async def evaluate_batch(self, politicians: List[str]) -> List[Dict]:
        """여러 정치인 병렬 평가"""

        print(f"\n{'='*60}")
        print(f"📦 배치 평가 시작: {len(politicians)}명")
        print(f"{'='*60}")

        tasks = [self.evaluate_one_politician_chunked(p) for p in politicians]
        results = await asyncio.gather(*tasks)

        return [r for r in results if r is not None]

    async def evaluate_all_27(self, politician_names: List[str]) -> List[Dict]:
        """27명 전체 평가 (3개 그룹으로 분할)"""

        print("\n" + "="*60)
        print("🚀 초고속 V24.5 Pooling 평가 시작 (DB 버전)")
        print("="*60)
        print(f"대상: {len(politician_names)}명 정치인")
        print(f"방식: 3개 그룹 × 병렬 처리")
        print(f"예상 시간: 1-2시간")
        print("="*60 + "\n")

        # 3개 그룹으로 분할 (API Rate Limit 고려)
        group_size = (len(politician_names) + 2) // 3  # 올림 나눗셈
        groups = [
            politician_names[i:i+group_size]
            for i in range(0, len(politician_names), group_size)
        ]

        all_results = []
        start_time = datetime.now()

        for i, group in enumerate(groups, 1):
            print(f"\n{'='*60}")
            print(f"📦 그룹 {i}/{len(groups)} 시작 ({len(group)}명)")
            print(f"{'='*60}")

            group_start = datetime.now()
            group_results = await self.evaluate_batch(group)
            group_elapsed = (datetime.now() - group_start).total_seconds() / 60

            all_results.extend(group_results)

            # 즉시 저장
            self._save_batch_results(group_results, group_num=i)

            print(f"\n✅ 그룹 {i} 완료!")
            print(f"  소요 시간: {group_elapsed:.1f}분")
            print(f"  전체 진행률: {len(all_results)}/{len(politician_names)}명 ({len(all_results)/len(politician_names)*100:.1f}%)")

        total_elapsed = (datetime.now() - start_time).total_seconds() / 60

        print(f"\n{'='*60}")
        print(f"🎉 전체 완료!")
        print(f"{'='*60}")
        print(f"평가 완료: {len(all_results)}/{len(politician_names)}명")
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


async def main():
    """메인 실행 함수"""

    evaluator = CachedPoolingEvaluator()

    # DB에서 정치인 목록 조회
    response = evaluator.supabase.table('politicians').select('name').execute()

    if not response.data:
        print("❌ DB에 정치인 데이터가 없습니다.")
        return

    all_politicians = [p['name'] for p in response.data]

    print(f"\n📋 DB에서 {len(all_politicians)}명의 정치인 발견:")
    for i, name in enumerate(all_politicians, 1):
        print(f"  {i}. {name}")

    # 이미 완료된 3명 제외
    completed = ['김동연', '오세훈', '한동훈']
    remaining = [p for p in all_politicians if p not in completed]

    print(f"\n✅ 이미 완료: {len(completed)}명 ({', '.join(completed)})")
    print(f"⏳ 남은 작업: {len(remaining)}명")

    if not remaining:
        print("\n✅ 모든 정치인 평가가 이미 완료되었습니다!")
        return

    # 평가 실행
    results = await evaluator.evaluate_all_27(remaining)

    # 최종 결과 저장
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    final_filename = f"pooling_results_all_{len(remaining)}_{timestamp}.json"

    with open(final_filename, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 최종 결과 저장: {final_filename}")

    # 통계 출력
    print("\n📊 평가 통계:")
    for result in results:
        politician = result['politician']
        pooling = result['pooling']
        avg_score = sum(pooling.values()) / len(pooling)
        print(f"  {politician}: {avg_score:.2f}점 ({result['data_count']}개 평가 데이터)")


if __name__ == "__main__":
    asyncio.run(main())
