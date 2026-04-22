'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { WorkflowNav } from '@/components/workflow-nav'
import { API_BASE, type SubmissionResponse } from '@/lib/api'

type TipItem = {
  id: number
  submission_id: string
  contributor_id: string
  tipper_id: string
  amount: number
  rating: number
  currency: 'USD' | 'EUR' | 'GBP'
  message: string | null
}

export default function TipsPage() {
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([])
  const [tips, setTips] = useState<TipItem[]>([])
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('')
  const [tipperId, setTipperId] = useState('listener_01')
  const [amount, setAmount] = useState(2)
  const [rating, setRating] = useState(5)
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const acceptedSubmissions = useMemo(
    () => submissions.filter((s) => s.status === 'ACCEPTED'),
    [submissions],
  )

  const refreshData = async () => {
    setError('')
    try {
      const [subRes, tipsRes] = await Promise.all([
        fetch(`${API_BASE}/submissions`),
        fetch(`${API_BASE}/tips/recent`),
      ])
      if (!subRes.ok || !tipsRes.ok) {
        throw new Error('Unable to load tips data')
      }
      const subData = (await subRes.json()) as SubmissionResponse[]
      const tipData = (await tipsRes.json()) as TipItem[]
      setSubmissions(subData)
      setTips(tipData)
      const accepted = subData.find((s) => s.status === 'ACCEPTED')
      setSelectedSubmissionId((prev) => prev || accepted?.id || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  useEffect(() => {
    void refreshData()
  }, [])

  async function submitTip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedSubmissionId) {
      setError('Select an accepted submission first.')
      return
    }

    try {
      const res = await fetch(`${API_BASE}/tips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: selectedSubmissionId,
          tipper_id: tipperId,
          amount,
          rating,
          currency,
          message: message || null,
        }),
      })

      if (!res.ok) {
        const details = await res.text()
        throw new Error(details || 'Tip failed')
      }

      setSuccess('Tip submitted successfully.')
      setMessage('')
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <main className="mx-auto max-w-6xl">
        <WorkflowNav />
        <h1 className="text-3xl font-bold text-foreground">Tips and Ratings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Support accepted submissions with listener ratings and tips.</p>

        {error && <p className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p className="mt-4 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold">Send Tip</h2>
            <form className="mt-4 grid gap-3" onSubmit={submitTip}>
              <select className="rounded-md border border-border px-3 py-2" value={selectedSubmissionId} onChange={(e) => setSelectedSubmissionId(e.target.value)}>
                <option value="">Select accepted submission</option>
                {acceptedSubmissions.map((item) => (
                  <option key={item.id} value={item.id}>{item.id.slice(0, 8)} | {item.contributor_id} | {item.language_code}</option>
                ))}
              </select>
              <input className="rounded-md border border-border px-3 py-2" value={tipperId} onChange={(e) => setTipperId(e.target.value)} placeholder="Your listener ID" />
              <div className="grid grid-cols-3 gap-2">
                <input type="number" min={0.5} step={0.5} className="rounded-md border border-border px-3 py-2" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                <select className="rounded-md border border-border px-3 py-2" value={currency} onChange={(e) => setCurrency(e.target.value as 'USD' | 'EUR' | 'GBP')}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
                <input type="number" min={1} max={5} className="rounded-md border border-border px-3 py-2" value={rating} onChange={(e) => setRating(Number(e.target.value))} />
              </div>
              <textarea className="rounded-md border border-border px-3 py-2" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Optional message" />
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">Send Tip</button>
            </form>
          </article>

          <article className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold">Recent Tips</h2>
            <div className="mt-3 space-y-2">
              {tips.length === 0 && <p className="text-sm text-muted-foreground">No tips yet.</p>}
              {tips.slice(0, 10).map((tip) => (
                <div key={tip.id} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <p className="font-semibold">{tip.currency} {tip.amount.toFixed(2)} | {'★'.repeat(tip.rating)}</p>
                  <p className="text-muted-foreground">To {tip.contributor_id} by {tip.tipper_id}</p>
                  {tip.message && <p className="text-muted-foreground">"{tip.message}"</p>}
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}
