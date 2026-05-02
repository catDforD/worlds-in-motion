from __future__ import annotations

import re
from collections.abc import Mapping
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from backend.app.db.base import new_id, utc_now
from backend.app.db.models import (
    SeedCharacter,
    SeedFaction,
    SeedLocation,
    SeedRelationship,
    Workspace,
    World,
    WorldEvent,
    WorldRunResult,
)
from backend.app.db.models import (
    WorldRuntimeState as WorldRuntimeStateModel,
)
from backend.app.db.models import (
    WorldSettings as WorldSettingsModel,
)
from backend.app.schemas.world_state import (
    CreateWorldEventRequest,
    CreateWorldRequest,
    LegacyImportMappingSchema,
    LegacyImportRequest,
    LegacyImportResponse,
    PauseRuntimeRequest,
    SaveWorldSeedAssetsRequest,
    SaveWorldSettingsRequest,
    SetActiveWorldRequest,
    WorldEventSchema,
    WorldLibrarySchema,
    WorldRecordSchema,
    WorldRuntimeChapterDraftSchema,
    WorldRuntimeEventImportance,
    WorldRuntimeEventType,
    WorldRuntimeLatestChapterSchema,
    WorldRuntimeRunResultCountsSchema,
    WorldRuntimeRunResultDetailsSchema,
    WorldRuntimeRunResultSchema,
    WorldRuntimeStateSchema,
    WorldSeedAssetsSchema,
    WorldSeedCharacterSchema,
    WorldSeedFactionSchema,
    WorldSeedLocationSchema,
    WorldSeedRelationshipSchema,
    WorldSettingsSchema,
    WorldSnapshotSchema,
)

DEFAULT_WORLD_DATE = "永泰二十三年 三月初八　辰时"
DEFAULT_CHINESE_DAYS = [
    "初一",
    "初二",
    "初三",
    "初四",
    "初五",
    "初六",
    "初七",
    "初八",
    "初九",
    "初十",
    "十一",
    "十二",
    "十三",
    "十四",
    "十五",
    "十六",
    "十七",
    "十八",
    "十九",
    "二十",
    "廿一",
    "廿二",
    "廿三",
    "廿四",
    "廿五",
    "廿六",
    "廿七",
    "廿八",
    "廿九",
    "三十",
]
EVENT_TYPES: set[WorldRuntimeEventType] = {
    "plot",
    "character",
    "faction",
    "location",
    "secret",
    "other",
}
EVENT_IMPORTANCE_LEVELS: set[WorldRuntimeEventImportance] = {
    "normal",
    "important",
    "turning-point",
}
DEFAULT_WORKSPACE_ID = "default"


def now_iso() -> str:
    return utc_now().isoformat()


def is_record(value: Any) -> bool:
    return isinstance(value, Mapping)


def read_string(value: Any, fallback: str = "") -> str:
    return value if isinstance(value, str) else fallback


def read_bool(value: Any, fallback: bool = False) -> bool:
    return value if isinstance(value, bool) else fallback


def read_int(value: Any, fallback: int = 0) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        return fallback
    return value


def read_string_list(value: Any) -> list[str]:
    if isinstance(value, list):
        candidates = value
    elif isinstance(value, str):
        candidates = re.split(r"[,，、\n]+", value)
    else:
        return []

    result: list[str] = []
    for item in candidates:
        if isinstance(item, str):
            stripped = item.strip()
            if stripped and stripped not in result:
                result.append(stripped)
    return result


def read_string_list_from_text(value: Any) -> list[str]:
    if isinstance(value, list):
        candidates = value
    elif isinstance(value, str):
        candidates = [part for part in value.replace("、", ",").replace("，", ",").split("\n")]
    else:
        return []

    result: list[str] = []
    for item in candidates:
        if isinstance(item, str):
            stripped = item.strip()
            if stripped and stripped not in result:
                result.append(stripped)
    return result


def unique_strings(values: list[str]) -> list[str]:
    result: list[str] = []
    for value in values:
        stripped = value.strip()
        if stripped and stripped not in result:
            result.append(stripped)
    return result


def normalize_event_type(value: Any) -> WorldRuntimeEventType:
    if isinstance(value, str) and value in EVENT_TYPES:
        return value
    return "other"


def normalize_importance(value: Any) -> WorldRuntimeEventImportance:
    if isinstance(value, str) and value in EVENT_IMPORTANCE_LEVELS:
        return value
    return "normal"


def normalize_tension(value: Any) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        return 50
    return max(0, min(100, value))


def limit_detail_text(value: str) -> str:
    return " ".join(value.split()).strip()[:96]


def advance_world_date(value: str) -> str:
    try:
        date = datetime.fromisoformat(value)
    except ValueError:
        date = None

    if date is not None:
        return (date + timedelta(days=1)).date().isoformat()

    for candidate in DEFAULT_CHINESE_DAYS:
        if candidate in value:
            current_index = DEFAULT_CHINESE_DAYS.index(candidate)
            next_day = DEFAULT_CHINESE_DAYS[(current_index + 1) % len(DEFAULT_CHINESE_DAYS)]
            return value.replace(candidate, next_day, 1)

    return f"{value} +1日"


def ensure_workspace(session: Session) -> Workspace:
    workspace = session.get(Workspace, DEFAULT_WORKSPACE_ID)
    if workspace is None:
        workspace = Workspace(id=DEFAULT_WORKSPACE_ID, active_world_id=None)
        session.add(workspace)
        session.commit()
        session.refresh(workspace)
    return workspace


def ensure_world_exists(session: Session, world_id: str) -> World:
    world = session.get(World, world_id)
    if world is None:
        raise ValueError(f"world not found: {world_id}")
    return world


def ensure_runtime_state(session: Session, world_id: str) -> WorldRuntimeStateModel:
    runtime = session.get(WorldRuntimeStateModel, world_id)
    if runtime is None:
        runtime = WorldRuntimeStateModel(
            world_id=world_id,
            current_world_date=DEFAULT_WORLD_DATE,
            run_days=0,
            is_paused=False,
            chapter_draft={
                "title": "",
                "summary": "",
                "tags": [],
                "updated_at": "",
            },
            latest_chapter=None,
            last_run_result=None,
            updated_at=now_iso(),
        )
        session.add(runtime)
        session.commit()
        session.refresh(runtime)
    return runtime


def world_to_schema(world: World) -> WorldRecordSchema:
    return WorldRecordSchema(
        id=world.id,
        name=world.name,
        type_=world.world_type,
        description=world.description,
        tags=list(world.tags or []),
        created_at=world.created_at,
        updated_at=world.updated_at,
    )


def settings_to_schema(settings: WorldSettingsModel) -> WorldSettingsSchema:
    return WorldSettingsSchema(
        world_name=settings.world_name,
        world_type=settings.world_type,
        background=settings.background,
        world_rules=settings.world_rules,
        style_preferences=settings.style_preferences,
        prohibited_content=settings.prohibited_content,
        core_conflict=settings.core_conflict,
        updated_at=settings.updated_at,
    )


def settings_to_model_defaults(world: World) -> WorldSettingsModel:
    return WorldSettingsModel(
        world_id=world.id,
        world_name=world.name,
        world_type=world.world_type,
        background=world.description,
        world_rules="",
        style_preferences="",
        prohibited_content="",
        core_conflict="",
        updated_at=now_iso(),
    )


def empty_seed_assets_schema() -> WorldSeedAssetsSchema:
    return WorldSeedAssetsSchema(characters=[], factions=[], locations=[], relationships=[])


def runtime_model_to_schema(session: Session, runtime: WorldRuntimeStateModel) -> WorldRuntimeStateSchema:
    events = (
        session.execute(
            select(WorldEvent)
            .where(WorldEvent.world_id == runtime.world_id)
            .order_by(WorldEvent.created_at.desc(), WorldEvent.date.desc())
        )
        .scalars()
        .all()
    )

    run_result = runtime.last_run_result
    return WorldRuntimeStateSchema(
        current_world_date=runtime.current_world_date,
        run_days=runtime.run_days,
        is_paused=runtime.is_paused,
        events=[event_to_schema(event) for event in events],
        chapter_draft=WorldRuntimeChapterDraftSchema.model_validate(runtime.chapter_draft),
        latest_chapter=(
            WorldRuntimeLatestChapterSchema.model_validate(runtime.latest_chapter) if runtime.latest_chapter else None
        ),
        last_run_result=(
            WorldRuntimeRunResultSchema.model_validate(run_result) if isinstance(run_result, dict) else None
        ),
        updated_at=runtime.updated_at,
    )


def event_to_schema(event: WorldEvent) -> WorldEventSchema:
    return WorldEventSchema(
        id=event.id,
        date=event.date,
        title=event.title,
        summary=event.summary,
        type_=event.type,
        participants=list(event.participants or []),
        location=event.location,
        impact=event.impact,
        detail=event.detail,
        importance=event.importance,
        created_at=event.created_at,
    )


def world_library_schema(session: Session) -> WorldLibrarySchema:
    workspace = ensure_workspace(session)
    worlds = session.execute(select(World).order_by(World.updated_at.desc(), World.created_at.desc())).scalars().all()
    return WorldLibrarySchema(
        active_world_id=workspace.active_world_id,
        worlds=[world_to_schema(world) for world in worlds],
    )


def get_world_library(session: Session) -> WorldLibrarySchema:
    return world_library_schema(session)


def create_world(session: Session, payload: CreateWorldRequest) -> WorldRecordSchema:
    workspace = ensure_workspace(session)
    now = now_iso()
    world = World(
        id=new_id("world"),
        name=payload.name.strip() or "未命名世界",
        world_type=payload.type_.strip() or "未定类型",
        description=payload.description.strip() or "这个世界的背景仍在落墨成形。",
        tags=unique_strings([payload.type_, *payload.tags]),
        created_at=now,
        updated_at=now,
    )
    session.add(world)
    session.flush()

    settings = WorldSettingsModel(
        world_id=world.id,
        world_name=world.name,
        world_type=world.world_type,
        background=world.description,
        world_rules="",
        style_preferences="",
        prohibited_content="",
        core_conflict="",
        updated_at=now,
    )
    runtime = WorldRuntimeStateModel(
        world_id=world.id,
        current_world_date=DEFAULT_WORLD_DATE,
        run_days=0,
        is_paused=False,
        chapter_draft={
            "title": "",
            "summary": "",
            "tags": [],
            "updated_at": "",
        },
        latest_chapter=None,
        last_run_result=None,
        updated_at=now,
    )
    session.add(settings)
    session.add(runtime)
    if payload.active:
        workspace.active_world_id = world.id
        workspace.updated_at = now
    session.commit()
    session.refresh(world)
    return world_to_schema(world)


def set_active_world(session: Session, payload: SetActiveWorldRequest) -> WorldLibrarySchema:
    ensure_world_exists(session, payload.world_id)
    workspace = ensure_workspace(session)
    workspace.active_world_id = payload.world_id
    workspace.updated_at = now_iso()
    session.commit()
    return world_library_schema(session)


def get_world_settings(session: Session, world_id: str) -> WorldSettingsSchema:
    world = ensure_world_exists(session, world_id)
    settings = session.get(WorldSettingsModel, world_id)
    if settings is None:
        return settings_to_schema(settings_to_model_defaults(world))
    return settings_to_schema(settings)


def save_world_settings(session: Session, world_id: str, payload: SaveWorldSettingsRequest) -> WorldSettingsSchema:
    ensure_world_exists(session, world_id)
    settings = session.get(WorldSettingsModel, world_id)
    now = now_iso()
    if settings is None:
        settings = WorldSettingsModel(world_id=world_id, updated_at=now)
        session.add(settings)
    settings.world_name = payload.world_name.strip() or "未命名世界"
    settings.world_type = payload.world_type.strip() or "未定类型"
    settings.background = payload.background.strip() or "这个世界的背景仍在落墨成形。"
    settings.world_rules = payload.world_rules
    settings.style_preferences = payload.style_preferences
    settings.prohibited_content = payload.prohibited_content
    settings.core_conflict = payload.core_conflict
    settings.updated_at = now
    session.commit()
    session.refresh(settings)
    return settings_to_schema(settings)


def get_seed_assets(session: Session, world_id: str) -> WorldSeedAssetsSchema:
    ensure_world_exists(session, world_id)
    characters = session.execute(select(SeedCharacter).where(SeedCharacter.world_id == world_id)).scalars().all()
    factions = session.execute(select(SeedFaction).where(SeedFaction.world_id == world_id)).scalars().all()
    locations = session.execute(select(SeedLocation).where(SeedLocation.world_id == world_id)).scalars().all()
    relationships = (
        session.execute(select(SeedRelationship).where(SeedRelationship.world_id == world_id)).scalars().all()
    )
    return WorldSeedAssetsSchema(
        characters=[
            WorldSeedCharacterSchema(
                id=item.id,
                name=item.name,
                identity=item.identity,
                goal=item.goal,
                status=item.status,
            )
            for item in characters
        ],
        factions=[
            WorldSeedFactionSchema(
                id=item.id,
                name=item.name,
                stance=item.stance,
                resources=item.resources,
                conflict=item.conflict,
            )
            for item in factions
        ],
        locations=[
            WorldSeedLocationSchema(
                id=item.id,
                name=item.name,
                type_=item.location_type,
                importance=item.importance,
            )
            for item in locations
        ],
        relationships=[
            WorldSeedRelationshipSchema(
                id=item.id,
                participant_a=item.participant_a,
                participant_b=item.participant_b,
                description=item.description,
                tension=item.tension,
                note=item.note,
            )
            for item in relationships
        ],
    )


def _replace_seed_rows(session: Session, world_id: str, payload: SaveWorldSeedAssetsRequest) -> None:
    session.execute(delete(SeedCharacter).where(SeedCharacter.world_id == world_id))
    session.execute(delete(SeedFaction).where(SeedFaction.world_id == world_id))
    session.execute(delete(SeedLocation).where(SeedLocation.world_id == world_id))
    session.execute(delete(SeedRelationship).where(SeedRelationship.world_id == world_id))

    for item in payload.characters:
        session.add(
            SeedCharacter(
                id=item.id or new_id("character"),
                world_id=world_id,
                name=item.name.strip() or "未命名角色",
                identity=item.identity.strip() or "身份未定",
                goal=item.goal,
                status=item.status,
            )
        )

    for item in payload.factions:
        session.add(
            SeedFaction(
                id=item.id or new_id("faction"),
                world_id=world_id,
                name=item.name.strip() or "未命名势力",
                stance=item.stance,
                resources=item.resources,
                conflict=item.conflict,
            )
        )

    for item in payload.locations:
        session.add(
            SeedLocation(
                id=item.id or new_id("location"),
                world_id=world_id,
                name=item.name.strip() or "未命名地点",
                location_type=item.type_.strip() or "未定类型",
                importance=item.importance,
            )
        )

    for item in payload.relationships:
        session.add(
            SeedRelationship(
                id=item.id or new_id("relationship"),
                world_id=world_id,
                participant_a=item.participant_a.strip() or "未命名参与方A",
                participant_b=item.participant_b.strip() or "未命名参与方B",
                description=item.description,
                tension=normalize_tension(item.tension),
                note=item.note,
            )
        )


def save_seed_assets(session: Session, world_id: str, payload: SaveWorldSeedAssetsRequest) -> WorldSeedAssetsSchema:
    ensure_world_exists(session, world_id)
    _replace_seed_rows(session, world_id, payload)
    session.commit()
    return get_seed_assets(session, world_id)


def get_runtime_state(session: Session, world_id: str) -> WorldRuntimeStateSchema:
    ensure_world_exists(session, world_id)
    runtime = ensure_runtime_state(session, world_id)
    return runtime_model_to_schema(session, runtime)


def save_runtime_state(session: Session, world_id: str, runtime: WorldRuntimeStateModel) -> WorldRuntimeStateSchema:
    ensure_world_exists(session, world_id)
    session.merge(runtime)
    session.commit()
    runtime = ensure_runtime_state(session, world_id)
    return runtime_model_to_schema(session, runtime)


def set_runtime_pause(session: Session, world_id: str, payload: PauseRuntimeRequest) -> WorldRuntimeStateSchema:
    runtime = ensure_runtime_state(session, world_id)
    runtime.is_paused = payload.is_paused
    runtime.updated_at = now_iso()
    session.commit()
    return runtime_model_to_schema(session, runtime)


def list_world_events(session: Session, world_id: str) -> list[WorldEventSchema]:
    ensure_world_exists(session, world_id)
    events = (
        session.execute(
            select(WorldEvent)
            .where(WorldEvent.world_id == world_id)
            .order_by(WorldEvent.created_at.desc(), WorldEvent.date.desc())
        )
        .scalars()
        .all()
    )
    return [event_to_schema(item) for item in events]


def create_world_event(
    session: Session,
    world_id: str,
    payload: CreateWorldEventRequest,
) -> WorldEventSchema:
    ensure_world_exists(session, world_id)
    title = payload.title.strip()
    summary = payload.summary.strip()
    if not title or not summary:
        raise ValueError("事件标题和摘要不能为空")

    date = payload.date or ensure_runtime_state(session, world_id).current_world_date
    event = WorldEvent(
        id=new_id("event"),
        world_id=world_id,
        date=date,
        title=title,
        summary=summary,
        type=normalize_event_type(payload.type_),
        participants=unique_strings(payload.participants),
        location=payload.location.strip(),
        impact=payload.impact.strip(),
        detail=payload.detail.strip() or summary,
        importance=normalize_importance(payload.importance),
        created_at=now_iso(),
    )
    session.add(event)
    session.commit()
    session.refresh(event)
    return event_to_schema(event)


def _build_run_result_details(
    world: World,
    runtime: WorldRuntimeStateModel,
    events: list[WorldEvent],
    characters: list[SeedCharacter],
    relationships: list[SeedRelationship],
) -> tuple[WorldRuntimeRunResultCountsSchema, WorldRuntimeRunResultDetailsSchema]:
    event_count = min(5, len(events)) if events else (1 if characters else 0)
    relationship_count = min(2, max(1, len(relationships))) if relationships else 0
    secret_count = 1 if len(world.tags or []) >= 3 else 0
    goal_count = 1 if characters else 0
    chapter_source = runtime.latest_chapter or runtime.chapter_draft or {}
    story_count = 1 if chapter_source.get("title") else 0

    event_details = [limit_detail_text(f"{item.title}：{item.summary}") for item in events[:event_count]]
    if not event_details and characters:
        character = characters[0]
        event_details = [limit_detail_text(f"{character.name}围绕“{character.goal or '当前目标'}”推进了一条新线索。")]

    relationship_details = []
    if relationships:
        relationship = relationships[0]
        relationship_details = [
            limit_detail_text(
                f"{relationship.participant_a}与{relationship.participant_b}的张力被重新校准："
                f"{relationship.description or relationship.note or '关系进入新的观察点'}。"
            )
        ]

    secret_details = []
    if secret_count:
        secret_details = [limit_detail_text(f"世界标签 {', '.join((world.tags or [])[:3])} 中出现可追踪线索。")]

    goal_details = []
    if characters:
        character = characters[0]
        goal_details = [
            limit_detail_text(
                f"{character.name}的目标“{character.goal or '未命名目标'}”进入{character.status or '新的'}阶段。"
            )
        ]

    story_details = []
    if story_count:
        chapter_title = chapter_source.get("title") or "未命名章节"
        story_details = [limit_detail_text(f"围绕《{chapter_title}》生成一段本地草稿提示，等待后续整理。")]

    counts = WorldRuntimeRunResultCountsSchema(
        events=event_count,
        relationship_changes=relationship_count,
        secrets_discovered=secret_count,
        goal_changes=goal_count,
        story_drafts=story_count,
    )
    details = WorldRuntimeRunResultDetailsSchema(
        events=event_details,
        relationship_changes=relationship_details,
        secrets_discovered=secret_details,
        goal_changes=goal_details,
        story_drafts=story_details,
    )
    return counts, details


def run_world_one_day(session: Session, world_id: str) -> WorldRuntimeStateSchema:
    world = ensure_world_exists(session, world_id)
    runtime = ensure_runtime_state(session, world_id)
    events = (
        session.execute(
            select(WorldEvent)
            .where(WorldEvent.world_id == world_id)
            .order_by(WorldEvent.created_at.desc(), WorldEvent.date.desc())
        )
        .scalars()
        .all()
    )
    characters = session.execute(select(SeedCharacter).where(SeedCharacter.world_id == world_id)).scalars().all()
    relationships = (
        session.execute(select(SeedRelationship).where(SeedRelationship.world_id == world_id)).scalars().all()
    )
    counts, details = _build_run_result_details(world, runtime, events, characters, relationships)
    current_date = advance_world_date(runtime.current_world_date)
    run_day = runtime.run_days + 1
    generated_at = now_iso()
    result = WorldRuntimeRunResultSchema(
        id=new_id("run"),
        date=current_date,
        run_day=run_day,
        generated_at=generated_at,
        counts=counts,
        details=details,
    )

    runtime.current_world_date = current_date
    runtime.run_days = run_day
    runtime.last_run_result = result.model_dump(by_alias=False)
    runtime.updated_at = generated_at
    session.add(
        WorldRunResult(
            id=result.id,
            world_id=world_id,
            date=current_date,
            run_day=run_day,
            generated_at=generated_at,
            counts=counts.model_dump(by_alias=False),
            details=details.model_dump(by_alias=False),
        )
    )
    session.commit()
    return runtime_model_to_schema(session, runtime)


def get_world_snapshot(session: Session, world_id: str) -> WorldSnapshotSchema:
    world = ensure_world_exists(session, world_id)
    settings_model = session.get(WorldSettingsModel, world_id)
    runtime = ensure_runtime_state(session, world_id)
    seed_assets = get_seed_assets(session, world_id)
    return WorldSnapshotSchema(
        world=world_to_schema(world),
        settings=settings_to_schema(settings_model) if settings_model else None,
        seed_assets=seed_assets,
        runtime=runtime_model_to_schema(session, runtime),
    )


def _parse_world_record(value: Any) -> tuple[str, dict[str, Any]] | None:
    if not is_record(value):
        return None
    source_id = read_string(value.get("id"), "").strip()
    if not source_id:
        return None
    return source_id, {
        "name": read_string(value.get("name"), "未命名世界").strip() or "未命名世界",
        "world_type": read_string(value.get("type"), "未定类型").strip() or "未定类型",
        "description": read_string(value.get("description"), "这个世界的背景仍在落墨成形。").strip()
        or "这个世界的背景仍在落墨成形。",
        "tags": unique_strings(read_string_list_from_text(value.get("tags"))),
        "created_at": read_string(value.get("createdAt"), now_iso()),
        "updated_at": read_string(value.get("updatedAt"), now_iso()),
    }


def _parse_settings(value: Any) -> dict[str, Any] | None:
    if not is_record(value):
        return None
    required_fields = [
        "worldName",
        "worldType",
        "background",
        "worldRules",
        "stylePreferences",
        "prohibitedContent",
        "coreConflict",
    ]
    if any(field not in value for field in required_fields):
        return None
    return {
        "world_name": read_string(value.get("worldName"), ""),
        "world_type": read_string(value.get("worldType"), ""),
        "background": read_string(value.get("background"), ""),
        "world_rules": read_string(value.get("worldRules"), ""),
        "style_preferences": read_string(value.get("stylePreferences"), ""),
        "prohibited_content": read_string(value.get("prohibitedContent"), ""),
        "core_conflict": read_string(value.get("coreConflict"), ""),
    }


def _parse_seed_assets(value: Any) -> dict[str, list[dict[str, Any]]] | None:
    if not is_record(value):
        return None

    def parse_items(items: Any, required: list[str]) -> list[dict[str, Any]] | None:
        if not isinstance(items, list):
            return None
        result: list[dict[str, Any]] = []
        for item in items:
            if not is_record(item):
                return None
            parsed = {field: item.get(field) for field in required}
            if any(parsed[field] is None for field in required):
                return None
            result.append(parsed)
        return result

    characters = parse_items(value.get("characters"), ["id", "name", "identity", "goal", "status"])
    factions = parse_items(value.get("factions"), ["id", "name", "stance", "resources", "conflict"])
    locations = parse_items(value.get("locations"), ["id", "name", "type", "importance"])
    relationships = parse_items(
        value.get("relationships"),
        ["id", "participantA", "participantB", "description", "tension", "note"],
    )
    if characters is None or factions is None or locations is None or relationships is None:
        return None
    return {
        "characters": characters,
        "factions": factions,
        "locations": locations,
        "relationships": relationships,
    }


def _parse_runtime(value: Any) -> dict[str, Any] | None:
    if not is_record(value):
        return None
    return {
        "current_world_date": read_string(value.get("currentWorldDate"), DEFAULT_WORLD_DATE),
        "run_days": read_int(value.get("runDays"), 0),
        "is_paused": read_bool(value.get("isPaused"), False),
        "chapter_draft": value.get("chapterDraft")
        or {
            "title": "",
            "summary": "",
            "tags": [],
            "updated_at": "",
        },
        "latest_chapter": value.get("latestChapter"),
        "last_run_result": value.get("lastRunResult"),
        "events": value.get("events") or [],
        "updated_at": read_string(value.get("updatedAt"), now_iso()),
    }


def import_legacy_state(session: Session, payload: LegacyImportRequest) -> LegacyImportResponse:
    workspace = ensure_workspace(session)
    world_library = payload.world_library or {}
    worlds = world_library.get("worlds") if is_record(world_library) else []
    source_active_world_id = read_string(world_library.get("activeWorldId"), "") if is_record(world_library) else ""

    settings_map = payload.world_settings_by_world_id or {}
    seed_map = payload.world_seed_assets_by_world_id or {}
    runtime_map = payload.world_runtime_by_world_id or {}

    imported_world_ids: list[str] = []
    skipped_sections: list[str] = []
    mappings: list[LegacyImportMappingSchema] = []

    if not isinstance(worlds, list):
        skipped_sections.append("worldLibrary")
        worlds = []

    for raw_world in worlds:
        parsed_world = _parse_world_record(raw_world)
        if parsed_world is None:
            skipped_sections.append("world")
            continue

        source_world_id, world_data = parsed_world
        target_world = session.get(World, source_world_id)
        now = now_iso()
        if target_world is None:
            target_world = World(id=source_world_id, **world_data)
            session.add(target_world)
        else:
            target_world.name = world_data["name"]
            target_world.world_type = world_data["world_type"]
            target_world.description = world_data["description"]
            target_world.tags = world_data["tags"]
            target_world.updated_at = now

        settings_data = _parse_settings(settings_map.get(source_world_id))
        if settings_data is None:
            settings_data = {
                "world_name": world_data["name"],
                "world_type": world_data["world_type"],
                "background": world_data["description"],
                "world_rules": "",
                "style_preferences": "",
                "prohibited_content": "",
                "core_conflict": "",
            }
            skipped_sections.append(f"settings:{source_world_id}")

        settings = session.get(WorldSettingsModel, source_world_id)
        if settings is None:
            settings = WorldSettingsModel(world_id=source_world_id, updated_at=now)
            session.add(settings)
        settings.world_name = settings_data["world_name"]
        settings.world_type = settings_data["world_type"]
        settings.background = settings_data["background"]
        settings.world_rules = settings_data["world_rules"]
        settings.style_preferences = settings_data["style_preferences"]
        settings.prohibited_content = settings_data["prohibited_content"]
        settings.core_conflict = settings_data["core_conflict"]
        settings.updated_at = now

        seed_data = _parse_seed_assets(seed_map.get(source_world_id))
        if seed_data is None:
            seed_data = {"characters": [], "factions": [], "locations": [], "relationships": []}
            skipped_sections.append(f"seedAssets:{source_world_id}")

        session.execute(delete(SeedCharacter).where(SeedCharacter.world_id == source_world_id))
        session.execute(delete(SeedFaction).where(SeedFaction.world_id == source_world_id))
        session.execute(delete(SeedLocation).where(SeedLocation.world_id == source_world_id))
        session.execute(delete(SeedRelationship).where(SeedRelationship.world_id == source_world_id))
        for item in seed_data["characters"]:
            session.add(
                SeedCharacter(
                    id=read_string(item.get("id"), new_id("character")),
                    world_id=source_world_id,
                    name=read_string(item.get("name"), "未命名角色"),
                    identity=read_string(item.get("identity"), "身份未定"),
                    goal=read_string(item.get("goal"), ""),
                    status=read_string(item.get("status"), ""),
                )
            )
        for item in seed_data["factions"]:
            session.add(
                SeedFaction(
                    id=read_string(item.get("id"), new_id("faction")),
                    world_id=source_world_id,
                    name=read_string(item.get("name"), "未命名势力"),
                    stance=read_string(item.get("stance"), ""),
                    resources=read_string(item.get("resources"), ""),
                    conflict=read_string(item.get("conflict"), ""),
                )
            )
        for item in seed_data["locations"]:
            session.add(
                SeedLocation(
                    id=read_string(item.get("id"), new_id("location")),
                    world_id=source_world_id,
                    name=read_string(item.get("name"), "未命名地点"),
                    location_type=read_string(item.get("type"), "未定类型"),
                    importance=read_string(item.get("importance"), ""),
                )
            )
        for item in seed_data["relationships"]:
            session.add(
                SeedRelationship(
                    id=read_string(item.get("id"), new_id("relationship")),
                    world_id=source_world_id,
                    participant_a=read_string(item.get("participantA"), "未命名参与方A"),
                    participant_b=read_string(item.get("participantB"), "未命名参与方B"),
                    description=read_string(item.get("description"), ""),
                    tension=normalize_tension(item.get("tension")),
                    note=read_string(item.get("note"), ""),
                )
            )

        runtime_data = _parse_runtime(runtime_map.get(source_world_id))
        runtime = session.get(WorldRuntimeStateModel, source_world_id)
        if runtime is None:
            runtime = WorldRuntimeStateModel(
                world_id=source_world_id,
                current_world_date=DEFAULT_WORLD_DATE,
                run_days=0,
                is_paused=False,
                chapter_draft={
                    "title": "",
                    "summary": "",
                    "tags": [],
                    "updated_at": "",
                },
                latest_chapter=None,
                last_run_result=None,
                updated_at=now,
            )
            session.add(runtime)
        if runtime_data is not None:
            runtime.current_world_date = runtime_data["current_world_date"]
            runtime.run_days = runtime_data["run_days"]
            runtime.is_paused = runtime_data["is_paused"]
            runtime.chapter_draft = runtime_data["chapter_draft"]
            runtime.latest_chapter = runtime_data["latest_chapter"]
            runtime.last_run_result = runtime_data["last_run_result"]
            runtime.updated_at = runtime_data["updated_at"]

            events = runtime_data.get("events", [])
            if isinstance(events, list):
                session.execute(delete(WorldEvent).where(WorldEvent.world_id == source_world_id))
                for item in events:
                    if not is_record(item):
                        continue
                    title = read_string(item.get("title"), "").strip()
                    summary = read_string(item.get("summary"), "").strip()
                    if not title or not summary:
                        continue
                    session.add(
                        WorldEvent(
                            id=read_string(item.get("id"), new_id("event")),
                            world_id=source_world_id,
                            date=read_string(item.get("date"), DEFAULT_WORLD_DATE),
                            title=title,
                            summary=summary,
                            type=normalize_event_type(item.get("type")),
                            participants=unique_strings(read_string_list_from_text(item.get("participants"))),
                            location=read_string(item.get("location"), ""),
                            impact=read_string(item.get("impact"), ""),
                            detail=read_string(item.get("detail"), summary) or summary,
                            importance=normalize_importance(item.get("importance")),
                            created_at=read_string(item.get("createdAt"), now_iso()),
                        )
                    )
        imported_world_ids.append(source_world_id)
        mappings.append(
            LegacyImportMappingSchema(
                source_world_id=source_world_id,
                target_world_id=source_world_id,
            )
        )

    if source_active_world_id:
        workspace.active_world_id = source_active_world_id
        workspace.updated_at = now_iso()

    session.commit()
    return LegacyImportResponse(
        world_id_map=mappings,
        imported_world_ids=imported_world_ids,
        skipped_sections=unique_strings(skipped_sections),
    )
