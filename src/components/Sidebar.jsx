import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Sidebar({ user }) {
  const navigate = useNavigate()
  const path = window.location.pathname

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '⊞' },
    { label: 'Practice', path: '/practice', icon: '📖' },
    { label: 'Mock Exams', path: '/mock', icon: '📝' },
    { label: 'Study Plan', path: '/plan', icon: '📅' },
    { label: 'Flashcards', path: '/flashcards', icon: '🃏' },
    { label: 'Performance', path: '/performance', icon: '📊' },
    { label: 'Predictions', path: '/predictions', icon: '★' },
    { label: 'Profile', path: '/profile', icon: '👤' },
    { label: 'Quiz Game', path: '/game', icon: '⚡' },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <aside style={s.sidebar}>
      <div style={s.logo}>
        <div style={s.logoMark}>P</div>
        <div style={s.logoName}>Prep<span style={s.gold}>IQ</span></div>
      </div>
      <nav style={s.nav}>
        {navItems.map(item => (
          <button key={item.path}
            style={{ ...s.navItem, ...(path === item.path ? s.navItemActive : {}) }}
            onClick={() => navigate(item.path)}>
            <span style={s.navIcon}>{item.icon}</span>
            {item.label}
          </button>
        ))}
        <div style={s.divider} />
        <button style={s.navItem} onClick={() => navigate('/premium')}>
          <span style={s.navIcon}>💎</span>
          Go Premium
        </button>
      </nav>
      <div style={s.footer}>
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
  )
}

const s = {
  sidebar: { width: '240px', flexShrink: 0, background: '#161B22', borderRight: '1px solid rgba(240,246,252,0.06)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 },
  logo: { padding: '24px 20px 20px', borderBottom: '1px solid rgba(240,246,252,0.06)', display: 'flex', alignItems: 'center', gap: '10px' },
  logoMark: { width: '32px', height: '32px', borderRadius: '8px', background: '#F0A500', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: '700', color: '#0D1117' },
  logoName: { fontFamily: 'Georgia, serif', fontSize: '1.2rem', fontWeight: '700', color: '#F0F6FC' },
  gold: { color: '#F0A500' },
  nav: { flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' },
  navItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#8B949E', fontSize: '0.88rem', fontWeight: '500', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' },
  navItemActive: { background: 'rgba(240,165,0,0.1)', color: '#F0A500' },
  navIcon: { fontSize: '1rem', width: '20px', textAlign: 'center' },
  divider: { height: '1px', background: 'rgba(240,246,252,0.06)', margin: '8px 0' },
  footer: { padding: '14px 10px', borderTop: '1px solid rgba(240,246,252,0.06)' },
  userRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px' },
  avatar: { width: '30px', height: '30px', borderRadius: '50%', background: '#F0A500', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontSize: '0.9rem', fontWeight: '700', color: '#0D1117', flexShrink: 0 },
  userName: { fontSize: '0.82rem', fontWeight: '600', color: '#F0F6FC' },
  userPlan: { fontSize: '0.7rem', color: '#8B949E' },
  logoutBtn: { marginLeft: 'auto', background: 'transparent', border: 'none', color: '#8B949E', cursor: 'pointer', fontSize: '1rem', padding: '4px' },
}