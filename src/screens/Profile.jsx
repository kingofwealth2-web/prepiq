import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import MobileHeader from '../components/MobileHeader'
import { useMobileMenu } from '../App'
import { AccentPicker } from '../context/AccentContext'
import { useTheme } from '../context/ThemeContext'

export default function Profile() {
  const navigate = useNavigate()
  const { open: mobileOpen, setOpen: setMobileOpen } = useMobileMenu()
  const { isDark, toggle } = useTheme()
  const [user, setUser] = useState(null)
  const [streak, setStreak] = useState(null)
  const [stats, setStats] = useState({ mocks: 0, questions: 0 })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', exam_type: '', exam_date: '' })
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [pwForm, setPwForm] = useState({ newPassword: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState('')

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { navigate('/login'); return }
    const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    const { data: streakData } = await supabase.from('streaks').select('*').eq('user_id', authUser.id).single()
    const { count: mockCount } = await supabase.from('mock_exams').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id).not('submitted_at', 'is', null)
    const { data: examIds } = await supabase.from('mock_exams').select('id').eq('user_id', authUser.id)
    let responseCount = 0
    if (examIds?.length) {
      const { count } = await supabase.from('mock_responses').select('*', { count: 'exact', head: true }).in('exam_id', examIds.map(e => e.id))
      responseCount = count || 0
    }
    setUser(profile)
    setStreak(streakData)
    setStats({ mocks: mockCount || 0, questions: responseCount })
    setForm({ full_name: profile?.full_name || '', exam_type: profile?.exam_type || 'WASSCE', exam_date: profile?.exam_date ? profile.exam_date.split('T')[0] : '' })
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    await supabase.from('users').update({ full_name: form.full_name, exam_type: form.exam_type, exam_date: form.exam_date || null }).eq('id', authUser.id)
    setUser(prev => ({ ...prev, ...form }))
    setEditing(false)
    setSaving(false)
    setSavedMsg('Profile updated successfully')
    setTimeout(() => setSavedMsg(''), 3000)
  }

  async function handlePasswordChange() {
    if (pwForm.newPassword !== pwForm.confirm) { setPwMsg('Passwords do not match'); return }
    if (pwForm.newPassword.length < 8) { setPwMsg('Password must be at least 8 characters'); return }
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPassword })
    if (error) { setPwMsg(error.message); return }
    setPwMsg('Password updated successfully')
    setPwForm({ newPassword: '', confirm: '' })
    setTimeout(() => { setPwMsg(''); setChangingPassword(false) }, 2000)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const daysLeft = () => {
    if (!user?.exam_date) return null
    return Math.max(0, Math.ceil((new Date(user.exam_date) - new Date()) / 86400000))
  }

  if (loading) return <div style={s.loadShell}><div style={s.spinner} /></div>

  return (
    <div style={s.shell}>
      <Sidebar user={user} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main style={s.main}>
        <MobileHeader title="Profile" onMenuOpen={() => setMobileOpen(true)} />
        <div style={s.topbar}>
          <div style={s.topbarTitle}>Profile</div>
        </div>
        <div style={s.content}>

          {savedMsg && <div style={s.successBanner}>{savedMsg}</div>}

          {/* Hero */}
          <div style={s.hero}>
            <div style={s.kente} />
            <div style={s.avatarLg}>{user?.full_name?.[0]?.toUpperCase() || 'P'}</div>
            <div style={s.heroInfo}>
              <div style={s.heroName}>{user?.full_name || 'Student'}</div>
              <div style={s.heroEmail}>{user?.email}</div>
              <div style={s.heroBadges}>
                <div style={s.badge}>{user?.plan === 'premium' ? '💎 Premium' : '🆓 Free plan'}</div>
                {user?.exam_type && <div style={s.badgeMuted}>{user.exam_type}</div>}
                {daysLeft() !== null && <div style={s.badgeMuted}>{daysLeft()} days to exam</div>}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={s.statsRow}>
            {[
              { num: stats.mocks, label: 'Mock exams' },
              { num: stats.questions, label: 'Questions answered' },
              { num: `${streak?.current_streak || 0}🔥`, label: 'Day streak' },
              { num: streak?.longest_streak || 0, label: 'Best streak' },
            ].map((st, i) => (
              <div key={i} style={s.statCard}>
                <div style={s.statNum}>{st.num}</div>
                <div style={s.statLabel}>{st.label}</div>
              </div>
            ))}
          </div>

          {/* Personal details */}
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <h3 style={s.sectionTitle}>Personal details</h3>
              <button style={s.editBtn} onClick={() => setEditing(e => !e)}>{editing ? 'Cancel' : 'Edit'}</button>
            </div>
            {editing ? (
              <div style={s.editForm}>
                <div style={s.formGroup}>
                  <label style={s.label}>Full name</label>
                  <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Your full name" />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Exam type</label>
                  <select value={form.exam_type} onChange={e => setForm({ ...form, exam_type: e.target.value })}>
                    <option value="WASSCE">WASSCE</option>
                    <option value="BECE">BECE</option>
                    <option value="University">University Entrance</option>
                  </select>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Exam date</label>
                  <input type="date" value={form.exam_date} onChange={e => setForm({ ...form, exam_date: e.target.value })} />
                </div>
                <button style={s.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
              </div>
            ) : (
              <div style={s.detailList}>
                {[
                  ['Full name', user?.full_name || '—'],
                  ['Email', user?.email],
                  ['Exam type', user?.exam_type || '—'],
                  ['Exam date', user?.exam_date ? new Date(user.exam_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
                ].map(([label, val]) => (
                  <div key={label} style={s.detailRow}>
                    <div style={s.detailLabel}>{label}</div>
                    <div style={s.detailValue}>{val}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Password */}
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <h3 style={s.sectionTitle}>Password</h3>
              <button style={s.editBtn} onClick={() => setChangingPassword(c => !c)}>{changingPassword ? 'Cancel' : 'Change'}</button>
            </div>
            {changingPassword ? (
              <div style={s.editForm}>
                {pwMsg && (
                  <div style={{ ...s.successBanner, background: pwMsg.includes('success') ? 'var(--green-soft)' : 'var(--red-soft)', color: pwMsg.includes('success') ? 'var(--green)' : 'var(--red)', border: `1px solid ${pwMsg.includes('success') ? 'var(--green-border)' : 'var(--red-border)'}` }}>
                    {pwMsg}
                  </div>
                )}
                <div style={s.formGroup}>
                  <label style={s.label}>New password</label>
                  <input type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} placeholder="Min. 8 characters" />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Confirm new password</label>
                  <input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} placeholder="Repeat new password" />
                </div>
                <button style={s.btnPrimary} onClick={handlePasswordChange}>Update password</button>
              </div>
            ) : (
              <div style={s.detailRow}>
                <div style={s.detailLabel}>Password</div>
                <div style={s.detailValue}>••••••••</div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div style={s.section}>
            <h3 style={{ ...s.sectionTitle, marginBottom: '16px' }}>Settings</h3>

            {/* Accent colour */}
            <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '.7rem', fontWeight: '600', color: 'var(--ink-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                Accent colour
              </div>
              <AccentPicker />
            </div>

            {/* Theme toggle */}
            <div style={{ marginBottom: '4px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '.7rem', fontWeight: '600', color: 'var(--ink-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                Theme
              </div>
              <button
                onClick={toggle}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '11px 14px', background: 'var(--surface)', border: '1px solid var(--border-mid)', borderRadius: 'var(--r-md)', cursor: 'pointer', fontFamily: 'var(--ff)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                  {isDark ? '☀️' : '🌙'}
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '.86rem', fontWeight: '600', color: 'var(--ink)', marginBottom: '2px' }}>{isDark ? 'Switch to light mode' : 'Switch to dark mode'}</div>
                  <div style={{ fontSize: '.73rem', color: 'var(--ink-muted)' }}>{isDark ? 'Easier on the eyes in bright environments' : 'Better for low-light studying'}</div>
                </div>
                <div style={{ width: '38px', height: '22px', borderRadius: '11px', background: isDark ? 'var(--accent-primary)' : 'var(--border-mid)', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
                  <div style={{ position: 'absolute', top: '3px', left: isDark ? '19px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                </div>
              </button>
            </div>

            {/* Other settings */}
            {[
              { icon: '💎', name: 'Upgrade to Premium', desc: 'Unlimited AI, predictions, offline packs', path: '/premium', danger: false },
              { icon: '🃏', name: 'Flashcards', desc: 'Study key terms and definitions', path: '/flashcards', danger: false },
              { icon: '⚡', name: 'Quiz Game', desc: 'Rapid-fire quiz with points and streaks', path: '/game', danger: false },
              { icon: '🚪', name: 'Log out', desc: 'Sign out of your account', path: null, danger: true },
            ].map((item, i, arr) => (
              <div key={i}
                style={{ ...s.settingItem, borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
                onClick={() => item.path ? navigate(item.path) : handleLogout()}>
                <div style={{ ...s.settingIcon, background: item.danger ? 'var(--red-soft)' : 'var(--surface)' }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...s.settingName, color: item.danger ? 'var(--red)' : 'var(--ink)' }}>{item.name}</div>
                  <div style={s.settingDesc}>{item.desc}</div>
                </div>
                {!item.danger && <div style={s.settingArrow}>→</div>}
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  )
}

const s = {
  shell: { display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff)' },
  loadShell: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: '28px', height: '28px', border: '2.5px solid var(--border-mid)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin .7s linear infinite' },
  main: { flex: 1, marginLeft: 'var(--sidebar-w)', display: 'flex', flexDirection: 'column' },
  topbar: { height: '52px', display: 'flex', alignItems: 'center', padding: '0 24px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontSize: '.95rem', fontWeight: '700', color: 'var(--ink)', letterSpacing: '-.02em' },
  content: { flex: 1, padding: '20px 24px 60px' },
  successBanner: { background: 'var(--green-soft)', border: '1px solid var(--green-border)', color: 'var(--green)', padding: '10px 16px', borderRadius: 'var(--r-sm)', fontSize: '.84rem', marginBottom: '16px' },
  hero: { background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r-xl)', padding: '24px', display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '14px', position: 'relative', overflow: 'hidden', flexWrap: 'wrap' },
  kente: { position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 14px,#009E73 14px,#009E73 28px,#C8102E 28px,#C8102E 42px,#1A5DC8 42px,#1A5DC8 56px)' },
  avatarLg: { width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: '800', color: '#fff', flexShrink: 0, boxShadow: '0 0 0 3px var(--accent-border)' },
  heroInfo: { flex: 1 },
  heroName: { fontSize: '1.3rem', fontWeight: '800', color: 'var(--ink)', marginBottom: '3px', letterSpacing: '-.03em' },
  heroEmail: { fontSize: '.8rem', color: 'var(--ink-faint)', marginBottom: '10px' },
  heroBadges: { display: 'flex', gap: '7px', flexWrap: 'wrap' },
  badge: { background: 'var(--accent-soft)', color: 'var(--accent-light)', border: '1px solid var(--accent-border)', padding: '3px 10px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '600' },
  badgeMuted: { background: 'rgba(255,255,255,.05)', color: 'var(--ink-muted)', padding: '3px 10px', borderRadius: '20px', fontSize: '.72rem' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '14px' },
  statCard: { background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r-md)', padding: '14px', textAlign: 'center' },
  statNum: { fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-light)', lineHeight: 1, marginBottom: '4px', letterSpacing: '-.04em' },
  statLabel: { fontSize: '.68rem', color: 'var(--ink-faint)', fontWeight: '500' },
  section: { background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px', marginBottom: '12px' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  sectionTitle: { fontSize: '.88rem', fontWeight: '700', color: 'var(--ink)' },
  editBtn: { background: 'transparent', border: '1px solid var(--border-mid)', borderRadius: 'var(--r-sm)', color: 'var(--ink-muted)', fontSize: '.78rem', padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--ff)' },
  editForm: { display: 'flex', flexDirection: 'column', gap: '13px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '.68rem', fontWeight: '600', color: 'var(--ink-muted)', letterSpacing: '.07em', textTransform: 'uppercase' },
  btnPrimary: { padding: '12px', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--r-sm)', color: '#fff', fontWeight: '700', fontSize: '.88rem', cursor: 'pointer', fontFamily: 'var(--ff)' },
  detailList: { display: 'flex', flexDirection: 'column' },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' },
  detailLabel: { fontSize: '.84rem', color: 'var(--ink-muted)' },
  detailValue: { fontSize: '.84rem', color: 'var(--ink)', fontWeight: '500' },
  settingItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 0', cursor: 'pointer' },
  settingIcon: { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 },
  settingName: { fontSize: '.86rem', fontWeight: '600', marginBottom: '2px' },
  settingDesc: { fontSize: '.73rem', color: 'var(--ink-muted)' },
  settingArrow: { color: 'var(--ink-faint)', fontSize: '.9rem' },
}