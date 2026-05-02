from __future__ import annotations

from sqlalchemy import JSON, Boolean, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, new_id, utc_now


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: "default")
    active_world_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("worlds.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[str] = mapped_column(String(40), nullable=False, default=lambda: utc_now().isoformat())
    updated_at: Mapped[str] = mapped_column(String(40), nullable=False, default=lambda: utc_now().isoformat())


class World(Base):
    __tablename__ = "worlds"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: new_id("world"))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    world_type: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    tags: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[str] = mapped_column(String(40), nullable=False, default=lambda: utc_now().isoformat())
    updated_at: Mapped[str] = mapped_column(String(40), nullable=False, default=lambda: utc_now().isoformat())

    __table_args__ = (Index("ix_worlds_updated_at", "updated_at"),)


class WorldSettings(Base):
    __tablename__ = "world_settings"

    world_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("worlds.id", ondelete="CASCADE"),
        primary_key=True,
    )
    world_name: Mapped[str] = mapped_column(String(200), nullable=False)
    world_type: Mapped[str] = mapped_column(String(120), nullable=False)
    background: Mapped[str] = mapped_column(Text, nullable=False)
    world_rules: Mapped[str] = mapped_column(Text, nullable=False, default="")
    style_preferences: Mapped[str] = mapped_column(Text, nullable=False, default="")
    prohibited_content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    core_conflict: Mapped[str] = mapped_column(Text, nullable=False, default="")
    updated_at: Mapped[str] = mapped_column(String(40), nullable=False, default=lambda: utc_now().isoformat())


class SeedCharacter(Base):
    __tablename__ = "seed_characters"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: new_id("character"))
    world_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("worlds.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    identity: Mapped[str] = mapped_column(String(200), nullable=False)
    goal: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(Text, nullable=False, default="")

class SeedFaction(Base):
    __tablename__ = "seed_factions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: new_id("faction"))
    world_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("worlds.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    stance: Mapped[str] = mapped_column(Text, nullable=False, default="")
    resources: Mapped[str] = mapped_column(Text, nullable=False, default="")
    conflict: Mapped[str] = mapped_column(Text, nullable=False, default="")

class SeedLocation(Base):
    __tablename__ = "seed_locations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: new_id("location"))
    world_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("worlds.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    location_type: Mapped[str] = mapped_column(String(120), nullable=False)
    importance: Mapped[str] = mapped_column(Text, nullable=False, default="")

class SeedRelationship(Base):
    __tablename__ = "seed_relationships"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: new_id("relationship"))
    world_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("worlds.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    participant_a: Mapped[str] = mapped_column(String(200), nullable=False)
    participant_b: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    tension: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    note: Mapped[str] = mapped_column(Text, nullable=False, default="")

class WorldRuntimeState(Base):
    __tablename__ = "world_runtime_states"

    world_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("worlds.id", ondelete="CASCADE"),
        primary_key=True,
    )
    current_world_date: Mapped[str] = mapped_column(String(80), nullable=False)
    run_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_paused: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    chapter_draft: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    latest_chapter: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    last_run_result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    updated_at: Mapped[str] = mapped_column(String(40), nullable=False, default=lambda: utc_now().isoformat())


class WorldRunResult(Base):
    __tablename__ = "world_run_results"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: new_id("run"))
    world_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("worlds.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    date: Mapped[str] = mapped_column(String(80), nullable=False)
    run_day: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    generated_at: Mapped[str] = mapped_column(String(40), nullable=False, default=lambda: utc_now().isoformat())
    counts: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    details: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    __table_args__ = (Index("ix_world_run_results_world_id_generated_at", "world_id", "generated_at"),)


class WorldEvent(Base):
    __tablename__ = "world_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: new_id("event"))
    world_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("worlds.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    date: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(40), nullable=False, default="other")
    participants: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    location: Mapped[str] = mapped_column(Text, nullable=False, default="")
    impact: Mapped[str] = mapped_column(Text, nullable=False, default="")
    detail: Mapped[str] = mapped_column(Text, nullable=False, default="")
    importance: Mapped[str] = mapped_column(String(40), nullable=False, default="normal")
    created_at: Mapped[str] = mapped_column(String(40), nullable=False, default=lambda: utc_now().isoformat())

    __table_args__ = (Index("ix_world_events_world_id_created_at", "world_id", "created_at"),)
