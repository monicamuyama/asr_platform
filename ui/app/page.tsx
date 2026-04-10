'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Mic, Headphones, FileText, Trophy, Globe, Heart, BookOpen, Star
} from 'lucide-react'

export default function HomePage() {
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
              <Link href="/donate">
                <Button variant="ghost" size="sm">Support</Button>
              </Link>
              <Link href="/data-dictionary">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Docs</Button>
              </Link>
              <Link href="/signin">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-primary hover:bg-primary/90">Get Started</Button>
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
              Build Inclusive Speech Data Together
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Join a global community of language enthusiasts. Record, validate, and transcribe speech across multiple languages. Earn points while supporting language diversity and accessibility.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Link href="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90">Start Contributing</Button>
              </Link>
              <Link href="/data-dictionary">
                <Button size="lg" variant="outline" className="border-border gap-2">
                  <BookOpen className="h-4 w-4" />
                  Learn More
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
                <p className="text-muted-foreground mt-2">Points Earned</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-primary">1,240</p>
                <p className="text-muted-foreground mt-2">Active Contributors</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-primary">45K+</p>
                <p className="text-muted-foreground mt-2">Audio Samples</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-primary">6</p>
                <p className="text-muted-foreground mt-2">Languages Supported</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h3 className="mb-8 text-3xl font-bold tracking-tight text-foreground text-center">How It Works</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-border hover:shadow-md transition">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-2">Record</h4>
                <p className="text-muted-foreground">
                  Read sentences aloud and submit your audio. Earn 25-100 points per recording.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-md transition">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Headphones className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-2">Validate</h4>
                <p className="text-muted-foreground">
                  Review submissions and rate quality. Earn 50-200 points per validation task.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-md transition">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-2">Earn</h4>
                <p className="text-muted-foreground">
                  Accumulate points with every contribution. Redeem at 5,000 points for rewards.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section className="mb-16">
          <h3 className="mb-8 text-3xl font-bold tracking-tight text-foreground text-center">Why Join CorpusWeave?</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-foreground">Global Community</h4>
                </div>
                <p className="text-muted-foreground">Connect with language enthusiasts from around the world.</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Star className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-foreground">Fair Rewards</h4>
                </div>
                <p className="text-muted-foreground">Transparent point system. Your contributions are fairly rewarded.</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Heart className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-foreground">Make an Impact</h4>
                </div>
                <p className="text-muted-foreground">Support language diversity and accessibility for all.</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-foreground">Learn & Grow</h4>
                </div>
                <p className="text-muted-foreground">Access resources and improve your language skills.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="rounded-2xl bg-gradient-to-r from-primary/10 via-transparent to-accent-teal/10 p-12 text-center border border-border">
          <h3 className="mb-4 text-3xl font-bold text-foreground">Ready to Make a Difference?</h3>
          <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
            Join thousands of contributors building the future of inclusive speech data.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90">Create Account</Button>
            </Link>
            <Link href="/donate">
              <Button size="lg" variant="outline" className="border-border">Support Our Mission</Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
