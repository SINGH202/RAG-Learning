"""initial auth v3 schema

Revision ID: 0001_auth_v3
Revises:
Create Date: 2026-07-11
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0001_auth_v3"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=128), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "projects",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("owner_user_id", sa.String(length=128), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_projects_owner_user_id", "projects", ["owner_user_id"])
    op.create_table(
        "project_members",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("project_id", sa.String(length=36), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(length=128), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("project_id", "user_id", name="uq_project_user"),
    )
    op.create_index("ix_project_members_project_id", "project_members", ["project_id"])
    op.create_index("ix_project_members_user_id", "project_members", ["user_id"])
    op.create_table(
        "documents",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("project_id", sa.String(length=36), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("filename", sa.String(length=512), nullable=False),
        sa.Column("b2_key", sa.String(length=1024), nullable=False),
        sa.Column("chunk_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_documents_project_id", "documents", ["project_id"])
    op.create_table(
        "project_invites",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("project_id", sa.String(length=36), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("created_by", sa.String(length=128), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("token"),
    )
    op.create_index("ix_project_invites_project_id", "project_invites", ["project_id"])
    op.create_index("ix_project_invites_token", "project_invites", ["token"])


def downgrade() -> None:
    op.drop_table("project_invites")
    op.drop_table("documents")
    op.drop_table("project_members")
    op.drop_table("projects")
    op.drop_table("users")
