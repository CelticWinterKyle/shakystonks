'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ background: 'var(--color-base)', minHeight: '100svh', color: 'var(--color-text)' }}>

      {/* ── Header ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(7,7,7,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {/* Red accent line at very top */}
        <div style={{ height: '2px', background: 'var(--color-red)', width: '100%' }} />

        <div
          style={{
            maxWidth: '72rem',
            margin: '0 auto',
            padding: '0 1.5rem',
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2rem',
          }}
        >
          {/* Left: brand + nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>

            {/* Wordmark */}
            <Link
              href="/live-feed"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-text)',
                textDecoration: 'none',
                lineHeight: 1,
              }}
            >
              Shakystonks
            </Link>

            {/* Divider */}
            <div style={{ width: '1px', height: '18px', background: 'var(--color-border)' }} />

            {/* Nav */}
            <nav style={{ display: 'flex', gap: '2rem' }}>
              <Link
                href="/live-feed"
                className="nav-link"
                data-active={pathname === '/live-feed' ? '' : undefined}
              >
                Live Feed
              </Link>
              <Link
                href="/daily-digest"
                className="nav-link"
                data-active={pathname === '/daily-digest' ? '' : undefined}
              >
                Daily Digest
              </Link>
            </nav>
          </div>

          {/* Right: user */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: { width: 28, height: 28 },
              },
            }}
          />
        </div>
      </header>

      {/* ── Content ── */}
      <main
        style={{
          maxWidth: '72rem',
          margin: '0 auto',
          padding: '2.5rem 1.5rem',
        }}
      >
        {children}
      </main>
    </div>
  )
}
