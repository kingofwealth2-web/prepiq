import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import MobileHeader from '../components/MobileHeader'
import { useMobileMenu } from '../App'

export default function Dashboard() {
  const navigate = useNavigate()
  const { open: mobileMenuOpen, setOpen: setMobileMenuOpen } = useMobileMenu()
  const [user, setUser] = useState(null)
  const [streak, setStreak] = useState(0)
  const [stats, setStats] = useState({ questions: 0, accuracy: 0, mocks: 0 })
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    loadDashboard()
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  async function loadDashboard() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { navigate('/login'); return }

    const { data: profile } = await supabase
      .from('users').select('*').eq('id', authUser.id).single()

    const { data: streakData } = await supabase
      .from('streaks').select('*').eq('user_id', authUser.id).single()

    // Count mock exams
    const { count: mockCount } = await supabase
      .from('mock_exams').select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.id).not('submitted_at', 'is', null)

    // Get all exam IDs for this user
    const { data: examIds } = await supabase
      .from('mock_exams').select('id').eq('user_id', authUser.id)

    let questionCount = 0
    let correctCount = 0

    if (examIds && examIds.length > 0) {
      const ids = examIds.map(e => e.id)
      // Count total responses
      const { count: qCount } = await supabase
        .from('mock_responses').select('*', { count: 'exact', head: true })
        .in('exam_id', ids)
      // Count correct responses
      const { count: cCount } = await supabase
        .from('mock_responses').select('*', { count: 'exact', head: true })
        .in('exam_id', ids).eq('is_correct', true)

      questionCount = qCount || 0
      correctCount = cCount || 0
    }

    // Also count individual practice attempts (exam_id is null)
    const { count: practiceCount } = await supabase
      .from('mock_responses').select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.id).is('exam_id', null)

    const totalQuestions = questionCount + (practiceCount || 0)
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / questionCount) * 100) : 0

    setUser(profile)
    setStreak(streakData?.current_streak || 0)
    setStats({ questions: totalQuestions, accuracy, mocks: mockCount || 0 })
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

  const readinessScore = Math.min(100, Math.round(
    (Math.min(stats.questions, 200) / 200 * 40) +
    (stats.accuracy * 0.4) +
    (Math.min(stats.mocks, 5) / 5 * 20)
  ))

  if (loading) return (
    <div style={s.loadShell}>
      <div style={s.loadLogo}>Prep<em style={{ color: 'var(--gold-light)', fontStyle: 'italic' }}>IQ</em></div>
    </div>
  )

  return (
    <div style={s.shell}>
      <Sidebar user={user} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <main style={s.main}>

        {/* Offline banner */}
        {!isOnline && (
          <div style={s.offlineBanner}>
            ⚠️ You're offline — showing cached content. Some features may be unavailable.
          </div>
        )}

        <MobileHeader title="Dashboard" onMenuOpen={() => setMobileMenuOpen(true)} />
        <div style={{...s.topbar, display: 'flex'}}>
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

        <div style={s.content} className="has-bottom-nav">
          {/* Hero */}
          <div style={s.hero}>
            <div style={s.kente} />
            <div style={s.heroLeft}>
              <div style={s.heroGreeting}>{getGreeting()}</div>
              <h1 style={s.heroName}>{user?.full_name?.split(' ')[0] || 'Student'}</h1>
              <div style={s.heroBadges}>
                {streak > 0 && <div style={s.badgeGold}>🔥 {streak}-day streak</div>}
                {getDaysLeft() !== null && <div style={s.badgeNeutral}>{user?.exam_type} · {getDaysLeft()} days</div>}
                {stats.questions > 0 && <div style={s.badgeTeal}>{stats.questions} questions done</div>}
              </div>
            </div>
            <div style={s.heroRing}>
              <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(247,243,238,0.15)" strokeWidth="7" />
                <circle cx="45" cy="45" r="38" fill="none" stroke="var(--gold)" strokeWidth="7"
                  strokeLinecap="round" strokeDasharray="239"
                  strokeDashoffset={239 - (239 * readinessScore / 100)} />
              </svg>
              <div style={s.ringNum}>{readinessScore}</div>
            </div>
          </div>

          {/* Stats grid */}
          <div style={s.statsGrid}>
            {[
              { num: stats.questions, label: 'Questions done', sub: stats.questions === 0 ? 'Start practising to grow this' : 'Keep going!' },
              { num: stats.questions > 0 ? `${stats.accuracy}%` : '—', label: 'Accuracy', sub: stats.questions > 0 ? 'Based on your answers' : 'Answer questions to track this' },
              { num: streak, label: 'Day streak', sub: streak === 0 ? 'Log in daily to build it' : 'Keep the streak alive!' },
              { num: stats.mocks, label: 'Mock exams', sub: stats.mocks === 0 ? 'Take your first mock exam' : `${stats.mocks} exam${stats.mocks > 1 ? 's' : ''} completed` },
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
                <div style={s.emptyText}>{stats.mocks > 0 ? 'Study plan ready' : 'No study plan yet'}</div>
                <div style={s.emptySub}>{stats.mocks > 0 ? 'Check your personalised plan' : 'Take a mock exam to generate your plan'}</div>
              </div>
              <button style={s.btnPrimary} onClick={() => navigate(stats.mocks > 0 ? '/plan' : '/practice')}>
                {stats.mocks > 0 ? 'View study plan' : 'Start practising'}
              </button>
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
  shell: { display: 'flex', minHeight: '100vh', background: 'var(--cream)', fontFamily: 'var(--ff-sans)' },
  loadShell: { minHeight: '100vh', background: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadLogo: { fontFamily: 'var(--ff-serif)', fontSize: '2.5rem', fontWeight: '700', color: '#F7F3EE' },
  main: { flex: 1, marginLeft: 'var(--sidebar-w)', display: 'flex', flexDirection: 'column', minHeight: '100vh' },
  offlineBanner: { background: 'var(--gold-pale)', borderBottom: '1px solid var(--gold-border)', color: 'var(--gold)', padding: '10px 28px', fontSize: '0.84rem', fontWeight: '500' },
  topbar: { height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1.05rem', fontWeight: '700', color: 'var(--ink)' },
  topbarRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  daysChip: { display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--red-pale)', border: '1px solid rgba(200,16,46,0.15)', padding: '5px 10px', borderRadius: '20px' },
  daysNum: { fontFamily: 'var(--ff-serif)', fontSize: '1rem', fontWeight: '700', color: 'var(--red)', lineHeight: 1 },
  daysLabel: { fontSize: '0.68rem', color: 'var(--red)', fontWeight: '500' },
  readinessBadge: { display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--gold-pale)', border: '1px solid var(--gold-border)', padding: '5px 12px', borderRadius: '20px' },
  readinessNum: { fontFamily: 'var(--ff-serif)', fontSize: '1.1rem', fontWeight: '700', color: 'var(--gold)', lineHeight: 1 },
  readinessLabel: { fontSize: '0.68rem', color: 'var(--gold)', fontWeight: '500' },
  content: { flex: 1, padding: '20px 20px 60px' },
  hero: { background: 'var(--forest-mid)', borderRadius: 'var(--r-xl)', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.4s ease both' },
  kente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)' },
  heroLeft: { flex: 1, minWidth: 0 },
  heroGreeting: { fontSize: '0.78rem', color: 'rgba(247,243,238,0.5)', marginBottom: '2px', fontWeight: '500' },
  heroName: { fontFamily: 'var(--ff-serif)', fontSize: '1.8rem', fontWeight: '700', color: '#F7F3EE', marginBottom: '12px', letterSpacing: '-0.02em', lineHeight: 1.1 },
  heroBadges: { display: 'flex', gap: '7px', flexWrap: 'wrap' },
  badgeGold: { background: 'rgba(200,136,10,0.2)', color: 'var(--gold-light)', border: '1px solid rgba(200,136,10,0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600' },
  badgeNeutral: { background: 'rgba(247,243,238,0.08)', color: 'rgba(247,243,238,0.55)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '500' },
  badgeTeal: { background: 'rgba(0,158,115,0.15)', color: '#00C896', padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '500' },
  heroRing: { position: 'relative', width: '90px', height: '90px', flexShrink: 0 },
  ringNum: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'var(--ff-serif)', fontSize: '1.5rem', fontWeight: '700', color: 'var(--gold-light)', lineHeight: 1 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginBottom: '14px' },
  statCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '16px', boxShadow: 'var(--shadow-sm)', animation: 'fadeUp 0.4s ease both' },
  statNum: { fontFamily: 'var(--ff-serif)', fontSize: '1.8rem', fontWeight: '700', color: 'var(--gold)', lineHeight: 1, marginBottom: '4px' },
  statLabel: { fontSize: '0.75rem', color: 'var(--ink-mid)', fontWeight: '600', marginBottom: '2px' },
  statSub: { fontSize: '0.67rem', color: 'var(--ink-faint)' },
  predBanner: { background: 'var(--forest-mid)', borderRadius: 'var(--r-lg)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', cursor: 'pointer', position: 'relative', overflow: 'hidden' },
  predKente: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px', background: 'repeating-linear-gradient(180deg,#C8880A 0,#C8880A 12px,#009E73 12px,#009E73 24px,#C8102E 24px,#C8102E 36px,#1A5DC8 36px,#1A5DC8 48px)' },
  predIcon: { fontSize: '1.4rem', flexShrink: 0, marginLeft: '8px' },
  predText: { flex: 1, minWidth: 0 },
  predTitle: { fontSize: '0.84rem', fontWeight: '600', color: '#F7F3EE', marginBottom: '2px' },
  predSub: { fontSize: '0.72rem', color: 'rgba(247,243,238,0.45)' },
  premBadge: { background: 'rgba(200,136,10,0.2)', color: 'var(--gold-light)', border: '1px solid rgba(200,136,10,0.3)', padding: '3px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '700', flexShrink: 0 },
  dashGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '12px' },
  dashCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px', boxShadow: 'var(--shadow-sm)' },
  dashCardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  dashCardTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1rem', fontWeight: '700', color: 'var(--ink)' },
  dashCardLink: { background: 'transparent', border: 'none', color: 'var(--gold)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)', fontWeight: '600' },
  emptyState: { textAlign: 'center', padding: '14px 0', marginBottom: '14px' },
  emptyIcon: { fontSize: '2rem', marginBottom: '8px' },
  emptyText: { fontSize: '0.88rem', fontWeight: '600', color: 'var(--ink)', marginBottom: '4px' },
  emptySub: { fontSize: '0.75rem', color: 'var(--ink-faint)' },
  btnPrimary: { width: '100%', padding: '12px', background: 'var(--forest-mid)', border: 'none', borderRadius: 'var(--r-sm)', color: '#F7F3EE', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
  actionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  actionBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '14px 8px', background: 'var(--surface-mid)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', cursor: 'pointer', fontFamily: 'var(--ff-sans)', transition: 'background 0.15s' },
  actionIcon: { fontSize: '1.3rem' },
  actionLabel: { fontSize: '0.72rem', fontWeight: '500', color: 'var(--ink-muted)', textAlign: 'center', lineHeight: 1.3 },
}