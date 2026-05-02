'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StatsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(null)
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then(async res => {
        if (res.status === 401) {
          router.push('/')
          return null
        }
        return res.json()
      })
      .then(data => {
        if (!data) return
        setCurrentUser(data.user)
        setStats(data.stats || [])
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading statistics...
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <nav className="app-nav stats-nav" style={styles.nav}>
        <Link href="/feed" style={styles.brand}>✦ Creativo</Link>
        <div className="app-nav-actions stats-nav-links" style={styles.navLinks}>
          <Link href="/feed" style={styles.navLink}>Feed</Link>
          {currentUser && (
            <Link href={`/profile/${currentUser.id}`} style={styles.navLink}>
              @{currentUser.username}
            </Link>
          )}
          <button onClick={handleLogout} style={styles.logoutBtn}>⎋</button>
        </div>
      </nav>

      <main className="stats-main" style={styles.main}>
        <div style={styles.header}>
          <p style={styles.eyebrow}>PLATFORM STATISTICS</p>
          <h1 style={styles.title}>Creativo at a glance</h1>
        </div>

        <div style={styles.grid}>
          {stats.map(stat => (
            <section key={stat.title} style={styles.card}>
              <p style={styles.cardTitle}>{stat.title}</p>
              <p style={styles.cardValue}>{stat.value}</p>
              <p style={styles.cardDetail}>{stat.detail}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#F5F0FF' },
  loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B5BA0', fontFamily: "'DM Sans', sans-serif" },
  nav: { position: 'sticky', top: 0, zIndex: 100, height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(127,119,221,0.18)' },
  brand: { fontSize: '20px', fontWeight: '600', color: '#3C3489', fontFamily: "'Cormorant Garamond', serif", textDecoration: 'none' },
  navLinks: { display: 'flex', alignItems: 'center', gap: '10px' },
  navLink: { padding: '8px 14px', borderRadius: '9999px', color: '#6B5BA0', background: '#FAF7FF', border: '1px solid rgba(127,119,221,0.18)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' },
  logoutBtn: { padding: '7px 12px', borderRadius: '9999px', border: 'none', background: 'transparent', color: '#6B5BA0', fontSize: '18px', cursor: 'pointer' },
  main: { maxWidth: '1100px', margin: '0 auto', padding: '36px 24px 60px' },
  header: { marginBottom: '24px' },
  eyebrow: { margin: '0 0 8px', color: '#7F77DD', fontSize: '12px', fontWeight: '700', letterSpacing: '0.12em' },
  title: { margin: 0, color: '#2C2C2A', fontFamily: "'Cormorant Garamond', serif", fontSize: '2.2rem', fontWeight: '500' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  card: { background: '#fff', border: '1px solid rgba(127,119,221,0.18)', borderRadius: '8px', padding: '20px', minHeight: '150px', boxShadow: '0 1px 4px rgba(100,60,180,0.08)' },
  cardTitle: { margin: '0 0 12px', color: '#6B5BA0', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' },
  cardValue: { margin: '0 0 10px', color: '#3C3489', fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: '700', overflowWrap: 'anywhere' },
  cardDetail: { margin: 0, color: '#6B5BA0', fontSize: '14px', lineHeight: '1.5', overflowWrap: 'anywhere' },
}
