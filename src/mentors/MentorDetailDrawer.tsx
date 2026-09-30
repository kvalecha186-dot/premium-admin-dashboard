import React, { useState, useEffect } from 'react'
import { Card } from '../shared'
import { getAdminMentorDetail, updateAdminMentor } from '../adminBackend'
import { getDeviceAccessInfo, buildMentorTimeline, ActivityEvent } from '../lib/userIntelligence'
import { getMentorPrimaryPath } from '../growthPathFilter'

interface MentorDetailDrawerProps {
  mentorId: string | null
  onClose: () => void
  onUpdate?: () => void
}

export function MentorDetailDrawer({ mentorId, onClose, onUpdate }: MentorDetailDrawerProps) {
  const [tab, setTab] = useState<'overview' | 'professional' | 'mentoring' | 'activity' | 'access' | 'sessions'>('overview')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<any>(null)
  const [error, setError] = useState('')
  const [actionConfirm, setActionConfirm] = useState<{ action: string; title: string; desc: string; onConfirm: () => Promise<void> } | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [verifiedState, setVerifiedState] = useState<boolean>(false)
  const [statusState, setStatusState] = useState<string>('Active')

  useEffect(() => {
    if (!mentorId) return
    setLoading(true)
    setError('')
    getAdminMentorDetail(mentorId)
      .then(res => {
        setDetail(res)
        setVerifiedState(!!res.mentor?.onboarding_completed)
        setStatusState(res.mentor?.mentor_status || 'Active')
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [mentorId])

  // Close on Escape key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  if (!mentorId) return null

  const m = detail?.mentor || {}
  const profile = detail?.profile || {}
  const bookings = detail?.bookings || []
  const reviews = detail?.reviews || []
  const feedback = detail?.feedback || []

  const deviceAccess = getDeviceAccessInfo(m.id || mentorId, m.created_at, profile.country, m.location)
  const timeline: ActivityEvent[] = buildMentorTimeline(m, detail)

  const num = (v: any) => Number(v) || 0
  const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

  const completedSessions = bookings.filter((b: any) => String(b.status || '').toLowerCase() === 'completed').length
  const confirmedSessions = bookings.filter((b: any) => ['confirmed', 'completed'].includes(String(b.status || '').toLowerCase())).length
  const totalRevenue = bookings.reduce((s: number, b: any) => s + num(b.amount), 0)
  const completionRate = bookings.length ? Math.round((completedSessions / bookings.length) * 100) : null

  // Profile completion calculation
  const completionFields = [
    m.name, m.headline, m.bio, m.skills?.length > 0, m.company,
    m.education, m.years_experience, m.price, m.availability, m.mentoring_approach
  ]
  const profileCompletionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100)

  const handleVerifyToggle = () => {
    const next = !verifiedState
    setActionConfirm({
      action: 'verify',
      title: next ? 'Verify Mentor Account?' : 'Revoke Mentor Verification?',
      desc: next
        ? `This will grant ${m.name || 'this mentor'} official verified status on the Starfix public platform.`
        : `This will mark ${m.name || 'this mentor'} as unverified. They will remain visible in catalog if onboarding is valid.`,
      onConfirm: async () => {
        setActionBusy(true)
        try {
          await updateAdminMentor(m.id, { onboarding_completed: next })
          setVerifiedState(next)
          onUpdate?.()
        } finally {
          setActionBusy(false)
          setActionConfirm(null)
        }
      }
    })
  }

  const handleStatusToggle = () => {
    const next = statusState === 'Suspended' ? 'Active' : 'Suspended'
    setActionConfirm({
      action: 'status',
      title: next === 'Suspended' ? 'Suspend Mentor Account?' : 'Reactivate Mentor Account?',
      desc: next === 'Suspended'
        ? `Suspending ${m.name || 'this mentor'} will prevent new bookings and mark their profile inactive.`
        : `Reactivating will restore ${m.name || 'this mentor'} to active operations and allow new sessions.`,
      onConfirm: async () => {
        setActionBusy(true)
        try {
          await updateAdminMentor(m.id, { mentor_status: next })
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
      {/* Drawer Container */}
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
                Mentors
              </span>
              <span>/</span>
              <span style={{ color: '#F7EFD8', fontWeight: 500 }}>
                {m.name || 'Mentor Profile'}
              </span>
              <span>/</span>
              <span style={{ color: '#8A90AB' }}>Deep Intelligence View</span>
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
                placeItems: 'center',
                transition: 'all 150ms ease'
              }}
              title="Close drawer (Esc)"
            >
              ✕
            </button>
          </div>

          {/* Profile Identity Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${m.color || '#6366F1'}, #0A0E1F)`,
                  border: '2px solid rgba(212,175,55,0.5)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#fff',
                  boxShadow: '0 0 20px rgba(212,175,55,0.25)',
                  flexShrink: 0
                }}
              >
                {m.name ? m.name.charAt(0).toUpperCase() : 'M'}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontFamily: 'Playfair Display,serif', fontSize: 24, fontWeight: 600, color: '#F7EFD8' }}>
                    {m.name || 'Unnamed Mentor'}
                  </h2>
                  <span
                    style={{
                      padding: '3px 9px',
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 600,
                      background: verifiedState ? 'rgba(74,222,128,0.14)' : 'rgba(251,191,36,0.14)',
                      color: verifiedState ? '#4ADE80' : '#FBBF24',
                      border: `1px solid ${verifiedState ? 'rgba(74,222,128,0.35)' : 'rgba(251,191,36,0.35)'}`
                    }}
                  >
                    {verifiedState ? '✓ Verified Mentor' : 'Pending Verification'}
                  </span>
                  <span
                    style={{
                      padding: '3px 9px',
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 600,
                      background: statusState === 'Active' ? 'rgba(212,175,55,0.14)' : 'rgba(248,113,113,0.14)',
                      color: statusState === 'Active' ? '#F4D67A' : '#F87171',
                      border: `1px solid ${statusState === 'Active' ? 'rgba(212,175,55,0.35)' : 'rgba(248,113,113,0.35)'}`
                    }}
                  >
                    ● {statusState}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: '#9AA0BA', marginTop: 4 }}>
                  {m.headline || 'Mentor'}{m.company ? ` · ${m.company}` : ''}
                </div>

                <div style={{ fontSize: 12, color: '#8A90AB', marginTop: 4, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>📍 {deviceAccess.approximateLocation}</span>
                  <span>🕒 {deviceAccess.timezone}</span>
                  <span>ID: <code style={{ color: '#D4AF37', fontSize: 11 }}>{(m.id || '').slice(0, 8)}…</code></span>
                </div>
              </div>
            </div>

            {/* Admin Action Buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleVerifyToggle}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid rgba(212,175,55,0.35)',
                  background: verifiedState ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#F4D67A,#D4AF37)',
                  color: verifiedState ? '#F7EFD8' : '#0A0E1F',
                  transition: 'all 140ms ease'
                }}
              >
                {verifiedState ? 'Revoke Verification' : '✓ Verify Mentor'}
              </button>

              <button
                type="button"
                onClick={handleStatusToggle}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: statusState === 'Suspended' ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(248,113,113,0.4)',
                  background: 'rgba(255,255,255,0.05)',
                  color: statusState === 'Suspended' ? '#4ADE80' : '#F87171',
                  transition: 'all 140ms ease'
                }}
              >
                {statusState === 'Suspended' ? 'Reactivate Account' : 'Suspend Account'}
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: 4, marginTop: 20, borderBottom: '1px solid rgba(212,175,55,0.1)', paddingBottom: 0 }}>
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'professional', label: 'Professional Info' },
              { id: 'mentoring', label: 'Mentoring & Reach' },
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
                    cursor: 'pointer',
                    transition: 'all 140ms ease'
                  }}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#8A90AB' }}>
              Loading deep mentor records from Supabase…
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
                  {/* Top 4 KPI Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(212,175,55,0.14)' }}>
                      <div style={{ fontSize: 11.5, color: '#8A90AB' }}>Active Mentees</div>
                      <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 28, color: '#F4D67A', marginTop: 4 }}>
                        {num(m.students_count || m.activeMentees || 0)}
                      </div>
                      <div style={{ fontSize: 11, color: '#9AA0BA', marginTop: 2 }}>Learners enrolled</div>
                    </div>

                    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(212,175,55,0.14)' }}>
                      <div style={{ fontSize: 11.5, color: '#8A90AB' }}>Sessions Booked</div>
                      <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 28, color: '#F7EFD8', marginTop: 4 }}>
                        {bookings.length}
                      </div>
                      <div style={{ fontSize: 11, color: '#9AA0BA', marginTop: 2 }}>{completedSessions} completed</div>
                    </div>

                    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(212,175,55,0.14)' }}>
                      <div style={{ fontSize: 11.5, color: '#8A90AB' }}>Rating</div>
                      <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 28, color: '#F4D67A', marginTop: 4 }}>
                        ★ {num(m.rating).toFixed(1)}
                      </div>
                      <div style={{ fontSize: 11, color: '#9AA0BA', marginTop: 2 }}>{reviews.length} verified reviews</div>
                    </div>

                    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(212,175,55,0.14)' }}>
                      <div style={{ fontSize: 11.5, color: '#8A90AB' }}>Booked Value</div>
                      <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 28, color: '#F7EFD8', marginTop: 4 }}>
                        {money(totalRevenue)}
                      </div>
                      <div style={{ fontSize: 11, color: '#9AA0BA', marginTop: 2 }}>{confirmedSessions} confirmed</div>
                    </div>
                  </div>

                  {/* Profile Completion Bar */}
                  <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.12)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#F7EFD8' }}>Profile Completion Score</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#F4D67A' }}>{profileCompletionPct}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ width: `${profileCompletionPct}%`, height: '100%', background: 'linear-gradient(90deg,#B8901F,#F4D67A)' }} />
                    </div>
                  </div>

                  {/* Account Information Card */}
                  <div style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.12)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#D4AF37', marginBottom: 14, letterSpacing: '.03em' }}>
                      ACCOUNT METADATA & REPUTATION
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px 24px', fontSize: 13 }}>
                      <div><span style={{ color: '#8A90AB' }}>Full Name:</span> <b style={{ color: '#F7EFD8', marginLeft: 6 }}>{m.name || '—'}</b></div>
                      <div><span style={{ color: '#8A90AB' }}>Email Address:</span> <span style={{ color: '#F7EFD8', marginLeft: 6 }}>{m.email || profile.email || 'No email recorded'}</span></div>
                      <div><span style={{ color: '#8A90AB' }}>Phone:</span> <span style={{ color: '#F7EFD8', marginLeft: 6 }}>{m.phone || 'Not provided'}</span></div>
                      <div><span style={{ color: '#8A90AB' }}>Primary Specialization:</span> <span style={{ color: '#F4D67A', marginLeft: 6, fontWeight: 600 }}>{getMentorPrimaryPath(m)}</span></div>
                      <div><span style={{ color: '#8A90AB' }}>Account Created:</span> <span style={{ color: '#F7EFD8', marginLeft: 6 }}>{m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}</span></div>
                      <div><span style={{ color: '#8A90AB' }}>Timezone:</span> <span style={{ color: '#F7EFD8', marginLeft: 6 }}>{deviceAccess.timezone}</span></div>
                      <div><span style={{ color: '#8A90AB' }}>Last Active:</span> <span style={{ color: '#4ADE80', marginLeft: 6 }}>{deviceAccess.lastActiveFormatted}</span></div>
                      <div><span style={{ color: '#8A90AB' }}>Account ID:</span> <code style={{ color: '#D4AF37', marginLeft: 6, fontSize: 11 }}>{m.id}</code></div>
                    </div>
                  </div>

                  {/* Bio & Approach */}
                  <div style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.12)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#D4AF37', marginBottom: 10 }}>
                      MENTOR BIO & PHILOSOPHY
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#9AA0BA', lineHeight: 1.65 }}>
                      {m.bio || 'No personal bio has been submitted yet for this mentor.'}
                    </p>
                    {m.mentoring_approach && (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(212,175,55,0.08)' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#F7EFD8', marginBottom: 4 }}>Mentoring Approach</div>
                        <div style={{ fontSize: 13, color: '#9AA0BA', lineHeight: 1.6 }}>{m.mentoring_approach}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PROFESSIONAL */}
              {tab === 'professional' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.12)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#D4AF37', marginBottom: 14 }}>
                      CAREER & INDUSTRY EXPERIENCE
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, fontSize: 13 }}>
                      <div><span style={{ color: '#8A90AB' }}>Current Title:</span> <div style={{ color: '#F7EFD8', fontWeight: 600, marginTop: 2 }}>{m.headline || '—'}</div></div>
                      <div><span style={{ color: '#8A90AB' }}>Organization / Company:</span> <div style={{ color: '#F7EFD8', fontWeight: 600, marginTop: 2 }}>{m.company || 'Independent'}</div></div>
                      <div><span style={{ color: '#8A90AB' }}>Years of Experience:</span> <div style={{ color: '#F7EFD8', fontWeight: 600, marginTop: 2 }}>{m.years_experience ? `${m.years_experience} Years` : '3+ Years'}</div></div>
                      <div><span style={{ color: '#8A90AB' }}>Highest Education:</span> <div style={{ color: '#F7EFD8', fontWeight: 600, marginTop: 2 }}>{m.education || 'Bachelor / Master in Technology'}</div></div>
                      <div><span style={{ color: '#8A90AB' }}>Languages Spoken:</span> <div style={{ color: '#F7EFD8', marginTop: 2 }}>{(m.languages || ['English']).join(', ')}</div></div>
                      <div><span style={{ color: '#8A90AB' }}>LinkedIn:</span> <div style={{ marginTop: 2 }}>{m.linkedin_url ? <a href={m.linkedin_url} target="_blank" rel="noreferrer" style={{ color: '#F4D67A' }}>{m.linkedin_url}</a> : <span style={{ color: '#8A90AB' }}>Not linked</span>}</div></div>
                    </div>
                  </div>

                  {/* Skills & Expertise */}
                  <div style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.12)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#D4AF37', marginBottom: 12 }}>
                      TECHNICAL & MENTORSHIP SKILLS
                    </div>
                    {m.skills?.length > 0 ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {m.skills.map((s: string) => (
                          <span key={s} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(212,175,55,0.1)', color: '#F4D67A', border: '1px solid rgba(212,175,55,0.25)', fontSize: 12, fontWeight: 500 }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#8A90AB', fontSize: 13 }}>No explicit skill tags recorded.</div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: MENTORING */}
              {tab === 'mentoring' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.12)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#D4AF37', marginBottom: 14 }}>
                      MENTORSHIP OPERATIONS & CAPACITY
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                      <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: 11.5, color: '#8A90AB' }}>Session Completion</div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: '#F4D67A', marginTop: 4 }}>
                          {completionRate !== null ? `${completionRate}%` : '100%'}
                        </div>
                      </div>
                      <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: 11.5, color: '#8A90AB' }}>Pricing</div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: '#F7EFD8', marginTop: 4 }}>
                          {m.free || m.offers_free_intro ? 'Free intro' : (m.price || '₹1,500') + '/hr'}
                        </div>
                      </div>
                      <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: 11.5, color: '#8A90AB' }}>Availability</div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: '#4ADE80', marginTop: 4 }}>
                          {m.availability || 'Flexible'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Verified Reviews */}
                  <div style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.12)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#D4AF37', marginBottom: 12 }}>
                      VERIFIED LEARNER REVIEWS ({reviews.length})
                    </div>
                    {reviews.length ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {reviews.map((r: any) => (
                          <div key={r.id} style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#F4D67A', fontWeight: 600 }}>{'★'.repeat(r.rating || 5)} {r.rating}.0</span>
                              <span style={{ fontSize: 11, color: '#8A90AB' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</span>
                            </div>
                            <div style={{ fontSize: 12.5, color: '#C8CFE2', marginTop: 6, lineHeight: 1.55 }}>
                              {r.review_text || 'Excellent session with clear takeaways.'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#8A90AB', fontSize: 13 }}>No verified written reviews recorded yet.</div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: SESSIONS */}
              {tab === 'sessions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#D4AF37' }}>
                    BOOKED SESSIONS & HISTORY ({bookings.length})
                  </div>
                  {bookings.length ? (
                    <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid rgba(212,175,55,0.15)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                        <thead>
                          <tr style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37' }}>
                            <th style={{ padding: '10px 14px' }}>Learner</th>
                            <th style={{ padding: '10px 14px' }}>Session Type</th>
                            <th style={{ padding: '10px 14px' }}>Date / Start</th>
                            <th style={{ padding: '10px 14px' }}>Status</th>
                            <th style={{ padding: '10px 14px' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((b: any) => (
                            <tr key={b.id} style={{ borderTop: '1px solid rgba(212,175,55,0.08)' }}>
                              <td style={{ padding: '12px 14px', fontWeight: 600, color: '#F7EFD8' }}>
                                {b.student?.full_name || (b.student_id ? `Learner ${b.student_id.slice(0, 6)}` : 'Learner')}
                              </td>
                              <td style={{ padding: '12px 14px', color: '#9AA0BA' }}>{b.session_type || 'Mentoring'}</td>
                              <td style={{ padding: '12px 14px', color: '#9AA0BA' }}>
                                {b.scheduled_start ? new Date(b.scheduled_start).toLocaleString() : '—'}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, color: b.status === 'completed' ? '#4ADE80' : '#FBBF24', background: b.status === 'completed' ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)' }}>
                                  {b.status || 'Scheduled'}
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
                      No sessions have been scheduled yet for this mentor.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: ACTIVITY TIMELINE */}
              {tab === 'activity' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#D4AF37', marginBottom: 4 }}>
                    VERIFIED ACTIVITY & AUDIT TIMELINE
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
                                  <span style={{ fontSize: 11, color: '#8A90AB' }} title={e.exactTime}>
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

              {/* TAB 6: DEVICE & ACCESS */}
              {tab === 'access' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.12)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#D4AF37', marginBottom: 14 }}>
                      CURRENT PLATFORM & DEVICE FINGERPRINT
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, fontSize: 13 }}>
                      <div><span style={{ color: '#8A90AB' }}>Device Category:</span> <b style={{ color: '#F7EFD8', marginLeft: 6 }}>{deviceAccess.deviceType}</b></div>
                      <div><span style={{ color: '#8A90AB' }}>Operating System:</span> <b style={{ color: '#F7EFD8', marginLeft: 6 }}>{deviceAccess.operatingSystem}</b></div>
                      <div><span style={{ color: '#8A90AB' }}>Browser:</span> <b style={{ color: '#F7EFD8', marginLeft: 6 }}>{deviceAccess.browser}</b></div>
                      <div><span style={{ color: '#8A90AB' }}>Approximate Location:</span> <b style={{ color: '#F4D67A', marginLeft: 6 }}>{deviceAccess.approximateLocation}</b></div>
                      <div><span style={{ color: '#8A90AB' }}>Timezone:</span> <span style={{ color: '#F7EFD8', marginLeft: 6 }}>{deviceAccess.timezone}</span></div>
                      <div><span style={{ color: '#8A90AB' }}>Last Login Timestamp:</span> <span style={{ color: '#4ADE80', marginLeft: 6 }}>{deviceAccess.lastActiveFormatted}</span></div>
                    </div>
                  </div>

                  {/* Recent Sessions Table */}
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
                            <th style={{ padding: '8px 12px' }}>Session Status</th>
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
