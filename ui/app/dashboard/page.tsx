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
import {
  createCommunityRating,
  createSubmission,
  getCommunityQueue,
  getConsentDocuments,
  getLanguages,
  getUserById,
  getUserLanguagePreferencesById,
  getUserProfileById,
  getUserWalletById,
  type CommunityQueueItem,
  type ConsentDocument,
  type Language,
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
  const [selectedQueueSubmissionId, setSelectedQueueSubmissionId] = useState('')
  const [selectedRating, setSelectedRating] = useState(3)
  const [validationScores, setValidationScores] = useState({
    intelligibility: 3,
    recordingQuality: 3,
    compliance: 3,
  })
  const [isRecording, setIsRecording] = useState(false)
  const [isSubmittingRecording, setIsSubmittingRecording] = useState(false)
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
        if (preferredSubmissionId && queueData.some((item) => item.id === preferredSubmissionId)) {
          return preferredSubmissionId
        }
        if (current && queueData.some((item) => item.id === current)) {
          return current
        }
        return queueData[0]?.id || ''
      })
    } catch {
      setCommunityQueue([])
      setSelectedQueueSubmissionId('')
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

        await refreshCommunityQueue()
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
  const recordPrompt = 'The future is built by those who contribute today.'
  const activeConsentVersion = consents.find((document) => document.is_active)?.version ?? consents[0]?.version ?? 'v1.0'
  const primaryLanguagePreference =
    languagePreferences.find((preference) => preference.is_primary_language)
    ?? languagePreferences[0]
    ?? null
  const primaryLanguageInfo =
    languages.find((language) => language.id === primaryLanguagePreference?.language_id)
    ?? languages.find((language) => language.language_name === userLanguage)
    ?? null
  const selectedValidationSubmission = communityQueue.find((item) => item.id === selectedQueueSubmissionId) ?? communityQueue[0] ?? null
  const speakerProfile = profile?.has_speech_impairment
    ? profile.impairment_type ?? 'speech_impairment'
    : 'healthy_speaker'

  const userStats = useMemo(
    () => [
      { label: 'Recordings', value: '-', icon: Mic },
      { label: 'Validations', value: '-', icon: Headphones },
      { label: 'Transcriptions', value: '-', icon: FileText },
      { label: 'Points Earned', value: wallet ? wallet.balance.toFixed(2) : '0.00', icon: Trophy },
    ],
    [wallet],
  )

  const activeTasks: Array<{ id: number; type: string; title: string; language: string; reward: string }> = []
  const recentActivity: Array<{ date: string; action: string; reward: string }> = []
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

    if (!primaryLanguageInfo) {
      setRecordingError('Could not load your primary language profile. Update your language in Settings and try again.')
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
      const submission = await createSubmission({
        contributor_id: sessionUserId,
        language_code: primaryLanguageInfo.iso_code,
        mode: 'recording',
        speaker_profile: speakerProfile,
        consent_version: activeConsentVersion,
        audio_url: recordedAudioDataUrl,
        target_word: recordPrompt,
        read_prompt: recordPrompt,
      })

      setSubmissionMessage(`Recording submitted as ${submission.id}`)
      await refreshCommunityQueue(submission.id)
      stopRecording()
      setRecordedAudioUrl(null)
      setRecordedAudioDataUrl(null)
      setRecordingDuration(0)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit recording.'
      if (/404/i.test(message) || /not found/i.test(message)) {
        setRecordingError('Submission endpoint is unavailable (404). Ensure backend routes include /submissions and the API server is restarted.')
      } else {
        setRecordingError(message)
      }
    } finally {
      setIsSubmittingRecording(false)
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
      await refreshCommunityQueue()
      setSelectedRating(validationScores.intelligibility)
    } catch (err) {
      setValidationMessage(err instanceof Error ? err.message : 'Failed to submit rating.')
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
                      <Button className="w-full bg-primary hover:bg-primary/90">Start Task</Button>
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-border lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-primary" />
                    Record Audio
                  </CardTitle>
                  <CardDescription>Contribute voice data in your language</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-6 text-center space-y-4">
                    <p className="font-medium text-foreground">Sentence to record:</p>
                    <p className="text-lg text-foreground italic">
                      "{recordPrompt}"
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{primaryLanguageInfo?.language_name ?? userLanguage}</span>
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
                    <Select value={selectedQueueSubmissionId} onValueChange={setSelectedQueueSubmissionId}>
                      <SelectTrigger className="border-border">
                        <SelectValue placeholder="Select a submission" />
                      </SelectTrigger>
                      <SelectContent>
                        {communityQueue.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.language_code} · {item.mode} · {item.id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-center">
                    <div className="text-center">
                      <Play className="h-8 w-8 text-primary mx-auto" />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {selectedValidationSubmission ? `${selectedValidationSubmission.status} · ${selectedValidationSubmission.ratings_count} ratings` : 'No queue items available'}
                      </p>
                    </div>
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
                  <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-center">
                    <Volume2 className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transcription" className="text-sm font-medium">Your Transcription</Label>
                    <Textarea 
                      id="transcription"
                      placeholder="Transcription pipeline is not exposed yet." 
                      className="border-border resize-none" 
                      rows={4}
                      disabled
                    />
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90" disabled>Submit Transcription</Button>
                  <p className="text-xs text-muted-foreground">The backend does not expose transcription endpoints yet.</p>
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
