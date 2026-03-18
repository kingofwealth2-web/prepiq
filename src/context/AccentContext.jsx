import { createContext, useContext, useEffect, useState } from 'react'

export const ACCENT_THEMES = {
  violet: { name: 'Violet', primary: '#8B5CF6', light: '#C4B5FD', soft: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', glow1: '#3B0764', glow2: '#1E1B4B', glow3: '#4C1D95', swatch: 'linear-gradient(135deg,#8B5CF6,#6D28D9)' },
  blue:    { name: 'Blue',    primary: '#3B82F6', light: '#93C5FD', soft: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.3)',  glow1: '#1E3A5F', glow2: '#1E2D5F', glow3: '#1E3070', swatch: 'linear-gradient(135deg,#3B82F6,#1D4ED8)' },
  emerald: { name: 'Emerald', primary: '#10B981', light: '#6EE7B7', soft: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.28)', glow1: '#022C22', glow2: '#064E3B', glow3: '#065F46', swatch: 'linear-gradient(135deg,#10B981,#059669)' },
  rose:    { name: 'Rose',    primary: '#F43F5E', light: '#FDA4AF', soft: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.28)',  glow1: '#4C0519', glow2: '#881337', glow3: '#9F1239', swatch: 'linear-gradient(135deg,#F43F5E,#BE123C)' },
  amber:   { name: 'Amber',   primary: '#F59E0B', light: '#FCD34D', soft: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.28)', glow1: '#451A03', glow2: '#78350F', glow3: '#92400E', swatch: 'linear-gradient(135deg,#F59E0B,#B45309)' },
  cyan:    { name: 'Cyan',    primary: '#06B6D4', light: '#67E8F9', soft: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.28)',  glow1: '#083344', glow2: '#0E4966', glow3: '#155E75', swatch: 'linear-gradient(135deg,#06B6D4,#0E7490)' },
  coral:   { name: 'Coral',   primary: '#F97316', light: '#FDBA74', soft: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.28)', glow1: '#431407', glow2: '#7C2D12', glow3: '#9A3412', swatch: 'linear-gradient(135deg,#F97316,#C2410C)' },
  slate:   { name: 'Slate',   primary: '#94A3B8', light: '#CBD5E1', soft: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)',glow1: '#0F172A', glow2: '#1E293B', glow3: '#334155', swatch: 'linear-gradient(135deg,#94A3B8,#475569)' },
}

const AccentContext = createContext(null)

export function AccentProvider({ children }) {
  const [accentKey, setAccentKey] = useState(() =>
    localStorage.getItem('prepiq-accent') || 'violet'
  )

  useEffect(() => {
    const t = ACCENT_THEMES[accentKey] || ACCENT_THEMES.violet
    const root = document.documentElement
    root.style.setProperty('--accent-primary', t.primary)
    root.style.setProperty('--accent-light',   t.light)
    root.style.setProperty('--accent-soft',    t.soft)
    root.style.setProperty('--accent-border',  t.border)
    root.style.setProperty('--glow-1',         t.glow1)
    root.style.setProperty('--glow-2',         t.glow2)
    root.style.setProperty('--glow-3',         t.glow3)
    localStorage.setItem('prepiq-accent', accentKey)
  }, [accentKey])

  const theme = ACCENT_THEMES[accentKey] || ACCENT_THEMES.violet

  return (
    <AccentContext.Provider value={{ accentKey, setAccentKey, theme, themes: ACCENT_THEMES }}>
      {children}
    </AccentContext.Provider>
  )
}

export function useAccent() {
  const ctx = useContext(AccentContext)
  if (!ctx) throw new Error('useAccent must be used within AccentProvider')
  return ctx
}

export function AccentPicker({ onPick }) {
  const { accent, setAccent } = useAccent()

  function pick(key) {
    setAccent(key)
    onPick?.(key)
  }

  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
      {Object.entries(ACCENT_THEMES).map(([key, t]) => (
        <button
          key={key}
          title={t.name}
          onClick={() => pick(key)}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: t.swatch,
            border: accent === key ? '3px solid #fff' : '3px solid transparent',
            outline: accent === key ? `2px solid ${t.primary}` : 'none',
            cursor: 'pointer',
            transform: accent === key ? 'scale(1.15)' : 'scale(1)',
            transition: 'transform .2s cubic-bezier(0.34,1.56,0.64,1), outline .15s',
            flexShrink: 0,
          }}
        />
      ))}
      <span style={{ fontSize: '.78rem', color: 'var(--ink-muted)', marginLeft: '4px' }}>
        {ACCENT_THEMES[accent]?.name}
      </span>
    </div>
  )
}