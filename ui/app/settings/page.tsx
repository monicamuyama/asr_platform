'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'
import { User, Lock, Bell, DollarSign, Languages, Shield, LogOut, ArrowLeft } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => setIsSaving(false), 1000)
  }

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
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Settings</h2>
          <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-2xl">
                    AO
                  </div>
                  <Button variant="outline" className="border-border">
                    Change Avatar
                  </Button>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="name"
                    defaultValue="Amara Okafor"
                    className="border-border"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="amara@corpus.local"
                    className="border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    <Badge variant="outline" className="mr-2">Verified</Badge>
                    Verified on March 15, 2025
                  </p>
                </div>

                {/* Languages */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Languages You Speak</Label>
                  <Select defaultValue="luganda">
                    <SelectTrigger className="border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="luganda">Luganda</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="swahili">Swahili</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">You can contribute in all selected languages</p>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    defaultValue="Language enthusiast passionate about speech diversity"
                    className="border-border resize-none"
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleSave}
                  className="bg-primary hover:bg-primary/90"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password regularly for security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-sm font-medium">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="••••••••"
                    className="border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    className="border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    className="border-border"
                  />
                </div>
                <Button className="bg-primary hover:bg-primary/90">Update Password</Button>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Status: Disabled</p>
                    <p className="text-sm text-muted-foreground">Secure your account with 2FA</p>
                  </div>
                  <Button variant="outline" className="border-border">Enable 2FA</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Manage devices accessing your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <p className="font-medium text-foreground">Chrome on macOS</p>
                    <p className="text-sm text-muted-foreground">Last active: Today at 2:45 PM</p>
                  </div>
                  <Badge>Current</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Safari on iPhone</p>
                    <p className="text-sm text-muted-foreground">Last active: Yesterday at 10:20 AM</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-border">Sign Out</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Manage how you receive payouts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preferred Payout Method</Label>
                  <Select defaultValue="bank-transfer">
                    <SelectTrigger className="border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="mobile-money">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <p className="text-sm font-medium text-foreground mb-2">Bank Account Details</p>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Account Name</p>
                      <p className="font-medium text-foreground">Amara Okafor</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Account Number</p>
                      <p className="font-medium text-foreground">••••••••1234</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Bank</p>
                      <p className="font-medium text-foreground">Standard Chartered Bank Uganda</p>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="border-border">Update Bank Details</Button>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>View your past payouts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: 'March 15, 2025', amount: '$245.50', status: 'Completed' },
                    { date: 'February 28, 2025', amount: '$198.75', status: 'Completed' },
                    { date: 'February 15, 2025', amount: '$312.00', status: 'Completed' },
                  ].map((payout, idx) => (
                    <div key={idx} className="flex items-center justify-between pb-3 border-b border-border last:border-0">
                      <div>
                        <p className="font-medium text-foreground">{payout.date}</p>
                        <Badge variant="outline" className="mt-1">{payout.status}</Badge>
                      </div>
                      <p className="font-semibold text-primary">{payout.amount}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Control what emails you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'New tasks available', desc: 'Get notified when new tasks match your languages' },
                  { label: 'Validation feedback', desc: 'Updates on validations of your submissions' },
                  { label: 'Tips received', desc: 'When other users send you tips' },
                  { label: 'Payout processed', desc: 'Confirmations of your payouts' },
                  { label: 'Product updates', desc: 'New features and improvements' },
                  { label: 'Weekly digest', desc: 'Summary of your activity' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={idx < 4} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Push Notifications</CardTitle>
                <CardDescription>Manage mobile notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Enable push notifications</p>
                    <p className="text-sm text-muted-foreground">Important updates on your device</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Communication Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Marketing emails</p>
                    <p className="text-sm text-muted-foreground">Promotions and announcements</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Danger Zone */}
        <Card className="border-destructive mt-12">
          <CardHeader className="bg-destructive/5">
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between pb-4 border-b border-destructive/20">
              <div>
                <p className="font-medium text-foreground">Sign out</p>
                <p className="text-sm text-muted-foreground">End your current session</p>
              </div>
              <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
            <div>
              <p className="font-medium text-foreground mb-2">Delete Account</p>
              <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
