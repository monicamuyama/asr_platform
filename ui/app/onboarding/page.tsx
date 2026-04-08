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

export default function OnboardingPage() {
  const router = useRouter()
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
        setError(err instanceof Error ? err.message : 'Unable to load onboarding data.')
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
      setError('Please enter your full name.')
      return
    }
    if (!formData.primaryLanguage) {
      setError('Please choose a primary language.')
      return
    }
    if (!formData.country.trim()) {
      setError('Please enter your country.')
      return
    }
    if (formData.hasSpeechImpairment && !formData.impairmentType.trim()) {
      setError('Please provide your speech impairment type.')
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
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <Card className="border-border">
          <CardHeader className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs text-primary font-medium">
              <Sparkles className="h-4 w-4" />
              One-time setup
            </div>
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>
              This helps us personalize contribution tasks and support accessibility needs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <div className="relative">
                    <UserRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="full-name"
                      value={formData.fullName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                      className="pl-10 border-border"
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                    className="border-border"
                    placeholder="Uganda"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary-language">Primary Language</Label>
                  <Select
                    value={formData.primaryLanguage}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, primaryLanguage: value }))}
                  >
                    <SelectTrigger className="border-border">
                      <SelectValue placeholder="Select language" />
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
                  <Label htmlFor="contribution-type">Preferred Contribution</Label>
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
                      <SelectItem value="recording">Recording</SelectItem>
                      <SelectItem value="validation">Validation</SelectItem>
                      <SelectItem value="transcription">Transcription</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="impairment-flag" className="flex items-center gap-2">
                    <Accessibility className="h-4 w-4" />
                    Speech Impairment
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
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.hasSpeechImpairment && (
                <div className="space-y-2">
                  <Label htmlFor="impairment-type">Impairment Type</Label>
                  <Input
                    id="impairment-type"
                    value={formData.impairmentType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, impairmentType: e.target.value }))}
                    className="border-border"
                    placeholder="e.g., stutter"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  className="border-border"
                  rows={4}
                  placeholder="Tell the community how you want to contribute"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" />
                  You can update these later in Settings.
                </span>
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSaving}>
                {isSaving ? 'Saving profile...' : 'Finish Onboarding'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
