'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  createTranscriptionValidation,
  getPromptBank,
  getTranscriptionQueue,
  graduateTranscriptionTask,
  type PromptBankEntry,
  type TranscriptionQueueItem,
  type TranscriptionTaskResponse,
  upsertTranscriptionTask,
} from '@/lib/api'
import { clearSession, getSessionUserId } from '@/lib/auth'

export default function TranscriptionPage() {
  const router = useRouter()
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [queue, setQueue] = useState<TranscriptionQueueItem[]>([])
  const [promptBank, setPromptBank] = useState<PromptBankEntry[]>([])
  const [selectedRecordingId, setSelectedRecordingId] = useState('')
  const [currentTask, setCurrentTask] = useState<TranscriptionTaskResponse | null>(null)
  const [transcriptionText, setTranscriptionText] = useState('')
  const [confidenceScore, setConfidenceScore] = useState(0.9)
  const [rating, setRating] = useState(4)
  const [isCorrect, setIsCorrect] = useState(true)
  const [suggestedCorrection, setSuggestedCorrection] = useState('')
  const [deepMeaning, setDeepMeaning] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedItem = useMemo(
    () => queue.find((item) => item.recording_id === selectedRecordingId) ?? queue[0] ?? null,
    [queue, selectedRecordingId],
  )

  const loadData = async () => {
    try {
      const [queueData, promptData] = await Promise.all([getTranscriptionQueue(), getPromptBank()])
      setQueue(queueData)
      setPromptBank(promptData)
      setSelectedRecordingId((current) => current || queueData[0]?.recording_id || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transcription data.')
    }
  }

  useEffect(() => {
    const userId = getSessionUserId()
    if (!userId) {
      clearSession()
      router.replace('/signin')
      return
    }
    setSessionUserId(userId)
    void loadData()
  }, [router])

  const saveTranscription = async () => {
    if (!sessionUserId || !selectedItem) {
      return
    }
    if (!transcriptionText.trim()) {
      setError('Transcription text is required.')
      return
    }

    setError('')
    setMessage('')
    try {
      const task = await upsertTranscriptionTask({
        recording_id: selectedItem.recording_id,
        transcriber_id: sessionUserId,
        transcribed_text: transcriptionText.trim(),
        confidence_score: confidenceScore,
      })
      setCurrentTask(task)
      setMessage('Transcription saved. Continue with peer review.')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transcription.')
    }
  }

  const savePeerReview = async () => {
    if (!sessionUserId || !currentTask) {
      setError('Create or update a transcription before peer review.')
      return
    }

    setError('')
    setMessage('')
    try {
      await createTranscriptionValidation(currentTask.id, {
        transcription_id: currentTask.id,
        validator_id: sessionUserId,
        rating,
        is_correct: isCorrect,
        suggested_correction: suggestedCorrection || null,
        deep_cultural_meaning: deepMeaning || null,
      })
      setMessage('Peer review saved.')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save peer review.')
    }
  }

  const graduateTask = async () => {
    if (!sessionUserId || !currentTask) {
      setError('Create or update a transcription before graduation.')
      return
    }

    setError('')
    setMessage('')
    try {
      await graduateTranscriptionTask(currentTask.id, sessionUserId)
      setMessage('Transcription graduated to prompt bank.')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to graduate transcription.')
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transcription Task Dashboard</h1>
            <p className="text-sm text-muted-foreground">Queue, transcribe, peer review, and graduate prompts.</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="border-border">Back to Dashboard</Button>
          </Link>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Task Queue</CardTitle>
            <CardDescription>Select a recording from pending transcription tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedItem?.recording_id ?? ''} onValueChange={setSelectedRecordingId}>
              <SelectTrigger className="border-border">
                <SelectValue placeholder="Select a recording" />
              </SelectTrigger>
              <SelectContent>
                {queue.map((item) => (
                  <SelectItem key={item.recording_id} value={item.recording_id}>
                    {item.recording_id.slice(0, 8)} · {item.status} · {item.transcript_count} transcript(s)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedItem?.audio_url ? <audio controls className="w-full" src={selectedItem.audio_url} /> : <p className="text-sm text-muted-foreground">No audio selected.</p>}
            {selectedItem?.prompt_text && <p className="text-sm text-foreground">Prompt: {selectedItem.prompt_text}</p>}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Transcribe and Review</CardTitle>
            <CardDescription>Capture text, confidence, peer review, and cultural context.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transcript">Transcription</Label>
              <Textarea id="transcript" rows={4} className="border-border resize-none" value={transcriptionText} onChange={(event) => setTranscriptionText(event.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="confidence">Confidence (0-1)</Label>
                <Input id="confidence" type="number" min="0" max="1" step="0.05" value={confidenceScore} onChange={(event) => setConfidenceScore(Number(event.target.value))} className="border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Peer Rating (1-5)</Label>
                <Input id="rating" type="number" min="1" max="5" value={rating} onChange={(event) => setRating(Number(event.target.value))} className="border-border" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Is Correct</Label>
              <Select value={isCorrect ? 'true' : 'false'} onValueChange={(value) => setIsCorrect(value === 'true')}>
                <SelectTrigger className="border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="suggested">Suggested Correction</Label>
              <Textarea id="suggested" rows={2} className="border-border resize-none" value={suggestedCorrection} onChange={(event) => setSuggestedCorrection(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meaning">Deep Cultural Meaning</Label>
              <Textarea id="meaning" rows={3} className="border-border resize-none" value={deepMeaning} onChange={(event) => setDeepMeaning(event.target.value)} />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Button type="button" onClick={saveTranscription} className="bg-primary hover:bg-primary/90">Save Transcription</Button>
              <Button type="button" variant="outline" className="border-border" onClick={savePeerReview}>Save Peer Review</Button>
              <Button type="button" onClick={graduateTask} className="bg-primary hover:bg-primary/90">Graduate to Prompt Bank</Button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-foreground">{message}</p>}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Prompt Bank</CardTitle>
            <CardDescription>Verified entries ready for prompted recording.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">{promptBank.length} verified prompt(s) available.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
