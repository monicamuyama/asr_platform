'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mic, Headphones, FileText, Trophy, Play, Pause, Volume2, Star, LogOut, Settings, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { RiddleLinkedRecorder } from '@/components/riddle-linked-recorder'
import { flushQueuedSubmissions, listQueuedSubmissions, queueSubmission } from '@/lib/offline-submission-queue'
import {
  createCommunityRating,
  createSubmission,
  createTranscriptionValidation,
  graduateTranscriptionTask,
  getCommunityQueue,
  getConsentDocuments,
  getLanguages,
  getRatingsByUser,
  getPromptBank,
  getTranscriptionQueue,
  getSubmissions,
  getUserById,
  getUserLanguagePreferencesById,
  getUserProfileById,
  getUserWalletById,
  type CommunityQueueItem,
  type ConsentDocument,
  type Language,
  type RatingHistoryItem,
  type PromptBankEntry,
  type TranscriptionQueueItem,
  type TranscriptionTaskResponse,
  type TranscriptionValidationResponse,
  upsertTranscriptionTask,
  type SubmissionCreateRequest,
  type SubmissionResponse,
  type UserLanguagePreferenceResponse,
  type UserProfileResponse,
  type UserResponse,
  type WalletResponse,
} from '@/lib/api'
import { clearSession, getSessionUserId } from '@/lib/auth'

export default function CorpusWeaveDashboard() {
  const router = useRouter()
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [recordingError, setRecordingError] = useState('')
  const [submissionMessage, setSubmissionMessage] = useState('')
  const [validationMessage, setValidationMessage] = useState('')
  const [user, setUser] = useState<UserResponse | null>(null)
  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [languagePreferences, setLanguagePreferences] = useState<UserLanguagePreferenceResponse[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [consents, setConsents] = useState<ConsentDocument[]>([])
  const [communityQueue, setCommunityQueue] = useState<CommunityQueueItem[]>([])
  const [transcriptionQueue, setTranscriptionQueue] = useState<TranscriptionQueueItem[]>([])
  const [promptBank, setPromptBank] = useState<PromptBankEntry[]>([])
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([])
  const [ratingHistory, setRatingHistory] = useState<RatingHistoryItem[]>([])
  const [targetLanguageId, setTargetLanguageId] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'proverb' | 'idiom' | 'common_saying' | 'riddle' | 'photo_description'>('proverb')
  const [selectedQueueSubmissionId, setSelectedQueueSubmissionId] = useState('')
  const [selectedTranscriptionRecordingId, setSelectedTranscriptionRecordingId] = useState('')
  const [selectedTranscriptionTaskId, setSelectedTranscriptionTaskId] = useState('')
  const [selectedRating, setSelectedRating] = useState(3)
  const [validationScores, setValidationScores] = useState({
    intelligibility: 3,
    recordingQuality: 3,
    compliance: 3,
  })
  const [transcriptionText, setTranscriptionText] = useState('')
  const [transcriptionConfidence, setTranscriptionConfidence] = useState(0.9)
  const [peerValidationRating, setPeerValidationRating] = useState(4)
  const [peerValidationCorrect, setPeerValidationCorrect] = useState(true)
  const [peerValidationCorrection, setPeerValidationCorrection] = useState('')
  const [deepCulturalMeaning, setDeepCulturalMeaning] = useState('')
  const [transcriptionMessage, setTranscriptionMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isSubmittingRecording, setIsSubmittingRecording] = useState(false)
  const [isRetryingUploads, setIsRetryingUploads] = useState(false)
  const [queuedUploadCount, setQueuedUploadCount] = useState(0)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [recordedAudioDataUrl, setRecordedAudioDataUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<number | null>(null)

  const refreshCommunityQueue = async (preferredSubmissionId?: string) => {
    try {
      const queueData = await getCommunityQueue()
      setCommunityQueue(queueData)
      setSelectedQueueSubmissionId((current) => {
        const validationCandidates = queueData.filter((item) => item.contributor_id !== sessionUserId)

        if (preferredSubmissionId && validationCandidates.some((item) => item.id === preferredSubmissionId)) {
          return preferredSubmissionId
        }
        if (current && validationCandidates.some((item) => item.id === current)) {
          return current
        }
        return validationCandidates[0]?.id || ''
      })
    } catch {
      setCommunityQueue([])
      setSelectedQueueSubmissionId('')
    }
  }

  const refreshSubmissions = async () => {
    try {
      const data = await getSubmissions()
      setSubmissions(data)
    } catch {
      setSubmissions([])
    }
  }

  const refreshTranscriptionQueue = async () => {
    try {
      const data = await getTranscriptionQueue()
      setTranscriptionQueue(data)
      setSelectedTranscriptionRecordingId((current) => current || data[0]?.recording_id || data[0]?.id || '')
      setSelectedTranscriptionTaskId((current) => current || '')
    } catch {
      setTranscriptionQueue([])
      setSelectedTranscriptionRecordingId('')
      setSelectedTranscriptionTaskId('')
    }
  }

  const refreshPromptBank = async () => {
    try {
      const data = await getPromptBank()
      setPromptBank(data)
    } catch {
      setPromptBank([])
    }
  }

  const refreshWallet = async (userId: string) => {
    try {
      const data = await getUserWalletById(userId)
      setWallet(data)
    } catch {
      setWallet(null)
    }
  }

  const refreshRatingHistory = async (userId: string) => {
    try {
      const data = await getRatingsByUser(userId)
      setRatingHistory(data)
    } catch {
      setRatingHistory([])
    }
  }

  useEffect(() => {
    const userId = getSessionUserId()
    if (!userId) {
      setIsLoading(false)
      router.replace('/signin')
      return
    }
    setSessionUserId(userId)

    const loadDashboardData = async () => {
      setIsLoading(true)
      setError('')

      const loadingGuard = window.setTimeout(() => {
        setError('Dashboard is taking too long to load. Please confirm the API server is running, then refresh.')
        setIsLoading(false)
      }, 10000)

      try {
        const [userData, profileData, walletData, languagePrefData, languageData, consentData] = await Promise.all([
          getUserById(userId),
          getUserProfileById(userId),
          getUserWalletById(userId),
          getUserLanguagePreferencesById(userId),
          getLanguages(),
          getConsentDocuments(),
        ])
        if (!userData.onboarding_completed) {
          router.replace('/onboarding')
          return
        }
        setUser(userData)
        setProfile(profileData)
        setWallet(walletData)
        setLanguagePreferences(languagePrefData)
        setLanguages(languageData)
        setConsents(consentData)

        const initialTargetLanguageId =
          languageData.find((language) => language.language_name === profileData.primary_language)?.id
          ?? languageData.find((language) => language.id === languagePrefData.find((preference) => preference.is_primary_language)?.language_id)?.id
          ?? languageData[0]?.id
          ?? ''
        setTargetLanguageId((current) => current || initialTargetLanguageId)

        await Promise.all([
          refreshCommunityQueue(),
          refreshTranscriptionQueue(),
          refreshPromptBank(),
          refreshSubmissions(),
          refreshRatingHistory(userId),
          refreshWallet(userId),
        ])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load your dashboard from backend.'
        const shouldResetSession = /user not found|invalid|unauthorized|forbidden|401|403/i.test(message)
        if (shouldResetSession) {
          clearSession()
          router.replace('/signin')
          return
        }
        setError(message)
      } finally {
        window.clearTimeout(loadingGuard)
        setIsLoading(false)
      }
    }

    void loadDashboardData()
  }, [router])

  const refreshQueuedUploadCount = async () => {
    try {
      const queuedItems = await listQueuedSubmissions()
      setQueuedUploadCount(queuedItems.length)
    } catch {
      setQueuedUploadCount(0)
    }
  }

  const requestBackgroundSync = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }
    const registration = await navigator.serviceWorker.ready
    if ('sync' in registration) {
      await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } })
        .sync
        .register('submission-upload-sync')
    } else {
      registration.active?.postMessage({ type: 'REQUEST_UPLOAD_SYNC' })
    }
  }

  const retryQueuedUploads = async () => {
    if (!sessionUserId) {
      return
    }
    setIsRetryingUploads(true)
    setSubmissionMessage('')
    try {
      const result = await flushQueuedSubmissions()
      await refreshQueuedUploadCount()
      if (result.uploaded > 0) {
        setSubmissionMessage(`Retried uploads: ${result.uploaded} succeeded, ${result.failed} pending.`)
      } else if (result.failed > 0) {
        setRecordingError(`Retry attempted but ${result.failed} uploads are still pending.`)
      }
      await Promise.all([refreshCommunityQueue(), refreshSubmissions(), refreshRatingHistory(sessionUserId), refreshWallet(sessionUserId)])
    } catch (err) {
      setRecordingError(err instanceof Error ? err.message : 'Retry upload failed.')
    } finally {
      setIsRetryingUploads(false)
    }
  }

  useEffect(() => {
    void refreshQueuedUploadCount()

    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    navigator.serviceWorker
      .register('/upload-sync-sw.js')
      .catch(() => {
        // Service worker registration is best-effort for offline retries.
      })

    const handleOnline = () => {
      void retryQueuedUploads()
    }
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'UPLOAD_SYNC_REQUESTED') {
        void retryQueuedUploads()
      }
    }

    window.addEventListener('online', handleOnline)
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)

    return () => {
      window.removeEventListener('online', handleOnline)
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
    }
  }, [sessionUserId])

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current)
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      if (recordedAudioUrl) {
        window.URL.revokeObjectURL(recordedAudioUrl)
      }
    }
  }, [recordedAudioUrl])

  const userName = useMemo(() => {
    if (!user?.full_name) {
      return 'Contributor'
    }
    return user.full_name.split(' ')[0] ?? user.full_name
  }, [user])

  const userLanguage = profile?.primary_language ?? 'Not set'
  const recordPromptByCategory: Record<'proverb' | 'idiom' | 'common_saying' | 'riddle' | 'photo_description', string> = {
    proverb: 'The future is built by those who contribute today.',
    idiom: 'A river does not forget its source.',
    common_saying: 'Many hands make light work.',
    riddle: 'What has roots that nobody sees and grows taller than trees?',
    photo_description: 'Describe what you see in the assigned image with clear detail.',
  }
  const recordPrompt = recordPromptByCategory[selectedCategory]
  const activeConsentVersion = consents.find((document) => document.is_active)?.version ?? consents[0]?.version ?? 'v1.0'
  const primaryLanguagePreference =
    languagePreferences.find((preference) => preference.is_primary_language)
    ?? languagePreferences[0]
    ?? null
  const primaryLanguageInfo =
    languages.find((language) => language.id === primaryLanguagePreference?.language_id)
    ?? languages.find((language) => language.language_name === userLanguage)
    ?? null
  const selectedTargetLanguage =
    languages.find((language) => language.id === targetLanguageId)
    ?? primaryLanguageInfo
    ?? languages[0]
    ?? null
  const nativeLanguageCode = primaryLanguageInfo?.iso_code ?? selectedTargetLanguage?.iso_code ?? 'en'
  const ratedSubmissionIds = useMemo(
    () => new Set(ratingHistory.map((item) => item.submission_id)),
    [ratingHistory],
  )

  const validationQueue = useMemo(
    () => communityQueue.filter((item) => item.contributor_id !== sessionUserId && !ratedSubmissionIds.has(item.id)),
    [communityQueue, ratedSubmissionIds, sessionUserId],
  )
  const selectedValidationSubmission = validationQueue.find((item) => item.id === selectedQueueSubmissionId) ?? validationQueue[0] ?? null
  const selectedTranscriptionItem = transcriptionQueue.find((item) => item.recording_id === selectedTranscriptionRecordingId || item.id === selectedTranscriptionRecordingId) ?? transcriptionQueue[0] ?? null
  const speakerProfile = profile?.has_speech_impairment
    ? profile.impairment_type ?? 'speech_impairment'
    : 'healthy_speaker'
  const validationPrompt = selectedValidationSubmission
    ? selectedValidationSubmission.read_prompt
      ?? selectedValidationSubmission.target_word
      ?? selectedValidationSubmission.spontaneous_instruction
      ?? 'No prompt provided for this submission.'
    : 'No queue items available'

  const userStats = useMemo(
    () => [
      { label: 'Recordings', value: String(submissions.filter((item) => item.contributor_id === sessionUserId).length), icon: Mic },
      { label: 'Validations', value: String(ratingHistory.length), icon: Headphones },
      { label: 'Transcriptions', value: '-', icon: FileText },
      { label: 'Points Earned', value: wallet ? wallet.balance.toFixed(2) : '0.00', icon: Trophy },
    ],
    [ratingHistory.length, sessionUserId, submissions, wallet],
  )

  const activeTasks = useMemo(() => {
    return validationQueue
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        submissionId: item.id,
        type: 'validate',
        title: item.target_word ?? item.read_prompt ?? 'Validate community recording',
        language: item.language_code,
        reward: `${Math.max(5, 15 - item.ratings_count)} pts`,
      }))
  }, [validationQueue])

  const recentActivity = useMemo(() => {
    const mySubmissions = submissions
      .filter((item) => item.contributor_id === sessionUserId)
      .map((item) => ({
        dateValue: new Date(item.created_at),
        date: new Date(item.created_at).toLocaleDateString(),
        action: `Submitted ${item.mode} (${item.language_code})`,
        reward: item.status,
      }))

    const myRatings = ratingHistory.map((item) => ({
      dateValue: new Date(item.created_at),
      date: new Date(item.created_at).toLocaleDateString(),
      action: `Validated ${item.mode} (${item.language_code})`,
      reward: item.submission_status,
    }))

    return [...mySubmissions, ...myRatings]
      .sort((a, b) => b.dateValue.getTime() - a.dateValue.getTime())
      .slice(0, 8)
      .map(({ date, action, reward }) => ({ date, action, reward }))
  }, [ratingHistory, sessionUserId, submissions])

  const topContributors: Array<{ name: string; points: string; recordings: number; rating: number }> = []

  const handleSignOut = () => {
    clearSession()
    router.push('/signin')
  }

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

  const startRecording = async () => {
    setRecordingError('')
    setSubmissionMessage('')

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordingError('Your browser does not support microphone recording.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      recordedChunksRef.current = chunks

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
        const objectUrl = window.URL.createObjectURL(blob)
        setRecordedAudioUrl(objectUrl)

        const reader = new FileReader()
        reader.onloadend = () => {
          setRecordedAudioDataUrl(typeof reader.result === 'string' ? reader.result : null)
        }
        reader.readAsDataURL(blob)
      }

      mediaRecorderRef.current = recorder
      mediaStreamRef.current = stream
      setRecordedAudioUrl(null)
      setRecordedAudioDataUrl(null)
      setRecordingDuration(0)
      setIsRecording(true)

      recorder.start()
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration((current) => current + 1)
      }, 1000)
    } catch (err) {
      setRecordingError(err instanceof Error ? err.message : 'Unable to access the microphone.')
    }
  }

  const submitRecording = async () => {
    if (!sessionUserId) {
      clearSession()
      router.replace('/signin')
      return
    }

    if (!selectedTargetLanguage) {
      setRecordingError('Could not load a target language. Update your language in Settings and try again.')
      return
    }

    if (!recordedAudioDataUrl) {
      setRecordingError('Record audio before submitting.')
      return
    }

    setIsSubmittingRecording(true)
    setRecordingError('')
    setSubmissionMessage('')

    try {
      const payload: SubmissionCreateRequest = {
        contributor_id: sessionUserId,
        language_code: selectedTargetLanguage.iso_code,
        native_language_code: nativeLanguageCode,
        target_language_code: selectedTargetLanguage.iso_code,
        mode: selectedCategory === 'photo_description' ? 'spontaneous_image' : 'recording',
        category: selectedCategory,
        speaker_profile: speakerProfile,
        consent_version: activeConsentVersion,
        hometown: null,
        residence: profile?.country ?? null,
        tribe_ethnicity: null,
        gender: null,
        age_group: null,
        pair_group_id: selectedCategory === 'riddle' ? crypto.randomUUID() : null,
        riddle_part: selectedCategory === 'riddle' ? 'challenge' : null,
        challenge_submission_id: null,
        reveal_submission_id: null,
        audio_url: recordedAudioDataUrl,
        target_word: recordPrompt,
        read_prompt: selectedCategory === 'photo_description' ? null : recordPrompt,
        image_prompt_url: selectedCategory === 'photo_description' ? 'local-photo-assignment' : null,
        spontaneous_instruction:
          selectedCategory === 'photo_description'
            ? 'Describe the assigned image naturally in your own words.'
            : null,
      }

      const submission = await createSubmission(payload)

      setSubmissionMessage(`Recording submitted as ${submission.id}`)
      await Promise.all([refreshCommunityQueue(submission.id), refreshSubmissions(), refreshRatingHistory(sessionUserId), refreshWallet(sessionUserId)])
      stopRecording()
      setRecordedAudioUrl(null)
      setRecordedAudioDataUrl(null)
      setRecordingDuration(0)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit recording.'
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        try {
          await queueSubmission({
            contributor_id: sessionUserId,
            language_code: selectedTargetLanguage.iso_code,
            native_language_code: nativeLanguageCode,
            target_language_code: selectedTargetLanguage.iso_code,
            mode: selectedCategory === 'photo_description' ? 'spontaneous_image' : 'recording',
            category: selectedCategory,
            speaker_profile: speakerProfile,
            consent_version: activeConsentVersion,
            hometown: null,
            residence: profile?.country ?? null,
            tribe_ethnicity: null,
            gender: null,
            age_group: null,
            pair_group_id: selectedCategory === 'riddle' ? crypto.randomUUID() : null,
            riddle_part: selectedCategory === 'riddle' ? 'challenge' : null,
            challenge_submission_id: null,
            reveal_submission_id: null,
            audio_url: recordedAudioDataUrl,
            target_word: recordPrompt,
            read_prompt: selectedCategory === 'photo_description' ? null : recordPrompt,
            image_prompt_url: selectedCategory === 'photo_description' ? 'local-photo-assignment' : null,
            spontaneous_instruction:
              selectedCategory === 'photo_description'
                ? 'Describe the assigned image naturally in your own words.'
                : null,
          })
          await refreshQueuedUploadCount()
          await requestBackgroundSync()
          setSubmissionMessage('No connection. Recording saved locally and queued for retry upload.')
          stopRecording()
          setRecordedAudioUrl(null)
          setRecordedAudioDataUrl(null)
          setRecordingDuration(0)
        } catch (queueErr) {
          setRecordingError(queueErr instanceof Error ? queueErr.message : 'Could not queue recording for retry.')
        }
      } else if (/404/i.test(message) || /not found/i.test(message)) {
        setRecordingError('Submission endpoint is unavailable (404). Ensure backend routes include /submissions and the API server is restarted.')
      } else if (/already submitted a recording for this sentence/i.test(message)) {
        setRecordingError('You already submitted this sentence. Please record a different prompt.')
      } else {
        setRecordingError(message)
      }
    } finally {
      setIsSubmittingRecording(false)
    }
  }

  const submitLinkedRiddlePair = async (payload: { challengeAudioDataUrl: string; revealAudioDataUrl: string }) => {
    if (!sessionUserId) {
      clearSession()
      router.replace('/signin')
      return
    }

    if (!selectedTargetLanguage) {
      throw new Error('Could not load a target language. Update your language in Settings and try again.')
    }

    const pairGroupId = crypto.randomUUID()
    const challengePayload: SubmissionCreateRequest = {
      contributor_id: sessionUserId,
      language_code: selectedTargetLanguage.iso_code,
      native_language_code: nativeLanguageCode,
      target_language_code: selectedTargetLanguage.iso_code,
      mode: 'recording',
      category: 'riddle',
      speaker_profile: speakerProfile,
      consent_version: activeConsentVersion,
      hometown: null,
      residence: profile?.country ?? null,
      tribe_ethnicity: null,
      gender: null,
      age_group: null,
      pair_group_id: pairGroupId,
      riddle_part: 'challenge',
      challenge_submission_id: null,
      reveal_submission_id: null,
      audio_url: payload.challengeAudioDataUrl,
      target_word: recordPrompt,
      read_prompt: recordPrompt,
    }

    const revealPayloadBase: SubmissionCreateRequest = {
      contributor_id: sessionUserId,
      language_code: selectedTargetLanguage.iso_code,
      native_language_code: nativeLanguageCode,
      target_language_code: selectedTargetLanguage.iso_code,
      mode: 'recording',
      category: 'riddle',
      speaker_profile: speakerProfile,
      consent_version: activeConsentVersion,
      hometown: null,
      residence: profile?.country ?? null,
      tribe_ethnicity: null,
      gender: null,
      age_group: null,
      pair_group_id: pairGroupId,
      riddle_part: 'reveal' as const,
      reveal_submission_id: null,
      audio_url: payload.revealAudioDataUrl,
      target_word: recordPrompt,
      read_prompt: recordPrompt,
    }

    try {
      const challengeSubmission = await createSubmission(challengePayload)

      await createSubmission({
        ...revealPayloadBase,
        challenge_submission_id: challengeSubmission.id,
      })

      setSubmissionMessage(`Linked riddle pair submitted under group ${pairGroupId.slice(0, 8)}.`)
      await Promise.all([
        refreshCommunityQueue(challengeSubmission.id),
        refreshSubmissions(),
        refreshRatingHistory(sessionUserId),
        refreshWallet(sessionUserId),
      ])
    } catch (err) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await queueSubmission({
          ...challengePayload,
          cid: `${pairGroupId}-challenge`,
        })
        await queueSubmission({
          ...revealPayloadBase,
          cid: `${pairGroupId}-reveal`,
          challenge_submission_id: null,
        })
        await refreshQueuedUploadCount()
        await requestBackgroundSync()
        setSubmissionMessage('No connection. Riddle pair saved locally and queued for retry upload.')
      } else {
        throw err
      }
    }
  }

  const submitValidation = async () => {
    if (!sessionUserId) {
      clearSession()
      router.replace('/signin')
      return
    }

    if (!selectedValidationSubmission) {
      setValidationMessage('Load a community submission first.')
      return
    }

    setValidationMessage('')

    try {
      const result = await createCommunityRating(selectedValidationSubmission.id, {
        submission_id: selectedValidationSubmission.id,
        rater_id: sessionUserId,
        intelligibility: validationScores.intelligibility,
        recording_quality: validationScores.recordingQuality,
        elicitation_compliance: validationScores.compliance,
      })

      setValidationMessage(`Saved rating. Submission is now ${result.status}.`)
      await Promise.all([refreshCommunityQueue(), refreshSubmissions(), refreshRatingHistory(sessionUserId), refreshWallet(sessionUserId)])
      setSelectedRating(validationScores.intelligibility)
    } catch (err) {
      setValidationMessage(err instanceof Error ? err.message : 'Failed to submit rating.')
    }
  }

  const submitTranscription = async () => {
    if (!sessionUserId) {
      clearSession()
      router.replace('/signin')
      return
    }

    if (!selectedTranscriptionItem) {
      setTranscriptionMessage('Choose a recording from the transcription queue.')
      return
    }

    if (!transcriptionText.trim()) {
      setTranscriptionMessage('Type a transcription before saving.')
      return
    }

    setTranscriptionMessage('')
    try {
      const task = await upsertTranscriptionTask({
        recording_id: selectedTranscriptionItem.recording_id,
        transcriber_id: sessionUserId,
        transcribed_text: transcriptionText.trim(),
        confidence_score: transcriptionConfidence,
      })
      setSelectedTranscriptionTaskId(task.id)
      setTranscriptionMessage('Transcription saved for peer review.')
      await Promise.all([refreshTranscriptionQueue(), refreshPromptBank(), refreshSubmissions()])
    } catch (err) {
      setTranscriptionMessage(err instanceof Error ? err.message : 'Failed to save transcription.')
    }
  }

  const submitPeerValidation = async () => {
    if (!sessionUserId) {
      clearSession()
      router.replace('/signin')
      return
    }

    if (!selectedTranscriptionTaskId) {
      setTranscriptionMessage('Save a transcription first so it can be reviewed.')
      return
    }

    try {
      await createTranscriptionValidation(selectedTranscriptionTaskId, {
        transcription_id: selectedTranscriptionTaskId,
        validator_id: sessionUserId,
        rating: peerValidationRating,
        is_correct: peerValidationCorrect,
        suggested_correction: peerValidationCorrection || null,
        comments: null,
        deep_cultural_meaning: deepCulturalMeaning || null,
      })
      setTranscriptionMessage('Peer review saved.')
      await Promise.all([refreshTranscriptionQueue(), refreshPromptBank(), refreshSubmissions()])
    } catch (err) {
      setTranscriptionMessage(err instanceof Error ? err.message : 'Failed to save peer review.')
    }
  }

  const graduateTranscription = async () => {
    if (!sessionUserId) {
      clearSession()
      router.replace('/signin')
      return
    }

    if (!selectedTranscriptionTaskId) {
      setTranscriptionMessage('Save a transcription before graduation.')
      return
    }

    try {
      await graduateTranscriptionTask(selectedTranscriptionTaskId, sessionUserId)
      setTranscriptionMessage('Verified transcription moved into the prompt bank.')
      await Promise.all([refreshTranscriptionQueue(), refreshPromptBank(), refreshSubmissions()])
    } catch (err) {
      setTranscriptionMessage(err instanceof Error ? err.message : 'Failed to graduate transcription.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <p className="text-foreground font-medium">Loading your dashboard...</p>
          <p className="text-sm text-muted-foreground">If this takes too long, check that the API is running on port 8000.</p>
          <Link href="/signin">
            <Button variant="outline" className="border-border">Go to Sign in</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-teal font-bold text-white">
                CW
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">CorpusWeave</h1>
                <p className="truncate text-xs text-muted-foreground">Community Speech Data Platform</p>
              </div>
            </div>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:gap-3">
              <div className="hidden lg:flex items-center gap-2 text-sm">
                <span className="text-foreground">Welcome, <strong>{userName}</strong></span>
                <Badge variant="outline" className="ml-2">{userLanguage}</Badge>
              </div>
              <Link href="/donate">
                <Button size="sm" variant="ghost">Support</Button>
              </Link>
              <Link href="/data-dictionary">
                <Button size="sm" variant="ghost" className="hidden md:inline-flex">Docs</Button>
              </Link>
              <Link href="/settings">
                <Button size="sm" variant="ghost" className="gap-1">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="sm" variant="ghost" className="gap-1" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="contribute">Contribute</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            <div className="rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-transparent to-accent-teal/10 p-6 sm:p-8">
              <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Build Inclusive Speech Data
              </h2>
              <p className="text-base text-muted-foreground sm:text-lg">
                Record, validate, and transcribe speech across multiple languages. Earn points while supporting language diversity.
              </p>
            </div>

            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              {userStats.map((stat, idx) => {
                const Icon = stat.icon
                return (
                  <Card key={idx} className="border-border hover:shadow-md transition">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                          <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                        </div>
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Your Active Tasks</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {activeTasks.length === 0 && (
                  <Card className="border-border md:col-span-3">
                    <CardContent className="p-6 text-sm text-muted-foreground">
                      No active tasks are available from the backend yet.
                    </CardContent>
                  </Card>
                )}
                {activeTasks.map(task => (
                  <Card key={task.id} className="border-border hover:shadow-md transition">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <Badge className="bg-primary/20 text-primary border-0">
                          {task.type === 'record' && <Mic className="h-3 w-3 mr-1" />}
                          {task.type === 'validate' && <Headphones className="h-3 w-3 mr-1" />}
                          {task.type === 'transcribe' && <FileText className="h-3 w-3 mr-1" />}
                          {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                        </Badge>
                        <span className="font-bold text-primary">{task.reward}</span>
                      </div>
                      <p className="font-medium text-foreground mb-2">{task.title}</p>
                      <p className="text-sm text-muted-foreground mb-4">{task.language}</p>
                      <Button
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => {
                          setActiveTab('contribute')
                          setSelectedQueueSubmissionId(task.submissionId)
                          setValidationMessage('')
                        }}
                      >
                        Start Task
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Recent Activity</h3>
              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {recentActivity.length === 0 && (
                      <p className="text-sm text-muted-foreground">No recent activity available yet.</p>
                    )}
                    {recentActivity.map((activity, idx) => (
                      <div key={idx} className="flex items-center justify-between pb-3 border-b border-border last:border-0">
                        <div>
                          <p className="font-medium text-foreground">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">{activity.date}</p>
                        </div>
                        <span className="font-semibold text-primary">{activity.reward}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contribute Tab */}
          <TabsContent value="contribute" className="space-y-8">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Choose Contribution Category</CardTitle>
                <CardDescription>
                  Select a category to route to the right recording flow. Riddles are captured as linked challenge/reveal pairs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  {[
                    { key: 'proverb', label: 'Proverb' },
                    { key: 'idiom', label: 'Idiom' },
                    { key: 'common_saying', label: 'Common Saying' },
                    { key: 'riddle', label: 'Riddle' },
                    { key: 'photo_description', label: 'Photo Description' },
                  ].map((item) => (
                    <Button
                      key={item.key}
                      type="button"
                      variant={selectedCategory === item.key ? 'default' : 'outline'}
                      className="h-auto py-3"
                      onClick={() => setSelectedCategory(item.key as 'proverb' | 'idiom' | 'common_saying' | 'riddle' | 'photo_description')}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{queuedUploadCount} queued upload{queuedUploadCount === 1 ? '' : 's'} pending sync</span>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border"
                    onClick={retryQueuedUploads}
                    disabled={isRetryingUploads || queuedUploadCount === 0}
                  >
                    {isRetryingUploads ? 'Retrying uploads...' : 'Retry Upload'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-border lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-primary" />
                    {selectedCategory === 'riddle' ? 'Record Riddle Challenge' : 'Record Audio'}
                  </CardTitle>
                  <CardDescription>Contribute voice data in your language</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedCategory === 'riddle' ? (
                    <RiddleLinkedRecorder
                      draftKey={sessionUserId ? `isdr_riddle_pair_draft_${sessionUserId}` : 'isdr_riddle_pair_draft'}
                      disabled={!selectedTargetLanguage}
                      onSubmitPair={submitLinkedRiddlePair}
                    />
                  ) : (
                    <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Target Language</Label>
                    <Select
                      value={targetLanguageId || undefined}
                      onValueChange={setTargetLanguageId}
                    >
                      <SelectTrigger className="border-border">
                        <SelectValue placeholder="Select a target language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((language) => (
                          <SelectItem key={language.id} value={language.id}>
                            {language.language_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-6 text-center space-y-4">
                    <p className="font-medium text-foreground">Sentence to record:</p>
                    <p className="text-lg text-foreground italic">
                      "{recordPrompt}"
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{selectedTargetLanguage?.language_name ?? primaryLanguageInfo?.language_name ?? userLanguage}</span>
                    <span>{recordingDuration}s</span>
                  </div>
                  <Button 
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-full ${isRecording ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`}
                  >
                    {isRecording ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Start Recording
                      </>
                    )}
                  </Button>
                  {recordedAudioUrl && (
                    <audio controls className="w-full" src={recordedAudioUrl} />
                  )}
                  {!isRecording && !recordedAudioUrl && (
                    <Button variant="outline" className="w-full border-border">
                      <Play className="h-4 w-4 mr-2" />
                      Playback
                    </Button>
                  )}
                  <Button
                    type="button"
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={submitRecording}
                    disabled={isSubmittingRecording || !recordedAudioDataUrl}
                  >
                    {isSubmittingRecording ? 'Submitting...' : 'Submit Recording'}
                  </Button>
                    </>
                  )}
                  {recordingError && <p className="text-sm text-red-600">{recordingError}</p>}
                  {submissionMessage && <p className="text-sm text-foreground">{submissionMessage}</p>}
                </CardContent>
              </Card>

              <Card className="border-border lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Headphones className="h-5 w-5 text-primary" />
                    Validate Audio
                  </CardTitle>
                  <CardDescription>Review and rate submissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Submission ID</Label>
                    <Select
                      value={validationQueue.some((item) => item.id === selectedQueueSubmissionId) ? selectedQueueSubmissionId : ''}
                      onValueChange={setSelectedQueueSubmissionId}
                    >
                      <SelectTrigger className="border-border">
                        <SelectValue placeholder="Select a submission" />
                      </SelectTrigger>
                      <SelectContent>
                        {validationQueue.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.language_code} · {item.mode} · {item.id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Validation prompt</p>
                        <p className="text-sm font-medium text-foreground">{validationPrompt}</p>
                      </div>
                      <Badge variant="outline" className="border-border text-xs">
                        {selectedValidationSubmission ? `${selectedValidationSubmission.status} · ${selectedValidationSubmission.ratings_count} ratings` : 'No queue items'}
                      </Badge>
                    </div>
                    {selectedValidationSubmission?.audio_url ? (
                      <audio controls className="w-full" src={selectedValidationSubmission.audio_url} />
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Volume2 className="h-4 w-4" />
                        {validationQueue.length === 0
                          ? 'No community submissions from other contributors are available right now.'
                          : 'No audio attached to this submission.'}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Quality Rating</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star}
                          type="button"
                          onClick={() => {
                            setSelectedRating(star)
                            setValidationScores({ intelligibility: star, recordingQuality: star, compliance: star })
                          }}
                          className={`text-3xl transition ${selectedRating >= star ? 'text-yellow-500' : 'text-muted-foreground'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" className="w-full border-border" type="button" onClick={submitValidation} disabled={!selectedValidationSubmission}>
                    Submit Rating
                  </Button>
                  {validationMessage && <p className="text-sm text-foreground">{validationMessage}</p>}
                </CardContent>
              </Card>

              <Card className="border-border lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Transcribe
                  </CardTitle>
                  <CardDescription>Write out what you hear</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href="/transcription">
                    <Button variant="outline" className="w-full border-border">Open Task Dashboard</Button>
                  </Link>
                  <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-center">
                    <Volume2 className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Recording Queue</Label>
                    <Select
                      value={selectedTranscriptionItem?.recording_id ?? ''}
                      onValueChange={setSelectedTranscriptionRecordingId}
                    >
                      <SelectTrigger className="border-border">
                        <SelectValue placeholder="Select a recording" />
                      </SelectTrigger>
                      <SelectContent>
                        {transcriptionQueue.map((item) => (
                          <SelectItem key={item.recording_id} value={item.recording_id}>
                            {item.language_id} · {item.speaker_type} · {item.recording_id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
                    {selectedTranscriptionItem?.audio_url ? (
                      <audio controls className="w-full" src={selectedTranscriptionItem.audio_url} />
                    ) : (
                      <p className="text-xs text-muted-foreground">No audio is attached to the selected recording.</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {selectedTranscriptionItem?.transcript_count ? `${selectedTranscriptionItem.transcript_count} transcription task(s)` : 'No transcription tasks yet'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedTranscriptionItem?.validation_count ? `${selectedTranscriptionItem.validation_count} peer validation(s)` : 'No peer validations yet'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transcription" className="text-sm font-medium">Your Transcription</Label>
                    <Textarea 
                      id="transcription"
                      placeholder="Type what you hear in the recording." 
                      className="border-border resize-none" 
                      rows={4}
                      value={transcriptionText}
                      onChange={(event) => setTranscriptionText(event.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Confidence</Label>
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={transcriptionConfidence}
                        onChange={(event) => setTranscriptionConfidence(Number(event.target.value))}
                        className="border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Task Status</Label>
                      <Input value={selectedTranscriptionItem?.status ?? 'none'} readOnly className="border-border" />
                    </div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90" type="button" onClick={submitTranscription}>Submit Transcription</Button>
                  <div className="space-y-2 rounded-xl border border-border bg-background p-4">
                    <p className="text-sm font-medium text-foreground">Peer Review</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Rating</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={peerValidationRating}
                          onChange={(event) => setPeerValidationRating(Number(event.target.value))}
                          className="border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Is Correct</Label>
                        <Select value={peerValidationCorrect ? 'true' : 'false'} onValueChange={(value) => setPeerValidationCorrect(value === 'true')}>
                          <SelectTrigger className="border-border"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meaning" className="text-sm font-medium">Deep Cultural Meaning</Label>
                      <Textarea id="meaning" rows={3} className="border-border resize-none" value={deepCulturalMeaning} onChange={(event) => setDeepCulturalMeaning(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="correction" className="text-sm font-medium">Suggested Correction</Label>
                      <Textarea id="correction" rows={2} className="border-border resize-none" value={peerValidationCorrection} onChange={(event) => setPeerValidationCorrection(event.target.value)} />
                    </div>
                    <Button variant="outline" className="w-full border-border" type="button" onClick={submitPeerValidation} disabled={!selectedTranscriptionTaskId}>Save Peer Review</Button>
                    <Button className="w-full bg-primary hover:bg-primary/90" type="button" onClick={graduateTranscription}>Graduate to Prompt Bank</Button>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Prompt Bank</p>
                    <p className="text-sm text-foreground">{promptBank.length} verified prompts ready for prompted recording.</p>
                  </div>
                  <p className="text-xs text-muted-foreground">The backend now exposes transcription, peer review, and prompt-bank endpoints.</p>
                  {transcriptionMessage && <p className="text-sm text-foreground">{transcriptionMessage}</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Your Points
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-r from-primary/10 to-accent-teal/10 rounded-xl p-6 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">Total Points Balance</p>
                    <p className="text-4xl font-bold text-foreground">{wallet ? wallet.balance.toFixed(2) : '0.00'}</p>
                    <p className="text-sm text-muted-foreground mt-4">Unlock rewards at 5,000 points</p>
                  </div>
                  <div className="space-y-2">
                    <Button className="w-full bg-primary hover:bg-primary/90">Redeem Points</Button>
                    <Button variant="outline" className="w-full border-border">View History</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Give Points
                  </CardTitle>
                  <CardDescription>Reward other contributors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select disabled>
                    <SelectTrigger className="border-border">
                      <SelectValue placeholder="Contributor tipping endpoint not wired yet" />
                    </SelectTrigger>
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    {[10, 50, 100, 250].map(amount => (
                      <Button key={amount} variant="outline" className="border-border text-sm">
                        {amount} pts
                      </Button>
                    ))}
                  </div>
                  <Input placeholder="Add a message..." className="border-border" />
                  <Button className="w-full bg-primary hover:bg-primary/90">Send Points</Button>
                </CardContent>
              </Card>

              <Card className="border-border md:col-span-2">
                <CardHeader>
                  <CardTitle>Language Leaderboards</CardTitle>
                  <CardDescription>Top contributors in each language get bonus points</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {(languagePreferences.length > 0 ? [userLanguage] : []).map(lang => (
                      <div key={lang} className="border border-border rounded-lg p-4">
                        <p className="font-semibold text-foreground">{lang}</p>
                        <p className="text-2xl font-bold text-primary mt-2">{wallet ? wallet.balance.toFixed(2) : '0.00'} pts</p>
                        <p className="text-sm text-muted-foreground mt-1">Your current balance</p>
                        <Button size="sm" className="w-full mt-4 bg-primary hover:bg-primary/90">View Rankings</Button>
                      </div>
                    ))}
                    {languagePreferences.length === 0 && (
                      <p className="text-sm text-muted-foreground md:col-span-3">No leaderboard data available from backend yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-8">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Top Contributors
                </CardTitle>
                <CardDescription>This month&apos;s leading community members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topContributors.length === 0 && (
                    <p className="text-sm text-muted-foreground">Top contributors feed is not available from the backend yet.</p>
                  )}
                  {topContributors.map((contributor, idx) => (
                    <div key={idx} className="flex items-center gap-4 pb-4 border-b border-border last:border-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{contributor.name}</p>
                        <p className="text-sm text-muted-foreground">{contributor.recordings} recordings</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{contributor.points} pts</p>
                        <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          {contributor.rating}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
