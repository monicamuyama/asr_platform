'use client'

import { FormEvent, useEffect, useState } from 'react'
import { WorkflowNav } from '@/components/workflow-nav'
import { API_BASE } from '@/lib/api'

type ExpertQueueItem = {
  id: string
  contributor_id: string
  language_code: string
  mode: string
  status: string
  aggregate_score: number | null
}

export default function ExpertPage() {
  const [queue, setQueue] = useState<ExpertQueueItem[]>([])
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('')
  const [decision, setDecision] = useState<'accepted' | 'rejected'>('accepted')
  const [qualityTier, setQualityTier] = useState<'Standard' | 'High' | 'Reference' | ''>('High')
  const [notes, setNotes] = useState('')
  const [expertId, setExpertId] = useState('expert_01')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const refreshQueue = async () => {
    setError('')
    try {
      const res = await fetch(`${API_BASE}/expert/queue`)
      if (!res.ok) {
        throw new Error('Unable to load expert queue')
      }
      const data = (await res.json()) as ExpertQueueItem[]
      setQueue(data)
      setSelectedSubmissionId((prev) => prev || data[0]?.id || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  useEffect(() => {
    void refreshQueue()
  }, [])

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedSubmissionId) {
      setError('Select a submission first.')
      return
    }

    try {
      const body = {
        submission_id: selectedSubmissionId,
        expert_id: expertId,
        decision,
        quality_tier: decision === 'accepted' ? qualityTier : null,
        condition_annotation: null,
        notes: notes || null,
      }

      const res = await fetch(`${API_BASE}/expert/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const details = await res.text()
        throw new Error(details || 'Review failed')
      }

      setSuccess('Expert review submitted.')
      setNotes('')
      await refreshQueue()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <main className="mx-auto max-w-6xl">
        <WorkflowNav />
        <h1 className="text-3xl font-bold text-foreground">Expert Review</h1>
        <p className="mt-2 text-sm text-muted-foreground">Finalize acceptance decisions for high-value submissions.</p>

        {error && <p className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p className="mt-4 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold">Expert Queue</h2>
            <div className="mt-3 space-y-2">
              {queue.length === 0 && <p className="text-sm text-muted-foreground">No expert items pending.</p>}
              {queue.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedSubmissionId(item.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm ${selectedSubmissionId === item.id ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}
                >
                  <p className="font-semibold">{item.id.slice(0, 8)}... | {item.status}</p>
                  <p className="text-muted-foreground">{item.language_code} | {item.mode} | score: {item.aggregate_score ?? '-'}</p>
                </button>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold">Submit Decision</h2>
            <form className="mt-4 grid gap-3" onSubmit={submitReview}>
              <select className="rounded-md border border-border px-3 py-2" value={selectedSubmissionId} onChange={(e) => setSelectedSubmissionId(e.target.value)}>
                <option value="">Select item</option>
                {queue.map((item) => (
                  <option key={item.id} value={item.id}>{item.id.slice(0, 8)} | {item.language_code}</option>
                ))}
              </select>
              <input className="rounded-md border border-border px-3 py-2" value={expertId} onChange={(e) => setExpertId(e.target.value)} placeholder="Expert ID" />
              <select className="rounded-md border border-border px-3 py-2" value={decision} onChange={(e) => setDecision(e.target.value as 'accepted' | 'rejected')}>
                <option value="accepted">Accept</option>
                <option value="rejected">Reject</option>
              </select>
              <select className="rounded-md border border-border px-3 py-2" value={qualityTier} onChange={(e) => setQualityTier(e.target.value as 'Standard' | 'High' | 'Reference' | '')} disabled={decision === 'rejected'}>
                <option value="">Quality tier</option>
                <option value="Standard">Standard</option>
                <option value="High">High</option>
                <option value="Reference">Reference</option>
              </select>
              <textarea className="rounded-md border border-border px-3 py-2" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">Submit Review</button>
            </form>
          </article>
        </section>
      </main>
    </div>
  )
}
