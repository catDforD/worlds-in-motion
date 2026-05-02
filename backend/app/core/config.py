from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    database_url: str
    environment: str = "development"
    api_prefix: str = "/api"
    auto_create_schema: bool = True


def get_settings() -> Settings:
    database_url = os.getenv("WORLD_STATE_DATABASE_URL") or os.getenv("DATABASE_URL") or "sqlite:///./backend/dev.db"

    return Settings(
        database_url=database_url,
        environment=os.getenv("WORLD_STATE_ENV", "development"),
        api_prefix=os.getenv("WORLD_STATE_API_PREFIX", "/api"),
        auto_create_schema=os.getenv("WORLD_STATE_AUTO_CREATE_SCHEMA", "1") != "0",
    )
