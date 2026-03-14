from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from isdr_api.database import get_db
from isdr_api.governance_utils import get_active_governance
from isdr_api.schemas import GovernanceParamSchema

router = APIRouter(prefix="/governance", tags=["governance"])


@router.get("/active", response_model=GovernanceParamSchema)
def active_governance(db: Session = Depends(get_db)) -> dict[str, Any]:
    params = get_active_governance(db)
    return {
        "community_key": "default",
        "quorum_q": params.quorum_q,
        "theta_reject": params.theta_reject,
        "theta_accept": params.theta_accept,
        "w_intelligibility": params.w_intelligibility,
        "w_recording": params.w_recording,
        "w_compliance": params.w_compliance,
    }
