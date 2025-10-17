"""create politician_evaluations table

Revision ID: 001
Revises:
Create Date: 2025-10-16 00:45:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create politician_evaluations table
    op.create_table(
        'politician_evaluations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('politician_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('politician_name', sa.String(length=100), nullable=False),
        sa.Column('politician_position', sa.String(length=100), nullable=False),
        sa.Column('politician_party', sa.String(length=100), nullable=False),
        sa.Column('politician_region', sa.String(length=100), nullable=True),
        sa.Column('ai_model', sa.String(length=50), nullable=False),
        sa.Column('data_sources', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('raw_data_100', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('category_scores', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('rationale', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('strengths', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('weaknesses', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('overall_assessment', sa.Text(), nullable=False),
        sa.Column('final_score', sa.DECIMAL(precision=5, scale=2), nullable=False),
        sa.Column('grade', sa.String(length=1), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('payment_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index(op.f('ix_politician_evaluations_politician_name'), 'politician_evaluations', ['politician_name'], unique=False)
    op.create_index(op.f('ix_politician_evaluations_ai_model'), 'politician_evaluations', ['ai_model'], unique=False)
    op.create_index(op.f('ix_politician_evaluations_final_score'), 'politician_evaluations', ['final_score'], unique=False)
    op.create_index(op.f('ix_politician_evaluations_grade'), 'politician_evaluations', ['grade'], unique=False)
    op.create_index(op.f('ix_politician_evaluations_created_at'), 'politician_evaluations', ['created_at'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_politician_evaluations_created_at'), table_name='politician_evaluations')
    op.drop_index(op.f('ix_politician_evaluations_grade'), table_name='politician_evaluations')
    op.drop_index(op.f('ix_politician_evaluations_final_score'), table_name='politician_evaluations')
    op.drop_index(op.f('ix_politician_evaluations_ai_model'), table_name='politician_evaluations')
    op.drop_index(op.f('ix_politician_evaluations_politician_name'), table_name='politician_evaluations')

    # Drop table
    op.drop_table('politician_evaluations')
