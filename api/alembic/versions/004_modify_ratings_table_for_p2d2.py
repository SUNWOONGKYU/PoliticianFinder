"""modify ratings table for P2D2 requirements

Revision ID: 004
Revises: 003
Create Date: 2025-10-17 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop existing ratings table to recreate with new schema
    op.drop_table('ratings')

    # Create new ratings table according to P2D2 requirements
    op.create_table(
        'ratings',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),

        # User info - UUID for Supabase Auth compatibility
        sa.Column('user_id', sa.String(36), nullable=False),  # UUID as string in SQLite

        # Politician info - BIGINT
        sa.Column('politician_id', sa.Integer(), nullable=False),

        # Rating content (1-5 score)
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('category', sa.String(50), server_default='overall', nullable=True),

        # Timestamps
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),

        # Primary key
        sa.PrimaryKeyConstraint('id'),

        # Foreign keys
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['politician_id'], ['politicians.id'], ondelete='CASCADE'),

        # Unique constraint for one rating per user per politician
        sa.UniqueConstraint('user_id', 'politician_id', name='unique_user_politician'),

        # Check constraints
        sa.CheckConstraint('score >= 1 AND score <= 5', name='check_score_range'),
        sa.CheckConstraint('LENGTH(comment) <= 1000', name='check_comment_length')
    )

    # Create indexes for performance optimization
    op.create_index('idx_ratings_politician_id', 'ratings', ['politician_id'])
    op.create_index('idx_ratings_user_id', 'ratings', ['user_id'])
    op.create_index('idx_ratings_created_at', 'ratings', ['created_at'], postgresql_using='btree', postgresql_ops={'created_at': 'DESC'})
    op.create_index('idx_ratings_politician_score', 'ratings', ['politician_id', 'score'])
    op.create_index('idx_ratings_politician_created', 'ratings', ['politician_id', 'created_at'])

    # Note: SQLite doesn't support stored procedures/triggers like PostgreSQL
    # The updated_at field will need to be handled at the application level


def downgrade() -> None:
    # Drop the new ratings table
    op.drop_index('idx_ratings_politician_created', table_name='ratings')
    op.drop_index('idx_ratings_politician_score', table_name='ratings')
    op.drop_index('idx_ratings_created_at', table_name='ratings')
    op.drop_index('idx_ratings_user_id', table_name='ratings')
    op.drop_index('idx_ratings_politician_id', table_name='ratings')
    op.drop_table('ratings')

    # Recreate the original ratings table (with 12-dimensional ratings)
    op.create_table(
        'ratings',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('politician_id', sa.Integer(), nullable=False),
        sa.Column('integrity', sa.Float(), nullable=False),
        sa.Column('communication', sa.Float(), nullable=False),
        sa.Column('expertise', sa.Float(), nullable=False),
        sa.Column('leadership', sa.Float(), nullable=False),
        sa.Column('consistency', sa.Float(), nullable=False),
        sa.Column('empathy', sa.Float(), nullable=False),
        sa.Column('problem_solving', sa.Float(), nullable=False),
        sa.Column('accountability', sa.Float(), nullable=False),
        sa.Column('vision', sa.Float(), nullable=False),
        sa.Column('transparency', sa.Float(), nullable=False),
        sa.Column('local_engagement', sa.Float(), nullable=False),
        sa.Column('national_perspective', sa.Float(), nullable=False),
        sa.Column('average_score', sa.Float(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['politician_id'], ['politicians.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'politician_id', name='unique_user_politician_rating')
    )