from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from backend.app.api.routes import router
from backend.app.core.config import Settings, get_settings
from backend.app.db.bootstrap import initialize_database
from backend.app.db.session import create_engine_for_url, create_session_factory


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    engine = create_engine_for_url(settings.database_url)
    session_factory = create_session_factory(engine)
    if settings.auto_create_schema:
        initialize_database(engine)

    app = FastAPI(title="织世录世界状态后端", version="0.1.0")
    app.state.settings = settings
    app.state.engine = engine
    app.state.session_factory = session_factory
    app.include_router(router)

    @app.exception_handler(ValueError)
    async def handle_value_error(request: Request, exc: ValueError) -> JSONResponse:  # noqa: ARG001
        return JSONResponse(status_code=400, content={"detail": str(exc)})

    @app.exception_handler(SQLAlchemyError)
    async def handle_db_error(request: Request, exc: SQLAlchemyError) -> JSONResponse:  # noqa: ARG001
        return JSONResponse(status_code=500, content={"detail": "数据库操作失败"})

    return app


app = create_app()
