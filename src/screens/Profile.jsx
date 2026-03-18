import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function Profile() {
  const navigate = useNavigate()
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
    setUser(profile)
    setStreak(streakData)
    setStats({ mocks: mockCount || 0, questions: responseCount || 0 })
    setForm({ full_name: profile?.full_name || '', exam_type: profile?.exam_type || 'WASSCE', exam_date: profile?.exam_date ? profile.exam_date.split('T')[0] : '' })
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    await supabase.from('users').update({
      full_name: form.full_name,
      exam_type: form.exam_type,
      exam_date: form.exam_date || null,
    }).eq('id', authUser.id)
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

  const getDaysLeft = () => {
    if (!user?.exam_date) return null
    return Math.max(0, Math.ceil((new Date(user.exam_date) - new Date()) / 86400000))
  }

  if (loading) return <div style={s.loadShell}><div style={s.loadText}>Loading profile...</div></div>

  return (
    <div style={s.shell}>
      <Sidebar user={user} />
      <main style={s.main}>
        <div style={s.topbar}><div style={s.topbarTitle}>Profile</div></div>
        <div style={s.content}>

          {savedMsg && <div style={s.successBanner}>{savedMsg}</div>}

          {/* PROFILE HEADER */}
          <div style={s.profileHero}>
            <div style={s.heroKente} />
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

          {/* STATS */}
          <div style={s.statsRow}>
            <div style={s.statCard}>
              <div style={s.statNum}>{stats.mocks}</div>
              <div style={s.statLabel}>Mock exams</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statNum}>{stats.questions}</div>
              <div style={s.statLabel}>Questions answered</div>
            </div>
            <div style={s.statCard}>
              <div style={{ ...s.statNum, color: '#FF6B6B' }}>{streak?.current_streak || 0}🔥</div>
              <div style={s.statLabel}>Day streak</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statNum}>{streak?.longest_streak || 0}</div>
              <div style={s.statLabel}>Best streak</div>
            </div>
          </div>

          {/* EDIT PROFILE */}
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <h3 style={s.sectionTitle}>Personal details</h3>
              <button style={s.editBtn} onClick={() => setEditing(e => !e)}>
                {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {editing ? (
              <div style={s.editForm}>
                <div style={s.formGroup}>
                  <label style={s.formLabel}>Full name</label>
                  <input style={s.input} value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Your full name" />
                </div>
                <div style={s.formGroup}>
                  <label style={s.formLabel}>Exam type</label>
                  <select style={s.input} value={form.exam_type}
                    onChange={e => setForm({ ...form, exam_type: e.target.value })}>
                    <option value="WASSCE">WASSCE</option>
                    <option value="BECE">BECE</option>
                    <option value="University">University Entrance</option>
                  </select>
                </div>
                <div style={s.formGroup}>
                  <label style={s.formLabel}>Exam date</label>
                  <input style={s.input} type="date" value={form.exam_date}
                    onChange={e => setForm({ ...form, exam_date: e.target.value })} />
                </div>
                <button style={s.btnGold} onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            ) : (
              <div style={s.detailList}>
                <div style={s.detailRow}>
                  <div style={s.detailLabel}>Full name</div>
                  <div style={s.detailValue}>{user?.full_name || '—'}</div>
                </div>
                <div style={s.detailRow}>
                  <div style={s.detailLabel}>Email</div>
                  <div style={s.detailValue}>{user?.email}</div>
                </div>
                <div style={s.detailRow}>
                  <div style={s.detailLabel}>Exam type</div>
                  <div style={s.detailValue}>{user?.exam_type || '—'}</div>
                </div>
                <div style={s.detailRow}>
                  <div style={s.detailLabel}>Exam date</div>
                  <div style={s.detailValue}>{user?.exam_date ? new Date(user.exam_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</div>
                </div>
              </div>
            )}
          </div>

          {/* CHANGE PASSWORD */}
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <h3 style={s.sectionTitle}>Password</h3>
              <button style={s.editBtn} onClick={() => setChangingPassword(c => !c)}>
                {changingPassword ? 'Cancel' : 'Change'}
              </button>
            </div>
            {changingPassword ? (
              <div style={s.editForm}>
                {pwMsg && <div style={{ ...s.successBanner, marginBottom: '12px', background: pwMsg.includes('success') ? 'rgba(0,200,150,0.1)' : 'rgba(255,107,107,0.1)', borderColor: pwMsg.includes('success') ? 'rgba(0,200,150,0.3)' : 'rgba(255,107,107,0.3)', color: pwMsg.includes('success') ? '#00C896' : '#FF6B6B' }}>{pwMsg}</div>}
                <div style={s.formGroup}>
                  <label style={s.formLabel}>New password</label>
                  <input style={s.input} type="password" value={pwForm.newPassword}
                    onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    placeholder="Min. 8 characters" />
                </div>
                <div style={s.formGroup}>
                  <label style={s.formLabel}>Confirm new password</label>
                  <input style={s.input} type="password" value={pwForm.confirm}
                    onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                    placeholder="Repeat new password" />
                </div>
                <button style={s.btnGold} onClick={handlePasswordChange}>Update password</button>
              </div>
            ) : (
              <div style={s.detailRow}>
                <div style={s.detailLabel}>Password</div>
                <div style={s.detailValue}>••••••••</div>
              </div>
            )}
          </div>

          {/* SETTINGS */}
          <div style={s.section}>
            <h3 style={{ ...s.sectionTitle, marginBottom: '12px' }}>Settings</h3>
            <div style={s.settingsList}>
              <div style={s.settingItem} onClick={() => navigate('/premium')}>
                <div style={s.settingLeft}>
                  <div style={s.settingIcon}>💎</div>
                  <div>
                    <div style={s.settingName}>Upgrade to Premium</div>
                    <div style={s.settingDesc}>Unlimited AI, predictions, offline packs</div>
                  </div>
                </div>
                <div style={s.settingArrow}>→</div>
              </div>
              <div style={s.settingItem} onClick={() => navigate('/flashcards')}>
                <div style={s.settingLeft}>
                  <div style={s.settingIcon}>🃏</div>
                  <div>
                    <div style={s.settingName}>Flashcards</div>
                    <div style={s.settingDesc}>Study key terms and definitions</div>
                  </div>
                </div>
                <div style={s.settingArrow}>→</div>
              </div>
              <div style={s.settingItem} onClick={() => navigate('/game')}>
                <div style={s.settingLeft}>
                  <div style={s.settingIcon}>⚡</div>
                  <div>
                    <div style={s.settingName}>Quiz Game</div>
                    <div style={s.settingDesc}>Rapid-fire quiz with points and streaks</div>
                  </div>
                </div>
                <div style={s.settingArrow}>→</div>
              </div>
              <div style={{ ...s.settingItem, borderBottom: 'none' }} onClick={handleLogout}>
                <div style={s.settingLeft}>
                  <div style={{ ...s.settingIcon, background: 'rgba(255,107,107,0.1)' }}>🚪</div>
                  <div>
                    <div style={{ ...s.settingName, color: '#FF6B6B' }}>Log out</div>
                    <div style={s.settingDesc}>Sign out of your account</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

const s = {
  shell: { display: 'flex', minHeight: '100vh', background: '#0D1117', fontFamily: 'DM Sans, sans-serif' },
  loadShell: { minHeight: '100vh', background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadText: { color: '#8B949E' },
  main: { flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column' },
  topbar: { height: '56px', display: 'flex', alignItems: 'center', padding: '0 28px', background: '#161B22', borderBottom: '1px solid rgba(240,246,252,0.06)', position: 'sticky', top: 0, zIndex: 40 },
  topbarTitle: { fontFamily: 'Georgia, serif', fontSize: '1.05rem', fontWeight: '600', color: '#F0F6FC' },
  content: { flex: 1, padding: '28px', paddingBottom: '60px', maxWidth: '700px' },
  successBanner: { background: 'rgba(0,200,150,0.1)', border: '1px solid rgba(0,200,150,0.3)', color: '#00C896', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' },
  profileHero: { background: '#161B22', border: '1px solid rgba(240,246,252,0.06)', borderRadius: '18px', padding: '28px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', position: 'relative', overflow: 'hidden', flexWrap: 'wrap' },
  heroKente: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'repeating-linear-gradient(90deg,#F0A500 0,#F0A500 20px,#00C896 20px,#00C896 40px,#FF6B6B 40px,#FF6B6B 60px,#4A9EFF 60px,#4A9EFF 80px)' },
  avatarLg: { width: '72px', height: '72px', borderRadius: '50%', background: '#F0A500', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontSize: '1.8rem', fontWeight: '700', color: '#0D1117', flexShrink: 0 },
  heroInfo: { flex: 1 },
  heroName: { fontFamily: 'Georgia, serif', fontSize: '1.4rem', fontWeight: '700', color: '#F0F6FC', marginBottom: '4px' },
  heroEmail: { fontSize: '0.82rem', color: '#8B949E', marginBottom: '10px' },
  heroBadges: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  badge: { background: 'rgba(240,165,0,0.1)', color: '#F0A500', border: '1px solid rgba(240,165,0,0.2)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' },
  badgeMuted: { background: '#1C2330', color: '#8B949E', border: '1px solid rgba(240,246,252,0.08)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' },
  statCard: { background: '#161B22', border: '1px solid rgba(240,246,252,0.06)', borderRadius: '12px', padding: '16px', textAlign: 'center' },
  statNum: { fontFamily: 'Georgia, serif', fontSize: '1.8rem', fontWeight: '700', color: '#F0A500', lineHeight: 1, marginBottom: '4px' },
  statLabel: { fontSize: '0.72rem', color: '#8B949E' },
  section: { background: '#161B22', border: '1px solid rgba(240,246,252,0.06)', borderRadius: '14px', padding: '20px', marginBottom: '16px' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  sectionTitle: { fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: '600', color: '#F0F6FC' },
  editBtn: { background: 'transparent', border: '1.5px solid rgba(240,246,252,0.1)', borderRadius: '8px', color: '#8B949E', fontSize: '0.8rem', padding: '6px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  editForm: { display: 'flex', flexDirection: 'column', gap: '14px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  formLabel: { fontSize: '0.75rem', fontWeight: '600', color: '#8B949E', letterSpacing: '0.06em', textTransform: 'uppercase' },
  input: { padding: '11px 14px', background: '#1C2330', border: '1.5px solid rgba(240,246,252,0.08)', borderRadius: '8px', color: '#F0F6FC', fontSize: '0.88rem', fontFamily: 'DM Sans, sans-serif', outline: 'none' },
  btnGold: { padding: '12px', background: '#F0A500', border: 'none', borderRadius: '8px', color: '#0D1117', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  detailList: { display: 'flex', flexDirection: 'column', gap: '0' },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(240,246,252,0.04)' },
  detailLabel: { fontSize: '0.85rem', color: '#8B949E' },
  detailValue: { fontSize: '0.85rem', color: '#F0F6FC', fontWeight: '500' },
  settingsList: { display: 'flex', flexDirection: 'column' },
  settingItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(240,246,252,0.06)', cursor: 'pointer' },
  settingLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  settingIcon: { width: '36px', height: '36px', borderRadius: '10px', background: '#1C2330', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 },
  settingName: { fontSize: '0.88rem', fontWeight: '600', color: '#F0F6FC', marginBottom: '2px' },
  settingDesc: { fontSize: '0.75rem', color: '#8B949E' },
  settingArrow: { color: '#484F58', fontSize: '1rem' },
}