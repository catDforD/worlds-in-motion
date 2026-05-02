from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_db
from backend.app.schemas.world_state import (
    CreateWorldEventRequest,
    CreateWorldRequest,
    LegacyImportRequest,
    LegacyImportResponse,
    PauseRuntimeRequest,
    SaveWorldSeedAssetsRequest,
    SaveWorldSettingsRequest,
    SetActiveWorldRequest,
    WorldEventSchema,
    WorldLibrarySchema,
    WorldRecordSchema,
    WorldRuntimeStateSchema,
    WorldSeedAssetsSchema,
    WorldSettingsSchema,
    WorldSnapshotSchema,
)
from backend.app.services.world_state import (
    create_world,
    create_world_event,
    get_runtime_state,
    get_seed_assets,
    get_world_library,
    get_world_settings,
    get_world_snapshot,
    import_legacy_state,
    list_world_events,
    run_world_one_day,
    save_seed_assets,
    save_world_settings,
    set_active_world,
    set_runtime_pause,
)

router = APIRouter()
api_router = APIRouter(prefix="/api", tags=["world-state"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@api_router.get("/world-library", response_model=WorldLibrarySchema)
def read_world_library(db: Session = Depends(get_db)) -> WorldLibrarySchema:
    return get_world_library(db)


@api_router.post("/worlds", response_model=WorldRecordSchema, status_code=status.HTTP_201_CREATED)
def create_world_endpoint(
    payload: CreateWorldRequest,
    db: Session = Depends(get_db),
) -> WorldRecordSchema:
    return create_world(db, payload)


@api_router.get("/worlds/{world_id}", response_model=WorldSnapshotSchema)
def read_world_snapshot(world_id: str, db: Session = Depends(get_db)) -> WorldSnapshotSchema:
    return get_world_snapshot(db, world_id)


@api_router.post("/world-library/active", response_model=WorldLibrarySchema)
def update_active_world(
    payload: SetActiveWorldRequest,
    db: Session = Depends(get_db),
) -> WorldLibrarySchema:
    return set_active_world(db, payload)


@api_router.get("/worlds/{world_id}/settings", response_model=WorldSettingsSchema)
def read_world_settings(world_id: str, db: Session = Depends(get_db)) -> WorldSettingsSchema:
    return get_world_settings(db, world_id)


@api_router.put("/worlds/{world_id}/settings", response_model=WorldSettingsSchema)
def update_world_settings(
    world_id: str,
    payload: SaveWorldSettingsRequest,
    db: Session = Depends(get_db),
) -> WorldSettingsSchema:
    return save_world_settings(db, world_id, payload)


@api_router.get("/worlds/{world_id}/seed-assets", response_model=WorldSeedAssetsSchema)
def read_seed_assets(world_id: str, db: Session = Depends(get_db)) -> WorldSeedAssetsSchema:
    return get_seed_assets(db, world_id)


@api_router.put("/worlds/{world_id}/seed-assets", response_model=WorldSeedAssetsSchema)
def update_seed_assets(
    world_id: str,
    payload: SaveWorldSeedAssetsRequest,
    db: Session = Depends(get_db),
) -> WorldSeedAssetsSchema:
    return save_seed_assets(db, world_id, payload)


@api_router.get("/worlds/{world_id}/runtime", response_model=WorldRuntimeStateSchema)
def read_runtime_state(world_id: str, db: Session = Depends(get_db)) -> WorldRuntimeStateSchema:
    return get_runtime_state(db, world_id)


@api_router.patch("/worlds/{world_id}/runtime/pause", response_model=WorldRuntimeStateSchema)
def update_runtime_pause(
    world_id: str,
    payload: PauseRuntimeRequest,
    db: Session = Depends(get_db),
) -> WorldRuntimeStateSchema:
    return set_runtime_pause(db, world_id, payload)


@api_router.post("/worlds/{world_id}/runtime/run-day", response_model=WorldRuntimeStateSchema)
def run_day(world_id: str, db: Session = Depends(get_db)) -> WorldRuntimeStateSchema:
    return run_world_one_day(db, world_id)


@api_router.get("/worlds/{world_id}/events", response_model=list[WorldEventSchema])
def read_world_events(world_id: str, db: Session = Depends(get_db)) -> list[WorldEventSchema]:
    return list_world_events(db, world_id)


@api_router.post("/worlds/{world_id}/events", response_model=WorldEventSchema, status_code=status.HTTP_201_CREATED)
def create_world_event_endpoint(
    world_id: str,
    payload: CreateWorldEventRequest,
    db: Session = Depends(get_db),
) -> WorldEventSchema:
    return create_world_event(db, world_id, payload)


@api_router.post("/import/local-state", response_model=LegacyImportResponse)
def import_local_state(
    payload: LegacyImportRequest,
    db: Session = Depends(get_db),
) -> LegacyImportResponse:
    return import_legacy_state(db, payload)


router.include_router(api_router)
