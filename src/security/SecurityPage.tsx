import { useEffect, useState } from 'react'
import { Icon, icons, Card, PageShell } from '../shared'
import { authRequest, db, signOutAdmin } from '../lib/supabase'

// ── Security & Access — real data from your Supabase auth session and admin profiles ──
const muted = '#9AA0BA', dim = '#8A90AB'

const browser = () => {
  const ua = navigator.userAgent
  const b = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Unknown OS'
  return b + ' · ' + os
}
const when = (v?: string | number | null) => {
  if (!v) return '—'
  const d = typeof v === 'number' ? new Date(v * 1000) : new Date(v)
  return isNaN(d.getTime()) ? '—' : d.toLocaleString()
}
const sessionExpiry = () => { try { return JSON.parse(localStorage.getItem('starfix_admin_access') || 'null')?.expires_at as number | undefined } catch { return undefined } }

const btn: React.CSSProperties = { padding: '9px 16px', border: '1px solid rgba(212,175,55,.3)', borderRadius: 9, background: 'rgba(255,255,255,.05)', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#F7EFD8' }

function Kpi({ icon, label, value, sub, tone }: { icon: keyof typeof icons; label: string; value: string; sub?: string; tone?: string }) {
  return <Card style={{ padding: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(212,175,55,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon d={icons[icon]} size={16} style={{ color: '#D4AF37' }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: dim }}>{label}</div>
    </div>
    <div style={{ fontSize: 20, fontFamily: 'Playfair Display, serif', fontWeight: 600, color: tone || '#F7EFD8', wordBreak: 'break-word' }}>{value}</div>
    {sub && <div style={{ fontSize: 11.5, color: dim, marginTop: 4 }}>{sub}</div>}
  </Card>
}

export default function SecurityPage() {
  const [u, setU] = useState<any>(null)
  const [admins, setAdmins] = useState<any[]>([])
  const [err, setErr] = useState('')
  const [working, setWorking] = useState(false)

  useEffect(() => {
    authRequest('/auth/v1/user').then(r => r.json()).then(setU).catch(e => setErr(e.message))
    db('profiles?select=id,full_name,email,role,created_at&role=eq.admin&order=created_at.asc').then(setAdmins).catch(() => {})
  }, [])

  const factors: any[] = u?.factors || []
  const mfaOn = factors.some(f => f.status === 'verified')
  const exp = sessionExpiry()

  const signOutEverywhere = async () => {
    if (!window.confirm('Sign out of Starfix Admin on every device?')) return
    setWorking(true)
    try { await authRequest('/auth/v1/logout?scope=global', { method: 'POST' }) } catch { /* token may already be invalid */ }
    await signOutAdmin()
    location.reload()
  }

  const rows: [string, string][] = [
    ['Signed in as', u?.email || '—'],
    ['User ID', u?.id || '—'],
    ['Sign-in method', (u?.app_metadata?.provider || 'email') + ''],
    ['Email confirmed', when(u?.email_confirmed_at)],
    ['Account created', when(u?.created_at)],
    ['Last sign-in', when(u?.last_sign_in_at)],
    ['Session expires', when(exp)],
    ['This device', browser()],
  ]

  return <PageShell title="Security & Access" subtitle="Your live admin session, the people who can sign in to this panel, and two-factor status — read directly from Starfix authentication.">
    {err && <Card style={{ marginBottom: 16, color: '#F87171' }}>{err}</Card>}

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 16, marginBottom: 28 }}>
      <Kpi icon="users" label="Administrators" value={String(admins.length)} sub="Accounts with admin access" />
      <Kpi icon="shieldCheck" label="Two-factor (you)" value={u ? (mfaOn ? 'Enabled' : 'Not enabled') : '…'} tone={u ? (mfaOn ? '#4ADE80' : '#FBBF24') : undefined} sub={mfaOn ? 'Authenticator app verified' : 'Add an authenticator app in Supabase'} />
      <Kpi icon="clock" label="Last sign-in" value={u?.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : '—'} sub={u?.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleTimeString() : undefined} />
      <Kpi icon="activity" label="Session expires" value={exp ? new Date(exp * 1000).toLocaleTimeString() : '—'} sub="Renews automatically while you are active" />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 20, alignItems: 'flex-start' }}>
      <Card>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Your session</div>
        <div style={{ fontSize: 12.5, color: dim, marginBottom: 16 }}>Details of the account and device you are using right now</div>
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', rowGap: 10, fontSize: 13 }}>
          {rows.map(([l, v]) => <><span key={l} style={{ color: dim }}>{l}</span><span key={l + 'v'} style={{ wordBreak: 'break-all' }}>{v}</span></>)}
        </div>
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(212,175,55,.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 12, color: dim, maxWidth: 260 }}>Lost a device or shared this login? End every session at once.</div>
          <button onClick={signOutEverywhere} disabled={working} style={{ ...btn, color: '#F87171', borderColor: 'rgba(248,113,113,.45)' }}>{working ? 'Signing out…' : 'Sign out everywhere'}</button>
        </div>
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 22px 14px' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600 }}>Administrator accounts</div>
          <div style={{ fontSize: 12.5, color: dim, marginTop: 4 }}>Everyone whose profile has the admin role</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead><tr style={{ background: 'rgba(212,175,55,.07)' }}>{['Admin', 'Added'].map(h => <th key={h} style={{ padding: '12px 22px', fontSize: 11.5, fontWeight: 600, color: '#D4AF37' }}>{h}</th>)}</tr></thead>
          <tbody>
            {admins.map(a => <tr key={a.id} style={{ borderTop: '1px solid rgba(212,175,55,.12)' }}>
              <td style={{ padding: '14px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#F4D67A,#B8901F)', color: '#0A0E1F', fontWeight: 700 }}>{(a.full_name || a.email || '?').charAt(0).toUpperCase()}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.full_name || a.email}{u?.id === a.id && <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 600, color: '#D4AF37', background: 'rgba(212,175,55,.14)', padding: '1px 8px', borderRadius: 99 }}>You</span>}</div>
                    <div style={{ fontSize: 11.5, color: dim }}>{a.email}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '14px 22px', fontSize: 12.5, color: muted }}>{when(a.created_at)}</td>
            </tr>)}
            {!admins.length && <tr><td colSpan={2} style={{ padding: 22, textAlign: 'center', fontSize: 13, color: dim }}>Loading administrators…</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>

    <div style={{ marginTop: 20, fontSize: 12.5, color: dim, display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon d={icons.eye} size={14} />
      Full sign-in history and failed-login attempts are recorded in Supabase under Authentication → Audit Logs.
    </div>
  </PageShell>
}
