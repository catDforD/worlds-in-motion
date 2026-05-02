from __future__ import annotations

import pytest
from backend.app.api.routes import (
    create_world_endpoint,
    create_world_event_endpoint,
    health,
    import_local_state,
    read_runtime_state,
    read_seed_assets,
    read_world_events,
    read_world_library,
    read_world_settings,
    read_world_snapshot,
    run_day,
    update_active_world,
    update_runtime_pause,
    update_seed_assets,
    update_world_settings,
)
from backend.app.db.bootstrap import initialize_database
from backend.app.db.session import create_engine_for_url, create_session_factory
from backend.app.schemas.world_state import (
    CreateWorldEventRequest,
    CreateWorldRequest,
    LegacyImportRequest,
    PauseRuntimeRequest,
    SaveWorldSeedAssetsRequest,
    SaveWorldSettingsRequest,
    SetActiveWorldRequest,
)


@pytest.fixture()
def db_session():
    engine = create_engine_for_url("sqlite:///:memory:")
    initialize_database(engine)
    session_factory = create_session_factory(engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


def create_world(db_session) -> str:
    response = create_world_endpoint(
        CreateWorldRequest(
            name="烟雨江南",
            type_="历史架空",
            description="大胤王朝，永平百年。",
            tags=["权谋", "江湖"],
        ),
        db=db_session,
    )
    assert response.name == "烟雨江南"
    return response.id


def test_health_check() -> None:
    assert health() == {"status": "ok"}


def test_world_library_and_settings_flow(db_session) -> None:
    world_id = create_world(db_session)

    library = read_world_library(db_session)
    assert library.active_world_id == world_id
    assert len(library.worlds) == 1

    updated = update_world_settings(
        world_id,
        SaveWorldSettingsRequest(
            world_name="烟雨江南",
            world_type="历史架空",
            background="江南多雨，朝堂纷争不断。",
            world_rules="官场与江湖彼此牵制。",
            style_preferences="冷峻群像",
            prohibited_content="无",
            core_conflict="一纸密信牵动朝局。",
        ),
        db=db_session,
    )
    assert updated.background == "江南多雨，朝堂纷争不断。"

    settings = read_world_settings(world_id, db_session)
    assert settings.world_name == "烟雨江南"

    snapshot = read_world_snapshot(world_id, db_session)
    assert snapshot.world.id == world_id
    assert snapshot.settings is not None

    active = update_active_world(SetActiveWorldRequest(worldId=world_id), db=db_session)
    assert active.active_world_id == world_id


def test_seed_runtime_and_events_flow(db_session) -> None:
    world_id = create_world(db_session)

    seed_assets = update_seed_assets(
        world_id,
        SaveWorldSeedAssetsRequest(
            characters=[
                {
                    "id": "character-1",
                    "name": "萧景琰",
                    "identity": "六部侍书",
                    "goal": "整顿吏治",
                    "status": "谋划中",
                }
            ],
            factions=[
                {
                    "id": "faction-1",
                    "name": "江南书院",
                    "stance": "中立",
                    "resources": "书卷与门生",
                    "conflict": "朝局压力",
                }
            ],
            locations=[
                {
                    "id": "location-1",
                    "name": "姑苏",
                    "type": "城池",
                    "importance": "高",
                }
            ],
            relationships=[
                {
                    "id": "relationship-1",
                    "participant_a": "萧景琰",
                    "participant_b": "陆昭明",
                    "description": "政敌",
                    "tension": 88,
                    "note": "互相试探",
                }
            ],
        ),
        db=db_session,
    )
    assert seed_assets.characters[0].name == "萧景琰"
    assert read_seed_assets(world_id, db_session).characters[0].name == "萧景琰"

    event = create_world_event_endpoint(
        world_id,
        CreateWorldEventRequest(
            title="雷霆风波",
            summary="春日宴会掀起朝堂震动。",
            type_="plot",
            participants=["萧景琰", "陆昭明"],
            location="京城",
            impact="朝堂震动",
            detail="一纸奏折引爆争议。",
            importance="important",
        ),
        db=db_session,
    )
    assert event.title == "雷霆风波"

    events = read_world_events(world_id, db_session)
    assert len(events) == 1

    runtime_before = read_runtime_state(world_id, db_session)
    assert runtime_before.is_paused is False

    paused = update_runtime_pause(world_id, PauseRuntimeRequest(is_paused=True), db=db_session)
    assert paused.is_paused is True

    run_result = run_day(world_id, db=db_session)
    assert run_result.run_days == 1
    assert run_result.last_run_result is not None
    assert run_result.last_run_result.counts.events == 1

    events_after_run = read_world_events(world_id, db_session)
    assert len(events_after_run) == 1


def test_legacy_import_is_idempotent(db_session) -> None:
    response = import_local_state(
        LegacyImportRequest(
            world_library={
                "activeWorldId": "world-legacy",
                "worlds": [
                    {
                        "id": "world-legacy",
                        "name": "旧世界",
                        "type": "历史架空",
                        "description": "旧版背景。",
                        "tags": ["旧", "测试"],
                        "createdAt": "2026-01-01T00:00:00+00:00",
                        "updatedAt": "2026-01-02T00:00:00+00:00",
                    }
                ],
            },
            world_settings_by_world_id={
                "world-legacy": {
                    "worldName": "旧世界",
                    "worldType": "历史架空",
                    "background": "旧版背景。",
                    "worldRules": "",
                    "stylePreferences": "",
                    "prohibitedContent": "",
                    "coreConflict": "",
                }
            },
            world_seed_assets_by_world_id={
                "world-legacy": {
                    "characters": [],
                    "factions": [],
                    "locations": [],
                    "relationships": [],
                }
            },
            world_runtime_by_world_id={
                "world-legacy": {
                    "currentWorldDate": "永泰二十三年 三月初八　辰时",
                    "runDays": 3,
                    "isPaused": False,
                    "chapterDraft": {
                        "title": "旧章",
                        "summary": "旧摘要",
                        "tags": [],
                        "updatedAt": "2026-01-02T00:00:00+00:00",
                    },
                    "latestChapter": None,
                    "lastRunResult": None,
                    "events": [],
                    "updatedAt": "2026-01-02T00:00:00+00:00",
                }
            },
        ),
        db=db_session,
    )
    assert response.imported_world_ids == ["world-legacy"]

    repeat = import_local_state(
        LegacyImportRequest(
            world_library={
                "activeWorldId": "world-legacy",
                "worlds": [
                    {
                        "id": "world-legacy",
                        "name": "旧世界",
                        "type": "历史架空",
                        "description": "旧版背景。",
                        "tags": ["旧", "测试"],
                    }
                ],
            }
        ),
        db=db_session,
    )
    assert repeat.imported_world_ids == ["world-legacy"]

    library = read_world_library(db_session)
    assert len(library.worlds) == 1
    assert library.active_world_id == "world-legacy"

