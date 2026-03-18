import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'
import { useAccent } from '../context/AccentContext'
import { useTheme } from '../context/ThemeContext'
import { useIsMobile } from '../hooks/useMediaQuery'

export default function Login() {
  const navigate = useNavigate()
  const { theme } = useAccent()
  const { isDark } = useTheme()
  const isMobile = useIsMobile()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) { setError(error.message); setLoading(false); return }
    navigate('/dashboard')
  }

  const handleGoogle = async () => {
    setGoogleLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
    if (error) { setError('Google sign-in is not enabled. Please use email/password.'); setGoogleLoading(false) }
  }

  const panelBg = isDark ? 'rgba(13,11,20,0.92)' : 'rgba(255,255,255,0.97)'
  const divider  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const googleBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const googleBd = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', fontFamily: 'var(--ff)',
      background: isDark
        ? 'linear-gradient(135deg,#0D0B14 0%,#150F28 100%)'
        : 'linear-gradient(135deg,#F4F2F8 0%,#EDE8F5 100%)',
      flexDirection: isMobile ? 'column' : 'row',
    }}>

      {/* Form panel */}
      <div style={{
        width: isMobile ? '100%' : '460px',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '40px 24px 48px' : '48px',
        background: panelBg,
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderRight: isMobile ? 'none' : `1px solid ${googleBd}`,
        borderBottom: isMobile ? `1px solid ${googleBd}` : 'none',
      }}>
        <div style={{ width: '100%', maxWidth: '360px', animation: 'fadeUp 0.4s ease both' }}>

          {/* Logo */}
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: `linear-gradient(135deg,${theme.primary},${theme.glow3})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '900', fontSize: '16px', color: '#fff',
            marginBottom: '12px', boxShadow: `0 4px 16px ${theme.btnShadow}`,
          }}>P</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: '28px' }}>
            Prep<em style={{ color: theme.light, fontStyle: 'italic' }}>IQ</em>
          </div>

          <div style={{ fontSize: '0.65rem', fontWeight: '600', letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.light, marginBottom: '6px' }}>Welcome back</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: '6px' }}>Log in</h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--ink-muted)', marginBottom: '24px' }}>Pick up right where you left off.</p>

          {error && (
            <div style={{ background: 'var(--red-soft)', border: '1px solid var(--red-border)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--r-sm)', fontSize: '0.84rem', marginBottom: '16px', lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: '600', color: 'var(--ink-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Email</label>
              <input name="email" type="email" placeholder="you@gmail.com" value={form.email} onChange={handleChange} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: '600', color: 'var(--ink-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Password</label>
              <input name="password" type="password" placeholder="Your password" value={form.password} onChange={handleChange} required />
            </div>
            <button type="submit" disabled={loading} style={{
              padding: '13px', border: 'none', borderRadius: 'var(--r-md)',
              color: '#fff', fontWeight: '700', fontSize: '0.92rem',
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--ff)',
              background: `linear-gradient(135deg,${theme.primary},${theme.glow3})`,
              boxShadow: `0 4px 20px ${theme.btnShadow}`,
              marginTop: '4px', opacity: loading ? 0.7 : 1, transition: 'opacity .15s',
            }}>
              {loading ? 'Logging in…' : 'Log in →'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0 12px' }}>
            <div style={{ flex: 1, height: '1px', background: divider }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', flexShrink: 0 }}>or</span>
            <div style={{ flex: 1, height: '1px', background: divider }} />
          </div>

          <button onClick={handleGoogle} type="button" disabled={googleLoading} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            padding: '12px', background: googleBg, border: `1px solid ${googleBd}`,
            borderRadius: 'var(--r-md)', color: 'var(--ink)', fontSize: '0.88rem',
            cursor: googleLoading ? 'not-allowed' : 'pointer', fontFamily: 'var(--ff)',
            width: '100%', opacity: googleLoading ? 0.7 : 1, transition: 'opacity .15s',
          }}>
            {googleLoading
              ? <div style={{ width: '18px', height: '18px', border: '2px solid var(--border-mid)', borderTopColor: theme.primary, borderRadius: '50%', animation: 'spin .7s linear infinite', flexShrink: 0 }} />
              : <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
            }
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: '20px' }}>
            No account?{' '}
            <Link to="/signup" style={{ color: theme.light, fontWeight: '600', textDecoration: 'none' }}>Sign up free</Link>
          </p>
        </div>
      </div>

      {/* Right panel — desktop only */}
      {!isMobile && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
          <div style={{ maxWidth: '420px' }}>
            <div style={{ fontSize: '3.4rem', fontWeight: '800', color: 'var(--ink)', lineHeight: 1.05, marginBottom: '20px', letterSpacing: '-0.04em' }}>
              Back to<br /><em style={{ color: theme.light, fontStyle: 'italic' }}>studying.</em>
            </div>
            <p style={{ fontSize: '1rem', color: 'var(--ink-muted)', marginBottom: '36px', lineHeight: 1.6 }}>
              Everything you need to pass WASSCE, BECE and University entrance — in one place.
            </p>
            <div style={{ display: 'flex', gap: '36px' }}>
              {[['50K+', 'Questions'], ['20yrs', 'Past papers'], ['3', 'Exam types']].map(([n, l]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: theme.light, lineHeight: 1, marginBottom: '4px', letterSpacing: '-0.03em' }}>{n}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', fontWeight: '500' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}