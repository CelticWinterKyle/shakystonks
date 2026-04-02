import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main
      className="auth-bg"
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--color-cyan)',
              boxShadow: '0 0 10px var(--color-cyan)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: '1.25rem',
              color: 'var(--color-ink)',
              letterSpacing: '-0.01em',
            }}
          >
            shakystonks
          </span>
        </div>
        <p
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: '0.575rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-ink-muted)',
          }}
        >
          Event-driven signal detection
        </p>
      </div>
      <SignUp />
    </main>
  )
}
