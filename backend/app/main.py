import json
import logging
import time
import uuid
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .auth import ALGORITHM, SECRET_KEY
from .database import Base, engine
from .routes import interview_kit, match, roles, share, system, user

logger = logging.getLogger("talentalign")
logging.basicConfig(level=logging.INFO)


def _extract_user_sub(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth.replace("Bearer ", "", 1).strip()
    try:
        from jose import jwt

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except Exception:
        return None


def create_app() -> FastAPI:
    app = FastAPI(title="TalentAlign AI API", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    Base.metadata.create_all(bind=engine)

    @app.middleware("http")
    async def request_id_and_logging(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        started = time.perf_counter()
        response = None
        status_code = 500
        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        finally:
            elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
            if response is not None:
                response.headers["X-Request-ID"] = request_id
            user_sub = _extract_user_sub(request)
            logger.info(
                json.dumps(
                    {
                        "request_id": request_id,
                        "route": request.url.path,
                        "method": request.method,
                        "user_id": user_sub,
                        "status": status_code,
                        "duration_ms": elapsed_ms,
                    }
                )
            )

    app.include_router(user.router)
    app.include_router(match.router)
    app.include_router(roles.router)
    app.include_router(interview_kit.router)
    app.include_router(share.router)
    app.include_router(system.router)

    @app.get("/")
    def root():
        return {
            "app": "TalentAlign AI",
            "status": "ok",
            "docs": "/docs",
            "database": str(Path("./talentalign.db").resolve()),
        }

    return app


app = create_app()