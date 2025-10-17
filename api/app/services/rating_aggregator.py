"""
평가 집계 서비스
정치인의 평균 평점을 계산하고 업데이트하는 로직을 제공합니다.
"""

from typing import Dict, Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from decimal import Decimal
import logging

from ..models.politician import Politician
from ..models.rating import Rating

# 로거 설정
logger = logging.getLogger(__name__)


class RatingAggregationResult:
    """집계 결과를 담는 클래스"""

    def __init__(self, politician_id: int):
        self.politician_id = politician_id
        self.avg_rating: float = 0.0
        self.total_ratings: int = 0
        self.dimension_averages: Dict[str, float] = {}
        self.success: bool = False
        self.error: Optional[str] = None


class RatingAggregator:
    """평가 집계 로직을 처리하는 클래스"""

    # 12차원 평가 항목
    RATING_DIMENSIONS = [
        'integrity',           # 정직성/청렴성
        'communication',        # 소통능력
        'expertise',           # 전문성
        'leadership',          # 리더십
        'consistency',         # 일관성
        'empathy',             # 공감능력
        'problem_solving',     # 문제해결능력
        'accountability',      # 책임감
        'vision',              # 비전
        'transparency',        # 투명성
        'local_engagement',    # 지역사회 참여
        'national_perspective' # 국가 전체 관점
    ]

    def __init__(self, db_session: Session):
        """
        초기화

        Args:
            db_session: SQLAlchemy 데이터베이스 세션
        """
        self.db = db_session

    def aggregate_ratings(
        self,
        politician_id: int,
        update_politician: bool = True
    ) -> RatingAggregationResult:
        """
        특정 정치인의 평가를 집계합니다.

        Args:
            politician_id: 정치인 ID
            update_politician: 정치인 테이블 업데이트 여부

        Returns:
            RatingAggregationResult: 집계 결과
        """
        result = RatingAggregationResult(politician_id)

        try:
            # 정치인 존재 확인
            politician = self.db.query(Politician).filter(
                Politician.id == politician_id
            ).first()

            if not politician:
                result.error = f"정치인을 찾을 수 없습니다: ID={politician_id}"
                logger.error(result.error)
                return result

            # 모든 평가 조회
            ratings = self.db.query(Rating).filter(
                Rating.politician_id == politician_id
            ).all()

            if not ratings:
                # 평가가 없는 경우
                result.avg_rating = 0.0
                result.total_ratings = 0
                result.success = True

                if update_politician:
                    self._update_politician_stats(politician, result)

                return result

            # 전체 평균 계산 (average_score 필드 사용)
            total_score = sum(r.average_score for r in ratings)
            result.avg_rating = round(total_score / len(ratings), 1)
            result.total_ratings = len(ratings)

            # 각 차원별 평균 계산
            for dimension in self.RATING_DIMENSIONS:
                dimension_sum = sum(getattr(r, dimension) for r in ratings)
                result.dimension_averages[dimension] = round(
                    dimension_sum / len(ratings), 2
                )

            # 정치인 테이블 업데이트
            if update_politician:
                self._update_politician_stats(politician, result)

            result.success = True
            logger.info(
                f"정치인 {politician_id}의 평가 집계 완료: "
                f"평균={result.avg_rating}, 개수={result.total_ratings}"
            )

        except Exception as e:
            result.error = f"집계 중 오류 발생: {str(e)}"
            logger.error(result.error, exc_info=True)

        return result

    def _update_politician_stats(
        self,
        politician: Politician,
        result: RatingAggregationResult
    ) -> None:
        """
        정치인 통계 업데이트

        Args:
            politician: 정치인 객체
            result: 집계 결과
        """
        try:
            politician.avg_rating = Decimal(str(result.avg_rating))
            politician.total_ratings = result.total_ratings
            self.db.commit()
            logger.info(f"정치인 {politician.id} 통계 업데이트 완료")
        except Exception as e:
            self.db.rollback()
            logger.error(f"정치인 통계 업데이트 실패: {str(e)}")
            raise

    def aggregate_by_dimension(
        self,
        politician_id: int,
        dimension: str
    ) -> Optional[float]:
        """
        특정 차원의 평균 평점을 계산합니다.

        Args:
            politician_id: 정치인 ID
            dimension: 평가 차원 (예: 'integrity', 'communication')

        Returns:
            Optional[float]: 해당 차원의 평균 평점
        """
        if dimension not in self.RATING_DIMENSIONS:
            logger.error(f"잘못된 차원: {dimension}")
            return None

        try:
            avg_value = self.db.query(
                func.avg(getattr(Rating, dimension))
            ).filter(
                Rating.politician_id == politician_id
            ).scalar()

            return round(float(avg_value), 2) if avg_value else 0.0

        except Exception as e:
            logger.error(f"차원별 집계 실패: {str(e)}")
            return None

    def aggregate_all_politicians(
        self,
        batch_size: int = 100
    ) -> Tuple[int, int]:
        """
        모든 정치인의 평가를 일괄 집계합니다.

        Args:
            batch_size: 배치 처리 크기

        Returns:
            Tuple[int, int]: (성공 건수, 실패 건수)
        """
        success_count = 0
        failure_count = 0

        try:
            # 모든 정치인 ID 조회
            politicians = self.db.query(Politician).all()
            total = len(politicians)

            logger.info(f"전체 {total}명의 정치인 평가 집계 시작")

            for i in range(0, total, batch_size):
                batch = politicians[i:i + batch_size]

                for politician in batch:
                    result = self.aggregate_ratings(
                        politician.id,
                        update_politician=True
                    )

                    if result.success:
                        success_count += 1
                    else:
                        failure_count += 1

                # 배치마다 커밋
                self.db.commit()
                logger.info(f"진행 상황: {min(i + batch_size, total)}/{total}")

            logger.info(
                f"전체 집계 완료: 성공={success_count}, 실패={failure_count}"
            )

        except Exception as e:
            logger.error(f"전체 집계 실패: {str(e)}")
            self.db.rollback()
            raise

        return success_count, failure_count

    def get_top_rated_politicians(
        self,
        limit: int = 10,
        min_ratings: int = 5
    ) -> List[Dict]:
        """
        평점이 높은 정치인 목록을 반환합니다.

        Args:
            limit: 반환할 정치인 수
            min_ratings: 최소 평가 개수

        Returns:
            List[Dict]: 상위 정치인 목록
        """
        try:
            politicians = self.db.query(
                Politician.id,
                Politician.name,
                Politician.party,
                Politician.position,
                Politician.avg_rating,
                Politician.total_ratings
            ).filter(
                Politician.total_ratings >= min_ratings
            ).order_by(
                Politician.avg_rating.desc()
            ).limit(limit).all()

            return [
                {
                    'id': p.id,
                    'name': p.name,
                    'party': p.party.value if p.party else None,
                    'position': p.position,
                    'avg_rating': float(p.avg_rating),
                    'total_ratings': p.total_ratings
                }
                for p in politicians
            ]

        except Exception as e:
            logger.error(f"상위 정치인 조회 실패: {str(e)}")
            return []

    def get_dimension_rankings(
        self,
        dimension: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        특정 차원에서 높은 평가를 받은 정치인 목록을 반환합니다.

        Args:
            dimension: 평가 차원
            limit: 반환할 정치인 수

        Returns:
            List[Dict]: 차원별 상위 정치인 목록
        """
        if dimension not in self.RATING_DIMENSIONS:
            logger.error(f"잘못된 차원: {dimension}")
            return []

        try:
            # 서브쿼리로 차원별 평균 계산
            subquery = self.db.query(
                Rating.politician_id,
                func.avg(getattr(Rating, dimension)).label('avg_dimension'),
                func.count(Rating.id).label('count_ratings')
            ).group_by(Rating.politician_id).subquery()

            # 정치인 정보와 조인
            results = self.db.query(
                Politician.id,
                Politician.name,
                Politician.party,
                subquery.c.avg_dimension,
                subquery.c.count_ratings
            ).join(
                subquery, Politician.id == subquery.c.politician_id
            ).filter(
                subquery.c.count_ratings >= 3  # 최소 3개 이상의 평가
            ).order_by(
                subquery.c.avg_dimension.desc()
            ).limit(limit).all()

            return [
                {
                    'id': r.id,
                    'name': r.name,
                    'party': r.party.value if r.party else None,
                    f'{dimension}_avg': round(float(r.avg_dimension), 2),
                    'total_ratings': r.count_ratings
                }
                for r in results
            ]

        except Exception as e:
            logger.error(f"차원별 순위 조회 실패: {str(e)}")
            return []


# 트리거 함수: 평가 생성/수정/삭제 시 자동 집계
def trigger_aggregation_on_rating_change(
    db: Session,
    politician_id: int
) -> None:
    """
    평가 변경 시 자동으로 집계를 수행합니다.

    Args:
        db: 데이터베이스 세션
        politician_id: 정치인 ID
    """
    aggregator = RatingAggregator(db)
    result = aggregator.aggregate_ratings(politician_id, update_politician=True)

    if not result.success:
        logger.warning(f"자동 집계 실패: {result.error}")