from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from ...core.database import get_db
from ...services.evaluation_service import EvaluationService
from ...services.evaluation_storage_service import EvaluationStorageService
from ...schemas.evaluation import EvaluationCreate, EvaluationResponse, EvaluationDetail
from ...schemas.politician import PoliticianInfoRequest


router = APIRouter(prefix="/evaluation", tags=["evaluation"])


@router.post("/evaluate-and-save", response_model=EvaluationResponse, status_code=status.HTTP_201_CREATED)
async def evaluate_and_save_politician(
    politician_info: PoliticianInfoRequest,
    db: Session = Depends(get_db)
):
    """
    정치인 평가 + 저장 (통합)

    1. Claude에게 평가 요청
    2. 결과 검증
    3. DB 저장
    4. 저장된 평가 반환

    **Security**: Input validated with Pydantic schema to prevent SQL injection

    **Request Body**:
    ```json
    {
        "name": "박형준",
        "position": "부산시장",
        "party": "국민의힘",
        "region": "부산광역시"
    }
    ```
    """

    try:
        # Convert validated Pydantic model to dict for service
        politician_dict = {
            'name': politician_info.name,
            'position': politician_info.position,
            'party': politician_info.party,
            'region': politician_info.region
        }

        # 1. AI 평가
        eval_service = EvaluationService()
        evaluation_result = await eval_service.evaluate_politician(politician_dict)

        # 2. 저장 데이터 구성
        evaluation_data = EvaluationCreate(
            politician_name=politician_info.name,
            politician_position=politician_info.position,
            politician_party=politician_info.party,
            politician_region=politician_info.region,
            ai_model='claude',
            **evaluation_result
        )

        # 3. DB 저장
        storage_service = EvaluationStorageService(db)
        saved_evaluation = storage_service.save_evaluation(evaluation_data)

        return saved_evaluation

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"서버 오류: {str(e)}"
        )


@router.get("/evaluations/{evaluation_id}", response_model=EvaluationDetail)
def get_evaluation(
    evaluation_id: str,
    db: Session = Depends(get_db)
):
    """
    평가 결과 조회

    **Path Parameters**:
    - evaluation_id: 평가 ID (UUID)
    """

    try:
        storage_service = EvaluationStorageService(db)
        evaluation = storage_service.get_evaluation(uuid.UUID(evaluation_id))

        if not evaluation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"평가 결과를 찾을 수 없습니다: {evaluation_id}"
            )

        return evaluation

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"잘못된 UUID 형식: {evaluation_id}"
        )


@router.get("/evaluations/politician/{politician_name}", response_model=EvaluationDetail)
def get_latest_evaluation_by_politician(
    politician_name: str,
    ai_model: str = None,
    db: Session = Depends(get_db)
):
    """
    정치인별 최신 평가 조회

    **Path Parameters**:
    - politician_name: 정치인 이름

    **Query Parameters**:
    - ai_model: AI 모델명 (선택, 미지정시 모든 AI 중 최신)
    """

    storage_service = EvaluationStorageService(db)
    evaluation = storage_service.get_latest_by_politician(politician_name, ai_model)

    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{politician_name} 평가 결과를 찾을 수 없습니다."
        )

    return evaluation
