import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [streak, setStreak] = useState(0)
  const [stats, setStats] = useState({ questions: 0, accuracy: 0, mocks: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { navigate('/login'); return }

    const { data: profile } = await supabase
      .from('users').select('*').eq('id', authUser.id).single()

    const { data: streakData } = await supabase
      .from('streaks').select('*').eq('user_id', authUser.id).single()

    const { count: mockCount } = await supabase
      .from('mock_exams').select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.id)

    setUser(profile)
    setStreak(streakData?.current_streak || 0)
    setStats({ questions: 0, accuracy: 0, mocks: mockCount || 0 })
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const getDaysLeft = () => {
    if (!user?.exam_date) return null
    const diff = Math.ceil((new Date(user.exam_date) - new Date()) / 86400000)
    return Math.max(0, diff)
  }

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const readinessScore = Math.min(100, Math.round(
    (stats.questions * 0.3) + (stats.accuracy * 0.5) + (stats.mocks * 2)
  ))

  if (loading) return (
    <div style={s.loadShell}>
      <div style={s.loadLogo}>Prep<span style={s.gold}>IQ</span></div>
    </div>
  )

  return (
    <div style={s.shell}>

      {/* SIDEBAR */}
      <aside style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <div style={s.logoMark}>P</div>
          <div style={s.logoName}>Prep<span style={s.gold}>IQ</span></div>
        </div>
        <nav style={s.nav}>
          {[
            { label:'Dashboard', path:'/dashboard', icon:'⊞' },
            { label:'Practice', path:'/practice', icon:'📖' },
            { label:'Mock Exams', path:'/mock', icon:'📝' },
            { label:'Study Plan', path:'/plan', icon:'📅' },
            { label:'Performance', path:'/performance', icon:'📊' },
            { label:'Predictions', path:'/predictions', icon:'★' },
          ].map(item => (
            <button key={item.path}
              style={{ ...s.navItem, ...(window.location.pathname === item.path ? s.navItemActive : {}) }}
              onClick={() => navigate(item.path)}>
              <span style={s.navIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
          <div style={s.navDivider} />
          <button style={s.navItem} onClick={() => navigate('/premium')}>
            <span style={s.navIcon}>💎</span>
            Go Premium
          </button>
        </nav>
        <div style={s.sidebarFooter}>
          <div style={s.userRow}>
            <div style={s.avatar}>{user?.full_name?.[0] || 'P'}</div>
            <div>
              <div style={s.userName}>{user?.full_name || 'Student'}</div>
              <div style={s.userPlan}>Free plan</div>
            </div>
            <button style={s.logoutBtn} onClick={handleLogout} title="Log out">↩</button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={s.main}>

        {/* TOPBAR */}
        <div style={s.topbar}>
          <div style={s.topbarTitle}>Dashboard</div>
          <div style={s.topbarRight}>
            <div style={s.readinessBadge}>
              <div style={s.readinessNum}>{readinessScore}</div>
              <div style={s.readinessLabel}>Readiness<br />Score</div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={s.content}>

          {/* HERO BANNER */}
          <div style={s.hero}>
            <div style={s.heroKente} />
            <div>
              <div style={s.heroGreeting}>{getGreeting()},</div>
              <div style={s.heroName}>{user?.full_name?.split(' ')[0] || 'Student'}</div>
              <div style={s.heroBadges}>
                {streak > 0 && <div style={s.badge}>{streak}-day streak</div>}
                {getDaysLeft() !== null && <div style={s.badgeMuted}>{user?.exam_type} in {getDaysLeft()} days</div>}
                <div style={s.badgeTeal}>{stats.questions} questions done</div>
              </div>
            </div>
            <div style={s.readinessRing}>
              <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform:'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#F0A500" strokeWidth="8"
                  strokeLinecap="round" strokeDasharray="283"
                  strokeDashoffset={283 - (283 * readinessScore / 100)} />
              </svg>
              <div style={s.ringNum}>{readinessScore}</div>
            </div>
          </div>

          {/* STATS */}
          <div style={s.statsGrid}>
            {[
              { num: stats.questions, label:'Questions practiced', sub:'Start practicing to grow this' },
              { num: `${stats.accuracy}%`, label:'Average accuracy', sub:'Based on your answers' },
              { num: streak, label:'Day streak', sub:'Log in daily to build it' },
              { num: stats.mocks, label:'Mock exams done', sub:'Take your first mock exam' },
            ].map((stat, i) => (
              <div key={i} style={s.statCard}>
                <div style={s.statNum}>{stat.num}</div>
                <div style={s.statLabel}>{stat.label}</div>
                <div style={s.statSub}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* PREDICTIONS BANNER */}
          <div style={s.predBanner} onClick={() => navigate('/predictions')}>
            <div style={s.predIcon}>★</div>
            <div>
              <div style={s.predTitle}>PrepIQ Predictions — {user?.exam_type || 'WASSCE'} {new Date().getFullYear()}</div>
              <div style={s.predSub}>AI-analysed topics most likely to appear. See full analysis →</div>
            </div>
            <div style={s.premiumBadge}>Premium</div>
          </div>

          {/* DASHBOARD GRID */}
          <div style={s.dashGrid}>

            {/* TODAY'S GOAL */}
            <div style={s.dashCard}>
              <div style={s.dashCardHeader}>
                <h3 style={s.dashCardTitle}>Today's goal</h3>
                <button style={s.dashCardLink} onClick={() => navigate('/plan')}>View plan →</button>
              </div>
              <div style={s.emptyState}>
                <div style={s.emptyIcon}>📖</div>
                <div style={s.emptyText}>No study plan yet</div>
                <div style={s.emptySubtext}>Complete onboarding to generate your plan</div>
              </div>
              <button style={s.btnGold} onClick={() => navigate('/practice')}>
                Start practicing
              </button>
            </div>

            {/* QUICK ACTIONS */}
            <div style={s.dashCard}>
              <div style={s.dashCardHeader}>
                <h3 style={s.dashCardTitle}>Quick actions</h3>
              </div>
              <div style={s.actionGrid}>
                {[
                  { label:'Practice questions', icon:'📖', path:'/practice' },
                  { label:'Take mock exam', icon:'📝', path:'/mock' },
                  { label:'View performance', icon:'📊', path:'/performance' },
                  { label:'Go Premium', icon:'💎', path:'/premium' },
                ].map(action => (
                  <button key={action.path} style={s.actionBtn}
                    onClick={() => navigate(action.path)}>
                    <div style={s.actionIcon}>{action.icon}</div>
                    <div style={s.actionLabel}>{action.label}</div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav style={s.bottomNav}>
        {[
          { label:'Home', icon:'⊞', path:'/dashboard' },
          { label:'Practice', icon:'📖', path:'/practice' },
          { label:'Mock', icon:'📝', path:'/mock' },
          { label:'Stats', icon:'📊', path:'/performance' },
          { label:'Profile', icon:'👤', path:'/profile' },
        ].map(item => (
          <button key={item.path} style={s.bnav}
            onClick={() => navigate(item.path)}>
            <span style={{ fontSize:'1.1rem' }}>{item.icon}</span>
            <span style={s.bnavLabel}>{item.label}</span>
          </button>
        ))}
      </nav>

    </div>
  )
}

const s = {
  shell: { display:'flex', minHeight:'100vh', background:'#0D1117', fontFamily:'DM Sans, sans-serif', position:'relative' },
  loadShell: { minHeight:'100vh', background:'#0D1117', display:'flex', alignItems:'center', justifyContent:'center' },
  loadLogo: { fontFamily:'Georgia, serif', fontSize:'2.5rem', fontWeight:'700', color:'#F0F6FC' },
  gold: { color:'#F0A500' },

  // SIDEBAR
  sidebar: { width:'240px', flexShrink:0, background:'#161B22', borderRight:'1px solid rgba(240,246,252,0.06)', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0, zIndex:50 },
  sidebarLogo: { padding:'24px 20px 20px', borderBottom:'1px solid rgba(240,246,252,0.06)', display:'flex', alignItems:'center', gap:'10px' },
  logoMark: { width:'32px', height:'32px', borderRadius:'8px', background:'#F0A500', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Georgia, serif', fontSize:'1rem', fontWeight:'700', color:'#0D1117' },
  logoName: { fontFamily:'Georgia, serif', fontSize:'1.2rem', fontWeight:'700', color:'#F0F6FC' },
  nav: { flex:1, padding:'14px 10px', display:'flex', flexDirection:'column', gap:'2px', overflowY:'auto' },
  navItem: { display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'8px', border:'none', background:'transparent', color:'#8B949E', fontSize:'0.88rem', fontWeight:'500', cursor:'pointer', textAlign:'left', width:'100%', fontFamily:'DM Sans, sans-serif', transition:'all 0.2s' },
  navItemActive: { background:'rgba(240,165,0,0.1)', color:'#F0A500' },
  navIcon: { fontSize:'1rem', width:'20px', textAlign:'center' },
  navDivider: { height:'1px', background:'rgba(240,246,252,0.06)', margin:'8px 0' },
  sidebarFooter: { padding:'14px 10px', borderTop:'1px solid rgba(240,246,252,0.06)' },
  userRow: { display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'8px' },
  avatar: { width:'30px', height:'30px', borderRadius:'50%', background:'#F0A500', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Georgia, serif', fontSize:'0.9rem', fontWeight:'700', color:'#0D1117', flexShrink:0 },
  userName: { fontSize:'0.82rem', fontWeight:'600', color:'#F0F6FC' },
  userPlan: { fontSize:'0.7rem', color:'#8B949E' },
  logoutBtn: { marginLeft:'auto', background:'transparent', border:'none', color:'#8B949E', cursor:'pointer', fontSize:'1rem', padding:'4px' },

  // MAIN
  main: { flex:1, marginLeft:'240px', display:'flex', flexDirection:'column', minHeight:'100vh' },
  topbar: { height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', background:'#161B22', borderBottom:'1px solid rgba(240,246,252,0.06)', position:'sticky', top:0, zIndex:40 },
  topbarTitle: { fontFamily:'Georgia, serif', fontSize:'1.05rem', fontWeight:'600', color:'#F0F6FC' },
  topbarRight: { display:'flex', alignItems:'center', gap:'12px' },
  readinessBadge: { display:'flex', alignItems:'center', gap:'8px', background:'#1C2330', border:'1px solid rgba(240,246,252,0.08)', padding:'6px 14px', borderRadius:'20px' },
  readinessNum: { fontFamily:'Georgia, serif', fontSize:'1.3rem', fontWeight:'700', color:'#F0A500', lineHeight:1 },
  readinessLabel: { fontSize:'0.65rem', color:'#8B949E', lineHeight:1.3 },

  // CONTENT
  content: { flex:1, padding:'28px', paddingBottom:'80px', overflowY:'auto' },

  // HERO
  hero: { background:'#161B22', border:'1px solid rgba(240,246,252,0.06)', borderRadius:'18px', padding:'28px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', position:'relative', overflow:'hidden' },
  heroKente: { position:'absolute', top:0, left:0, right:0, height:'3px', background:'repeating-linear-gradient(90deg,#F0A500 0,#F0A500 20px,#00C896 20px,#00C896 40px,#FF6B6B 40px,#FF6B6B 60px,#4A9EFF 60px,#4A9EFF 80px)' },
  heroGreeting: { fontSize:'0.85rem', color:'#8B949E', marginBottom:'4px' },
  heroName: { fontFamily:'Georgia, serif', fontSize:'2rem', fontWeight:'700', color:'#F0F6FC', marginBottom:'12px', letterSpacing:'-0.02em' },
  heroBadges: { display:'flex', gap:'8px', flexWrap:'wrap' },
  badge: { background:'rgba(240,165,0,0.12)', color:'#F0A500', border:'1px solid rgba(240,165,0,0.2)', padding:'4px 10px', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'600' },
  badgeMuted: { background:'#1C2330', color:'#8B949E', border:'1px solid rgba(240,246,252,0.08)', padding:'4px 10px', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'500' },
  badgeTeal: { background:'rgba(0,200,150,0.1)', color:'#00C896', padding:'4px 10px', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'500' },
  readinessRing: { position:'relative', width:'100px', height:'100px', flexShrink:0 },
  ringNum: { position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontFamily:'Georgia, serif', fontSize:'1.8rem', fontWeight:'700', color:'#F0A500', lineHeight:1 },

  // STATS
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'20px' },
  statCard: { background:'#161B22', border:'1px solid rgba(240,246,252,0.06)', borderRadius:'14px', padding:'18px 16px' },
  statNum: { fontFamily:'Georgia, serif', fontSize:'2rem', fontWeight:'700', color:'#F0A500', lineHeight:1, marginBottom:'4px' },
  statLabel: { fontSize:'0.75rem', color:'#8B949E', fontWeight:'500', marginBottom:'2px' },
  statSub: { fontSize:'0.68rem', color:'#484F58' },

  // PREDICTIONS BANNER
  predBanner: { background:'#161B22', border:'1px solid rgba(240,246,252,0.06)', borderRadius:'14px', padding:'16px 20px', display:'flex', alignItems:'center', gap:'14px', marginBottom:'20px', cursor:'pointer', position:'relative', overflow:'hidden' },
  predIcon: { fontSize:'1.6rem', flexShrink:0 },
  predTitle: { fontSize:'0.9rem', fontWeight:'600', color:'#F0F6FC', marginBottom:'3px' },
  predSub: { fontSize:'0.78rem', color:'#8B949E' },
  premiumBadge: { marginLeft:'auto', background:'rgba(240,165,0,0.12)', color:'#F0A500', border:'1px solid rgba(240,165,0,0.2)', padding:'4px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:'600', flexShrink:0 },

  // DASHBOARD GRID
  dashGrid: { display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:'16px' },
  dashCard: { background:'#161B22', border:'1px solid rgba(240,246,252,0.06)', borderRadius:'14px', padding:'20px' },
  dashCardHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' },
  dashCardTitle: { fontFamily:'Georgia, serif', fontSize:'1rem', fontWeight:'600', color:'#F0F6FC' },
  dashCardLink: { background:'transparent', border:'none', color:'#F0A500', fontSize:'0.8rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontWeight:'500' },

  // EMPTY STATE
  emptyState: { textAlign:'center', padding:'20px 0', marginBottom:'16px' },
  emptyIcon: { fontSize:'2rem', marginBottom:'8px' },
  emptyText: { fontSize:'0.88rem', fontWeight:'600', color:'#F0F6FC', marginBottom:'4px' },
  emptySubtext: { fontSize:'0.78rem', color:'#8B949E' },

  // BUTTONS
  btnGold: { width:'100%', padding:'12px', background:'#F0A500', border:'none', borderRadius:'8px', color:'#0D1117', fontWeight:'700', fontSize:'0.88rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif' },

  // ACTION GRID
  actionGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' },
  actionBtn: { display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', padding:'16px 10px', background:'#1C2330', border:'1px solid rgba(240,246,252,0.06)', borderRadius:'10px', cursor:'pointer', transition:'all 0.2s', fontFamily:'DM Sans, sans-serif' },
  actionIcon: { fontSize:'1.4rem' },
  actionLabel: { fontSize:'0.75rem', fontWeight:'500', color:'#8B949E', textAlign:'center' },

  // BOTTOM NAV
  bottomNav: { display:'none', position:'fixed', bottom:0, left:0, right:0, background:'#161B22', borderTop:'1px solid rgba(240,246,252,0.06)', padding:'8px 0 20px', zIndex:40 },
  bnav: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'6px 0', border:'none', background:'transparent', color:'#8B949E', cursor:'pointer', fontFamily:'DM Sans, sans-serif' },
  bnavLabel: { fontSize:'0.65rem', fontWeight:'500' },
}