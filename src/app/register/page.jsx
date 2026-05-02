'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function checkStrength(val) {
    let score = 0
    if (val.length >= 6) score++
    if (val.length >= 10) score++
    if (/[A-Z]/.test(val) || /[0-9]/.test(val)) score++
    if (/[^A-Za-z0-9]/.test(val)) score++
    return score
}

const STRENGTH_COLORS = ['#E24B4A', '#EF9F27', '#7F77DD', '#1D9E75']
const STRENGTH_LABELS = ['Too short', 'Weak', 'Good', 'Strong']

export default function RegisterPage() {
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    const strength = password ? checkStrength(password) : 0
    const strengthColor = strength > 0 ? STRENGTH_COLORS[strength - 1] : '#E8E6DF'
    const strengthLabel = !password ? 'Min. 6 characters'
        : strength === 0 ? 'Too short'
            : STRENGTH_LABELS[strength - 1]

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!username || username.length < 3) { setError('Username must be at least 3 characters.'); return }
        if (!email.includes('@')) { setError('Please enter a valid email address.'); return }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
        if (password !== confirm) { setError('Passwords do not match.'); return }

        setLoading(true)
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error); return }
            setSuccess('Account created! Redirecting to login…')
            setTimeout(() => router.push('/'), 1500)
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
                <div>
                    <span className="auth-brand-name" style={styles.brandName}>✦ Creativo</span>
                </div>
                <div className="auth-quote" style={styles.quote}>
                    <span className="auth-quote-mark" style={styles.quoteMark}>"</span>
                    <p className="auth-quote-text" style={styles.quoteText}>Fill your paper with the breathings of your heart.</p>
                    <p className="auth-quote-author" style={styles.quoteAuthor}>— William Wordsworth</p>
                </div>
                <div className="auth-tags" style={styles.tags}>
                    {['poetry', 'storytelling', 'inspiration', 'prompts', 'reflection'].map(t => (
                        <span className="auth-tag" key={t} style={styles.tag}>{t}</span>
                    ))}
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="auth-right-panel" style={styles.rightPanel}>
                <div className="auth-form-wrap" style={styles.formWrap}>

                    <div className="auth-mobile-brand">✦ Creativo</div>
                    <h2 className="auth-heading" style={styles.heading}>Join Creativo</h2>
                    <p className="auth-sub" style={styles.sub}>
                        Already have an account?{' '}
                        <Link className="auth-link" href="/" style={styles.link}>Sign in</Link>
                    </p>

                    {error && <div className="auth-message" style={styles.errorBox}>{error}</div>}
                    {success && <div className="auth-message" style={styles.successBox}>{success}</div>}

                    <form onSubmit={handleSubmit} noValidate>

                        <div className="auth-field" style={styles.field}>
                            <label className="auth-label" style={styles.label}>Username</label>
                            <input
                                type="text"
                                className="auth-input"
                                style={styles.input}
                                placeholder="e.g. creativo_mind"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                            />
                            <p style={styles.hint}>This is how others will see you.</p>
                        </div>

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
                            {/* Strength bar */}
                            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} style={{
                                        flex: 1, height: '3px', borderRadius: '2px',
                                        background: i < strength ? strengthColor : '#E8E6DF',
                                        transition: 'background 0.2s',
                                    }} />
                                ))}
                            </div>
                            <p style={{ ...styles.hint, color: strength > 0 ? strengthColor : '#888780' }}>
                                {strengthLabel}
                            </p>
                        </div>

                        <div className="auth-field" style={styles.field}>
                            <label className="auth-label" style={styles.label}>Confirm Password</label>
                            <input
                                type="password"
                                className="auth-input"
                                style={styles.input}
                                placeholder="••••••••"
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="auth-submit"
                            style={loading ? { ...styles.submitBtn, opacity: 0.7 } : styles.submitBtn}
                            disabled={loading}
                        >
                            {loading ? 'Creating account…' : 'Create my account'}
                        </button>

                    </form>

                    <p className="auth-footer" style={styles.footer}>
                        By joining you agree to our Terms of Service.
                    </p>

                </div>
            </div>
        </div>
    )
}

const styles = {
    page: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' },
    leftPanel: { background: 'linear-gradient(145deg, #534AB7 0%, #7F77DD 40%, #AFA9EC 75%, #D4A8D8 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px' },
    brandName: { fontSize: '24px', fontWeight: '600', color: '#fff', fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.05em' },
    quote: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    quoteMark: { display: 'block', fontFamily: "'Cormorant Garamond', serif", fontSize: '80px', lineHeight: '0.6', color: 'rgba(255,255,255,0.25)', marginBottom: '16px' },
    quoteText: { fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: '300', fontStyle: 'italic', color: 'rgba(255,255,255,0.95)', lineHeight: '1.55', maxWidth: '360px', margin: 0 },
    quoteAuthor: { marginTop: '18px', fontSize: '12px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '18px 0 0 0' },
    tags: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
    tag: { padding: '5px 14px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.10)', fontSize: '11px', color: 'rgba(255,255,255,0.80)', letterSpacing: '0.04em' },
    rightPanel: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 56px', background: '#FAF8F5', overflowY: 'auto' },
    formWrap: { width: '100%', maxWidth: '380px' },
    heading: { fontFamily: "'Cormorant Garamond', serif", fontSize: '34px', fontWeight: '400', color: '#2C2C2A', margin: '0 0 6px 0' },
    sub: { fontSize: '14px', color: '#888780', margin: '0 0 28px 0' },
    link: { color: '#7F77DD', fontWeight: '500', textDecoration: 'none' },
    errorBox: { padding: '10px 14px', background: '#FBEAF0', border: '1px solid #F4C0D1', color: '#993556', borderRadius: '8px', fontSize: '13px', marginBottom: '18px' },
    successBox: { padding: '10px 14px', background: '#E1F5EE', border: '1px solid #9FE1CB', color: '#0F6E56', borderRadius: '8px', fontSize: '13px', marginBottom: '18px' },
    field: { marginBottom: '16px' },
    label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#2C2C2A', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '7px' },
    input: { width: '100%', padding: '12px 16px', fontSize: '14px', color: '#2C2C2A', background: '#fff', border: '1px solid rgba(127,119,221,0.3)', borderRadius: '10px', outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' },
    hint: { fontSize: '11px', color: '#888780', margin: '5px 0 0 0' },
    submitBtn: { display: 'block', width: '100%', marginTop: '8px', padding: '13px 24px', background: '#7F77DD', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    footer: { marginTop: '24px', fontSize: '12px', color: '#888780', textAlign: 'center' },
}
