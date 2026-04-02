import { LiveFeed } from '@/components/feed/LiveFeed'

export const metadata = { title: 'Live Feed — shakystonks' }

export default function LiveFeedPage() {
  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: '1.5rem',
            fontWeight: 400,
            color: 'var(--color-ink)',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            marginBottom: '6px',
          }}
        >
          Signal Feed
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: '0.625rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-ink-muted)',
          }}
        >
          Event-driven signals · Market hours · Updated every 15 min
        </p>
      </div>
      <LiveFeed />
    </div>
  )
}
