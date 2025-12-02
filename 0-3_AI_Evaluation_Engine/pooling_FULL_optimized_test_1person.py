#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚀 최첨단 초최적화 Pooling 평가 시스템 - 1명 테스트
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

토큰 절감 기법 (98% 목표):
1. ✅ 중복 제거 (10% 절감)
2. ✅ NER 기반 핵심 추출 (83% 절감)
3. ✅ LLMLingua 압축 (80% 절감)
4. ✅ 불필요 문구 제거 (20% 절감)
5. ✅ System Message 극단적 최소화 (99% 절감)
6. ✅ Prompt Caching 활용 (90% 절감)
7. ✅ BatchPrompt (모든 카테고리 한 번에)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import asyncio
import aiohttp
import json
import os
import re
import hashlib
from datetime import datetime
from typing import List, Dict, Tuple
import anthropic
import openai
from supabase import create_client
from dotenv import load_dotenv

# 최적화 라이브러리
try:
    from llmlingua import PromptCompressor
    LLMLINGUA_AVAILABLE = True
except ImportError:
    print("⚠️ LLMLingua 없음 - 설치 중...")
    LLMLINGUA_AVAILABLE = False

try:
    import spacy
    try:
        nlp = spacy.load("ko_core_news_sm")
        SPACY_AVAILABLE = True
    except:
        print("⚠️ 한국어 모델 다운로드 중...")
        os.system("python -m spacy download ko_core_news_sm")
        nlp = spacy.load("ko_core_news_sm")
        SPACY_AVAILABLE = True
except ImportError:
    print("⚠️ Spacy 없음")
    SPACY_AVAILABLE = False

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

# 테스트 정치인
TEST_POLITICIAN = {
    "name": "김동연",
    "id": "17270f25"
}


class FullOptimizedEvaluator:
    """최첨단 초최적화 Pooling 평가 엔진"""

    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
        self.anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.grok_api_key = GROK_API_KEY
        self.supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        # LLMLingua 압축기 초기화 (CPU 모드)
        if LLMLINGUA_AVAILABLE:
            try:
                print("🔧 LLMLingua 압축기 초기화 중 (CPU 모드)...")
                self.compressor = PromptCompressor(
                    model_name="microsoft/llmlingua-2-bert-base-multilingual-cased-meetingbank",
                    use_llmlingua2=True,
                    device_map="cpu"  # CPU 모드 강제
                )
                print("✅ LLMLingua 준비 완료 (CPU)")
            except Exception as e:
                print(f"⚠️ LLMLingua 초기화 실패: {e}")
                self.compressor = None
                print("⚠️ LLMLingua 미사용 - 대체 압축 사용")
        else:
            self.compressor = None
            print("⚠️ LLMLingua 미사용 - 대체 압축 사용")

        # NER 추출기
        if SPACY_AVAILABLE:
            self.nlp = nlp
            print("✅ Spacy NER 준비 완료")
        else:
            self.nlp = None
            print("⚠️ Spacy 미사용 - 대체 추출 사용")

        # 극단적으로 짧은 System Message (15 토큰!)
        self.minimal_system = "정치인 10개 카테고리 평가. 각 0-100점. JSON: {\"Expertise\":[점수들], \"Leadership\":[점수들], ...}"

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
            content_hash = hashlib.md5(data.encode('utf-8')).hexdigest()[:16]

            if content_hash not in seen:
                seen.add(content_hash)
                unique.append(data)

        return unique

    def _extract_with_ner(self, text: str) -> str:
        """NER 기반 핵심 정보 추출"""

        if not SPACY_AVAILABLE or not self.nlp:
            # Fallback: 첫 3문장만
            sentences = text.split('.')[:3]
            return '. '.join(sentences)

        try:
            doc = self.nlp(text[:1000])  # 처음 1000자만 처리

            # Named Entities 추출
            entities = [ent.text for ent in doc.ents if ent.label_ in ['PERSON', 'ORG', 'DATE', 'LAW', 'GPE']]

            # 핵심 명사구
            noun_chunks = [chunk.text for chunk in doc.noun_chunks][:10]

            # 핵심 동사
            key_verbs = [token.text for token in doc if token.pos_ == "VERB"][:5]

            # 조합
            result = f"{' '.join(entities[:5])} {' '.join(noun_chunks)} {' '.join(key_verbs)}"
            return result[:500]  # 최대 500자

        except Exception as e:
            # 오류 시 fallback
            sentences = text.split('.')[:3]
            return '. '.join(sentences)

    def _compress_with_llmlingua(self, text: str, target_ratio: float = 0.2) -> str:
        """LLMLingua로 압축 (80% 절감)"""

        if not LLMLINGUA_AVAILABLE or not self.compressor:
            # Fallback: 단순 압축
            words = text.split()
            target_len = int(len(words) * target_ratio)
            return ' '.join(words[:target_len])

        try:
            result = self.compressor.compress_prompt(
                text,
                instruction="",
                question="",
                target_token=max(10, int(len(text.split()) * target_ratio)),
                condition_compare=True,
                condition_in_question='after',
                rank_method='longllmlingua',
                use_sentence_level_filter=False,
                context_budget="+100",
                dynamic_context_compression_ratio=0.4,
                reorder_context='sort'
            )

            return result['compressed_prompt']

        except Exception as e:
            print(f"      LLMLingua 오류: {e}")
            # Fallback
            words = text.split()
            target_len = int(len(words) * target_ratio)
            return ' '.join(words[:target_len])

    def _remove_boilerplate(self, text: str) -> str:
        """불필요한 문구 제거"""

        # 제거할 패턴
        patterns = [
            r'\[.*?\]',  # [대괄호 내용]
            r'<.*?>',    # <태그>
            r'http\S+',  # URL
            r'www\.\S+', # www 링크
        ]

        for pattern in patterns:
            text = re.sub(pattern, '', text)

        # 제거할 단어
        remove_words = [
            '관련 기사', '더 보기', '기사 전문', '출처', '저작권',
            '무단 전재', '재배포 금지', '뉴스', '보도자료',
            '더보기', '▶', '◆', '※', '■', '=', '-', '_'
        ]

        for word in remove_words:
            text = text.replace(word, '')

        # 연속 공백 제거
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def _ultra_compress_data_list(self, raw_data: List[Dict]) -> Tuple[List[str], Dict]:
        """4단계 초압축"""

        print(f"\n{'='*80}")
        print(f"🗜️ 4단계 초압축 프로세스")
        print(f"{'='*80}")

        # 통계
        stats = {
            'original_count': len(raw_data),
            'original_tokens': 0,
            'after_dedup_count': 0,
            'after_ner_tokens': 0,
            'after_llmlingua_tokens': 0,
            'final_tokens': 0
        }

        # 1. 텍스트로 변환
        print(f"\n📋 단계 0: 텍스트 변환")
        text_data = []
        for item in raw_data:
            title = item.get('data_title', '')
            content = item.get('data_content', '')
            text = f"{title}. {content}"
            text_data.append(text)

        stats['original_tokens'] = sum(len(t.split()) for t in text_data)
        print(f"  원본: {len(text_data)}개, ~{stats['original_tokens']:,} 토큰")

        # 2. 중복 제거
        print(f"\n🔍 단계 1: 중복 제거")
        unique_data = self._remove_duplicates(text_data)
        stats['after_dedup_count'] = len(unique_data)
        reduction = (1 - len(unique_data) / len(text_data)) * 100
        print(f"  결과: {len(unique_data)}개 ({reduction:.1f}% 절감)")

        # 3. NER 핵심 추출
        print(f"\n🎯 단계 2: NER 핵심 추출")
        ner_extracted = []
        for i, text in enumerate(unique_data):
            if i % 100 == 0 and i > 0:
                print(f"    진행: {i}/{len(unique_data)}")
            extracted = self._extract_with_ner(text)
            ner_extracted.append(extracted)

        stats['after_ner_tokens'] = sum(len(t.split()) for t in ner_extracted)
        reduction = (1 - stats['after_ner_tokens'] / stats['original_tokens']) * 100
        print(f"  결과: ~{stats['after_ner_tokens']:,} 토큰 ({reduction:.1f}% 절감)")

        # 4. LLMLingua 압축
        print(f"\n📦 단계 3: LLMLingua 압축")
        llmlingua_compressed = []
        for i, text in enumerate(ner_extracted):
            if i % 100 == 0 and i > 0:
                print(f"    진행: {i}/{len(ner_extracted)}")
            compressed = self._compress_with_llmlingua(text, target_ratio=0.2)
            llmlingua_compressed.append(compressed)

        stats['after_llmlingua_tokens'] = sum(len(t.split()) for t in llmlingua_compressed)
        reduction = (1 - stats['after_llmlingua_tokens'] / stats['after_ner_tokens']) * 100
        print(f"  결과: ~{stats['after_llmlingua_tokens']:,} 토큰 ({reduction:.1f}% 절감)")

        # 5. 불필요 문구 제거
        print(f"\n🧹 단계 4: 불필요 문구 제거")
        final_data = [self._remove_boilerplate(t) for t in llmlingua_compressed]
        stats['final_tokens'] = sum(len(t.split()) for t in final_data)
        reduction = (1 - stats['final_tokens'] / stats['after_llmlingua_tokens']) * 100
        print(f"  결과: ~{stats['final_tokens']:,} 토큰 ({reduction:.1f}% 절감)")

        # 최종 통계
        print(f"\n{'='*80}")
        print(f"✅ 압축 완료!")
        print(f"{'='*80}")
        total_reduction = (1 - stats['final_tokens'] / stats['original_tokens']) * 100
        print(f"  원본:     ~{stats['original_tokens']:,} 토큰")
        print(f"  최종:     ~{stats['final_tokens']:,} 토큰")
        print(f"  총 절감:  {total_reduction:.1f}%")
        print(f"{'='*80}")

        return final_data, stats

    async def evaluate_with_claude_batchprompt(
        self,
        politician_name: str,
        data_list: List[str]
    ) -> Dict:
        """Claude BatchPrompt: 10개 카테고리 한 번에 평가"""

        print(f"\n    📊 Claude BatchPrompt 평가")
        print(f"    데이터: {len(data_list)}개")

        # 데이터를 JSON으로 (초압축 형태)
        data_json = json.dumps(
            [{"n": i+1, "t": data[:100]} for i, data in enumerate(data_list)],  # 각 100자로 제한
            ensure_ascii=False
        )

        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=20000,
                system=[
                    {
                        "type": "text",
                        "text": self.minimal_system,
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

            # 토큰 사용량
            usage = response.usage
            print(f"      토큰: input={usage.input_tokens}, output={usage.output_tokens}")
            print(f"      캐시: creation={getattr(usage, 'cache_creation_input_tokens', 0)}, "
                  f"read={getattr(usage, 'cache_read_input_tokens', 0)}")

            return result

        except Exception as e:
            print(f"      ❌ 오류: {str(e)}")
            return {}

    async def evaluate_with_chatgpt_batchprompt(
        self,
        politician_name: str,
        data_list: List[str]
    ) -> Dict:
        """ChatGPT BatchPrompt"""

        print(f"\n    📊 ChatGPT BatchPrompt 평가")

        data_json = json.dumps(
            [{"n": i+1, "t": data[:100]} for i, data in enumerate(data_list)],
            ensure_ascii=False
        )

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": self.minimal_system},
                    {"role": "user", "content": f"{politician_name}\n{data_json}"}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)

            usage = response.usage
            print(f"      토큰: input={usage.prompt_tokens}, output={usage.completion_tokens}")

            return result

        except Exception as e:
            print(f"      ❌ 오류: {str(e)}")
            return {}

    async def evaluate_with_grok_batchprompt(
        self,
        politician_name: str,
        data_list: List[str]
    ) -> Dict:
        """Grok BatchPrompt"""

        print(f"\n    📊 Grok BatchPrompt 평가")

        data_json = json.dumps(
            [{"n": i+1, "t": data[:100]} for i, data in enumerate(data_list)],
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
                            {"role": "system", "content": self.minimal_system},
                            {"role": "user", "content": f"{politician_name}\n{data_json}"}
                        ],
                        "temperature": 0.3
                    }
                ) as resp:
                    data = await resp.json()
                    result = json.loads(data['choices'][0]['message']['content'])

                    usage = data.get('usage', {})
                    print(f"      토큰: input={usage.get('prompt_tokens', 0)}, output={usage.get('completion_tokens', 0)}")

                    return result

        except Exception as e:
            print(f"      ❌ 오류: {str(e)}")
            return {}

    async def evaluate_one_politician_full_optimized(
        self,
        politician_name: str,
        politician_id: str
    ) -> Dict:
        """1명 완전 최적화 평가"""

        print(f"\n{'='*80}")
        print(f"🚀 최첨단 초최적화 평가 시작")
        print(f"{'='*80}")
        print(f"정치인: {politician_name}")
        print(f"목표: 98% 토큰 절감")
        print(f"{'='*80}")

        start_time = datetime.now()

        # 1. 데이터 로드
        print(f"\n📥 단계 1: DB 로드")
        raw_data = self._load_data_from_db(politician_id)
        print(f"  로드: {len(raw_data)}개")

        # 2. 초압축
        compressed_data, compression_stats = self._ultra_compress_data_list(raw_data)

        # 3. 3개 AI 병렬 평가 (BatchPrompt)
        print(f"\n📊 단계 2: 3개 AI 병렬 평가 (BatchPrompt)")

        chatgpt_task = self.evaluate_with_chatgpt_batchprompt(politician_name, compressed_data)
        grok_task = self.evaluate_with_grok_batchprompt(politician_name, compressed_data)
        claude_task = self.evaluate_with_claude_batchprompt(politician_name, compressed_data)

        chatgpt_result, grok_result, claude_result = await asyncio.gather(
            chatgpt_task, grok_task, claude_task
        )

        # 4. Pooling 계산
        print(f"\n📈 단계 3: Pooling 계산")
        pooling_scores = self._calculate_pooling_from_batch(
            chatgpt_result, grok_result, claude_result
        )

        elapsed = (datetime.now() - start_time).total_seconds()

        # 결과 출력
        print(f"\n{'='*80}")
        print(f"✅ 평가 완료!")
        print(f"{'='*80}")
        print(f"  소요 시간: {elapsed:.1f}초 ({elapsed/60:.1f}분)")
        print(f"  데이터: {compression_stats['original_count']}개")
        print(f"  토큰 절감: {(1 - compression_stats['final_tokens'] / compression_stats['original_tokens']) * 100:.1f}%")
        print(f"{'='*80}")

        print(f"\n📊 Pooling 점수:")
        for cat in CATEGORIES:
            score = pooling_scores.get(cat, 0)
            print(f"  {CATEGORY_KOREAN[cat]:8s}: {score:.2f}점")

        avg_score = sum(pooling_scores.values()) / len(pooling_scores) if pooling_scores else 0
        print(f"\n  평균: {avg_score:.2f}점")

        return {
            'politician': politician_name,
            'politician_id': politician_id,
            'compression_stats': compression_stats,
            'chatgpt': chatgpt_result,
            'grok': grok_result,
            'claude': claude_result,
            'pooling': pooling_scores,
            'elapsed_seconds': elapsed
        }

    def _calculate_pooling_from_batch(
        self,
        chatgpt: Dict,
        grok: Dict,
        claude: Dict
    ) -> Dict:
        """BatchPrompt 결과에서 Pooling 계산"""

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
    print("🚀 최첨단 초최적화 Pooling 평가 시스템")
    print("="*80)
    print(f"테스트: {TEST_POLITICIAN['name']}")
    print(f"목표: 98% 토큰 절감")
    print(f"")
    print(f"최적화 기법:")
    print(f"  1. 중복 제거")
    print(f"  2. NER 핵심 추출")
    print(f"  3. LLMLingua 압축 (20배)")
    print(f"  4. 불필요 문구 제거")
    print(f"  5. System Message 최소화 (15토큰)")
    print(f"  6. Prompt Caching")
    print(f"  7. BatchPrompt (1회 API)")
    print("="*80)

    evaluator = FullOptimizedEvaluator()

    # 평가 실행
    result = await evaluator.evaluate_one_politician_full_optimized(
        TEST_POLITICIAN['name'],
        TEST_POLITICIAN['id']
    )

    # 결과 저장
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"FULL_optimized_test_{TEST_POLITICIAN['name']}_{timestamp}.json"

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n💾 결과 저장: {filename}")


if __name__ == "__main__":
    asyncio.run(main())
