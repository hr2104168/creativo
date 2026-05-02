'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email) { setError('Please enter your email.'); return }
    if (!password) { setError('Please enter your password.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/feed')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page" style={styles.page}>

      {/* LEFT PANEL */}
      <div className="auth-left-panel" style={styles.leftPanel}>
        <div style={styles.brand}>
          <span className="auth-brand-name" style={styles.brandName}>✦ Creativo</span>
        </div>
        <div className="auth-quote" style={styles.quote}>
          <span className="auth-quote-mark" style={styles.quoteMark}>"</span>
          <p className="auth-quote-text" style={styles.quoteText}>
            Poetry is when an emotion has found its thought and the thought has found words.
          </p>
          <p className="auth-quote-author" style={styles.quoteAuthor}>— Robert Frost</p>
        </div>
        <div className="auth-tags" style={styles.tags}>
          {['Poetry', 'Story', 'Art Idea', 'Prompt', 'Motivation'].map(t => (
            <span className="auth-tag" key={t} style={styles.tag}>{t}</span>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right-panel" style={styles.rightPanel}>
        <div className="auth-form-wrap" style={styles.formWrap}>

          <h2 className="auth-heading" style={styles.heading}>Welcome back</h2>
          <p className="auth-sub" style={styles.sub}>
            Don't have an account?{' '}
            <Link className="auth-link" href="/register" style={styles.link}>Create one</Link>
          </p>

          {error && <div className="auth-message" style={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} noValidate>

            <div className="auth-field" style={styles.field}>
              <label className="auth-label" style={styles.label}>Email</label>
              <input
                type="email"
                className="auth-input"
                style={styles.input}
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-field" style={styles.field}>
              <label className="auth-label" style={styles.label}>Password</label>
              <input
                type="password"
                className="auth-input"
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              style={loading ? { ...styles.submitBtn, opacity: 0.7 } : styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in to Creativo'}
            </button>

          </form>

          <p className="auth-footer" style={styles.footer}>
            By signing in you agree to our Terms of Service.
          </p>

        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    minHeight: '100vh',
  },
  leftPanel: {
    background: 'linear-gradient(145deg, #534AB7 0%, #7F77DD 40%, #AFA9EC 75%, #D4A8D8 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '48px',
  },
  brand: {},
  brandName: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#fff',
    fontFamily: "'Cormorant Garamond', serif",
    letterSpacing: '0.05em',
  },
  quote: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  quoteMark: {
    display: 'block',
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '80px',
    lineHeight: '0.6',
    color: 'rgba(255,255,255,0.25)',
    marginBottom: '16px',
  },
  quoteText: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '26px',
    fontWeight: '300',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.95)',
    lineHeight: '1.55',
    maxWidth: '360px',
    margin: 0,
  },
  quoteAuthor: {
    marginTop: '18px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    margin: '18px 0 0 0',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  tag: {
    padding: '5px 14px',
    borderRadius: '9999px',
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.10)',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.80)',
    letterSpacing: '0.04em',
  },
  rightPanel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 56px',
    background: '#FAF8F5',
    overflowY: 'auto',
  },
  formWrap: {
    width: '100%',
    maxWidth: '380px',
  },
  heading: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '34px',
    fontWeight: '400',
    color: '#2C2C2A',
    marginBottom: '6px',
    margin: '0 0 6px 0',
  },
  sub: {
    fontSize: '14px',
    color: '#888780',
    marginBottom: '28px',
    margin: '0 0 28px 0',
  },
  link: {
    color: '#7F77DD',
    fontWeight: '500',
    textDecoration: 'none',
  },
  errorBox: {
    padding: '10px 14px',
    background: '#FBEAF0',
    border: '1px solid #F4C0D1',
    color: '#993556',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '18px',
  },
  field: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#2C2C2A',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginBottom: '7px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#2C2C2A',
    background: '#fff',
    border: '1px solid rgba(127,119,221,0.3)',
    borderRadius: '10px',
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box',
  },
  submitBtn: {
    display: 'block',
    width: '100%',
    marginTop: '8px',
    padding: '13px 24px',
    background: '#7F77DD',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  footer: {
    marginTop: '24px',
    fontSize: '12px',
    color: '#888780',
    textAlign: 'center',
  },
}
