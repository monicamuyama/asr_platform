from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from isdr_api.database import Base, SessionLocal, engine


def _ensure_runtime_schema() -> None:
    inspector = inspect(engine)
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    if "onboarding_completed" in user_columns:
        return

    with engine.begin() as connection:
        if engine.dialect.name == "sqlite":
            connection.execute(
                text("ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT 0")
            )
        else:
            connection.execute(
                text("ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false")
            )


def _seed_reference_data(db: Session) -> None:
    from isdr_api.db_models_extended import ConsentDocument, Country, Language, SpeechCondition

    uganda = db.query(Country).filter(Country.iso_code == "UG").first()
    if uganda is None:
        uganda = Country(country_name="Uganda", iso_code="UG", region="Africa")
        db.add(uganda)
        db.flush()

    existing_languages = db.query(Language).count()
    if existing_languages == 0:
        db.add_all(
            [
                Language(
                    language_name="Luganda",
                    iso_code="LG",
                    country_id=uganda.id,
                    is_low_resource=True,
                ),
                Language(
                    language_name="English",
                    iso_code="ENG",
                    country_id=uganda.id,
                    is_low_resource=False,
                ),
                Language(
                    language_name="Swahili",
                    iso_code="SWA",
                    country_id=uganda.id,
                    is_low_resource=False,
                ),
            ]
        )

    required_consents = {
        "privacy_policy": {
            "title": "ISDR Privacy Policy",
            "version": "v1.0",
            "document_url": "/privacy-policy",
        },
        "research_consent": {
            "title": "ISDR Research Consent",
            "version": "v1.0",
            "document_url": "/research-consent",
        },
    }

    for document_type, values in required_consents.items():
        existing = (
            db.query(ConsentDocument)
            .filter(ConsentDocument.document_type == document_type)
            .first()
        )
        if existing:
            existing.title = values["title"]
            existing.version = values["version"]
            existing.document_url = values["document_url"]
            existing.is_active = True
        else:
            db.add(
                ConsentDocument(
                    title=values["title"],
                    document_type=document_type,
                    version=values["version"],
                    document_url=values["document_url"],
                    is_active=True,
                )
            )

    existing_speech_conditions = db.query(SpeechCondition).count()
    if existing_speech_conditions == 0:
        db.add_all(
            [
                SpeechCondition(
                    condition_name="stutter",
                    description="Speech with repetitions, prolongations, or blocks.",
                    research_notes="Common fluency condition for speaker profiling.",
                ),
                SpeechCondition(
                    condition_name="dysarthria",
                    description="Speech affected by weakened or poorly coordinated muscles.",
                    research_notes="Often impacts articulation and intelligibility.",
                ),
                SpeechCondition(
                    condition_name="apraxia",
                    description="Difficulty planning and sequencing speech movements.",
                    research_notes="Useful for motor-speech research cohorts.",
                ),
                SpeechCondition(
                    condition_name="voice_disorder",
                    description="Differences in pitch, loudness, or vocal quality.",
                    research_notes="May affect phonation stability.",
                ),
                SpeechCondition(
                    condition_name="other",
                    description="A speech-related condition not listed separately.",
                    research_notes="Use when a participant needs a catch-all option.",
                ),
            ]
        )

    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Extended mode is the only supported runtime schema.
    from isdr_api import db_models_extended  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _ensure_runtime_schema()
    db = SessionLocal()
    try:
        _seed_reference_data(db)
    finally:
        db.close()
    yield


app = FastAPI(title="ISDR API", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


from isdr_api.routers import auth

app.include_router(auth.router)
