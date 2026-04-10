'use client'

import { FormEvent, useEffect, useState } from 'react'
import { WorkflowNav } from '@/components/workflow-nav'
import { createCommunityRating, getCommunityQueue, type CommunityQueueItem } from '@/lib/api'
import { getSessionUserId } from '@/lib/auth'

export default function CommunityPage() {
  const [queue, setQueue] = useState<CommunityQueueItem[]>([])
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [scores, setScores] = useState({ intelligibility: 4, recording_quality: 4, elicitation_compliance: 4 })

  const loadQueue = async () => {
    setError('')
    try {
      const data = await getCommunityQueue()
      setQueue(data)
      setSelectedSubmissionId((prev) => prev || data[0]?.id || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue')
    }
  }

  useEffect(() => {
    void loadQueue()
  }, [])

  async function submitRating(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedSubmissionId) {
      setError('Select a submission first.')
      return
    }

    const userId = getSessionUserId() ?? 'validator_01'

    try {
      const result = await createCommunityRating(selectedSubmissionId, {
        submission_id: selectedSubmissionId,
        rater_id: userId,
        intelligibility: scores.intelligibility,
        recording_quality: scores.recording_quality,
        elicitation_compliance: scores.elicitation_compliance,
      })
      setSuccess(`Rating submitted. Status is now ${result.status}.`)
      await loadQueue()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating')
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <main className="mx-auto max-w-6xl">
        <WorkflowNav />
        <h1 className="text-3xl font-bold text-foreground">Community Review</h1>
        <p className="mt-2 text-sm text-muted-foreground">Pick a queued submission and rate quality.</p>

        {error && <p className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p className="mt-4 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold">Queue</h2>
            <div className="mt-3 space-y-2">
              {queue.length === 0 && <p className="text-sm text-muted-foreground">No items available.</p>}
              {queue.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedSubmissionId(item.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm ${selectedSubmissionId === item.id ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}
                >
                  <p className="font-semibold">{item.id.slice(0, 8)}... | {item.status}</p>
                  <p className="text-muted-foreground">{item.language_code} | {item.mode} | ratings: {item.ratings_count}</p>
                </button>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold">Rate</h2>
            <form className="mt-4 grid gap-3" onSubmit={submitRating}>
              <select
                className="rounded-md border border-border px-3 py-2"
                value={selectedSubmissionId}
                onChange={(e) => setSelectedSubmissionId(e.target.value)}
              >
                <option value="">Select queue item</option>
                {queue.map((item) => (
                  <option key={item.id} value={item.id}>{item.id.slice(0, 8)} | {item.language_code}</option>
                ))}
              </select>
              <input type="number" min={1} max={5} className="rounded-md border border-border px-3 py-2" value={scores.intelligibility} onChange={(e) => setScores((p) => ({ ...p, intelligibility: Number(e.target.value) }))} />
              <input type="number" min={1} max={5} className="rounded-md border border-border px-3 py-2" value={scores.recording_quality} onChange={(e) => setScores((p) => ({ ...p, recording_quality: Number(e.target.value) }))} />
              <input type="number" min={1} max={5} className="rounded-md border border-border px-3 py-2" value={scores.elicitation_compliance} onChange={(e) => setScores((p) => ({ ...p, elicitation_compliance: Number(e.target.value) }))} />
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">Submit Rating</button>
            </form>
          </article>
        </section>
      </main>
    </div>
  )
}
