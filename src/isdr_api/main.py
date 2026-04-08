from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from isdr_api.database import Base, SessionLocal, engine


def _seed_reference_data(db: Session) -> None:
    from isdr_api.db_models_extended import ConsentDocument, Country, Language

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

    existing_consents = db.query(ConsentDocument).count()
    if existing_consents == 0:
        db.add_all(
            [
                ConsentDocument(
                    title="ISDR Privacy Policy",
                    document_type="privacy_policy",
                    version="v1.0",
                    document_url="https://example.org/isdr/privacy-policy-v1",
                    is_active=True,
                ),
                ConsentDocument(
                    title="ISDR Research Consent",
                    document_type="research_consent",
                    version="v1.0",
                    document_url="https://example.org/isdr/research-consent-v1",
                    is_active=True,
                ),
            ]
        )

    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Extended mode is the only supported runtime schema.
    from isdr_api import db_models_extended  # noqa: F401

    Base.metadata.create_all(bind=engine)
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
