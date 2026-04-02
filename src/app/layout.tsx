import type { Metadata } from 'next'
import { Bebas_Neue, Barlow_Condensed, JetBrains_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const displayFont = Bebas_Neue({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--loaded-display',
  display: 'swap',
})

const uiFont = Barlow_Condensed({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--loaded-ui',
  display: 'swap',
})

const dataFont = JetBrains_Mono({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--loaded-data',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'shakystonks',
  description: 'Event-driven stock signal detection',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${displayFont.variable} ${uiFont.variable} ${dataFont.variable}`}
        style={{
          '--font-display': 'var(--loaded-display), "Bebas Neue", Impact, sans-serif',
          '--font-ui':      'var(--loaded-ui), "Barlow Condensed", "Arial Narrow", sans-serif',
          '--font-data':    'var(--loaded-data), "JetBrains Mono", monospace',
        } as React.CSSProperties}
      >
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
