import React, { useState, useMemo, useEffect } from 'react'
import { Card } from '../shared'
import { getEcosystem } from '../adminBackend'

interface UserActivityViewProps {
  ecosystem?: any
}

type TimeWindow = '7d' | '14d' | '30d' | '90d' | 'all'

export function UserActivityView({ ecosystem }: UserActivityViewProps) {
  const [liveData, setLiveData] = useState<any>(ecosystem || null)
  const [loading, setLoading] = useState(!ecosystem)
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('30d')
  const [hoveredDay, setHoveredDay] = useState<any | null>(null)

  useEffect(() => {
    if (ecosystem) {
      setLiveData(ecosystem)
      setLoading(false)
      return
    }
    let isMounted = true
    setLoading(true)
    getEcosystem()
      .then(res => {
        if (isMounted) {
          setLiveData(res)
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false)
      })
    return () => { isMounted = false }
  }, [ecosystem])

  const num = (v: any) => Number(v) || 0

  const metrics = useMemo(() => {
    if (!liveData) {
      return {
        dau: 0,
        wau: 0,
        mau: 0,
        stickiness: '0.0%',
        newUsers: 0,
        returningUsers: 0,
        activeMentors: 0,
        activeLearners: 0,
        dailyTrend: [],
        hasSufficientData: false,
        breakdown: { sessions: 0, milestones: 0, progressUpdates: 0, reviews: 0 }
      }
    }

    const now = Date.now()
    const DAY = 86400000

    const profiles: any[] = liveData.profiles || []
    const mentors: any[] = liveData.mentors || []
    const progress: any[] = liveData.progress || []
    const bookings: any[] = liveData.bookings || []
    const milestoneProgress: any[] = liveData.milestoneProgress || []
    const reviews: any[] = liveData.reviews || []
    const feedback: any[] = liveData.feedback || []

    // Timestamp maps for every user
    const userTouches = new Map<string, number[]>()
    const recordTouch = (userId: string, ts: number) => {
      if (!userId || !ts || isNaN(ts)) return
      const list = userTouches.get(userId) || []
      list.push(ts)
      userTouches.set(userId, list)
    }

    // 1. Profile creations
    profiles.forEach(p => {
      if (p.created_at) recordTouch(p.id, Date.parse(p.created_at))
    })

    // 2. Progress activity
    progress.forEach(p => {
      if (p.last_active_date) recordTouch(p.user_id, Date.parse(p.last_active_date))
      if (p.created_at) recordTouch(p.user_id, Date.parse(p.created_at))
    })

    // 3. Bookings
    bookings.forEach(b => {
      const t = b.created_at ? Date.parse(b.created_at) : (b.scheduled_start ? Date.parse(b.scheduled_start) : 0)
      if (b.student_id) recordTouch(b.student_id, t)
      if (b.mentor_id) recordTouch(b.mentor_id, t)
    })

    // 4. Milestone progress
    milestoneProgress.forEach(mp => {
      const t = mp.completed_at ? Date.parse(mp.completed_at) : (mp.created_at ? Date.parse(mp.created_at) : 0)
      if (mp.user_id) recordTouch(mp.user_id, t)
    })

    // 5. Reviews
    reviews.forEach(r => {
      const t = r.created_at ? Date.parse(r.created_at) : 0
      if (r.student_id) recordTouch(r.student_id, t)
      if (r.mentor_id) recordTouch(r.mentor_id, t)
    })

    // Calculate DAU, WAU, MAU
    let dauCount = 0
    let wauCount = 0
    let mauCount = 0
    let returningCount = 0

    userTouches.forEach(timestamps => {
      const latest = Math.max(...timestamps)
      if (latest >= now - DAY) dauCount++
      if (latest >= now - 7 * DAY) wauCount++
      if (latest >= now - 30 * DAY) mauCount++
      // Returning user: active on more than 1 distinct day or streak >= 2
      const uniqueDays = new Set(timestamps.map(t => new Date(t).toDateString())).size
      if (uniqueDays > 1) returningCount++
    })

    // Also consider progress streaks for returning users
    const highStreakUsers = new Set(progress.filter(p => num(p.streak) >= 2).map(p => p.user_id))
    highStreakUsers.forEach(u => {
      if (!userTouches.has(u)) returningCount++
    })

    // New Users in window
    let windowDuration = 30 * DAY
    if (timeWindow === '7d') windowDuration = 7 * DAY
    else if (timeWindow === '14d') windowDuration = 14 * DAY
    else if (timeWindow === '90d') windowDuration = 90 * DAY
    else if (timeWindow === 'all') windowDuration = 365 * 3 * DAY

    const newUsers = profiles.filter(p => {
      const t = p.created_at ? Date.parse(p.created_at) : 0
      return t >= now - windowDuration
    }).length

    // Active Mentors (with bookings or feedback or availability in window)
    const activeMentorIds = new Set<string>()
    bookings.forEach(b => {
      const t = b.created_at ? Date.parse(b.created_at) : 0
      if (t >= now - windowDuration && b.mentor_id) activeMentorIds.add(b.mentor_id)
    })
    reviews.forEach(r => {
      const t = r.created_at ? Date.parse(r.created_at) : 0
      if (t >= now - windowDuration && r.mentor_id) activeMentorIds.add(r.mentor_id)
    })
    feedback.forEach(f => {
      const t = f.created_at ? Date.parse(f.created_at) : 0
      if (t >= now - windowDuration && f.mentor_id) activeMentorIds.add(f.mentor_id)
    })
    // Mentors with catalog rating / live slots
    const activeMentors = Math.max(activeMentorIds.size, mentors.filter(m => num(m.students_count) > 0 || m.availability).length)

    // Active Learners (with progress, bookings, milestones in window)
    const activeLearnerIds = new Set<string>()
    progress.forEach(p => {
      const t = p.last_active_date ? Date.parse(p.last_active_date) : 0
      if (t >= now - windowDuration) activeLearnerIds.add(p.user_id)
    })
    bookings.forEach(b => {
      const t = b.created_at ? Date.parse(b.created_at) : 0
      if (t >= now - windowDuration && b.student_id) activeLearnerIds.add(b.student_id)
    })
    const activeLearners = Math.max(activeLearnerIds.size, wauCount)

    // DAU/MAU Stickiness
    const stickiness = mauCount > 0 ? ((dauCount / mauCount) * 100).toFixed(1) + '%' : '0.0%'

    // Daily activity trend buckets
    const numDays = timeWindow === '7d' ? 7 : timeWindow === '14d' ? 14 : timeWindow === '30d' ? 30 : 30
    const dayBuckets: Array<{
      dateStr: string
      label: string
      dayStart: number
      sessions: number
      milestones: number
      progressTouches: number
      reviews: number
      total: number
    }> = []

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now - i * DAY)
      d.setHours(0, 0, 0, 0)
      const dayStart = d.getTime()
      const dayEnd = dayStart + DAY

      const sess = bookings.filter(b => {
        const t = b.created_at ? Date.parse(b.created_at) : 0
        return t >= dayStart && t < dayEnd
      }).length

      const ms = milestoneProgress.filter(m => {
        const t = m.completed_at ? Date.parse(m.completed_at) : 0
        return t >= dayStart && t < dayEnd
      }).length

      const prog = progress.filter(p => {
        const t = p.last_active_date ? Date.parse(p.last_active_date) : 0
        return t >= dayStart && t < dayEnd
      }).length

      const rev = reviews.filter(r => {
        const t = r.created_at ? Date.parse(r.created_at) : 0
        return t >= dayStart && t < dayEnd
      }).length

      const total = sess + ms + prog + rev
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      dayBuckets.push({
        dateStr: d.toISOString().slice(0, 10),
        label,
        dayStart,
        sessions: sess,
        milestones: ms,
        progressTouches: prog,
        reviews: rev,
        total
      })
    }

    const totalActiveDays = dayBuckets.filter(b => b.total > 0).length
    const hasSufficientData = totalActiveDays >= 3

    // Aggregate breakdown for the selected window
    const breakdown = {
      sessions: bookings.filter(b => {
        const t = b.created_at ? Date.parse(b.created_at) : 0
        return t >= now - windowDuration
      }).length,
      milestones: milestoneProgress.filter(m => {
        const t = m.completed_at ? Date.parse(m.completed_at) : 0
        return t >= now - windowDuration
      }).length,
      progressUpdates: progress.filter(p => {
        const t = p.last_active_date ? Date.parse(p.last_active_date) : 0
        return t >= now - windowDuration
      }).length,
      reviews: reviews.filter(r => {
        const t = r.created_at ? Date.parse(r.created_at) : 0
        return t >= now - windowDuration
      }).length
    }

    return {
      dau: dauCount,
      wau: wauCount,
      mau: mauCount,
      stickiness,
      newUsers,
      returningUsers: returningCount,
      activeMentors,
      activeLearners,
      dailyTrend: dayBuckets,
      hasSufficientData,
      breakdown
    }
  }, [liveData, timeWindow])

  const maxDaily = useMemo(() => {
    return Math.max(...metrics.dailyTrend.map((d: any) => d.total), 1)
  }, [metrics.dailyTrend])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22, color: '#F4D67A' }}>⚡</span>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 600, color: '#F7EFD8', margin: 0 }}>
              User Activity & Engagement Analytics
            </h2>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#9AA0BA' }}>
            Daily, weekly and monthly active users, engagement velocity and retention stickiness.
          </p>
        </div>

        {/* Time Window Switcher */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 10, border: '1px solid rgba(212,175,55,0.16)' }}>
          {[
            { id: '7d', label: '7 Days' },
            { id: '14d', label: '14 Days' },
            { id: '30d', label: '30 Days' },
            { id: '90d', label: '90 Days' },
            { id: 'all', label: 'All Time' }
          ].map(w => (
            <button
              key={w.id}
              onClick={() => setTimeWindow(w.id as TimeWindow)}
              style={{
                padding: '6px 12px',
                borderRadius: 7,
                border: 0,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: timeWindow === w.id ? 600 : 400,
                color: timeWindow === w.id ? '#070A1A' : '#9AA0BA',
                background: timeWindow === w.id ? 'linear-gradient(135deg, #F4D67A, #D4AF37)' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards: DAU, WAU, MAU, Stickiness, New Users, Returning, Active Mentors/Learners */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.14)' }}>
          <div style={{ fontSize: 11, color: '#8A90AB', letterSpacing: '0.03em', textTransform: 'uppercase' }}>DAU (Daily Active)</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 30, fontWeight: 600, color: '#F4D67A', marginTop: 4 }}>
            {metrics.dau}
          </div>
          <div style={{ fontSize: 11, color: '#4ADE80', marginTop: 4 }}>Last 24 hours touch</div>
        </div>

        <div style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.14)' }}>
          <div style={{ fontSize: 11, color: '#8A90AB', letterSpacing: '0.03em', textTransform: 'uppercase' }}>WAU (Weekly Active)</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 30, fontWeight: 600, color: '#F7EFD8', marginTop: 4 }}>
            {metrics.wau}
          </div>
          <div style={{ fontSize: 11, color: '#9AA0BA', marginTop: 4 }}>Active in last 7 days</div>
        </div>

        <div style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.14)' }}>
          <div style={{ fontSize: 11, color: '#8A90AB', letterSpacing: '0.03em', textTransform: 'uppercase' }}>MAU (Monthly Active)</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 30, fontWeight: 600, color: '#F7EFD8', marginTop: 4 }}>
            {metrics.mau}
          </div>
          <div style={{ fontSize: 11, color: '#9AA0BA', marginTop: 4 }}>Active in last 30 days</div>
        </div>

        <div style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.14)' }}>
          <div style={{ fontSize: 11, color: '#8A90AB', letterSpacing: '0.03em', textTransform: 'uppercase' }}>DAU / MAU Stickiness</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 30, fontWeight: 600, color: '#F4D67A', marginTop: 4 }}>
            {metrics.stickiness}
          </div>
          <div style={{ fontSize: 11, color: '#4ADE80', marginTop: 4 }}>Engagement ratio</div>
        </div>

        <div style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.14)' }}>
          <div style={{ fontSize: 11, color: '#8A90AB', letterSpacing: '0.03em', textTransform: 'uppercase' }}>New Users</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 30, fontWeight: 600, color: '#F7EFD8', marginTop: 4 }}>
            {metrics.newUsers}
          </div>
          <div style={{ fontSize: 11, color: '#9AA0BA', marginTop: 4 }}>In selected window</div>
        </div>

        <div style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.14)' }}>
          <div style={{ fontSize: 11, color: '#8A90AB', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Returning Users</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 30, fontWeight: 600, color: '#F4D67A', marginTop: 4 }}>
            {metrics.returningUsers}
          </div>
          <div style={{ fontSize: 11, color: '#4ADE80', marginTop: 4 }}>Multi-day activity or streak</div>
        </div>

        <div style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.14)' }}>
          <div style={{ fontSize: 11, color: '#8A90AB', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Active Mentors</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 30, fontWeight: 600, color: '#F7EFD8', marginTop: 4 }}>
            {metrics.activeMentors}
          </div>
          <div style={{ fontSize: 11, color: '#9AA0BA', marginTop: 4 }}>With sessions/ratings</div>
        </div>

        <div style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.14)' }}>
          <div style={{ fontSize: 11, color: '#8A90AB', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Active Learners</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 30, fontWeight: 600, color: '#F4D67A', marginTop: 4 }}>
            {metrics.activeLearners}
          </div>
          <div style={{ fontSize: 11, color: '#9AA0BA', marginTop: 4 }}>In enrolled growth paths</div>
        </div>
      </div>

      {/* Activity Trend Visualization */}
      <Card style={{ padding: 22, background: 'linear-gradient(180deg, rgba(14,22,56,0.6) 0%, rgba(7,10,26,0.7) 100%)', borderColor: 'rgba(212,175,55,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#F7EFD8', margin: 0 }}>
              Daily Engagement Trend ({timeWindow.toUpperCase()})
            </h3>
            <div style={{ fontSize: 12, color: '#8A90AB', marginTop: 3 }}>
              Total combined actions (sessions, milestone completions, path touches, verified reviews)
            </div>
          </div>
          {hoveredDay && (
            <div style={{ fontSize: 12, color: '#F4D67A', background: 'rgba(212,175,55,0.12)', padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(212,175,55,0.25)' }}>
              <b>{hoveredDay.label}</b>: {hoveredDay.total} actions ({hoveredDay.sessions} sessions, {hoveredDay.progressTouches} touches, {hoveredDay.milestones} milestones)
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#8A90AB', fontSize: 13 }}>
            Calculating activity telemetry from database…
          </div>
        ) : !metrics.hasSufficientData ? (
          <div>
            {/* Fallback indicator */}
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18 }}>ℹ️</span>
              <div style={{ fontSize: 12.5, color: '#9AA0BA' }}>
                <b style={{ color: '#F4D67A' }}>Not enough historical data yet</b> for continuous multi-day time series. Displaying all recorded live database signals below.
              </div>
            </div>

            {/* Display points that exist */}
            <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: 6, paddingBottom: 24, borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
              {metrics.dailyTrend.map((day: any) => {
                const heightPct = Math.max((day.total / maxDaily) * 100, day.total > 0 ? 15 : 4)
                return (
                  <div
                    key={day.dateStr}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      height: '100%',
                      justifyContent: 'flex-end',
                      cursor: 'pointer'
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 24,
                        height: `${heightPct}%`,
                        borderRadius: '4px 4px 0 0',
                        background: day.total > 0 ? 'linear-gradient(180deg, #F4D67A, #B8901F)' : 'rgba(255,255,255,0.05)',
                        transition: 'all 0.2s ease',
                        boxShadow: day.total > 0 ? '0 0 10px rgba(212,175,55,0.3)' : 'none'
                      }}
                    />
                    <span style={{ fontSize: 9.5, color: '#6B7190', whiteSpace: 'nowrap' }}>
                      {day.label.split(' ')[1]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: 8, paddingBottom: 24, borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
            {metrics.dailyTrend.map((day: any) => {
              const heightPct = Math.max((day.total / maxDaily) * 100, day.total > 0 ? 12 : 3)
              return (
                <div
                  key={day.dateStr}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    height: '100%',
                    justifyContent: 'flex-end',
                    cursor: 'pointer'
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 28,
                      height: `${heightPct}%`,
                      borderRadius: '4px 4px 0 0',
                      background: day.total > 0 ? 'linear-gradient(180deg, #F4D67A, #D4AF37)' : 'rgba(255,255,255,0.05)',
                      boxShadow: day.total > 0 ? '0 0 12px rgba(244,214,122,0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  />
                  <span style={{ fontSize: 10, color: '#8A90AB', whiteSpace: 'nowrap' }}>
                    {day.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Action Signal Breakdown in Window */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 18 }}>
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <div style={{ fontSize: 11, color: '#8A90AB' }}>Sessions in window</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#F7EFD8', marginTop: 4 }}>{metrics.breakdown.sessions}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <div style={{ fontSize: 11, color: '#8A90AB' }}>Milestones completed</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#F4D67A', marginTop: 4 }}>{metrics.breakdown.milestones}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <div style={{ fontSize: 11, color: '#8A90AB' }}>Progress updates</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#4ADE80', marginTop: 4 }}>{metrics.breakdown.progressUpdates}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <div style={{ fontSize: 11, color: '#8A90AB' }}>Reviews submitted</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#F7EFD8', marginTop: 4 }}>{metrics.breakdown.reviews}</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
