import { useIsMobile } from '../hooks/useMediaQuery'

export default function MobileHeader({ title, onMenuOpen, right }) {
  const isMobile = useIsMobile()
  if (!isMobile) return null
  return (
    <div style={s.bar}>
      <button style={s.hamburger} onClick={onMenuOpen} aria-label="Open menu">
        <span style={s.line} />
        <span style={s.line} />
        <span style={s.line} />
      </button>
      <div style={s.title}>{title}</div>
      {right && <div style={s.right}>{right}</div>}
    </div>
  )
}

const s = {
  bar: { display: 'flex', alignItems: 'center', gap: '12px', height: '52px', padding: '0 16px', background: 'rgba(13,11,20,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, zIndex: 40 },
  hamburger: { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '5px', padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 },
  line: { display: 'block', width: '20px', height: '2px', background: 'var(--ink)', borderRadius: '2px' },
  title: { fontFamily: 'var(--ff)', fontSize: '1rem', fontWeight: '700', color: 'var(--ink)', flex: 1 },
  right: { display: 'flex', alignItems: 'center', gap: '8px' },
}
