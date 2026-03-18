import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useTheme } from '../context/ThemeContext'

export default function Profile() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
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
    const { count: responseCount } = await supabase.from('mock_responses').select('*', { count: 'exact', head: true })
      .in('exam_id', (await supabase.from('mock_exams').select('id').eq('user_id', authUser.id).then(({ data }) => data?.map(e => e.id) || [])))
    setUser(profile); setStreak(streakData)
    setStats({ mocks: mockCount || 0, questions: responseCount || 0 })
    setForm({ full_name: profile?.full_name || '', exam_type: profile?.exam_type || 'WASSCE', exam_date: profile?.exam_date ? profile.exam_date.split('T')[0] : '' })
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    await supabase.from('users').update({ full_name: form.full_name, exam_type: form.exam_type, exam_date: form.exam_date || null }).eq('id', authUser.id)
    setUser(prev => ({ ...prev, ...form })); setEditing(false); setSaving(false)
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

  const getDaysLeft = () => {
    if (!user?.exam_date) return null
    return Math.max(0, Math.ceil((new Date(user.exam_date) - new Date()) / 86400000))
  }

  if (loading) return <div style={s.loadShell}><div style={s.spinner} /></div>

  return (
    <div style={s.shell}>
      <Sidebar user={user} />
      <main style={s.main}>
        <div style={s.topbar}><div style={s.topbarTitle}>Profile</div></div>
        <div style={s.content}>

          {savedMsg && <div style={s.successBanner}>{savedMsg}</div>}

          {/* Profile hero */}
          <div style={s.hero}>
            <div style={s.kente} />
            <div style={s.avatarLg}>{user?.full_name?.[0]?.toUpperCase() || 'P'}</div>
            <div style={s.heroInfo}>
              <div style={s.heroName}>{user?.full_name || 'Student'}</div>
              <div style={s.heroEmail}>{user?.email}</div>
              <div style={s.heroBadges}>
                <div style={s.badge}>{user?.plan === 'premium' ? '💎 Premium' : '🆓 Free plan'}</div>
                {user?.exam_type && <div style={s.badgeMuted}>{user.exam_type}</div>}
                {getDaysLeft() !== null && <div style={s.badgeMuted}>{getDaysLeft()} days to exam</div>}
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
                {[['Full name', user?.full_name || '—'], ['Email', user?.email], ['Exam type', user?.exam_type || '—'], ['Exam date', user?.exam_date ? new Date(user.exam_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—']].map(([label, val]) => (
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
                {pwMsg && <div style={{ ...s.successBanner, background: pwMsg.includes('success') ? 'var(--teal-pale)' : 'var(--red-pale)', borderColor: pwMsg.includes('success') ? 'rgba(0,158,115,0.2)' : 'rgba(200,16,46,0.2)', color: pwMsg.includes('success') ? 'var(--teal)' : 'var(--red)' }}>{pwMsg}</div>}
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
            <h3 style={{ ...s.sectionTitle, marginBottom: '10px' }}>Settings</h3>
            <div>

              {/* Theme toggle row */}
              <div style={{ ...s.settingItem, borderBottom: '1px solid var(--border)' }} onClick={toggleTheme}>
                <div style={{ ...s.settingIcon, background: isDark ? 'rgba(232,160,32,0.12)' : 'var(--cream-mid)' }}>
                  {isDark ? '☀️' : '🌙'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={s.settingName}>{isDark ? 'Light mode' : 'Dark mode'}</div>
                  <div style={s.settingDesc}>{isDark ? 'Switch to the light theme' : 'Switch to the dark theme'}</div>
                </div>
                {/* Mini toggle visual */}
                <div style={{ ...s.miniTrack, background: isDark ? 'var(--gold)' : 'var(--border-mid)' }}>
                  <div style={{ ...s.miniThumb, transform: isDark ? 'translateX(16px)' : 'translateX(0)' }} />
                </div>
              </div>

              {[
                { icon: '💎', name: 'Upgrade to Premium', desc: 'Unlimited AI, predictions, offline packs', path: '/premium', danger: false },
                { icon: '🃏', name: 'Flashcards', desc: 'Study key terms and definitions', path: '/flashcards', danger: false },
                { icon: '⚡', name: 'Quiz Game', desc: 'Rapid-fire quiz with points and streaks', path: '/game', danger: false },
                { icon: '🚪', name: 'Log out', desc: 'Sign out of your account', path: null, danger: true },
              ].map((item, i) => (
                <div key={i}
                  style={{ ...s.settingItem, borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}
                  onClick={() => item.path ? navigate(item.path) : handleLogout()}>
                  <div style={{ ...s.settingIcon, background: item.danger ? 'var(--red-pale)' : 'var(--surface-mid)' }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...s.settingName, color: item.danger ? 'var(--red)' : 'var(--ink)' }}>{item.name}</div>
                    <div style={s.settingDesc}>{item.desc}</div>
                  </div>
                  {!item.danger && <div style={s.settingArrow}>→</div>}
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

const s = {
  shell: { display: 'flex', minHeight: '100vh', background: 'var(--cream)', fontFamily: 'var(--ff-sans)' },
  loadShell: { minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: '32px', height: '32px', border: '3px solid var(--border-mid)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  main: { flex: 1, marginLeft: '220px', display: 'flex', flexDirection: 'column' },
  topbar: { height: '56px', display: 'flex', alignItems: 'center', padding: '0 28px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1.05rem', fontWeight: '700', color: 'var(--ink)' },
  content: { flex: 1, padding: '24px 28px 60px', maxWidth: '680px' },
  successBanner: { background: 'var(--teal-pale)', border: '1px solid rgba(0,158,115,0.2)', color: 'var(--teal)', padding: '10px 16px', borderRadius: 'var(--r-sm)', fontSize: '0.84rem', marginBottom: '18px' },
  hero: { background: 'var(--forest-mid)', borderRadius: 'var(--r-xl)', padding: '28px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px', position: 'relative', overflow: 'hidden', flexWrap: 'wrap' },
  kente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#C8880A 0,#C8880A 18px,#009E73 18px,#009E73 36px,#C8102E 36px,#C8102E 54px,#1A5DC8 54px,#1A5DC8 72px)' },
  avatarLg: { width: '68px', height: '68px', borderRadius: '50%', background: 'var(--gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-serif)', fontSize: '1.7rem', fontWeight: '700', color: 'var(--forest)', flexShrink: 0 },
  heroInfo: { flex: 1 },
  heroName: { fontFamily: 'var(--ff-serif)', fontSize: '1.4rem', fontWeight: '700', color: '#F7F3EE', marginBottom: '3px' },
  heroEmail: { fontSize: '0.8rem', color: 'rgba(247,243,238,0.45)', marginBottom: '10px' },
  heroBadges: { display: 'flex', gap: '7px', flexWrap: 'wrap' },
  badge: { background: 'rgba(200,136,10,0.2)', color: 'var(--gold-light)', border: '1px solid rgba(200,136,10,0.3)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600' },
  badgeMuted: { background: 'rgba(247,243,238,0.08)', color: 'rgba(247,243,238,0.5)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' },
  statCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '15px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' },
  statNum: { fontFamily: 'var(--ff-serif)', fontSize: '1.7rem', fontWeight: '700', color: 'var(--gold)', lineHeight: 1, marginBottom: '4px' },
  statLabel: { fontSize: '0.7rem', color: 'var(--ink-muted)', fontWeight: '500' },
  section: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px', marginBottom: '14px', boxShadow: 'var(--shadow-sm)' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  sectionTitle: { fontFamily: 'var(--ff-serif)', fontSize: '1rem', fontWeight: '700', color: 'var(--ink)' },
  editBtn: { background: 'transparent', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-sm)', color: 'var(--ink-muted)', fontSize: '0.78rem', padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
  editForm: { display: 'flex', flexDirection: 'column', gap: '13px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.7rem', fontWeight: '600', color: 'var(--ink-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' },
  btnPrimary: { padding: '12px', background: 'var(--forest-mid)', border: 'none', borderRadius: 'var(--r-sm)', color: '#F7F3EE', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'var(--ff-sans)' },
  detailList: { display: 'flex', flexDirection: 'column' },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' },
  detailLabel: { fontSize: '0.84rem', color: 'var(--ink-muted)' },
  detailValue: { fontSize: '0.84rem', color: 'var(--ink)', fontWeight: '500' },
  settingItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 0', cursor: 'pointer' },
  settingIcon: { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 },
  settingName: { fontSize: '0.86rem', fontWeight: '600', color: 'var(--ink)', marginBottom: '2px' },
  settingDesc: { fontSize: '0.73rem', color: 'var(--ink-muted)' },
  settingArrow: { color: 'var(--ink-faint)', fontSize: '0.9rem' },
  miniTrack: { width: '32px', height: '18px', borderRadius: '9px', position: 'relative', flexShrink: 0, transition: 'background 0.2s' },
  miniThumb: { position: 'absolute', top: '3px', left: '3px', width: '12px', height: '12px', borderRadius: '50%', background: '#fff', transition: 'transform 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' },
}
