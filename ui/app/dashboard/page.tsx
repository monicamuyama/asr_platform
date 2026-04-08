'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mic, Headphones, FileText, Trophy, Play, Pause, Volume2, Star, LogOut, Settings, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'

export default function CorpusWeaveDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isRecording, setIsRecording] = useState(false)
  const [selectedRating, setSelectedRating] = useState(0)
  const [userName] = useState('Amara')
  const [userLanguage] = useState('Luganda')

  const userStats = [
    { label: 'Recordings', value: '24', icon: Mic },
    { label: 'Validations', value: '156', icon: Headphones },
    { label: 'Transcriptions', value: '42', icon: FileText },
    { label: 'Points Earned', value: '2,450', icon: Trophy },
  ]

  const activeTasks = [
    { id: 1, type: 'record', title: 'Record: "Please repeat after me"', language: 'Luganda', reward: '50 pts' },
    { id: 2, type: 'validate', title: 'Validate 5 recordings', language: 'English', reward: '125 pts' },
    { id: 3, type: 'transcribe', title: 'Transcribe Acholi audio', language: 'Acholi', reward: '200 pts' },
  ]

  const recentActivity = [
    { date: 'Today', action: 'Completed 3 recordings', reward: '+150 pts' },
    { date: 'Yesterday', action: 'Validated 5 submissions', reward: '+125 pts' },
    { date: '2 days ago', action: 'Received bonus points', reward: '+500 pts' },
  ]

  const topContributors = [
    { name: 'Juma Mukwaya', points: '24,500', recordings: 342, rating: 4.9 },
    { name: 'Grace Nabwire', points: '21,200', recordings: 298, rating: 4.8 },
    { name: 'Kofi Osei', points: '18,900', recordings: 267, rating: 4.7 },
  ]

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
              <div>
                <h1 className="text-2xl font-bold text-foreground">CorpusWeave</h1>
                <p className="text-xs text-muted-foreground">Community Speech Data Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className="text-foreground">Welcome, <strong>{userName}</strong></span>
                <Badge variant="outline" className="ml-2">{userLanguage}</Badge>
              </div>
              <Link href="/donate">
                <Button size="sm" variant="ghost">Support</Button>
              </Link>
              <Link href="/data-dictionary">
                <Button size="sm" variant="ghost" className="hidden md:inline-flex">Docs</Button>
              </Link>
              <Link href="/settings">
                <Button size="sm" variant="ghost" className="gap-1">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="sm" variant="ghost" className="gap-1">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="contribute">Contribute</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-transparent to-accent-teal/10 p-8 border border-border">
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                Build Inclusive Speech Data
              </h2>
              <p className="text-lg text-muted-foreground">
                Record, validate, and transcribe speech across multiple languages. Earn points while supporting language diversity.
              </p>
            </div>

            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              {userStats.map((stat, idx) => {
                const Icon = stat.icon
                return (
                  <Card key={idx} className="border-border hover:shadow-md transition">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                          <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                        </div>
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Your Active Tasks</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {activeTasks.map(task => (
                  <Card key={task.id} className="border-border hover:shadow-md transition">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <Badge className="bg-primary/20 text-primary border-0">
                          {task.type === 'record' && <Mic className="h-3 w-3 mr-1" />}
                          {task.type === 'validate' && <Headphones className="h-3 w-3 mr-1" />}
                          {task.type === 'transcribe' && <FileText className="h-3 w-3 mr-1" />}
                          {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                        </Badge>
                        <span className="font-bold text-primary">{task.reward}</span>
                      </div>
                      <p className="font-medium text-foreground mb-2">{task.title}</p>
                      <p className="text-sm text-muted-foreground mb-4">{task.language}</p>
                      <Button className="w-full bg-primary hover:bg-primary/90">Start Task</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Recent Activity</h3>
              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {recentActivity.map((activity, idx) => (
                      <div key={idx} className="flex items-center justify-between pb-3 border-b border-border last:border-0">
                        <div>
                          <p className="font-medium text-foreground">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">{activity.date}</p>
                        </div>
                        <span className="font-semibold text-primary">{activity.reward}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contribute Tab */}
          <TabsContent value="contribute" className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-border lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-primary" />
                    Record Audio
                  </CardTitle>
                  <CardDescription>Contribute voice data in your language</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-6 text-center space-y-4">
                    <p className="font-medium text-foreground">Sentence to record:</p>
                    <p className="text-lg text-foreground italic">
                      "The future is built by those who contribute today."
                    </p>
                  </div>
                  <Button 
                    onClick={() => setIsRecording(!isRecording)}
                    className={`w-full ${isRecording ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`}
                  >
                    {isRecording ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Start Recording
                      </>
                    )}
                  </Button>
                  {!isRecording && (
                    <Button variant="outline" className="w-full border-border">
                      <Play className="h-4 w-4 mr-2" />
                      Playback
                    </Button>
                  )}
                  <Button className="w-full bg-primary hover:bg-primary/90">Submit Recording</Button>
                </CardContent>
              </Card>

              <Card className="border-border lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Headphones className="h-5 w-5 text-primary" />
                    Validate Audio
                  </CardTitle>
                  <CardDescription>Review and rate submissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Submission ID</Label>
                    <Input placeholder="Enter submission ID..." className="border-border" />
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-center">
                    <Play className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Quality Rating</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star}
                          onClick={() => setSelectedRating(star)}
                          className={`text-3xl transition ${selectedRating >= star ? 'text-yellow-500' : 'text-muted-foreground'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" className="w-full border-border">Submit Rating</Button>
                </CardContent>
              </Card>

              <Card className="border-border lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Transcribe
                  </CardTitle>
                  <CardDescription>Write out what you hear</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-center">
                    <Volume2 className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transcription" className="text-sm font-medium">Your Transcription</Label>
                    <Textarea 
                      id="transcription"
                      placeholder="Type what you hear in the audio..." 
                      className="border-border resize-none" 
                      rows={4}
                    />
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90">Submit Transcription</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Your Points
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-r from-primary/10 to-accent-teal/10 rounded-xl p-6 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">Total Points Balance</p>
                    <p className="text-4xl font-bold text-foreground">2,450</p>
                    <p className="text-sm text-muted-foreground mt-4">Unlock rewards at 5,000 points</p>
                  </div>
                  <div className="space-y-2">
                    <Button className="w-full bg-primary hover:bg-primary/90">Redeem Points</Button>
                    <Button variant="outline" className="w-full border-border">View History</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Give Points
                  </CardTitle>
                  <CardDescription>Reward other contributors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select>
                    <SelectTrigger className="border-border">
                      <SelectValue placeholder="Select contributor..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="juma">Juma Mukwaya</SelectItem>
                      <SelectItem value="grace">Grace Nabwire</SelectItem>
                      <SelectItem value="kofi">Kofi Osei</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    {[10, 50, 100, 250].map(amount => (
                      <Button key={amount} variant="outline" className="border-border text-sm">
                        {amount} pts
                      </Button>
                    ))}
                  </div>
                  <Input placeholder="Add a message..." className="border-border" />
                  <Button className="w-full bg-primary hover:bg-primary/90">Send Points</Button>
                </CardContent>
              </Card>

              <Card className="border-border md:col-span-2">
                <CardHeader>
                  <CardTitle>Language Leaderboards</CardTitle>
                  <CardDescription>Top contributors in each language get bonus points</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {['Luganda', 'Acholi', 'English'].map(lang => (
                      <div key={lang} className="border border-border rounded-lg p-4">
                        <p className="font-semibold text-foreground">{lang}</p>
                        <p className="text-2xl font-bold text-primary mt-2">52,400 pts</p>
                        <p className="text-sm text-muted-foreground mt-1">Total awarded</p>
                        <Button size="sm" className="w-full mt-4 bg-primary hover:bg-primary/90">View Rankings</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-8">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Top Contributors
                </CardTitle>
                <CardDescription>This month&apos;s leading community members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topContributors.map((contributor, idx) => (
                    <div key={idx} className="flex items-center gap-4 pb-4 border-b border-border last:border-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{contributor.name}</p>
                        <p className="text-sm text-muted-foreground">{contributor.recordings} recordings</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{contributor.points} pts</p>
                        <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          {contributor.rating}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
