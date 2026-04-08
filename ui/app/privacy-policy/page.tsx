'use client'

import Link from 'next/link'
import { ArrowLeft, ShieldCheck, FileText, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/signup" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-4 w-4" />
          Back to sign up
        </Link>

        <div className="mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Privacy and consent
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
          <p className="max-w-2xl text-muted-foreground">
            This page explains what we collect during account creation, why we collect it, and how it supports inclusive speech data research.
          </p>
          <p className="text-xs text-muted-foreground">Effective date: April 8, 2026 | Version: v1.0</p>
        </div>

        <div className="grid gap-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                What we collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>During sign up, we collect your name, email, password, selected language, country, and consent choices.</p>
              <p>If you choose to disclose a speech impairment, we also collect the selected condition, severity, and any optional notes you provide.</p>
              <p>We keep demographic and accessibility data separate from your direct account identity where possible.</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>How long data is retained</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Account records are retained while your account is active and for a limited period needed for legal, fraud-prevention, and research-audit purposes.</p>
              <p>Research metadata linked to accepted corpus contributions may be retained for reproducibility and dataset quality audits.</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                How we use it
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>We use account and profile data to create your contributor account, issue a privacy-preserving speaker profile, and route tasks that fit your abilities.</p>
              <p>Condition and accessibility information helps us design better research workflows for people with speech impairment.</p>
              <p>We do not sell personal data.</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Your rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>You can request correction of account profile data through Settings or support channels.</p>
              <p>You can request account deletion. Some de-identified dataset records may remain where legally permitted for scientific integrity.</p>
              <p>You can withdraw optional research-contact preference at any time.</p>
            </CardContent>
          </Card>

          <Card className="border-border" id="research-consent">
            <CardHeader>
              <CardTitle>Related policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                For terms governing research participation, contribution use, and withdrawal handling, read the dedicated Research Consent document.
              </p>
              <Link href="/research-consent" className="text-primary hover:underline font-medium">
                Open Research Consent
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>If you have questions about this policy or your data, contact the project maintainers through the support channel in the app.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/signup">
                  <Button className="bg-primary hover:bg-primary/90">Return to sign up</Button>
                </Link>
                <Link href="/signin">
                  <Button variant="outline" className="border-border">Sign in</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
