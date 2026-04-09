'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  adminUpdateUserLanguageCapabilities,
  adminUpdateUserRole,
  getLanguages,
  listUsersForAdmin,
  type Language,
  type UserResponse,
} from '@/lib/api'
import { clearSession, getSessionUserId } from '@/lib/auth'

export default function AdminPage() {
  const router = useRouter()
  const [adminUserId, setAdminUserId] = useState<string | null>(null)
  const [users, setUsers] = useState<UserResponse[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [role, setRole] = useState<'contributor' | 'expert' | 'admin'>('contributor')
  const [languageId, setLanguageId] = useState('')
  const [canRecord, setCanRecord] = useState(false)
  const [canTranscribe, setCanTranscribe] = useState(false)
  const [canValidate, setCanValidate] = useState(false)
  const [isPrimaryLanguage, setIsPrimaryLanguage] = useState(false)
  const [proficiencyLevel, setProficiencyLevel] = useState<'native' | 'fluent' | 'intermediate' | 'beginner'>('native')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedUser = useMemo(() => users.find((user) => user.id === selectedUserId) ?? null, [selectedUserId, users])

  useEffect(() => {
    const sessionId = getSessionUserId()
    if (!sessionId) {
      clearSession()
      router.replace('/signin')
      return
    }
    setAdminUserId(sessionId)

    const loadData = async () => {
      try {
        const [userData, languageData] = await Promise.all([
          listUsersForAdmin(sessionId),
          getLanguages(),
        ])
        setUsers(userData)
        setLanguages(languageData)
        setSelectedUserId((current) => current || userData[0]?.id || '')
        setLanguageId((current) => current || languageData[0]?.id || '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin data.')
      }
    }

    void loadData()
  }, [router])

  useEffect(() => {
    if (selectedUser) {
      setRole((selectedUser.role as 'contributor' | 'expert' | 'admin') ?? 'contributor')
    }
  }, [selectedUser])

  const saveRole = async () => {
    if (!adminUserId || !selectedUserId) {
      return
    }
    try {
      const updated = await adminUpdateUserRole(selectedUserId, { admin_user_id: adminUserId, role })
      setUsers((prev) => prev.map((user) => (user.id === updated.id ? updated : user)))
      setMessage('Role updated successfully.')
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role.')
      setMessage('')
    }
  }

  const saveCapabilities = async () => {
    if (!adminUserId || !selectedUserId || !languageId) {
      return
    }
    try {
      await adminUpdateUserLanguageCapabilities(selectedUserId, {
        admin_user_id: adminUserId,
        language_id: languageId,
        is_primary_language: isPrimaryLanguage,
        can_record: canRecord,
        can_transcribe: canTranscribe,
        can_validate: canValidate,
        proficiency_level: proficiencyLevel,
      })
      setMessage('Language capabilities updated successfully.')
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update language capabilities.')
      setMessage('')
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Access Control</h1>
            <p className="text-sm text-muted-foreground">Manage user roles and language capabilities.</p>
          </div>
          <Link href="/settings">
            <Button variant="outline" className="border-border">Back to Settings</Button>
          </Link>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-foreground">{message}</p>}

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Select User</CardTitle>
            <CardDescription>Choose the account to manage.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="border-border">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} · {user.email} · {user.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Role Assignment</CardTitle>
            <CardDescription>Promote or demote access role.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as 'contributor' | 'expert' | 'admin')}>
                <SelectTrigger className="border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contributor">Contributor</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="button" className="bg-primary hover:bg-primary/90" onClick={saveRole} disabled={!selectedUserId}>Save Role</Button>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Language Capability Assignment</CardTitle>
            <CardDescription>Control recording/transcription/validation permissions by language.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={languageId} onValueChange={setLanguageId}>
                <SelectTrigger className="border-border"><SelectValue placeholder="Select language" /></SelectTrigger>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem key={language.id} value={language.id}>{language.language_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="can-record">Can Record</Label>
                <Switch id="can-record" checked={canRecord} onCheckedChange={setCanRecord} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="can-transcribe">Can Transcribe</Label>
                <Switch id="can-transcribe" checked={canTranscribe} onCheckedChange={setCanTranscribe} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="can-validate">Can Validate</Label>
                <Switch id="can-validate" checked={canValidate} onCheckedChange={setCanValidate} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="is-primary">Primary Language</Label>
                <Switch id="is-primary" checked={isPrimaryLanguage} onCheckedChange={setIsPrimaryLanguage} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Proficiency Level</Label>
              <Select value={proficiencyLevel} onValueChange={(value) => setProficiencyLevel(value as 'native' | 'fluent' | 'intermediate' | 'beginner')}>
                <SelectTrigger className="border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="native">Native</SelectItem>
                  <SelectItem value="fluent">Fluent</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="button" className="bg-primary hover:bg-primary/90" onClick={saveCapabilities} disabled={!selectedUserId || !languageId}>
              Save Language Capabilities
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
