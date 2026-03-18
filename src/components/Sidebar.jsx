import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAccent } from '../context/AccentContext'
import { useTheme } from '../context/ThemeContext'
import { useIsMobile } from '../hooks/useMediaQuery'

const NAV = [
  { label: 'Dashboard',   path: '/dashboard',   icon: '⊞' },
  { label: 'Practice',    path: '/practice',     icon: '📖' },
  { label: 'Mock Exams',  path: '/mock',         icon: '📝' },
  { label: 'Study Plan',  path: '/plan',         icon: '📅' },
  { label: 'Flashcards',  path: '/flashcards',   icon: '🃏' },
  { label: 'Performance', path: '/performance',  icon: '📊' },
  { label: 'Predictions', path: '/predictions',  icon: '★' },
  { label: 'Quiz Game',   path: '/game',         icon: '⚡' },
  { label: 'Profile',     path: '/profile',      icon: '👤' },
]

export default function Sidebar({ user, mobileOpen, onClose }) {
  const navigate = useNavigate()
  const path = window.location.pathname
  const { theme } = useAccent()
  const { isDark, toggle } = useTheme()
  const isMobile = useIsMobile()

  useEffect(() => { if (mobileOpen) onClose?.() }, [path])

  useEffect(() => {
    if (isMobile && mobileOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isMobile, mobileOpen])

  const handleNav = p => { navigate(p); if (isMobile) onClose?.() }
  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login') }

  return (
    <>
      {isMobile && mobileOpen && (
        <div style={s.backdrop} onClick={onClose} />
      )}

      <aside style={{
        ...s.sidebar,
        ...(isMobile ? s.sidebarMobile : {}),
        ...(isMobile && mobileOpen ? s.sidebarOpen : {}),
      }}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={{ ...s.logoMark, background: `linear-gradient(135deg,${theme.primary},${theme.glow3})`, boxShadow: `0 4px 16px ${theme.soft}` }}>P</div>
          <div style={s.logoText}>Prep<em style={{ ...s.em, color: theme.light }}>IQ</em></div>
          {isMobile && <button style={s.closeBtn} onClick={onClose}>✕</button>}
        </div>

        {/* Nav */}
        <nav style={s.nav}>
          <div style={s.navLabel}>Menu</div>
          {NAV.map(item => {
            const active = path === item.path
            return (
              <button key={item.path}
                style={{
                  ...s.navItem,
                  ...(active ? { background: theme.soft, color: theme.light } : {}),
                }}
                onClick={() => handleNav(item.path)}
              >
                <span style={s.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
                {active && (
                  <span style={{ ...s.activeDot, background: theme.primary }} />
                )}
              </button>
            )
          })}

          <div style={s.divider} />

          <button style={{ ...s.premBtn, borderColor: 'rgba(245,158,11,0.3)', color: '#FCD34D' }}
            onClick={() => handleNav('/premium')}>
            <span style={s.navIcon}>💎</span>
            <span>Go Premium</span>
          </button>
        </nav>

        {/* Footer */}
        <div style={s.footer}>
          <div style={s.userRow}>
            <div style={{ ...s.avatar, background: `linear-gradient(135deg,${theme.primary},${theme.glow3})` }}>
              {user?.full_name?.[0]?.toUpperCase() || 'P'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={s.userName}>{user?.full_name?.split(' ')[0] || 'Student'}</div>
              <div style={s.userPlan}>{user?.plan === 'premium' ? '💎 Premium' : 'Free plan'}</div>
            </div>
            <button style={s.logoutBtn} onClick={handleLogout} title="Log out">↩</button>
          </div>
        </div>
      </aside>
    </>
  )
}

const s = {
  backdrop: { position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' },
  sidebar: { width: '220px', flexShrink: 0, background: 'rgba(13,11,20,0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 },
  sidebarMobile: { transform: 'translateX(-100%)', transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)', boxShadow: 'none' },
  sidebarOpen: { transform: 'translateX(0)', boxShadow: '8px 0 40px rgba(0,0,0,0.6)' },
  logoWrap: { padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  logoMark: { width: '32px', height: '32px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '14px', color: '#fff', flexShrink: 0, transition: 'background 0.4s, box-shadow 0.4s' },
  logoText: { fontSize: '1.15rem', fontWeight: '800', color: '#fff', fontStyle: 'normal', letterSpacing: '-0.03em', flex: 1 },
  em: { fontStyle: 'italic', transition: 'color 0.4s' },
  closeBtn: { background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '1rem', padding: '4px', lineHeight: 1, flexShrink: 0 },
  nav: { flex: 1, padding: '10px 10px 6px', display: 'flex', flexDirection: 'column', gap: '1px', overflowY: 'auto' },
  navLabel: { fontSize: '0.6rem', fontWeight: '600', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', padding: '6px 10px 8px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 11px', borderRadius: '10px', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '0.83rem', fontWeight: '500', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'var(--ff)', transition: 'background 0.3s, color 0.3s' },
  navIcon: { fontSize: '0.9rem', width: '18px', textAlign: 'center', flexShrink: 0 },
  activeDot: { width: '5px', height: '5px', borderRadius: '50%', marginLeft: 'auto', flexShrink: 0, transition: 'background 0.4s' },
  divider: { height: '1px', background: 'rgba(255,255,255,0.06)', margin: '8px 0' },
  themeBtn: { display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 11px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink-muted)', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background .15s' },
  premBtn: { display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 11px', borderRadius: '10px', border: '1px solid', background: 'rgba(245,158,11,0.08)', fontSize: '0.83rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'var(--ff)' },
  footer: { padding: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  userRow: { display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)' },
  avatar: { width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.8rem', color: '#fff', flexShrink: 0, transition: 'background 0.4s' },
  userName: { fontSize: '0.8rem', fontWeight: '600', color: '#fff', lineHeight: 1.2 },
  userPlan: { fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px' },
  logoutBtn: { background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: '1rem', padding: '4px', lineHeight: 1, flexShrink: 0 },
}