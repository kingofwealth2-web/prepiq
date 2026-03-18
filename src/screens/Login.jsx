import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
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
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard` } })
  }

  return (
    <div style={s.shell}>
      {/* Left panel */}
      <div style={s.left}>
        <div style={s.leftInner}>
          <div style={s.logo}>Prep<em style={s.em}>IQ</em></div>
          <div style={s.eyebrow}>Welcome back</div>
          <h2 style={s.heading}>Log in to your account</h2>
          <p style={s.sub}>Pick up right where you left off.</p>

          {error && <div style={s.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.group}>
              <label style={s.label}>Email address</label>
              <input name="email" type="email" placeholder="you@gmail.com" value={form.email} onChange={handleChange} required />
            </div>
            <div style={s.group}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={s.label}>Password</label>
                <span style={s.forgot}>Forgot password?</span>
              </div>
              <input name="password" type="password" placeholder="Your password" value={form.password} onChange={handleChange} required />
            </div>
            <button style={s.btnPrimary} type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in →'}
            </button>
          </form>

          <div style={s.orRow}><div style={s.orLine} /><span style={s.orText}>or</span><div style={s.orLine} /></div>

          <button style={s.btnGoogle} onClick={handleGoogle} type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p style={s.switch}>No account? <Link to="/signup" style={s.link}>Sign up free</Link></p>
        </div>
      </div>

      {/* Right panel */}
      <div style={s.right}>
        <div style={s.kente} />
        <div style={s.rightInner}>
          <div style={s.bigText}>Back to<br /><em style={s.bigEm}>studying.</em></div>
          <p style={s.rightSub}>Everything you need to pass WASSCE and BECE — in one place.</p>
          <div style={s.rightStats}>
            {[['50K+', 'Questions'], ['20yrs', 'Past papers'], ['3', 'Exams']].map(([n, l]) => (
              <div key={l} style={s.rightStat}>
                <div style={s.rightStatNum}>{n}</div>
                <div style={s.rightStatLabel}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  shell: { display: 'flex', minHeight: '100vh', fontFamily: 'var(--ff-sans)' },
  left: { width: '460px', flexShrink: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', borderRight: '1px solid var(--border)' },
  leftInner: { width: '100%', maxWidth: '360px', animation: 'fadeUp 0.4s ease both' },
  logo: { fontFamily: 'var(--ff-serif)', fontSize: '1.6rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '32px' },
  em: { color: 'var(--gold-light)', fontStyle: 'italic' },
  eyebrow: { fontSize: '0.68rem', fontWeight: '600', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '6px' },
  heading: { fontFamily: 'var(--ff-serif)', fontSize: '1.5rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '6px' },
  sub: { fontSize: '0.88rem', color: 'var(--ink-muted)', marginBottom: '24px' },
  errorBox: { background: 'var(--red-pale)', border: '1px solid rgba(200,16,46,0.2)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--r-sm)', fontSize: '0.84rem', marginBottom: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' },
  group: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '0.72rem', fontWeight: '600', color: 'var(--ink-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '5px' },
  btnPrimary: { padding: '13px', background: 'var(--forest)', border: 'none', borderRadius: 'var(--r-sm)', color: '#F7F3EE', fontWeight: '600', fontSize: '0.92rem', cursor: 'pointer', marginTop: '4px', fontFamily: 'var(--ff-sans)', transition: 'opacity 0.15s' },
  forgot: { fontSize: '0.75rem', color: 'var(--gold)', cursor: 'pointer', fontWeight: '600' },
  orRow: { display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0 12px' },
  orLine: { flex: 1, height: '1px', background: 'var(--border-mid)' },
  orText: { fontSize: '0.78rem', color: 'var(--ink-faint)', flexShrink: 0 },
  btnGoogle: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', background: 'transparent', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-sm)', color: 'var(--ink)', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)', width: '100%' },
  switch: { textAlign: 'center', fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: '20px' },
  link: { color: 'var(--gold)', fontWeight: '600', textDecoration: 'none' },
  right: { flex: 1, background: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', position: 'relative', overflow: 'hidden' },
  kente: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: 'repeating-linear-gradient(180deg,#C8880A 0,#C8880A 12px,#009E73 12px,#009E73 24px,#C8102E 24px,#C8102E 36px,#1A5DC8 36px,#1A5DC8 48px)' },
  rightInner: { maxWidth: '420px' },
  bigText: { fontFamily: 'var(--ff-serif)', fontSize: '3.4rem', fontWeight: '700', color: '#F7F3EE', lineHeight: '1.05', marginBottom: '20px', letterSpacing: '-0.02em' },
  bigEm: { color: 'var(--gold-light)', fontStyle: 'italic' },
  rightSub: { fontSize: '1rem', color: 'rgba(247,243,238,0.55)', marginBottom: '36px', lineHeight: 1.6 },
  rightStats: { display: 'flex', gap: '36px' },
  rightStat: { textAlign: 'center' },
  rightStatNum: { fontFamily: 'var(--ff-serif)', fontSize: '2rem', fontWeight: '700', color: 'var(--gold-light)', lineHeight: 1, marginBottom: '4px' },
  rightStatLabel: { fontSize: '0.72rem', color: 'rgba(247,243,238,0.45)', fontWeight: '500' },
}
