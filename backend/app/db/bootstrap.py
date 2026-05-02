from __future__ import annotations

from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from backend.app.db.base import Base
from backend.app.db.models import Workspace


def initialize_database(engine: Engine) -> None:
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        workspace = session.get(Workspace, "default")
        if workspace is None:
            session.add(Workspace(id="default", active_world_id=None))
            session.commit()
