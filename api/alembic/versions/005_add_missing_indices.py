"""Add missing database indices for performance optimization

Revision ID: 005
Revises: 004
Create Date: 2025-10-21 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '005'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    성능 최적화를 위해 누락된 인덱스 추가
    - politician.name에 인덱스 (검색 쿼리 최적화)
    - post.slug에 복합 인덱스 (조회 최적화)
    - rating user_id/politician_id 복합 인덱스
    - post/comment created_at 역순 인덱스 (최신 목록)
    """

    # 1. Politician name 인덱스 (검색 최적화)
    op.create_index(
        'idx_politician_name_search',
        'politicians',
        ['name'],
        postgresql_using='btree'
    )

    # 2. Politician party + avg_rating 복합 인덱스 (필터링 최적화)
    op.create_index(
        'idx_politician_party_avg_rating',
        'politicians',
        ['party', 'avg_rating'],
        postgresql_using='btree',
        postgresql_ops={'avg_rating': 'DESC'}
    )

    # 3. Politician district + avg_rating 복합 인덱스 (지역별 검색)
    op.create_index(
        'idx_politician_district_avg_rating',
        'politicians',
        ['district', 'avg_rating'],
        postgresql_using='btree'
    )

    # 4. Post slug 복합 인덱스 (URL 기반 조회)
    op.create_index(
        'idx_post_category_slug',
        'posts',
        ['category', 'slug'],
        postgresql_using='btree'
    )

    # 5. Post created_at 역순 인덱스 (최신 목록 조회)
    op.create_index(
        'idx_post_created_at_desc',
        'posts',
        ['created_at'],
        postgresql_using='btree',
        postgresql_ops={'created_at': 'DESC'}
    )

    # 6. Comment politician_id + created_at (정치인별 최신 댓글)
    op.create_index(
        'idx_comment_politician_created',
        'comments',
        ['politician_id', 'created_at'],
        postgresql_using='btree'
    )

    # 7. Comment user_id (사용자별 댓글 조회)
    op.create_index(
        'idx_comment_user_id',
        'comments',
        ['user_id'],
        postgresql_using='btree'
    )

    # 8. Rating user_id + politician_id (중복 방지 체크)
    op.create_index(
        'idx_rating_user_politician',
        'ratings',
        ['user_id', 'politician_id'],
        postgresql_using='btree'
    )

    # 9. Rating politician_id (정치인별 평가 집계)
    op.create_index(
        'idx_rating_politician_id_opt',
        'ratings',
        ['politician_id'],
        postgresql_using='btree'
    )

    # 10. User email 인덱스 (로그인 최적화)
    op.create_index(
        'idx_user_email',
        'users',
        ['email'],
        postgresql_using='btree'
    )

    # 11. User username 인덱스 (사용자명 검색)
    op.create_index(
        'idx_user_username',
        'users',
        ['username'],
        postgresql_using='btree'
    )

    # 12. Notification user_id + created_at (사용자별 최신 알림)
    op.create_index(
        'idx_notification_user_created',
        'notifications',
        ['user_id', 'created_at'],
        postgresql_using='btree'
    )


def downgrade() -> None:
    """Roll back all added indices"""

    op.drop_index('idx_notification_user_created', table_name='notifications')
    op.drop_index('idx_user_username', table_name='users')
    op.drop_index('idx_user_email', table_name='users')
    op.drop_index('idx_rating_politician_id_opt', table_name='ratings')
    op.drop_index('idx_rating_user_politician', table_name='ratings')
    op.drop_index('idx_comment_user_id', table_name='comments')
    op.drop_index('idx_comment_politician_created', table_name='comments')
    op.drop_index('idx_post_created_at_desc', table_name='posts')
    op.drop_index('idx_post_category_slug', table_name='posts')
    op.drop_index('idx_politician_district_avg_rating', table_name='politicians')
    op.drop_index('idx_politician_party_avg_rating', table_name='politicians')
    op.drop_index('idx_politician_name_search', table_name='politicians')
