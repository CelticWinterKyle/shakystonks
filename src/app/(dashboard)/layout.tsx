'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ background: 'var(--color-base)', minHeight: '100svh', color: 'var(--color-ink)' }}>

      {/* ── Header ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(6,11,16,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--color-wire)',
        }}
      >
        {/* Glow line */}
        <div className="header-glow-line" />

        <div
          style={{
            maxWidth: '64rem',
            margin: '0 auto',
            padding: '0 1.25rem',
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2rem',
          }}
        >
          {/* Left: brand + nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            {/* Wordmark */}
            <Link
              href="/live-feed"
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: '1.05rem',
                color: 'var(--color-ink)',
                textDecoration: 'none',
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--color-cyan)',
                  boxShadow: '0 0 8px var(--color-cyan)',
                  flexShrink: 0,
                }}
              />
              shakystonks
            </Link>

            {/* Nav */}
            <nav style={{ display: 'flex', gap: '1.5rem' }}>
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
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: {
                    width: 28,
                    height: 28,
                  },
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main
        style={{
          maxWidth: '64rem',
          margin: '0 auto',
          padding: '2rem 1.25rem',
        }}
      >
        {children}
      </main>
    </div>
  )
}
