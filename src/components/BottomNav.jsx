import { useNavigate } from 'react-router-dom'

const tabs = [
  { label: 'Home', path: '/dashboard', icon: '⊞' },
  { label: 'Practice', path: '/practice', icon: '📖' },
  { label: 'Mock', path: '/mock', icon: '📝' },
  { label: 'Plan', path: '/plan', icon: '📅' },
  { label: 'More', path: '/profile', icon: '👤' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const path = window.location.pathname

  const isActive = tabPath => {
    if (tabPath === '/profile') {
      return ['/profile', '/performance', '/predictions', '/flashcards', '/game'].includes(path)
    }
    return path === tabPath
  }

  return (
    <nav style={s.nav}>
      {tabs.map(tab => (
        <button
          key={tab.path}
          style={{ ...s.tab, ...(isActive(tab.path) ? s.tabActive : {}) }}
          onClick={() => navigate(tab.path)}
        >
          <span style={s.tabIcon}>{tab.icon}</span>
          <span style={{ ...s.tabLabel, ...(isActive(tab.path) ? s.tabLabelActive : {}) }}>
            {tab.label}
          </span>
          {isActive(tab.path) && <div style={s.activePip} />}
        </button>
      ))}
    </nav>
  )
}

const s = {
  nav: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
    background: 'var(--forest-mid)',
    borderTop: '1px solid rgba(247,243,238,0.08)',
    display: 'flex', alignItems: 'stretch',
    paddingBottom: 'env(safe-area-inset-bottom)',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
  },
  tab: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '3px',
    padding: '10px 4px 8px',
    background: 'transparent', border: 'none',
    cursor: 'pointer', position: 'relative',
    fontFamily: 'var(--ff-sans)',
    WebkitTapHighlightColor: 'transparent',
  },
  tabActive: {},
  tabIcon: { fontSize: '1.2rem', lineHeight: 1 },
  tabLabel: {
    fontSize: '0.62rem', fontWeight: '500',
    color: 'rgba(247,243,238,0.4)',
    letterSpacing: '0.02em',
  },
  tabLabelActive: { color: 'var(--gold-light)', fontWeight: '600' },
  activePip: {
    position: 'absolute', top: '6px',
    width: '4px', height: '4px', borderRadius: '50%',
    background: 'var(--gold-light)',
  },
}