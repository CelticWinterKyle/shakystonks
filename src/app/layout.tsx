import type { Metadata } from 'next'
import { Instrument_Serif, DM_Sans, IBM_Plex_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const displayFont = Instrument_Serif({
  weight: ['400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--loaded-display',
  display: 'swap',
})

const uiFont = DM_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--loaded-ui',
  display: 'swap',
})

const dataFont = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
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
          '--font-display': 'var(--loaded-display), "Instrument Serif", Georgia, serif',
          '--font-ui':      'var(--loaded-ui), "DM Sans", system-ui, sans-serif',
          '--font-data':    'var(--loaded-data), "IBM Plex Mono", monospace',
        } as React.CSSProperties}
      >
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
