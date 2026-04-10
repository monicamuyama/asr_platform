'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { Mail, Lock, User, ArrowLeft, CheckCircle } from 'lucide-react'
import { API_BASE, type ConsentDocument, type Country, type District, type Language, type SpeechCondition } from '@/lib/api'
import { setSessionUserId } from '@/lib/auth'

const SIGNUP_DRAFT_KEY = 'corpusweave_signup_draft'

type SignupDraft = {
  step: number
  formData: {
    name: string
    email: string
    password: string
    languageId: string
    countryId: string
    districtId: string
    tribeEthnicity: string
    hasSpeechImpairment: boolean
    speechConditionId: string
    speechConditionSeverity: 'mild' | 'moderate' | 'severe'
    speechConditionNotes: string
    speechConditionResearchConsent: boolean
  }
  acceptedConsentIds: string[]
}

const DEFAULT_FORM_DATA: SignupDraft['formData'] = {
  name: '',
  email: '',
  password: '',
  languageId: '',
  countryId: '',
  districtId: '',
  tribeEthnicity: '',
  hasSpeechImpairment: false,
  speechConditionId: '',
  speechConditionSeverity: 'mild',
  speechConditionNotes: '',
  speechConditionResearchConsent: false,
}

function normalizeSignupDraft(rawDraft: unknown): SignupDraft | null {
  if (!rawDraft || typeof rawDraft !== 'object') {
    return null
  }

  const draft = rawDraft as Partial<SignupDraft>
  const rawStep = typeof draft.step === 'number' ? draft.step : Number(draft.step)
  const normalizedStep = Number.isFinite(rawStep) && rawStep >= 1 && rawStep <= 2 ? Math.floor(rawStep) : 1

  const rawFormData = (draft.formData && typeof draft.formData === 'object') ? draft.formData : {}
  const normalizedFormData = {
    ...DEFAULT_FORM_DATA,
    ...rawFormData,
    hasSpeechImpairment: Boolean((rawFormData as Partial<SignupDraft['formData']>).hasSpeechImpairment),
    speechConditionResearchConsent: Boolean((rawFormData as Partial<SignupDraft['formData']>).speechConditionResearchConsent),
    speechConditionSeverity:
      (rawFormData as Partial<SignupDraft['formData']>).speechConditionSeverity === 'moderate'
      || (rawFormData as Partial<SignupDraft['formData']>).speechConditionSeverity === 'severe'
        ? (rawFormData as Partial<SignupDraft['formData']>).speechConditionSeverity
        : 'mild',
  }

  const normalizedAcceptedConsentIds = Array.isArray(draft.acceptedConsentIds)
    ? draft.acceptedConsentIds.filter((value): value is string => typeof value === 'string')
    : []

  return {
    step: normalizedStep,
    formData: normalizedFormData,
    acceptedConsentIds: normalizedAcceptedConsentIds,
  }
}

function loadSignupDraft(): SignupDraft | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawDraft = window.sessionStorage.getItem(SIGNUP_DRAFT_KEY)
  if (!rawDraft) {
    return null
  }

  try {
    return normalizeSignupDraft(JSON.parse(rawDraft))
  } catch {
    return null
  }
}

function saveSignupDraft(draft: SignupDraft): void {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(draft))
}

function clearSignupDraft(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(SIGNUP_DRAFT_KEY)
}

export default function SignUpPage() {
  const initialDraft = useMemo(() => loadSignupDraft(), [])
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<SignupDraft['formData']>(() => initialDraft?.formData ?? DEFAULT_FORM_DATA)
  const [countries, setCountries] = useState<Country[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [consents, setConsents] = useState<ConsentDocument[]>([])
  const [speechConditions, setSpeechConditions] = useState<SpeechCondition[]>([])
  const [acceptedConsentIds, setAcceptedConsentIds] = useState<string[]>(() => initialDraft?.acceptedConsentIds ?? [])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!initialDraft) {
      return
    }

    setStep(initialDraft.step)
    setFormData(initialDraft.formData)
    setAcceptedConsentIds(initialDraft.acceptedConsentIds)
  }, [initialDraft])

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [countryRes, langRes, consentRes, conditionRes, districtRes] = await Promise.all([
          fetch(`${API_BASE}/auth/countries`),
          fetch(`${API_BASE}/auth/languages`),
          fetch(`${API_BASE}/auth/consent-documents`),
          fetch(`${API_BASE}/auth/speech-conditions`),
          fetch(`${API_BASE}/auth/districts`),
        ])

        if (!countryRes.ok || !langRes.ok || !consentRes.ok || !conditionRes.ok || !districtRes.ok) {
          throw new Error('Failed to load reference data from backend')
        }

        const [countryData, langData, consentData, conditionData, districtData] = await Promise.all([
          countryRes.json() as Promise<Country[]>,
          langRes.json() as Promise<Language[]>,
          consentRes.json() as Promise<ConsentDocument[]>,
          conditionRes.json() as Promise<SpeechCondition[]>,
          districtRes.json() as Promise<District[]>,
        ])

        setCountries(countryData)
        setLanguages(langData)
        setConsents(consentData)
        setSpeechConditions(conditionData)
        setDistricts(districtData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to reach backend API')
      }
    }

    void loadReferenceData()
  }, [])

  const selectedCountry = useMemo(
    () => countries.find((country) => country.id === formData.countryId) ?? null,
    [countries, formData.countryId],
  )

  const filteredDistricts = useMemo(
    () => districts.filter((district) => district.country_id === formData.countryId),
    [districts, formData.countryId],
  )

  const selectedSpeechCondition = useMemo(
    () => speechConditions.find((condition) => condition.id === formData.speechConditionId) ?? null,
    [speechConditions, formData.speechConditionId],
  )

  const selectedLanguage = useMemo(
    () => languages.find((language) => language.id === formData.languageId) ?? null,
    [languages, formData.languageId],
  )

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleConsent = (documentId: string, accepted: boolean) => {
    setAcceptedConsentIds((current) =>
      accepted
        ? (current.includes(documentId) ? current : [...current, documentId])
        : current.filter((id) => id !== documentId),
    )
  }

  const handleStepChange = (nextStep: number) => {
    setStep(nextStep)
  }

  useEffect(() => {
    saveSignupDraft({ step, formData, acceptedConsentIds })
  }, [step, formData, acceptedConsentIds])

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('Please complete name, email, and password to continue.')
      return
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    handleStepChange(2)
  }

  const handleReturnToStep2 = () => {
    handleStepChange(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const acceptedConsentCount = acceptedConsentIds.length
    if (acceptedConsentCount !== consents.length) {
      setError('You must accept every required consent document to continue.')
      return
    }

    if (formData.hasSpeechImpairment && !selectedSpeechCondition) {
      setError('Please choose your speech condition before continuing.')
      return
    }

    if (formData.hasSpeechImpairment && !formData.speechConditionResearchConsent) {
      setError('Please confirm whether you are willing to be contacted for speech research.')
      return
    }

    if (!selectedCountry || !selectedLanguage) {
      setError('Please select a valid country and language loaded from backend.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.name,
          email: formData.email,
          password: formData.password,
          phone_number: null,
          consents: consents
            .filter((document) => acceptedConsentIds.includes(document.id))
            .map((document) => ({
            document_id: document.id,
            agreed: true,
            })),
          country: selectedCountry.country_name,
          primary_language: selectedLanguage.language_name,
          preferred_contribution_type: 'recording',
          has_speech_impairment: formData.hasSpeechImpairment,
          impairment_type: formData.hasSpeechImpairment ? selectedSpeechCondition?.condition_name ?? null : null,
          bio: null,
          age_range: null,
          gender: null,
          country_id: selectedCountry.id,
          region_id: null,
          district_id: formData.districtId || null,
          tribe_ethnicity: formData.tribeEthnicity || null,
          native_language_id: selectedLanguage.id,
          education_level: null,
          speech_conditions:
            formData.hasSpeechImpairment && selectedSpeechCondition
              ? [
                  {
                    condition_id: selectedSpeechCondition.id,
                    severity_level: formData.speechConditionSeverity as 'mild' | 'moderate' | 'severe',
                    is_willing_to_contribute_for_research: formData.speechConditionResearchConsent,
                    notes: formData.speechConditionNotes.trim() || null,
                  },
                ]
              : [],
          language_preferences: [
            {
              language_id: selectedLanguage.id,
              dialect_id: null,
              is_primary_language: true,
              can_record: true,
              can_transcribe: true,
              can_validate: true,
              proficiency_level: 'native',
            },
          ],
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { detail?: string }
        throw new Error(payload.detail ?? 'Signup failed')
      }

      const payload = (await response.json()) as { user?: { id?: string } }
      if (payload.user?.id) {
        setSessionUserId(payload.user.id)
        clearSignupDraft()
      }

      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-teal font-bold text-white">
              CW
            </div>
            <h1 className="text-2xl font-bold text-foreground">CorpusWeave</h1>
          </div>
          <p className="text-muted-foreground text-sm">Community Speech Data Platform</p>
        </div>

        {step !== 3 && (
          <div className="mb-6 flex gap-2">
            {[1, 2].map(s => (
              <div 
                key={s} 
                className={`flex-1 h-2 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
        )}

        <Card className="border-border">
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>Create Your Account</CardTitle>
                <CardDescription>Step 1 of 2: Basic Information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStep1Submit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Amara Okafor"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="pl-10 border-border"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-10 border-border"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="pl-10 border-border"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">At least 8 characters</p>
                  </div>

                  <Button 
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 mt-6"
                  >
                    Next
                  </Button>

                  {error && <p className="text-sm text-red-600">{error}</p>}
                </form>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>Language & Location</CardTitle>
                <CardDescription>Step 2 of 2: Tell us about yourself</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="language" className="text-sm font-medium">Primary Language</Label>
                      <Select value={formData.languageId} onValueChange={(value) => handleInputChange('languageId', value)}>
                        <SelectTrigger className="border-border">
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((language) => (
                            <SelectItem key={language.id} value={language.id}>{language.language_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-sm font-medium">Country</Label>
                      <Select value={formData.countryId} onValueChange={(value) => handleInputChange('countryId', value)}>
                        <SelectTrigger className="border-border">
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.id} value={country.id}>{country.country_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.countryId && filteredDistricts.length > 0 && (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="district" className="text-sm font-medium">District</Label>
                        <Select value={formData.districtId || undefined} onValueChange={(value) => handleInputChange('districtId', value)}>
                          <SelectTrigger className="border-border">
                            <SelectValue placeholder="Select a district" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredDistricts.map((district) => (
                              <SelectItem key={district.id} value={district.id}>{district.district_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tribe-ethnicity" className="text-sm font-medium">Tribe/Ethnicity</Label>
                        <Input
                          id="tribe-ethnicity"
                          placeholder="Your tribe or ethnic group (optional)"
                          value={formData.tribeEthnicity}
                          onChange={(e) => handleInputChange('tribeEthnicity', e.target.value)}
                          className="border-border"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
                    <div className="space-y-2">
                      <Label htmlFor="speech-impairment" className="text-sm font-medium">Speech Impairment</Label>
                      <Select
                        value={formData.hasSpeechImpairment ? 'yes' : 'no'}
                        onValueChange={(value) => {
                          const hasImpairment = value === 'yes'
                          setFormData((prev) => ({
                            ...prev,
                            hasSpeechImpairment: hasImpairment,
                            speechConditionId: hasImpairment ? prev.speechConditionId : '',
                            speechConditionSeverity: hasImpairment ? prev.speechConditionSeverity : 'mild',
                            speechConditionNotes: hasImpairment ? prev.speechConditionNotes : '',
                            speechConditionResearchConsent: hasImpairment ? prev.speechConditionResearchConsent : false,
                          }))
                        }}
                      >
                        <SelectTrigger className="border-border">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No speech impairment</SelectItem>
                          <SelectItem value="yes">Yes, I have a speech impairment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.hasSpeechImpairment && (
                      <>
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="speech-condition" className="text-sm font-medium">Condition</Label>
                            <Select value={formData.speechConditionId} onValueChange={(value) => handleInputChange('speechConditionId', value)}>
                              <SelectTrigger className="border-border">
                                <SelectValue placeholder="Select your condition" />
                              </SelectTrigger>
                              <SelectContent>
                                {speechConditions.map((condition) => (
                                  <SelectItem key={condition.id} value={condition.id}>
                                    {condition.condition_name.replace('_', ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="severity" className="text-sm font-medium">Severity</Label>
                            <Select
                              value={formData.speechConditionSeverity}
                              onValueChange={(value) => handleInputChange('speechConditionSeverity', value)}
                            >
                              <SelectTrigger className="border-border">
                                <SelectValue placeholder="Select severity" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mild">Mild</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="severe">Severe</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="research-consent" className="text-sm font-medium">Research Contact</Label>
                          <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 cursor-pointer">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={formData.speechConditionResearchConsent}
                              onChange={(e) => setFormData((prev) => ({ ...prev, speechConditionResearchConsent: e.target.checked }))}
                            />
                            <span className="text-sm text-muted-foreground">
                              I am willing to be contacted about speech impairment research opportunities.
                            </span>
                          </label>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                          <Textarea
                            id="notes"
                            placeholder="Optional details that may help us understand your needs"
                            value={formData.speechConditionNotes}
                            onChange={(e) => setFormData((prev) => ({ ...prev, speechConditionNotes: e.target.value }))}
                            className="border-border"
                            rows={3}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-3 my-6 rounded-lg bg-muted/50 border border-border p-4">
                    <div className="space-y-3">
                      {consents.map((document) => (
                        <label key={document.id} className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={acceptedConsentIds.includes(document.id)}
                            onChange={(e) => toggleConsent(document.id, e.target.checked)}
                          />
                          <span className="text-sm text-foreground">
                            I agree to{' '}
                            <Link href={document.document_url} className="font-medium text-primary hover:underline" onClick={handleReturnToStep2}>
                              {document.title}
                            </Link>
                            {document.version ? ` (${document.version})` : ''}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 border-border"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit"
                      className="flex-1 bg-primary hover:bg-primary/90"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating...' : 'Create Account'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle>Welcome to CorpusWeave!</CardTitle>
                <CardDescription>Your account has been created</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 border border-border text-center">
                  <p className="text-sm font-medium text-foreground mb-1">{formData.name}</p>
                  <p className="text-xs text-muted-foreground">{formData.email}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-foreground font-medium">What&apos;s next?</p>
                  <ul className="space-y-1 text-muted-foreground text-xs">
                    <li>✓ Complete your profile</li>
                    <li>✓ Verify your email</li>
                    <li>✓ Start your first task</li>
                    <li>✓ Earn your first reward</li>
                  </ul>
                </div>

                <Button 
                  onClick={() => window.location.href = '/onboarding'}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Continue to Onboarding
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/signin" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
