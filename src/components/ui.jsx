// Shared style primitives
export const G = {
  appShell: { display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff)', position: 'relative' },
  main: { flex: 1, marginLeft: 'var(--sidebar-w)', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 },
  topbar: { height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontSize: '.95rem', fontWeight: '700', color: 'var(--ink)', letterSpacing: '-.02em' },
  glassCard: { background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', borderRadius: 'var(--r-xl)' },
  solidCard: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)' },
  content: { flex: 1, padding: '18px 20px 60px', overflowX: 'hidden' },
  chip: { padding: '4px 11px', borderRadius: '20px', fontSize: '.68rem', fontWeight: '600', border: '1px solid' },
  chipAccent: { background: 'var(--accent-soft)', color: 'var(--accent-light)', borderColor: 'var(--accent-border)' },
  chipRed: { background: 'rgba(248,113,113,.1)', color: '#FCA5A5', borderColor: 'rgba(248,113,113,.25)' },
  chipGreen: { background: 'rgba(52,211,153,.1)', color: '#6EE7B7', borderColor: 'rgba(52,211,153,.2)' },
  chipMuted: { background: 'rgba(255,255,255,.05)', color: 'var(--ink-muted)', borderColor: 'var(--border)' },
  btnPrimary: { padding: '12px 24px', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--r-md)', color: '#fff', fontWeight: '700', fontSize: '.88rem', cursor: 'pointer', fontFamily: 'var(--ff)', letterSpacing: '-.01em', transition: 'transform .2s var(--spring), box-shadow .2s', boxShadow: '0 4px 20px var(--accent-btn-shadow)' },
  btnOutline: { padding: '12px 24px', background: 'transparent', border: '1px solid var(--border-mid)', borderRadius: 'var(--r-md)', color: 'var(--ink)', fontWeight: '600', fontSize: '.88rem', cursor: 'pointer', fontFamily: 'var(--ff)' },
  btnGhost: { background: 'transparent', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--ff)', fontSize: '.84rem' },
  spinner: { width: '28px', height: '28px', border: '2.5px solid var(--border-mid)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin .7s linear infinite' },
  loadShell: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dotRow: { display: 'flex', gap: '6px', justifyContent: 'center' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulse 1s infinite' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '.7rem', fontWeight: '600', color: 'var(--ink-muted)', letterSpacing: '.07em', textTransform: 'uppercase' },
  sectionTitle: { fontSize: '.62rem', fontWeight: '600', color: 'var(--ink-faint)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '12px' },
  progressTrack: { height: '4px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--accent-primary)', borderRadius: '4px', transition: 'width .5s var(--ease-out)' },
}

export function LoadingDots() {
  return (
    <div style={G.dotRow}>
      {[0, .18, .36].map((d, i) => (
        <div key={i} style={{ ...G.dot, animationDelay: `${d}s` }} />
      ))}
    </div>
  )
}

export function Spinner() {
  return <div style={G.spinner} />
}

export function Mesh() {
  return (
    <div className="mesh">
      <div className="mesh-blob mesh-blob-1" />
      <div className="mesh-blob mesh-blob-2" />
      <div className="mesh-blob mesh-blob-3" />
    </div>
  )
}
