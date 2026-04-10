'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Heart, Globe, Users, TrendingUp, ArrowLeft, Check } from 'lucide-react'
import { getSessionUserId } from '@/lib/auth'

export default function DonatePage() {
  const router = useRouter()
  const [donationType, setDonationType] = useState('one-time')
  const [selectedAmount, setSelectedAmount] = useState(25)
  const [customAmount, setCustomAmount] = useState('')

  useEffect(() => {
    const userId = getSessionUserId()
    if (!userId) {
      router.replace('/signin')
    }
  }, [router])

  const donations = [10, 25, 50, 100, 250]

  const impactItems = [
    { amount: 10, impact: 'Supports 40 recordings in underrepresented languages' },
    { amount: 25, impact: 'Funds 100 hours of validation work by community members' },
    { amount: 50, impact: 'Enables infrastructure for 500+ new contributors' },
    { amount: 100, impact: 'Pays 10 contributors for a full week of contributions' },
    { amount: 250, impact: 'Covers operations for 1,000+ recordings in rare languages' },
  ]

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
            <Link href="/" className="ml-auto">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4">Support Inclusive Speech Data</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your donation helps us build high-quality speech datasets for underrepresented languages, making AI more inclusive for billions of people.
          </p>
        </div>

        <div className="mb-12 grid gap-8 md:grid-cols-2">
          {/* Donation Form */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Make a Donation</CardTitle>
              <CardDescription>Every contribution makes a difference</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={donationType} onValueChange={setDonationType}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="one-time">One-Time</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Select Amount</Label>
                <div className="grid grid-cols-2 gap-2">
                  {donations.map(amount => (
                    <button
                      key={amount}
                      onClick={() => setSelectedAmount(amount)}
                      className={`p-3 rounded-lg border-2 transition font-semibold ${
                        selectedAmount === amount
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-foreground hover:border-primary'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom" className="text-sm font-medium">Or enter custom amount</Label>
                <div className="flex gap-2">
                  <span className="text-muted-foreground py-2">$</span>
                  <Input
                    id="custom"
                    type="number"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="border-border"
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-2">You&apos;re donating:</p>
                <p className="text-3xl font-bold text-primary">
                  ${customAmount || selectedAmount}
                </p>
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90 h-12 text-base">
                <Heart className="h-4 w-4 mr-2" />
                Donate Now
              </Button>

              <div className="space-y-2 text-xs text-muted-foreground">
                <p>✓ Secure payment powered by Stripe</p>
                <p>✓ 100% of donations support our mission</p>
                <p>✓ Tax-deductible (501(c)(3) registered)</p>
              </div>
            </CardContent>
          </Card>

          {/* Impact */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Your Impact</CardTitle>
              <CardDescription>See how your donation helps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {impactItems.map(item => (
                  <div key={item.amount} className={`p-4 rounded-lg border-2 transition cursor-pointer ${
                    (customAmount ? parseInt(customAmount) : selectedAmount) >= item.amount
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}>
                    <p className="font-semibold text-foreground mb-2">${item.amount}</p>
                    <p className="text-sm text-muted-foreground">{item.impact}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-border">
            <CardContent className="pt-6 text-center">
              <p className="text-4xl font-bold text-primary mb-2">$125K</p>
              <p className="text-muted-foreground">Raised so far</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6 text-center">
              <p className="text-4xl font-bold text-primary mb-2">12</p>
              <p className="text-muted-foreground">Languages supported</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6 text-center">
              <p className="text-4xl font-bold text-primary mb-2">350K+</p>
              <p className="text-muted-foreground">Total recordings</p>
            </CardContent>
          </Card>
        </div>

        {/* Why Donate */}
        <div className="bg-muted/30 rounded-xl p-8 border border-border mb-12">
          <h3 className="text-2xl font-bold text-foreground mb-6">Why Donate?</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <Globe className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground mb-2">Language Equity</h4>
                <p className="text-muted-foreground text-sm">Most AI is trained on English. We're building datasets for languages spoken by billions.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Users className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground mb-2">Fair Compensation</h4>
                <p className="text-muted-foreground text-sm">Donations fund competitive payments for contributors in developing regions.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <TrendingUp className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground mb-2">Scalable Impact</h4>
                <p className="text-muted-foreground text-sm">Every dollar directly funds more recordings and validator work.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Heart className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground mb-2">Open Source</h4>
                <p className="text-muted-foreground text-sm">All datasets are publicly available for research and development.</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {[
              { q: 'Is my donation tax-deductible?', a: 'Yes! CorpusWeave is a registered 501(c)(3) nonprofit. You\'ll receive a tax receipt for your donation.' },
              { q: 'Where does my donation go?', a: 'Donations fund contributor payments, infrastructure, research, and operations to ensure high-quality data collection.' },
              { q: 'Can I cancel a monthly donation?', a: 'Absolutely. You can cancel anytime from your account settings with no questions asked.' },
              { q: 'Do you accept corporate donations?', a: 'Yes! Contact us at donations@corpusweave.org for partnership opportunities.' },
            ].map((item, idx) => (
              <Card key={idx} className="border-border">
                <CardContent className="pt-6">
                  <p className="font-semibold text-foreground mb-2">{item.q}</p>
                  <p className="text-muted-foreground text-sm">{item.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <Card className="border-border bg-gradient-to-r from-primary/10 to-accent-teal/10">
          <CardContent className="pt-6">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-500">★</span>
              ))}
            </div>
            <p className="text-lg font-medium text-foreground mb-4">
              "Thanks to donors, I was able to earn enough to buy a laptop and improve my life. CorpusWeave changed everything for me."
            </p>
            <p className="text-muted-foreground">— Amara, Uganda</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
