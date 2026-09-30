import { useCallback, useEffect, useState, useMemo } from 'react'
import { Card, PageShell } from './shared'
import { getEcosystem } from './adminBackend'
import {
  GrowthPathDropdown,
  MentorDropdown,
  isMentorAssociatedWithPath,
  getMentorPrimaryPath
} from './growthPathFilter'
import { MentorDetailDrawer } from './mentors/MentorDetailDrawer'
import { GeographyAnalyticsView } from './analytics/GeographyAnalyticsView'
import { UserActivityView } from './analytics/UserActivityView'


// ── helpers ─────────────────────────────────────────────────────────────────
const DAY = 864e5
const muted = '#9AA0BA', dim = '#8A90AB'
const num = (v: any) => Number(v) || 0
const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
const price = (p?: string | null) => (p || '—').replace(/^\?/, '₹')
const ago = (v?: string | null) => {
  if (!v) return '—'
  const t = Date.parse(v)
  if (isNaN(t)) return '—'
  const s = Math.max(0, Date.now() - t) / 1000
  if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago'
  if (s < 86400) return Math.round(s / 3600) + ' h ago'
  const d = Math.round(s / 86400)
  return d < 30 ? d + ' d ago' : new Date(t).toLocaleDateString()
}
const grid = (cols: number, gap = 16): React.CSSProperties => ({ display: 'grid', gridTemplateColumns: `repeat(${cols},minmax(0,1fr))`, gap })
const btn: React.CSSProperties = { padding: '8px 13px', border: '1px solid rgba(212,175,55,.22)', borderRadius: 8, background: 'rgba(255,255,255,.05)', cursor: 'pointer', fontSize: 12.5, color: '#F7EFD8' }
const th: React.CSSProperties = { textAlign: 'left', padding: '14px 13px', fontSize: 11.5, fontWeight: 600, letterSpacing: '.03em', color: '#D4AF37', background: 'rgba(212,175,55,.07)' }
const td: React.CSSProperties = { padding: 14, borderTop: '1px solid rgba(212,175,55,.12)' }
function toSkillsArray(skills: any): string[] {
  if (Array.isArray(skills)) return skills.filter(Boolean).map(String)
  if (typeof skills === 'string') return skills.split(',').map((s: string) => s.trim()).filter(Boolean)
  return []
}

// ── live data hook: fetches on mount, then every 30 seconds ─────────────────
function useEcosystem() {
  const [d, setD] = useState<any>(null), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const load = useCallback(() => {
    setBusy(true)
    getEcosystem().then(r => { setD(r); setErr('') }).catch(e => setErr(e.message)).finally(() => setBusy(false))
  }, [])
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t) }, [load])
  return { d, err, busy, load }
}

// ── derived model ───────────────────────────────────────────────────────────
function build(d: any) {
  const now = Date.now()
  const names = new Map<string, any>(d.profiles.map((p: any) => [p.id, p]))
  const nameOf = (id: string) => { const p = names.get(id); return p?.full_name || p?.email || 'Learner ' + String(id || '').slice(0, 6) }
  const students = d.profiles.filter((p: any) => p.role === 'student')
  const activeIds = new Set<string>()
  d.progress.forEach((r: any) => { if (r.last_active_date && Date.parse(r.last_active_date) >= now - 7 * DAY) activeIds.add(r.user_id) })

  const paths = d.paths.map((p: any) => {
    const ms = d.milestones.filter((m: any) => m.path_id === p.id).sort((a: any, b: any) => num(a.order_index) - num(b.order_index))
    const en = d.progress.filter((r: any) => r.path_id === p.id)
    const avg = en.length ? Math.round(en.reduce((s: number, r: any) => s + num(r.overall_progress), 0) / en.length) : 0
    return {
      ...p, ms, resources: d.resources.filter((x: any) => ms.some((m: any) => m.id === x.milestone_id)), enrolled: en.length, avg,
      done: en.filter((r: any) => num(r.overall_progress) >= 100).length,
      active: en.filter((r: any) => r.last_active_date && Date.parse(r.last_active_date) >= now - 7 * DAY).length,
      learners: en.map((r: any) => ({ name: nameOf(r.user_id), pct: Math.round(num(r.overall_progress)), streak: num(r.streak), xp: num(r.xp), last: r.last_active_date })).sort((a: any, b: any) => b.pct - a.pct),
    }
  })

  const mentors = d.mentors.map((m: any) => {
    const bk = d.bookings.filter((b: any) => b.mentor_id === m.id)
    const cv = d.convos.filter((c: any) => c.mentor_id === m.id || (m.profile_id && c.mentor_id === m.profile_id))
    const rv = d.reviews.filter((r: any) => r.mentor_id === m.id)
    const fb = d.feedback.filter((r: any) => r.mentor_id === m.id)
    const gl = d.goals.filter((r: any) => r.mentor_id === m.id)
    const er = d.earnings.filter((r: any) => r.mentor_id === m.id)
    const st = d.sessionTypes.filter((r: any) => r.mentor_id === m.id)
    const av = d.availability.filter((r: any) => r.mentor_id === m.id)
    const fu = d.followups.filter((r: any) => r.mentor_id === m.id)
    const sr = d.sharedResources.filter((r: any) => r.mentor_id === m.id)
    const nt = d.notes.filter((r: any) => r.mentor_id === m.id)
    const rules = d.scheduleRules.filter((r: any) => r.mentor_id === m.id)
    const blocked = d.blockedDates.filter((r: any) => r.mentor_id === m.id)
    const mm = new Map<string, any>()
    bk.forEach((b: any) => {
      const e = mm.get(b.student_id) || { id: b.student_id, sessions: 0, spent: 0, last: null, convo: false, feedback: false }
      e.sessions++; e.spent += num(b.amount)
      const t = b.scheduled_start || b.created_at
      if (!e.last || t > e.last) e.last = t
      mm.set(b.student_id, e)
    })
    cv.forEach((x: any) => { const e = mm.get(x.student_id) || { id: x.student_id, sessions: 0, spent: 0, last: null, convo: false, feedback: false }; e.convo = true; mm.set(x.student_id, e) })
    fb.forEach((x: any) => { const e = mm.get(x.student_id) || { id: x.student_id, sessions: 0, spent: 0, last: x.created_at, convo: false, feedback: false }; e.feedback = true; mm.set(x.student_id, e) })
    const mentees = [...mm.values()].map(e => ({ ...e, name: nameOf(e.id) }))
    const liveMenteeCount = new Set(
      bk.filter((b: any) => ['confirmed','completed'].includes(String(b.status || '').toLowerCase()) && b.student_id).map((b: any) => b.student_id)
    ).size
    const reviewAvg = rv.length ? rv.reduce((s: number, r: any) => s + num(r.rating), 0) / rv.length : null
    const feedbackAvg = fb.length ? fb.reduce((s: number, r: any) => s + num(r.rating), 0) / fb.length : null
    const completed = bk.filter((b: any) => String(b.status || '').toLowerCase() === 'completed').length
    const confirmed = bk.filter((b: any) => ['confirmed','completed'].includes(String(b.status || '').toLowerCase())).length
    const cancelled = bk.filter((b: any) => ['cancelled','canceled'].includes(String(b.status || '').toLowerCase())).length
    const completionRate = bk.length ? Math.round(completed / bk.length * 100) : null
    const cancellationRate = bk.length ? Math.round(cancelled / bk.length * 100) : null
    const performanceSignals = [reviewAvg !== null, fb.length > 0, bk.length > 0].filter(Boolean).length
    let performance = 'Insufficient live data'
    let performanceTone = 'gray'
    let performanceScore: number | null = null
    if (performanceSignals >= 2) {
      performanceScore = Math.round((reviewAvg || feedbackAvg || 0) * 20 * 0.55 + (feedbackAvg || reviewAvg || 0) * 20 * 0.2 + (completionRate ?? 0) * 0.15 + Math.min(100, liveMenteeCount * 10) * 0.1)
      performance = performanceScore >= 90 ? 'Exceptional' : performanceScore >= 80 ? 'Strong' : performanceScore >= 65 ? 'Developing' : 'Needs attention'
      performanceTone = performanceScore >= 90 ? 'green' : performanceScore >= 80 ? 'gold' : performanceScore >= 65 ? 'amber' : 'red'
    }
    return {
      ...m, bookings: bk.length, revenue: bk.reduce((s: number, b: any) => s + num(b.amount), 0), mentees, convos: cv.length,
      reviews: rv, reviewAvg, reviewCount: rv.length, feedback: fb, feedbackAvg, feedbackCount: fb.length,
      goals: gl, earnings: er, sessionTypes: st, availabilitySlots: av,
      followups: fu, sharedResources: sr, notes: nt, scheduleRules: rules, blockedDates: blocked,
      completed, confirmed, cancelled, completionRate, cancellationRate,
      liveMenteeCount, performance, performanceTone, performanceSignals, performanceScore,
      profileSignalScore: Math.round(Math.min(100, (num(m.rating) / 5) * 70 + Math.min(1, num(m.students_count) / 3500) * 20 + (m.onboarding_completed ? 10 : 0))),
    }
  })

  // Only mentors with enough live signals receive a performance position.
  // Catalog-only profile numbers never create a fake live ranking.
  const orderedMentors = mentors
    .filter((x: any) => x.performanceScore !== null)
    .sort((a: any, b: any) => num(b.performanceScore) - num(a.performanceScore) || num(b.reviewCount) - num(a.reviewCount) || num(b.liveMenteeCount) - num(a.liveMenteeCount))
  const positionById = new Map(orderedMentors.map((x: any, i: number) => [x.id, i + 1]))
  mentors.forEach((x: any) => { x.profilePosition = positionById.get(x.id) || null; x.profilePositionTotal = orderedMentors.length })

  const live = d.bookings.filter((b: any) => !['cancelled', 'canceled'].includes(String(b.status || '').toLowerCase()))
  return {
    students, paths, mentors, nameOf, activeIds,
    revenue: live.reduce((s: number, b: any) => s + num(b.amount), 0),
  }
}

// ── small UI pieces ─────────────────────────────────────────────────────────
const TONES: any = {
  green: ['#4ADE80', 'rgba(74,222,128,.12)', 'rgba(74,222,128,.3)'], amber: ['#FBBF24', 'rgba(251,191,36,.12)', 'rgba(251,191,36,.3)'],
  red: ['#F87171', 'rgba(248,113,113,.12)', 'rgba(248,113,113,.3)'], gold: ['#F4D67A', 'rgba(212,175,55,.14)', 'rgba(212,175,55,.35)'],
  gray: ['#9AA0BA', 'rgba(255,255,255,.05)', 'rgba(255,255,255,.12)'], blue: ['#60A5FA', 'rgba(96,165,250,.12)', 'rgba(96,165,250,.3)'],
}
function Tag({ children, tone = 'gold' }: { children: React.ReactNode; tone?: string }) {
  const t = TONES[tone] || TONES.gold
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, color: t[0], background: t[1], border: '1px solid ' + t[2], whiteSpace: 'nowrap' }}>{children}</span>
}
function Kpi({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return <Card style={{ padding: 22, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', right: -30, top: -30, width: 110, height: 110, borderRadius: '50%', background: 'radial-gradient(circle,rgba(212,175,55,.22),transparent 70%)', pointerEvents: 'none' }} />
    <div style={{ fontSize: 12.5, color: muted, letterSpacing: '.02em' }}>{label}</div>
    <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 38, fontWeight: 600, marginTop: 8, lineHeight: 1.1, background: 'linear-gradient(180deg,#FFF3C4,#D4AF37)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{value}</div>
    <div style={{ fontSize: 12, color: dim, marginTop: 8 }}>{detail}</div>
  </Card>
}
function Bar({ pct, h = 6 }: { pct: number; h?: number }) {
  return <div style={{ height: h, borderRadius: 9, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}><div style={{ width: Math.min(100, pct) + '%', height: '100%', borderRadius: 9, background: 'linear-gradient(90deg,#B8901F,#F4D67A)' }} /></div>
}
function Avatar({ name, color, size = 46 }: { name: string; color?: string; size?: number }) {
  const ini = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: size * 0.34, color: '#fff', background: `linear-gradient(135deg,${color || '#6366F1'},#0A0E1F)`, border: '1.5px solid rgba(212,175,55,.55)' }}>{ini}</div>
}
function H({ title, sub }: { title: string; sub?: string }) {
  return <div style={{ marginBottom: 16 }}>
    <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 20, fontWeight: 600, color: '#F7EFD8' }}>{title}</div>
    {sub && <div style={{ fontSize: 12.5, color: dim, marginTop: 3 }}>{sub}</div>}
  </div>
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '22px 8px', textAlign: 'center', fontSize: 13, color: dim, lineHeight: 1.6 }}>{children}</div>
}
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} style={{ ...btn, background: on ? 'linear-gradient(135deg,#F4D67A,#D4AF37)' : 'rgba(255,255,255,.05)', color: on ? '#0A0E1F' : '#F7EFD8', fontWeight: on ? 600 : 400 }}>{children}</button>
}
function LiveBadge({ at, busy, load }: { at: number; busy: boolean; load: () => void }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#4ADE80' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 10px #4ADE80' }} />Live · updated {new Date(at).toLocaleTimeString()}
    </span>
    <button onClick={load} style={btn}>{busy ? 'Refreshing…' : 'Refresh'}</button>
  </div>
}
function Loading({ title, sub, err }: { title: string; sub: string; err: string }) {
  return <PageShell title={title} subtitle={sub}>{err ? <Card style={{ color: '#F87171' }}>{err}</Card> : <Card>Loading live Starfix data…</Card>}</PageShell>
}
const availTone = (a?: string) => a === 'Today' ? 'green' : a === 'Tomorrow' ? 'amber' : 'gray'

// ── OVERVIEW ────────────────────────────────────────────────────────────────
export function LiveOverview() {
  const { d, err, busy, load } = useEcosystem()
  const [viewMode, setViewMode] = useState<'overview' | 'geography' | 'activity'>('overview')

  if (!d) return <Loading title="Starfix Overview" sub="Live operational data from the Starfix database." err={err} />
  const m = build(d)
  const topMentors = [...m.mentors].sort((a: any, b: any) => num(b.liveMenteeCount) - num(a.liveMenteeCount) || num(b.rating) - num(a.rating)).slice(0, 5)
  const pathRows = [...m.paths].sort((a: any, b: any) => b.enrolled - a.enrolled || num(b.rating) - num(a.rating))
  const pathOf = (uid: string) => { const r = d.progress.find((x: any) => x.user_id === uid); return r ? { title: d.paths.find((p: any) => p.id === r.path_id)?.title || '—', pct: Math.round(num(r.overall_progress)) } : null }

  return <PageShell title="Starfix Overview" subtitle="Everything happening on Starfix right now — learners, mentors, growth paths and sessions, straight from the live database." action={<LiveBadge at={d.fetchedAt} busy={busy} load={load} />}>
    <div style={{ display: 'flex', gap: 6, marginBottom: 22, borderBottom: '1px solid rgba(212,175,55,0.16)', paddingBottom: 12 }}>
      {[
        { id: 'overview', label: '✦ Ecosystem Overview' },
        { id: 'geography', label: '🌍 User Geography' },
        { id: 'activity', label: '⚡ User Activity & Engagement' }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setViewMode(tab.id as any)}
          style={{
            ...btn,
            padding: '8px 16px',
            fontWeight: viewMode === tab.id ? 600 : 400,
            color: viewMode === tab.id ? '#070A1A' : '#9AA0BA',
            background: viewMode === tab.id ? 'linear-gradient(135deg, #F4D67A, #D4AF37)' : 'rgba(255,255,255,0.04)',
            borderColor: viewMode === tab.id ? 'transparent' : 'rgba(212,175,55,0.18)'
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>

    {viewMode === 'geography' && <GeographyAnalyticsView ecosystem={d} />}
    {viewMode === 'activity' && <UserActivityView ecosystem={d} />}

    {viewMode === 'overview' && (
      <>
        <div style={{ ...grid(4), marginBottom: 20 }}>
          <Kpi label="Learners" value={m.students.length} detail={m.activeIds.size + ' active in the last 7 days'} />
          <Kpi label="Mentors" value={d.mentors.length} detail={m.mentors.filter((x: any) => x.onboarding_completed).length + ' fully onboarded'} />
          <Kpi label="Growth paths" value={d.paths.length} detail={d.milestones.length + ' milestones across all paths'} />
          <Kpi label="Sessions booked" value={d.bookings.length} detail={money(m.revenue) + ' booked value'} />
        </div>

        <div style={{ ...grid(4), marginBottom: 16 }}>
          <Kpi label="Progress records" value={d.progress.length} detail={d.milestoneProgress.length + ' milestone-level records'} />
          <Kpi label="Saved resources" value={d.savedItems.length} detail={d.watchQueue.length + ' items in learner watch queues'} />
          <Kpi label="XP transactions" value={d.xpTransactions.length} detail="Real learner activity events" />
          <Kpi label="Notifications" value={d.notifications.length} detail="Stored Starfix notifications" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) minmax(0,1fr)', gap: 16, marginBottom: 16 }}>
          <Card>
            <H title="Growth path momentum" sub="Learners enrolled and average completion on every path" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pathRows.map((p: any) => <div key={p.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7, gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <b style={{ fontSize: 13.5 }}>{p.title}</b><Tag tone="gray">{p.category}</Tag>
                  </div>
                  <span style={{ fontSize: 12, color: muted, whiteSpace: 'nowrap' }}>{p.enrolled} enrolled · {p.avg}%</span>
                </div>
                <Bar pct={p.avg} />
              </div>)}
              {!pathRows.length && <Empty>No growth paths found.</Empty>}
            </div>
          </Card>
          <Card>
            <H title="Mentor spotlight" sub="Most-followed mentors on Starfix" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {topMentors.map((x: any) => <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={x.name} color={x.color} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{x.name}</div>
                  <div style={{ fontSize: 11.5, color: dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.headline}{x.company ? ' · ' + x.company : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: '#F4D67A' }}>★ {num(x.rating).toFixed(1)}</div>
                  <div style={{ fontSize: 11, color: dim }}>{num(x.liveMenteeCount).toLocaleString()} live mentees</div>
                </div>
              </div>)}
            </div>
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) minmax(0,1fr)', gap: 16 }}>
          <Card>
            <H title="Newest learners" sub="Latest people to join Starfix" />
            {m.students.length ? <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {m.students.slice(0, 6).map((s: any) => { const pr = pathOf(s.id); return <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={s.full_name || s.email || '?'} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.full_name || 'Unnamed learner'}</div>
                  <div style={{ fontSize: 11.5, color: dim }}>{s.goal_title || s.career_goal || s.email}</div>
                </div>
                <div style={{ width: 150 }}>
                  {pr ? <><div style={{ fontSize: 11.5, color: muted, marginBottom: 5 }}>{pr.title} · {pr.pct}%</div><Bar pct={pr.pct} /></> : <span style={{ fontSize: 11.5, color: dim }}>Not enrolled yet</span>}
                </div>
                <div style={{ fontSize: 11.5, color: dim, width: 70, textAlign: 'right' }}>{ago(s.created_at)}</div>
              </div> })}
            </div> : <Empty>No learners have signed up yet.</Empty>}
          </Card>
          <Card>
            <H title="Recent sessions" sub="Latest mentor bookings" />
            {d.bookings.length ? <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {d.bookings.slice(0, 5).map((b: any) => <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div><div style={{ fontSize: 13.5, fontWeight: 600 }}>{b.mentor_name || 'Mentor'}</div><div style={{ fontSize: 11.5, color: dim }}>{b.session_type || 'Mentoring session'} · {ago(b.created_at)}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 13 }}>{money(num(b.amount))}</div><Tag tone={/confirm|complet/i.test(b.status || '') ? 'green' : /cancel/i.test(b.status || '') ? 'red' : 'amber'}>{b.status || '—'}</Tag></div>
              </div>)}
            </div> : <Empty>No sessions booked yet.<br />New bookings appear here automatically.</Empty>}
          </Card>
        </div>
      </>
    )}
  </PageShell>
}

// ── GROWTH PATHS ────────────────────────────────────────────────────────────
function PathCard({ p }: { p: any }) {
  const [open, setOpen] = useState(false)
  const groups: Record<string, any[]> = {}
  p.ms.forEach((x: any) => { const k = x.phase || 'Milestones'; (groups[k] = groups[k] || []).push(x) })
  const enrolled = Math.max(p.enrolled, num(p.learner_count))
  return <Card style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Tag>{p.category}</Tag><span style={{ fontSize: 13, color: '#F4D67A' }}>★ {num(p.rating).toFixed(1)}</span>
    </div>
    <div>
      <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 23, fontWeight: 600 }}>{p.title}</div>
      <div style={{ fontSize: 13, color: muted, marginTop: 6, lineHeight: 1.55 }}>{p.description}</div>
      <div style={{ fontSize: 12, color: dim, marginTop: 8 }}>{p.level} · {p.duration} · {p.ms.length} milestones · {p.resources.length} resources</div>
    </div>
    <div style={{ ...grid(4, 10) }}>
      {[['Enrolled', enrolled], ['Active this week', p.active], ['Completed', p.done], ['Resources', p.resources.length]].map(([l, v]) => <div key={String(l)} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(212,175,55,.12)' }}>
        <div style={{ fontSize: 22, fontFamily: 'Playfair Display,serif', color: '#F4D67A' }}>{v}</div><div style={{ fontSize: 11, color: dim, marginTop: 2 }}>{l}</div>
      </div>)}
    </div>
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: muted, marginBottom: 6 }}><span>Average completion</span><span>{p.avg}%</span></div>
      <Bar pct={p.avg} h={8} />
    </div>
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>Learners progressing</div>
      {p.learners.length ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {p.learners.slice(0, 4).map((l: any, i: number) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12.5, width: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</span>
          <div style={{ flex: 1 }}><Bar pct={l.pct} /></div>
          <span style={{ fontSize: 11.5, color: muted, width: 38, textAlign: 'right' }}>{l.pct}%</span>
        </div>)}
      </div> : <div style={{ fontSize: 12.5, color: dim }}>No learners enrolled yet — progress appears here live as learners start this path.</div>}
    </div>
    <button onClick={() => setOpen(!open)} style={{ ...btn, alignSelf: 'flex-start' }}>{open ? 'Hide' : 'View'} {p.ms.length} milestones</button>
    {open && <div style={{ borderLeft: '1px solid rgba(212,175,55,.3)', marginLeft: 6, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Object.entries(groups).map(([phase, items]) => <div key={phase}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#D4AF37', marginBottom: 8 }}>{phase}</div>
        {items.map((x: any) => <div key={x.id} style={{ position: 'relative', marginBottom: 10 }}>
          <span style={{ position: 'absolute', left: -23, top: 5, width: 9, height: 9, borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 8px rgba(212,175,55,.7)' }} />
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{x.title}</div>
          <div style={{ fontSize: 11.5, color: dim }}>Week {x.week_number}{x.description && !/^Core milestone/i.test(x.description) ? ' · ' + x.description : ''}</div>
        </div>)}
      </div>)}
    </div>}
  </Card>
}

export function LivePaths() {
  const { d, err, busy, load } = useEcosystem()
  const [selectedPath, setSelectedPath] = useState('All Growth Paths')
  const [q, setQ] = useState('')
  if (!d) return <Loading title="Growth Paths" sub="Live paths, milestones and learner progress." err={err} />
  const m = build(d)
  const cats = Array.from(new Set<string>(m.paths.map((p: any) => p.category).filter(Boolean)))
  const shown = m.paths.filter((p: any) => {
    const matchesQuery = (p.title + ' ' + (p.category || '') + ' ' + (p.description || '')).toLowerCase().includes(q.toLowerCase())
    if (!matchesQuery) return false
    if (selectedPath === 'All Growth Paths' || selectedPath === 'All') return true
    return (
      p.category?.toLowerCase() === selectedPath.toLowerCase() ||
      p.title?.toLowerCase() === selectedPath.toLowerCase() ||
      p.title?.toLowerCase().includes(selectedPath.toLowerCase()) ||
      selectedPath.toLowerCase().includes(p.title?.toLowerCase())
    )
  })
  const enrolled = d.progress.length
  return <PageShell title="Growth Paths" subtitle="Every path on Starfix with its milestones, who is enrolled and how far they have progressed." action={<LiveBadge at={d.fetchedAt} busy={busy} load={load} />}>
    <div style={{ ...grid(4), marginBottom: 20 }}>
      <Kpi label="Growth paths" value={d.paths.length} detail={cats.length + ' active categories'} />
      <Kpi label="Milestones" value={d.milestones.length} detail="Structured steps across all paths" />
      <Kpi label="Enrollments" value={enrolled} detail={m.activeIds.size + ' learners active this week'} />
      <Kpi label="Average completion" value={(enrolled ? Math.round(d.progress.reduce((s: number, r: any) => s + num(r.overall_progress), 0) / enrolled) : 0) + '%'} detail={d.progress.filter((r: any) => num(r.overall_progress) >= 100).length + ' paths completed'} />
    </div>
    <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search path title or description…"
        style={{ width: 280, height: 40, padding: '0 12px', border: '1px solid rgba(212,175,55,.22)', borderRadius: 10 }}
      />
      <GrowthPathDropdown
        value={selectedPath}
        onChange={p => setSelectedPath(p)}
        label="Filter Growth Path"
        width={280}
      />
      {(selectedPath !== 'All Growth Paths' || q) && (
        <button
          onClick={() => { setSelectedPath('All Growth Paths'); setQ('') }}
          style={{ ...btn, height: 40, color: '#F4D67A', borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.08)' }}
        >
          ✕ Reset Filter
        </button>
      )}
      <div style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 12.5, color: dim }}>
        Showing <b style={{ color: '#F7EFD8' }}>{shown.length}</b> of {m.paths.length} growth paths
      </div>
    </div>
    {shown.length ? (
      <div style={grid(2, 18)}>{shown.map((p: any) => <PathCard key={p.id} p={p} />)}</div>
    ) : (
      <Card style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#F7EFD8' }}>No growth paths matched the filter.</div>
        <div style={{ fontSize: 13, color: dim, marginTop: 6 }}>Try clearing your search query or choosing All Growth Paths.</div>
      </Card>
    )}
  </PageShell>
}

// ── MENTORS ─────────────────────────────────────────────────────────────────
function MentorCard({ m, onInspect }: { m: any; onInspect?: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const rows = [
    ['Live mentees', m.liveMenteeCount],
    ['Sessions', m.bookings],
    ['Reviews', m.reviewCount],
    ['Rating', m.reviewCount ? m.reviewAvg.toFixed(1) + '★' : 'Profile ' + num(m.rating).toFixed(1) + '★'],
    ['Live performance position', m.profilePosition ? '#' + m.profilePosition + ' / ' + m.profilePositionTotal : '—'],
  ]
  const info = [
    ['Location', m.location],
    ['Experience', num(m.years_experience) ? m.years_experience + ' years' : null],
    ['Education', m.education],
    ['Languages', (m.languages || []).join(', ')],
    ['Email', m.email],
    ['LinkedIn', m.linkedin_url],
  ].filter(x => x[1])

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <Avatar name={m.name} color={m.color} size={54} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => onInspect ? onInspect(m.id) : setOpen(!open)}
              style={{ border: 0, padding: 0, background: 'transparent', cursor: 'pointer', color: '#F7EFD8', textAlign: 'left', fontFamily: 'Playfair Display,serif', fontSize: 20, fontWeight: 600 }}
              title="Click to open deep admin profile view"
            >
              {m.name}
            </button>
            {onInspect && (
              <button
                type="button"
                onClick={() => onInspect(m.id)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid rgba(212,175,55,0.35)',
                  background: 'rgba(212,175,55,0.08)',
                  color: '#F4D67A',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Deep Profile ↗
              </button>
            )}
          </div>
          <div style={{ fontSize: 12.5, color: muted }}>{m.headline}{m.company ? ' · ' + m.company : ''}</div>
          <div style={{ fontSize: 11, color: dim, marginTop: 4 }}>
            Click name to open deep admin profile (qualifications, sessions, device access & timeline)
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, color: '#F4D67A' }}>★ {num(m.rating).toFixed(1)}</div>
          <div style={{ marginTop: 6 }}><Tag tone={availTone(m.availability)}>{m.availability || 'Availability not set'}</Tag></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {m.category && <Tag>{m.category}</Tag>}
        {toSkillsArray(m.skills).map((s: string) => <Tag key={s} tone="gray">{s}</Tag>)}
        {m.free || m.offers_free_intro ? <Tag tone="green">Free intro</Tag> : null}
        <Tag tone={m.performanceTone}>{m.performance}</Tag>
      </div>

      <div style={grid(5, 10)}>
        {rows.map(([l, v]) => (
          <div key={String(l)} style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(212,175,55,.12)' }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: '#F4D67A' }}>{v}</div>
            <div style={{ fontSize: 11, color: dim, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 4, borderTop: '1px solid rgba(212,175,55,.12)' }}>
          <div style={grid(3, 10)}>
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,.035)' }}><div style={{ color: '#F4D67A', fontWeight: 700 }}>{m.performance}</div><div style={{ fontSize: 11, color: dim, marginTop: 4 }}>Live performance position</div></div>
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,.035)' }}><div style={{ color: '#F4D67A', fontWeight: 700 }}>{m.completionRate === null ? '—' : m.completionRate + '%'}</div><div style={{ fontSize: 11, color: dim, marginTop: 4 }}>Session completion</div></div>
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,.035)' }}><div style={{ color: '#F4D67A', fontWeight: 700 }}>{m.confirmed}</div><div style={{ fontSize: 11, color: dim, marginTop: 4 }}>Confirmed/completed</div></div>
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Qualifications & professional profile</div>
            <div style={{ fontSize: 13, color: muted, lineHeight: 1.65 }}>{m.bio || 'No mentor bio has been added yet.'}</div>
            {m.mentoring_approach && <div style={{ fontSize: 13, color: muted, lineHeight: 1.65, marginTop: 8 }}><b style={{ color: '#F7EFD8' }}>Mentoring approach: </b>{m.mentoring_approach}</div>}
            {info.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 7, marginTop: 12, fontSize: 12.5 }}>
                {info.map(([l, v]) => (
                  <div key={String(l)} style={{ display: 'contents' }}>
                    <span style={{ color: dim }}>{l}</span>
                    <span style={{ wordBreak: 'break-word' }}>{v}</span>
                  </div>
                ))}
              </div>
            ) : <div style={{ fontSize: 12.5, color: dim, marginTop: 10 }}>No additional qualification fields have been entered.</div>}
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 9 }}>Verified learner reviews</div>
            {m.reviews.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {m.reviews.map((r: any) => (
                  <div key={r.id} style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(212,175,55,.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ color: '#F4D67A' }}>{'★'.repeat(Math.max(0, Math.min(5, Number(r.rating) || 0)))} <span style={{ color: dim }}>{r.rating}/5</span></span>
                      <span style={{ fontSize: 11, color: dim }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: muted, lineHeight: 1.55, marginTop: 7 }}>{r.review_text || 'No written review.'}</div>
                  </div>
                ))}
              </div>
            ) : <div style={{ fontSize: 12.5, color: dim }}>No verified learner reviews are stored yet. The profile rating above is kept separate from verified reviews.</div>}
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 9 }}>Mentor feedback</div>
            {m.feedback.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {m.feedback.slice(0, 5).map((r: any) => (
                  <div key={r.id} style={{ fontSize: 12.5, color: muted, padding: '8px 0', borderTop: '1px solid rgba(212,175,55,.08)' }}>
                    <b style={{ color: '#F4D67A' }}>{r.rating ? r.rating + '/5 · ' : ''}</b>{r.content || r.focus || 'Feedback recorded.'}
                  </div>
                ))}
              </div>
            ) : <div style={{ fontSize: 12.5, color: dim }}>No mentor feedback records yet.</div>}
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 9 }}>Actual Starfix mentees</div>
            {m.mentees.length ? m.mentees.map((e: any) => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12.5, padding: '8px 0', borderTop: '1px solid rgba(212,175,55,.1)' }}>
                <span><b>{e.name}</b>{e.feedback ? ' · feedback' : ''}</span>
                <span style={{ color: dim }}>{e.sessions} sessions · {money(e.spent)} · {ago(e.last)}</span>
              </div>
            )) : <div style={{ fontSize: 12.5, color: dim }}>No live booking, conversation or feedback relationship is recorded for this mentor yet.</div>}
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 9 }}>Mentor operations</div>
            <div style={grid(3, 10)}>
              {[['Goals', m.goals.length], ['Follow-ups', m.followups.length], ['Shared resources', m.sharedResources.length], ['Notes', m.notes.length], ['Schedule rules', m.scheduleRules.length], ['Blocked dates', m.blockedDates.length]].map(([l, v]) => (
                <div key={String(l)} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,.035)' }}>
                  <div style={{ color: '#F4D67A', fontWeight: 700 }}>{v}</div>
                  <div style={{ fontSize: 11, color: dim, marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
            {m.followups.length ? <div style={{ marginTop: 10, fontSize: 12.5, color: muted }}>Latest follow-up: {m.followups[0].summary || m.followups[0].next_steps || 'Recorded follow-up'}{m.followups[0].follow_up_date ? ' · ' + new Date(m.followups[0].follow_up_date).toLocaleDateString() : ''}</div> : null}
          </div>

          <div style={{ fontSize: 11, color: '#777E9A', lineHeight: 1.5 }}>
            Live performance position is calculated only when Starfix has enough live activity (bookings, verified reviews and mentor feedback). The profile-signal position is a separate admin indicator derived from the mentor profile's displayed rating, displayed learner reach and onboarding state; it is not an official Starfix ranking.
          </div>
        </div>
      )}
    </Card>
  )
}

export function LiveMentors() {
  const { d, err, busy, load } = useEcosystem()
  const [selectedPath, setSelectedPath] = useState('All Growth Paths')
  const [q, setQ] = useState('')
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null)

  if (!d) return <Loading title="Mentors" sub="Live mentor profiles, skills, availability and mentees." err={err} />
  const m = build(d)
  const shown = m.mentors.filter((x: any) =>
    isMentorAssociatedWithPath(x, selectedPath) &&
    (x.name + ' ' + (x.company || '') + ' ' + (x.headline || '') + ' ' + (x.skills || []).join(' ')).toLowerCase().includes(q.toLowerCase())
  )
  return <PageShell title="Mentors" subtitle="Every mentor on Starfix — expertise, ratings, availability, pricing and the learners they guide." action={<LiveBadge at={d.fetchedAt} busy={busy} load={load} />}>
    <div style={{ ...grid(4), marginBottom: 20 }}>
      <Kpi label="Mentor listings" value={m.mentors.length} detail={m.mentors.filter((x: any) => x.profile_id).length + ' registered mentor accounts'} />
      <Kpi label="Verified rating" value={m.mentors.some((x: any) => x.reviewCount) ? (m.mentors.filter((x: any) => x.reviewCount).reduce((s: number, x: any) => s + num(x.reviewAvg), 0) / m.mentors.filter((x: any) => x.reviewCount).length).toFixed(2) : '—'} detail={m.mentors.reduce((s: number, x: any) => s + x.reviewCount, 0) + ' verified reviews'} />
      <Kpi label="Registered mentors" value={m.mentors.filter((x: any) => x.profile_id).length} detail={m.mentors.filter((x: any) => x.profile_id && x.onboarding_completed).length + ' completed onboarding'} />
      <Kpi label="Active mentees" value={m.mentors.reduce((s: number, x: any) => s + x.liveMenteeCount, 0)} detail="Unique learners in confirmed/completed bookings" />
    </div>
    <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search name, company, or skills…"
        style={{ width: 280, height: 40, padding: '0 12px', border: '1px solid rgba(212,175,55,.22)', borderRadius: 10 }}
      />
      <GrowthPathDropdown
        value={selectedPath}
        onChange={p => setSelectedPath(p)}
        label="Filter by Growth Path"
        width={280}
      />
      {(selectedPath !== 'All Growth Paths' || q) && (
        <button
          onClick={() => { setSelectedPath('All Growth Paths'); setQ('') }}
          style={{ ...btn, height: 40, color: '#F4D67A', borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.08)' }}
        >
          ✕ Clear Path Filter
        </button>
      )}
      <div style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 12.5, color: dim }}>
        Showing <b style={{ color: '#F7EFD8' }}>{shown.length}</b> of {m.mentors.length} mentors
      </div>
    </div>
    {shown.length ? <div style={grid(2, 18)}>{shown.map((x: any) => <MentorCard key={x.id} m={x} onInspect={setSelectedMentorId} />)}</div> : <Card><Empty>No mentors match this filter.</Empty></Card>}

    {selectedMentorId && (
      <MentorDetailDrawer
        mentorId={selectedMentorId}
        initialMentor={m.mentors.find((x: any) => x.id === selectedMentorId)}
        onClose={() => setSelectedMentorId(null)}
        onUpdate={load}
      />
    )}
  </PageShell>
}

// ── MENTOR–MENTEE (Interactive Mentor Reach & Pairings) ──────────────────────
export function LiveMentorships() {
  const { d, err, busy, load } = useEcosystem()
  const [selectedPath, setSelectedPath] = useState('All Growth Paths')
  const [selectedMentorId, setSelectedMentorId] = useState('all')
  const [drawerMentorId, setDrawerMentorId] = useState<string | null>(null)

  if (!d) return <Loading title="Mentor–Mentee" sub="Who is learning from whom." err={err} />
  const m = build(d)

  // 1. Mentors filtered by selected growth path
  const pathMentors = useMemo(() => {
    return m.mentors.filter((mentor: any) => isMentorAssociatedWithPath(mentor, selectedPath))
  }, [m.mentors, selectedPath])

  // 2. Reset mentor selection if previously selected mentor does not belong to new path
  useEffect(() => {
    if (selectedMentorId !== 'all') {
      const stillBelongs = pathMentors.some((mentor: any) => mentor.id === selectedMentorId)
      if (!stillBelongs) {
        setSelectedMentorId('all')
      }
    }
  }, [selectedPath, pathMentors, selectedMentorId])

  // 3. Selected mentor object if one is chosen
  const selectedMentor = useMemo(() => {
    if (selectedMentorId === 'all') return null
    return pathMentors.find((mentor: any) => mentor.id === selectedMentorId) || null
  }, [pathMentors, selectedMentorId])

  // 4. Sorted list for Mentor Reach
  const rankedMentors = useMemo(() => {
    const list = selectedMentor ? [selectedMentor] : pathMentors
    return [...list].sort((a: any, b: any) =>
      num(b.liveMenteeCount) - num(a.liveMenteeCount) ||
      num(b.completed) - num(a.completed) ||
      num(b.rating) - num(a.rating)
    )
  }, [selectedMentor, pathMentors])

  const maxMentees = useMemo(() => {
    return Math.max(1, ...m.mentors.map((x: any) => num(x.liveMenteeCount)))
  }, [m.mentors])

  // 5. Filtered pairings by path and mentor
  const filteredPairings = useMemo(() => {
    return m.mentors
      .filter((x: any) => x.mentees.length)
      .filter((x: any) => isMentorAssociatedWithPath(x, selectedPath))
      .filter((x: any) => selectedMentorId === 'all' || x.id === selectedMentorId)
  }, [m.mentors, selectedPath, selectedMentorId])

  const pairs = filteredPairings.reduce((s: number, x: any) => s + x.mentees.length, 0)
  const totalMenteesInFilter = rankedMentors.reduce((s: number, x: any) => s + num(x.liveMenteeCount), 0)
  const totalSessionsInFilter = rankedMentors.reduce((s: number, x: any) => s + num(x.bookings), 0)
  const allPairingsCount = m.mentors.filter((x: any) => x.mentees.length).reduce((s: number, x: any) => s + x.mentees.length, 0)

  return (
    <PageShell
      title="Mentor–Mentee Operations"
      subtitle="Interactive mentor analytics, growth path reach, active pairings, and learner progress metrics."
      action={<LiveBadge at={d.fetchedAt} busy={busy} load={load} />}
    >
      {/* Top Overview KPI Row */}
      <div style={{ ...grid(4), marginBottom: 20 }}>
        <Kpi label="Active pairings" value={allPairingsCount} detail="Learner–mentor connections across Starfix" />
        <Kpi label="Mentors with mentees" value={m.mentors.filter((x: any) => x.mentees.length).length} detail={'of ' + m.mentors.length + ' total mentors'} />
        <Kpi label="Sessions booked" value={d.bookings.length} detail={money(m.revenue) + ' booked value'} />
        <Kpi label="Conversations" value={d.convos.length} detail="Learner–mentor chats initiated" />
      </div>

      {/* ── 1. MENTOR REACH SECTION (Interactive Analytics & Growth Path Filter) ── */}
      <Card style={{ marginBottom: 22, padding: 24 }}>
        {/* Header & Filter Controls Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20, paddingBottom: 18, borderBottom: '1px solid rgba(212,175,55,.14)' }}>
          <div>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 22, fontWeight: 600, color: '#F7EFD8' }}>
              Mentor Reach Analytics
            </div>
            <div style={{ fontSize: 13, color: dim, marginTop: 4 }}>
              Filter by Starfix growth path, inspect individual mentor performance, and track live mentee distributions.
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <GrowthPathDropdown
              value={selectedPath}
              onChange={path => setSelectedPath(path)}
              label="Select Growth Path"
              width={280}
            />

            <MentorDropdown
              mentors={pathMentors}
              selectedMentorId={selectedMentorId}
              onChange={mentorId => setSelectedMentorId(mentorId)}
              label="Select Mentor"
              width={260}
            />

            {(selectedPath !== 'All Growth Paths' || selectedMentorId !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPath('All Growth Paths')
                  setSelectedMentorId('all')
                }}
                style={{
                  ...btn,
                  height: 40,
                  color: '#F4D67A',
                  border: '1px solid rgba(212,175,55,0.4)',
                  background: 'rgba(212,175,55,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600
                }}
              >
                <span>✕</span> Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Filter Status Badge / Scope Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 12.5 }}>
            <span style={{ color: dim }}>Active Scope:</span>
            <Tag tone={selectedPath === 'All Growth Paths' ? 'gray' : 'gold'}>
              Path: {selectedPath}
            </Tag>
            {selectedMentor && (
              <Tag tone="green">
                Mentor: {selectedMentor.name}
              </Tag>
            )}
            <span style={{ color: dim, marginLeft: 6 }}>
              {rankedMentors.length} {rankedMentors.length === 1 ? 'mentor' : 'mentors'} displayed
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
            <span style={{ color: dim }}>Combined Reach: <b style={{ color: '#F4D67A', fontFamily: 'Playfair Display,serif', fontSize: 14 }}>{totalMenteesInFilter}</b> mentees</span>
            <span style={{ color: dim }}>Total Sessions: <b style={{ color: '#F7EFD8' }}>{totalSessionsInFilter}</b></span>
          </div>
        </div>

        {/* ── B. INDIVIDUAL MENTOR SPOTLIGHT ANALYTICS VIEW ── */}
        {selectedMentor ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Spotlight Hero Card */}
            <div style={{
              padding: 22,
              borderRadius: 14,
              background: 'linear-gradient(160deg, rgba(22,32,72,0.92) 0%, rgba(10,14,35,0.98) 100%)',
              border: '1px solid rgba(212,175,55,0.35)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(212,175,55,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <Avatar name={selectedMentor.name} color={selectedMentor.color} size={64} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'Playfair Display,serif', fontSize: 24, fontWeight: 600, color: '#F7EFD8' }}>
                        {selectedMentor.name}
                      </span>
                      <Tag tone="gold">{getMentorPrimaryPath(selectedMentor)}</Tag>
                      {selectedMentor.category && selectedMentor.category !== getMentorPrimaryPath(selectedMentor) && (
                        <Tag tone="gray">{selectedMentor.category}</Tag>
                      )}
                      <Tag tone={selectedMentor.performanceTone}>{selectedMentor.performance}</Tag>
                    </div>
                    <div style={{ fontSize: 13, color: muted, marginTop: 4 }}>
                      {selectedMentor.headline}{selectedMentor.company ? ' · ' + selectedMentor.company : ''}
                    </div>
                    {toSkillsArray(selectedMentor.skills).length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                        {toSkillsArray(selectedMentor.skills).map((s: string) => (
                          <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: '#C8CFE2', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setDrawerMentorId(selectedMentor.id)}
                    style={{
                      ...btn,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      color: '#070A1A',
                      background: 'linear-gradient(135deg, #F4D67A, #D4AF37)',
                      fontWeight: 600,
                      border: 0,
                      boxShadow: '0 0 14px rgba(212,175,55,0.3)'
                    }}
                  >
                    Deep Admin Profile ↗
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMentorId('all')}
                    style={{
                      ...btn,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      color: '#F4D67A',
                      borderColor: 'rgba(212,175,55,0.3)',
                      background: 'rgba(212,175,55,0.06)'
                    }}
                  >
                    <span>←</span> All Mentors in {selectedPath}
                  </button>
                </div>
              </div>

              {/* 4 Spotlight KPI Metrics */}
              <div style={{ ...grid(4, 12), marginTop: 20 }}>
                <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.14)' }}>
                  <div style={{ fontSize: 11.5, color: dim }}>Active Mentees</div>
                  <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 26, fontWeight: 600, color: '#F4D67A', marginTop: 4 }}>
                    {num(selectedMentor.liveMenteeCount).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: muted, marginTop: 3 }}>
                    Confirmed & completed learners
                  </div>
                </div>

                <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.14)' }}>
                  <div style={{ fontSize: 11.5, color: dim }}>Bookings & Sessions</div>
                  <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 26, fontWeight: 600, color: '#F7EFD8', marginTop: 4 }}>
                    {selectedMentor.completed} <span style={{ fontSize: 14, color: dim, fontWeight: 400 }}>/ {selectedMentor.bookings}</span>
                  </div>
                  <div style={{ fontSize: 11, color: muted, marginTop: 3 }}>
                    {selectedMentor.completionRate !== null ? `${selectedMentor.completionRate}% completion rate` : 'No sessions yet'}
                  </div>
                </div>

                <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.14)' }}>
                  <div style={{ fontSize: 11.5, color: dim }}>Rating & Satisfaction</div>
                  <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 26, fontWeight: 600, color: '#F4D67A', marginTop: 4 }}>
                    ★ {num(selectedMentor.rating).toFixed(1)}
                  </div>
                  <div style={{ fontSize: 11, color: muted, marginTop: 3 }}>
                    {selectedMentor.reviewCount ? `${selectedMentor.reviewCount} verified reviews` : 'Catalog baseline rating'}
                  </div>
                </div>

                <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.14)' }}>
                  <div style={{ fontSize: 11.5, color: dim }}>Total Booked Value</div>
                  <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 26, fontWeight: 600, color: '#F7EFD8', marginTop: 4 }}>
                    {money(num(selectedMentor.revenue))}
                  </div>
                  <div style={{ fontSize: 11, color: muted, marginTop: 3 }}>
                    {selectedMentor.confirmed} confirmed sessions
                  </div>
                </div>
              </div>
            </div>

            {/* Deep-dive Mentee & Activity Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)', gap: 16 }}>
              {/* Active Mentees List */}
              <div style={{ padding: 18, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.12)' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#F7EFD8', marginBottom: 12 }}>
                  Active Mentees & Engagements ({selectedMentor.mentees.length})
                </div>
                {selectedMentor.mentees.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedMentor.mentees.map((e: any) => (
                      <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#F7EFD8' }}>{e.name}</div>
                          <div style={{ fontSize: 11.5, color: dim, marginTop: 2 }}>
                            {e.sessions} {e.sessions === 1 ? 'session' : 'sessions'} · {money(e.spent)} {e.convo ? '· chat active' : ''}
                          </div>
                        </div>
                        <div style={{ fontSize: 11.5, color: dim, textAlign: 'right' }}>
                          {ago(e.last)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: dim, fontSize: 13 }}>
                    No active mentees recorded yet for this mentor. Mentee engagements will display automatically once confirmed bookings or chats begin.
                  </div>
                )}
              </div>

              {/* Qualifications & Availability */}
              <div style={{ padding: 18, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.12)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#F7EFD8', marginBottom: 6 }}>
                    Mentorship Approach & Profile
                  </div>
                  <div style={{ fontSize: 12.5, color: muted, lineHeight: 1.6 }}>
                    {selectedMentor.mentoring_approach || selectedMentor.bio || 'Dedicated Starfix mentor guiding learners towards personal and professional mastery.'}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(212,175,55,0.1)', paddingTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#D4AF37', marginBottom: 8 }}>Operational Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', rowGap: 8, fontSize: 12 }}>
                    <span style={{ color: dim }}>Availability:</span>
                    <span><Tag tone={availTone(selectedMentor.availability)}>{selectedMentor.availability || 'Schedule on request'}</Tag></span>
                    <span style={{ color: dim }}>Pricing:</span>
                    <span>{selectedMentor.free || selectedMentor.offers_free_intro ? 'Free intro available' : (price(selectedMentor.price) + ' / session')}</span>
                    <span style={{ color: dim }}>Location:</span>
                    <span>{selectedMentor.location || 'Remote'}</span>
                    {selectedMentor.education && (
                      <>
                        <span style={{ color: dim }}>Education:</span>
                        <span>{selectedMentor.education}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── C. REFINED MENTOR LIST / TABLE PRESENTATION ── */
          <div>
            {rankedMentors.length > 0 ? (
              <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(212,175,55,0.16)', background: 'rgba(10,14,35,0.5)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(212,175,55,0.07)', borderBottom: '1px solid rgba(212,175,55,0.16)' }}>
                      <th style={{ ...th, padding: '12px 16px' }}>Mentor</th>
                      <th style={{ ...th, padding: '12px 16px' }}>Specialization</th>
                      <th style={{ ...th, padding: '12px 16px', width: 220 }}>Mentee Reach</th>
                      <th style={{ ...th, padding: '12px 16px' }}>Sessions</th>
                      <th style={{ ...th, padding: '12px 16px' }}>Rating</th>
                      <th style={{ ...th, padding: '12px 16px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedMentors.map((x: any) => {
                      const primaryPath = getMentorPrimaryPath(x)
                      const reachPct = (num(x.liveMenteeCount) / maxMentees) * 100

                      return (
                        <tr
                          key={x.id}
                          style={{
                            borderBottom: '1px solid rgba(212,175,55,0.09)',
                            transition: 'background 140ms ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(212,175,55,0.05)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          {/* Mentor Column */}
                          <td style={{ ...td, padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <Avatar name={x.name} color={x.color} size={38} />
                              <div>
                                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#F7EFD8' }}>
                                  {x.name}
                                </div>
                                <div style={{ fontSize: 11.5, color: dim, marginTop: 2 }}>
                                  {x.headline}{x.company ? ' · ' + x.company : ''}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Specialization */}
                          <td style={{ ...td, padding: '14px 16px' }}>
                            <Tag tone="gold">{primaryPath}</Tag>
                            {toSkillsArray(x.skills).length > 0 && (
                              <span style={{ fontSize: 11, color: dim, marginLeft: 8 }}>
                                {toSkillsArray(x.skills).slice(0, 2).join(', ')}
                              </span>
                            )}
                          </td>

                          {/* Mentee Reach + Progress Bar */}
                          <td style={{ ...td, padding: '14px 16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#F4D67A' }}>
                                {num(x.liveMenteeCount).toLocaleString()} <span style={{ fontSize: 11, color: dim, fontWeight: 400 }}>mentees</span>
                              </span>
                              <span style={{ fontSize: 11, color: dim }}>
                                {Math.round(reachPct)}% share
                              </span>
                            </div>
                            <Bar pct={reachPct} h={6} />
                          </td>

                          {/* Sessions */}
                          <td style={{ ...td, padding: '14px 16px' }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#F7EFD8' }}>
                              {x.completed} completed
                            </div>
                            <div style={{ fontSize: 11, color: dim, marginTop: 2 }}>
                              {x.bookings} total bookings
                            </div>
                          </td>

                          {/* Rating */}
                          <td style={{ ...td, padding: '14px 16px' }}>
                            <div style={{ fontSize: 13, color: '#F4D67A', fontWeight: 600 }}>
                              ★ {num(x.rating).toFixed(1)}
                            </div>
                            <div style={{ fontSize: 11, color: dim, marginTop: 2 }}>
                              {x.reviewCount ? `${x.reviewCount} reviews` : 'Catalog'}
                            </div>
                          </td>

                          {/* Action Button */}
                          <td style={{ ...td, padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => setSelectedMentorId(x.id)}
                                style={{
                                  ...btn,
                                  padding: '5px 10px',
                                  fontSize: 11.5,
                                  color: '#F7EFD8',
                                  border: '1px solid rgba(255,255,255,0.12)'
                                }}
                                title="Inspect in spotlight view"
                              >
                                Spotlight
                              </button>
                              <button
                                type="button"
                                onClick={() => setDrawerMentorId(x.id)}
                                style={{
                                  ...btn,
                                  padding: '5px 10px',
                                  fontSize: 11.5,
                                  color: '#F4D67A',
                                  border: '1px solid rgba(212,175,55,0.35)',
                                  background: 'rgba(212,175,55,0.08)',
                                  fontWeight: 600
                                }}
                                title="Open deep admin profile view"
                              >
                                Deep Profile ↗
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '36px 16px', textAlign: 'center', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.1)' }}>
                <div style={{ fontSize: 15, color: '#F7EFD8', fontWeight: 600 }}>
                  No mentors found for "{selectedPath}"
                </div>
                <div style={{ fontSize: 13, color: dim, marginTop: 6, maxWidth: 460, margin: '6px auto 16px' }}>
                  There are currently no mentors associated with this growth path in the database.
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPath('All Growth Paths')}
                  style={{ ...btn, color: '#F4D67A', borderColor: 'rgba(212,175,55,0.4)' }}
                >
                  Reset to All Growth Paths
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── 2. LIVE PAIRINGS SECTION ── */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 20, fontWeight: 600, color: '#F7EFD8' }}>
              Live Learner–Mentor Pairings
            </div>
            <div style={{ fontSize: 12.5, color: dim, marginTop: 3 }}>
              Each learner who has booked sessions or exchanged messages with a mentor
            </div>
          </div>
          {selectedPath !== 'All Growth Paths' && (
            <Tag tone="gold">Filtered by {selectedPath}</Tag>
          )}
        </div>

        {filteredPairings.length ? (
          filteredPairings.map((x: any) => (
            <div key={x.id} style={{ padding: '14px 0', borderTop: '1px solid rgba(212,175,55,.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <Avatar name={x.name} color={x.color} size={36} />
                <b>{x.name}</b>
                <Tag>{getMentorPrimaryPath(x)}</Tag>
              </div>
              {x.mentees.map((e: any) => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0 5px 48px' }}>
                  <span>{e.name}</span>
                  <span style={{ color: dim }}>{e.sessions} sessions · {money(e.spent)} · {e.convo ? 'chatting · ' : ''}{ago(e.last)}</span>
                </div>
              ))}
            </div>
          ))
        ) : (
          <Empty>
            {selectedPath !== 'All Growth Paths'
              ? `No pairings found for "${selectedPath}". Try selecting All Growth Paths.`
              : 'No learner–mentor pairings yet. A pairing appears here the moment a learner books a session or starts a conversation.'}
          </Empty>
        )}
      </Card>

      {drawerMentorId && (
        <MentorDetailDrawer
          mentorId={drawerMentorId}
          initialMentor={m?.mentors?.find((x: any) => x.id === drawerMentorId)}
          onClose={() => setDrawerMentorId(null)}
          onUpdate={load}
        />
      )}
    </PageShell>
  )
}

