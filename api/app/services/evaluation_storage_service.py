from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import uuid
from typing import Optional

from ..models.evaluation import PoliticianEvaluation
from ..schemas.evaluation import EvaluationCreate


class EvaluationStorageService:
    """평가 결과 저장 서비스"""

    def __init__(self, db: Session):
        self.db = db

    def save_evaluation(
        self,
        evaluation_data: EvaluationCreate
    ) -> PoliticianEvaluation:
        """
        평가 결과 저장

        Args:
            evaluation_data: 평가 결과 데이터

        Returns:
            저장된 PoliticianEvaluation 객체

        Raises:
            ValueError: 검증 실패
            IntegrityError: DB 제약 조건 위반
        """

        try:
            # ORM 객체 생성
            evaluation = PoliticianEvaluation(
                politician_name=evaluation_data.politician_name,
                politician_position=evaluation_data.politician_position,
                politician_party=evaluation_data.politician_party,
                politician_region=evaluation_data.politician_region,
                ai_model=evaluation_data.ai_model,
                data_sources=evaluation_data.data_sources,
                raw_data_100=evaluation_data.raw_data_100,
                category_scores=evaluation_data.category_scores,
                rationale=evaluation_data.rationale,
                strengths=evaluation_data.strengths,
                weaknesses=evaluation_data.weaknesses,
                overall_assessment=evaluation_data.overall_assessment,
                final_score=evaluation_data.final_score,
                grade=evaluation_data.grade,
                user_id=evaluation_data.user_id,
                payment_id=evaluation_data.payment_id
            )

            # DB 저장
            self.db.add(evaluation)
            self.db.commit()
            self.db.refresh(evaluation)

            return evaluation

        except IntegrityError as e:
            self.db.rollback()
            raise ValueError(f"데이터베이스 제약 조건 위반: {str(e)}")

        except Exception as e:
            self.db.rollback()
            raise

    def get_evaluation(self, evaluation_id: uuid.UUID) -> Optional[PoliticianEvaluation]:
        """평가 결과 조회"""

        evaluation = self.db.query(PoliticianEvaluation)\
            .filter(PoliticianEvaluation.id == evaluation_id)\
            .first()

        return evaluation

    def get_latest_by_politician(
        self,
        politician_name: str,
        ai_model: Optional[str] = None
    ) -> Optional[PoliticianEvaluation]:
        """정치인별 최신 평가 조회"""

        query = self.db.query(PoliticianEvaluation)\
            .filter(PoliticianEvaluation.politician_name == politician_name)

        if ai_model:
            query = query.filter(PoliticianEvaluation.ai_model == ai_model)

        evaluation = query.order_by(
            PoliticianEvaluation.created_at.desc()
        ).first()

        return evaluation

    def get_all_evaluations(
        self,
        skip: int = 0,
        limit: int = 100
    ) -> list[PoliticianEvaluation]:
        """모든 평가 결과 조회 (페이지네이션)"""

        evaluations = self.db.query(PoliticianEvaluation)\
            .order_by(PoliticianEvaluation.created_at.desc())\
            .offset(skip)\
            .limit(limit)\
            .all()

        return evaluations
