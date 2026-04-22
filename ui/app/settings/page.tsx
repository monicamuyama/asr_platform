'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'
import { User, Lock, Bell, DollarSign, Shield, LogOut, ArrowLeft, Globe } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { displayLanguageOptions } from '@/lib/localization'
import {
  getLanguages,
  getUserById,
  getUserLanguagePreferencesById,
  getUserProfileById,
  getUserWalletById,
  updateUserById,
  updateUserLanguagePreferencesById,
  updateUserProfileById,
  type Language,
  type UserLanguagePreferenceResponse,
  type UserProfileResponse,
  type UserResponse,
  type WalletResponse,
} from '@/lib/api'
import { clearSession, getSessionUserId } from '@/lib/auth'

export default function SettingsPage() {
  const router = useRouter()
  const { language, setLanguage, strings } = useLanguage()
  const [activeTab, setActiveTab] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<UserResponse | null>(null)
  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [languages, setLanguages] = useState<Language[]>([])
  const [languagePreferences, setLanguagePreferences] = useState<UserLanguagePreferenceResponse[]>([])
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    primaryLanguage: '',
    bio: '',
    country: '',
    preferredContributionType: 'recording',
    hasSpeechImpairment: false,
    impairmentType: '',
  })
  const [secondaryLanguageIds, setSecondaryLanguageIds] = useState<string[]>([])

  useEffect(() => {
    const userId = getSessionUserId()
    if (!userId) {
      router.replace('/signin')
      return
    }

    const loadSettingsData = async () => {
      setIsLoading(true)
      setError('')
      setSaveMessage('')
      try {
        const [userData, profileData, walletData, languageData, languagePreferenceData] = await Promise.all([
          getUserById(userId),
          getUserProfileById(userId),
          getUserWalletById(userId),
          getLanguages(),
          getUserLanguagePreferencesById(userId),
        ])
        setUser(userData)
        setProfile(profileData)
        setWallet(walletData)
        setLanguages(languageData)
        setLanguagePreferences(languagePreferenceData)

        const primaryLanguagePreference = languagePreferenceData.find((pref) => pref.is_primary_language) ?? languagePreferenceData[0]
        const primaryLanguageFromPreference = languageData.find((language) => language.id === primaryLanguagePreference?.language_id)
        const primaryLanguageFromProfile = languageData.find((language) => language.language_name === (profileData.primary_language ?? ''))
        const resolvedPrimaryLanguageId = primaryLanguageFromPreference?.id ?? primaryLanguageFromProfile?.id ?? ''

        const resolvedSecondaryLanguageIds = languagePreferenceData
          .filter((pref) => !pref.is_primary_language)
          .map((pref) => pref.language_id)

        setFormData({
          fullName: userData.full_name,
          email: userData.email,
          primaryLanguage: resolvedPrimaryLanguageId,
          bio: profileData.bio ?? '',
          country: profileData.country ?? '',
          preferredContributionType: profileData.preferred_contribution_type ?? 'recording',
          hasSpeechImpairment: profileData.has_speech_impairment,
          impairmentType: profileData.impairment_type ?? '',
        })
        setSecondaryLanguageIds(resolvedSecondaryLanguageIds)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load account settings from backend.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadSettingsData()
  }, [router])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlError = params.get('error')
    if (urlError) {
      setError(urlError)
    }
  }, [])

  const handleSave = async () => {
    const userId = getSessionUserId()
    if (!userId) {
      router.replace('/signin')
      return
    }

    setError('')
    setSaveMessage('')

    if (!formData.fullName.trim()) {
      setError('Full name is required.')
      return
    }
    if (!formData.email.trim()) {
      setError('Email is required.')
      return
    }
    if (!formData.primaryLanguage) {
      setError('Primary Indigenous Language is required.')
      return
    }
    if (formData.hasSpeechImpairment && !formData.impairmentType.trim()) {
      setError('Impairment type is required when speech impairment is enabled.')
      return
    }

    setIsSaving(true)
    try {
      const selectedPrimaryLanguage = languages.find((language) => language.id === formData.primaryLanguage)
      if (!selectedPrimaryLanguage) {
        throw new Error('Primary language selection is invalid. Please choose a valid language.')
      }

      const uniqueSecondaryLanguageIds = Array.from(new Set(secondaryLanguageIds.filter((id) => id !== formData.primaryLanguage)))
      const updatedLanguagePreferencesPayload = [
        {
          language_id: formData.primaryLanguage,
          is_primary_language: true,
          can_record: true,
          can_transcribe: true,
          can_validate: true,
          proficiency_level: 'native' as const,
        },
        ...uniqueSecondaryLanguageIds.map((languageId) => ({
          language_id: languageId,
          is_primary_language: false,
          can_record: true,
          can_transcribe: true,
          can_validate: true,
          proficiency_level: 'fluent' as const,
        })),
      ]

      const [updatedUser, updatedProfile, updatedLanguagePreferences] = await Promise.all([
        updateUserById(userId, {
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
        }),
        updateUserProfileById(userId, {
          country: formData.country.trim() || '',
          primary_language: selectedPrimaryLanguage.language_name,
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
        updateUserLanguagePreferencesById(userId, updatedLanguagePreferencesPayload),
      ])

      setUser(updatedUser)
      setProfile(updatedProfile)
      setLanguagePreferences(updatedLanguagePreferences)
      setSaveMessage('Profile saved successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = () => {
    clearSession()
    router.push('/signin')
  }

  if (isLoading) {
    return <div className="min-h-screen bg-background" />
  }

  const indigenousLanguages = languages.filter((language) => language.is_low_resource)
  const secondaryLanguageChoices = languages.filter((language) => language.id !== formData.primaryLanguage)

  const toggleSecondaryLanguage = (languageId: string, enabled: boolean) => {
    setSecondaryLanguageIds((current) => {
      if (enabled) {
        return current.includes(languageId) ? current : [...current, languageId]
      }
      return current.filter((id) => id !== languageId)
    })
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
              <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">CorpusWeave</h1>
            </div>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <Link href="/admin">
                <Button variant="outline" size="sm" className="border-border">Admin Panel</Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">{strings.settings.title}</h2>
          <p className="text-muted-foreground mt-2">{strings.settings.subtitle}</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {saveMessage && <p className="mt-2 text-sm text-foreground">{saveMessage}</p>}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-5">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{strings.settings.profileTab}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">{strings.settings.securityTab}</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">{strings.settings.paymentsTab}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{strings.settings.notificationsTab}</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{strings.settings.languageTab}</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>{strings.settings.profileInformation}</CardTitle>
                <CardDescription>{strings.settings.updateProfileDetails}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-2xl">
                    {(user?.full_name ?? 'C').slice(0, 2).toUpperCase()}
                  </div>
                  <Button variant="outline" className="border-border">
                    Change Avatar
                  </Button>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">{strings.settings.fullName}</Label>
                  <Input
                    id="name"
                    value={formData.fullName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="border-border"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">{strings.settings.emailAddress}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    <Badge variant="outline" className="mr-2">Verified</Badge>
                    {user?.id ? `User ID: ${user.id}` : 'Verification data not available'}
                  </p>
                </div>

                {/* Languages */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{strings.settings.primaryLanguage}</Label>
                  <Select
                    value={formData.primaryLanguage}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, primaryLanguage: value }))}
                  >
                    <SelectTrigger className="border-border">
                      <SelectValue placeholder="Select your primary indigenous language" />
                    </SelectTrigger>
                    <SelectContent>
                      {indigenousLanguages.map((language) => (
                        <SelectItem key={language.id} value={language.id}>
                          {language.language_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">This is your default contribution language and leaderboard language.</p>
                </div>

                <div className="space-y-3 rounded-lg border border-border p-4">
                  <Label className="text-sm font-medium">{strings.settings.secondaryLanguages}</Label>
                  <p className="text-xs text-muted-foreground">Add other languages you can contribute in. English and Swahili belong here as additional languages.</p>
                  <div className="space-y-3">
                    {secondaryLanguageChoices.map((language) => (
                      <div key={language.id} className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{language.language_name}</p>
                          <p className="text-xs text-muted-foreground">{language.is_low_resource ? 'Indigenous language' : 'Additional language'}</p>
                        </div>
                        <Switch
                          checked={secondaryLanguageIds.includes(language.id)}
                          onCheckedChange={(checked) => toggleSecondaryLanguage(language.id, checked)}
                        />
                      </div>
                    ))}
                    {secondaryLanguageChoices.length === 0 && (
                      <p className="text-xs text-muted-foreground">Select a primary language first to configure secondary languages.</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium">{strings.settings.country}</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                      className="border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{strings.settings.preferredContributionType}</Label>
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
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{strings.settings.speechImpairment}</Label>
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

                {formData.hasSpeechImpairment && (
                  <div className="space-y-2">
                    <Label htmlFor="impairment-type" className="text-sm font-medium">{strings.settings.impairmentType}</Label>
                    <Input
                      id="impairment-type"
                      value={formData.impairmentType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, impairmentType: e.target.value }))}
                      className="border-border"
                      placeholder="e.g., stutter"
                    />
                  </div>
                )}

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium">{strings.settings.bio}</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    className="border-border resize-none"
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleSave}
                  className="bg-primary hover:bg-primary/90"
                  disabled={isSaving}
                >
                  {isSaving ? strings.common.saving : strings.common.saveChanges}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Language Tab */}
          <TabsContent value="language" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {strings.settings.languageTitle}
                </CardTitle>
                <CardDescription>{strings.settings.languageDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{strings.common.displayLanguage}</Label>
                  <Select value={language} onValueChange={(value) => setLanguage(value as typeof language)}>
                    <SelectTrigger className="border-border">
                      <SelectValue placeholder={strings.common.selectDisplayLanguage} />
                    </SelectTrigger>
                    <SelectContent>
                      {displayLanguageOptions.map((option) => (
                        <SelectItem key={option.code} value={option.code}>
                          {option.label}
                          {option.code === language ? ` (${strings.common.current})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {strings.settings.languageHelp}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <p className="text-sm font-medium text-foreground">{strings.common.storedLocally}</p>
                  <p className="text-xs text-muted-foreground">This choice updates the interface language on this device immediately.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password regularly for security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-sm font-medium">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="••••••••"
                    className="border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    className="border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    className="border-border"
                  />
                </div>
                <Button className="bg-primary hover:bg-primary/90">Update Password</Button>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Status: Disabled</p>
                    <p className="text-sm text-muted-foreground">Secure your account with 2FA</p>
                  </div>
                  <Button variant="outline" className="border-border">Enable 2FA</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Manage devices accessing your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Session tracking is not available from the backend yet.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Manage how you receive payouts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preferred Payout Method</Label>
                  <Select defaultValue="bank-transfer">
                    <SelectTrigger className="border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="mobile-money">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <p className="text-sm font-medium text-foreground mb-2">Bank Account Details</p>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Points Balance</p>
                      <p className="font-medium text-foreground">{wallet ? `${wallet.balance.toFixed(2)} ${wallet.currency}` : '0.00 PTS'}</p>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="border-border">Update Bank Details</Button>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>View your past payouts</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Payout history endpoint is not available from the backend yet.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Control what emails you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'New tasks available', desc: 'Get notified when new tasks match your languages' },
                  { label: 'Validation feedback', desc: 'Updates on validations of your submissions' },
                  { label: 'Tips received', desc: 'When other users send you tips' },
                  { label: 'Payout processed', desc: 'Confirmations of your payouts' },
                  { label: 'Product updates', desc: 'New features and improvements' },
                  { label: 'Weekly digest', desc: 'Summary of your activity' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={idx < 4} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Push Notifications</CardTitle>
                <CardDescription>Manage mobile notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Enable push notifications</p>
                    <p className="text-sm text-muted-foreground">Important updates on your device</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Communication Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Marketing emails</p>
                    <p className="text-sm text-muted-foreground">Promotions and announcements</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Danger Zone */}
        <Card className="border-destructive mt-12">
          <CardHeader className="bg-destructive/5">
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between pb-4 border-b border-destructive/20">
              <div>
                <p className="font-medium text-foreground">Sign out</p>
                <p className="text-sm text-muted-foreground">End your current session</p>
              </div>
              <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
            <div>
              <p className="font-medium text-foreground mb-2">Delete Account</p>
              <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
