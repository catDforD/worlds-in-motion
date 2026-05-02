from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(part[:1].upper() + part[1:] for part in parts[1:])


class CamelModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
        from_attributes=True,
    )


class WorldRecordSchema(CamelModel):
    id: str
    name: str
    type_: str = Field(alias="type")
    description: str
    tags: list[str]
    created_at: str
    updated_at: str


class WorldLibrarySchema(CamelModel):
    version: int = 1
    active_world_id: str | None
    worlds: list[WorldRecordSchema]


class CreateWorldRequest(CamelModel):
    name: str
    type_: str = Field(alias="type")
    description: str
    tags: list[str] = Field(default_factory=list)
    active: bool = True


class SetActiveWorldRequest(CamelModel):
    world_id: str = Field(alias="worldId")


class WorldSettingsSchema(CamelModel):
    world_name: str
    world_type: str
    background: str
    world_rules: str
    style_preferences: str
    prohibited_content: str
    core_conflict: str
    updated_at: str


class SaveWorldSettingsRequest(CamelModel):
    world_name: str
    world_type: str
    background: str
    world_rules: str
    style_preferences: str
    prohibited_content: str
    core_conflict: str


class WorldSeedCharacterSchema(CamelModel):
    id: str
    name: str
    identity: str
    goal: str
    status: str


class WorldSeedFactionSchema(CamelModel):
    id: str
    name: str
    stance: str
    resources: str
    conflict: str


class WorldSeedLocationSchema(CamelModel):
    id: str
    name: str
    type_: str = Field(alias="type")
    importance: str


class WorldSeedRelationshipSchema(CamelModel):
    id: str
    participant_a: str
    participant_b: str
    description: str
    tension: int
    note: str


class WorldSeedAssetsSchema(CamelModel):
    characters: list[WorldSeedCharacterSchema]
    factions: list[WorldSeedFactionSchema]
    locations: list[WorldSeedLocationSchema]
    relationships: list[WorldSeedRelationshipSchema]


class SaveWorldSeedAssetsRequest(WorldSeedAssetsSchema):
    pass


class WorldRuntimeChapterDraftSchema(CamelModel):
    title: str
    summary: str
    tags: list[str]
    updated_at: str


class WorldRuntimeLatestChapterSchema(CamelModel):
    title: str
    summary: str
    tags: list[str]
    date: str
    updated_at: str


WorldRuntimeEventType = Literal["plot", "character", "faction", "location", "secret", "other"]
WorldRuntimeEventImportance = Literal["normal", "important", "turning-point"]


class WorldRuntimeEventSchema(CamelModel):
    id: str
    date: str
    title: str
    summary: str
    type_: WorldRuntimeEventType = Field(alias="type")
    participants: list[str]
    location: str
    impact: str
    detail: str
    importance: WorldRuntimeEventImportance
    created_at: str


WorldEventSchema = WorldRuntimeEventSchema


class WorldRuntimeRunResultCountsSchema(CamelModel):
    events: int
    relationship_changes: int
    secrets_discovered: int
    goal_changes: int
    story_drafts: int


class WorldRuntimeRunResultDetailsSchema(CamelModel):
    events: list[str]
    relationship_changes: list[str]
    secrets_discovered: list[str]
    goal_changes: list[str]
    story_drafts: list[str]


class WorldRuntimeRunResultSchema(CamelModel):
    id: str
    date: str
    run_day: int
    generated_at: str
    counts: WorldRuntimeRunResultCountsSchema
    details: WorldRuntimeRunResultDetailsSchema


class WorldRuntimeStateSchema(CamelModel):
    current_world_date: str
    run_days: int
    is_paused: bool
    events: list[WorldRuntimeEventSchema]
    chapter_draft: WorldRuntimeChapterDraftSchema
    latest_chapter: WorldRuntimeLatestChapterSchema | None
    last_run_result: WorldRuntimeRunResultSchema | None
    updated_at: str


class PauseRuntimeRequest(CamelModel):
    is_paused: bool


class CreateWorldEventRequest(CamelModel):
    title: str
    summary: str
    type_: WorldRuntimeEventType = Field(default="plot", alias="type")
    participants: list[str] = Field(default_factory=list)
    location: str = ""
    impact: str = ""
    detail: str = ""
    importance: WorldRuntimeEventImportance = "normal"
    date: str | None = None


class WorldSnapshotSchema(CamelModel):
    world: WorldRecordSchema
    settings: WorldSettingsSchema | None
    seed_assets: WorldSeedAssetsSchema
    runtime: WorldRuntimeStateSchema


class LegacyImportRequest(CamelModel):
    world_library: dict[str, Any] | None = None
    world_settings_by_world_id: dict[str, Any] | None = None
    world_seed_assets_by_world_id: dict[str, Any] | None = None
    world_runtime_by_world_id: dict[str, Any] | None = None


class LegacyImportMappingSchema(CamelModel):
    source_world_id: str
    target_world_id: str


class LegacyImportResponse(CamelModel):
    world_id_map: list[LegacyImportMappingSchema]
    imported_world_ids: list[str]
    skipped_sections: list[str]
