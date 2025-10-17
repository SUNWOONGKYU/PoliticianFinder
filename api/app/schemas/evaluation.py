from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Optional
from datetime import datetime
import uuid


class EvaluationCreate(BaseModel):
    """평가 결과 저장 요청"""

    politician_name: str = Field(..., max_length=100)
    politician_position: str = Field(..., max_length=100)
    politician_party: str = Field(..., max_length=100)
    politician_region: Optional[str] = Field(None, max_length=100)

    ai_model: str = Field(..., max_length=50)

    data_sources: List[str]
    raw_data_100: Dict[str, float]
    category_scores: Dict[str, float]
    rationale: Dict[str, str]
    strengths: List[str]
    weaknesses: List[str]
    overall_assessment: str

    final_score: float = Field(..., ge=0, le=100)
    grade: str = Field(..., pattern="^[SABCD]$")

    user_id: Optional[uuid.UUID] = None
    payment_id: Optional[uuid.UUID] = None

    @field_validator('raw_data_100')
    @classmethod
    def validate_raw_data(cls, v):
        if len(v) < 10:
            raise ValueError("raw_data_100 must have at least 10 items")
        return v

    @field_validator('category_scores')
    @classmethod
    def validate_categories(cls, v):
        expected_categories = [
            '청렴성', '전문성', '소통능력', '리더십', '책임감',
            '투명성', '대응성', '비전', '공익추구', '윤리성'
        ]

        if len(v) != 10:
            raise ValueError("category_scores must have exactly 10 categories")

        for score in v.values():
            if not (0 <= score <= 10):
                raise ValueError("Category scores must be between 0 and 10")

        return v

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "politician_name": "박형준",
                "politician_position": "부산시장",
                "politician_party": "국민의힘",
                "politician_region": "부산광역시",
                "ai_model": "claude",
                "data_sources": ["국회 의안정보시스템", "선관위"],
                "raw_data_100": {"본회의_출석률": 95.5},
                "category_scores": {"청렴성": 8.5},
                "rationale": {"청렴성": "재산 공개가 투명..."},
                "strengths": ["전문성 우수"],
                "weaknesses": ["소통 개선 필요"],
                "overall_assessment": "전반적으로 우수...",
                "final_score": 85.2,
                "grade": "B"
            }]
        }
    }


class EvaluationResponse(BaseModel):
    """평가 결과 저장 응답"""

    id: uuid.UUID
    politician_name: str
    politician_position: str
    politician_party: str
    politician_region: Optional[str]
    ai_model: str
    final_score: float
    grade: str
    created_at: datetime

    model_config = {"from_attributes": True}


class EvaluationDetail(BaseModel):
    """평가 결과 상세 조회 응답"""

    id: uuid.UUID
    politician_name: str
    politician_position: str
    politician_party: str
    politician_region: Optional[str]
    ai_model: str

    data_sources: List[str]
    raw_data_100: Dict[str, float]
    category_scores: Dict[str, float]
    rationale: Dict[str, str]
    strengths: List[str]
    weaknesses: List[str]
    overall_assessment: str

    final_score: float
    grade: str

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
