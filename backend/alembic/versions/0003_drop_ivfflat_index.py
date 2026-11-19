"""Drop IVFFlat index on document_chunks - too few rows for ANN index, causes missed results

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-01

"""
from typing import Sequence, Union
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DROP INDEX IF EXISTS document_chunks_embedding_idx")


def downgrade() -> None:
    op.execute(
        "CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)"
    )
