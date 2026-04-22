'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/components/language-provider'
import { 
  Mic, Headphones, FileText, Trophy, Globe, Heart, BookOpen, Star
} from 'lucide-react'

export default function HomePage() {
  const { strings } = useLanguage()
  const landing = strings.landing

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
              <Link href="/donate">
                <Button variant="ghost" size="sm">{landing.header.support}</Button>
              </Link>
              <Link href="/data-dictionary">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">{landing.header.docs}</Button>
              </Link>
              <Link href="/signin">
                <Button variant="ghost" size="sm">{strings.navigation.signIn}</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-primary hover:bg-primary/90">{strings.navigation.getStarted}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="mb-16">
          <div className="space-y-6 text-center">
            <h2 className="text-5xl font-bold tracking-tight text-foreground">
              {landing.hero.title}
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              {landing.hero.subtitle}
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Link href="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90">{landing.hero.startContributing}</Button>
              </Link>
              <Link href="/data-dictionary">
                <Button size="lg" variant="outline" className="border-border gap-2">
                  <BookOpen className="h-4 w-4" />
                  {landing.hero.learnMore}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Impact Metrics */}
        <section className="mb-16">
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="border-border">
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-primary">2.3M</p>
                <p className="text-muted-foreground mt-2">{landing.metrics.pointsEarned}</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-primary">1,240</p>
                <p className="text-muted-foreground mt-2">{landing.metrics.activeContributors}</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-primary">45K+</p>
                <p className="text-muted-foreground mt-2">{landing.metrics.audioSamples}</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-primary">6</p>
                <p className="text-muted-foreground mt-2">{landing.metrics.languagesSupported}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h3 className="mb-8 text-3xl font-bold tracking-tight text-foreground text-center">{landing.how.title}</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-border hover:shadow-md transition">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-2">{landing.how.recordTitle}</h4>
                <p className="text-muted-foreground">
                  {landing.how.recordDescription}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-md transition">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Headphones className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-2">{landing.how.validateTitle}</h4>
                <p className="text-muted-foreground">
                  {landing.how.validateDescription}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-md transition">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-2">{landing.how.earnTitle}</h4>
                <p className="text-muted-foreground">
                  {landing.how.earnDescription}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section className="mb-16">
          <h3 className="mb-8 text-3xl font-bold tracking-tight text-foreground text-center">{landing.why.title}</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-foreground">{landing.why.globalCommunityTitle}</h4>
                </div>
                <p className="text-muted-foreground">{landing.why.globalCommunityDescription}</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Star className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-foreground">{landing.why.fairRewardsTitle}</h4>
                </div>
                <p className="text-muted-foreground">{landing.why.fairRewardsDescription}</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Heart className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-foreground">{landing.why.impactTitle}</h4>
                </div>
                <p className="text-muted-foreground">{landing.why.impactDescription}</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-foreground">{landing.why.learnGrowTitle}</h4>
                </div>
                <p className="text-muted-foreground">{landing.why.learnGrowDescription}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="rounded-2xl bg-gradient-to-r from-primary/10 via-transparent to-accent-teal/10 p-12 text-center border border-border">
          <h3 className="mb-4 text-3xl font-bold text-foreground">{landing.cta.title}</h3>
          <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
            {landing.cta.subtitle}
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90">{landing.cta.createAccount}</Button>
            </Link>
            <Link href="/donate">
              <Button size="lg" variant="outline" className="border-border">{landing.cta.supportMission}</Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
