from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

def _cors_allowed_origins() -> list[str]:
    # Default to local UI origins; production must set CORS_ALLOWED_ORIGINS explicitly.
    configured = os.getenv("CORS_ALLOWED_ORIGINS", "")
    if configured.strip():
        return [origin.strip().rstrip("/") for origin in configured.split(",") if origin.strip()]
    return ["http://localhost:3000", "http://127.0.0.1:3000"]


app = FastAPI(title="ISDR API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["meta"])
def root() -> dict[str, str]:
    return {
        "message": "ISDR API running",
        "health": "/health",
        "docs": "/docs",
    }


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}


from isdr_api.routers import auth, submissions, transcription

app.include_router(auth.router)
app.include_router(submissions.router)
app.include_router(transcription.router)
