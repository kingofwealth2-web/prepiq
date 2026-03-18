import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'
import MobileHeader from '../components/MobileHeader'
import { useMobileMenu } from '../App'

const FEATURES = [
  {
    icon: '🔮',
    title: 'AI Predictions',
    desc: 'See which topics are most likely to appear in your exam, based on 20 years of WAEC patterns.',
    free: false,
  },
  {
    icon: '✨',
    title: 'AI-generated questions',
    desc: 'Generate unlimited practice questions on any topic, any time — not just past papers.',
    free: false,
  },
  {
    icon: '🃏',
    title: 'Unlimited flashcards',
    desc: 'Generate flashcard sets for all your subjects without limits.',
    free: '3 subjects/session',
  },
  {
    icon: '🤖',
    title: 'Unlimited Nova AI',
    desc: 'Ask Nova anything — explanations, study tips, exam strategy. No daily cap.',
    free: '5 messages/day',
  },
  {
    icon: '📖',
    title: 'Past paper practice',
    desc: 'Unlimited access to the full question bank.',
    free: true,
  },
  {
    icon: '📝',
    title: 'Mock exams',
    desc: 'Timed mock exams from real past papers.',
    free: true,
  },
  {
    icon: '📊',
    title: 'Performance tracking',
    desc: 'Track accuracy, streaks and progress over time.',
    free: true,
  },
  {
    icon: '📅',
    title: 'Study plan',
    desc: 'Adaptive daily study plan based on your weak areas.',
    free: true,
  },
]

export default function Premium() {
  const navigate = useNavigate()
  const { open: mobileOpen, setOpen: setMobileOpen } = useMobileMenu()
  const [user, setUser] = useState(null)
  const [billing, setBilling] = useState('monthly')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) { navigate('/login'); return }
      const { data: profile } = await supabase.from('users').select('*').eq('id', u.id).single()
      setUser(profile)
    })
  }, [])

  const isPremium = user?.plan === 'premium'

  return (
    <div style={s.shell}>
      <Sidebar user={user} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main style={s.main}>
        <MobileHeader title="Premium" onMenuOpen={() => setMobileOpen(true)} />
        <div style={s.topbar}>
          <div style={s.topbarTitle}>Premium</div>
        </div>
        <div style={s.content}>

          {isPremium ? (
            <div style={s.alreadyPremium}>
              <div style={s.kente} />
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💎</div>
              <h2 style={s.heroHeading}>You're on Premium</h2>
              <p style={s.heroSub}>You have full access to all PrepIQ features. Keep studying!</p>
              <button style={s.btnPrimary} onClick={() => navigate('/dashboard')}>Back to dashboard</button>
            </div>
          ) : (
            <>
              {/* Hero */}
              <div style={s.hero}>
                <div style={s.kente} />
                <div style={s.heroInner}>
                  <div style={s.heroBadge}>💎 PrepIQ Premium</div>
                  <h1 style={s.heroHeading}>Give yourself every advantage</h1>
                  <p style={s.heroSub}>
                    Unlock AI predictions, unlimited practice, and your personal AI tutor.
                    Everything you need to pass WASSCE and BECE.
                  </p>
                </div>
              </div>

              {/* Billing toggle */}
              <div style={s.billingToggle}>
                <button
                  style={{ ...s.billingBtn, ...(billing === 'monthly' ? s.billingBtnActive : {}) }}
                  onClick={() => setBilling('monthly')}>
                  Monthly
                </button>
                <button
                  style={{ ...s.billingBtn, ...(billing === 'yearly' ? s.billingBtnActive : {}) }}
                  onClick={() => setBilling('yearly')}>
                  Yearly
                  <span style={s.saveBadge}>Save 59%</span>
                </button>
              </div>

              {/* Price card */}
              <div style={s.priceCard}>
                <div style={s.kente} />
                <div style={s.priceRow}>
                  <div>
                    <div style={s.price}>
                      {billing === 'monthly' ? '₵49' : '₵10'}
                      <span style={s.pricePeriod}>/{billing === 'monthly' ? 'month' : 'month'}</span>
                    </div>
                    <div style={s.priceSub}>
                      {billing === 'monthly'
                        ? 'Billed monthly — cancel anytime'
                        : 'Billed ₵120/year — save ₵468'}
                    </div>
                  </div>
                  <button style={s.btnPrimary} onClick={() => alert('Payment integration coming soon.')}>
                    Get Premium →
                  </button>
                </div>
              </div>

              {/* Feature comparison */}
              <h3 style={s.sectionTitle}>What you get</h3>
              <div style={s.featureList}>
                {FEATURES.map((f, i) => (
                  <div key={i} style={s.featureRow}>
                    <div style={{
                      ...s.featureIcon,
                      background: f.free === false ? 'var(--accent-soft)' : 'var(--surface-solid)',
                      border: `1px solid ${f.free === false ? 'var(--accent-border)' : 'var(--border)'}`,
                    }}>
                      {f.icon}
                    </div>
                    <div style={s.featureInfo}>
                      <div style={s.featureName}>
                        {f.title}
                        {f.free === false && (
                          <span style={s.premiumTag}>Premium</span>
                        )}
                      </div>
                      <div style={s.featureDesc}>{f.desc}</div>
                      {typeof f.free === 'string' && (
                        <div style={s.freeLimit}>Free plan: {f.free}</div>
                      )}
                    </div>
                    <div style={s.featureCheck}>
                      {f.free === false
                        ? <span style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>💎</span>
                        : <span style={{ color: 'var(--green)', fontWeight: '700' }}>✓</span>
                      }
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom CTA */}
              <div style={s.cta}>
                <div style={s.kente} />
                <h3 style={s.ctaHeading}>Ready to pass your exam?</h3>
                <p style={s.ctaSub}>Join thousands of Ghanaian students preparing smarter with PrepIQ Premium.</p>
                <button style={s.btnPrimaryLg} onClick={() => alert('Payment integration coming soon.')}>
                  Upgrade to Premium →
                </button>
                <p style={s.ctaNote}>Cancel anytime · Secure payment · Instant access</p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

const s = {
  shell: { display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff)' },
  main: { flex: 1, marginLeft: 'var(--sidebar-w)', display: 'flex', flexDirection: 'column' },
  topbar: { height: '52px', display: 'flex', alignItems: 'center', padding: '0 24px', background: 'var(--surface-solid)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontSize: '.95rem', fontWeight: '700', color: 'var(--ink)', letterSpacing: '-.02em' },
  content: { flex: 1, padding: '20px 24px 60px', maxWidth: '680px' },
  kente: { position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 14px,#009E73 14px,#009E73 28px,#C8102E 28px,#C8102E 42px,#1A5DC8 42px,#1A5DC8 56px)' },

  // Already premium
  alreadyPremium: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '48px', textAlign: 'center', position: 'relative', overflow: 'hidden' },

  // Hero
  hero: { background: 'linear-gradient(135deg,#1A1530 0%,#120E22 100%)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 'var(--r-xl)', padding: '32px', marginBottom: '20px', position: 'relative', overflow: 'hidden' },
  heroInner: { position: 'relative' },
  heroBadge: { display: 'inline-block', background: 'var(--accent-soft)', color: 'var(--accent-light)', border: '1px solid var(--accent-border)', padding: '4px 14px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700', letterSpacing: '.08em', marginBottom: '14px' },
  heroHeading: { fontSize: '1.6rem', fontWeight: '800', color: '#fff', letterSpacing: '-.04em', marginBottom: '10px', lineHeight: 1.15 },
  heroSub: { fontSize: '.9rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.65 },

  // Billing toggle
  billingToggle: { display: 'flex', background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '4px', marginBottom: '14px', width: 'fit-content', gap: '3px' },
  billingBtn: { padding: '8px 20px', borderRadius: '9px', border: 'none', background: 'transparent', color: 'var(--ink-muted)', fontSize: '.84rem', fontWeight: '500', cursor: 'pointer', fontFamily: 'var(--ff)', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all .15s' },
  billingBtnActive: { background: 'var(--accent-primary)', color: '#fff', fontWeight: '700' },
  saveBadge: { background: 'var(--green-soft)', color: 'var(--green)', border: '1px solid var(--green-border)', padding: '2px 7px', borderRadius: '20px', fontSize: '.66rem', fontWeight: '700' },

  // Price card
  priceCard: { background: 'var(--surface-solid)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-lg)', padding: '20px 24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' },
  priceRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' },
  price: { fontSize: '2.4rem', fontWeight: '900', color: 'var(--accent-primary)', letterSpacing: '-.04em', lineHeight: 1 },
  pricePeriod: { fontSize: '1rem', fontWeight: '500', color: 'var(--ink-muted)' },
  priceSub: { fontSize: '.76rem', color: 'var(--ink-muted)', marginTop: '4px' },

  // Features
  sectionTitle: { fontSize: '.72rem', fontWeight: '700', color: 'var(--ink-faint)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '12px' },
  featureList: { display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '24px' },
  featureRow: { display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 16px', background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', transition: 'background .15s' },
  featureIcon: { width: '40px', height: '40px', minWidth: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 },
  featureInfo: { flex: 1, minWidth: 0 },
  featureName: { fontSize: '.88rem', fontWeight: '600', color: 'var(--ink)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' },
  featureDesc: { fontSize: '.76rem', color: 'var(--ink-muted)', lineHeight: 1.4 },
  freeLimit: { fontSize: '.7rem', color: 'var(--amber)', marginTop: '3px', fontWeight: '500' },
  premiumTag: { background: 'var(--accent-soft)', color: 'var(--accent-light)', border: '1px solid var(--accent-border)', padding: '1px 7px', borderRadius: '20px', fontSize: '.62rem', fontWeight: '700' },
  featureCheck: { fontSize: '1.1rem', flexShrink: 0 },

  // CTA
  cta: { background: 'linear-gradient(135deg,#1A1530 0%,#120E22 100%)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 'var(--r-xl)', padding: '32px', textAlign: 'center', position: 'relative', overflow: 'hidden' },
  ctaHeading: { fontSize: '1.3rem', fontWeight: '800', color: '#fff', letterSpacing: '-.03em', marginBottom: '8px' },
  ctaSub: { fontSize: '.86rem', color: 'rgba(255,255,255,.45)', marginBottom: '24px', lineHeight: 1.6 },
  ctaNote: { fontSize: '.72rem', color: 'rgba(255,255,255,.3)', marginTop: '12px' },

  // Buttons
  btnPrimary: { padding: '12px 28px', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--r-md)', color: '#fff', fontWeight: '700', fontSize: '.9rem', cursor: 'pointer', fontFamily: 'var(--ff)', boxShadow: '0 4px 20px var(--accent-btn-shadow)' },
  btnPrimaryLg: { width: '100%', padding: '15px', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--r-md)', color: '#fff', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', fontFamily: 'var(--ff)', boxShadow: '0 4px 20px var(--accent-btn-shadow)' },
}