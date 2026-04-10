'use client'

import { FormEvent, useEffect, useState } from 'react'
import { WorkflowNav } from '@/components/workflow-nav'
import { API_BASE } from '@/lib/api'

type UserAccount = {
  id: string
  handle: string
  display_name: string
  preferred_language: string
}

type SubmissionMode = 'prompted' | 'recording' | 'read_out' | 'spontaneous_image'

export default function ContributorsPage() {
  const [users, setUsers] = useState<UserAccount[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [registerForm, setRegisterForm] = useState({
    handle: '',
    display_name: '',
    preferred_language: 'lg',
  })

  const [submissionForm, setSubmissionForm] = useState({
    contributor_id: '',
    language_code: 'lg',
    mode: 'recording' as SubmissionMode,
    speaker_profile: 'healthy',
    consent_version: 'v1.0',
    target_word: '',
    read_prompt: '',
    image_prompt_url: '',
    spontaneous_instruction: '',
  })

  const refreshUsers = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/users`)
      if (!res.ok) {
        throw new Error('Unable to load users')
      }
      const data = (await res.json()) as UserAccount[]
      setUsers(data)
      if (data.length > 0 && !submissionForm.contributor_id) {
        setSubmissionForm((prev) => ({ ...prev, contributor_id: data[0].handle }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshUsers()
  }, [])

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      })
      if (!res.ok) {
        const details = await res.text()
        throw new Error(details || 'Registration failed')
      }
      setRegisterForm((prev) => ({ ...prev, handle: '', display_name: '' }))
      await refreshUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  async function submitSubmission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API_BASE}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...submissionForm,
          target_word: submissionForm.target_word || null,
          read_prompt: submissionForm.read_prompt || null,
          image_prompt_url: submissionForm.image_prompt_url || null,
          spontaneous_instruction: submissionForm.spontaneous_instruction || null,
        }),
      })
      if (!res.ok) {
        const details = await res.text()
        throw new Error(details || 'Submission failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <main className="mx-auto max-w-6xl">
        <WorkflowNav />
        <h1 className="text-3xl font-bold text-foreground">Contributors</h1>
        <p className="mt-2 text-sm text-muted-foreground">Register people and create recording, read-out, or spontaneous image submissions.</p>

        {error && <p className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading...</p>}

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold">Sign Up Contributor</h2>
            <form className="mt-4 grid gap-3" onSubmit={submitRegistration}>
              <input
                className="rounded-md border border-border px-3 py-2"
                value={registerForm.handle}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, handle: e.target.value }))}
                placeholder="Unique handle"
                required
              />
              <input
                className="rounded-md border border-border px-3 py-2"
                value={registerForm.display_name}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, display_name: e.target.value }))}
                placeholder="Display name"
                required
              />
              <input
                className="rounded-md border border-border px-3 py-2"
                value={registerForm.preferred_language}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, preferred_language: e.target.value }))}
                placeholder="Preferred language"
                required
              />
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">Register</button>
            </form>
          </article>

          <article className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold">New Submission</h2>
            <form className="mt-4 grid gap-3" onSubmit={submitSubmission}>
              <select
                className="rounded-md border border-border px-3 py-2"
                value={submissionForm.contributor_id}
                onChange={(e) => setSubmissionForm((prev) => ({ ...prev, contributor_id: e.target.value }))}
                required
              >
                <option value="">Select contributor</option>
                {users.map((user) => (
                  <option key={user.id} value={user.handle}>{user.handle} | {user.display_name}</option>
                ))}
              </select>

              <input
                className="rounded-md border border-border px-3 py-2"
                value={submissionForm.language_code}
                onChange={(e) => setSubmissionForm((prev) => ({ ...prev, language_code: e.target.value }))}
                placeholder="Language code"
              />

              <select
                className="rounded-md border border-border px-3 py-2"
                value={submissionForm.mode}
                onChange={(e) => setSubmissionForm((prev) => ({ ...prev, mode: e.target.value as SubmissionMode }))}
              >
                <option value="recording">Recording</option>
                <option value="read_out">Read Out</option>
                <option value="spontaneous_image">Spontaneous Image</option>
                <option value="prompted">Prompted</option>
              </select>

              {(submissionForm.mode === 'recording' || submissionForm.mode === 'read_out') && (
                <input
                  className="rounded-md border border-border px-3 py-2"
                  value={submissionForm.target_word}
                  onChange={(e) => setSubmissionForm((prev) => ({ ...prev, target_word: e.target.value }))}
                  placeholder="Target word"
                />
              )}

              {submissionForm.mode === 'read_out' && (
                <textarea
                  className="rounded-md border border-border px-3 py-2"
                  rows={2}
                  value={submissionForm.read_prompt}
                  onChange={(e) => setSubmissionForm((prev) => ({ ...prev, read_prompt: e.target.value }))}
                  placeholder="Read-out prompt"
                />
              )}

              {submissionForm.mode === 'spontaneous_image' && (
                <>
                  <input
                    className="rounded-md border border-border px-3 py-2"
                    value={submissionForm.image_prompt_url}
                    onChange={(e) => setSubmissionForm((prev) => ({ ...prev, image_prompt_url: e.target.value }))}
                    placeholder="Image URL"
                  />
                  <textarea
                    className="rounded-md border border-border px-3 py-2"
                    rows={2}
                    value={submissionForm.spontaneous_instruction}
                    onChange={(e) => setSubmissionForm((prev) => ({ ...prev, spontaneous_instruction: e.target.value }))}
                    placeholder="Instruction"
                  />
                </>
              )}

              <button className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background">Create Submission</button>
            </form>
          </article>
        </section>
      </main>
    </div>
  )
}
