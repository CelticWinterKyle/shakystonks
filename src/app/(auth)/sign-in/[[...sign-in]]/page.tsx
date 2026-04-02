import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
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
      {/* Wordmark above the form */}
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <div style={{ width: '40px', height: '3px', background: 'var(--color-red)', margin: '0 auto 12px' }} />
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-text)',
            lineHeight: 1,
            display: 'block',
            marginBottom: '8px',
          }}
        >
          Shakystonks
        </span>
        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.575rem',
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          Event-driven signal detection
        </p>
      </div>

      <SignIn />
    </main>
  )
}
