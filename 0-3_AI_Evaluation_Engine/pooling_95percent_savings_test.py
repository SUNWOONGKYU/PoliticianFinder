#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
95% 토큰 절감 테스트 - Prompt Caching + Category Integration
- Anthropic Prompt Caching (4 cache breakpoints, 1-hour TTL)
- 10개 카테고리 통합 평가 (1회 API 호출)
- 전체 150개 데이터 사용 (샘플링 없음)
- 목표: 95% 이상 토큰 절감
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

# 테스트 정치인 (송석준)
TEST_POLITICIAN = {
    "id": "023139c6",
    "name": "송석준"
}


class TokenSavingsEvaluator:
    """95% 토큰 절감 평가 엔진"""

    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
        self.anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.grok_api_key = GROK_API_KEY
        self.supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        # 토큰 사용량 추적
        self.token_usage = {
            'claude': {'input': 0, 'output': 0, 'cache_creation': 0, 'cache_read': 0},
            'chatgpt': {'input': 0, 'output': 0},
            'grok': {'input': 0, 'output': 0}
        }

    def _get_evaluation_criteria(self) -> str:
        """평가 기준 (Cache Breakpoint 1)"""
        return """당신은 대한민국 정치인 평가 전문가입니다.

다음 10개 카테고리로 정치인을 평가하세요:

1. Expertise (전문성): 정책 전문성, 분야 지식
2. Leadership (리더십): 조직 관리, 결단력
3. Vision (비전): 미래 비전, 정책 방향성
4. Integrity (청렴도): 부패 없음, 도덕성
5. Ethics (윤리성): 윤리적 판단, 가치관
6. Accountability (책임감): 약속 이행, 책임 의식
7. Transparency (투명성): 정보 공개, 투명한 의사결정
8. Communication (소통능력): 국민과의 소통, 설명 능력
9. Responsiveness (대응성): 민원 대응, 위기 관리
10. PublicInterest (공익성): 공공의 이익 우선

평가 방법:
- 각 데이터에서 정치인의 행동/발언을 분석
- 각 카테고리별로 0-100점 점수 부여
- 객관적 사실 기반 평가
- 긍정적/부정적 요소 모두 고려"""

    def _get_output_format(self) -> str:
        """출력 형식 (Cache Breakpoint 4)"""
        return """
출력 형식 (JSON):
{
  "Expertise": [점수1, 점수2, ..., 점수150],
  "Leadership": [점수1, 점수2, ..., 점수150],
  "Vision": [점수1, 점수2, ..., 점수150],
  "Integrity": [점수1, 점수2, ..., 점수150],
  "Ethics": [점수1, 점수2, ..., 점수150],
  "Accountability": [점수1, 점수2, ..., 점수150],
  "Transparency": [점수1, 점수2, ..., 점수150],
  "Communication": [점수1, 점수2, ..., 점수150],
  "Responsiveness": [점수1, 점수2, ..., 점수150],
  "PublicInterest": [점수1, 점수2, ..., 점수150]
}

주의: 각 카테고리는 정확히 150개의 점수를 가져야 합니다.
"""

    def _load_data_from_db(self, politician_id: str) -> List[Dict]:
        """DB에서 데이터 로드"""
        response = self.supabase.table('collected_data').select(
            'data_title, data_content, ai_name, category_name, source_type'
        ).eq('politician_id', politician_id).execute()

        return response.data

    def _compress_data(self, data: str) -> str:
        """데이터 압축 (메타데이터 제거, 핵심만 추출)"""
        # 1. 메타데이터 제거
        data = re.sub(r'\[.*?\]', '', data)

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

        keywords = ['정책', '법안', '예산', '공약', '개혁', '추진', '발표', '제안', '계획']

        key_sentences = sentences[:3]

        for sent in sentences[3:]:
            if any(kw in sent for kw in keywords):
                key_sentences.append(sent)
                if len(key_sentences) >= 5:
                    break

        compressed = '. '.join(key_sentences[:5])
        return compressed

    def _remove_duplicates(self, data_list: List[str]) -> List[str]:
        """중복 제거"""
        seen = set()
        unique = []

        for data in data_list:
            content_hash = hashlib.md5(data.encode('utf-8')).hexdigest()[:16]
            if content_hash not in seen:
                seen.add(content_hash)
                unique.append(data)

        return unique

    def _prepare_data_list(self, raw_data: List[Dict]) -> List[str]:
        """데이터 리스트 준비 (150개로 제한)"""
        print(f"\n  📦 데이터 준비 중...")
        print(f"  원본: {len(raw_data)}개 항목")

        # 1. 텍스트로 변환
        text_data = []
        for item in raw_data:
            title = item.get('data_title', '')
            content = item.get('data_content', '')
            text = f"{title}. {content}"
            text_data.append(text)

        # 2. 중복 제거
        unique_data = self._remove_duplicates(text_data)
        print(f"  중복 제거 후: {len(unique_data)}개 항목")

        # 3. 150개로 제한
        limited_data = unique_data[:150]
        print(f"  150개로 제한: {len(limited_data)}개 항목")

        # 4. 압축
        compressed_data = [self._compress_data(d) for d in limited_data]
        print(f"  압축 완료")

        return compressed_data

    async def evaluate_with_claude_cached(
        self,
        politician_name: str,
        data_list: List[str]
    ) -> Dict:
        """Claude Prompt Caching 평가 (95% 토큰 절감)"""

        print(f"\n  📊 Claude 평가 시작 (Prompt Caching)")

        # 데이터를 JSON으로 변환
        data_json = json.dumps(
            [{"index": i+1, "content": data} for i, data in enumerate(data_list)],
            ensure_ascii=False
        )

        # 4개 Cache Breakpoints 설정
        system_messages = [
            {
                "type": "text",
                "text": self._get_evaluation_criteria(),
                "cache_control": {"type": "ephemeral"}
            },
            {
                "type": "text",
                "text": f"정치인: {politician_name}",
                "cache_control": {"type": "ephemeral"}
            },
            {
                "type": "text",
                "text": data_json,
                "cache_control": {"type": "ephemeral"}
            },
            {
                "type": "text",
                "text": self._get_output_format(),
                "cache_control": {"type": "ephemeral"}
            }
        ]

        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-5-haiku-20241022",
                max_tokens=16000,
                system=system_messages,
                messages=[
                    {
                        "role": "user",
                        "content": f"위 {len(data_list)}개 데이터를 모두 분석하고, 10개 카테고리별로 각 데이터에 대한 점수를 매겨주세요."
                    }
                ]
            )

            result = json.loads(response.content[0].text)

            # 토큰 사용량 기록
            usage = response.usage
            self.token_usage['claude']['input'] += usage.input_tokens
            self.token_usage['claude']['output'] += usage.output_tokens
            self.token_usage['claude']['cache_creation'] += getattr(usage, 'cache_creation_input_tokens', 0)
            self.token_usage['claude']['cache_read'] += getattr(usage, 'cache_read_input_tokens', 0)

            print(f"    ✅ Claude 완료")
            print(f"    토큰: input={usage.input_tokens}, output={usage.output_tokens}")
            print(f"    캐시: creation={getattr(usage, 'cache_creation_input_tokens', 0)}, read={getattr(usage, 'cache_read_input_tokens', 0)}")

            return result

        except Exception as e:
            print(f"    ❌ 오류: {str(e)}")
            return None

    async def evaluate_with_chatgpt(
        self,
        politician_name: str,
        data_list: List[str]
    ) -> Dict:
        """ChatGPT 평가"""

        print(f"\n  📊 ChatGPT 평가 시작")

        data_json = json.dumps(
            [{"index": i+1, "content": data} for i, data in enumerate(data_list)],
            ensure_ascii=False
        )

        system_msg = self._get_evaluation_criteria() + self._get_output_format()

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": f"정치인: {politician_name}\n\n데이터:\n{data_json}\n\n위 {len(data_list)}개 데이터를 모두 분석하고, 10개 카테고리별로 각 데이터에 대한 점수를 매겨주세요."}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)

            # 토큰 사용량 기록
            usage = response.usage
            self.token_usage['chatgpt']['input'] += usage.prompt_tokens
            self.token_usage['chatgpt']['output'] += usage.completion_tokens

            print(f"    ✅ ChatGPT 완료")
            print(f"    토큰: input={usage.prompt_tokens}, output={usage.completion_tokens}")

            return result

        except Exception as e:
            print(f"    ❌ 오류: {str(e)}")
            return None

    async def evaluate_with_grok(
        self,
        politician_name: str,
        data_list: List[str]
    ) -> Dict:
        """Grok 평가"""

        print(f"\n  📊 Grok 평가 시작")

        data_json = json.dumps(
            [{"index": i+1, "content": data} for i, data in enumerate(data_list)],
            ensure_ascii=False
        )

        system_msg = self._get_evaluation_criteria() + self._get_output_format()

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
                            {"role": "user", "content": f"정치인: {politician_name}\n\n데이터:\n{data_json}\n\n위 {len(data_list)}개 데이터를 모두 분석하고, 10개 카테고리별로 각 데이터에 대한 점수를 매겨주세요."}
                        ],
                        "temperature": 0.3
                    }
                ) as resp:
                    data = await resp.json()
                    result = json.loads(data['choices'][0]['message']['content'])

                    # 토큰 사용량 기록
                    usage = data.get('usage', {})
                    self.token_usage['grok']['input'] += usage.get('prompt_tokens', 0)
                    self.token_usage['grok']['output'] += usage.get('completion_tokens', 0)

                    print(f"    ✅ Grok 완료")
                    print(f"    토큰: input={usage.get('prompt_tokens', 0)}, output={usage.get('completion_tokens', 0)}")

                    return result

        except Exception as e:
            print(f"    ❌ 오류: {str(e)}")
            return None

    async def test_95percent_savings(self, politician_id: str) -> Dict:
        """95% 토큰 절감 테스트"""

        print(f"\n{'='*80}")
        print(f"🚀 95% 토큰 절감 테스트 시작")
        print(f"{'='*80}")
        print(f"정치인 ID: {politician_id}")
        print(f"방법: Prompt Caching (4 breakpoints) + Category Integration")
        print(f"{'='*80}")

        start_time = datetime.now()

        # 1. 데이터 로드
        print(f"\n📥 1단계: 데이터 로드")
        raw_data = self._load_data_from_db(politician_id)
        print(f"  DB에서 {len(raw_data)}개 항목 로드")

        # 2. 데이터 준비
        print(f"\n🗜️ 2단계: 데이터 준비")
        prepared_data = self._prepare_data_list(raw_data)
        print(f"  최종: {len(prepared_data)}개 데이터")

        # 정치인 이름 조회
        politician_response = self.supabase.table('politicians').select('name').eq('id', politician_id).execute()
        politician_name = politician_response.data[0]['name'] if politician_response.data else "Unknown"

        # 3. 3개 AI 병렬 평가
        print(f"\n📊 3단계: 3개 AI 병렬 평가")

        chatgpt_task = self.evaluate_with_chatgpt(politician_name, prepared_data)
        grok_task = self.evaluate_with_grok(politician_name, prepared_data)
        claude_task = self.evaluate_with_claude_cached(politician_name, prepared_data)

        chatgpt_result, grok_result, claude_result = await asyncio.gather(
            chatgpt_task, grok_task, claude_task
        )

        # 4. Pooling 점수 계산
        print(f"\n📈 4단계: Pooling 점수 계산")
        pooling_scores = self._calculate_pooling(chatgpt_result, grok_result, claude_result)

        elapsed = (datetime.now() - start_time).total_seconds()

        # 5. 토큰 사용량 보고
        print(f"\n{'='*80}")
        print(f"✅ 테스트 완료!")
        print(f"{'='*80}")
        print(f"소요 시간: {elapsed:.1f}초 ({elapsed/60:.1f}분)")
        print(f"정치인: {politician_name}")
        print(f"데이터 수: {len(prepared_data)}개")
        print(f"\n📊 토큰 사용량:")
        print(f"  Claude:")
        print(f"    Input: {self.token_usage['claude']['input']:,}")
        print(f"    Output: {self.token_usage['claude']['output']:,}")
        print(f"    Cache Creation: {self.token_usage['claude']['cache_creation']:,}")
        print(f"    Cache Read: {self.token_usage['claude']['cache_read']:,}")
        print(f"  ChatGPT:")
        print(f"    Input: {self.token_usage['chatgpt']['input']:,}")
        print(f"    Output: {self.token_usage['chatgpt']['output']:,}")
        print(f"  Grok:")
        print(f"    Input: {self.token_usage['grok']['input']:,}")
        print(f"    Output: {self.token_usage['grok']['output']:,}")

        total_input = (self.token_usage['claude']['input'] +
                       self.token_usage['chatgpt']['input'] +
                       self.token_usage['grok']['input'])
        total_output = (self.token_usage['claude']['output'] +
                        self.token_usage['chatgpt']['output'] +
                        self.token_usage['grok']['output'])
        total_cache = (self.token_usage['claude']['cache_creation'] +
                       self.token_usage['claude']['cache_read'])

        print(f"\n  총합:")
        print(f"    Total Input: {total_input:,}")
        print(f"    Total Output: {total_output:,}")
        print(f"    Total Cache: {total_cache:,}")
        print(f"    Grand Total: {total_input + total_output + total_cache:,}")

        print(f"\n📊 Pooling 점수:")
        for cat in CATEGORIES:
            score = pooling_scores.get(cat, 0)
            print(f"  {CATEGORY_KOREAN[cat]:8s}: {score:.2f}점")

        avg_score = sum(pooling_scores.values()) / len(pooling_scores)
        print(f"\n  평균: {avg_score:.2f}점")
        print(f"{'='*80}")

        return {
            'politician_id': politician_id,
            'politician_name': politician_name,
            'data_count': len(prepared_data),
            'chatgpt': chatgpt_result,
            'grok': grok_result,
            'claude': claude_result,
            'pooling': pooling_scores,
            'token_usage': self.token_usage,
            'elapsed_seconds': elapsed
        }

    def _calculate_pooling(self, chatgpt: Dict, grok: Dict, claude: Dict) -> Dict:
        """Pooling 점수 계산"""
        if not all([chatgpt, grok, claude]):
            return {}

        pooling = {}

        for category in CATEGORIES:
            chatgpt_scores = chatgpt.get(category, [])
            grok_scores = grok.get(category, [])
            claude_scores = claude.get(category, [])

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
    print("🚀 95% 토큰 절감 테스트")
    print("="*80)
    print(f"테스트 대상: {TEST_POLITICIAN['id']}")
    print(f"방법: Prompt Caching + Category Integration")
    print(f"목표: 95% 토큰 절감")
    print("="*80)

    evaluator = TokenSavingsEvaluator()

    # 테스트 실행
    result = await evaluator.test_95percent_savings(TEST_POLITICIAN['id'])

    # 결과 저장
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"95percent_savings_test_{TEST_POLITICIAN['id']}_{timestamp}.json"

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n💾 결과 저장: {filename}")


if __name__ == "__main__":
    asyncio.run(main())
