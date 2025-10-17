import anthropic
import json
from typing import Dict, Any
from ..core.config import settings


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
        temperature: float = 0.7
    ) -> str:
        """
        Claude에게 메시지 전송 및 응답 받기

        Args:
            prompt: 전송할 프롬프트
            max_tokens: 최대 토큰 수
            temperature: 온도 (0-1)

        Returns:
            Claude의 응답 텍스트
        """

        try:
            message = self.client.messages.create(
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

            # 응답 추출
            if message.content and len(message.content) > 0:
                return message.content[0].text

            raise ValueError("Claude로부터 빈 응답을 받았습니다.")

        except Exception as e:
            raise RuntimeError(f"Claude API 호출 실패: {str(e)}")

    def parse_json_response(self, response: str) -> Dict[str, Any]:
        """
        Claude 응답에서 JSON 추출

        Args:
            response: Claude 응답 텍스트

        Returns:
            파싱된 JSON 딕셔너리
        """

        try:
            # JSON 코드 블록이 있는 경우 추출
            if "```json" in response:
                json_str = response.split("```json")[1].split("```")[0].strip()
            elif "```" in response:
                json_str = response.split("```")[1].split("```")[0].strip()
            else:
                json_str = response.strip()

            return json.loads(json_str)

        except json.JSONDecodeError as e:
            raise ValueError(f"JSON 파싱 실패: {str(e)}\n응답: {response[:500]}")
        except IndexError as e:
            raise ValueError(f"JSON 블록을 찾을 수 없습니다: {str(e)}")
