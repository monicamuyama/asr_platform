'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Pause, Mic, RotateCcw } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

type RiddleLinkedRecorderProps = {
  draftKey: string
  disabled?: boolean
  promptText?: string | null
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

export function RiddleLinkedRecorder({ draftKey, disabled = false, promptText, onSubmitPair }: RiddleLinkedRecorderProps) {
  const { strings } = useLanguage()
  const copy = strings.riddleRecorder
  const [isRecording, setIsRecording] = useState(false)
  const [activePart, setActivePart] = useState<RecordingPart>('challenge')
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [challengeAudioDataUrl, setChallengeAudioDataUrl] = useState<string | null>(null)
  const [revealAudioDataUrl, setRevealAudioDataUrl] = useState<string | null>(null)
  const [challengeAudioUrl, setChallengeAudioUrl] = useState<string | null>(null)
  const [revealAudioUrl, setRevealAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [submitState, setSubmitState] = useState<'idle' | 'submitting'>('idle')
  const linkedPrompt = promptText?.trim() || ''

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
      return copy.statusBoth
    }
    if (challengeAudioDataUrl) {
      return copy.statusChallengeDone
    }
    return copy.statusStart
  }, [challengeAudioDataUrl, revealAudioDataUrl, copy.statusBoth, copy.statusChallengeDone, copy.statusStart])

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
      setError(copy.errorNoMicSupport)
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
            setError(copy.errorReadAudio)
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
      setError(err instanceof Error ? err.message : copy.errorMicAccess)
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
      setError(copy.errorMissingClips)
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
      setError(err instanceof Error ? err.message : copy.errorSubmit)
    } finally {
      setSubmitState('idle')
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">{copy.title}</p>
        <p className="text-xs text-muted-foreground">
          {copy.intro}
        </p>
      </div>
      {linkedPrompt ? (
        <div className="rounded-lg border border-border bg-background/80 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{copy.promptLabel}</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-xl font-medium leading-relaxed text-foreground">{linkedPrompt}</p>
        </div>
      ) : null}
        <p className="text-sm text-muted-foreground">{statusText}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{copy.currentStep} {activePart === 'challenge' ? copy.challenge : copy.reveal}</span>
          <span>{recordingDuration}s</span>
        </div>

        <div className="space-y-2">
          <Label>{copy.challengeClip}</Label>
          {challengeAudioUrl ? <audio controls className="w-full" src={challengeAudioUrl} /> : <p className="text-xs text-muted-foreground">{copy.notRecorded}</p>}
          <Button
            type="button"
            onClick={isRecording ? stopRecording : () => startRecording('challenge')}
            disabled={disabled || (isRecording && activePart !== 'challenge')}
            className={`w-full ${isRecording && activePart === 'challenge' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`}
          >
            {isRecording && activePart === 'challenge' ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                {copy.stopChallenge}
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                {copy.recordChallenge}
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <Label>{copy.revealClip}</Label>
          {revealAudioUrl ? <audio controls className="w-full" src={revealAudioUrl} /> : <p className="text-xs text-muted-foreground">{copy.notRecorded}</p>}
          <Button
            type="button"
            onClick={isRecording ? stopRecording : () => startRecording('reveal')}
            disabled={disabled || !challengeAudioDataUrl || (isRecording && activePart !== 'reveal')}
            className={`w-full ${isRecording && activePart === 'reveal' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`}
          >
            {isRecording && activePart === 'reveal' ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                {copy.stopReveal}
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                {copy.recordReveal}
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
            {copy.resetPair}
          </Button>
          <Button
            type="button"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={disabled || submitState === 'submitting' || !challengeAudioDataUrl || !revealAudioDataUrl}
            onClick={submitPair}
          >
            {submitState === 'submitting' ? copy.submittingPair : copy.submitLinkedPair}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">{copy.draftSaved}</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
