"""create core tables

Revision ID: 002
Revises: 001
Create Date: 2025-10-16 01:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create categories table
    op.create_table(
        'categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )
    op.create_index(op.f('ix_categories_name'), 'categories', ['name'], unique=True)
    op.create_index(op.f('ix_categories_slug'), 'categories', ['slug'], unique=True)

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('profile_image_url', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('following_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('followers_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('ratings_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('comments_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # Create politicians table
    op.create_table(
        'politicians',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('party', sa.Enum('DEMOCRATIC', 'PEOPLE_POWER', 'JUSTICE', 'REFORM', 'PROGRESSIVE', 'NEW_FUTURE', 'BASIC_INCOME', 'LABOR', 'INDEPENDENT', 'OTHER', name='politicalparty'), nullable=False),
        sa.Column('position', sa.String(length=100), nullable=False),
        sa.Column('district', sa.String(length=100), nullable=True),
        sa.Column('profile_image_url', sa.String(length=500), nullable=True),
        sa.Column('birth_date', sa.Date(), nullable=True),
        sa.Column('education', sa.Text(), nullable=True),
        sa.Column('career', sa.Text(), nullable=True),
        sa.Column('contact_info', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('sns_accounts', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('ai_summary', sa.Text(), nullable=True),
        sa.Column('total_rating_score', sa.DECIMAL(precision=3, scale=2), nullable=False, server_default='0'),
        sa.Column('total_rating_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('bookmark_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_politicians_name'), 'politicians', ['name'], unique=False)
    op.create_index(op.f('ix_politicians_party'), 'politicians', ['party'], unique=False)
    op.create_index(op.f('ix_politicians_category_id'), 'politicians', ['category_id'], unique=False)
    op.create_index(op.f('ix_politicians_total_rating_score'), 'politicians', ['total_rating_score'], unique=False)

    # Create ratings table
    op.create_table(
        'ratings',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('politician_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('integrity', sa.DECIMAL(precision=2, scale=1), nullable=False),
        sa.Column('communication', sa.DECIMAL(precision=2, scale=1), nullable=False),
        sa.Column('expertise', sa.DECIMAL(precision=2, scale=1), nullable=False),
        sa.Column('leadership', sa.DECIMAL(precision=2, scale=1), nullable=False),
        sa.Column('consistency', sa.DECIMAL(precision=2, scale=1), nullable=False),
        sa.Column('empathy', sa.DECIMAL(precision=2, scale=1), nullable=False),
        sa.Column('problem_solving', sa.DECIMAL(precision=2, scale=1), nullable=False),
        sa.Column('accountability', sa.DECIMAL(precision=2, scale=1), nullable=False),
        sa.Column('vision', sa.DECIMAL(precision=2, scale=1), nullable=False),
        sa.Column('transparency', sa.DECIMAL(precision=2, scale=1), nullable=False),
        sa.Column('local_engagement', sa.DECIMAL(precision=2, scale=1), nullable=False),
        sa.Column('national_perspective', sa.DECIMAL(precision=2, scale=1), nullable=False),
        sa.Column('average_score', sa.DECIMAL(precision=3, scale=2), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['politician_id'], ['politicians.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ratings_user_id'), 'ratings', ['user_id'], unique=False)
    op.create_index(op.f('ix_ratings_politician_id'), 'ratings', ['politician_id'], unique=False)
    op.create_index(op.f('ix_ratings_average_score'), 'ratings', ['average_score'], unique=False)
    op.create_index('ix_ratings_user_politician', 'ratings', ['user_id', 'politician_id'], unique=True)

    # Create comments table
    op.create_table(
        'comments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('politician_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_edited', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('like_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reply_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['parent_id'], ['comments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['politician_id'], ['politicians.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_comments_user_id'), 'comments', ['user_id'], unique=False)
    op.create_index(op.f('ix_comments_politician_id'), 'comments', ['politician_id'], unique=False)
    op.create_index(op.f('ix_comments_parent_id'), 'comments', ['parent_id'], unique=False)

    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.Enum('COMMENT', 'RATING', 'FOLLOW', 'REPLY', 'MENTION', 'SYSTEM', name='notificationtype'), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)
    op.create_index(op.f('ix_notifications_is_read'), 'notifications', ['is_read'], unique=False)

    # Create posts table
    op.create_table(
        'posts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('slug', sa.String(length=200), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('excerpt', sa.String(length=500), nullable=True),
        sa.Column('featured_image_url', sa.String(length=500), nullable=True),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('published_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('like_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('comment_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_posts_slug'), 'posts', ['slug'], unique=True)
    op.create_index(op.f('ix_posts_user_id'), 'posts', ['user_id'], unique=False)
    op.create_index(op.f('ix_posts_is_published'), 'posts', ['is_published'], unique=False)
    op.create_index(op.f('ix_posts_published_at'), 'posts', ['published_at'], unique=False)

    # Create reports table
    op.create_table(
        'reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reporter_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('target_type', sa.Enum('USER', 'COMMENT', 'RATING', 'POST', name='reporttype'), nullable=False),
        sa.Column('target_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reason', sa.Enum('SPAM', 'HATE_SPEECH', 'MISINFORMATION', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'COPYRIGHT_VIOLATION', 'OTHER', name='reportreason'), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED', name='reportstatus'), nullable=False, server_default='PENDING'),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('resolved_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('resolved_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['reporter_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resolved_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reports_reporter_id'), 'reports', ['reporter_id'], unique=False)
    op.create_index(op.f('ix_reports_target_type'), 'reports', ['target_type'], unique=False)
    op.create_index(op.f('ix_reports_target_id'), 'reports', ['target_id'], unique=False)
    op.create_index(op.f('ix_reports_status'), 'reports', ['status'], unique=False)

    # Create user_follows table (many-to-many)
    op.create_table(
        'user_follows',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('follower_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('following_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['follower_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['following_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_user_follows_follower_following', 'user_follows', ['follower_id', 'following_id'], unique=True)
    op.create_index(op.f('ix_user_follows_follower_id'), 'user_follows', ['follower_id'], unique=False)
    op.create_index(op.f('ix_user_follows_following_id'), 'user_follows', ['following_id'], unique=False)

    # Create politician_bookmarks table (many-to-many)
    op.create_table(
        'politician_bookmarks',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('politician_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['politician_id'], ['politicians.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_politician_bookmarks_user_politician', 'politician_bookmarks', ['user_id', 'politician_id'], unique=True)
    op.create_index(op.f('ix_politician_bookmarks_user_id'), 'politician_bookmarks', ['user_id'], unique=False)
    op.create_index(op.f('ix_politician_bookmarks_politician_id'), 'politician_bookmarks', ['politician_id'], unique=False)

    # Create ai_evaluations table
    op.create_table(
        'ai_evaluations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('politician_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('ai_model', sa.String(length=50), nullable=False),
        sa.Column('evaluation_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('integrity', sa.DECIMAL(precision=2, scale=1), nullable=True),
        sa.Column('communication', sa.DECIMAL(precision=2, scale=1), nullable=True),
        sa.Column('expertise', sa.DECIMAL(precision=2, scale=1), nullable=True),
        sa.Column('leadership', sa.DECIMAL(precision=2, scale=1), nullable=True),
        sa.Column('consistency', sa.DECIMAL(precision=2, scale=1), nullable=True),
        sa.Column('empathy', sa.DECIMAL(precision=2, scale=1), nullable=True),
        sa.Column('problem_solving', sa.DECIMAL(precision=2, scale=1), nullable=True),
        sa.Column('accountability', sa.DECIMAL(precision=2, scale=1), nullable=True),
        sa.Column('vision', sa.DECIMAL(precision=2, scale=1), nullable=True),
        sa.Column('transparency', sa.DECIMAL(precision=2, scale=1), nullable=True),
        sa.Column('local_engagement', sa.DECIMAL(precision=2, scale=1), nullable=True),
        sa.Column('national_perspective', sa.DECIMAL(precision=2, scale=1), nullable=True),
        sa.Column('average_score', sa.DECIMAL(precision=3, scale=2), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('strengths', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('weaknesses', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('is_latest', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['politician_id'], ['politicians.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_evaluations_politician_id'), 'ai_evaluations', ['politician_id'], unique=False)
    op.create_index(op.f('ix_ai_evaluations_is_latest'), 'ai_evaluations', ['is_latest'], unique=False)
    op.create_index(op.f('ix_ai_evaluations_average_score'), 'ai_evaluations', ['average_score'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order (respecting foreign key dependencies)
    op.drop_index(op.f('ix_ai_evaluations_average_score'), table_name='ai_evaluations')
    op.drop_index(op.f('ix_ai_evaluations_is_latest'), table_name='ai_evaluations')
    op.drop_index(op.f('ix_ai_evaluations_politician_id'), table_name='ai_evaluations')
    op.drop_table('ai_evaluations')

    op.drop_index(op.f('ix_politician_bookmarks_politician_id'), table_name='politician_bookmarks')
    op.drop_index(op.f('ix_politician_bookmarks_user_id'), table_name='politician_bookmarks')
    op.drop_index('ix_politician_bookmarks_user_politician', table_name='politician_bookmarks')
    op.drop_table('politician_bookmarks')

    op.drop_index(op.f('ix_user_follows_following_id'), table_name='user_follows')
    op.drop_index(op.f('ix_user_follows_follower_id'), table_name='user_follows')
    op.drop_index('ix_user_follows_follower_following', table_name='user_follows')
    op.drop_table('user_follows')

    op.drop_index(op.f('ix_reports_status'), table_name='reports')
    op.drop_index(op.f('ix_reports_target_id'), table_name='reports')
    op.drop_index(op.f('ix_reports_target_type'), table_name='reports')
    op.drop_index(op.f('ix_reports_reporter_id'), table_name='reports')
    op.drop_table('reports')

    op.drop_index(op.f('ix_posts_published_at'), table_name='posts')
    op.drop_index(op.f('ix_posts_is_published'), table_name='posts')
    op.drop_index(op.f('ix_posts_user_id'), table_name='posts')
    op.drop_index(op.f('ix_posts_slug'), table_name='posts')
    op.drop_table('posts')

    op.drop_index(op.f('ix_notifications_is_read'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_table('notifications')

    op.drop_index(op.f('ix_comments_parent_id'), table_name='comments')
    op.drop_index(op.f('ix_comments_politician_id'), table_name='comments')
    op.drop_index(op.f('ix_comments_user_id'), table_name='comments')
    op.drop_table('comments')

    op.drop_index('ix_ratings_user_politician', table_name='ratings')
    op.drop_index(op.f('ix_ratings_average_score'), table_name='ratings')
    op.drop_index(op.f('ix_ratings_politician_id'), table_name='ratings')
    op.drop_index(op.f('ix_ratings_user_id'), table_name='ratings')
    op.drop_table('ratings')

    op.drop_index(op.f('ix_politicians_total_rating_score'), table_name='politicians')
    op.drop_index(op.f('ix_politicians_category_id'), table_name='politicians')
    op.drop_index(op.f('ix_politicians_party'), table_name='politicians')
    op.drop_index(op.f('ix_politicians_name'), table_name='politicians')
    op.drop_table('politicians')

    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')

    op.drop_index(op.f('ix_categories_slug'), table_name='categories')
    op.drop_index(op.f('ix_categories_name'), table_name='categories')
    op.drop_table('categories')

    # Drop enum types
    op.execute("DROP TYPE IF EXISTS politicalparty CASCADE")
    op.execute("DROP TYPE IF EXISTS notificationtype CASCADE")
    op.execute("DROP TYPE IF EXISTS reporttype CASCADE")
    op.execute("DROP TYPE IF EXISTS reportreason CASCADE")
    op.execute("DROP TYPE IF EXISTS reportstatus CASCADE")