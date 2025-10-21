import anthropic
import json
import re
from typing import Dict, Any
from ..core.config import settings
import asyncio
import logging

logger = logging.getLogger(__name__)

# API 호출 타임아웃 (초 단위)
CLAUDE_API_TIMEOUT = 60  # 60초


class ClaudeClient:
    """Claude API 클라이언트"""

    def __init__(self):
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY가 설정되지 않았습니다.")

        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-3-5-sonnet-20241022"  # 최신 모델

    async def send_message(
        self,
        prompt: str,
        max_tokens: int = 8000,
        temperature: float = 0.7,
        timeout: int = CLAUDE_API_TIMEOUT
    ) -> str:
        """
        Claude에게 메시지 전송 및 응답 받기 (타임아웃 포함)

        Args:
            prompt: 전송할 프롬프트
            max_tokens: 최대 토큰 수
            temperature: 온도 (0-1)
            timeout: API 호출 타임아웃 (초)

        Returns:
            Claude의 응답 텍스트

        Raises:
            asyncio.TimeoutError: API 호출이 타임아웃된 경우
            RuntimeError: API 호출 실패
        """

        try:
            # 타임아웃을 설정하여 Claude API 호출 (동기식이므로 asyncio로 wrapping)
            loop = asyncio.get_event_loop()
            message = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: self.client.messages.create(
                        model=self.model,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        messages=[
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ]
                    )
                ),
                timeout=timeout
            )

            # 응답 추출
            if message.content and len(message.content) > 0:
                return message.content[0].text

            raise ValueError("Claude로부터 빈 응답을 받았습니다.")

        except asyncio.TimeoutError:
            logger.error(f"Claude API 호출 타임아웃 ({timeout}초 초과)")
            raise RuntimeError(f"Claude API 호출이 {timeout}초 이상 소요되어 타임아웃되었습니다.")
        except Exception as e:
            logger.error(f"Claude API 호출 실패: {str(e)}")
            raise RuntimeError(f"Claude API 호출 실패: {str(e)}")

    def parse_json_response(self, response: str) -> Dict[str, Any]:
        """
        Claude 응답에서 JSON 추출 (안전하고 강력한 파싱)

        Args:
            response: Claude 응답 텍스트

        Returns:
            파싱된 JSON 딕셔너리

        Raises:
            ValueError: JSON 파싱 실패
        """

        try:
            json_str = response.strip()

            # JSON 코드 블록이 있는 경우 추출 (Regex 사용으로 더 안전)
            if "```json" in response:
                match = re.search(r"```json\s*(.*?)\s*```", response, re.DOTALL)
                if match:
                    json_str = match.group(1).strip()
                else:
                    logger.warning("JSON 블록 형식 불일치, 원본 사용")
            elif "```" in response:
                match = re.search(r"```\s*(.*?)\s*```", response, re.DOTALL)
                if match:
                    json_str = match.group(1).strip()
                else:
                    logger.warning("코드 블록 형식 불일치, 원본 사용")

            # JSON 파싱
            result = json.loads(json_str)
            logger.debug(f"JSON 파싱 성공: {len(json_str)} 바이트")
            return result

        except json.JSONDecodeError as e:
            logger.error(f"JSON 파싱 실패: {str(e)}")
            # 상세한 에러 메시지 제공
            error_context = f"\n응답 (처음 500 chars): {response[:500]}\n응답 (마지막 200 chars): {response[-200:]}"
            raise ValueError(f"JSON 파싱 실패: {str(e)}{error_context}")
        except Exception as e:
            logger.error(f"예기치 않은 파싱 오류: {str(e)}")
            raise ValueError(f"JSON 파싱 중 예기치 않은 오류: {str(e)}")
