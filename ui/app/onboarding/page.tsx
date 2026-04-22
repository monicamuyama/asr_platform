'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Globe, UserRound, Accessibility, Sparkles } from 'lucide-react'
import {
  getLanguages,
  getUserById,
  getUserProfileById,
  updateUserById,
  updateUserProfileById,
  type Language,
} from '@/lib/api'
import {
  getSessionUserId,
} from '@/lib/auth'
import { useLanguage } from '@/components/language-provider'

export default function OnboardingPage() {
  const router = useRouter()
  const { strings } = useLanguage()
  const onboarding = strings.onboarding
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [languages, setLanguages] = useState<Language[]>([])
  const [formData, setFormData] = useState({
    fullName: '',
    country: '',
    primaryLanguage: '',
    preferredContributionType: 'recording',
    hasSpeechImpairment: false,
    impairmentType: '',
    bio: '',
  })

  const userId = useMemo(() => getSessionUserId(), [])

  useEffect(() => {
    if (!userId) {
      router.replace('/signin')
      return
    }
    const loadOnboardingData = async () => {
      setIsLoading(true)
      setError('')
      try {
        const [user, profile, languageData] = await Promise.all([
          getUserById(userId),
          getUserProfileById(userId),
          getLanguages(),
        ])

        if (user.onboarding_completed) {
          router.replace('/dashboard')
          return
        }

        setLanguages(languageData)
        setFormData({
          fullName: user.full_name,
          country: profile.country ?? '',
          primaryLanguage: profile.primary_language ?? '',
          preferredContributionType: profile.preferred_contribution_type ?? 'recording',
          hasSpeechImpairment: profile.has_speech_impairment,
          impairmentType: profile.impairment_type ?? '',
          bio: profile.bio ?? '',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : onboarding.errorLoad)
      } finally {
        setIsLoading(false)
      }
    }

    void loadOnboardingData()
  }, [router, userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) {
      return
    }

    setError('')

    if (!formData.fullName.trim()) {
      setError(onboarding.errorName)
      return
    }
    if (!formData.primaryLanguage) {
      setError(onboarding.errorLanguage)
      return
    }
    if (!formData.country.trim()) {
      setError(onboarding.errorCountry)
      return
    }
    if (formData.hasSpeechImpairment && !formData.impairmentType.trim()) {
      setError(onboarding.errorImpairment)
      return
    }

    setIsSaving(true)

    try {
      await Promise.all([
        updateUserById(userId, {
          full_name: formData.fullName.trim(),
          onboarding_completed: true,
        }),
        updateUserProfileById(userId, {
          country: formData.country.trim(),
          primary_language: formData.primaryLanguage,
          preferred_contribution_type: formData.preferredContributionType as
            | 'recording'
            | 'validation'
            | 'transcription',
          has_speech_impairment: formData.hasSpeechImpairment,
          impairment_type: formData.hasSpeechImpairment
            ? formData.impairmentType.trim()
            : null,
          bio: formData.bio.trim() || null,
        }),
      ])

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : onboarding.errorSubmit)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-border">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">{onboarding.loadTitle}</p>
              <p className="text-sm text-muted-foreground">{onboarding.loadSubtitle}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <Card className="border-border">
          <CardHeader className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs text-primary font-medium">
              <Sparkles className="h-4 w-4" />
              {onboarding.setupBadge}
            </div>
            <CardTitle className="text-2xl">{onboarding.title}</CardTitle>
            <CardDescription>
              {onboarding.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="full-name">{onboarding.fullName}</Label>
                  <div className="relative">
                    <UserRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="full-name"
                      value={formData.fullName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                      className="pl-10 border-border"
                      placeholder={onboarding.fullNamePlaceholder}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">{onboarding.country}</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                    className="border-border"
                    placeholder={onboarding.countryPlaceholder}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary-language">{onboarding.primaryLanguage}</Label>
                  <Select
                    value={formData.primaryLanguage}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, primaryLanguage: value }))}
                  >
                    <SelectTrigger className="border-border">
                      <SelectValue placeholder={onboarding.selectLanguage} />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language.id} value={language.language_name}>
                          {language.language_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contribution-type">{onboarding.preferredContribution}</Label>
                  <Select
                    value={formData.preferredContributionType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, preferredContributionType: value }))
                    }
                  >
                    <SelectTrigger className="border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recording">{onboarding.recording}</SelectItem>
                      <SelectItem value="validation">{onboarding.validation}</SelectItem>
                      <SelectItem value="transcription">{onboarding.transcription}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="impairment-flag" className="flex items-center gap-2">
                    <Accessibility className="h-4 w-4" />
                    {onboarding.speechImpairment}
                  </Label>
                  <Select
                    value={formData.hasSpeechImpairment ? 'yes' : 'no'}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        hasSpeechImpairment: value === 'yes',
                        impairmentType: value === 'yes' ? prev.impairmentType : '',
                      }))
                    }
                  >
                    <SelectTrigger className="border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">{onboarding.no}</SelectItem>
                      <SelectItem value="yes">{onboarding.yes}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.hasSpeechImpairment && (
                <div className="space-y-2">
                  <Label htmlFor="impairment-type">{onboarding.impairmentType}</Label>
                  <Input
                    id="impairment-type"
                    value={formData.impairmentType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, impairmentType: e.target.value }))}
                    className="border-border"
                    placeholder={onboarding.impairmentTypePlaceholder}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="bio">{onboarding.bio}</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  className="border-border"
                  rows={4}
                  placeholder={onboarding.bioPlaceholder}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" />
                  {onboarding.settingsHint}
                </span>
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSaving}>
                {isSaving ? onboarding.savingProfile : onboarding.finish}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
