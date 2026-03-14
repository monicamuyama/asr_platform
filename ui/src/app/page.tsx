"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Submission = {
  id: string;
  contributor_id: string;
  language_code: string;
  mode: "prompted" | "read" | "spontaneous";
  speaker_profile: string;
  consent_version: string;
  status: string;
  aggregate_score: number | null;
  created_at: string;
};

type QueueItem = {
  id: string;
  contributor_id: string;
  language_code: string;
  mode: string;
  speaker_profile: string;
  status: string;
  ratings_count: number;
};

type ExpertQueueItem = {
  id: string;
  contributor_id: string;
  language_code: string;
  mode: string;
  speaker_profile: string;
  status: string;
  aggregate_score: number | null;
};

type Governance = {
  quorum_q: number;
  theta_reject: number;
  theta_accept: number;
  w_intelligibility: number;
  w_recording: number;
  w_compliance: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

export default function Home() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [governance, setGovernance] = useState<Governance | null>(null);
  const [expertQueue, setExpertQueue] = useState<ExpertQueueItem[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>("");
  const [selectedExpertSubmissionId, setSelectedExpertSubmissionId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [submissionForm, setSubmissionForm] = useState({
    contributor_id: "contributor_01",
    language_code: "lg",
    mode: "prompted" as "prompted" | "read" | "spontaneous",
    speaker_profile: "healthy",
    consent_version: "v1.0",
  });

  const [ratingForm, setRatingForm] = useState({
    rater_id: "validator_01",
    intelligibility: 4,
    recording_quality: 4,
    elicitation_compliance: 4,
  });

  const [expertReviewForm, setExpertReviewForm] = useState({
    expert_id: "expert_01",
    decision: "accepted" as "accepted" | "rejected",
    quality_tier: "High" as "Standard" | "High" | "Reference" | "",
    condition_annotation: "",
    notes: "",
  });

  const refreshData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError("");
    try {
      const [subRes, queueRes, expertQueueRes, govRes] = await Promise.all([
        fetch(`${API_BASE}/submissions`),
        fetch(`${API_BASE}/community/queue`),
        fetch(`${API_BASE}/expert/queue`),
        fetch(`${API_BASE}/governance/active`),
      ]);

      if (!subRes.ok || !queueRes.ok || !expertQueueRes.ok || !govRes.ok) {
        throw new Error("Failed to load API data. Is backend running?");
      }

      const subData = (await subRes.json()) as Submission[];
      const queueData = (await queueRes.json()) as QueueItem[];
      const expertQueueData = (await expertQueueRes.json()) as ExpertQueueItem[];
      const govData = (await govRes.json()) as Governance;

      setSubmissions(subData);
      setQueue(queueData);
      setExpertQueue(expertQueueData);
      setGovernance(govData);
      if (!selectedSubmissionId && queueData.length > 0) {
        setSelectedSubmissionId(queueData[0].id);
      }
      if (!selectedExpertSubmissionId && expertQueueData.length > 0) {
        setSelectedExpertSubmissionId(expertQueueData[0].id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubmissionId, selectedExpertSubmissionId]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const metrics = useMemo(() => {
    const pendingCommunity = submissions.filter(
      (s) => s.status === "PENDING_COMMUNITY",
    ).length;
    const holdBand = submissions.filter((s) => s.status === "HOLD_COMMUNITY").length;
    const pendingExpert = submissions.filter(
      (s) => s.status === "PENDING_EXPERT",
    ).length;
    const accepted = submissions.filter((s) => s.status === "ACCEPTED").length;

    return {
      pendingCommunity,
      holdBand,
      pendingExpert,
      accepted,
    };
  }, [submissions]);

  async function submitSubmission(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch(`${API_BASE}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionForm),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`Failed to create submission: ${details}`);
      }

      await refreshData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    }
  }

  async function submitExpertReview(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    if (!selectedExpertSubmissionId) {
      setError("Select a submission from the expert queue first.");
      return;
    }

    try {
      const body: Record<string, string | null> = {
        submission_id: selectedExpertSubmissionId,
        expert_id: expertReviewForm.expert_id,
        decision: expertReviewForm.decision,
        quality_tier: expertReviewForm.decision === "accepted" && expertReviewForm.quality_tier
          ? expertReviewForm.quality_tier
          : null,
        condition_annotation: expertReviewForm.condition_annotation || null,
        notes: expertReviewForm.notes || null,
      };

      const response = await fetch(`${API_BASE}/expert/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`Expert review failed: ${details}`);
      }

      setSelectedExpertSubmissionId("");
      await refreshData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    }
  }

  async function submitRating(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    if (!selectedSubmissionId) {
      setError("Select a submission from queue first.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/community/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ratingForm, submission_id: selectedSubmissionId }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`Failed to submit rating: ${details}`);
      }

      await refreshData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    }
  }

  return (
    <div className="min-h-screen px-5 py-8 sm:px-8 lg:px-14">
      <main className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-ink/10 bg-white/80 p-7 shadow-card backdrop-blur-sm sm:p-10">
          <p className="mb-3 inline-flex rounded-full border border-ember/40 bg-ember/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ember">
            Inclusive Speech Data Refinery
          </p>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Community-led speech corpus collection with deterministic validation routing.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink/80 sm:text-lg">
            This Next.js UI is connected to the FastAPI backend for contributor intake,
            community rating queues, and governance-aware routing.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => {
                void refreshData();
              }}
              className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-cream transition hover:-translate-y-0.5 hover:bg-ink/90"
            >
              Refresh Live Data
            </button>
            <p className="rounded-xl border border-lagoon/40 bg-lagoon/10 px-5 py-3 text-sm font-semibold text-lagoon">
              API: {API_BASE}
            </p>
          </div>
          {error && (
            <p className="mt-4 rounded-xl border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-ember">
              {error}
            </p>
          )}
          {isLoading && (
            <p className="mt-4 rounded-xl border border-ink/20 bg-ink/5 px-4 py-3 text-sm text-ink/70">
              Loading backend data...
            </p>
          )}
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-ink/10 bg-white/85 p-6 shadow-card">
            <h2 className="text-xl font-semibold text-ink">New Submission</h2>
            <form className="mt-4 grid gap-3" onSubmit={submitSubmission}>
              <input
                className="rounded-xl border border-ink/20 px-3 py-2"
                value={submissionForm.contributor_id}
                onChange={(e) =>
                  setSubmissionForm((prev) => ({ ...prev, contributor_id: e.target.value }))
                }
                placeholder="Contributor ID"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-xl border border-ink/20 px-3 py-2"
                  value={submissionForm.language_code}
                  onChange={(e) =>
                    setSubmissionForm((prev) => ({ ...prev, language_code: e.target.value }))
                  }
                  placeholder="Language code"
                />
                <select
                  className="rounded-xl border border-ink/20 px-3 py-2"
                  value={submissionForm.mode}
                  onChange={(e) =>
                    setSubmissionForm((prev) => ({
                      ...prev,
                      mode: e.target.value as "prompted" | "read" | "spontaneous",
                    }))
                  }
                >
                  <option value="prompted">Prompted</option>
                  <option value="read">Read</option>
                  <option value="spontaneous">Spontaneous</option>
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-xl border border-ink/20 px-3 py-2"
                  value={submissionForm.speaker_profile}
                  onChange={(e) =>
                    setSubmissionForm((prev) => ({ ...prev, speaker_profile: e.target.value }))
                  }
                  placeholder="Speaker profile"
                />
                <input
                  className="rounded-xl border border-ink/20 px-3 py-2"
                  value={submissionForm.consent_version}
                  onChange={(e) =>
                    setSubmissionForm((prev) => ({ ...prev, consent_version: e.target.value }))
                  }
                  placeholder="Consent version"
                />
              </div>
              <button className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-cream">
                Create Submission
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-ink/10 bg-white/85 p-6 shadow-card">
            <h2 className="text-xl font-semibold text-ink">Submit Community Rating</h2>
            <form className="mt-4 grid gap-3" onSubmit={submitRating}>
              <select
                className="rounded-xl border border-ink/20 px-3 py-2"
                value={selectedSubmissionId}
                onChange={(e) => setSelectedSubmissionId(e.target.value)}
              >
                <option value="">Select queue submission</option>
                {queue.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id.slice(0, 8)} | {item.language_code} | {item.mode} | {item.status}
                  </option>
                ))}
              </select>
              <input
                className="rounded-xl border border-ink/20 px-3 py-2"
                value={ratingForm.rater_id}
                onChange={(e) =>
                  setRatingForm((prev) => ({ ...prev, rater_id: e.target.value }))
                }
                placeholder="Rater ID"
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="rounded-xl border border-ink/20 px-3 py-2"
                  value={ratingForm.intelligibility}
                  onChange={(e) =>
                    setRatingForm((prev) => ({
                      ...prev,
                      intelligibility: Number(e.target.value),
                    }))
                  }
                />
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="rounded-xl border border-ink/20 px-3 py-2"
                  value={ratingForm.recording_quality}
                  onChange={(e) =>
                    setRatingForm((prev) => ({
                      ...prev,
                      recording_quality: Number(e.target.value),
                    }))
                  }
                />
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="rounded-xl border border-ink/20 px-3 py-2"
                  value={ratingForm.elicitation_compliance}
                  onChange={(e) =>
                    setRatingForm((prev) => ({
                      ...prev,
                      elicitation_compliance: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <p className="text-xs text-ink/70">
                Fields order: intelligibility, recording quality, elicitation compliance.
              </p>
              <button className="rounded-xl border border-lagoon/40 bg-lagoon/10 px-4 py-2 text-sm font-semibold text-lagoon">
                Submit Rating
              </button>
            </form>
          </article>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Pending Community",
              value: String(metrics.pendingCommunity),
              color: "text-ink",
            },
            {
              label: "Hold Band",
              value: String(metrics.holdBand),
              color: "text-ember",
            },
            {
              label: "Pending Expert",
              value: String(metrics.pendingExpert),
              color: "text-lagoon",
            },
            {
              label: "Accepted",
              value: String(metrics.accepted),
              color: "text-ink",
            },
          ].map((metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-ink/10 bg-white/85 p-5 shadow-card"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-ink/55">{metric.label}</p>
              <p className={`mt-3 text-3xl font-bold ${metric.color}`}>{metric.value}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-ink/10 bg-white/85 p-6 shadow-card">
            <h2 className="text-xl font-semibold text-ink">Community Queue</h2>
            <div className="mt-4 space-y-2 text-sm">
              {queue.length === 0 && <p className="text-ink/60">No queue items available.</p>}
              {queue.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedSubmissionId(item.id)}
                  className="w-full rounded-xl border border-ink/10 bg-cream/60 px-3 py-2 text-left transition hover:border-lagoon/50"
                >
                  <p className="font-semibold text-ink">{item.id.slice(0, 8)}... ({item.status})</p>
                  <p className="text-ink/70">
                    {item.language_code} | {item.mode} | ratings: {item.ratings_count}
                  </p>
                </button>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-ink/10 bg-white/85 p-6 shadow-card">
            <h2 className="text-xl font-semibold text-ink">Routing Configuration</h2>
            {governance ? (
              <>
                <p className="mt-2 text-sm text-ink/75">
                  Active parameters loaded from backend governance endpoint.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl bg-ink/5 p-3">
                    <p className="text-ink/60">Quorum</p>
                    <p className="mt-1 text-lg font-semibold text-ink">{governance.quorum_q}</p>
                  </div>
                  <div className="rounded-xl bg-ink/5 p-3">
                    <p className="text-ink/60">theta_reject</p>
                    <p className="mt-1 text-lg font-semibold text-ink">
                      {governance.theta_reject.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-ink/5 p-3">
                    <p className="text-ink/60">theta_accept</p>
                    <p className="mt-1 text-lg font-semibold text-ink">
                      {governance.theta_accept.toFixed(2)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-ink/60">Governance parameters unavailable.</p>
            )}
          </article>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-ink/10 bg-white/85 p-6 shadow-card">
            <h2 className="text-xl font-semibold text-ink">Expert Queue</h2>
            <div className="mt-4 space-y-2 text-sm">
              {expertQueue.length === 0 && (
                <p className="text-ink/60">No submissions awaiting expert review.</p>
              )}
              {expertQueue.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedExpertSubmissionId(item.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    selectedExpertSubmissionId === item.id
                      ? "border-ember/60 bg-ember/10"
                      : "border-ink/10 bg-cream/60 hover:border-lagoon/50"
                  }`}
                >
                  <p className="font-semibold text-ink">{item.id.slice(0, 8)}...</p>
                  <p className="text-ink/70">
                    {item.language_code} | {item.mode} | score:{" "}
                    {item.aggregate_score !== null ? item.aggregate_score.toFixed(2) : "—"}
                  </p>
                </button>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-ink/10 bg-white/85 p-6 shadow-card">
            <h2 className="text-xl font-semibold text-ink">Submit Expert Review</h2>
            <form className="mt-4 grid gap-3" onSubmit={submitExpertReview}>
              <select
                className="rounded-xl border border-ink/20 px-3 py-2"
                value={selectedExpertSubmissionId}
                onChange={(e) => setSelectedExpertSubmissionId(e.target.value)}
              >
                <option value="">Select expert queue item</option>
                {expertQueue.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id.slice(0, 8)} | {item.language_code} | {item.mode}
                  </option>
                ))}
              </select>
              <input
                className="rounded-xl border border-ink/20 px-3 py-2"
                value={expertReviewForm.expert_id}
                onChange={(e) =>
                  setExpertReviewForm((prev) => ({ ...prev, expert_id: e.target.value }))
                }
                placeholder="Expert ID"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  className="rounded-xl border border-ink/20 px-3 py-2"
                  value={expertReviewForm.decision}
                  onChange={(e) =>
                    setExpertReviewForm((prev) => ({
                      ...prev,
                      decision: e.target.value as "accepted" | "rejected",
                    }))
                  }
                >
                  <option value="accepted">Accept</option>
                  <option value="rejected">Reject</option>
                </select>
                <select
                  className="rounded-xl border border-ink/20 px-3 py-2"
                  value={expertReviewForm.quality_tier}
                  disabled={expertReviewForm.decision === "rejected"}
                  onChange={(e) =>
                    setExpertReviewForm((prev) => ({
                      ...prev,
                      quality_tier: e.target.value as "Standard" | "High" | "Reference" | "",
                    }))
                  }
                >
                  <option value="">Quality tier</option>
                  <option value="Standard">Standard</option>
                  <option value="High">High</option>
                  <option value="Reference">Reference</option>
                </select>
              </div>
              <input
                className="rounded-xl border border-ink/20 px-3 py-2"
                value={expertReviewForm.condition_annotation}
                onChange={(e) =>
                  setExpertReviewForm((prev) => ({
                    ...prev,
                    condition_annotation: e.target.value,
                  }))
                }
                placeholder="Condition annotation (optional)"
              />
              <textarea
                className="rounded-xl border border-ink/20 px-3 py-2 text-sm"
                rows={2}
                value={expertReviewForm.notes}
                onChange={(e) =>
                  setExpertReviewForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Notes (optional)"
              />
              <button
                className="rounded-xl border border-ember/50 bg-ember/10 px-4 py-2 text-sm font-semibold text-ember"
              >
                Submit Expert Review
              </button>
            </form>
          </article>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-1">
          <article className="rounded-2xl border border-ink/10 bg-white/85 p-6 shadow-card">
            <h2 className="text-xl font-semibold text-ink">Recent Submissions</h2>
            <div className="mt-4 overflow-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-ink/15 text-ink/70">
                    <th className="py-2 pr-3">ID</th>
                    <th className="py-2 pr-3">Contributor</th>
                    <th className="py-2 pr-3">Lang</th>
                    <th className="py-2 pr-3">Mode</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Aggregate</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((row) => (
                    <tr key={row.id} className="border-b border-ink/10">
                      <td className="py-2 pr-3 font-semibold text-ink">{row.id.slice(0, 8)}...</td>
                      <td className="py-2 pr-3 text-ink/80">{row.contributor_id}</td>
                      <td className="py-2 pr-3 text-ink/80">{row.language_code}</td>
                      <td className="py-2 pr-3 text-ink/80">{row.mode}</td>
                      <td className="py-2 pr-3 text-ink/80">{row.status}</td>
                      <td className="py-2 pr-3 text-ink/80">
                        {row.aggregate_score === null ? "-" : row.aggregate_score.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
