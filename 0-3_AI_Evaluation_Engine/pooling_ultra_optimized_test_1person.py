#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
초최적화 Pooling 평가 시스템 - 1명 테스트
토큰 절감 기법:
1. 중복 제거
2. 데이터 압축 (메타데이터 제거, 핵심만 추출)
3. System Message 극단적 최소화
4. Prompt Caching 활용
5. 카테고리별 배치 처리

목표: 98% 토큰 절감
"""

import asyncio
import aiohttp
import json
import os
import re
import hashlib
from datetime import datetime
from typing import List, Dict
import anthropic
import openai
from supabase import create_client
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# API 설정
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROK_API_KEY = os.getenv("XAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

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

# 테스트 정치인 (김동연)
TEST_POLITICIAN = {
    "name": "김동연",
    "id": "17270f25"
}


class UltraOptimizedEvaluator:
    """초최적화 Pooling 평가 엔진"""

    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
        self.anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.grok_api_key = GROK_API_KEY
        self.supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        # 극단적으로 짧은 System Message (50 토큰)
        self.minimal_system_template = "정치인 {category} 평가. 각 항목 0-100점. JSON 출력: {{\"scores\": [점수1, 점수2, ...]}}"

    def _get_minimal_system_message(self, category: str) -> str:
        """극단적으로 짧은 System Message"""
        return self.minimal_system_template.format(category=CATEGORY_KOREAN[category])

    def _load_data_from_db(self, politician_id: str) -> List[Dict]:
        """DB에서 데이터 로드"""

        response = self.supabase.table('collected_data').select(
            'data_title, data_content, ai_name, category_name, source_type'
        ).eq('politician_id', politician_id).execute()

        return response.data

    def _remove_duplicates(self, data_list: List[str]) -> List[str]:
        """중복 제거"""

        seen = set()
        unique = []

        for data in data_list:
            # 내용 기반 해시
            content_hash = hashlib.md5(data.encode('utf-8')).hexdigest()[:16]

            if content_hash not in seen:
                seen.add(content_hash)
                unique.append(data)

        return unique

    def _compress_data(self, data: str) -> str:
        """데이터 압축 (메타데이터 제거, 핵심만 추출)"""

        # 1. 메타데이터 제거
        data = re.sub(r'\[.*?\]', '', data)  # [AI | Category | Type] 제거

        # 2. 불필요한 문구 제거
        remove_phrases = [
            '관련 기사', '더 보기', '기사 전문', '출처:', '저작권',
            '무단 전재', '재배포 금지', '뉴스', '보도자료',
            '더보기', '▶', '◆', '※', '■'
        ]

        for phrase in remove_phrases:
            data = data.replace(phrase, '')

        # 3. 연속된 공백/줄바꿈 제거
        data = re.sub(r'\s+', ' ', data)
        data = data.strip()

        # 4. 핵심 문장만 추출 (첫 3문장 + 키워드 포함 문장)
        sentences = [s.strip() for s in data.split('.') if s.strip()]

        # 정책 관련 키워드
        keywords = ['정책', '법안', '예산', '공약', '개혁', '추진', '발표', '제안', '계획']

        key_sentences = sentences[:3]  # 첫 3문장

        # 키워드 포함 문장 추가 (최대 2개)
        for sent in sentences[3:]:
            if any(kw in sent for kw in keywords):
                key_sentences.append(sent)
                if len(key_sentences) >= 5:
                    break

        compressed = '. '.join(key_sentences[:5])

        return compressed

    def _ultra_compress_data_list(self, raw_data: List[Dict]) -> List[str]:
        """데이터 리스트 전체 압축"""

        print(f"\n  📦 데이터 압축 시작...")
        print(f"  원본: {len(raw_data)}개 항목")

        # 1. 텍스트로 변환
        text_data = []
        for item in raw_data:
            title = item.get('data_title', '')
            content = item.get('data_content', '')
            text = f"{title}. {content}"
            text_data.append(text)

        # 원본 토큰 수 추정
        original_tokens = sum(len(d.split()) for d in text_data)
        print(f"  원본 토큰: ~{original_tokens:,}개")

        # 2. 중복 제거
        unique_data = self._remove_duplicates(text_data)
        print(f"  중복 제거 후: {len(unique_data)}개 항목 ({len(unique_data)/len(text_data)*100:.1f}%)")

        # 3. 압축
        compressed_data = [self._compress_data(d) for d in unique_data]

        # 압축 후 토큰 수 추정
        compressed_tokens = sum(len(d.split()) for d in compressed_data)
        print(f"  압축 후 토큰: ~{compressed_tokens:,}개")
        print(f"  토큰 절감: {(1 - compressed_tokens/original_tokens)*100:.1f}%")

        return compressed_data

    async def evaluate_with_claude_optimized(
        self,
        politician_name: str,
        data_list: List[str],
        category: str
    ) -> List[int]:
        """Claude 최적화 평가 (1회 API 호출)"""

        print(f"    📊 Claude 평가: {category}")

        # 극단적으로 짧은 System Message
        system_msg = self._get_minimal_system_message(category)

        # 데이터를 JSON으로
        data_json = json.dumps(
            [{"n": i+1, "t": data[:200]} for i, data in enumerate(data_list)],  # 각 항목 200자로 제한
            ensure_ascii=False
        )

        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=16000,
                system=[
                    {
                        "type": "text",
                        "text": system_msg,
                        "cache_control": {"type": "ephemeral"}
                    }
                ],
                messages=[
                    {
                        "role": "user",
                        "content": f"{politician_name}\n{data_json}"
                    }
                ]
            )

            result = json.loads(response.content[0].text)
            scores = result.get('scores', [])

            # 토큰 사용량 출력
            usage = response.usage
            print(f"      토큰: input={usage.input_tokens}, output={usage.output_tokens}, "
                  f"cache_creation={getattr(usage, 'cache_creation_input_tokens', 0)}, "
                  f"cache_read={getattr(usage, 'cache_read_input_tokens', 0)}")

            return scores

        except Exception as e:
            print(f"      ❌ 오류: {str(e)}")
            return []

    async def evaluate_with_chatgpt_optimized(
        self,
        politician_name: str,
        data_list: List[str],
        category: str
    ) -> List[int]:
        """ChatGPT 최적화 평가"""

        print(f"    📊 ChatGPT 평가: {category}")

        system_msg = self._get_minimal_system_message(category)

        data_json = json.dumps(
            [{"n": i+1, "t": data[:200]} for i, data in enumerate(data_list)],
            ensure_ascii=False
        )

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": f"{politician_name}\n{data_json}"}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)
            scores = result.get('scores', [])

            # 토큰 사용량
            usage = response.usage
            print(f"      토큰: input={usage.prompt_tokens}, output={usage.completion_tokens}")

            return scores

        except Exception as e:
            print(f"      ❌ 오류: {str(e)}")
            return []

    async def evaluate_with_grok_optimized(
        self,
        politician_name: str,
        data_list: List[str],
        category: str
    ) -> List[int]:
        """Grok 최적화 평가"""

        print(f"    📊 Grok 평가: {category}")

        system_msg = self._get_minimal_system_message(category)

        data_json = json.dumps(
            [{"n": i+1, "t": data[:200]} for i, data in enumerate(data_list)],
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
                            {"role": "system", "content": system_msg},
                            {"role": "user", "content": f"{politician_name}\n{data_json}"}
                        ],
                        "temperature": 0.3
                    }
                ) as resp:
                    data = await resp.json()
                    result = json.loads(data['choices'][0]['message']['content'])
                    scores = result.get('scores', [])

                    # 토큰 사용량
                    usage = data.get('usage', {})
                    print(f"      토큰: input={usage.get('prompt_tokens', 0)}, output={usage.get('completion_tokens', 0)}")

                    return scores

        except Exception as e:
            print(f"      ❌ 오류: {str(e)}")
            return []

    async def evaluate_one_politician_ultra_optimized(
        self,
        politician_name: str,
        politician_id: str
    ) -> Dict:
        """1명 초최적화 평가"""

        print(f"\n{'='*80}")
        print(f"🚀 초최적화 평가 시작: {politician_name}")
        print(f"{'='*80}")

        start_time = datetime.now()

        # 1. 데이터 로드
        print(f"\n📥 1단계: 데이터 로드")
        raw_data = self._load_data_from_db(politician_id)
        print(f"  DB에서 {len(raw_data)}개 항목 로드")

        # 2. 데이터 압축
        print(f"\n🗜️ 2단계: 데이터 압축")
        compressed_data = self._ultra_compress_data_list(raw_data)

        # 3. 카테고리별 평가
        print(f"\n📊 3단계: 카테고리별 평가 ({len(CATEGORIES)}개)")

        all_scores = {
            'chatgpt': {cat: [] for cat in CATEGORIES},
            'grok': {cat: [] for cat in CATEGORIES},
            'claude': {cat: [] for cat in CATEGORIES}
        }

        for i, category in enumerate(CATEGORIES, 1):
            print(f"\n  [{i}/{len(CATEGORIES)}] {CATEGORY_KOREAN[category]} ({category})")

            # 3개 AI 병렬 평가
            chatgpt_task = self.evaluate_with_chatgpt_optimized(politician_name, compressed_data, category)
            grok_task = self.evaluate_with_grok_optimized(politician_name, compressed_data, category)
            claude_task = self.evaluate_with_claude_optimized(politician_name, compressed_data, category)

            chatgpt_scores, grok_scores, claude_scores = await asyncio.gather(
                chatgpt_task, grok_task, claude_task
            )

            all_scores['chatgpt'][category] = chatgpt_scores
            all_scores['grok'][category] = grok_scores
            all_scores['claude'][category] = claude_scores

            print(f"    ✅ 완료: ChatGPT({len(chatgpt_scores)}), Grok({len(grok_scores)}), Claude({len(claude_scores)})")

        # 4. Pooling 점수 계산
        print(f"\n📈 4단계: Pooling 점수 계산")
        pooling_scores = self._calculate_pooling(all_scores)

        elapsed = (datetime.now() - start_time).total_seconds()

        print(f"\n{'='*80}")
        print(f"✅ 평가 완료!")
        print(f"  소요 시간: {elapsed:.1f}초 ({elapsed/60:.1f}분)")
        print(f"  데이터 수: {len(compressed_data)}개")
        print(f"  카테고리: {len(CATEGORIES)}개")
        print(f"{'='*80}")

        # 결과 출력
        print(f"\n📊 Pooling 점수:")
        for cat in CATEGORIES:
            score = pooling_scores.get(cat, 0)
            print(f"  {CATEGORY_KOREAN[cat]:8s}: {score:.2f}점")

        avg_score = sum(pooling_scores.values()) / len(pooling_scores)
        print(f"\n  평균: {avg_score:.2f}점")

        return {
            'politician': politician_name,
            'politician_id': politician_id,
            'data_count': len(compressed_data),
            'scores': all_scores,
            'pooling': pooling_scores,
            'elapsed_seconds': elapsed
        }

    def _calculate_pooling(self, all_scores: Dict) -> Dict:
        """Pooling 점수 계산"""

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


async def main():
    """메인 함수"""

    print("\n" + "="*80)
    print("🚀 초최적화 Pooling 평가 시스템 - 1명 테스트")
    print("="*80)
    print(f"테스트 대상: {TEST_POLITICIAN['name']}")
    print(f"목표: 98% 토큰 절감")
    print("="*80)

    evaluator = UltraOptimizedEvaluator()

    # 평가 실행
    result = await evaluator.evaluate_one_politician_ultra_optimized(
        TEST_POLITICIAN['name'],
        TEST_POLITICIAN['id']
    )

    # 결과 저장
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"ultra_optimized_test_{TEST_POLITICIAN['name']}_{timestamp}.json"

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n💾 결과 저장: {filename}")


if __name__ == "__main__":
    asyncio.run(main())
