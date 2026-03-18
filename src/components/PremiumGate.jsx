import { useNavigate } from 'react-router-dom'

const FEATURES = [
  { icon: '★', label: 'AI Predictions', desc: 'Topics most likely to appear in your exam' },
  { icon: '🤖', label: 'Unlimited Nova AI', desc: 'Ask anything, get explained anything' },
  { icon: '⚡', label: 'Unlimited AI questions', desc: 'Generate questions on any topic' },
  { icon: '📊', label: 'Advanced analytics', desc: 'Deep performance breakdown by topic' },
]

export default function PremiumGate({ feature = 'This feature' }) {
  const navigate = useNavigate()

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.kente} />
        <div style={s.badge}>Premium</div>
        <div style={s.icon}>💎</div>
        <h2 style={s.heading}>{feature} is a Premium feature</h2>
        <p style={s.sub}>Upgrade to unlock everything and give yourself the best chance of passing.</p>

        <div style={s.featureList}>
          {FEATURES.map(f => (
            <div key={f.label} style={s.featureRow}>
              <div style={s.featureIcon}>{f.icon}</div>
              <div>
                <div style={s.featureName}>{f.label}</div>
                <div style={s.featureDesc}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={s.pricing}>
          <div style={s.price}>₵49<span style={s.period}>/month</span></div>
          <div style={s.priceSub}>or ₵120/year — save 59%</div>
        </div>

        <button style={s.btnPrimary} onClick={() => navigate('/premium')}>
          Upgrade to Premium →
        </button>
        <button style={s.btnOutline} onClick={() => navigate(-1)}>
          Not now
        </button>
      </div>
    </div>
  )
}

// Hook to check premium status
export function usePremium(user) {
  return user?.plan === 'premium'
}

const s = {
  wrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', padding: '24px', fontFamily: 'var(--ff)' },
  card: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-2xl)', padding: '36px', maxWidth: '440px', width: '100%', position: 'relative', overflow: 'hidden', textAlign: 'center' },
  kente: { position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 14px,#009E73 14px,#009E73 28px,#C8102E 28px,#C8102E 42px,#1A5DC8 42px,#1A5DC8 56px)' },
  badge: { display: 'inline-block', background: 'var(--accent-soft)', color: 'var(--accent-light)', border: '1px solid var(--accent-border)', padding: '3px 12px', borderRadius: '20px', fontSize: '.68rem', fontWeight: '700', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '16px' },
  icon: { fontSize: '2.5rem', marginBottom: '12px' },
  heading: { fontSize: '1.2rem', fontWeight: '800', color: 'var(--ink)', marginBottom: '8px', letterSpacing: '-.03em' },
  sub: { fontSize: '.84rem', color: 'var(--ink-muted)', marginBottom: '22px', lineHeight: 1.6 },
  featureList: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', textAlign: 'left' },
  featureRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  featureIcon: { width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 },
  featureName: { fontSize: '.86rem', fontWeight: '600', color: 'var(--ink)', marginBottom: '2px' },
  featureDesc: { fontSize: '.74rem', color: 'var(--ink-muted)' },
  pricing: { background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-lg)', padding: '16px', marginBottom: '16px' },
  price: { fontSize: '2.2rem', fontWeight: '900', color: 'var(--accent-primary)', letterSpacing: '-.04em', lineHeight: 1 },
  period: { fontSize: '1rem', fontWeight: '500', color: 'var(--ink-muted)' },
  priceSub: { fontSize: '.76rem', color: 'var(--ink-muted)', marginTop: '4px' },
  btnPrimary: { width: '100%', padding: '13px', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--r-md)', color: '#fff', fontWeight: '700', fontSize: '.9rem', cursor: 'pointer', fontFamily: 'var(--ff)', boxShadow: '0 4px 20px var(--accent-btn-shadow)', marginBottom: '8px' },
  btnOutline: { width: '100%', padding: '13px', background: 'transparent', border: '1px solid var(--border-mid)', borderRadius: 'var(--r-md)', color: 'var(--ink-muted)', fontWeight: '600', fontSize: '.9rem', cursor: 'pointer', fontFamily: 'var(--ff)' },
}