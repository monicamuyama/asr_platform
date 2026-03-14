import unittest
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1] / "src"))

from isdr_core import CommunityRating, GovernanceParams, SubmissionStatus, route_submission


def _params() -> GovernanceParams:
    return GovernanceParams(
        quorum_q=5,
        theta_reject=2.5,
        theta_accept=3.5,
        w_intelligibility=0.5,
        w_recording=0.35,
        w_compliance=0.15,
    )


class RoutingTests(unittest.TestCase):
    def test_pending_community_before_quorum(self) -> None:
        ratings = [CommunityRating(5, 5, 5), CommunityRating(4, 4, 4)]
        decision = route_submission(ratings, _params())
        self.assertEqual(decision.status, SubmissionStatus.PENDING_COMMUNITY)
        self.assertIsNone(decision.aggregate_score)

    def test_rejected_below_theta_reject(self) -> None:
        ratings = [
            CommunityRating(1, 1, 1),
            CommunityRating(2, 2, 2),
            CommunityRating(2, 2, 2),
            CommunityRating(1, 1, 1),
            CommunityRating(2, 1, 2),
        ]
        decision = route_submission(ratings, _params())
        self.assertEqual(decision.status, SubmissionStatus.REJECTED_COMMUNITY)
        self.assertIsNotNone(decision.aggregate_score)
        assert decision.aggregate_score is not None
        self.assertLess(decision.aggregate_score, 2.5)

    def test_hold_between_thresholds(self) -> None:
        ratings = [
            CommunityRating(3, 3, 3),
            CommunityRating(4, 3, 3),
            CommunityRating(3, 3, 4),
            CommunityRating(3, 4, 3),
            CommunityRating(4, 3, 4),
        ]
        decision = route_submission(ratings, _params())
        self.assertEqual(decision.status, SubmissionStatus.HOLD_COMMUNITY)
        self.assertIsNotNone(decision.aggregate_score)
        assert decision.aggregate_score is not None
        self.assertGreaterEqual(decision.aggregate_score, 2.5)
        self.assertLess(decision.aggregate_score, 3.5)

    def test_forward_to_expert_at_or_above_theta_accept(self) -> None:
        ratings = [
            CommunityRating(5, 5, 4),
            CommunityRating(4, 4, 4),
            CommunityRating(5, 4, 4),
            CommunityRating(4, 5, 5),
            CommunityRating(5, 4, 5),
        ]
        decision = route_submission(ratings, _params())
        self.assertEqual(decision.status, SubmissionStatus.PENDING_EXPERT)
        self.assertIsNotNone(decision.aggregate_score)
        assert decision.aggregate_score is not None
        self.assertGreaterEqual(decision.aggregate_score, 3.5)


if __name__ == "__main__":
    unittest.main()
