'use client'

import Link from 'next/link'
import { ArrowLeft, Microscope, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResearchConsentPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/signup" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-4 w-4" />
          Back to sign up
        </Link>

        <div className="mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Microscope className="h-3.5 w-3.5" />
            Research participation
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Research Consent</h1>
          <p className="max-w-2xl text-muted-foreground">
            This consent describes how your contributions may be used for speech and accessibility research.
          </p>
          <p className="text-xs text-muted-foreground">Effective date: April 8, 2026 | Version: v1.0</p>
        </div>

        <div className="grid gap-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                What you are agreeing to
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Your speech contributions and associated metadata may be used to train, evaluate, and audit speech systems.</p>
              <p>Research outputs may include aggregate statistics and de-identified datasets used by approved research teams.</p>
              <p>Your legal identity is not published as part of corpus release metadata.</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Sensitive and accessibility information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>If you provide speech-impairment details, they may be used to improve accessibility-focused model performance and fairness analysis.</p>
              <p>Only authorized workflows should access this data, and access should follow least-privilege principles.</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Voluntary participation and withdrawal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Participation is voluntary. You can stop contributing at any time.</p>
              <p>You may request withdrawal of future use for identifiable profile data, subject to legal and scientific integrity constraints for already released de-identified datasets.</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Contact and questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>For concerns or clarification about this consent, contact project maintainers through the support channel in the application.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/signup">
                  <Button className="bg-primary hover:bg-primary/90">Return to sign up</Button>
                </Link>
                <Link href="/privacy-policy">
                  <Button variant="outline" className="border-border">View Privacy Policy</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
