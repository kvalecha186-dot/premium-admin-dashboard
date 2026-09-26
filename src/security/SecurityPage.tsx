import React, { useState } from 'react'
import { Icon, icons, Card, PageShell } from '../shared'

// ── Security & Access — admin login history, active sessions, 2FA coverage ──
// Read-mostly visibility page. Policy toggles (2FA requirement, session
// timeout, admin invites) remain in Settings → Security; this page is the
// operational view: who is logged in right now, who logged in recently, and
// which admins still don't have 2FA enabled.

interface ActiveSession {
  name: string
  email: string
  avatar: string
  device: string
  location: string
  ip: string
  startedAt: string
  lastActive: string
  current?: boolean
}

interface LoginEvent {
  name: string
  avatar: string
  event: 'Login Success' | 'Login Failed' | 'Password Changed' | '2FA Enabled' | 'New Device Detected'
  ip: string
  location: string
  device: string
  time: string
}

interface AdminTwoFA {
  name: string
  email: string
  avatar: string
  role: string
  twoFactorEnabled: boolean
}

const ACTIVE_SESSIONS: ActiveSession[] = [
  { name: 'Marcus Webb', email: 'marcus@starfix.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces', device: 'Chrome · macOS', location: 'Ludhiana, IN', ip: '103.21.244.18', startedAt: 'Today, 9:02 AM', lastActive: 'Just now', current: true },
  { name: 'Elena Rostova', email: 'elena@starfix.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces', device: 'Safari · iOS', location: 'Mumbai, IN', ip: '49.36.88.201', startedAt: 'Today, 8:14 AM', lastActive: '6 minutes ago' },
  { name: 'David Miller', email: 'david@starfix.com', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces', device: 'Edge · Windows', location: 'Singapore, SG', ip: '175.41.9.63', startedAt: 'Yesterday, 6:47 PM', lastActive: '3 hours ago' },
]

const LOGIN_EVENTS: LoginEvent[] = [
  { name: 'Marcus Webb', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces', event: 'Login Success', ip: '103.21.244.18', location: 'Ludhiana, IN', device: 'Chrome · macOS', time: 'Today, 9:02 AM' },
  { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces', event: 'Login Success', ip: '49.36.88.201', location: 'Mumbai, IN', device: 'Safari · iOS', time: 'Today, 8:14 AM' },
  { name: 'Unknown', avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=80&h=80&fit=crop&crop=faces', event: 'Login Failed', ip: '188.114.97.3', location: 'Lagos, NG', device: 'Firefox · Linux', time: 'Today, 4:51 AM' },
  { name: 'David Miller', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces', event: 'New Device Detected', ip: '175.41.9.63', location: 'Singapore, SG', device: 'Edge · Windows', time: 'Yesterday, 6:47 PM' },
  { name: 'David Miller', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces', event: '2FA Enabled', ip: '175.41.9.63', location: 'Singapore, SG', device: 'Edge · Windows', time: '2 days ago' },
  { name: 'Marcus Webb', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces', event: 'Password Changed', ip: '103.21.244.18', location: 'Ludhiana, IN', device: 'Chrome · macOS', time: '5 days ago' },
  { name: 'Unknown', avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=80&h=80&fit=crop&crop=faces', event: 'Login Failed', ip: '91.203.5.44', location: 'Kyiv, UA', device: 'Chrome · Windows', time: '6 days ago' },
]

const ADMIN_2FA: AdminTwoFA[] = [
  { name: 'Marcus Webb', email: 'marcus@starfix.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces', role: 'Owner', twoFactorEnabled: true },
  { name: 'Elena Rostova', email: 'elena@starfix.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces', role: 'Admin', twoFactorEnabled: true },
  { name: 'David Miller', email: 'david@starfix.com', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces', role: 'Billing Admin', twoFactorEnabled: false },
]

const eventTone = (event: LoginEvent['event']) => {
  switch (event) {
    case 'Login Success': return { color: '#166534', bg: '#F0FDF4', icon: icons.check }
    case 'Login Failed': return { color: '#B91C1C', bg: '#FEF2F2', icon: icons.x }
    case 'New Device Detected': return { color: '#92400E', bg: '#FFFBEB', icon: icons.alert }
    case '2FA Enabled': return { color: '#166534', bg: '#F0FDF4', icon: icons.shieldCheck }
    case 'Password Changed': return { color: '#1D4ED8', bg: '#EFF6FF', icon: icons.edit }
    default: return { color: '#737373', bg: '#FAF8F4', icon: icons.activity }
  }
}

export default function SecurityPage() {
  const [sessions, setSessions] = useState(ACTIVE_SESSIONS)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const revokeSession = (email: string) => {
    setSessions(prev => prev.filter(s => s.email !== email))
    showToast(`Session revoked for ${email}`)
  }

  const twoFAEnabledCount = ADMIN_2FA.filter(a => a.twoFactorEnabled).length
  const twoFACoveragePct = Math.round((twoFAEnabledCount / ADMIN_2FA.length) * 100)
  const failedAttempts7d = LOGIN_EVENTS.filter(e => e.event === 'Login Failed').length

  return (
    <PageShell
      title="Security & Access"
      subtitle="Live visibility into admin sessions, login activity, and two-factor authentication coverage across Starfix Operations."
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          background: '#171717',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 500,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          border: '1px solid rgba(200, 155, 31, 0.3)'
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C89B1F' }} />
          {toastMessage}
        </div>
      )}

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F7F2E7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={icons.activity} size={16} style={{ color: '#C89B1F' }} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Sessions
            </div>
          </div>
          <div style={{ fontSize: 24, fontFamily: 'Playfair Display, serif', fontWeight: 600, color: '#171717' }}>{sessions.length}</div>
        </Card>

        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={icons.shieldCheck} size={16} style={{ color: '#166534' }} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              2FA Coverage
            </div>
          </div>
          <div style={{ fontSize: 24, fontFamily: 'Playfair Display, serif', fontWeight: 600, color: twoFACoveragePct === 100 ? '#166534' : '#171717' }}>
            {twoFACoveragePct}%
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={icons.alert} size={16} style={{ color: '#B91C1C' }} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Failed Logins (7d)
            </div>
          </div>
          <div style={{ fontSize: 24, fontFamily: 'Playfair Display, serif', fontWeight: 600, color: failedAttempts7d > 0 ? '#B91C1C' : '#171717' }}>
            {failedAttempts7d}
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F7F2E7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={icons.clock} size={16} style={{ color: '#C89B1F' }} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Last Incident
            </div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#171717', marginTop: 4 }}>6 days ago</div>
          <div style={{ fontSize: 11, color: '#8E8E93', marginTop: 2 }}>Failed login · Kyiv, UA</div>
        </Card>
      </div>

      {/* Active Sessions */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, color: '#171717' }}>
              Active Admin Sessions
            </div>
            <div style={{ fontSize: 12.5, color: '#737373', marginTop: 2 }}>
              Everyone currently signed in to the Starfix admin panel
            </div>
          </div>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ECE7DF', background: '#FAF8F4' }}>
                {['Admin', 'Device', 'Location / IP', 'Signed In', 'Last Active', ''].map(h => (
                  <th key={h} style={{ padding: '12px 20px', fontSize: 11, fontWeight: 600, color: '#8E8E93', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={s.email} style={{ borderBottom: i < sessions.length - 1 ? '1px solid #ECE7DF' : 'none' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={s.avatar} alt={s.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#171717' }}>{s.name}</span>
                          {s.current && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: '#C89B1F', background: '#F7F2E7', padding: '1px 7px', borderRadius: 99 }}>
                              This device
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#8E8E93' }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#525252' }}>{s.device}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontSize: 13, color: '#171717' }}>{s.location}</div>
                    <div style={{ fontSize: 11, color: '#8E8E93' }}>{s.ip}</div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 12.5, color: '#737373' }}>{s.startedAt}</td>
                  <td style={{ padding: '14px 20px', fontSize: 12.5, color: '#171717', fontWeight: 500 }}>{s.lastActive}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    {!s.current && (
                      <button
                        onClick={() => revokeSession(s.email)}
                        style={{
                          fontSize: 11.5, fontWeight: 600, color: '#B91C1C', background: '#FEF2F2',
                          border: '1px solid #FCA5A5', padding: '6px 12px', borderRadius: 8, cursor: 'pointer'
                        }}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: '#8E8E93' }}>
                    No active sessions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Two-Factor Authentication Status */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, color: '#171717' }}>
            Two-Factor Authentication Status
          </div>
          <div style={{ fontSize: 12.5, color: '#737373', marginTop: 2 }}>
            Per-admin 2FA enrollment · policy-level enforcement lives in Settings → Security
          </div>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ECE7DF', background: '#FAF8F4' }}>
                {['Admin', 'Role', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', fontSize: 11, fontWeight: 600, color: '#8E8E93', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ADMIN_2FA.map((a, i) => (
                <tr key={a.email} style={{ borderBottom: i < ADMIN_2FA.length - 1 ? '1px solid #ECE7DF' : 'none' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={a.avatar} alt={a.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#171717' }}>{a.name}</div>
                        <div style={{ fontSize: 11.5, color: '#8E8E93' }}>{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#171717', background: '#FFFFFF', border: '1px solid #ECE7DF', padding: '3px 10px', borderRadius: 99 }}>
                      {a.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {a.twoFactorEnabled ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#166534', background: '#F0FDF4', padding: '4px 10px', borderRadius: 99 }}>
                        <Icon d={icons.shieldCheck} size={12} />
                        2FA Enabled
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#92400E', background: '#FFFBEB', padding: '4px 10px', borderRadius: 99 }}>
                        <Icon d={icons.alert} size={12} />
                        Not Enabled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Recent Login Activity */}
      <div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, color: '#171717' }}>
            Recent Login Activity
          </div>
          <div style={{ fontSize: 12.5, color: '#737373', marginTop: 2 }}>
            Successful logins, failed attempts, and account security events across all admins
          </div>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ECE7DF', background: '#FAF8F4' }}>
                {['Admin', 'Event', 'Device', 'Location / IP', 'Time'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', fontSize: 11, fontWeight: 600, color: '#8E8E93', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LOGIN_EVENTS.map((e, i) => {
                const tone = eventTone(e.event)
                return (
                  <tr key={i} style={{ borderBottom: i < LOGIN_EVENTS.length - 1 ? '1px solid #ECE7DF' : 'none' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={e.avatar} alt={e.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#171717' }}>{e.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: tone.color, background: tone.bg, padding: '4px 10px', borderRadius: 99 }}>
                        <Icon d={tone.icon} size={12} />
                        {e.event}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#525252' }}>{e.device}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ color: '#171717' }}>{e.location}</div>
                      <div style={{ fontSize: 11, color: '#8E8E93' }}>{e.ip}</div>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#737373', fontSize: 12.5 }}>{e.time}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </PageShell>
  )
}
