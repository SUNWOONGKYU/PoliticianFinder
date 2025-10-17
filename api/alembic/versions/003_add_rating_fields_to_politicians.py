"""Add rating fields and indexes to politicians table

Revision ID: 003_add_rating_fields
Revises: 002
Create Date: 2025-10-17 00:17:14

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import Column, Integer, Numeric, CheckConstraint, Index
from sqlalchemy.dialects import sqlite, postgresql


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    """
    정치인 테이블에 평가 통계 필드 추가 및 인덱스 생성
    - avg_rating: 평균 평점 (DECIMAL(2,1), 0.0-5.0)
    - total_ratings: 평가 개수 (INTEGER, 0 이상)
    - 성능 최적화를 위한 인덱스 추가
    """

    # SQLite와 PostgreSQL 모두 지원하기 위한 처리
    connection = op.get_bind()
    is_sqlite = 'sqlite' in str(connection.dialect)

    # 기존 컬럼 확인 및 이름 변경 (average_rating -> avg_rating)
    if not is_sqlite:
        # PostgreSQL의 경우
        # 기존 average_rating 컬럼을 avg_rating으로 변경하고 타입 변경
        op.alter_column('politicians',
                       'average_rating',
                       new_column_name='avg_rating',
                       type_=sa.Numeric(2, 1),
                       existing_type=sa.Float,
                       existing_nullable=False,
                       server_default='0.0')
    else:
        # SQLite의 경우 - 컬럼 이름 변경 지원 안됨, 새 컬럼 추가
        try:
            op.add_column('politicians',
                         Column('avg_rating',
                                Numeric(2, 1),
                                nullable=False,
                                server_default='0.0'))

            # 기존 average_rating 데이터 복사
            connection.execute(
                "UPDATE politicians SET avg_rating = ROUND(average_rating, 1)"
            )

            # 기존 average_rating 컬럼 삭제는 SQLite에서 지원 안됨
            # 나중에 전체 테이블 재생성이 필요한 경우 처리
        except:
            pass  # 이미 존재하는 경우 무시

    # total_ratings 컬럼은 이미 존재함 (확인됨)
    # 제약조건만 추가

    # 제약조건 추가 (PostgreSQL의 경우)
    if not is_sqlite:
        # avg_rating 범위 체크 (0.0 - 5.0)
        op.create_check_constraint(
            'check_avg_rating_range',
            'politicians',
            sa.and_(
                sa.column('avg_rating') >= 0.0,
                sa.column('avg_rating') <= 5.0
            )
        )

        # total_ratings 음수 방지
        op.create_check_constraint(
            'check_total_ratings_positive',
            'politicians',
            sa.column('total_ratings') >= 0
        )

    # 인덱스 추가
    # 1. 평균 평점 인덱스 (정렬 쿼리 최적화)
    op.create_index(
        'idx_politicians_avg_rating',
        'politicians',
        ['avg_rating'],
        postgresql_using='btree',
        postgresql_ops={'avg_rating': 'DESC'}
    )

    # 2. 복합 인덱스 - 정당 + 평점 (필터링 최적화)
    op.create_index(
        'idx_politicians_party_rating',
        'politicians',
        ['party', 'avg_rating'],
        postgresql_using='btree'
    )

    # 3. 복합 인덱스 - 지역 + 평점 (필터링 최적화)
    # district 컬럼 사용 (region이 아닌 district가 실제 컬럼명)
    op.create_index(
        'idx_politicians_district_rating',
        'politicians',
        ['district', 'avg_rating'],
        postgresql_using='btree'
    )

    # 기존 데이터 마이그레이션
    if is_sqlite:
        # SQLite의 경우 avg_rating 초기화
        connection.execute(
            "UPDATE politicians SET avg_rating = 0.0 WHERE avg_rating IS NULL"
        )
        connection.execute(
            "UPDATE politicians SET total_ratings = 0 WHERE total_ratings IS NULL"
        )


def downgrade():
    """
    마이그레이션 롤백
    - 인덱스 제거
    - 제약조건 제거
    - 컬럼 원래대로 복구
    """

    connection = op.get_bind()
    is_sqlite = 'sqlite' in str(connection.dialect)

    # 인덱스 제거
    op.drop_index('idx_politicians_district_rating', 'politicians')
    op.drop_index('idx_politicians_party_rating', 'politicians')
    op.drop_index('idx_politicians_avg_rating', 'politicians')

    # 제약조건 제거 (PostgreSQL의 경우)
    if not is_sqlite:
        op.drop_constraint('check_total_ratings_positive', 'politicians', type_='check')
        op.drop_constraint('check_avg_rating_range', 'politicians', type_='check')

        # avg_rating을 다시 average_rating으로 변경
        op.alter_column('politicians',
                       'avg_rating',
                       new_column_name='average_rating',
                       type_=sa.Float,
                       existing_type=sa.Numeric(2, 1),
                       existing_nullable=False,
                       server_default='0.0')
    else:
        # SQLite의 경우 컬럼 삭제 불가
        # 전체 테이블 재생성이 필요한 경우만 처리
        pass