'use client'

import Link from 'next/link'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/contributors', label: 'Contributors' },
  { href: '/community', label: 'Community' },
  { href: '/expert', label: 'Expert' },
  { href: '/tips', label: 'Tips' },
]

export function WorkflowNav() {
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
