import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import MobileHeader from '../components/MobileHeader'
import { useMobileMenu } from '../App'

function useCountUp(target, duration = 900, delay = 300) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!target) return
    const t = setTimeout(() => {
      const start = Date.now()
      const tick = () => {
        const p = Math.min((Date.now() - start) / duration, 1)
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * target))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(t)
  }, [target])
  return val
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { open: mobileMenuOpen, setOpen: setMobileMenuOpen } = useMobileMenu()
  const [user, setUser] = useState(null)
  const [streak, setStreak] = useState(0)
  const [stats, setStats] = useState({ questions: 0, accuracy: 0, mocks: 0 })
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  const qUp = useCountUp(stats.questions, 900, 350)
  const aUp = useCountUp(stats.accuracy, 800, 450)
  const sUp = useCountUp(streak, 700, 550)
  const mUp = useCountUp(stats.mocks, 600, 650)

  useEffect(() => {
    loadDashboard()
    const on = () => setIsOnline(true), off = () => setIsOnline(false)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  async function loadDashboard() {
    const { data: { user: au } } = await supabase.auth.getUser()
    if (!au) { navigate('/login'); return }
    const { data: profile } = await supabase.from('users').select('*').eq('id', au.id).single()
    const { data: streakData } = await supabase.from('streaks').select('*').eq('user_id', au.id).single()
    const { count: mockCount } = await supabase.from('mock_exams').select('*', { count: 'exact', head: true }).eq('user_id', au.id).not('submitted_at', 'is', null)
    const { data: examIds } = await supabase.from('mock_exams').select('id').eq('user_id', au.id)
    let qCount = 0, cCount = 0
    if (examIds?.length) {
      const ids = examIds.map(e => e.id)
      const { count: q } = await supabase.from('mock_responses').select('*', { count: 'exact', head: true }).in('exam_id', ids)
      const { count: c } = await supabase.from('mock_responses').select('*', { count: 'exact', head: true }).in('exam_id', ids).eq('is_correct', true)
      qCount = q || 0; cCount = c || 0
    }
    const { count: practiceCount } = await supabase.from('mock_responses').select('*', { count: 'exact', head: true }).eq('user_id', au.id).is('exam_id', null)
    const total = qCount + (practiceCount || 0)
    const acc = total > 0 ? Math.round((cCount / Math.max(qCount, 1)) * 100) : 0
    setUser(profile); setStreak(streakData?.current_streak || 0)
    setStats({ questions: total, accuracy: acc, mocks: mockCount || 0 })
    setLoading(false)
  }

  const daysLeft = () => !user?.exam_date ? null : Math.max(0, Math.ceil((new Date(user.exam_date) - new Date()) / 86400000))
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }
  const readiness = Math.min(100, Math.round((Math.min(stats.questions, 200) / 200 * 40) + (stats.accuracy * 0.4) + (Math.min(stats.mocks, 5) / 5 * 20)))

  // Ring: circumference = 2 * π * r = 2 * 3.14159 * 38 ≈ 238.76
  const CIRC = 238.76
  const ringOffset = CIRC - (CIRC * readiness / 100)

  if (loading) return (
    <div style={s.loadShell}>
      <div style={s.spinner} />
    </div>
  )

  return (
    <div style={s.shell}>
      <Sidebar user={user} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <main style={s.main}>
        {!isOnline && <div style={s.offline}>⚠️ You're offline — showing cached content.</div>}
        <MobileHeader title="Dashboard" onMenuOpen={() => setMobileMenuOpen(true)}
          right={daysLeft() !== null && <div style={s.daysChipSm}>{daysLeft()}d</div>}
        />
        <div style={s.topbar}>
          <div style={s.topbarTitle}>Dashboard</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {daysLeft() !== null && (
              <div style={s.daysChip}>
                <span style={s.daysNum}>{daysLeft()}</span>
                <span style={s.daysLbl}>days to {user?.exam_type || 'exam'}</span>
              </div>
            )}
            <div style={s.readBadge}>
              <span style={s.readNum}>{readiness}</span>
              <span style={s.readLbl}>Readiness</span>
            </div>
          </div>
        </div>

        <div style={s.content}>

          {/* Hero */}
          <div style={s.hero}>
            <div style={s.kente} />
            <div style={s.heroLeft}>
              <div style={s.greeting}>{greeting()}</div>
              <h1 style={s.name}>{user?.full_name?.split(' ')[0] || 'Student'}</h1>
              <div style={s.badges}>
                {streak > 0 && <div style={s.badgeAccent}>🔥 {streak}-day streak</div>}
                {daysLeft() !== null && <div style={s.badgeMuted}>{user?.exam_type} · {daysLeft()} days</div>}
                {stats.questions > 0 && <div style={s.badgeGreen}>{stats.questions} questions done</div>}
              </div>
            </div>
            <div style={s.ringWrap}>
              <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
                <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
                <circle cx="45" cy="45" r="38" fill="none"
                  stroke="var(--accent-primary)" strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={ringOffset}
                  style={{ transition: 'stroke-dashoffset 1.2s ease, stroke .4s' }}
                />
              </svg>
              <div style={s.ringInner}>
                <div style={s.ringNum}>{readiness}</div>
                <div style={s.ringLbl}>score</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={s.statsGrid}>
            {[
              { num: qUp, label: 'Questions done', sub: stats.questions === 0 ? 'Start practising' : 'Keep going!' },
              { num: `${aUp}%`, label: 'Accuracy', sub: stats.questions > 0 ? 'Based on your answers' : 'Answer to track this' },
              { num: sUp, label: 'Day streak', sub: streak === 0 ? 'Log in daily' : 'Keep it alive!' },
              { num: mUp, label: 'Mock exams', sub: stats.mocks === 0 ? 'Take your first' : `${stats.mocks} completed` },
            ].map((stat, i) => (
              <div key={i} style={s.statCard}>
                <div style={s.statNum}>{stat.num}</div>
                <div style={s.statLabel}>{stat.label}</div>
                <div style={s.statSub}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Predictions banner */}
          <div style={s.predBanner} onClick={() => navigate('/predictions')}>
            <div style={s.predKente} />
            <div style={s.predIcon}>★</div>
            <div style={s.predText}>
              <div style={s.predTitle}>PrepIQ Predictions — {user?.exam_type || 'WASSCE'} {new Date().getFullYear()}</div>
              <div style={s.predSub}>AI-analysed topics most likely to appear. See full analysis →</div>
            </div>
            <div style={s.premBadge}>Premium</div>
          </div>

          {/* Bottom */}
          <div style={s.bottom}>
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Today's goal</h3>
                <button style={s.cardLink} onClick={() => navigate('/plan')}>View plan →</button>
              </div>
              <div style={s.emptyState}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📖</div>
                <div style={s.emptyTitle}>{stats.mocks > 0 ? 'Study plan ready' : 'No study plan yet'}</div>
                <div style={s.emptySub}>{stats.mocks > 0 ? 'Check your personalised plan' : 'Take a mock exam to generate it'}</div>
              </div>
              <button style={s.btnPrimary} onClick={() => navigate(stats.mocks > 0 ? '/plan' : '/practice')}>
                {stats.mocks > 0 ? 'View study plan' : 'Start practising'}
              </button>
            </div>
            <div style={s.card}>
              <div style={s.cardHeader}><h3 style={s.cardTitle}>Quick actions</h3></div>
              <div style={s.actions}>
                {[
                  { label: 'Practice', icon: '📖', path: '/practice' },
                  { label: 'Mock exam', icon: '📝', path: '/mock' },
                  { label: 'Flashcards', icon: '🃏', path: '/flashcards' },
                  { label: 'Go Premium', icon: '💎', path: '/premium' },
                ].map(a => (
                  <button key={a.path} style={s.actionBtn} onClick={() => navigate(a.path)}>
                    <div style={s.actionIcon}>{a.icon}</div>
                    <div style={s.actionLbl}>{a.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

const s = {
  shell: { display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff)' },
  loadShell: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: '28px', height: '28px', border: '2.5px solid var(--border-mid)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin .7s linear infinite' },
  main: { flex: 1, marginLeft: 'var(--sidebar-w)', display: 'flex', flexDirection: 'column', minHeight: '100vh' },
  offline: { background: 'var(--amber-soft)', borderBottom: '1px solid var(--amber-border)', color: 'var(--amber)', padding: '9px 20px', fontSize: '.82rem', fontWeight: '500' },
  topbar: { height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'var(--surface-solid)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontSize: '.95rem', fontWeight: '700', color: 'var(--ink)', letterSpacing: '-.02em' },
  daysChip: { display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--red-soft)', border: '1px solid var(--red-border)', padding: '4px 10px', borderRadius: '20px' },
  daysNum: { fontSize: '.95rem', fontWeight: '800', color: 'var(--red)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' },
  daysLbl: { fontSize: '.66rem', color: 'var(--red)', fontWeight: '500' },
  daysChipSm: { background: 'var(--red-soft)', color: 'var(--red)', border: '1px solid var(--red-border)', padding: '3px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' },
  readBadge: { display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', padding: '4px 11px', borderRadius: '20px' },
  readNum: { fontSize: '.95rem', fontWeight: '800', color: 'var(--accent-primary)', lineHeight: 1 },
  readLbl: { fontSize: '.66rem', color: 'var(--accent-primary)', fontWeight: '500' },
  content: { flex: 1, padding: '18px 20px 60px' },

  // Hero — always dark card so text can be light
  hero: { background: 'linear-gradient(135deg,#1A1530 0%,#120E22 100%)', borderRadius: 'var(--r-xl)', padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,.07)' },
  kente: { position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 14px,#009E73 14px,#009E73 28px,#C8102E 28px,#C8102E 42px,#1A5DC8 42px,#1A5DC8 56px)' },
  heroLeft: { flex: 1, minWidth: 0 },
  greeting: { fontSize: '.72rem', color: 'rgba(255,255,255,.45)', marginBottom: '3px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '.08em' },
  name: { fontSize: '1.75rem', fontWeight: '800', color: '#fff', marginBottom: '12px', letterSpacing: '-.04em', lineHeight: 1.1 },
  badges: { display: 'flex', gap: '7px', flexWrap: 'wrap' },
  badgeAccent: { background: 'var(--accent-soft)', color: 'var(--accent-light)', border: '1px solid var(--accent-border)', padding: '4px 10px', borderRadius: '20px', fontSize: '.7rem', fontWeight: '600' },
  badgeMuted: { background: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.5)', padding: '4px 10px', borderRadius: '20px', fontSize: '.7rem' },
  badgeGreen: { background: 'rgba(52,211,153,.12)', color: '#34D399', border: '1px solid rgba(52,211,153,.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '.7rem', fontWeight: '500' },

  // Ring — positioned correctly
  ringWrap: { position: 'relative', width: '90px', height: '90px', flexShrink: 0 },
  ringInner: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  ringNum: { fontSize: '1.45rem', fontWeight: '800', color: 'var(--accent-light)', lineHeight: 1, letterSpacing: '-.04em', fontVariantNumeric: 'tabular-nums' },
  ringLbl: { fontSize: '.5rem', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: '2px' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginBottom: '12px' },
  statCard: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '15px', animation: 'fadeUp .4s ease both' },
  statNum: { fontSize: '1.75rem', fontWeight: '800', color: 'var(--accent-primary)', lineHeight: 1, marginBottom: '3px', fontVariantNumeric: 'tabular-nums' },
  statLabel: { fontSize: '.72rem', color: 'var(--ink-mid)', fontWeight: '600', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '.05em' },
  statSub: { fontSize: '.65rem', color: 'var(--ink-faint)' },

  predBanner: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer', position: 'relative', overflow: 'hidden' },
  predKente: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px', background: 'repeating-linear-gradient(180deg,#C8880A 0,#C8880A 10px,#009E73 10px,#009E73 20px,#C8102E 20px,#C8102E 30px,#1A5DC8 30px,#1A5DC8 40px)' },
  predIcon: { fontSize: '1.3rem', flexShrink: 0, marginLeft: '6px' },
  predText: { flex: 1, minWidth: 0 },
  predTitle: { fontSize: '.82rem', fontWeight: '600', color: 'var(--ink)', marginBottom: '2px' },
  predSub: { fontSize: '.7rem', color: 'var(--ink-muted)' },
  premBadge: { background: 'var(--accent-soft)', color: 'var(--accent-light)', border: '1px solid var(--accent-border)', padding: '3px 8px', borderRadius: '20px', fontSize: '.66rem', fontWeight: '700', flexShrink: 0 },

  bottom: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '10px' },
  card: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '15px' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' },
  cardTitle: { fontSize: '.75rem', fontWeight: '700', color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '.07em' },
  cardLink: { background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '.75rem', cursor: 'pointer', fontFamily: 'var(--ff)', fontWeight: '600' },
  emptyState: { textAlign: 'center', padding: '10px 0', marginBottom: '12px' },
  emptyTitle: { fontSize: '.84rem', fontWeight: '600', color: 'var(--ink)', marginBottom: '3px' },
  emptySub: { fontSize: '.72rem', color: 'var(--ink-faint)' },
  btnPrimary: { width: '100%', padding: '11px', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--r-sm)', color: '#fff', fontWeight: '700', fontSize: '.84rem', cursor: 'pointer', fontFamily: 'var(--ff)', boxShadow: '0 4px 16px var(--accent-btn-shadow)' },
  actions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' },
  actionBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', padding: '11px 6px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', cursor: 'pointer', fontFamily: 'var(--ff)', transition: 'background .15s' },
  actionIcon: { fontSize: '1.1rem' },
  actionLbl: { fontSize: '.66rem', fontWeight: '500', color: 'var(--ink-muted)', textAlign: 'center' },
}