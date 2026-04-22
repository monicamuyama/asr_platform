'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Database, Globe, Zap, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { getSessionUserId } from '@/lib/auth'

export default function DataDictionary() {
  const router = useRouter()

  useEffect(() => {
    const userId = getSessionUserId()
    if (!userId) {
      router.replace('/signin')
    }
  }, [router])

  const dataFields = [
    {
      name: 'submission_id',
      type: 'UUID',
      required: true,
      description: 'Unique identifier for each audio submission',
      example: '550e8400-e29b-41d4-a716-446655440000'
    },
    {
      name: 'contributor_id',
      type: 'UUID',
      required: true,
      description: 'Unique identifier for the contributor',
      example: '660e8400-e29b-41d4-a716-446655440000'
    },
    {
      name: 'language',
      type: 'String (language code)',
      required: true,
      description: 'Language of the audio sample',
      example: 'lg (Luganda), lsg (Lusoga), lms (Lumasaba), ach (Acholi), run (Runyakore), ate (Ateso), lug (Lugbara), en (English)'
    },
    {
      name: 'audio_url',
      type: 'URL',
      required: true,
      description: 'URL to the recorded audio file',
      example: 'https://corpus.example.com/audio/submission_12345.wav'
    },
    {
      name: 'duration_seconds',
      type: 'Integer',
      required: true,
      description: 'Duration of audio in seconds',
      example: '15, 30, 45'
    },
    {
      name: 'text_content',
      type: 'String',
      required: true,
      description: 'The sentence or text that was recorded',
      example: 'The quick brown fox jumps over the lazy dog'
    },
    {
      name: 'quality_score',
      type: 'Float (0-5)',
      required: false,
      description: 'Average quality rating from validators (0-5 scale)',
      example: '4.5, 3.2, 5.0'
    },
    {
      name: 'validation_count',
      type: 'Integer',
      required: false,
      description: 'Number of validators who reviewed this submission',
      example: '5, 12, 8'
    },
    {
      name: 'is_approved',
      type: 'Boolean',
      required: false,
      description: 'Whether the submission has been approved for the dataset',
      example: 'true, false'
    },
    {
      name: 'points_awarded',
      type: 'Integer',
      required: true,
      description: 'Points awarded to the contributor for this submission',
      example: '50, 125, 200'
    },
    {
      name: 'metadata',
      type: 'JSON Object',
      required: false,
      description: 'Additional metadata such as microphone type, background noise level',
      example: '{"microphone": "built-in", "noise_level": "low", "accent": "neutral"}'
    },
    {
      name: 'created_at',
      type: 'ISO 8601 Timestamp',
      required: true,
      description: 'When the submission was created',
      example: '2025-03-15T10:30:00Z'
    },
  ]

  const languages = [
    { code: 'lg', name: 'Luganda', country: 'Uganda', speakers: '16M' },
    { code: 'lsg', name: 'Lusoga', country: 'Uganda', speakers: '4M' },
    { code: 'lms', name: 'Lumasaba', country: 'Uganda', speakers: '4M' },
    { code: 'ach', name: 'Acholi', country: 'Uganda', speakers: '1.5M' },
    { code: 'run', name: 'Runyakore', country: 'Uganda', speakers: '4M' },
    { code: 'ate', name: 'Ateso', country: 'Uganda', speakers: '2M' },
    { code: 'lug', name: 'Lugbara', country: 'Uganda', speakers: '2M' },
    { code: 'en', name: 'English', country: 'Global', speakers: '1.5B' },
    { code: 'sw', name: 'Swahili', country: 'East Africa', speakers: '150M' },
    { code: 'yo', name: 'Yoruba', country: 'Nigeria', speakers: '45M' },
    { code: 'am', name: 'Amharic', country: 'Ethiopia', speakers: '32M' },
  ]

  const qualityStandards = [
    { rating: 5, description: 'Clear, no background noise, proper pronunciation', icon: '⭐⭐⭐⭐⭐' },
    { rating: 4, description: 'Mostly clear, minimal background noise', icon: '⭐⭐⭐⭐' },
    { rating: 3, description: 'Acceptable, some background noise, slight unclear parts', icon: '⭐⭐⭐' },
    { rating: 2, description: 'Poor audio quality, significant background noise', icon: '⭐⭐' },
    { rating: 1, description: 'Very poor, unsuitable for training data', icon: '⭐' },
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
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:gap-3">
              <Link href="/home">
                <Button variant="ghost">Home</Button>
              </Link>
              <Link href="/dashboard">
                <Button className="bg-primary hover:bg-primary/90">Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-transparent to-accent-teal/10 p-8 border border-border mb-12">
          <div className="flex items-start gap-4">
            <Database className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Data Dictionary</h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Complete reference guide for the CorpusWeave speech dataset structure, fields, languages, and quality standards.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="fields" className="w-full">
          <TabsList className="mb-8 grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
            <TabsTrigger value="fields" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Data Fields</span>
            </TabsTrigger>
            <TabsTrigger value="languages" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Languages</span>
            </TabsTrigger>
            <TabsTrigger value="quality" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Quality</span>
            </TabsTrigger>
            <TabsTrigger value="schema" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Schema</span>
            </TabsTrigger>
          </TabsList>

          {/* Data Fields Tab */}
          <TabsContent value="fields" className="space-y-4">
            <div className="grid gap-4">
              {dataFields.map((field, idx) => (
                <Card key={idx} className="border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <code className="bg-muted px-2 py-1 rounded font-mono text-sm font-semibold text-foreground">
                            {field.name}
                          </code>
                          {field.required && (
                            <Badge className="bg-destructive text-white border-0">Required</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{field.description}</p>
                      </div>
                      <Badge variant="outline" className="whitespace-nowrap ml-2">{field.type}</Badge>
                    </div>
                    <div className="mt-4 bg-muted/50 rounded-lg p-3 font-mono text-sm">
                      <p className="text-muted-foreground">Example:</p>
                      <p className="text-foreground break-all">{field.example}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Languages Tab */}
          <TabsContent value="languages" className="space-y-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Supported Languages
                </CardTitle>
                <CardDescription>
                  CorpusWeave currently supports {languages.length} languages with more being added regularly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Code</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Language</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Region</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Native Speakers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {languages.map((lang, idx) => (
                        <tr key={idx} className="border-b border-border hover:bg-muted/50 transition last:border-0">
                          <td className="py-3 px-4">
                            <code className="bg-muted px-2 py-1 rounded font-mono text-xs font-semibold">{lang.code}</code>
                          </td>
                          <td className="py-3 px-4 font-medium text-foreground">{lang.name}</td>
                          <td className="py-3 px-4 text-muted-foreground">{lang.country}</td>
                          <td className="py-3 px-4 text-muted-foreground">{lang.speakers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quality Standards Tab */}
          <TabsContent value="quality" className="space-y-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Quality Rating Standards
                </CardTitle>
                <CardDescription>
                  Guidelines for rating audio submissions on a 1-5 scale
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {qualityStandards.map((standard, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-foreground">Rating {standard.rating}/5</h4>
                      <span className="text-2xl">{standard.icon}</span>
                    </div>
                    <p className="text-muted-foreground">{standard.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Quality Criteria Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-foreground">Audio is clear and audible</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-foreground">Minimal background noise</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-foreground">Proper pronunciation and accent</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-foreground">No clipping or distortion</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-foreground">Appropriate volume level</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schema Tab */}
          <TabsContent value="schema" className="space-y-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Dataset Schema</CardTitle>
                <CardDescription>JSON schema for CorpusWeave submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                  <pre className="font-mono text-sm text-foreground whitespace-pre-wrap break-words">
{`{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": [
    "submission_id", "contributor_id", "language",
    "audio_url", "duration_seconds", "text_content",
    "points_awarded", "created_at"
  ],
  "properties": {
    "submission_id": { "type": "string" },
    "contributor_id": { "type": "string" },
    "language": { "type": "string" },
    "audio_url": { "type": "string", "format": "uri" },
    "duration_seconds": { "type": "integer", "minimum": 1 },
    "text_content": { "type": "string" },
    "quality_score": { "type": "number", "minimum": 0, "maximum": 5 },
    "validation_count": { "type": "integer", "minimum": 0 },
    "is_approved": { "type": "boolean" },
    "points_awarded": { "type": "integer", "minimum": 0 },
    "metadata": { "type": "object" },
    "created_at": { "type": "string", "format": "date-time" }
  }
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>API Response Example</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                  <pre className="font-mono text-sm text-foreground whitespace-pre-wrap break-words">
{`{
  "submission_id": "550e8400-e29b-41d4-a716-446655440000",
  "contributor_id": "660e8400-e29b-41d4-a716-446655440000",
  "language": "lg",
  "audio_url": "https://corpus.example.com/audio/sub_123.wav",
  "duration_seconds": 15,
  "text_content": "The future is bright",
  "quality_score": 4.7,
  "validation_count": 8,
  "is_approved": true,
  "points_awarded": 125,
  "metadata": {
    "microphone": "built-in",
    "noise_level": "low",
    "accent": "neutral"
  },
  "created_at": "2025-03-15T10:30:00Z"
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer CTA */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-primary/20 to-accent-teal/20 border border-primary/30 p-8 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-4">Ready to Access the Dataset?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Start contributing to CorpusWeave or download the dataset for your research.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-primary hover:bg-primary/90">Start Contributing</Button>
            </Link>
            <Button size="lg" variant="outline" className="border-border">Download Dataset</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
