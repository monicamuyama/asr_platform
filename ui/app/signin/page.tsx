'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Mail, Lock, ArrowLeft } from 'lucide-react'
import { API_BASE } from '@/lib/api'
import { setSessionUserId, setSessionToken } from '@/lib/auth'
import { useLanguage } from '@/components/language-provider'

export default function SignInPage() {
  const router = useRouter()
  const { strings } = useLanguage()
  const signin = strings.signin
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { detail?: string }
        throw new Error(payload.detail ?? 'Sign in failed')
      }

      const user = (await response.json()) as { 
        user?: { id: string; onboarding_completed: boolean }
        token?: { access_token: string; token_type: string; expires_at: string }
      }
      
      if (user.user?.id) {
        setSessionUserId(user.user.id)
      }
      
      if (user.token?.access_token) {
        setSessionToken(user.token.access_token, user.token.token_type, user.token.expires_at)
      }
      
      if (user.user?.onboarding_completed) {
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.navigation.signIn)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition mb-8">
            <ArrowLeft className="h-4 w-4" />
            {signin.backToHome}
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-teal font-bold text-white">
              CW
            </div>
            <h1 className="text-2xl font-bold text-foreground">{strings.app.brand}</h1>
          </div>
          <p className="text-muted-foreground text-sm">{signin.subtitle}</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>{signin.title}</CardTitle>
            <CardDescription>{signin.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">{signin.emailAddress}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">{signin.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 border-border"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  {signin.rememberMe}
                </label>
                <Link href="#" className="text-sm text-primary hover:underline">
                  {signin.forgotPassword}
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? signin.signingIn : strings.navigation.signIn}
              </Button>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">{signin.orContinueWith}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="border-border">
                Google
              </Button>
              <Button variant="outline" className="border-border">
                GitHub
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {signin.dontHaveAccount}{' '}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                {signin.signUp}
              </Link>
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground text-center">
            {signin.supportNote}
          </p>
        </div>
      </div>
    </div>
  )
}
