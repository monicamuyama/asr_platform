'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'

export function Navbar() {
  const { strings } = useLanguage()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-teal font-bold text-white">
              CW
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{strings.app.brand}</h1>
              <p className="text-xs text-muted-foreground">{strings.app.tagline}</p>
            </div>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition">
              {strings.navigation.home}
            </Link>
            <Link href="/home" className="text-sm font-medium text-muted-foreground hover:text-foreground transition">
              {strings.navigation.about}
            </Link>
            <Link href="/donate" className="text-sm font-medium text-muted-foreground hover:text-foreground transition">
              {strings.navigation.donate}
            </Link>
            
            <div className="flex items-center gap-2 border-l border-border pl-6 ml-6">
              <Link href="/signin">
                <Button size="sm" variant="outline" className="border-border">
                  {strings.navigation.signIn}
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  {strings.navigation.getStarted}
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
