import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import { useIsMobile } from '../hooks/useMediaQuery'
import BottomNav from './BottomNav'

export default function Sidebar({ user }) {
  const navigate = useNavigate()
  const path = window.location.pathname
  const { isDark, toggleTheme } = useTheme()
  const isMobile = useIsMobile()

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '⊞' },
    { label: 'Practice', path: '/practice', icon: '📖' },
    { label: 'Mock Exams', path: '/mock', icon: '📝' },
    { label: 'Study Plan', path: '/plan', icon: '📅' },
    { label: 'Flashcards', path: '/flashcards', icon: '🃏' },
    { label: 'Performance', path: '/performance', icon: '📊' },
    { label: 'Predictions', path: '/predictions', icon: '★' },
    { label: 'Quiz Game', path: '/game', icon: '⚡' },
    { label: 'Profile', path: '/profile', icon: '👤' },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // On mobile, render the bottom nav instead
  if (isMobile) return <BottomNav />

  return (
    <aside style={s.sidebar}>
      <div style={s.logoWrap}>
        <div style={s.logoMark}>P</div>
        <div style={s.logoName}>Prep<em style={s.em}>IQ</em></div>
      </div>
      <div style={s.kente} />
      <nav style={s.nav}>
        <div style={s.navLabel}>Menu</div>
        {navItems.map(item => (
          <button key={item.path}
            style={{ ...s.navItem, ...(path === item.path ? s.navActive : {}) }}
            onClick={() => navigate(item.path)}>
            <span style={s.icon}>{item.icon}</span>
            <span>{item.label}</span>
            {path === item.path && <span style={s.dot} />}
          </button>
        ))}
        <div style={s.divider} />
        <button style={s.premBtn} onClick={() => navigate('/premium')}>
          <span style={s.icon}>💎</span><span>Go Premium</span>
        </button>
      </nav>
      <div style={s.footer}>
        <button style={s.themeToggle} onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          <span style={s.themeIcon}>{isDark ? '☀️' : '🌙'}</span>
          <span style={s.themeLabel}>{isDark ? 'Light mode' : 'Dark mode'}</span>
          <div style={s.themeTrack}>
            <div style={{ ...s.themeThumb, transform: isDark ? 'translateX(14px)' : 'translateX(0)' }} />
          </div>
        </button>
        <div style={s.userRow}>
          <div style={s.avatar}>{user?.full_name?.[0]?.toUpperCase() || 'P'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.userName}>{user?.full_name?.split(' ')[0] || 'Student'}</div>
            <div style={s.userPlan}>{user?.plan === 'premium' ? 'Premium' : 'Free plan'}</div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout} title="Log out">↩</button>
        </div>
      </div>
    </aside>
  )
}

const s = {
  sidebar: { width: '220px', flexShrink: 0, background: 'var(--forest-mid)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, borderRight: '1px solid var(--border)' },
  logoWrap: { padding: '24px 20px 14px', display: 'flex', alignItems: 'center', gap: '10px' },
  logoMark: { width: '32px', height: '32px', borderRadius: '9px', background: 'var(--gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-serif)', fontSize: '1rem', fontWeight: '700', color: 'var(--forest)', flexShrink: 0 },
  logoName: { fontFamily: 'var(--ff-serif)', fontSize: '1.2rem', fontWeight: '700', color: '#F7F3EE', fontStyle: 'normal' },
  em: { color: 'var(--gold-light)', fontStyle: 'italic' },
  kente: { height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)', marginBottom: '6px' },
  nav: { flex: 1, padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: '1px', overflowY: 'auto' },
  navLabel: { fontSize: '0.62rem', fontWeight: '600', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(247,243,238,0.28)', padding: '6px 10px 8px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 11px', borderRadius: '9px', border: 'none', background: 'transparent', color: 'rgba(247,243,238,0.45)', fontSize: '0.84rem', fontWeight: '500', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'var(--ff-sans)' },
  navActive: { background: 'rgba(247,243,238,0.09)', color: '#F7F3EE' },
  icon: { fontSize: '0.9rem', width: '18px', textAlign: 'center', flexShrink: 0 },
  dot: { width: '5px', height: '5px', borderRadius: '50%', background: 'var(--gold-light)', marginLeft: 'auto' },
  divider: { height: '1px', background: 'rgba(247,243,238,0.07)', margin: '8px 0' },
  premBtn: { display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 11px', borderRadius: '9px', border: '1px solid rgba(200,136,10,0.3)', background: 'rgba(200,136,10,0.08)', color: 'var(--gold-light)', fontSize: '0.84rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'var(--ff-sans)' },
  footer: { padding: '10px', borderTop: '1px solid rgba(247,243,238,0.06)', display: 'flex', flexDirection: 'column', gap: '6px' },
  themeToggle: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '9px', border: '1px solid rgba(247,243,238,0.08)', background: 'rgba(247,243,238,0.04)', cursor: 'pointer', width: '100%', fontFamily: 'var(--ff-sans)' },
  themeIcon: { fontSize: '0.9rem', flexShrink: 0 },
  themeLabel: { fontSize: '0.78rem', color: 'rgba(247,243,238,0.5)', fontWeight: '500', flex: 1, textAlign: 'left' },
  themeTrack: { width: '28px', height: '16px', borderRadius: '8px', background: 'rgba(247,243,238,0.15)', position: 'relative', flexShrink: 0, border: '1px solid rgba(247,243,238,0.1)' },
  themeThumb: { position: 'absolute', top: '2px', left: '2px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--gold-light)', transition: 'transform 0.2s ease' },
  userRow: { display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 10px', borderRadius: '9px', background: 'rgba(247,243,238,0.05)' },
  avatar: { width: '28px', height: '28px', borderRadius: '50%', background: 'var(--gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-serif)', fontSize: '0.82rem', fontWeight: '700', color: 'var(--forest)', flexShrink: 0 },
  userName: { fontSize: '0.8rem', fontWeight: '600', color: '#F7F3EE', lineHeight: 1.2 },
  userPlan: { fontSize: '0.67rem', color: 'rgba(247,243,238,0.38)', marginTop: '2px' },
  logoutBtn: { background: 'transparent', border: 'none', color: 'rgba(247,243,238,0.3)', cursor: 'pointer', fontSize: '1rem', padding: '4px', lineHeight: 1, flexShrink: 0 },
}