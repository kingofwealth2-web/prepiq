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
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    })
    if (error) { setError(error.message); setLoading(false); return }
    navigate('/dashboard')
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
  }

  return (
    <div style={styles.shell}>
      <div style={styles.card}>
        <div style={styles.logo}>Prep<span style={styles.logoSpan}>IQ</span></div>
        <div style={styles.label}>WELCOME BACK</div>
        <h2 style={styles.heading}>Log in</h2>
        <p style={styles.sub}>Pick up right where you left off.</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.group}>
            <label style={styles.fieldLabel}>Email address</label>
            <input style={styles.input} name="email" type="email" placeholder="you@gmail.com"
              value={form.email} onChange={handleChange} required />
          </div>
          <div style={styles.group}>
            <label style={styles.fieldLabel}>Password</label>
            <input style={styles.input} name="password" type="password" placeholder="Your password"
              value={form.password} onChange={handleChange} required />
          </div>
          <div style={{ textAlign:'right' }}>
            <span style={styles.forgot}>Forgot password?</span>
          </div>
          <button style={styles.btnGold} type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <div style={styles.orLine}><span>or</span></div>
        <button style={styles.btnGoogle} onClick={handleGoogle} type="button">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        <p style={styles.switch}>No account? <Link to="/signup" style={styles.link}>Sign up free</Link></p>
      </div>
      <div style={styles.right}>
        <div style={styles.rightInner}>
          <div style={styles.bigText}>Back to<br /><em style={styles.gold}>studying.</em></div>
          <p style={styles.rightSub}>Everything you need to pass WASSCE and BECE — in one place.</p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  shell: { display:'flex', minHeight:'100vh', background:'#0D1117', fontFamily:'DM Sans, sans-serif' },
  card: { width:'480px', flexShrink:0, background:'#161B22', padding:'48px', display:'flex', flexDirection:'column', justifyContent:'center' },
  logo: { fontFamily:'Georgia, serif', fontSize:'2rem', fontWeight:'700', color:'#F0F6FC', marginBottom:'32px' },
  logoSpan: { color:'#F0A500' },
  label: { fontSize:'0.7rem', fontWeight:'600', letterSpacing:'0.1em', color:'#8B949E', marginBottom:'6px' },
  heading: { fontSize:'1.6rem', fontWeight:'700', color:'#F0F6FC', marginBottom:'6px', fontFamily:'Georgia, serif' },
  sub: { fontSize:'0.88rem', color:'#8B949E', marginBottom:'24px' },
  error: { background:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.3)', color:'#FF6B6B', padding:'10px 14px', borderRadius:'8px', fontSize:'0.85rem', marginBottom:'16px' },
  form: { display:'flex', flexDirection:'column', gap:'14px' },
  group: { display:'flex', flexDirection:'column', gap:'5px' },
  fieldLabel: { fontSize:'0.78rem', fontWeight:'600', color:'#8B949E', letterSpacing:'0.04em' },
  input: { padding:'12px 14px', background:'#1C2330', border:'1.5px solid rgba(240,246,252,0.1)', borderRadius:'8px', color:'#F0F6FC', fontSize:'0.9rem', fontFamily:'DM Sans, sans-serif', outline:'none' },
  btnGold: { padding:'13px', background:'#F0A500', border:'none', borderRadius:'8px', color:'#0D1117', fontWeight:'700', fontSize:'0.9rem', cursor:'pointer', marginTop:'4px', fontFamily:'DM Sans, sans-serif' },
  forgot: { fontSize:'0.78rem', color:'#F0A500', cursor:'pointer', fontWeight:'600' },
  orLine: { textAlign:'center', color:'#484F58', fontSize:'0.82rem', margin:'16px 0' },
  btnGoogle: { display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'12px', background:'transparent', border:'1.5px solid rgba(240,246,252,0.1)', borderRadius:'8px', color:'#F0F6FC', fontSize:'0.88rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif' },
  switch: { textAlign:'center', fontSize:'0.82rem', color:'#8B949E', marginTop:'20px' },
  link: { color:'#F0A500', fontWeight:'600' },
  right: { flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px' },
  rightInner: { maxWidth:'400px' },
  bigText: { fontFamily:'Georgia, serif', fontSize:'3.2rem', fontWeight:'700', color:'#F0F6FC', lineHeight:'1.1', marginBottom:'16px' },
  gold: { color:'#F0A500', fontStyle:'normal' },
  rightSub: { fontSize:'1rem', color:'#8B949E' },
}