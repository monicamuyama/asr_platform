'use client'

import Link from 'next/link'
import { useLanguage } from '@/components/language-provider'

export function WorkflowNav() {
  const { strings } = useLanguage()

  const links = [
    { href: '/dashboard', label: strings.workflow.dashboard },
    { href: '/contributors', label: strings.workflow.contributors },
    { href: '/community', label: strings.workflow.community },
    { href: '/expert', label: strings.workflow.expert },
    { href: '/tips', label: strings.workflow.tips },
  ]

  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
