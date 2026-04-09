'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Pause, Mic, RotateCcw } from 'lucide-react'

type RiddleLinkedRecorderProps = {
  draftKey: string
  disabled?: boolean
  onSubmitPair: (payload: {
    challengeAudioDataUrl: string
    revealAudioDataUrl: string
  }) => Promise<void>
}

type RecordingPart = 'challenge' | 'reveal'

type DraftPayload = {
  challengeAudioDataUrl: string | null
  revealAudioDataUrl: string | null
}

function parseDraft(raw: string | null): DraftPayload | null {
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw) as DraftPayload
    return {
      challengeAudioDataUrl: parsed.challengeAudioDataUrl ?? null,
      revealAudioDataUrl: parsed.revealAudioDataUrl ?? null,
    }
  } catch {
    return null
  }
}

export function RiddleLinkedRecorder({ draftKey, disabled = false, onSubmitPair }: RiddleLinkedRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [activePart, setActivePart] = useState<RecordingPart>('challenge')
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [challengeAudioDataUrl, setChallengeAudioDataUrl] = useState<string | null>(null)
  const [revealAudioDataUrl, setRevealAudioDataUrl] = useState<string | null>(null)
  const [challengeAudioUrl, setChallengeAudioUrl] = useState<string | null>(null)
  const [revealAudioUrl, setRevealAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [submitState, setSubmitState] = useState<'idle' | 'submitting'>('idle')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordingTimerRef = useRef<number | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    const draft = parseDraft(window.localStorage.getItem(draftKey))
    if (draft?.challengeAudioDataUrl) {
      setChallengeAudioDataUrl(draft.challengeAudioDataUrl)
      setChallengeAudioUrl(draft.challengeAudioDataUrl)
      setActivePart(draft.revealAudioDataUrl ? 'reveal' : 'reveal')
    }
    if (draft?.revealAudioDataUrl) {
      setRevealAudioDataUrl(draft.revealAudioDataUrl)
      setRevealAudioUrl(draft.revealAudioDataUrl)
      setActivePart('reveal')
    }
  }, [draftKey])

  useEffect(() => {
    const payload: DraftPayload = {
      challengeAudioDataUrl,
      revealAudioDataUrl,
    }
    window.localStorage.setItem(draftKey, JSON.stringify(payload))
  }, [challengeAudioDataUrl, revealAudioDataUrl, draftKey])

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current)
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      if (challengeAudioUrl && challengeAudioUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(challengeAudioUrl)
      }
      if (revealAudioUrl && revealAudioUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(revealAudioUrl)
      }
    }
  }, [challengeAudioUrl, revealAudioUrl])

  const statusText = useMemo(() => {
    if (challengeAudioDataUrl && revealAudioDataUrl) {
      return 'Both clips captured. Submit linked riddle pair.'
    }
    if (challengeAudioDataUrl) {
      return 'Challenge captured. Record reveal answer next.'
    }
    return 'Record challenge question first.'
  }, [challengeAudioDataUrl, revealAudioDataUrl])

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
    mediaRecorderRef.current = null
    setIsRecording(false)
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
  }

  const startRecording = async (part: RecordingPart) => {
    setError('')

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Your browser does not support microphone recording.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      chunksRef.current = chunks

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
        const objectUrl = window.URL.createObjectURL(blob)

        const reader = new FileReader()
        reader.onloadend = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : null
          if (!dataUrl) {
            setError('Could not read the recorded audio data.')
            return
          }

          if (part === 'challenge') {
            setChallengeAudioDataUrl(dataUrl)
            setChallengeAudioUrl(objectUrl)
            setRevealAudioDataUrl(null)
            setRevealAudioUrl(null)
            setActivePart('reveal')
          } else {
            setRevealAudioDataUrl(dataUrl)
            setRevealAudioUrl(objectUrl)
          }
        }
        reader.readAsDataURL(blob)
      }

      mediaRecorderRef.current = recorder
      mediaStreamRef.current = stream
      setActivePart(part)
      setRecordingDuration(0)
      setIsRecording(true)

      recorder.start()
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration((current) => current + 1)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to access the microphone.')
    }
  }

  const resetPair = () => {
    setChallengeAudioDataUrl(null)
    setRevealAudioDataUrl(null)
    setChallengeAudioUrl(null)
    setRevealAudioUrl(null)
    setActivePart('challenge')
    setError('')
    window.localStorage.removeItem(draftKey)
  }

  const submitPair = async () => {
    if (!challengeAudioDataUrl || !revealAudioDataUrl) {
      setError('Capture both challenge and reveal audio before submitting.')
      return
    }

    setSubmitState('submitting')
    setError('')

    try {
      await onSubmitPair({
        challengeAudioDataUrl,
        revealAudioDataUrl,
      })
      window.localStorage.removeItem(draftKey)
      resetPair()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit linked riddle pair.')
    } finally {
      setSubmitState('idle')
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Linked Riddle Recorder</p>
        <p className="text-xs text-muted-foreground">
          Record two clips in sequence: Challenge question first, then Reveal answer.
        </p>
      </div>
        <p className="text-sm text-muted-foreground">{statusText}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Current step: {activePart === 'challenge' ? 'Challenge' : 'Reveal'}</span>
          <span>{recordingDuration}s</span>
        </div>

        <div className="space-y-2">
          <Label>Challenge Clip</Label>
          {challengeAudioUrl ? <audio controls className="w-full" src={challengeAudioUrl} /> : <p className="text-xs text-muted-foreground">Not recorded yet.</p>}
          <Button
            type="button"
            onClick={isRecording ? stopRecording : () => startRecording('challenge')}
            disabled={disabled || (isRecording && activePart !== 'challenge')}
            className={`w-full ${isRecording && activePart === 'challenge' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`}
          >
            {isRecording && activePart === 'challenge' ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Stop Challenge
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Record Challenge
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Reveal Clip</Label>
          {revealAudioUrl ? <audio controls className="w-full" src={revealAudioUrl} /> : <p className="text-xs text-muted-foreground">Not recorded yet.</p>}
          <Button
            type="button"
            onClick={isRecording ? stopRecording : () => startRecording('reveal')}
            disabled={disabled || !challengeAudioDataUrl || (isRecording && activePart !== 'reveal')}
            className={`w-full ${isRecording && activePart === 'reveal' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`}
          >
            {isRecording && activePart === 'reveal' ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Stop Reveal
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Record Reveal
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="w-full border-border"
            disabled={disabled || submitState === 'submitting'}
            onClick={resetPair}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Pair
          </Button>
          <Button
            type="button"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={disabled || submitState === 'submitting' || !challengeAudioDataUrl || !revealAudioDataUrl}
            onClick={submitPair}
          >
            {submitState === 'submitting' ? 'Submitting Pair...' : 'Submit Linked Pair'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">Drafts are saved locally on this device until you submit.</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
