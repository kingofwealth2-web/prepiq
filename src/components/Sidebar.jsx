import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAccent } from '../context/AccentContext'
import { useTheme } from '../context/ThemeContext'
import { useIsMobile } from '../hooks/useMediaQuery'

const NAV = [
  { label: 'Dashboard',   path: '/dashboard',   icon: '⊞' },
  { label: 'Practice',    path: '/practice',    icon: '✏️' },
  { label: 'Mock Exams',  path: '/mock',        icon: '📋' },
  { label: 'Study Plan',  path: '/plan',        icon: '📅' },
  { label: 'Flashcards',  path: '/flashcards',  icon: '🃏' },
  { label: 'Performance', path: '/performance', icon: '📊' },
  { label: 'Predictions', path: '/predictions', icon: '🔮' },
  { label: 'Quiz Game',   path: '/game',        icon: '⚡' },
  { label: 'Profile',     path: '/profile',     icon: '👤' },
]

export default function Sidebar({ user, mobileOpen, onClose }) {
  const navigate = useNavigate()
  const path = window.location.pathname
  const { theme } = useAccent()
  const { isDark, toggle } = useTheme()
  const isMobile = useIsMobile()

  useEffect(() => { if (mobileOpen) onClose?.() }, [path])

  useEffect(() => {
    document.body.style.overflow = (isMobile && mobileOpen) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMobile, mobileOpen])

  const go = p => { navigate(p); if (isMobile) onClose?.() }
  const logout = async () => { await supabase.auth.signOut(); navigate('/login') }

  return (
    <>
      {isMobile && mobileOpen && (
        <div style={s.backdrop} onClick={onClose} />
      )}

      <aside style={{
        ...s.sidebar,
        transform: isMobile
          ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)')
          : 'translateX(0)',
        transition: isMobile ? 'transform .28s cubic-bezier(.4,0,.2,1)' : 'none',
        boxShadow: isMobile && mobileOpen ? '8px 0 40px rgba(0,0,0,.6)' : 'none',
      }}>

        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={{
            ...s.logoMark,
            background: `linear-gradient(135deg,${theme.primary},${theme.glow3})`,
            boxShadow: `0 4px 16px ${theme.btnShadow}`,
          }}>P</div>
          <div style={s.logoText}>
            Prep<em style={{ color: theme.light, fontStyle: 'italic' }}>IQ</em>
          </div>
          {isMobile && (
            <button style={s.closeBtn} onClick={onClose}>✕</button>
          )}
        </div>

        {/* Nav label */}
        <div style={s.navSection}>MENU</div>

        {/* Nav items */}
        <nav style={s.nav}>
          {NAV.map(item => {
            const active = path === item.path
            return (
              <button
                key={item.path}
                style={{
                  ...s.navItem,
                  ...(active ? {
                    background: theme.soft,
                    color: theme.light,
                    borderLeft: `3px solid ${theme.primary}`,
                  } : {
                    borderLeft: '3px solid transparent',
                  }),
                }}
                onClick={() => go(item.path)}>
                <span style={s.navIcon}>{item.icon}</span>
                <span style={s.navLabel}>{item.label}</span>
                {active && <span style={{ ...s.activeDot, background: theme.primary }} />}
              </button>
            )
          })}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom actions */}
        <div style={s.bottom}>
          {/* Theme toggle */}
          <button style={s.bottomBtn} onClick={toggle}>
            <span style={s.navIcon}>{isDark ? '☀️' : '🌙'}</span>
            <span style={s.navLabel}>{isDark ? 'Light mode' : 'Dark mode'}</span>
          </button>

          {/* Premium */}
          <button style={s.premBtn} onClick={() => go('/premium')}>
            <span style={s.navIcon}>💎</span>
            <span style={{ ...s.navLabel, fontWeight: '600', color: '#FCD34D' }}>Go Premium</span>
          </button>

          <div style={s.divider} />

          {/* User row */}
          <div style={s.userRow}>
            <div style={{
              ...s.avatar,
              background: `linear-gradient(135deg,${theme.primary},${theme.glow3})`,
            }}>
              {user?.full_name?.[0]?.toUpperCase() || 'P'}
            </div>
            <div style={s.userInfo}>
              <div style={s.userName}>{user?.full_name?.split(' ')[0] || 'Student'}</div>
              <div style={s.userPlan}>{user?.plan === 'premium' ? '💎 Premium' : 'Free plan'}</div>
            </div>
            <button style={s.logoutBtn} onClick={logout} title="Log out">↩</button>
          </div>
        </div>
      </aside>
    </>
  )
}

const s = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 49,
    background: 'rgba(0,0,0,.6)',
    backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
  },
  sidebar: {
    width: '220px', flexShrink: 0,
    background: 'rgba(10,8,18,.96)',
    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    borderRight: '1px solid rgba(255,255,255,.07)',
    display: 'flex', flexDirection: 'column',
    position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
    overflowY: 'auto', overflowX: 'hidden',
  },
  logoWrap: {
    height: '60px', display: 'flex', alignItems: 'center',
    gap: '10px', padding: '0 16px',
    borderBottom: '1px solid rgba(255,255,255,.06)',
    flexShrink: 0,
  },
  logoMark: {
    width: '34px', height: '34px', minWidth: '34px',
    borderRadius: '10px', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontWeight: '900', fontSize: '15px', color: '#fff', flexShrink: 0,
  },
  logoText: {
    fontSize: '1.15rem', fontWeight: '800',
    color: '#fff', letterSpacing: '-.03em', flex: 1,
  },
  closeBtn: {
    background: 'transparent', border: 'none',
    color: 'rgba(255,255,255,.3)', cursor: 'pointer',
    fontSize: '1rem', padding: '4px', lineHeight: 1, flexShrink: 0,
  },
  navSection: {
    fontSize: '.58rem', fontWeight: '700',
    letterSpacing: '.14em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,.2)',
    padding: '16px 19px 6px',
  },
  nav: {
    display: 'flex', flexDirection: 'column',
    gap: '1px', padding: '0 8px',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 11px',
    borderRadius: '10px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,.38)',
    fontSize: '.84rem', fontWeight: '500',
    cursor: 'pointer', textAlign: 'left',
    width: '100%', fontFamily: 'var(--ff)',
    transition: 'background .15s, color .15s, border-color .15s',
    borderLeft: '3px solid transparent',
  },
  navIcon: {
    fontSize: '1rem', width: '20px',
    textAlign: 'center', flexShrink: 0, lineHeight: 1,
  },
  navLabel: {
    flex: 1, textAlign: 'left',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  activeDot: {
    width: '5px', height: '5px',
    borderRadius: '50%', flexShrink: 0,
  },
  bottom: {
    padding: '8px', flexShrink: 0,
    borderTop: '1px solid rgba(255,255,255,.06)',
  },
  bottomBtn: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 11px', width: '100%',
    background: 'transparent', border: 'none',
    color: 'rgba(255,255,255,.35)',
    fontSize: '.82rem', fontWeight: '500',
    cursor: 'pointer', fontFamily: 'var(--ff)',
    borderRadius: '10px', transition: 'background .15s',
  },
  premBtn: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 11px', width: '100%',
    background: 'rgba(245,158,11,.08)',
    border: '1px solid rgba(245,158,11,.2)',
    borderRadius: '10px',
    fontSize: '.82rem', cursor: 'pointer',
    fontFamily: 'var(--ff)', marginTop: '2px',
    color: 'rgba(255,255,255,.5)',
  },
  divider: {
    height: '1px', background: 'rgba(255,255,255,.06)',
    margin: '8px 0',
  },
  userRow: {
    display: 'flex', alignItems: 'center', gap: '9px',
    padding: '8px 10px', borderRadius: '10px',
    background: 'rgba(255,255,255,.04)',
  },
  avatar: {
    width: '32px', height: '32px', minWidth: '32px',
    borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '.82rem', color: '#fff', flexShrink: 0,
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: {
    fontSize: '.8rem', fontWeight: '600',
    color: '#fff', lineHeight: 1.2,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  userPlan: { fontSize: '.64rem', color: 'rgba(255,255,255,.3)', marginTop: '2px' },
  logoutBtn: {
    background: 'transparent', border: 'none',
    color: 'rgba(255,255,255,.25)', cursor: 'pointer',
    fontSize: '1rem', padding: '4px', lineHeight: 1, flexShrink: 0,
  },
}