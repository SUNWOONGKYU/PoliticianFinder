from typing import Dict, Any
import asyncio
from ..utils.claude_client import ClaudeClient
from ..utils.prompt_builder import build_evaluation_prompt


class EvaluationService:
    """정치인 평가 서비스"""

    def __init__(self):
        self.claude_client = ClaudeClient()

    async def evaluate_politician(
        self,
        politician_info: Dict[str, str],
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """
        정치인 평가 수행

        Args:
            politician_info: 정치인 기본 정보
                - name: 이름
                - position: 직책
                - party: 소속 정당
                - region: 지역 (선택)
            max_retries: 최대 재시도 횟수

        Returns:
            평가 결과 딕셔너리

        Raises:
            ValueError: 검증 실패
            RuntimeError: API 호출 실패
        """

        # 프롬프트 생성
        prompt = build_evaluation_prompt(politician_info)

        # Claude API 호출 (재시도 로직)
        for attempt in range(max_retries):
            try:
                response = await self.claude_client.send_message(
                    prompt=prompt,
                    max_tokens=8000,
                    temperature=0.3  # 일관성을 위해 낮은 온도
                )

                # JSON 파싱
                result = self.claude_client.parse_json_response(response)

                # 결과 검증
                self._validate_evaluation_result(result)

                # 최종 점수 및 등급 계산
                result['final_score'] = self._calculate_final_score(result['category_scores'])
                result['grade'] = self._calculate_grade(result['final_score'])

                return result

            except Exception as e:
                if attempt == max_retries - 1:
                    raise RuntimeError(f"평가 실패 (재시도 {max_retries}회): {str(e)}")

                # 재시도 전 대기 (지수 백오프)
                await asyncio.sleep(2 ** attempt)

    def _validate_evaluation_result(self, result: Dict[str, Any]) -> None:
        """
        평가 결과 검증

        Args:
            result: 평가 결과 딕셔너리

        Raises:
            ValueError: 검증 실패
        """

        # 필수 키 확인
        required_keys = [
            'data_sources',
            'raw_data_100',
            'category_scores',
            'rationale',
            'strengths',
            'weaknesses',
            'overall_assessment'
        ]

        for key in required_keys:
            if key not in result:
                raise ValueError(f"필수 키 누락: {key}")

        # data_sources 검증
        if not isinstance(result['data_sources'], list) or len(result['data_sources']) == 0:
            raise ValueError("data_sources는 비어있지 않은 리스트여야 합니다.")

        # raw_data_100 검증 (최소 10개 이상)
        if not isinstance(result['raw_data_100'], dict) or len(result['raw_data_100']) < 10:
            raise ValueError("raw_data_100은 최소 10개 이상의 항목을 포함해야 합니다.")

        # category_scores 검증 (정확히 10개)
        expected_categories = [
            '청렴성', '전문성', '소통능력', '리더십', '책임감',
            '투명성', '대응성', '비전', '공익추구', '윤리성'
        ]

        if not isinstance(result['category_scores'], dict):
            raise ValueError("category_scores는 딕셔너리여야 합니다.")

        if len(result['category_scores']) != 10:
            raise ValueError(f"category_scores는 정확히 10개여야 합니다. (현재: {len(result['category_scores'])}개)")

        # 점수 범위 검증 (0-10)
        for category, score in result['category_scores'].items():
            if not isinstance(score, (int, float)):
                raise ValueError(f"{category} 점수는 숫자여야 합니다.")

            if not (0 <= score <= 10):
                raise ValueError(f"{category} 점수는 0-10 사이여야 합니다. (현재: {score})")

        # rationale 검증 (10개 분야)
        if not isinstance(result['rationale'], dict) or len(result['rationale']) != 10:
            raise ValueError("rationale은 10개 분야를 포함해야 합니다.")

        # strengths, weaknesses 검증
        if not isinstance(result['strengths'], list) or len(result['strengths']) == 0:
            raise ValueError("strengths는 비어있지 않은 리스트여야 합니다.")

        if not isinstance(result['weaknesses'], list) or len(result['weaknesses']) == 0:
            raise ValueError("weaknesses는 비어있지 않은 리스트여야 합니다.")

        # overall_assessment 검증
        if not isinstance(result['overall_assessment'], str) or len(result['overall_assessment'].strip()) == 0:
            raise ValueError("overall_assessment는 비어있지 않은 문자열이어야 합니다.")

    def _calculate_final_score(self, category_scores: Dict[str, float]) -> float:
        """
        최종 점수 계산 (10개 분야 평균 * 10)

        Args:
            category_scores: 10개 분야 점수 (0-10)

        Returns:
            최종 점수 (0-100)
        """

        total = sum(category_scores.values())
        average = total / len(category_scores)
        final_score = average * 10  # 0-100 스케일로 변환

        return round(final_score, 2)

    def _calculate_grade(self, final_score: float) -> str:
        """
        등급 계산

        Args:
            final_score: 최종 점수 (0-100)

        Returns:
            등급 (S/A/B/C/D)
        """

        if final_score >= 95:
            return 'S'
        elif final_score >= 85:
            return 'A'
        elif final_score >= 75:
            return 'B'
        elif final_score >= 65:
            return 'C'
        else:
            return 'D'
