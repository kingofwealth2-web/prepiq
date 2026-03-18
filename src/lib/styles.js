// Shared layout and glass styles used across all screens
export const g = {
  // Layouts
  shell:    { display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff)', position: 'relative', zIndex: 1 },
  main:     { flex: 1, marginLeft: 'var(--sidebar-w)', display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1 },
  content:  { flex: 1, padding: '20px 24px 60px' },
  centred:  { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px' },

  // Glass topbar
  topbar:   { height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', background: 'rgba(13,11,20,0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontSize: '0.98rem', fontWeight: '700', color: 'var(--ink)', letterSpacing: '-0.02em' },

  // Glass card
  glass:    { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 'var(--r-xl)' },

  // Solid card (for readable content)
  card:     { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)' },

  // Spinner
  loadShell:{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 },
  spinner:  { width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  // Buttons
  btnPrimary: { padding: '12px 24px', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--r-md)', color: '#fff', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--ff)', letterSpacing: '-0.01em', transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease', boxShadow: '0 4px 20px var(--accent-soft)' },
  btnOutline: { padding: '12px 24px', background: 'transparent', border: '1px solid var(--border-mid)', borderRadius: 'var(--r-md)', color: 'var(--ink-mid)', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--ff)', transition: 'background 0.15s, border-color 0.15s' },
  btnGhost:   { padding: '8px 14px', background: 'transparent', border: 'none', color: 'var(--ink-muted)', fontWeight: '500', fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'var(--ff)' },

  // Badges
  badge:      { padding: '3px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '600' },
  badgeAccent:{ background: 'var(--accent-soft)', color: 'var(--accent-light)', border: '1px solid var(--accent-border)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '600' },
  badgeMuted: { background: 'rgba(255,255,255,0.06)', color: 'var(--ink-muted)', border: '1px solid rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '500' },
  badgeGreen: { background: 'var(--green-soft)', color: 'var(--green)', border: '1px solid var(--green-border)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '600' },
  badgeRed:   { background: 'var(--red-soft)', color: 'var(--red)', border: '1px solid var(--red-border)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '600' },
  badgeAmber: { background: 'var(--amber-soft)', color: 'var(--amber)', border: '1px solid var(--amber-border)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '600' },

  // Form
  label: { fontSize: '0.68rem', fontWeight: '600', color: 'var(--ink-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px', display: 'block' },
  group: { display: 'flex', flexDirection: 'column', gap: '5px' },
}
