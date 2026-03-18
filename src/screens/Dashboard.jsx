import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [streak, setStreak] = useState(0)
  const [stats, setStats] = useState({ questions: 0, accuracy: 0, mocks: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { navigate('/login'); return }
    const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    const { data: streakData } = await supabase.from('streaks').select('*').eq('user_id', authUser.id).single()
    const { count: mockCount } = await supabase.from('mock_exams').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id)
    setUser(profile)
    setStreak(streakData?.current_streak || 0)
    setStats({ questions: 0, accuracy: 0, mocks: mockCount || 0 })
    setLoading(false)
  }

  const getDaysLeft = () => {
    if (!user?.exam_date) return null
    return Math.max(0, Math.ceil((new Date(user.exam_date) - new Date()) / 86400000))
  }

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const readinessScore = Math.min(100, Math.round((stats.questions * 0.3) + (stats.accuracy * 0.5) + (stats.mocks * 2)))

  if (loading) return (
    <div style={s.loadShell}>
      <div style={s.loadLogo}>Prep<em style={{ color: 'var(--gold-light)', fontStyle: 'italic' }}>IQ</em></div>
    </div>
  )

  return (
    <div style={s.shell}>
      <Sidebar user={user} />
      <main style={s.main}>
        {/* Topbar */}
        <div style={s.topbar}>
          <div style={s.topbarTitle}>Dashboard</div>
          <div style={s.topbarRight}>
            {getDaysLeft() !== null && (
              <div style={s.daysChip}>
                <span style={s.daysNum}>{getDaysLeft()}</span>
                <span style={s.daysLabel}>days to {user?.exam_type || 'exam'}</span>
              </div>
            )}
            <div style={s.readinessBadge}>
              <span style={s.readinessNum}>{readinessScore}</span>
              <span style={s.readinessLabel}>Readiness</span>
            </div>
          </div>
        </div>

        <div style={s.content}>
          {/* Hero */}
          <div style={s.hero}>
            <div style={s.kente} />
            <div style={s.heroLeft}>
              <div style={s.heroGreeting}>{getGreeting()}</div>
              <h1 style={s.heroName}>{user?.full_name?.split(' ')[0] || 'Student'}</h1>
              <div style={s.heroBadges}>
                {streak > 0 && <div style={s.badgeGold}>🔥 {streak}-day streak</div>}
                {getDaysLeft() !== null && <div style={s.badgeNeutral}>{user?.exam_type} · {getDaysLeft()} days</div>}
                <div style={s.badgeTeal}>{stats.questions} questions done</div>
              </div>
            </div>
            <div style={s.heroRing}>
              <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="45" cy="45" r="38" fill="none" stroke="var(--cream-dark)" strokeWidth="7" />
                <circle cx="45" cy="45" r="38" fill="none" stroke="var(--gold)" strokeWidth="7"
                  strokeLinecap="round" strokeDasharray="239"
                  strokeDashoffset={239 - (239 * readinessScore / 100)} />
              </svg>
              <div style={s.ringNum}>{readinessScore}</div>
            </div>
          </div>

          {/* Stats */}
          <div style={s.statsGrid}>
            {[
              { num: stats.questions, label: 'Questions done', sub: 'Start practising to grow this' },
              { num: `${stats.accuracy}%`, label: 'Accuracy', sub: 'Based on your answers' },
              { num: streak, label: 'Day streak', sub: 'Log in daily to build it' },
              { num: stats.mocks, label: 'Mock exams', sub: 'Take your first mock exam' },
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

          {/* Bottom grid */}
          <div style={s.dashGrid}>
            <div style={s.dashCard}>
              <div style={s.dashCardHeader}>
                <h3 style={s.dashCardTitle}>Today's goal</h3>
                <button style={s.dashCardLink} onClick={() => navigate('/plan')}>View plan →</button>
              </div>
              <div style={s.emptyState}>
                <div style={s.emptyIcon}>📖</div>
                <div style={s.emptyText}>No study plan yet</div>
                <div style={s.emptySub}>Take a mock exam to generate your plan</div>
              </div>
              <button style={s.btnPrimary} onClick={() => navigate('/practice')}>Start practising</button>
            </div>
            <div style={s.dashCard}>
              <div style={s.dashCardHeader}>
                <h3 style={s.dashCardTitle}>Quick actions</h3>
              </div>
              <div style={s.actionGrid}>
                {[
                  { label: 'Practice questions', icon: '📖', path: '/practice' },
                  { label: 'Take mock exam', icon: '📝', path: '/mock' },
                  { label: 'Flashcards', icon: '🃏', path: '/flashcards' },
                  { label: 'Go Premium', icon: '💎', path: '/premium' },
                ].map(action => (
                  <button key={action.path} style={s.actionBtn} onClick={() => navigate(action.path)}>
                    <div style={s.actionIcon}>{action.icon}</div>
                    <div style={s.actionLabel}>{action.label}</div>
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
  shell: { display: 'flex', minHeight: '100vh', background: 'var(--surface-mid)', fontFamily: 'var(--ff-sans)' },
  loadShell: { minHeight: '100vh', background: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadLogo: { fontFamily: 'var(--ff-serif)', fontSize: '2.5rem', fontWeight: '700', color: '#F7F3EE' },
  main: { flex: 1, marginLeft: '220px', display: 'flex', flexDirection: 'column', minHeight: '100vh' },
  topbar: { height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1.05rem', fontWeight: '700', color: 'var(--ink)' },
  topbarRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  daysChip: { display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--red-pale)', border: '1px solid rgba(200,16,46,0.15)', padding: '5px 12px', borderRadius: '20px' },
  daysNum: { fontFamily: 'var(--ff-serif)', fontSize: '1rem', fontWeight: '700', color: 'var(--red)', lineHeight: 1 },
  daysLabel: { fontSize: '0.7rem', color: 'var(--red)', fontWeight: '500' },
  readinessBadge: { display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--gold-pale)', border: '1px solid var(--gold-border)', padding: '5px 14px', borderRadius: '20px' },
  readinessNum: { fontFamily: 'var(--ff-serif)', fontSize: '1.1rem', fontWeight: '700', color: 'var(--gold)', lineHeight: 1 },
  readinessLabel: { fontSize: '0.7rem', color: 'var(--gold)', fontWeight: '500' },
  content: { flex: 1, padding: '24px 28px 60px' },
  hero: { background: 'var(--forest)', borderRadius: 'var(--r-xl)', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.4s ease both' },
  kente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)' },
  heroLeft: {},
  heroGreeting: { fontSize: '0.78rem', color: 'rgba(247,243,238,0.5)', marginBottom: '2px', fontWeight: '500' },
  heroName: { fontFamily: 'var(--ff-serif)', fontSize: '2rem', fontWeight: '700', color: '#F7F3EE', marginBottom: '14px', letterSpacing: '-0.02em', lineHeight: 1.1 },
  heroBadges: { display: 'flex', gap: '7px', flexWrap: 'wrap' },
  badgeGold: { background: 'rgba(200,136,10,0.2)', color: 'var(--gold-light)', border: '1px solid rgba(200,136,10,0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600' },
  badgeNeutral: { background: 'rgba(247,243,238,0.08)', color: 'rgba(247,243,238,0.55)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '500' },
  badgeTeal: { background: 'rgba(0,158,115,0.15)', color: '#00C896', padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '500' },
  heroRing: { position: 'relative', width: '90px', height: '90px', flexShrink: 0 },
  ringNum: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'var(--ff-serif)', fontSize: '1.6rem', fontWeight: '700', color: 'var(--gold-light)', lineHeight: 1 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '16px' },
  statCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px 16px', boxShadow: 'var(--shadow-sm)', animation: 'fadeUp 0.4s ease both' },
  statNum: { fontFamily: 'var(--ff-serif)', fontSize: '2rem', fontWeight: '700', color: 'var(--gold)', lineHeight: 1, marginBottom: '4px' },
  statLabel: { fontSize: '0.75rem', color: 'var(--ink-mid)', fontWeight: '600', marginBottom: '2px' },
  statSub: { fontSize: '0.67rem', color: 'var(--ink-faint)' },
  predBanner: { background: 'var(--forest)', borderRadius: 'var(--r-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', cursor: 'pointer', position: 'relative', overflow: 'hidden' },
  predKente: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px', background: 'repeating-linear-gradient(180deg,#C8880A 0,#C8880A 12px,#009E73 12px,#009E73 24px,#C8102E 24px,#C8102E 36px,#1A5DC8 36px,#1A5DC8 48px)' },
  predIcon: { fontSize: '1.5rem', flexShrink: 0, marginLeft: '8px' },
  predText: { flex: 1 },
  predTitle: { fontSize: '0.88rem', fontWeight: '600', color: '#F7F3EE', marginBottom: '3px' },
  predSub: { fontSize: '0.75rem', color: 'rgba(247,243,238,0.5)' },
  premBadge: { background: 'rgba(200,136,10,0.2)', color: 'var(--gold-light)', border: '1px solid rgba(200,136,10,0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', flexShrink: 0 },
  dashGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' },
  dashCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' },
  dashCardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  dashCardTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1rem', fontWeight: '700', color: 'var(--ink)' },
  dashCardLink: { background: 'transparent', border: 'none', color: 'var(--gold)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)', fontWeight: '600' },
  emptyState: { textAlign: 'center', padding: '16px 0', marginBottom: '16px' },
  emptyIcon: { fontSize: '2rem', marginBottom: '8px' },
  emptyText: { fontSize: '0.88rem', fontWeight: '600', color: 'var(--ink)', marginBottom: '4px' },
  emptySub: { fontSize: '0.75rem', color: 'var(--ink-faint)' },
  btnPrimary: { width: '100%', padding: '12px', background: 'var(--forest)', border: 'none', borderRadius: 'var(--r-sm)', color: '#F7F3EE', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
  actionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  actionBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '14px 8px', background: 'var(--cream-mid)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', cursor: 'pointer', fontFamily: 'var(--ff-sans)', transition: 'background 0.15s' },
  actionIcon: { fontSize: '1.3rem' },
  actionLabel: { fontSize: '0.72rem', fontWeight: '500', color: 'var(--ink-muted)', textAlign: 'center', lineHeight: 1.3 },
}
