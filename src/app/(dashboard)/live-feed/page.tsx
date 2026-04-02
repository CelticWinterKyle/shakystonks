import { LiveFeed } from '@/components/feed/LiveFeed'

export const metadata = { title: 'Live Feed — shakystonks' }

export default function LiveFeedPage() {
  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--color-red)',
            marginBottom: '6px',
          }}
        >
          Real-Time
        </p>
        <h1 className="page-title">Signal Feed</h1>
        <p
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: '0.6rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            marginTop: '4px',
          }}
        >
          Event-driven signals · Market hours · Updated every 15 min
        </p>
      </div>
      <LiveFeed />
    </div>
  )
}
