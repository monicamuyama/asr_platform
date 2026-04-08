'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, Headphones, DollarSign, Globe, Users, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-teal font-bold text-white">
                CW
              </div>
              <h1 className="text-2xl font-bold text-foreground">CorpusWeave</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-4 bg-primary/20 text-primary border-0">Community-Led Speech Data</Badge>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Build Inclusive Speech Data Together
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join a global community of language enthusiasts. Record, validate, and transcribe speech across multiple languages. Earn rewards while supporting language diversity and accessibility.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Start Contributing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-border">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">150K+</p>
                <p className="text-muted-foreground mt-2">Recordings</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">12</p>
                <p className="text-muted-foreground mt-2">Languages</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">2.3K</p>
                <p className="text-muted-foreground mt-2">Contributors</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">2.3M</p>
                <p className="text-muted-foreground mt-2">Points Earned</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-foreground">How It Works</h3>
              <p className="text-muted-foreground mt-4">Three simple ways to contribute</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-border">
                <CardContent className="pt-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Mic className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h4 className="text-xl font-semibold text-foreground mb-2">Record</h4>
                  <p className="text-muted-foreground">
                    Read sentences aloud and submit your audio. Earn 25-100 points per recording.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Headphones className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h4 className="text-xl font-semibold text-foreground mb-2">Validate</h4>
                  <p className="text-muted-foreground">
                    Review submissions and rate quality. Earn 50-200 points per validation task.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <DollarSign className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h4 className="text-xl font-semibold text-foreground mb-2">Earn</h4>
                  <p className="text-muted-foreground">
                    Accumulate points with every contribution. Redeem at 5,000 points for rewards.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h3 className="text-3xl font-bold text-foreground text-center mb-12">Why CorpusWeave</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Multi-Language Support</h4>
                  <p className="text-muted-foreground">Contribute in 12+ languages including African languages often underrepresented in AI.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Community Driven</h4>
                  <p className="text-muted-foreground">Vote on submissions and shape the dataset together with thousands of contributors.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <TrendingUp className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Fair Rewards</h4>
                  <p className="text-muted-foreground">Transparent point system. Your contributions are valued and fairly rewarded.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Headphones className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Accessibility First</h4>
                  <p className="text-muted-foreground">Optimized for low bandwidth. Works on any device including mobile phones.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl bg-gradient-to-r from-primary/20 to-accent-teal/20 rounded-2xl p-12 border border-primary/30 text-center">
            <h3 className="text-3xl font-bold text-foreground mb-4">Ready to Make an Impact?</h3>
            <p className="text-muted-foreground mb-8">Start contributing to inclusive speech data today.</p>
            <Link href="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Join CorpusWeave Now
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-muted/30 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <h4 className="font-semibold text-foreground mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground">Dashboard</a></li>
                  <li><a href="#" className="hover:text-foreground">Pricing</a></li>
                  <li><a href="#" className="hover:text-foreground">Features</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-4">Community</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground">Guidelines</a></li>
                  <li><a href="#" className="hover:text-foreground">Forum</a></li>
                  <li><a href="#" className="hover:text-foreground">Support</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-4">Resources</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground">Documentation</a></li>
                  <li><a href="#" className="hover:text-foreground">Blog</a></li>
                  <li><a href="#" className="hover:text-foreground">FAQ</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                  <li><a href="#" className="hover:text-foreground">Terms</a></li>
                  <li><a href="/donate" className="hover:text-foreground">Donate</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
              <p>&copy; 2025 CorpusWeave. Building inclusive speech data for everyone.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
