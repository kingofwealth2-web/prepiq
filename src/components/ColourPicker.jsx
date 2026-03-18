import { useAccent, ACCENT_THEMES } from '../context/AccentContext'

export default function ColourPicker({ label = 'Accent colour', onPick }) {
  const { accentKey, setAccentKey, theme } = useAccent()

  const handlePick = key => {
    setAccentKey(key)
    onPick?.(key)
  }

  return (
    <div>
      {label && <div style={s.label}>{label}</div>}
      <div style={s.swatches}>
        {Object.entries(ACCENT_THEMES).map(([key, t]) => (
          <button
            key={key}
            title={t.name}
            style={{
              ...s.swatch,
              background: t.swatch,
              boxShadow: accentKey === key
                ? `0 0 0 3px rgba(255,255,255,0.2), 0 4px 16px ${t.soft}`
                : 'none',
              transform: accentKey === key ? 'scale(1.15)' : 'scale(1)',
            }}
            onClick={() => handlePick(key)}
          >
            {accentKey === key && <span style={s.check}>✓</span>}
          </button>
        ))}
        <div style={{ ...s.activeName, color: theme.light }}>{theme.name}</div>
      </div>
    </div>
  )
}

const s = {
  label: { fontSize: '0.68rem', fontWeight: '600', color: 'var(--ink-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' },
  swatches: { display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' },
  swatch: { width: '34px', height: '34px', borderRadius: '50%', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s', flexShrink: 0 },
  check: { fontSize: '13px', fontWeight: '800', color: '#fff' },
  activeName: { marginLeft: '4px', fontSize: '0.8rem', fontWeight: '600', transition: 'color 0.3s' },
}
