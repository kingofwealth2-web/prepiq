import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAccent } from '../context/AccentContext'
import { useTheme } from '../context/ThemeContext'
import { useIsMobile } from '../hooks/useMediaQuery'

const NAV = [
  { label: 'Dashboard',   path: '/dashboard',  icon: '⊞' },
  { label: 'Practice',    path: '/practice',   icon: '📖' },
  { label: 'Mock Exams',  path: '/mock',       icon: '📝' },
  { label: 'Study Plan',  path: '/plan',       icon: '📅' },
  { label: 'Flashcards',  path: '/flashcards', icon: '🃏' },
  { label: 'Performance', path: '/performance',icon: '📊' },
  { label: 'Predictions', path: '/predictions',icon: '★' },
  { label: 'Quiz Game',   path: '/game',       icon: '⚡' },
  { label: 'Profile',     path: '/profile',    icon: '👤' },
]

export default function Sidebar({ user, mobileOpen, onClose }) {
  const navigate = useNavigate()
  const path = window.location.pathname
  const { theme } = useAccent()
  const { isDark, toggle } = useTheme()
  const isMobile = useIsMobile()
  const [hovered, setHovered] = useState(null)

  // Close on route change (mobile)
  useEffect(() => { if (mobileOpen) onClose?.() }, [path])

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = (isMobile && mobileOpen) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMobile, mobileOpen])

  const go = p => { navigate(p); if (isMobile) onClose?.() }
  const logout = async () => { await supabase.auth.signOut(); navigate('/login') }

  // Desktop: icon-only collapsed sidebar (56px)
  // Mobile: slides in from left (220px) when mobileOpen

  const isExpanded = isMobile // desktop is always collapsed icon-only

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div style={s.backdrop} onClick={onClose} />
      )}

      <aside style={{
        ...s.base,
        width: isMobile ? '220px' : '56px',
        transform: isMobile
          ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)')
          : 'translateX(0)',
        transition: isMobile ? 'transform .28s cubic-bezier(.4,0,.2,1)' : 'none',
        boxShadow: isMobile && mobileOpen ? '8px 0 40px rgba(0,0,0,.6)' : 'none',
      }}>

        {/* Logo */}
        <div style={{ ...s.logoWrap, justifyContent: isExpanded ? 'flex-start' : 'center' }}>
          <div style={{
            ...s.logoMark,
            background: `linear-gradient(135deg,${theme.primary},${theme.glow3})`,
            boxShadow: `0 4px 16px ${theme.btnShadow}`,
          }}>P</div>
          {isExpanded && (
            <>
              <div style={s.logoText}>Prep<em style={{ color: theme.light, fontStyle: 'italic' }}>IQ</em></div>
              <button style={s.closeBtn} onClick={onClose}>✕</button>
            </>
          )}
        </div>

        {/* Nav */}
        <nav style={s.nav}>
          {NAV.map(item => {
            const active = path === item.path
            return (
              <div key={item.path} style={{ position: 'relative' }}
                onMouseEnter={() => !isExpanded && setHovered(item.path)}
                onMouseLeave={() => setHovered(null)}>
                <button
                  style={{
                    ...s.btn,
                    justifyContent: isExpanded ? 'flex-start' : 'center',
                    background: active ? theme.soft : 'transparent',
                    color: active ? theme.light : 'rgba(255,255,255,.38)',
                    borderLeft: active ? `2px solid ${theme.primary}` : '2px solid transparent',
                  }}
                  onClick={() => go(item.path)}>
                  <span style={s.icon}>{item.icon}</span>
                  {isExpanded && <span style={s.label}>{item.label}</span>}
                  {isExpanded && active && <span style={{ ...s.dot, background: theme.primary }} />}
                </button>
                {/* Tooltip on desktop hover */}
                {!isExpanded && hovered === item.path && (
                  <div style={s.tooltip}>{item.label}</div>
                )}
              </div>
            )
          })}

          <div style={s.divider} />

          {/* Theme toggle */}
          <div style={{ position: 'relative' }}
            onMouseEnter={() => !isExpanded && setHovered('theme')}
            onMouseLeave={() => setHovered(null)}>
            <button style={{ ...s.btn, justifyContent: isExpanded ? 'flex-start' : 'center', color: 'rgba(255,255,255,.38)' }}
              onClick={toggle}>
              <span style={s.icon}>{isDark ? '☀️' : '🌙'}</span>
              {isExpanded && <span style={s.label}>{isDark ? 'Light mode' : 'Dark mode'}</span>}
            </button>
            {!isExpanded && hovered === 'theme' && (
              <div style={s.tooltip}>{isDark ? 'Light mode' : 'Dark mode'}</div>
            )}
          </div>

          {/* Premium */}
          <div style={{ position: 'relative' }}
            onMouseEnter={() => !isExpanded && setHovered('premium')}
            onMouseLeave={() => setHovered(null)}>
            <button style={{
              ...s.btn,
              justifyContent: isExpanded ? 'flex-start' : 'center',
              background: 'rgba(245,158,11,.08)',
              border: '1px solid rgba(245,158,11,.25)',
              color: '#FCD34D',
              borderRadius: '10px',
              margin: '0 4px',
              width: 'calc(100% - 8px)',
            }} onClick={() => go('/premium')}>
              <span style={s.icon}>💎</span>
              {isExpanded && <span style={{ ...s.label, fontWeight: '600' }}>Go Premium</span>}
            </button>
            {!isExpanded && hovered === 'premium' && (
              <div style={s.tooltip}>Go Premium</div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div style={{ ...s.footer, justifyContent: isExpanded ? 'flex-start' : 'center' }}>
          <div style={{ position: 'relative' }}
            onMouseEnter={() => !isExpanded && setHovered('user')}
            onMouseLeave={() => setHovered(null)}>
            <div style={{
              ...s.avatar,
              background: `linear-gradient(135deg,${theme.primary},${theme.glow3})`,
              cursor: 'pointer',
            }} onClick={() => go('/profile')}>
              {user?.full_name?.[0]?.toUpperCase() || 'P'}
            </div>
            {!isExpanded && hovered === 'user' && (
              <div style={s.tooltip}>{user?.full_name?.split(' ')[0] || 'Profile'}</div>
            )}
          </div>
          {isExpanded && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.userName}>{user?.full_name?.split(' ')[0] || 'Student'}</div>
                <div style={s.userPlan}>{user?.plan === 'premium' ? '💎 Premium' : 'Free plan'}</div>
              </div>
              <button style={s.logoutBtn} onClick={logout} title="Log out">↩</button>
            </>
          )}
        </div>
      </aside>
    </>
  )
}

const s = {
  backdrop: { position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' },
  base: { background: 'rgba(10,8,18,.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRight: '1px solid rgba(255,255,255,.07)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, overflowX: 'hidden' },
  logoWrap: { height: '56px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 12px', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 },
  logoMark: { width: '32px', height: '32px', minWidth: '32px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '14px', color: '#fff', flexShrink: 0 },
  logoText: { fontSize: '1.1rem', fontWeight: '800', color: '#fff', letterSpacing: '-.03em', flex: 1, whiteSpace: 'nowrap' },
  closeBtn: { background: 'transparent', border: 'none', color: 'rgba(255,255,255,.3)', cursor: 'pointer', fontSize: '1rem', padding: '4px', lineHeight: 1, flexShrink: 0 },
  nav: { flex: 1, padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '1px', overflowY: 'auto', overflowX: 'hidden' },
  btn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--ff)', fontSize: '.82rem', fontWeight: '500', transition: 'background .15s, color .15s, border-color .15s', borderLeft: '2px solid transparent', paddingLeft: '12px', paddingRight: '12px' },
  icon: { fontSize: '1rem', width: '20px', textAlign: 'center', flexShrink: 0, lineHeight: 1 },
  label: { flex: 1, textAlign: 'left', whiteSpace: 'nowrap' },
  dot: { width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0 },
  divider: { height: '1px', background: 'rgba(255,255,255,.06)', margin: '6px 8px' },
  tooltip: { position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)', background: 'rgba(15,12,24,.95)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', fontSize: '.78rem', fontWeight: '500', padding: '5px 10px', borderRadius: '8px', whiteSpace: 'nowrap', marginLeft: '8px', pointerEvents: 'none', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,.4)' },
  footer: { padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: '9px', flexShrink: 0 },
  avatar: { width: '32px', height: '32px', minWidth: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '.8rem', color: '#fff', flexShrink: 0 },
  userName: { fontSize: '.8rem', fontWeight: '600', color: '#fff', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userPlan: { fontSize: '.64rem', color: 'rgba(255,255,255,.3)', marginTop: '2px' },
  logoutBtn: { background: 'transparent', border: 'none', color: 'rgba(255,255,255,.25)', cursor: 'pointer', fontSize: '1rem', padding: '4px', lineHeight: 1, flexShrink: 0 },
}