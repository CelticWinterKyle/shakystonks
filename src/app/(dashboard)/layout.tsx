import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-gray-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-semibold tracking-tight text-white">shakystonks</span>
            <nav className="flex gap-1">
              <Link
                href="/live-feed"
                className="rounded-md px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Live Feed
              </Link>
              <Link
                href="/daily-digest"
                className="rounded-md px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Daily Digest
              </Link>
            </nav>
          </div>
          <UserButton />
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  )
}
