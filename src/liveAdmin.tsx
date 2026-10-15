import { useEffect, useMemo, useState } from 'react'
import { Card, PageShell } from './shared'
import {
  getAdminOverview,
  getAdminUsers,
  getAdminMentors,
  getAdminPaths,
  getAdminExplore,
  getAdminAnalytics,
  getBookingsNamed,
  getConversationsNamed,
  type AdminUser,
  type AdminMentor
} from './adminBackend'
import {
  GrowthPathDropdown,
  isLearnerAssociatedWithPath,
  isBookingAssociatedWithPath,
  isMentorAssociatedWithPath
} from './growthPathFilter'
import { LearnerDetailDrawer } from './users/LearnerDetailDrawer'
import { MentorDetailDrawer } from './mentors/MentorDetailDrawer'
import { GeographyAnalyticsView } from './analytics/GeographyAnalyticsView'
import { UserActivityView } from './analytics/UserActivityView'
import { signIn, signOutAdmin, requireAdmin, signInAsAdminDemo } from './lib/supabase'
import { fetchLiveLogins, subscribeToLiveLogins, type UserLoginEvent } from './lib/loginAudit'

// Re-fetch live data every 10s so the admin always reflects the Starfix website instantly.
function useLive<T>(fn: () => Promise<T>, set: (v: T) => void, onErr?: (m: string) => void, ms = 10000) {
  useEffect(() => {
    let on = true
    const run = () =>
      fn()
        .then(v => {
          if (on) {
            set(v)
            onErr?.('')
          }
        })
        .catch(e => {
          if (on) onErr?.(e.message)
        })
    run()
    const t = setInterval(run, ms)
    return () => {
      on = false
      clearInterval(t)
    }
  }, [])
}

const btn = {
  padding: '8px 13px',
  border: '1px solid rgba(212,175,55,0.22)',
  borderRadius: 8,
  background: 'rgba(255,255,255,0.05)',
  cursor: 'pointer',
  fontSize: 12.5,
  color: '#F7EFD8'
}
const th = {
  textAlign: 'left' as const,
  padding: '14px 13px',
  fontSize: 11.5,
  fontWeight: 600,
  letterSpacing: '.03em',
  color: '#D4AF37',
  background: 'rgba(212,175,55,.07)'
}
const td = { padding: 14, borderTop: '1px solid rgba(212,175,55,.12)' }
const tones: any = {
  green: ['#4ADE80', 'rgba(74,222,128,.12)', 'rgba(74,222,128,.3)'],
  amber: ['#FBBF24', 'rgba(251,191,36,.12)', 'rgba(251,191,36,.3)'],
  red: ['#F87171', 'rgba(248,113,113,.12)', 'rgba(248,113,113,.3)'],
  gold: ['#F4D67A', 'rgba(212,175,55,.14)', 'rgba(212,175,55,.35)'],
  gray: ['#9AA0BA', 'rgba(255,255,255,.05)', 'rgba(255,255,255,.12)'],
  purple: ['#C4B5FD', 'rgba(196,181,253,.14)', 'rgba(196,181,253,.35)']
}
function Pill({ text, tone }: { text: string; tone: string }) {
  const t = tones[tone] || tones.gray
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 99,
        fontSize: 11.5,
        fontWeight: 600,
        color: t[0],
        background: t[1],
        border: '1px solid ' + t[2]
      }}
    >
      {text}
    </span>
  )
}
const statusTone = (x: string) => {
  const v = (x || '').toLowerCase()
  return ['confirmed', 'completed', 'active'].includes(v)
    ? 'green'
    : ['pending', 'requested', 'at risk'].includes(v)
    ? 'amber'
    : ['cancelled', 'canceled', 'failed', 'inactive'].includes(v)
    ? 'red'
    : 'gray'
}

function timeAgo(dateStr: string) {
  if (!dateStr) return '—'
  const time = Date.parse(dateStr)
  if (isNaN(time)) return '—'
  const sec = Math.max(0, Math.floor((Date.now() - time) / 1000))
  if (sec < 45) return 'Just now'
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
  return `${Math.floor(sec / 86400)}d ago`
}

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'login' | 'ok'>('loading'),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)

  useEffect(() => {
    requireAdmin()
      .then(r => {
        setState(r.profile ? 'ok' : 'login')
        if (r.error && r.error.message !== 'Not signed in') setError(r.error.message)
      })
      .catch(() => setState('login'))
  }, [])

  if (state === 'loading')
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'radial-gradient(circle at 50% 0%,#101A44 0%,#070A1A 55%,#04050D 100%)',
          color: '#D4AF37'
        }}
      >
        Checking administrator access…
      </div>
    )

  if (state === 'login')
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'radial-gradient(circle at 50% 0%,#101A44 0%,#070A1A 55%,#04050D 100%)',
          padding: 16
        }}
      >
        <Card
          style={{
            width: 420,
            maxWidth: 'calc(100vw - 32px)',
            padding: 34,
            background: 'linear-gradient(160deg,#0E1638,#070A1A)',
            borderColor: 'rgba(212,175,55,.38)',
            color: '#fff',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)'
          }}
        >
          <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 28, color: '#F4D67A' }}>Starfix Admin</div>
          <div style={{ color: '#A7A7A7', fontSize: 13, margin: '6px 0 20px' }}>
            Growth Operations · Live Platform Intelligence
          </div>

          {/* Quick 1-Click Access for Owner */}
          <button
            type="button"
            onClick={async () => {
              setBusy(true)
              try {
                await signInAsAdminDemo()
                setState('ok')
              } finally {
                setBusy(false)
              }
            }}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid rgba(212,175,55,.4)',
              background: 'rgba(212,175,55,.12)',
              color: '#F4D67A',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s ease'
            }}
          >
            <span>✦ Enter as Starfix Administrator (Kunal Valecha)</span>
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
              color: 'rgba(250,249,246,.3)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '.06em'
            }}
          >
            <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.1)' }} /> OR SIGN IN WITH CREDENTIALS
            <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.1)' }} />
          </div>

          {error && (
            <div
              style={{
                background: '#351414',
                color: '#FCA5A5',
                padding: 10,
                borderRadius: 8,
                fontSize: 12,
                marginBottom: 14
              }}
            >
              {error}
            </div>
          )}

          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Admin email (e.g. kvalecha186@gmail.com)"
            type="email"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: 11,
              border: '1px solid rgba(212,175,55,.25)',
              background: 'rgba(255,255,255,.05)',
              color: '#fff',
              borderRadius: 8,
              marginBottom: 10,
              outline: 'none'
            }}
          />
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            onKeyDown={e => {
              if (e.key === 'Enter') document.getElementById('admin-login')?.click()
            }}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: 11,
              border: '1px solid rgba(212,175,55,.25)',
              background: 'rgba(255,255,255,.05)',
              color: '#fff',
              borderRadius: 8,
              outline: 'none'
            }}
          />
          <button
            id="admin-login"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setError('')
              try {
                await signIn(email, password)
                const r = await requireAdmin()
                if (r.error) throw r.error
                setState('ok')
              } catch (e: any) {
                setError(e instanceof Error ? e.message : 'Sign in failed')
                await signOutAdmin()
              } finally {
                setBusy(false)
              }
            }}
            style={{
              width: '100%',
              marginTop: 16,
              padding: 12,
              border: 0,
              borderRadius: 9,
              background: 'linear-gradient(135deg,#F4D67A,#D4AF37 55%,#B8901F)',
              color: '#080808',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {busy ? 'Signing in…' : 'Sign in as administrator'}
          </button>
        </Card>
      </div>
    )

  return <>{children}</>
}

function Stat({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <Card style={{ padding: 22, position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          right: -30,
          top: -30,
          width: 110,
          height: 110,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(212,175,55,.22),transparent 70%)',
          pointerEvents: 'none'
        }}
      />
      <div style={{ fontSize: 12.5, color: '#9AA0BA', letterSpacing: '.02em' }}>{label}</div>
      <div
        style={{
          fontFamily: 'Playfair Display,serif',
          fontSize: 38,
          fontWeight: 600,
          marginTop: 8,
          lineHeight: 1.1,
          background: 'linear-gradient(180deg,#FFF3C4,#D4AF37)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent'
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: '#8A90AB', marginTop: 8 }}>{detail}</div>
    </Card>
  )
}

function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>
      </div>
    </Card>
  )
}

export function LiveOverview() {
  const [d, setD] = useState<any>(null),
    [err, setErr] = useState(''),
    [logins, setLogins] = useState<UserLoginEvent[]>([])

  useEffect(() => {
    getAdminOverview().then(setD).catch(e => setErr(e.message))
    fetchLiveLogins().then(setLogins)
    const unsub = subscribeToLiveLogins(fresh => {
      setLogins(prev => [fresh, ...prev.filter(x => x.id !== fresh.id)])
    })
    return unsub
  }, [])

  if (err)
    return (
      <PageShell title="Overview" subtitle="Live Starfix operations.">
        <Card style={{ padding: 24, color: '#F87171' }}>{err}</Card>
      </PageShell>
    )
  if (!d)
    return (
      <PageShell title="Overview" subtitle="Live Starfix operations.">
        <Card style={{ padding: 24 }}>Loading live Starfix data…</Card>
      </PageShell>
    )

  return (
    <PageShell title="Starfix Overview" subtitle="Live operational data and user login stream from Supabase.">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 22 }}>
        <Stat label="Total Learners" value={d.learners} detail={d.activeLearners + ' active / logged in recently'} />
        <Stat
          label="Mentor listings"
          value={d.mentors}
          detail={d.registeredMentors + ' registered mentors · ' + d.activeMentees + ' active mentees'}
        />
        <Stat label="Bookings" value={d.bookings} detail={d.completedSessions + ' completed sessions'} />
        <Stat label="Growth Paths" value={d.paths} detail={d.progressRecords + ' live progress records'} />
      </div>

      {/* Live Logins Preview */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#4ADE80',
                boxShadow: '0 0 8px #4ADE80',
                display: 'inline-block'
              }}
            />
            <h3 style={{ margin: 0, fontSize: 16, color: '#F4D67A', fontFamily: 'Playfair Display, serif' }}>
              Real-Time User Logins ({logins.length})
            </h3>
          </div>
          <span style={{ fontSize: 12, color: '#8A90AB' }}>Syncs automatically when users authenticate</span>
        </div>

        <DataTable>
          <thead>
            <tr>
              {['Learner / User', 'Role', 'Method', 'Device / Browser', 'IP Address', 'Time', 'Status'].map(h => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logins.length ? (
              logins.slice(0, 5).map(l => (
                <tr key={l.id}>
                  <td style={td}>
                    <b>{l.name}</b>
                    <div style={{ fontSize: 11, color: '#8A90AB' }}>{l.email}</div>
                  </td>
                  <td style={td}>
                    <Pill text={l.role} tone={l.role === 'admin' ? 'amber' : l.role === 'mentor' ? 'purple' : 'gold'} />
                  </td>
                  <td style={td}>
                    <span style={{ fontSize: 12, color: '#F7EFD8' }}>{l.loginMethod}</span>
                  </td>
                  <td style={td}>
                    <span style={{ fontSize: 12, color: '#8A90AB' }}>{l.device}</span>
                  </td>
                  <td style={td}>
                    <code style={{ fontSize: 11.5, color: '#D4AF37' }}>{l.ipAddress}</code>
                    <div style={{ fontSize: 10.5, color: '#6B7190' }}>{l.location}</div>
                  </td>
                  <td style={td}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#4ADE80' }}>{timeAgo(l.timestamp)}</span>
                    <div style={{ fontSize: 10.5, color: '#8A90AB' }}>{new Date(l.timestamp).toLocaleTimeString()}</div>
                  </td>
                  <td style={td}>
                    <Pill text={l.status} tone="green" />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#8A90AB' }}>
                  No recent logins yet. When users log in on the Starfix website, their live data appears here
                  automatically.
                </td>
              </tr>
            )}
          </tbody>
        </DataTable>
      </div>

      <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#F4D67A', fontFamily: 'Playfair Display, serif' }}>
        Recent Bookings & Sessions
      </h3>
      <DataTable>
        <thead>
          <tr>
            {['Mentor', 'Session', 'Status', 'Scheduled', 'Amount'].map(h => (
              <th key={h} style={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {d.recentBookings.length ? (
            d.recentBookings.map((b: any) => (
              <tr key={b.id}>
                <td style={td}>{b.mentor_name || 'Mentor'}</td>
                <td style={td}>{b.session_type || 'Mentoring session'}</td>
                <td style={td}>
                  <Pill text={b.status || '—'} tone={statusTone(b.status)} />
                </td>
                <td style={td}>{b.scheduled_start ? new Date(b.scheduled_start).toLocaleString() : '—'}</td>
                <td style={td}>₹{Number(b.amount || 0).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} style={{ padding: 28, textAlign: 'center', color: '#8A90AB' }}>
                No bookings yet — new genuine Starfix bookings will appear here automatically.
              </td>
            </tr>
          )}
        </tbody>
      </DataTable>
    </PageShell>
  )
}

export function LiveUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]),
    [logins, setLogins] = useState<UserLoginEvent[]>([]),
    [q, setQ] = useState(''),
    [tab, setTab] = useState<'learners' | 'logins'>('logins'),
    [filter, setFilter] = useState('All'),
    [pathFilter, setPathFilter] = useState('All Growth Paths'),
    [err, setErr] = useState(''),
    [selectedLearner, setSelectedLearner] = useState<AdminUser | null>(null)

  useLive(getAdminUsers, setUsers, setErr, 8000)

  useEffect(() => {
    fetchLiveLogins().then(setLogins)
    const unsub = subscribeToLiveLogins(fresh => {
      setLogins(prev => [fresh, ...prev.filter(x => x.id !== fresh.id)])
    })
    return unsub
  }, [])

  const filteredUsers = useMemo(
    () =>
      users.filter(
        u =>
          (filter === 'All' || u.status === filter) &&
          isLearnerAssociatedWithPath(u, pathFilter) &&
          (u.name + ' ' + u.email + ' ' + u.path + ' ' + (u.category || '')).toLowerCase().includes(q.toLowerCase())
      ),
    [users, q, filter, pathFilter]
  )

  const filteredLogins = useMemo(
    () =>
      logins.filter(
        l =>
          (l.name + ' ' + l.email + ' ' + l.role + ' ' + l.loginMethod + ' ' + l.device + ' ' + l.ipAddress)
            .toLowerCase()
            .includes(q.toLowerCase())
      ),
    [logins, q]
  )

  return (
    <PageShell
      title="User & Login Telemetry"
      subtitle="Real-time login audit stream, student accounts, authentication methods, devices, and live session status."
    >
      {/* Top Telemetry Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <Card style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 11.5, color: '#8A90AB' }}>Real-Time Logins Today</div>
          <div style={{ fontSize: 26, fontFamily: 'Playfair Display, serif', color: '#4ADE80', fontWeight: 700, marginTop: 4 }}>
            {logins.length}
          </div>
          <div style={{ fontSize: 11, color: '#6B7190', marginTop: 4 }}>● Live stream active</div>
        </Card>
        <Card style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 11.5, color: '#8A90AB' }}>Distinct Users</div>
          <div style={{ fontSize: 26, fontFamily: 'Playfair Display, serif', color: '#F4D67A', fontWeight: 700, marginTop: 4 }}>
            {new Set(logins.map(l => l.email.toLowerCase())).size || users.length}
          </div>
          <div style={{ fontSize: 11, color: '#6B7190', marginTop: 4 }}>Across all authentication modes</div>
        </Card>
        <Card style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 11.5, color: '#8A90AB' }}>Latest Login</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#F7EFD8', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {logins[0]?.name || 'Waiting for logins…'}
          </div>
          <div style={{ fontSize: 11, color: '#4ADE80', marginTop: 4 }}>
            {logins[0] ? `${logins[0].loginMethod} · ${timeAgo(logins[0].timestamp)}` : 'No active sessions'}
          </div>
        </Card>
        <Card style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 11.5, color: '#8A90AB' }}>Registered Profiles</div>
          <div style={{ fontSize: 26, fontFamily: 'Playfair Display, serif', color: '#C4B5FD', fontWeight: 700, marginTop: 4 }}>
            {users.length}
          </div>
          <div style={{ fontSize: 11, color: '#6B7190', marginTop: 4 }}>Supabase directory count</div>
        </Card>
      </div>

      {/* View Switcher Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, borderBottom: '1px solid rgba(212,175,55,.16)', paddingBottom: 12 }}>
        <button
          onClick={() => setTab('logins')}
          style={{
            ...btn,
            padding: '9px 18px',
            background: tab === 'logins' ? 'linear-gradient(135deg,#F4D67A,#D4AF37)' : 'rgba(255,255,255,.05)',
            color: tab === 'logins' ? '#0A0E1F' : '#F7EFD8',
            fontWeight: tab === 'logins' ? 700 : 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: tab === 'logins' ? '#0A0E1F' : '#4ADE80',
              boxShadow: '0 0 6px #4ADE80'
            }}
          />
          ⚡ Real-Time User Logins ({logins.length})
        </button>

        <button
          onClick={() => setTab('learners')}
          style={{
            ...btn,
            padding: '9px 18px',
            background: tab === 'learners' ? 'linear-gradient(135deg,#F4D67A,#D4AF37)' : 'rgba(255,255,255,.05)',
            color: tab === 'learners' ? '#0A0E1F' : '#F7EFD8',
            fontWeight: tab === 'learners' ? 700 : 500
          }}
        >
          Learners Directory ({users.length})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search name, email, method, device or IP…"
          style={{ flex: 1, minWidth: 240, maxWidth: 360, height: 40, padding: '0 12px', border: '1px solid rgba(212,175,55,0.22)', borderRadius: 10 }}
        />

        {tab === 'learners' && (
          <>
            <GrowthPathDropdown value={pathFilter} onChange={setPathFilter} label="Filter by Growth Path" width={240} />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {['All', 'Active', 'At risk', 'Inactive'].map(x => (
                <button
                  key={x}
                  onClick={() => setFilter(x)}
                  style={{
                    ...btn,
                    height: 40,
                    background: filter === x ? 'linear-gradient(135deg,#F4D67A,#D4AF37)' : 'rgba(255,255,255,.05)',
                    color: filter === x ? '#0A0E1F' : '#F7EFD8',
                    fontWeight: filter === x ? 600 : 400
                  }}
                >
                  {x}
                </button>
              ))}
            </div>
          </>
        )}

        {(q || filter !== 'All' || pathFilter !== 'All Growth Paths') && (
          <button
            onClick={() => {
              setQ('')
              setFilter('All')
              setPathFilter('All Growth Paths')
            }}
            style={{ ...btn, height: 40, color: '#F4D67A', borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.08)' }}
          >
            ✕ Reset Filters
          </button>
        )}
      </div>

      {err && (
        <Card style={{ padding: 16, color: '#F87171', marginBottom: 16 }}>
          Notice: {err} (Showing live fallback telemetry)
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 1: REAL-TIME USER LOGINS
      ═══════════════════════════════════════════════════════════ */}
      {tab === 'logins' && (
        <DataTable>
          <thead>
            <tr>
              {['User / Learner', 'Role', 'Sign-In Method', 'Device & OS', 'IP / Location', 'Time', 'Session Status'].map(h => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredLogins.length ? (
              filteredLogins.map(l => (
                <tr key={l.id} style={{ transition: 'background 0.15s ease' }}>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg,#F4D67A,#B8901F)',
                          color: '#070913',
                          fontWeight: 700,
                          fontSize: 14,
                          display: 'grid',
                          placeItems: 'center'
                        }}
                      >
                        {l.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <b>{l.name}</b>
                        <div style={{ fontSize: 11, color: '#8A90AB' }}>{l.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={td}>
                    <Pill text={l.role} tone={l.role === 'admin' ? 'amber' : l.role === 'mentor' ? 'purple' : 'gold'} />
                  </td>
                  <td style={td}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#F7EFD8' }}>{l.loginMethod}</span>
                  </td>
                  <td style={td}>
                    <span style={{ fontSize: 12.5, color: '#8A90AB' }}>{l.device}</span>
                  </td>
                  <td style={td}>
                    <code style={{ fontSize: 11.5, color: '#D4AF37' }}>{l.ipAddress}</code>
                    <div style={{ fontSize: 11, color: '#6B7190' }}>{l.location}</div>
                  </td>
                  <td style={td}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#4ADE80' }}>{timeAgo(l.timestamp)}</span>
                    <div style={{ fontSize: 11, color: '#8A90AB' }}>{new Date(l.timestamp).toLocaleTimeString()}</div>
                  </td>
                  <td style={td}>
                    <Pill text={l.status} tone="green" />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: 36, textAlign: 'center', color: '#8A90AB' }}>
                  No live logins match your search query. When a student or mentor signs in on the Starfix website, their
                  session record appears here in real-time.
                </td>
              </tr>
            )}
          </tbody>
        </DataTable>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2: LEARNERS DIRECTORY
      ═══════════════════════════════════════════════════════════ */}
      {tab === 'learners' && (
        <DataTable>
          <thead>
            <tr>
              {['Learner', 'Goal', 'Active Path', 'Progress', 'Streak', 'XP', 'Last Active / Login', 'Action'].map(h => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length ? (
              filteredUsers.map(u => (
                <tr
                  key={u.id}
                  onClick={() => setSelectedLearner(u)}
                  style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,175,55,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={td}>
                    <b>{u.name}</b>
                    <div style={{ fontSize: 11, color: '#8A90AB' }}>{u.email}</div>
                  </td>
                  <td style={td}>{u.goal || '—'}</td>
                  <td style={td}>
                    <Pill text={u.path} tone="gold" />
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 70, height: 5, borderRadius: 9, background: 'rgba(255,255,255,.08)' }}>
                        <div
                          style={{
                            width: u.progress + '%',
                            height: '100%',
                            borderRadius: 9,
                            background: 'linear-gradient(90deg,#B8901F,#F4D67A)'
                          }}
                        />
                      </div>
                      {u.progress}%
                    </div>
                  </td>
                  <td style={td}>{u.streak} 🔥</td>
                  <td style={td}>{u.xp.toLocaleString()}</td>
                  <td style={td}>
                    <span style={{ fontSize: 12, color: '#4ADE80', fontWeight: 600 }}>{timeAgo(u.lastActive || '')}</span>
                    {u.lastLoginMethod && <div style={{ fontSize: 10.5, color: '#8A90AB' }}>via {u.lastLoginMethod}</div>}
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setSelectedLearner(u)
                      }}
                      style={{
                        ...btn,
                        padding: '5px 10px',
                        fontSize: 11.5,
                        color: '#F4D67A',
                        borderColor: 'rgba(212,175,55,0.3)',
                        background: 'rgba(212,175,55,0.08)'
                      }}
                    >
                      Deep Profile ↗
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ padding: 28, textAlign: 'center', color: '#8A90AB' }}>
                  No learners match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </DataTable>
      )}

      {selectedLearner && (
        <LearnerDetailDrawer
          learnerId={selectedLearner.id}
          initialUser={selectedLearner}
          onClose={() => setSelectedLearner(null)}
          onUpdate={() => getAdminUsers().then(setUsers)}
        />
      )}
    </PageShell>
  )
}

export function LiveMentors() {
  const [rows, setRows] = useState<AdminMentor[]>([]),
    [q, setQ] = useState(''),
    [pathFilter, setPathFilter] = useState('All Growth Paths'),
    [err, setErr] = useState(''),
    [selectedMentorId, setSelectedMentorId] = useState<string | null>(null)

  useEffect(() => {
    getAdminMentors().then(setRows).catch(e => setErr(e.message))
  }, [])

  const filtered = rows.filter(
    m =>
      isMentorAssociatedWithPath(m, pathFilter) &&
      (m.name + ' ' + (m.email || '') + ' ' + (m.company || '') + ' ' + (m.category || ''))
        .toLowerCase()
        .includes(q.toLowerCase())
  )

  return (
    <PageShell
      title="Mentors Directory"
      subtitle="Live mentor records from Supabase. Click any row or Deep Profile button to open full admin drawer."
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search mentors…"
          style={{ width: 280, height: 40, padding: '0 12px', border: '1px solid rgba(212,175,55,0.22)', borderRadius: 10 }}
        />
        <GrowthPathDropdown value={pathFilter} onChange={setPathFilter} label="Filter by Growth Path" width={260} />
        {(pathFilter !== 'All Growth Paths' || q) && (
          <button
            onClick={() => {
              setPathFilter('All Growth Paths')
              setQ('')
            }}
            style={{ ...btn, height: 40, color: '#F4D67A', borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.08)' }}
          >
            ✕ Reset Filter
          </button>
        )}
      </div>

      {err ? (
        <Card style={{ padding: 20, color: '#F87171' }}>{err}</Card>
      ) : (
        <DataTable>
          <thead>
            <tr>
              {['Mentor', 'Role / Company', 'Category', 'Rating', 'Live mentees', 'Reviews', 'Live sessions', 'Status', 'Action'].map(
                h => (
                  <th key={h} style={th}>
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr
                key={m.id}
                onClick={() => setSelectedMentorId(m.id)}
                style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,175,55,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={td}>
                  <b>{m.name}</b>
                  <div style={{ fontSize: 11, color: '#8A90AB' }}>{m.email || 'Verified Catalog Mentor'}</div>
                </td>
                <td style={td}>
                  {m.headline || '—'}
                  {m.company ? ' · ' + m.company : ''}
                </td>
                <td style={td}>
                  <Pill text={m.category || '—'} tone="gold" />
                </td>
                <td style={td}>
                  {m.verifiedReviewRating !== null ? '★ ' + m.verifiedReviewRating.toFixed(1) : '—'}
                  <div style={{ fontSize: 10, color: '#8A90AB' }}>
                    {m.verifiedReviewRating !== null ? 'verified' : 'no reviews yet'}
                  </div>
                </td>
                <td style={td}>{m.activeMentees}</td>
                <td style={td}>{m.reviewCount}</td>
                <td style={td}>
                  {m.completedSessions}/{m.totalBookings}
                </td>
                <td style={td}>
                  <Pill
                    text={m.performanceBand}
                    tone={
                      m.performanceBand === 'Strong live signals'
                        ? 'green'
                        : m.performanceBand === 'Established'
                        ? 'gold'
                        : m.performanceBand === 'Developing'
                        ? 'amber'
                        : 'gray'
                    }
                  />
                  <div style={{ fontSize: 10, color: '#8A90AB', marginTop: 4 }}>{m.mentorStatus}</div>
                </td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setSelectedMentorId(m.id)
                    }}
                    style={{
                      ...btn,
                      padding: '5px 10px',
                      fontSize: 11.5,
                      color: '#F4D67A',
                      borderColor: 'rgba(212,175,55,0.3)',
                      background: 'rgba(212,175,55,0.08)'
                    }}
                  >
                    Deep Profile ↗
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}

      {selectedMentorId && (
        <MentorDetailDrawer
          mentorId={selectedMentorId}
          onClose={() => setSelectedMentorId(null)}
          onUpdate={() => getAdminMentors().then(setRows)}
        />
      )}
    </PageShell>
  )
}

export function LivePaths() {
  const [rows, setRows] = useState<any[]>([]),
    [err, setErr] = useState('')

  useEffect(() => {
    getAdminPaths().then(setRows).catch(e => setErr(e.message))
  }, [])

  return (
    <PageShell title="Growth Paths" subtitle="Live paths, milestones and learner progress.">
      <DataTable>
        {err ? (
          <tbody>
            <tr>
              <td style={{ padding: 20, color: '#F87171' }}>{err}</td>
            </tr>
          </tbody>
        ) : (
          <>
            <thead>
              <tr>
                {['Path', 'Category', 'Level', 'Milestones', 'Learners', 'Avg Progress', 'Rating'].map(h => (
                  <th key={h} style={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(p => (
                <tr key={p.id}>
                  <td style={td}>
                    <b>{p.title}</b>
                    <div style={{ fontSize: 11, color: '#8A90AB' }}>{p.slug}</div>
                  </td>
                  <td style={td}>
                    <Pill text={p.category || '—'} tone="gold" />
                  </td>
                  <td style={td}>{p.level || '—'}</td>
                  <td style={td}>{p.milestoneCount}</td>
                  <td style={td}>{p.liveLearners}</td>
                  <td style={td}>{p.completion}%</td>
                  <td style={td}>★ {Number(p.rating || 5.0).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </>
        )}
      </DataTable>
    </PageShell>
  )
}

export function LiveBookings() {
  const [rows, setRows] = useState<any[]>([]),
    [q, setQ] = useState(''),
    [pathFilter, setPathFilter] = useState('All Growth Paths'),
    [err, setErr] = useState(''),
    [drawerLearnerId, setDrawerLearnerId] = useState<string | null>(null),
    [drawerMentorId, setDrawerMentorId] = useState<string | null>(null)

  useLive(getBookingsNamed, setRows, setErr)

  const filtered = useMemo(
    () =>
      rows.filter(
        b =>
          isBookingAssociatedWithPath(b, pathFilter) &&
          ((b.student_name || '') + ' ' + b.mentor_name + ' ' + b.status + ' ' + b.session_type + ' ' + b.booking_date)
            .toLowerCase()
            .includes(q.toLowerCase())
      ),
    [rows, q, pathFilter]
  )

  return (
    <PageShell
      title="Sessions & Bookings"
      subtitle="Every real Starfix mentor booking from Supabase. Click any learner or mentor name to view full profile details."
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search mentor, status, session…"
          style={{ flex: 1, minWidth: 240, maxWidth: 360, height: 40, padding: '0 12px', border: '1px solid rgba(212,175,55,0.22)', borderRadius: 10 }}
        />
        <GrowthPathDropdown value={pathFilter} onChange={setPathFilter} label="Filter by Growth Path" width={260} />
        {(pathFilter !== 'All Growth Paths' || q) && (
          <button
            onClick={() => {
              setPathFilter('All Growth Paths')
              setQ('')
            }}
            style={{ ...btn, height: 40, color: '#F4D67A', borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.08)' }}
          >
            ✕ Reset Filters
          </button>
        )}
      </div>

      {err ? (
        <Card style={{ padding: 20, color: '#F87171' }}>{err}</Card>
      ) : (
        <DataTable>
          <thead>
            <tr>
              {['Learner', 'Mentor', 'Session', 'Date / Time', 'Status', 'Amount', 'Notes'].map(h => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map(b => (
                <tr key={b.id}>
                  <td style={td}>
                    <button
                      type="button"
                      onClick={() => b.student_id && setDrawerLearnerId(b.student_id)}
                      style={{
                        border: 0,
                        padding: 0,
                        background: 'transparent',
                        cursor: b.student_id ? 'pointer' : 'default',
                        color: '#F7EFD8',
                        fontWeight: 600,
                        textAlign: 'left',
                        textDecoration: b.student_id ? 'underline' : 'none',
                        textDecorationColor: 'rgba(212,175,55,0.35)'
                      }}
                      title="Open learner profile"
                    >
                      <b>{b.student_name || (b.student_id ? 'Learner ' + b.student_id.slice(0, 6) : '—')}</b>
                    </button>
                  </td>
                  <td style={td}>
                    <button
                      type="button"
                      onClick={() => b.mentor_id && setDrawerMentorId(b.mentor_id)}
                      style={{
                        border: 0,
                        padding: 0,
                        background: 'transparent',
                        cursor: b.mentor_id ? 'pointer' : 'default',
                        color: '#F4D67A',
                        fontWeight: 600,
                        textAlign: 'left',
                        textDecoration: b.mentor_id ? 'underline' : 'none',
                        textDecorationColor: 'rgba(212,175,55,0.35)'
                      }}
                      title="Open mentor profile"
                    >
                      <b>{b.mentor_name || '—'}</b>
                    </button>
                    <div style={{ fontSize: 11, color: '#8A90AB' }}>{b.mentor_company || ''}</div>
                  </td>
                  <td style={td}>
                    {b.session_type || '—'}
                    <div style={{ fontSize: 11, color: '#8A90AB' }}>{b.duration || ''}</div>
                  </td>
                  <td style={td}>{b.scheduled_start ? new Date(b.scheduled_start).toLocaleString() : b.booking_date || '—'}</td>
                  <td style={td}>
                    <Pill text={b.status || '—'} tone={statusTone(b.status)} />
                  </td>
                  <td style={td}>₹{Number(b.amount || 0).toLocaleString()}</td>
                  <td style={td}>{b.notes || '—'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: 28, textAlign: 'center', color: '#8A90AB' }}>
                  No bookings match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </DataTable>
      )}

      {drawerLearnerId && <LearnerDetailDrawer learnerId={drawerLearnerId} onClose={() => setDrawerLearnerId(null)} />}
      {drawerMentorId && <MentorDetailDrawer mentorId={drawerMentorId} onClose={() => setDrawerMentorId(null)} />}
    </PageShell>
  )
}

export function LiveExplore() {
  const [rows, setRows] = useState<any[]>([]),
    [q, setQ] = useState('')
  useLive(getAdminExplore, setRows)
  const filtered = rows.filter(x => (x.title + ' ' + x.category + ' ' + x.content_type).toLowerCase().includes(q.toLowerCase()))
  return (
    <PageShell title="Explore Content" subtitle="Real Explore resources currently stored in Starfix.">
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search content…"
        style={{ width: 320, padding: 10, border: '1px solid rgba(212,175,55,0.22)', borderRadius: 8, marginBottom: 16 }}
      />
      <DataTable>
        <thead>
          <tr>
            {['Title', 'Category', 'Type', 'Metric', 'Active', 'Created'].map(h => (
              <th key={h} style={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(x => (
            <tr key={x.id}>
              <td style={td}>
                <b>{x.title}</b>
                <div style={{ fontSize: 11, color: '#8A90AB' }}>{x.description || ''}</div>
              </td>
              <td style={td}>{x.category}</td>
              <td style={td}>{x.content_type}</td>
              <td style={td}>{x.metric_value || '—'}</td>
              <td style={td}>
                <Pill text={x.active ? 'Active' : 'Hidden'} tone={x.active ? 'green' : 'gray'} />
              </td>
              <td style={td}>{x.created_at ? new Date(x.created_at).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </PageShell>
  )
}

export function LiveMessages() {
  const [rows, setRows] = useState<any[]>([]),
    [drawerLearnerId, setDrawerLearnerId] = useState<string | null>(null),
    [drawerMentorId, setDrawerMentorId] = useState<string | null>(null)
  useLive(getConversationsNamed, setRows)
  return (
    <PageShell
      title="Mentor Conversations"
      subtitle="Operational view of real mentor-student conversations and recent messages. Click student or mentor to inspect profile."
    >
      <DataTable>
        <thead>
          <tr>
            {['Conversation', 'Learner', 'Mentor', 'Messages', 'Last activity', 'Archived'].map(h => (
              <th key={h} style={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map(c => (
              <tr key={c.id}>
                <td style={td}>{c.id.slice(0, 8)}…</td>
                <td style={td}>
                  <button
                    type="button"
                    onClick={() => c.student_id && setDrawerLearnerId(c.student_id)}
                    style={{
                      border: 0,
                      padding: 0,
                      background: 'transparent',
                      cursor: c.student_id ? 'pointer' : 'default',
                      color: '#F7EFD8',
                      fontWeight: 600,
                      textAlign: 'left',
                      textDecoration: c.student_id ? 'underline' : 'none',
                      textDecorationColor: 'rgba(212,175,55,0.35)'
                    }}
                    title="Open learner profile"
                  >
                    <b>{c.student_name || (c.student_id ? 'Learner ' + c.student_id.slice(0, 6) : '—')}</b>
                  </button>
                </td>
                <td style={td}>
                  <button
                    type="button"
                    onClick={() => c.mentor_id && setDrawerMentorId(c.mentor_id)}
                    style={{
                      border: 0,
                      padding: 0,
                      background: 'transparent',
                      cursor: c.mentor_id ? 'pointer' : 'default',
                      color: '#F4D67A',
                      fontWeight: 600,
                      textAlign: 'left',
                      textDecoration: c.mentor_id ? 'underline' : 'none',
                      textDecorationColor: 'rgba(212,175,55,0.35)'
                    }}
                    title="Open mentor profile"
                  >
                    <b>{c.mentor_name || (c.mentor_id ? 'Mentor ' + c.mentor_id.slice(0, 6) : '—')}</b>
                  </button>
                </td>
                <td style={td}>
                  {c.messages?.length || 0}
                  <div style={{ fontSize: 11, color: '#8A90AB' }}>{c.messages?.[0]?.body?.slice(0, 50) || 'No messages'}</div>
                </td>
                <td style={td}>
                  {c.messages?.[0]?.created_at
                    ? new Date(c.messages[0].created_at).toLocaleString()
                    : new Date(c.created_at).toLocaleString()}
                </td>
                <td style={td}>{c.archived ? 'Yes' : 'No'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} style={{ padding: 28, textAlign: 'center', color: '#8A90AB' }}>
                No conversations yet.
              </td>
            </tr>
          )}
        </tbody>
      </DataTable>
      {drawerLearnerId && <LearnerDetailDrawer learnerId={drawerLearnerId} onClose={() => setDrawerLearnerId(null)} />}
      {drawerMentorId && <MentorDetailDrawer mentorId={drawerMentorId} onClose={() => setDrawerMentorId(null)} />}
    </PageShell>
  )
}

export function LiveAnalytics() {
  const [d, setD] = useState<any>(null),
    [tab, setTab] = useState<'kpis' | 'geography' | 'activity'>('kpis')
  useLive(getAdminAnalytics, setD)
  if (!d)
    return (
      <PageShell title="Analytics" subtitle="Live Starfix metrics.">
        <Card>Loading live analytics…</Card>
      </PageShell>
    )
  return (
    <PageShell
      title="Analytics & Intelligence"
      subtitle="Calculated directly from current Starfix database records with geographical and user retention telemetry."
    >
      <div style={{ display: 'flex', gap: 6, marginBottom: 22, borderBottom: '1px solid rgba(212,175,55,0.16)', paddingBottom: 12 }}>
        {[
          { id: 'kpis', label: '✦ Executive Summary' },
          { id: 'geography', label: '🌍 User Geography' },
          { id: 'activity', label: '⚡ User Activity & Retention' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            style={{
              ...btn,
              padding: '8px 16px',
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? '#070A1A' : '#9AA0BA',
              background: tab === t.id ? 'linear-gradient(135deg, #F4D67A, #D4AF37)' : 'rgba(255,255,255,0.04)',
              borderColor: tab === t.id ? 'transparent' : 'rgba(212,175,55,0.18)'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'geography' && <GeographyAnalyticsView />}
      {tab === 'activity' && <UserActivityView />}
      {tab === 'kpis' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[
            ['Students', d.students, 'Registered student profiles'],
            ['Registered mentors', d.mentors, d.mentorListings + ' total mentor listings'],
            ['Active mentees', d.activeMentees, 'Confirmed or completed mentor relationships'],
            ['Active 7d', d.active7, 'Learners with recent activity'],
            ['Progress', d.avgProgress + '%', 'Average progress'],
            ['Completed', d.completed, 'Completed progress records'],
            ['Total XP', d.totalXp.toLocaleString(), 'Across progress records'],
            ['Bookings', d.bookings, d.confirmed + ' confirmed/completed'],
            ['Revenue', '₹' + d.revenue.toLocaleString(), 'Booking amount total'],
            ['Reviews', d.reviews, 'Average ' + d.avgRating + '★'],
            ['Saved Items', d.saved, 'Learner saved resources'],
            ['Notifications', d.notifications, 'Notifications generated'],
            ['Admins', d.admins, 'Admin profiles']
          ].map(([a, b, c]) => (
            <Stat key={String(a)} label={String(a)} value={b as any} detail={String(c)} />
          ))}
        </div>
      )}
    </PageShell>
  )
}

export function AdminHeader({ onMenu }: { profile?: any; onMenu?: () => void }) {
  return (
    <div
      className="sx-header"
      style={{
        height: 56,
        borderBottom: '1px solid rgba(212,175,55,.14)',
        background: 'rgba(7,10,26,.85)',
        backdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 20
      }}
    >
      <button className="sx-burger" aria-label="Open menu" onClick={onMenu}>
        ☰
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'Playfair Display,serif', color: '#F4D67A', fontWeight: 600, fontSize: 16 }}>Starfix</span>
        <span style={{ fontSize: 11, color: '#8A90AB' }}>Operations</span>
      </div>
    </div>
  )
}
