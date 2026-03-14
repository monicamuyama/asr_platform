from __future__ import annotations

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "src"))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from isdr_api.database import Base, get_db
from isdr_api.main import app

TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


# ---------------------------------------------------------------------------
# Meta
# ---------------------------------------------------------------------------


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_governance_active_returns_defaults():
    response = client.get("/governance/active")
    assert response.status_code == 200
    data = response.json()
    assert data["quorum_q"] == 5
    assert data["theta_reject"] == 2.5
    assert data["theta_accept"] == 3.5


# ---------------------------------------------------------------------------
# Submissions
# ---------------------------------------------------------------------------

_SUB_PAYLOAD = {
    "contributor_id": "c1",
    "language_code": "lg",
    "mode": "prompted",
    "speaker_profile": "healthy",
    "consent_version": "v1.0",
}


def _create_submission(overrides: dict | None = None) -> dict:
    payload = {**_SUB_PAYLOAD, **(overrides or {})}
    response = client.post("/submissions", json=payload)
    assert response.status_code == 200
    return response.json()


def test_create_submission_defaults_to_pending_community():
    data = _create_submission()
    assert data["status"] == "PENDING_COMMUNITY"
    assert data["aggregate_score"] is None


def test_get_submission_by_id():
    sub = _create_submission()
    response = client.get(f"/submissions/{sub['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == sub["id"]


def test_get_submission_404():
    response = client.get("/submissions/nonexistent")
    assert response.status_code == 404


def test_list_submissions():
    _create_submission()
    _create_submission({"contributor_id": "c2"})
    response = client.get("/submissions")
    assert response.status_code == 200
    assert len(response.json()) == 2


# ---------------------------------------------------------------------------
# Community validation
# ---------------------------------------------------------------------------


def test_community_queue_shows_pending():
    _create_submission()
    response = client.get("/community/queue")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["ratings_count"] == 0


def test_self_rating_blocked():
    sub = _create_submission()
    response = client.post(
        "/community/ratings",
        json={
            "submission_id": sub["id"],
            "rater_id": "c1",
            "intelligibility": 5,
            "recording_quality": 5,
            "elicitation_compliance": 5,
        },
    )
    assert response.status_code == 400
    assert "own submission" in response.json()["detail"]


def test_duplicate_rating_blocked():
    sub = _create_submission()
    rating = {
        "submission_id": sub["id"],
        "rater_id": "v1",
        "intelligibility": 4,
        "recording_quality": 4,
        "elicitation_compliance": 4,
    }
    client.post("/community/ratings", json=rating)
    response = client.post("/community/ratings", json=rating)
    assert response.status_code == 400
    assert "already rated" in response.json()["detail"]


def _rate_n(sub_id: str, score: int, count: int) -> dict:
    for i in range(count):
        resp = client.post(
            "/community/ratings",
            json={
                "submission_id": sub_id,
                "rater_id": f"v{i + 1}",
                "intelligibility": score,
                "recording_quality": score,
                "elicitation_compliance": score,
            },
        )
        assert resp.status_code == 200
    return client.get(f"/submissions/{sub_id}").json()


def test_routes_to_expert_with_high_scores():
    sub = _create_submission()
    updated = _rate_n(sub["id"], score=4, count=5)
    assert updated["status"] == "PENDING_EXPERT"
    assert updated["aggregate_score"] is not None


def test_rejected_with_low_scores():
    sub = _create_submission()
    updated = _rate_n(sub["id"], score=2, count=5)
    assert updated["status"] == "REJECTED_COMMUNITY"


def test_pending_before_quorum():
    sub = _create_submission()
    updated = _rate_n(sub["id"], score=5, count=3)
    assert updated["status"] == "PENDING_COMMUNITY"


# ---------------------------------------------------------------------------
# Expert validation
# ---------------------------------------------------------------------------


def _advance_to_expert() -> str:
    sub = _create_submission()
    _rate_n(sub["id"], score=4, count=5)
    return sub["id"]


def test_expert_queue_shows_pending_expert():
    sub_id = _advance_to_expert()
    response = client.get("/expert/queue")
    assert response.status_code == 200
    items = response.json()
    assert any(item["id"] == sub_id for item in items)


def test_expert_accepts_submission():
    sub_id = _advance_to_expert()
    response = client.post(
        "/expert/reviews",
        json={
            "submission_id": sub_id,
            "expert_id": "expert_01",
            "decision": "accepted",
            "quality_tier": "High",
            "condition_annotation": None,
            "notes": "Clean recording",
        },
    )
    assert response.status_code == 200
    assert response.json()["decision"] == "accepted"
    updated = client.get(f"/submissions/{sub_id}").json()
    assert updated["status"] == "ACCEPTED"


def test_expert_rejects_submission():
    sub_id = _advance_to_expert()
    response = client.post(
        "/expert/reviews",
        json={
            "submission_id": sub_id,
            "expert_id": "expert_01",
            "decision": "rejected",
            "quality_tier": None,
            "condition_annotation": "poor articulation",
            "notes": "Does not meet standard",
        },
    )
    assert response.status_code == 200
    updated = client.get(f"/submissions/{sub_id}").json()
    assert updated["status"] == "REJECTED_EXPERT"


def test_expert_review_on_non_pending_expert_blocked():
    sub = _create_submission()
    response = client.post(
        "/expert/reviews",
        json={
            "submission_id": sub["id"],
            "expert_id": "expert_01",
            "decision": "accepted",
            "quality_tier": "Standard",
        },
    )
    assert response.status_code == 400


def test_accept_without_quality_tier_blocked():
    sub_id = _advance_to_expert()
    response = client.post(
        "/expert/reviews",
        json={
            "submission_id": sub_id,
            "expert_id": "expert_01",
            "decision": "accepted",
            "quality_tier": None,
        },
    )
    assert response.status_code == 400
    assert "quality_tier" in response.json()["detail"]
