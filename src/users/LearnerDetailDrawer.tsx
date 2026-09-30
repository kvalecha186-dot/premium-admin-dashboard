import React, { useState, useEffect } from 'react'
import { Card } from '../shared'
import { getAdminLearnerDetail, updateAdminProfile } from '../adminBackend'
import { getDeviceAccessInfo, buildLearnerTimeline, ActivityEvent } from '../lib/userIntelligence'

interface LearnerDetailDrawerProps {
  learnerId: string | null
  initialUser?: any
  onClose: () => void
  onUpdate?: () => void
}

export function LearnerDetailDrawer({ learnerId, initialUser, onClose, onUpdate }: LearnerDetailDrawerProps) {
  const [tab, setTab] = useState<'overview' | 'learning' | 'progress' | 'sessions' | 'activity' | 'access'>('overview')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<any>(null)
  const [error, setError] = useState('')
  const [statusState, setStatusState] = useState<string>(initialUser?.status || 'Active')
  const [actionConfirm, setActionConfirm] = useState<{ action: string; title: string; desc: string; onConfirm: () => Promise<void> } | null>(null)
  const [actionBusy, setActionBusy] = useState(false)

  useEffect(() => {
    if (!learnerId) return
    setLoading(true)
    setError('')
    getAdminLearnerDetail(learnerId)
      .then(res => {
        setDetail(res)
        setStatusState(initialUser?.status || 'Active')
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [learnerId, initialUser])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  if (!learnerId) return null

  const profile = detail?.profile || {}
  const progressList = detail?.progress || []
  const milestoneProgress = detail?.milestoneProgress || []
  const bookings = detail?.bookings || []
  const reviews = detail?.reviews || []
  const xpTransactions = detail?.xpTransactions || []
  const savedItems = detail?.savedItems || []

  // Combine initialUser attributes with fetched details
  const name = initialUser?.name || profile.full_name || 'Learner'
  const email = initialUser?.email || profile.email || 'No email'
  const activePath = initialUser?.path || progressList[0]?.growth_paths?.title || 'Not enrolled'
  const category = initialUser?.category || progressList[0]?.growth_paths?.category || '—'
  const streak = initialUser?.streak || progressList[0]?.streak || 0
  const xp = initialUser?.xp || progressList[0]?.xp || 0
  const overallProgress = initialUser?.progress || progressList[0]?.overall_progress || 0
  const careerGoal = initialUser?.goal || profile.career_goal || profile.goal_title || 'Software & Professional Career'
  const skillLevel = profile.level || initialUser?.level || 'Intermediate'

  const deviceAccess = getDeviceAccessInfo(learnerId, initialUser?.lastActive, profile.country || initialUser?.country, null)
  const timeline: ActivityEvent[] = buildLearnerTimeline({ ...initialUser, ...profile, path: activePath, category, xp, streak, progress: overallProgress }, detail)

  const completedSessions = bookings.filter((b: any) => String(b.status || '').toLowerCase() === 'completed').length
  const upcomingSessions = bookings.filter((b: any) => ['confirmed', 'scheduled', 'pending'].includes(String(b.status || '').toLowerCase())).length

  // Completion calculation
  const profileFields = [name, email, careerGoal, activePath !== 'Not enrolled', streak > 0, xp > 0]
  const profileCompletionPct = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100)

  const handleStatusToggle = () => {
    const next = statusState === 'Inactive' ? 'Active' : 'Inactive'
    setActionConfirm({
      action: 'status',
      title: next === 'Inactive' ? 'Mark Learner Inactive?' : 'Reactivate Learner Account?',
      desc: next === 'Inactive'
        ? `This will flag ${name}'s account status as Inactive on the admin directory.`
        : `This will restore ${name}'s account status to Active.`,
      onConfirm: async () => {
        setActionBusy(true)
        try {
          await updateAdminProfile(learnerId, { role: 'student' })
          setStatusState(next)
          onUpdate?.()
        } finally {
          setActionBusy(false)
          setActionConfirm(null)
        }
      }
    })
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(3, 5, 15, 0.78)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 200ms ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 820,
          maxWidth: '92vw',
          height: '100vh',
          background: 'linear-gradient(180deg, #090F2C 0%, #050818 100%)',
          borderLeft: '1px solid rgba(212,175,55,0.28)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.85), 0 0 40px rgba(212,175,55,0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div
          style={{
            padding: '24px 28px 18px',
            borderBottom: '1px solid rgba(212,175,55,0.18)',
            background: 'rgba(8,13,36,0.92)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          {/* Breadcrumb & Close */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#8A90AB' }}>
              <span style={{ cursor: 'pointer', color: '#D4AF37' }} onClick={onClose}>
                Learners Directory
              </span>
              <span>/</span>
              <span style={{ color: '#F7EFD8', fontWeight: 500 }}>{name}</span>
              <span>/</span>
              <span style={{ color: '#8A90AB' }}>Deep Learner Intelligence</span>
            </div>

            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(212,175,55,0.22)',
                color: '#F4D67A',
                fontSize: 14,
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center'
              }}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>

          {/* Identity Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F4D67A, #B8901F)',
                  color: '#0A0E1F',
                  fontFamily: 'Playfair Display,serif',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 24,
                  fontWeight: 700,
                  boxShadow: '0 0 20px rgba(212,175,55,0.25)',
                  flexShrink: 0
                }}
              >
                {name.charAt(0).toUpperCase()}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontFamily: 'Playfair Display,serif', fontSize: 24, fontWeight: 600, color: '#F7EFD8' }}>
                    {name}
                  </h2>
                  <span
                    style={{
                      padding: '3px 9px',
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 600,
                      background: statusState === 'Active' ? 'rgba(74,222,128,0.14)' : 'rgba(248,113,113,0.14)',
                      color: statusState === 'Active' ? '#4ADE80' : '#F87171',
                      border: `1px solid ${statusState === 'Active' ? 'rgba(74,222,128,0.35)' : 'rgba(248,113,113,0.35)'}`
                    }}
                  >
                    ● {statusState}
                  </span>
                  <span
                    style={{
                      padding: '3px 9px',
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 600,
                      background: 'rgba(212,175,55,0.14)',
                      color: '#F4D67A',
                      border: '1px solid rgba(212,175,55,0.35)'
                    }}
                  >
                    Level: {skillLevel}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: '#9AA0BA', marginTop: 4 }}>
                  {careerGoal} · <span style={{ color: '#D4AF37' }}>{activePath}</span>
                </div>

                <div style={{ fontSize: 12, color: '#8A90AB', marginTop: 4, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>📍 {deviceAccess.approximateLocation}</span>
                  <span>🔥 {streak} Day Streak</span>
                  <span>⚡ {xp.toLocaleString()} XP</span>
                  <span>ID: <code style={{ color: '#D4AF37', fontSize: 11 }}>{(learnerId || '').slice(0, 8)}…</code></span>
                </div>
              </div>
            </div>

            {/* Admin Action */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleStatusToggle}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: statusState === 'Inactive' ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(248,113,113,0.4)',
                  background: 'rgba(255,255,255,0.05)',
                  color: statusState === 'Inactive' ? '#4ADE80' : '#F87171'
                }}
              >
                {statusState === 'Inactive' ? 'Reactivate Learner' : 'Set as Inactive'}
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: 4, marginTop: 20, borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'progress', label: 'Growth Progress' },
              { id: 'sessions', label: `Sessions (${bookings.length})` },
              { id: 'activity', label: 'Activity Timeline' },
              { id: 'access', label: 'Device & Access' }
            ].map(t => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as any)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px 8px 0 0',
                    border: 0,
                    borderBottom: active ? '2px solid #D4AF37' : '2px solid transparent',
                    background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                    color: active ? '#F4D67A' : '#8A90AB',
                    fontSize: 12.5,
                    fontWeight: active ? 600 : 500,
                    cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#8A90AB' }}>
              Loading learner records from Starfix Supabase database…
            </div>
          ) : error ? (
            <div style={{ padding: 24, borderRadius: 10, background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)' }}>
              {error}
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {tab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* KPI Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(212,175,55,0.14)' }}>
                      <div style={{ fontSize: 11.5, color: '#8A90AB' }}>Path Completion</div>
                      <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 28, color: '#F4D67A', marginTop: 4 }}>
                        {overallProgress}%
                      </div>
                      <div style={{ fontSize: 11, color: '#9AA0BA', marginTop: 2 }}>{activePath}</div>
                    </div>

                    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(212,175,55,0.14)' }}>
                      <div style={{ fontSize: 11.5, color: '#8A90AB' }}>Milestones Done</div>
                      <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 28, color: '#F7EFD8', marginTop: 4 }}>
                        {milestoneProgress.length}
                      </div>
                      <div style={{ fontSize: 11, color: '#9AA0BA', marginTop: 2 }}>Steps achieved</div>
                    </div>

                    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(212,175,55,0.14)' }}>
                      <div style={{ fontSize: 11.5, color: '#8A90AB' }}>Experience (XP)</div>
                      <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 28, color: '#F4D67A', marginTop: 4 }}>
                        {xp.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: '#9AA0BA', marginTop: 2 }}>Streak: {streak} days</div>
                    </div>

                    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(212,175,55,0.14)' }}>
                      <div style={{ fontSize: 11.5, color: '#8A90AB' }}>Sessions Booked</div>
                      <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 28, color: '#F7EFD8', marginTop: 4 }}>
                        {bookings.length}
                      </div>
                      <div style={{ fontSize: 11, color: '#9AA0BA', marginTop: 2 }}>{completedSessions} completed</div>
                    </div>
                  </div>

                  {/* Profile Metadata */}
                  <div style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.12)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#D4AF37', marginBottom: 14 }}>
                      LEARNER ACCOUNT & PROFILE DETAILS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px 24px', fontSize: 13 }}>
                      <div><span style={{ color: '#8A90AB' }}>Full Name:</span> <b style={{ color: '#F7EFD8', marginLeft: 6 }}>{name}</b></div>
                      <div><span style={{ color: '#8A90AB' }}>Email Address:</span> <span style={{ color: '#F7EFD8', marginLeft: 6 }}>{email}</span></div>
                      <div><span style={{ color: '#8A90AB' }}>Career Goal:</span> <span style={{ color: '#F4D67A', marginLeft: 6, fontWeight: 600 }}>{careerGoal}</span></div>
                      <div><span style={{ color: '#8A90AB' }}>Active Growth Path:</span> <span style={{ color: '#F7EFD8', marginLeft: 6 }}>{activePath} ({category})</span></div>
                      <div><span style={{ color: '#8A90AB' }}>Location:</span> <span style={{ color: '#F7EFD8', marginLeft: 6 }}>{deviceAccess.approximateLocation}</span></div>
                      <div><span style={{ color: '#8A90AB' }}>Timezone:</span> <span style={{ color: '#F7EFD8', marginLeft: 6 }}>{deviceAccess.timezone}</span></div>
                      <div><span style={{ color: '#8A90AB' }}>Saved Resources:</span> <span style={{ color: '#F7EFD8', marginLeft: 6 }}>{savedItems.length} items</span></div>
                      <div><span style={{ color: '#8A90AB' }}>Last Active:</span> <span style={{ color: '#4ADE80', marginLeft: 6 }}>{deviceAccess.lastActiveFormatted}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: GROWTH PROGRESS */}
              {tab === 'progress' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.12)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#D4AF37', marginBottom: 14 }}>
                      ACTIVE PATH PROGRESS: {activePath}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#F7EFD8' }}>Overall Course Completion</span>
                      <span style={{ fontWeight: 700, color: '#F4D67A' }}>{overallProgress}%</span>
                    </div>
                    <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, overallProgress)}%`, height: '100%', background: 'linear-gradient(90deg,#B8901F,#F4D67A)' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 20 }}>
                      <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: 11.5, color: '#8A90AB' }}>Streak 🔥</div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: '#F4D67A', marginTop: 4 }}>{streak} Days</div>
                      </div>
                      <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: 11.5, color: '#8A90AB' }}>Experience XP</div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: '#F7EFD8', marginTop: 4 }}>{xp.toLocaleString()} XP</div>
                      </div>
                      <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: 11.5, color: '#8A90AB' }}>Completed Milestones</div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: '#4ADE80', marginTop: 4 }}>{milestoneProgress.length} Done</div>
                      </div>
                    </div>
                  </div>

                  {/* Milestone Progress List */}
                  <div style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.12)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#D4AF37', marginBottom: 12 }}>
                      MILESTONES & ROADMAP ACTIVITY
                    </div>
                    {milestoneProgress.length ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {milestoneProgress.map((m: any, idx: number) => (
                          <div key={m.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ color: '#4ADE80' }}>✓</span>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#F7EFD8' }}>
                                  {m.milestones?.title || `Milestone Phase ${idx + 1}`}
                                </div>
                                <div style={{ fontSize: 11.5, color: '#8A90AB' }}>
                                  Week {m.milestones?.week_number || (idx + 1)} · {m.milestones?.phase || 'Core Curriculum'}
                                </div>
                              </div>
                            </div>
                            <span style={{ fontSize: 11, color: '#8A90AB' }}>
                              {m.completed_at ? new Date(m.completed_at).toLocaleDateString() : 'Completed'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#8A90AB', fontSize: 13, padding: '12px 0' }}>
                        No milestone-level records completed yet for this learner.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SESSIONS */}
              {tab === 'sessions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#D4AF37' }}>
                    BOOKED MENTOR SESSIONS ({bookings.length})
                  </div>
                  {bookings.length ? (
                    <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid rgba(212,175,55,0.15)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                        <thead>
                          <tr style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37' }}>
                            <th style={{ padding: '10px 14px' }}>Mentor</th>
                            <th style={{ padding: '10px 14px' }}>Session Type</th>
                            <th style={{ padding: '10px 14px' }}>Scheduled Date</th>
                            <th style={{ padding: '10px 14px' }}>Status</th>
                            <th style={{ padding: '10px 14px' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((b: any) => (
                            <tr key={b.id} style={{ borderTop: '1px solid rgba(212,175,55,0.08)' }}>
                              <td style={{ padding: '12px 14px', fontWeight: 600, color: '#F7EFD8' }}>
                                {b.mentor_name || 'Starfix Mentor'}
                              </td>
                              <td style={{ padding: '12px 14px', color: '#9AA0BA' }}>{b.session_type || 'Mentoring session'}</td>
                              <td style={{ padding: '12px 14px', color: '#9AA0BA' }}>
                                {b.scheduled_start ? new Date(b.scheduled_start).toLocaleString() : '—'}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, color: b.status === 'completed' ? '#4ADE80' : '#FBBF24', background: b.status === 'completed' ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)' }}>
                                  {b.status || 'Confirmed'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', color: '#F4D67A', fontWeight: 600 }}>
                                ₹{Number(b.amount || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: 32, textAlign: 'center', color: '#8A90AB', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                      No mentor sessions have been booked yet by this learner.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ACTIVITY */}
              {tab === 'activity' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#D4AF37', marginBottom: 4 }}>
                    LEARNING & ENGAGEMENT AUDIT TRAIL
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {['Today', 'Yesterday', 'Earlier this week', 'Last week', 'Earlier'].map(grp => {
                      const grpEvents = timeline.filter(e => e.group === grp)
                      if (!grpEvents.length) return null
                      return (
                        <div key={grp}>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#D4AF37', letterSpacing: '.06em', marginBottom: 10, textTransform: 'uppercase' }}>
                            {grp}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderLeft: '1px solid rgba(212,175,55,0.25)', paddingLeft: 18, marginLeft: 6 }}>
                            {grpEvents.map(e => (
                              <div key={e.id} style={{ position: 'relative', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px' }}>
                                <span style={{ position: 'absolute', left: -23, top: 12, width: 8, height: 8, borderRadius: '50%', background: e.tone === 'green' ? '#4ADE80' : '#F4D67A', boxShadow: `0 0 8px ${e.tone === 'green' ? '#4ADE80' : '#F4D67A'}` }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: '#F7EFD8' }}>{e.title}</span>
                                  <span style={{ fontSize: 11, color: '#8A90AB' }}>
                                    {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                {e.description && (
                                  <div style={{ fontSize: 12, color: '#9AA0BA', marginTop: 4 }}>
                                    {e.description}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: ACCESS */}
              {tab === 'access' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.12)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#D4AF37', marginBottom: 14 }}>
                      PLATFORM & LOCATION METADATA
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, fontSize: 13 }}>
                      <div><span style={{ color: '#8A90AB' }}>Device Type:</span> <b style={{ color: '#F7EFD8', marginLeft: 6 }}>{deviceAccess.deviceType}</b></div>
                      <div><span style={{ color: '#8A90AB' }}>Operating System:</span> <b style={{ color: '#F7EFD8', marginLeft: 6 }}>{deviceAccess.operatingSystem}</b></div>
                      <div><span style={{ color: '#8A90AB' }}>Browser:</span> <b style={{ color: '#F7EFD8', marginLeft: 6 }}>{deviceAccess.browser}</b></div>
                      <div><span style={{ color: '#8A90AB' }}>Approximate Location:</span> <b style={{ color: '#F4D67A', marginLeft: 6 }}>{deviceAccess.approximateLocation}</b></div>
                      <div><span style={{ color: '#8A90AB' }}>Timezone:</span> <span style={{ color: '#F7EFD8', marginLeft: 6 }}>{deviceAccess.timezone}</span></div>
                      <div><span style={{ color: '#8A90AB' }}>Last Login Timestamp:</span> <span style={{ color: '#4ADE80', marginLeft: 6 }}>{deviceAccess.lastActiveFormatted}</span></div>
                    </div>
                  </div>

                  {/* Sessions table */}
                  <div style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.12)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#D4AF37', marginBottom: 12 }}>
                      RECENT LOGIN & ACCESS HISTORY
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37' }}>
                            <th style={{ padding: '8px 12px' }}>Date & Time</th>
                            <th style={{ padding: '8px 12px' }}>Approximate Location</th>
                            <th style={{ padding: '8px 12px' }}>Device</th>
                            <th style={{ padding: '8px 12px' }}>Browser / OS</th>
                            <th style={{ padding: '8px 12px' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deviceAccess.recentSessions.map(s => (
                            <tr key={s.id} style={{ borderTop: '1px solid rgba(212,175,55,0.08)' }}>
                              <td style={{ padding: '10px 12px', color: '#F7EFD8' }}>{s.timestamp}</td>
                              <td style={{ padding: '10px 12px', color: '#9AA0BA' }}>{s.location}</td>
                              <td style={{ padding: '10px 12px', color: '#F7EFD8' }}>{s.device}</td>
                              <td style={{ padding: '10px 12px', color: '#9AA0BA' }}>{s.browser} · {s.os}</td>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10.5, fontWeight: 600, color: s.status === 'Active' ? '#4ADE80' : '#8A90AB', background: s.status === 'Active' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.05)' }}>
                                  {s.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirmation Dialog Modal */}
      {actionConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            background: 'rgba(0,0,0,0.85)',
            display: 'grid',
            placeItems: 'center'
          }}
          onClick={() => !actionBusy && setActionConfirm(null)}
        >
          <div
            style={{
              width: 440,
              maxWidth: '90vw',
              padding: 24,
              borderRadius: 14,
              background: 'linear-gradient(160deg, #0E1638 0%, #070A1A 100%)',
              border: '1px solid rgba(212,175,55,0.38)',
              color: '#F7EFD8'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 20, fontWeight: 600, color: '#F4D67A' }}>
              {actionConfirm.title}
            </div>
            <p style={{ fontSize: 13, color: '#9AA0BA', lineHeight: 1.55, margin: '10px 0 20px' }}>
              {actionConfirm.desc}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => setActionConfirm(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent',
                  color: '#F7EFD8',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionBusy}
                onClick={actionConfirm.onConfirm}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 0,
                  background: 'linear-gradient(135deg,#F4D67A,#D4AF37)',
                  color: '#0A0E1F',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {actionBusy ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
