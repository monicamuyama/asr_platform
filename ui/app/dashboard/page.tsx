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
import { Mic, Headphones, FileText, Trophy, Play, Pause, Volume2, Star, LogOut, Settings, TrendingUp, Users, Target } from 'lucide-react'
import Link from 'next/link'
import { RiddleLinkedRecorder } from '@/components/riddle-linked-recorder'
import { useLanguage } from '@/components/language-provider'
import { flushQueuedSubmissions, listQueuedSubmissions, queueSubmission } from '@/lib/offline-submission-queue'
import {
  createCommunityRating,
  createSubmission,
  createTranscriptionValidation,
  graduateTranscriptionTask,
  getCommunityQueue,
  getConsentDocuments,
  getImagePrompts,
  getLanguages,
  getSourceTranslationQueue,
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
  type ImagePromptEntry,
  type Language,
  type RatingHistoryItem,
  type PromptBankEntry,
  reviewSourceTranslation,
  submitSourceTranslation,
  type SourceTranslationQueueItem,
  validateSourceTranslation,
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

type SubmissionCategory = 'proverb' | 'idiom' | 'common_saying' | 'riddle' | 'photo_description'
type RecordingInputMode = 'read_sentence' | 'image' | 'spontaneous'

export default function CorpusWeaveDashboard() {
  const router = useRouter()
  const { language: displayLanguage, strings } = useLanguage()
  const dashboardCopy = strings.dashboard
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
  const [imagePrompts, setImagePrompts] = useState<ImagePromptEntry[]>([])
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([])
  const [ratingHistory, setRatingHistory] = useState<RatingHistoryItem[]>([])
  const [targetLanguageId, setTargetLanguageId] = useState('')
  const [selectedRecordingMode, setSelectedRecordingMode] = useState<RecordingInputMode>('read_sentence')
  const [selectedCategory, setSelectedCategory] = useState<SubmissionCategory>('common_saying')
  const [selectedPromptBankEntryId, setSelectedPromptBankEntryId] = useState('')
  const [selectedImagePromptId, setSelectedImagePromptId] = useState('')
  const [contributorTranscription, setContributorTranscription] = useState('')
  const [spontaneousTopic, setSpontaneousTopic] = useState('')
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
  const [sourceTranslationQueue, setSourceTranslationQueue] = useState<SourceTranslationQueueItem[]>([])
  const [sourceSentenceIndex, setSourceSentenceIndex] = useState(0)
  const [sourceTranslationText, setSourceTranslationText] = useState('')
  const [sourceTranslationNote, setSourceTranslationNote] = useState('')
  const [translateMessage, setTranslateMessage] = useState('')
  const [translateValidationVote, setTranslateValidationVote] = useState<'approve' | 'reject'>('approve')
  const [isSubmittingTranslation, setIsSubmittingTranslation] = useState(false)
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

  const refreshPromptBank = async (languageId?: string) => {
    try {
      const data = await getPromptBank(languageId, 300, 0)
      setPromptBank(data)
    } catch {
      setPromptBank([])
    }
  }

  const refreshImagePrompts = async () => {
    try {
      const data = await getImagePrompts()
      setImagePrompts(data.filter((entry) => entry.is_active))
    } catch {
      setImagePrompts([])
    }
  }

  const loadSourceTranslationQueueForLanguage = async (languageId: string) => {
    const statuses: Array<'prefilled' | 'queued' | 'submitted' | 'in_validation' | 'validated' | 'approved' | 'rejected'> = [
      'prefilled',
      'queued',
      'submitted',
      'in_validation',
      'validated',
      'approved',
      'rejected',
    ]

    const queueBatches = await Promise.all(
      statuses.map((status) => getSourceTranslationQueue(languageId, status, 200, 0).catch(() => [])),
    )

    return queueBatches
      .flat()
      .filter((item, index, array) => array.findIndex((entry) => entry.id === item.id) === index)
  }

  const refreshSourceTranslationQueue = async (languageId: string, fallbackLanguageIds: string[] = []) => {
    if (!languageId) {
      setSourceTranslationQueue([])
      setSourceSentenceIndex(0)
      return
    }
    try {
      const merged = await loadSourceTranslationQueueForLanguage(languageId)
      if (merged.length === 0) {
        const searchOrder = fallbackLanguageIds.filter((candidateId) => candidateId !== languageId)
        for (const candidateLanguageId of searchOrder) {
          const candidateQueue = await loadSourceTranslationQueueForLanguage(candidateLanguageId)
          if (candidateQueue.length > 0) {
            setTargetLanguageId(candidateLanguageId)
            setSourceTranslationQueue(candidateQueue)
            setSourceSentenceIndex(0)
            return
          }
        }
      }
      setSourceTranslationQueue(merged)
      setSourceSentenceIndex((current) => {
        if (merged.length === 0) {
          return 0
        }
        return Math.min(current, merged.length - 1)
      })
    } catch {
      setSourceTranslationQueue([])
      setSourceSentenceIndex(0)
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

        const configuredLanguageOptions = languagePrefData
          .map((preference) => {
            const language = languageData.find((item) => item.id === preference.language_id)
            if (!language) {
              return null
            }
            return {
              id: language.id,
              isPrimary: preference.is_primary_language,
            }
          })
          .filter((item): item is { id: string; isPrimary: boolean } => item !== null)

        const primaryConfiguredLanguage = configuredLanguageOptions.find((item) => item.isPrimary)
        const initialTargetLanguageId =
          primaryConfiguredLanguage?.id
          ?? languageData.find((language) => language.language_name === profileData.primary_language)?.id
          ?? configuredLanguageOptions[0]?.id
          ?? languageData[0]?.id
          ?? ''
        setTargetLanguageId((current) => current || initialTargetLanguageId)

        await Promise.all([
          refreshCommunityQueue(),
          refreshTranscriptionQueue(),
          refreshPromptBank(initialTargetLanguageId),
          refreshImagePrompts(),
          refreshSourceTranslationQueue(initialTargetLanguageId, languageData.map((language) => language.id)),
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

  useEffect(() => {
    if (!targetLanguageId) {
      return
    }
    void refreshPromptBank(targetLanguageId)
    void refreshSourceTranslationQueue(targetLanguageId, languages.map((language) => language.id))
  }, [targetLanguageId, languages])

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
  const activeConsentVersion = consents.find((document) => document.is_active)?.version ?? consents[0]?.version ?? 'v1.0'
  const primaryLanguagePreference =
    languagePreferences.find((preference) => preference.is_primary_language)
    ?? languagePreferences[0]
    ?? null
  const primaryLanguageInfo =
    languages.find((language) => language.id === primaryLanguagePreference?.language_id)
    ?? languages.find((language) => language.language_name === userLanguage)
    ?? null
  const contributorLanguageOptions = useMemo(
    () => {
      const options = languagePreferences
        .map((preference) => {
          const language = languages.find((item) => item.id === preference.language_id)
          if (!language) {
            return null
          }
          return {
            ...language,
            isPrimary: preference.is_primary_language,
          }
        })
        .filter((item): item is Language & { isPrimary: boolean } => item !== null)

      if (options.length > 0) {
        return options
      }
      return languages.map((language) => ({ ...language, isPrimary: false }))
    },
    [languagePreferences, languages],
  )
  const contributorLanguageIds = useMemo(
    () => new Set(contributorLanguageOptions.map((language) => language.id)),
    [contributorLanguageOptions],
  )

  useEffect(() => {
    if (!contributorLanguageOptions.length) {
      return
    }
    if (!targetLanguageId || !contributorLanguageIds.has(targetLanguageId)) {
      const fallbackLanguageId =
        contributorLanguageOptions.find((language) => language.isPrimary)?.id
        ?? contributorLanguageOptions[0]?.id
        ?? ''
      if (fallbackLanguageId) {
        setTargetLanguageId(fallbackLanguageId)
      }
    }
  }, [contributorLanguageIds, contributorLanguageOptions, targetLanguageId])

  const selectedTargetLanguage =
    contributorLanguageOptions.find((language) => language.id === targetLanguageId)
    ?? primaryLanguageInfo
    ?? contributorLanguageOptions[0]
    ?? languages[0]
    ?? null
  const selectedTargetLanguageCode = (selectedTargetLanguage?.iso_code ?? primaryLanguageInfo?.iso_code ?? 'ENG').toUpperCase()
  const selectedTargetLanguageName = selectedTargetLanguage?.language_name ?? 'this language'
  const categoryLabelsByDisplayLanguage: Record<string, Record<SubmissionCategory, string>> = {
    en: {
      proverb: 'Proverb',
      idiom: 'Idiom',
      common_saying: 'Common Saying',
      riddle: 'Riddle',
      photo_description: 'Photo Description',
    },
  }
  const localizedCategoryLabels = categoryLabelsByDisplayLanguage[displayLanguage] ?? categoryLabelsByDisplayLanguage.en

  const recordPromptByLanguage: Record<string, Record<SubmissionCategory, string>> = {
    LG: {
      proverb: 'Amazzi agasuma tegabyala nnyo.',
      idiom: 'Omuganda takuba mwana munne.',
      common_saying: 'Ebintu bingi bikolebwa nga tuli bumu.',
      riddle: 'Ekikokooma: Kiki ekimera nga tekirina mmwanyi?',
      photo_description: "Nnyonnyola ky'olaba mu kifaananyi kino mu bulungi.",
    },
    SWA: {
      proverb: 'Haraka haraka haina baraka.',
      idiom: 'Maji yaliyomwagika hayazoleki.',
      common_saying: 'Vikono vingi hupunguza kazi.',
      riddle: 'Kitendawili: Ni nini huota bila mbegu?',
      photo_description: 'Eleza kwa undani kile unachokiona kwenye picha uliyopewa.',
    },
    ENG: {
      proverb: 'The future is built by those who contribute today.',
      idiom: 'A river does not forget its source.',
      common_saying: 'Many hands make light work.',
      riddle: 'What has roots that nobody sees and grows taller than trees?',
      photo_description: 'Describe what you see in the assigned image with clear detail.',
    },
    LSG: {
      proverb: 'Record a proverb in Lusoga that sounds natural to native speakers.',
      idiom: 'Record an idiom in Lusoga that people use in everyday speech.',
      common_saying: 'Record a common saying in Lusoga that is easy to recognize.',
      riddle: 'Record a Lusoga riddle that challenges the listener.',
      photo_description: 'Describe the image in Lusoga with clear detail.',
    },
    LMS: {
      proverb: 'Record a proverb in Lumasaba that sounds natural to native speakers.',
      idiom: 'Record an idiom in Lumasaba that people use in everyday speech.',
      common_saying: 'Record a common saying in Lumasaba that is easy to recognize.',
      riddle: 'Record a Lumasaba riddle that challenges the listener.',
      photo_description: 'Describe the image in Lumasaba with clear detail.',
    },
    ACH: {
      proverb: 'Record a proverb in Acholi that sounds natural to native speakers.',
      idiom: 'Record an idiom in Acholi that people use in everyday speech.',
      common_saying: 'Record a common saying in Acholi that is easy to recognize.',
      riddle: 'Record an Acholi riddle that challenges the listener.',
      photo_description: 'Describe the image in Acholi with clear detail.',
    },
    RUN: {
      proverb: 'Record a proverb in Runyakore that sounds natural to native speakers.',
      idiom: 'Record an idiom in Runyakore that people use in everyday speech.',
      common_saying: 'Record a common saying in Runyakore that is easy to recognize.',
      riddle: 'Record a Runyakore riddle that challenges the listener.',
      photo_description: 'Describe the image in Runyakore with clear detail.',
    },
    ATE: {
      proverb: 'Record a proverb in Ateso that sounds natural to native speakers.',
      idiom: 'Record an idiom in Ateso that people use in everyday speech.',
      common_saying: 'Record a common saying in Ateso that is easy to recognize.',
      riddle: 'Record an Ateso riddle that challenges the listener.',
      photo_description: 'Describe the image in Ateso with clear detail.',
    },
    LUG: {
      proverb: 'Record a proverb in Lugbara that sounds natural to native speakers.',
      idiom: 'Record an idiom in Lugbara that people use in everyday speech.',
      common_saying: 'Record a common saying in Lugbara that is easy to recognize.',
      riddle: 'Record a Lugbara riddle that challenges the listener.',
      photo_description: 'Describe the image in Lugbara with clear detail.',
    },
  }
  const recordPrompt = (
    recordPromptByLanguage[selectedTargetLanguageCode] ?? {
      proverb: `Record a proverb in ${selectedTargetLanguageName}.`,
      idiom: `Record an idiom in ${selectedTargetLanguageName}.`,
      common_saying: `Record a common saying in ${selectedTargetLanguageName}.`,
      riddle: `Record a riddle in ${selectedTargetLanguageName}.`,
      photo_description: `Describe the image in ${selectedTargetLanguageName}.`,
    }
  )[selectedCategory]
  const categoryOptionsByMode: Record<RecordingInputMode, SubmissionCategory[]> = {
    read_sentence: ['common_saying'],
    image: ['photo_description'],
    spontaneous: ['proverb', 'idiom', 'common_saying', 'riddle'],
  }
  const categoryOptions = categoryOptionsByMode[selectedRecordingMode]
  const readSentenceCandidates = useMemo(() => {
    const currentLanguageId = selectedTargetLanguage?.id ?? targetLanguageId
    if (!currentLanguageId) {
      return []
    }
    return promptBank.filter((entry) => entry.language_id === currentLanguageId)
  }, [promptBank, selectedTargetLanguage?.id, targetLanguageId])
  const selectedPromptBankEntry =
    readSentenceCandidates.find((entry) => entry.id === selectedPromptBankEntryId)
    ?? readSentenceCandidates[0]
    ?? null
  const selectedImagePrompt = imagePrompts.find((entry) => entry.id === selectedImagePromptId) ?? imagePrompts[0] ?? null
  const effectivePrompt =
    selectedRecordingMode === 'read_sentence'
      ? selectedPromptBankEntry?.sentence_text
        ?? `No verified ${selectedTargetLanguageName} read-sentence prompts yet. Switch to Image mode to continue recording.`
      : selectedRecordingMode === 'spontaneous'
        ? spontaneousTopic.trim() || `Speak naturally in ${selectedTargetLanguageName} about any topic.`
        : selectedImagePrompt?.instruction_text ?? 'Describe what you see in the image.'
  const selectedImagePromptUrl = selectedRecordingMode === 'image' ? selectedImagePrompt?.image_url ?? null : null
  const selectedSubmissionMode: SubmissionCreateRequest['mode'] =
    selectedRecordingMode === 'read_sentence'
      ? 'read_out'
      : selectedRecordingMode === 'image'
        ? 'spontaneous_image'
        : 'recording'
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

  const selectedSourceTranslationTask = useMemo(
    () => sourceTranslationQueue[sourceSentenceIndex] ?? sourceTranslationQueue[0] ?? null,
    [sourceSentenceIndex, sourceTranslationQueue],
  )

  useEffect(() => {
    if (!selectedSourceTranslationTask) {
      setSourceTranslationText('')
      return
    }
    setSourceTranslationText(selectedSourceTranslationTask.translated_text ?? selectedSourceTranslationTask.machine_prefill_text ?? '')
    setSourceTranslationNote('')
  }, [selectedSourceTranslationTask?.id])

  useEffect(() => {
    if (!categoryOptions.includes(selectedCategory)) {
      setSelectedCategory(categoryOptions[0])
    }
  }, [categoryOptions, selectedCategory])

  useEffect(() => {
    if (readSentenceCandidates.length === 0) {
      setSelectedPromptBankEntryId('')
      return
    }
    if (!readSentenceCandidates.some((entry) => entry.id === selectedPromptBankEntryId)) {
      setSelectedPromptBankEntryId(readSentenceCandidates[0].id)
    }
  }, [readSentenceCandidates, selectedPromptBankEntryId])

  useEffect(() => {
    if (selectedRecordingMode === 'read_sentence' && readSentenceCandidates.length === 0 && imagePrompts.length > 0) {
      setSelectedRecordingMode('image')
      setRecordingError('No verified read-sentence prompts for this language yet. Switched to shared image prompts.')
    }
  }, [imagePrompts.length, readSentenceCandidates.length, selectedRecordingMode])

  useEffect(() => {
    if (imagePrompts.length === 0) {
      setSelectedImagePromptId('')
      return
    }
    if (!imagePrompts.some((entry) => entry.id === selectedImagePromptId)) {
      setSelectedImagePromptId(imagePrompts[0].id)
    }
  }, [imagePrompts, selectedImagePromptId])

  const isReviewer = user?.role === 'expert' || user?.role === 'admin'
  const canValidateSourceTranslation = useMemo(
    () => languagePreferences.some((pref) => pref.language_id === targetLanguageId && pref.can_validate),
    [languagePreferences, targetLanguageId],
  )

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

    if (selectedRecordingMode === 'read_sentence' && !selectedPromptBankEntry) {
      setRecordingError('No sentence is available from your data for this language yet.')
      return
    }

    if (selectedRecordingMode === 'image' && !selectedImagePromptUrl) {
      setRecordingError('No shared image prompt is available yet.')
      return
    }

    if (!contributorTranscription.trim()) {
      setRecordingError('Add what you said before submitting.')
      return
    }

    setIsSubmittingRecording(true)
    setRecordingError('')
    setSubmissionMessage('')

    const payload: SubmissionCreateRequest = {
      contributor_id: sessionUserId,
      language_code: selectedTargetLanguage.iso_code,
      native_language_code: nativeLanguageCode,
      target_language_code: selectedTargetLanguage.iso_code,
      mode: selectedSubmissionMode,
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
      target_word: selectedRecordingMode === 'read_sentence' ? effectivePrompt : null,
      read_prompt: selectedRecordingMode === 'read_sentence' ? effectivePrompt : null,
      image_prompt_url: selectedImagePromptUrl,
      spontaneous_instruction:
        selectedRecordingMode === 'spontaneous'
          ? effectivePrompt
          : selectedRecordingMode === 'image'
            ? effectivePrompt
            : null,
      contributor_transcription: contributorTranscription.trim(),
    }

    try {
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
          await queueSubmission(payload)
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

    const linkedPrompt = selectedPromptBankEntry?.sentence_text ?? effectivePrompt
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
      target_word: linkedPrompt,
      read_prompt: linkedPrompt,
      contributor_transcription: linkedPrompt,
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
      target_word: linkedPrompt,
      read_prompt: linkedPrompt,
      contributor_transcription: linkedPrompt,
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

  const submitDashboardTranslation = async () => {
    if (!sessionUserId || !selectedSourceTranslationTask) {
      setTranslateMessage('Select a translation task first.')
      return
    }
    if (!sourceTranslationText.trim()) {
      setTranslateMessage('Enter translated text before submitting.')
      return
    }

    setIsSubmittingTranslation(true)
    setTranslateMessage('')
    try {
      await submitSourceTranslation(selectedSourceTranslationTask.id, {
        translator_id: sessionUserId,
        translated_text: sourceTranslationText.trim(),
      })
      setTranslateMessage('Translation submitted.')
      setSourceSentenceIndex((current) => current + 1)
      await refreshSourceTranslationQueue(targetLanguageId)
    } catch (err) {
      setTranslateMessage(err instanceof Error ? err.message : 'Failed to submit translation.')
    } finally {
      setIsSubmittingTranslation(false)
    }
  }

  const reviewDashboardTranslation = async (approved: boolean) => {
    if (!sessionUserId || !selectedSourceTranslationTask) {
      setTranslateMessage('Select a submitted task to review.')
      return
    }

    setIsSubmittingTranslation(true)
    setTranslateMessage('')
    try {
      await reviewSourceTranslation(selectedSourceTranslationTask.id, {
        reviewer_id: sessionUserId,
        approved,
        reviewed_text: approved ? sourceTranslationText.trim() || selectedSourceTranslationTask.translated_text : undefined,
        notes: sourceTranslationNote.trim() || undefined,
      })
      setTranslateMessage(approved ? 'Translation approved.' : 'Translation rejected.')
      await refreshSourceTranslationQueue(targetLanguageId)
    } catch (err) {
      setTranslateMessage(err instanceof Error ? err.message : 'Review action failed.')
    } finally {
      setIsSubmittingTranslation(false)
    }
  }

  const validateDashboardTranslation = async () => {
    if (!sessionUserId || !selectedSourceTranslationTask) {
      setTranslateMessage('Select a translation in validation pool first.')
      return
    }

    setIsSubmittingTranslation(true)
    setTranslateMessage('')
    try {
      const response = await validateSourceTranslation(selectedSourceTranslationTask.id, {
        validator_id: sessionUserId,
        is_valid: translateValidationVote === 'approve',
        notes: sourceTranslationNote.trim() || undefined,
      })
      if (response.status === 'validated') {
        setTranslateMessage('Validation recorded. This sentence is now ready for expert/admin review.')
      } else {
        setTranslateMessage('Validation recorded and sent to pool.')
      }
      await refreshSourceTranslationQueue(targetLanguageId)
    } catch (err) {
      setTranslateMessage(err instanceof Error ? err.message : 'Failed to submit validation vote.')
    } finally {
      setIsSubmittingTranslation(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <p className="text-foreground font-medium">{dashboardCopy.loadingTitle}</p>
          <p className="text-sm text-muted-foreground">{dashboardCopy.loadingDescription}</p>
          <Link href="/signin">
            <Button variant="outline" className="border-border">{dashboardCopy.goToSignIn}</Button>
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
                <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">{strings.app.brand}</h1>
                <p className="truncate text-xs text-muted-foreground">{strings.app.tagline}</p>
              </div>
            </div>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:gap-3">
              <div className="hidden lg:flex items-center gap-2 text-sm">
                <span className="text-foreground">{dashboardCopy.welcome} <strong>{userName}</strong></span>
                <Badge variant="outline" className="ml-2">{userLanguage}</Badge>
              </div>
              <Link href="/donate">
                <Button size="sm" variant="ghost">{dashboardCopy.support}</Button>
              </Link>
              <Link href="/data-dictionary">
                <Button size="sm" variant="ghost" className="hidden md:inline-flex">{dashboardCopy.docs}</Button>
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
          <TabsList className="mb-8 grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-5">
            <TabsTrigger value="dashboard">{dashboardCopy.tabs.dashboard}</TabsTrigger>
            <TabsTrigger value="record">{dashboardCopy.tabs.record}</TabsTrigger>
            <TabsTrigger value="validate">{dashboardCopy.tabs.validate}</TabsTrigger>
            <TabsTrigger value="transcribe">{dashboardCopy.tabs.transcribe}</TabsTrigger>
            <TabsTrigger value="translate">{dashboardCopy.tabs.translate}</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" className="border-border" onClick={() => document.getElementById('dashboard-overview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                    Overview
                  </Button>
                  <Button type="button" variant="outline" className="border-border" onClick={() => document.getElementById('dashboard-rewards')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                    Rewards
                  </Button>
                  <Button type="button" variant="outline" className="border-border" onClick={() => document.getElementById('dashboard-leaderboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                    Leaderboard
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div id="dashboard-overview" className="space-y-8">
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
                          setActiveTab('validate')
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
            </div>

            <div id="dashboard-rewards" className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground">Rewards</h3>
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
              </div>
            </div>

            <div id="dashboard-leaderboard" className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground">Leaderboard</h3>
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
            </div>
          </TabsContent>

          {/* Record Tab */}
          <TabsContent value="record" className="space-y-8">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Choose Recording Type</CardTitle>
                <CardDescription>Pick how you want to record, then choose category and submit.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="space-y-2 md:w-[420px]">
                    <Label className="text-sm font-medium">Recording Option</Label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {[
                        { key: 'read_sentence', label: 'Read from sentence' },
                        { key: 'image', label: 'Image description' },
                        { key: 'spontaneous', label: 'Speak anything' },
                      ].map((item) => (
                        <Button
                          key={item.key}
                          type="button"
                          variant={selectedRecordingMode === item.key ? 'default' : 'outline'}
                          className="h-auto min-h-12 whitespace-normal px-3 py-2 text-center leading-snug"
                          onClick={() => setSelectedRecordingMode(item.key as RecordingInputMode)}
                        >
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {selectedRecordingMode === 'spontaneous' && (
                    <div className="space-y-2 md:w-[280px]">
                      <Label className="text-sm font-medium">Category</Label>
                      <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as SubmissionCategory)}>
                        <SelectTrigger className="border-border">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((category) => (
                            <SelectItem key={category} value={category}>
                              {localizedCategoryLabels[category]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2 md:ml-auto md:w-[280px]">
                    <Label className="text-sm font-medium">Target Language</Label>
                    <Select value={targetLanguageId || undefined} onValueChange={setTargetLanguageId}>
                      <SelectTrigger className="border-border">
                        <SelectValue placeholder="Select a target language" />
                      </SelectTrigger>
                      <SelectContent>
                        {contributorLanguageOptions.map((language) => (
                          <SelectItem key={language.id} value={language.id}>
                            {language.language_name}{language.isPrimary ? ' (Primary)' : ' (Secondary)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedRecordingMode === 'spontaneous' && selectedCategory === 'riddle' ? (
                  <RiddleLinkedRecorder
                    draftKey={sessionUserId ? `isdr_riddle_pair_draft_${sessionUserId}` : 'isdr_riddle_pair_draft'}
                    disabled={!selectedTargetLanguage}
                    promptText={effectivePrompt}
                    onSubmitPair={submitLinkedRiddlePair}
                  />
                ) : (
                  <>
                    <div className="bg-muted/50 rounded-xl p-6 text-center space-y-4">
                      <p className="text-lg font-semibold text-foreground sm:text-xl">
                        {selectedRecordingMode === 'read_sentence'
                          ? 'Sentence to record:'
                          : selectedRecordingMode === 'image'
                            ? 'Image prompt:'
                            : 'Spontaneous prompt:'}
                      </p>
                      <p className="break-words text-xl font-semibold leading-relaxed text-foreground sm:text-2xl">"{effectivePrompt}"</p>
                      {selectedRecordingMode === 'image' && selectedImagePromptUrl && (
                        <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                          <img
                            src={selectedImagePromptUrl}
                            alt="Shared recording prompt"
                            className="h-auto w-full object-cover"
                          />
                        </div>
                      )}
                      {selectedRecordingMode === 'image' && imagePrompts.length > 1 && (
                        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                          <span>{imagePrompts.length} shared image(s) available</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-border"
                            onClick={() => {
                              const currentIndex = imagePrompts.findIndex((entry) => entry.id === selectedImagePrompt?.id)
                              const nextIndex = currentIndex >= 0
                                ? (currentIndex + 1) % imagePrompts.length
                                : 0
                              setSelectedImagePromptId(imagePrompts[nextIndex].id)
                            }}
                          >
                            Next image
                          </Button>
                        </div>
                      )}
                      {selectedRecordingMode === 'read_sentence' && (
                        <div className="flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                          <span>{readSentenceCandidates.length} sentence(s) available</span>
                          {readSentenceCandidates.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="border-border"
                              onClick={() => {
                                const currentIndex = readSentenceCandidates.findIndex((entry) => entry.id === selectedPromptBankEntry?.id)
                                const nextIndex = currentIndex >= 0
                                  ? (currentIndex + 1) % readSentenceCandidates.length
                                  : 0
                                setSelectedPromptBankEntryId(readSentenceCandidates[nextIndex].id)
                              }}
                            >
                              Next sentence
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {selectedRecordingMode === 'spontaneous' && selectedCategory !== 'riddle' && (
                      <div className="space-y-2">
                        <Label htmlFor="spontaneous-topic" className="text-sm font-medium">What should the speaker talk about?</Label>
                        <Textarea
                          id="spontaneous-topic"
                          rows={2}
                          className="border-border resize-none"
                          value={spontaneousTopic}
                          onChange={(event) => setSpontaneousTopic(event.target.value)}
                          placeholder="Optional topic, e.g. introduce yourself, describe your day, tell a short story"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="contributor-transcription" className="text-sm font-medium">What did you say? (required)</Label>
                      <Textarea
                        id="contributor-transcription"
                        rows={3}
                        className="border-border resize-none"
                        value={contributorTranscription}
                        onChange={(event) => setContributorTranscription(event.target.value)}
                        placeholder="Type the words you recorded"
                      />
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

                    {recordedAudioUrl && <audio controls className="w-full" src={recordedAudioUrl} />}
                    <Button
                      type="button"
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={submitRecording}
                      disabled={isSubmittingRecording || !recordedAudioDataUrl || !contributorTranscription.trim()}
                    >
                      {isSubmittingRecording ? 'Submitting...' : 'Submit Recording'}
                    </Button>
                  </>
                )}

                {recordingError && <p className="text-sm text-red-600">{recordingError}</p>}
                {submissionMessage && <p className="text-sm text-foreground">{submissionMessage}</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validate" className="space-y-8">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-primary" />
                  Validate Audio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Submission ID</Label>
                  <Select value={validationQueue.some((item) => item.id === selectedQueueSubmissionId) ? selectedQueueSubmissionId : ''} onValueChange={setSelectedQueueSubmissionId}>
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

                {selectedValidationSubmission?.audio_url ? (
                  <audio controls className="w-full" src={selectedValidationSubmission.audio_url} />
                ) : (
                  <p className="text-xs text-muted-foreground">No validation audio available.</p>
                )}

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
          </TabsContent>

          <TabsContent value="transcribe" className="space-y-8">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Transcribe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/transcription">
                  <Button variant="outline" className="w-full border-border">Open Task Dashboard</Button>
                </Link>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Recording Queue</Label>
                  <Select value={selectedTranscriptionItem?.recording_id ?? ''} onValueChange={setSelectedTranscriptionRecordingId}>
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

                <Textarea
                  id="transcription"
                  placeholder="Type what you hear in the recording."
                  className="border-border resize-none"
                  rows={4}
                  value={transcriptionText}
                  onChange={(event) => setTranscriptionText(event.target.value)}
                />

                <Button className="w-full bg-primary hover:bg-primary/90" type="button" onClick={submitTranscription}>Submit Transcription</Button>
                <Button variant="outline" className="w-full border-border" type="button" onClick={submitPeerValidation} disabled={!selectedTranscriptionTaskId}>Save Peer Review</Button>
                <Button className="w-full bg-primary hover:bg-primary/90" type="button" onClick={graduateTranscription}>Graduate to Prompt Bank</Button>
                {transcriptionMessage && <p className="text-sm text-foreground">{transcriptionMessage}</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="translate" className="space-y-8">
            <Card className="border-border">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Translate
                    </CardTitle>
                    <CardDescription>Translate source sentences into your target language and review where authorized.</CardDescription>
                  </div>
                  <div className="w-full sm:w-72 space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Target Language
                    </Label>
                    <Select value={targetLanguageId || undefined} onValueChange={setTargetLanguageId}>
                      <SelectTrigger className="border-border">
                        <SelectValue placeholder="Select target language" />
                      </SelectTrigger>
                      <SelectContent>
                        {contributorLanguageOptions.map((language) => (
                          <SelectItem key={language.id} value={language.id}>
                            {language.language_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Source Sentences</Label>
                    <span className="text-xs text-muted-foreground">
                      {sourceTranslationQueue.length === 0 ? '0 / 0' : `${sourceSentenceIndex + 1} / ${sourceTranslationQueue.length}`}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Source Text</p>
                    <Badge variant="outline" className="border-border text-xs">
                      {selectedSourceTranslationTask?.status ?? 'waiting'}
                    </Badge>
                  </div>
                  <p className="text-xl font-semibold leading-relaxed text-foreground sm:text-2xl">
                    {selectedSourceTranslationTask?.source_text ?? 'No source sentence available for this target language yet.'}
                  </p>
                  {selectedSourceTranslationTask?.machine_prefill_text && (
                    <p className="text-xs text-muted-foreground">Prefill suggestion: {selectedSourceTranslationTask.machine_prefill_text}</p>
                  )}
                  {selectedSourceTranslationTask && (
                    <p className="text-xs text-muted-foreground">
                      Pool validations: {selectedSourceTranslationTask.approval_count}/{selectedSourceTranslationTask.validation_count} approvals
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-border"
                      disabled={sourceTranslationQueue.length <= 1 || sourceSentenceIndex <= 0}
                      onClick={() => setSourceSentenceIndex((current) => Math.max(0, current - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-border"
                      disabled={sourceTranslationQueue.length <= 1 || sourceSentenceIndex >= sourceTranslationQueue.length - 1}
                      onClick={() => setSourceSentenceIndex((current) => Math.min(sourceTranslationQueue.length - 1, current + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>

                {!selectedSourceTranslationTask && (
                  <p className="text-xs text-muted-foreground">
                    No source sentences were returned for this target language yet.
                  </p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="dashboard-translation-text" className="text-sm font-medium">Translated Text</Label>
                  <Textarea
                    id="dashboard-translation-text"
                    rows={4}
                    className="border-border resize-none"
                    placeholder="Write the translation here"
                    value={sourceTranslationText}
                    onChange={(event) => setSourceTranslationText(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dashboard-translation-note" className="text-sm font-medium">Notes</Label>
                  <Textarea
                    id="dashboard-translation-note"
                    rows={2}
                    className="border-border resize-none"
                    placeholder="Optional notes"
                    value={sourceTranslationNote}
                    onChange={(event) => setSourceTranslationNote(event.target.value)}
                  />
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={submitDashboardTranslation}
                  disabled={!selectedSourceTranslationTask || isSubmittingTranslation || !['prefilled', 'queued', 'rejected'].includes(selectedSourceTranslationTask.status)}
                >
                  {isSubmittingTranslation ? 'Submitting...' : 'Submit Translation'}
                </Button>

                {canValidateSourceTranslation && selectedSourceTranslationTask?.status === 'in_validation' && (
                  <div className="space-y-2 rounded-xl border border-border bg-background p-4">
                    <p className="text-sm font-medium text-foreground">Validation Pool Vote</p>
                    <Select value={translateValidationVote} onValueChange={(value) => setTranslateValidationVote(value as 'approve' | 'reject')}>
                      <SelectTrigger className="border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approve">Approve translation quality</SelectItem>
                        <SelectItem value="reject">Reject / needs corrections</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      className="w-full border-border"
                      onClick={validateDashboardTranslation}
                      disabled={isSubmittingTranslation}
                    >
                      Submit Validation Vote
                    </Button>
                  </div>
                )}

                {isReviewer && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="border-border"
                      onClick={() => reviewDashboardTranslation(true)}
                      disabled={!selectedSourceTranslationTask || isSubmittingTranslation || selectedSourceTranslationTask.status !== 'validated'}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="border-border"
                      onClick={() => reviewDashboardTranslation(false)}
                      disabled={!selectedSourceTranslationTask || isSubmittingTranslation || selectedSourceTranslationTask.status !== 'validated'}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {sourceTranslationQueue.length} task(s) in current queue.
                </p>
                {translateMessage && <p className="text-sm text-foreground">{translateMessage}</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
