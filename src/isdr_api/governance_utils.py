from __future__ import annotations

from sqlalchemy.orm import Session

from isdr_core import GovernanceParams
from isdr_api.db_models import GovernanceParam

DEFAULT_GOVERNANCE = GovernanceParams(
    quorum_q=5,
    theta_reject=2.5,
    theta_accept=3.5,
    w_intelligibility=0.5,
    w_recording=0.35,
    w_compliance=0.15,
)


def get_active_governance(db: Session) -> GovernanceParams:
    row = (
        db.query(GovernanceParam)
        .order_by(GovernanceParam.active_from.desc())
        .first()
    )
    if not row:
        return DEFAULT_GOVERNANCE
    return GovernanceParams(
        quorum_q=row.quorum_q,
        theta_reject=row.theta_reject,
        theta_accept=row.theta_accept,
        w_intelligibility=row.w_intelligibility,
        w_recording=row.w_recording,
        w_compliance=row.w_compliance,
    )
