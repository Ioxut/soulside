"""Add status to specialist_requests, reset token to users, notifications table

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-24

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("reset_token", sa.String(64), nullable=True))
    op.add_column("users", sa.Column("reset_token_expires_at", sa.DateTime(), nullable=True))

    op.add_column(
        "specialist_requests",
        sa.Column("status", sa.String(20), server_default="pending", nullable=False),
    )

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("read", sa.Boolean(), server_default="false"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_column("specialist_requests", "status")
    op.drop_column("users", "reset_token_expires_at")
    op.drop_column("users", "reset_token")
