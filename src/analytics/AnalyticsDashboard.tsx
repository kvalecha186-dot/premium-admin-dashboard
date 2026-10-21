// ── Analytics & Intelligence ─────────────────────────────────────────────────
// One unified, database-derived analytics page: executive summary, momentum,
// learning outcomes and user geography. Every figure is computed from the live
// Supabase tables returned by getEcosystem(); when data does not exist the UI
// shows zero / unavailable — never a placeholder number.

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Card, Icon, icons, PageShell } from '../shared'
import { getEcosystem } from '../adminBackend'

// ── Theme tokens (matches the existing navy & gold system) ───────────────────
const GOLD = '#D4AF37'
const GOLD_L = '#F4D67A'
const INK = '#F7EFD8'
const MUTED = '#9AA0BA'
const DIM = '#8A90AB'
const FAINT = '#6B7190'
const GREEN = '#4ADE80'
const AMBER = '#FBBF24'
const RED = '#F87171'
const PURPLE = '#C4B5FD'
const LINE = 'rgba(212,175,55,.16)'
const SERIF = 'Playfair Display, serif'

const DAY = 86400000
const WEEK = 7 * DAY
const WEEKS = 12

const num = (v: any) => Number(v) || 0
const ts = (v: any) => {
  const t = v ? Date.parse(v) : NaN
  return isNaN(t) ? 0 : t
}
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
const int = (n: number) => Math.round(n).toLocaleString('en-IN')

// ── Data computation ─────────────────────────────────────────────────────────
function weeklySeries(rows: any[], pick: (r: any) => number, weight: (r: any) => number = () => 1) {
  const now = Date.now()
  const out: number[] = Array(WEEKS).fill(0)
  rows.forEach(r => {
    const t = pick(r)
    if (!t) return
    const age = Math.max(0, now - t)
    if (age >= WEEKS * WEEK) return
    out[WEEKS - 1 - Math.floor(age / WEEK)] += weight(r)
  })
  return out
}

function windowTotals(rows: any[], pick: (r: any) => number, weight: (r: any) => number = () => 1) {
  const now = Date.now()
  let cur = 0
  let prev = 0
  rows.forEach(r => {
    const t = pick(r)
    if (!t) return
    const age = Math.max(0, now - t)
    if (age < WEEK) cur += weight(r)
    else if (age < 2 * WEEK) prev += weight(r)
  })
  return { cur, prev }
}

function tidyCountry(raw: any): string {
  const s = String(raw || '').trim()
  if (!s) return 'Not specified'
  return s === s.toLowerCase() ? s.replace(/\b\w/g, c => c.toUpperCase()) : s
}

function compute(e: any) {
  const now = Date.now()
  const profiles: any[] = e.profiles || []
  const mentors: any[] = e.mentors || []
  const progress: any[] = e.progress || []
  const bookings: any[] = e.bookings || []
  const reviews: any[] = e.reviews || []
  const notifications: any[] = e.notifications || []
  const saved: any[] = e.savedItems || []
  const paths: any[] = e.paths || []

  const mentorProfileIds = new Set(mentors.map(m => m.profile_id).filter(Boolean))
  const learnerProfiles = profiles.filter(p => p.role !== 'admin' && p.role !== 'mentor' && !mentorProfileIds.has(p.id))

  // Learners
  const learnerWeekly = weeklySeries(learnerProfiles, p => ts(p.created_at))
  const baseline = learnerProfiles.filter(p => {
    const t = ts(p.created_at)
    return !t || now - t >= WEEKS * WEEK
  }).length
  let run = baseline
  const learnerCumulative = learnerWeekly.map(v => (run += v))
  const learnerDelta = windowTotals(learnerProfiles, p => ts(p.created_at))

  // Bookings
  const st = (b: any) => String(b.status || '').toLowerCase()
  const completed = bookings.filter(b => st(b) === 'completed')
  const confirmed = bookings.filter(b => st(b) === 'confirmed')
  const pending = bookings.filter(b => ['pending', 'requested'].includes(st(b)))
  const cancelled = bookings.filter(b => ['cancelled', 'canceled', 'failed'].includes(st(b)))
  const other = bookings.length - completed.length - confirmed.length - pending.length - cancelled.length
  const recognised = [...completed, ...confirmed]
  const revenue = recognised.reduce((s, b) => s + num(b.amount), 0)
  const bookingWeekly = weeklySeries(bookings, b => ts(b.created_at))
  const revenueWeekly = weeklySeries(recognised, b => ts(b.created_at), b => num(b.amount))
  const bookingDelta = windowTotals(bookings, b => ts(b.created_at))
  const revenueDelta = windowTotals(recognised, b => ts(b.created_at), b => num(b.amount))
  const activeMentees = new Set(recognised.map(b => b.student_id).filter(Boolean)).size

  // Mentors
  const mentorWeekly = weeklySeries(mentors, m => ts(m.created_at))
  const mentorDelta = windowTotals(mentors, m => ts(m.created_at))

  // Progress / engagement
  const active7 = new Set(progress.filter(p => ts(p.last_active_date) >= now - WEEK).map(p => p.user_id)).size
  const progressVals = progress.map(p => num(p.overall_progress))
  const avgProgress = progress.length ? Math.round(progressVals.reduce((a, b) => a + b, 0) / progress.length) : null
  const completedPaths = progressVals.filter(v => v >= 100).length
  const completionRate = progress.length ? Math.round((completedPaths / progress.length) * 100) : null
  const totalXp = progress.reduce((s, p) => s + num(p.xp), 0)
  const buckets = [0, 0, 0, 0, 0]
  progressVals.forEach(v => {
    buckets[v >= 100 ? 4 : v >= 75 ? 3 : v >= 50 ? 2 : v >= 25 ? 1 : 0]++
  })

  // Reviews
  const avgRating = reviews.length ? Math.round((reviews.reduce((s, r) => s + num(r.rating), 0) / reviews.length) * 10) / 10 : null

  // Top growth paths
  const byPath = new Map<string, { n: number; sum: number }>()
  progress.forEach(p => {
    const c = byPath.get(p.path_id) || { n: 0, sum: 0 }
    c.n += 1
    c.sum += num(p.overall_progress)
    byPath.set(p.path_id, c)
  })
  const topPaths = paths
    .map(p => {
      const c = byPath.get(p.id) || { n: 0, sum: 0 }
      return { id: p.id, title: p.title || p.name || 'Untitled path', category: p.category || '', enrolled: c.n, avg: c.n ? Math.round(c.sum / c.n) : 0 }
    })
    .sort((a, b) => b.enrolled - a.enrolled || b.avg - a.avg)
    .slice(0, 5)

  // Geography (real profile country; mentors fall back to their listed location)
  const profileById = new Map<string, any>(profiles.map(p => [p.id, p]))
  const geo: { role: 'learner' | 'mentor'; country: string }[] = []
  learnerProfiles.forEach(p => geo.push({ role: 'learner', country: tidyCountry(p.country) }))
  mentors.forEach(m => {
    let c = ''
    if (m.location && String(m.location).includes(',')) c = String(m.location).split(',').pop() || ''
    else if (m.location && String(m.location).trim().toLowerCase() !== 'remote') c = String(m.location)
    if (!c.trim()) c = profileById.get(m.profile_id)?.country || ''
    geo.push({ role: 'mentor', country: tidyCountry(c) })
  })

  const recordsAnalysed = Object.values(e).reduce<number>((s, v) => s + (Array.isArray(v) ? v.length : 0), 0)

  return {
    learners: learnerProfiles.length,
    learnerCumulative,
    learnerDelta,
    mentors: mentors.length,
    mentorWeekly,
    mentorDelta,
    activeMentees,
    bookings: bookings.length,
    bookingWeekly,
    bookingDelta,
    revenue,
    revenueWeekly,
    revenueDelta,
    recognisedCount: recognised.length,
    learnerWeekly,
    statusSegments: [
      { label: 'Completed', value: completed.length, color: GREEN },
      { label: 'Confirmed', value: confirmed.length, color: GOLD },
      { label: 'Pending', value: pending.length, color: AMBER },
      { label: 'Cancelled', value: cancelled.length, color: RED },
      { label: 'Other', value: Math.max(0, other), color: DIM }
    ],
    active7,
    avgProgress,
    completedPaths,
    completionRate,
    progressRecords: progress.length,
    totalXp,
    buckets,
    reviews: reviews.length,
    avgRating,
    saved: saved.length,
    notifications: notifications.length,
    pathsCount: paths.length,
    topPaths,
    geo,
    recordsAnalysed
  }
}

type Metrics = ReturnType<typeof compute>

// ── Small visual primitives ──────────────────────────────────────────────────
function CountUp({ value, format = int }: { value: number; format?: (n: number) => string }) {
  const [v, setV] = useState(0)
  const from = useRef(0)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setV(value)
      from.current = value
      return
    }
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 900)
      const eased = 1 - Math.pow(1 - p, 3)
      const cur = a + (value - a) * eased
      setV(cur)
      from.current = cur
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{format(v)}</>
}

function smoothPath(pts: [number, number][], base: number) {
  if (pts.length < 2) return ''
  const clamp = (y: number) => Math.min(base, y)
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const t = 0.18
    const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) * t, clamp(p1[1] + (p2[1] - p0[1]) * t)]
    const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) * t, clamp(p2[1] - (p3[1] - p1[1]) * t)]
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`
  }
  return d
}

function Spark({ data, color = GOLD, w = 132, h = 38 }: { data: number[]; color?: string; w?: number; h?: number }) {
  const id = useId().replace(/:/g, '')
  const max = Math.max(...data, 0)
  const base = h - 3
  if (max === 0) {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <line x1="0" y1={base} x2={w} y2={base} stroke="rgba(255,255,255,.14)" strokeWidth="1.5" strokeDasharray="3 4" />
      </svg>
    )
  }
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, base - (v / max) * (h - 9)] as [number, number])
  const line = smoothPath(pts, base)
  const last = pts[pts.length - 1]
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sp${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${base} L0,${base} Z`} fill={`url(#sp${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} stroke="#0A1030" strokeWidth="1.5" />
    </svg>
  )
}

function Delta({ cur, prev, format = int, unit = 'this week' }: { cur: number; prev: number; format?: (n: number) => string; unit?: string }) {
  const up = cur > 0
  const pct = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null
  const color = up ? GREEN : DIM
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 99,
        fontSize: 11.5,
        fontWeight: 600,
        color,
        background: up ? 'rgba(74,222,128,.1)' : 'rgba(255,255,255,.05)',
        border: `1px solid ${up ? 'rgba(74,222,128,.28)' : 'rgba(255,255,255,.1)'}`,
        whiteSpace: 'nowrap'
      }}
    >
      {up && <Icon d={icons.trendUp} size={11} />}
      {up ? `+${format(cur)} ${unit}` : `No change ${unit}`}
      {up && pct !== null && <span style={{ opacity: 0.75, fontWeight: 500 }}>· {pct >= 0 ? '+' : ''}{pct}%</span>}
    </span>
  )
}

function SectionHead({ eyebrow, title, hint, right }: { eyebrow: string; title: string; hint?: string; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, margin: '44px 0 16px', flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: GOLD, fontWeight: 600 }}>{eyebrow}</div>
        <div style={{ fontFamily: SERIF, fontSize: 23, fontWeight: 500, color: INK, marginTop: 5 }}>{title}</div>
        {hint && <div style={{ fontSize: 13, color: DIM, marginTop: 4, maxWidth: 620 }}>{hint}</div>}
      </div>
      {right}
    </div>
  )
}

function IconBadge({ d, tone = GOLD }: { d: string; tone?: string }) {
  return (
    <span
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        display: 'grid',
        placeItems: 'center',
        color: tone,
        background: 'linear-gradient(145deg, rgba(212,175,55,.2), rgba(212,175,55,.04))',
        border: '1px solid rgba(212,175,55,.3)',
        flexShrink: 0
      }}
    >
      <Icon d={d} size={16} />
    </span>
  )
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,.04)', padding: 3, borderRadius: 10, border: `1px solid ${LINE}` }}>
      {options.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          style={{
            padding: '6px 13px',
            borderRadius: 7,
            border: 0,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: value === o.id ? 600 : 500,
            color: value === o.id ? '#070A1A' : MUTED,
            background: value === o.id ? `linear-gradient(135deg, ${GOLD_L}, ${GOLD})` : 'transparent'
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: '30px 12px', textAlign: 'center', color: DIM, fontSize: 13, lineHeight: 1.6 }}>
      {children}
    </div>
  )
}

// ── Hero headline stat ───────────────────────────────────────────────────────
function HeroStat(props: {
  icon: string
  label: string
  value: number
  format?: (n: number) => string
  series: number[]
  delta: { cur: number; prev: number }
  deltaFormat?: (n: number) => string
  caption: string
  color?: string
}) {
  return (
    <div
      style={{
        padding: '20px 20px 16px',
        borderRadius: 14,
        background: 'linear-gradient(160deg, rgba(255,255,255,.055), rgba(255,255,255,.015))',
        border: '1px solid rgba(212,175,55,.18)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 0
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <IconBadge d={props.icon} />
        <span style={{ fontSize: 12, color: MUTED, letterSpacing: '.04em', fontWeight: 500 }}>{props.label}</span>
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 40,
          fontWeight: 600,
          lineHeight: 1.05,
          background: 'linear-gradient(180deg,#FFF3C4,#D4AF37)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent'
        }}
      >
        <CountUp value={props.value} format={props.format} />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <Delta cur={props.delta.cur} prev={props.delta.prev} format={props.deltaFormat} />
          <div style={{ fontSize: 11.5, color: DIM, marginTop: 8 }}>{props.caption}</div>
        </div>
        <Spark data={props.series} color={props.color || GOLD} w={96} h={34} />
      </div>
    </div>
  )
}

// ── Secondary metric tile ────────────────────────────────────────────────────
type Tile = { icon: string; label: string; value: number | null; format?: (n: number) => string; caption: string; meter?: number | null; tone?: string }

function MetricTile({ t }: { t: Tile }) {
  return (
    <Card style={{ padding: 20, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        aria-hidden="true"
        style={{ position: 'absolute', right: -34, top: -34, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,.16), transparent 70%)', pointerEvents: 'none' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <IconBadge d={t.icon} tone={t.tone} />
        <span style={{ fontSize: 12.5, color: MUTED, fontWeight: 500 }}>{t.label}</span>
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 600, color: t.value === null ? FAINT : INK, lineHeight: 1.1 }}>
        {t.value === null ? '—' : <CountUp value={t.value} format={t.format} />}
      </div>
      <div style={{ marginTop: 'auto' }}>
        {t.meter !== undefined && t.meter !== null && (
          <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,.07)', overflow: 'hidden', marginBottom: 9 }}>
            <div style={{ width: `${Math.max(2, Math.min(100, t.meter))}%`, height: '100%', borderRadius: 99, background: `linear-gradient(90deg, #B8901F, ${GOLD_L})`, transition: 'width .6s ease' }} />
          </div>
        )}
        <div style={{ fontSize: 12, color: DIM, lineHeight: 1.45 }}>{t.caption}</div>
      </div>
    </Card>
  )
}

// ── Momentum chart ───────────────────────────────────────────────────────────
function weekLabel(i: number) {
  const d = new Date(Date.now() - (WEEKS - 1 - i) * WEEK)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function MomentumChart({ learners, bookings }: { learners: number[]; bookings: number[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const id = useId().replace(/:/g, '')
  const W = 720
  const H = 250
  const L = 34
  const R = 14
  const T = 16
  const B = 28
  const iw = W - L - R
  const ih = H - T - B
  const rawMax = Math.max(...learners, ...bookings, 0)
  const step = Math.max(1, Math.ceil(Math.max(rawMax, 4) / 4))
  const maxY = step * 4
  const x = (i: number) => L + (i * iw) / (WEEKS - 1)
  const y = (v: number) => T + ih - (v / maxY) * ih
  const base = T + ih
  const mk = (d: number[]) => d.map((v, i) => [x(i), y(v)] as [number, number])
  const lp = mk(learners)
  const bp = mk(bookings)
  const lLine = smoothPath(lp, base)
  const bLine = smoothPath(bp, base)
  const empty = rawMax === 0

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }} role="img" aria-label="Weekly new learners and bookings over the last 12 weeks">
        <defs>
          <linearGradient id={`la${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity=".38" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map(i => (
          <g key={i}>
            <line x1={L} x2={W - R} y1={y(i * step)} y2={y(i * step)} stroke="rgba(255,255,255,.07)" strokeDasharray={i === 0 ? '0' : '3 5'} />
            <text x={L - 8} y={y(i * step) + 4} textAnchor="end" fontSize="10.5" fill={FAINT}>{i * step}</text>
          </g>
        ))}
        {learners.map((_, i) =>
          i % 2 === (WEEKS - 1) % 2 ? (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10.5" fill={FAINT}>{weekLabel(i)}</text>
          ) : null
        )}
        {!empty && (
          <>
            <path d={`${lLine} L${x(WEEKS - 1)},${base} L${x(0)},${base} Z`} fill={`url(#la${id})`} />
            <path d={bLine} fill="none" stroke={PURPLE} strokeWidth="2" strokeLinecap="round" strokeDasharray="1 0" opacity=".9" />
            <path d={lLine} fill="none" stroke={GOLD_L} strokeWidth="2.6" strokeLinecap="round" />
          </>
        )}
        {hover !== null && !empty && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={T} y2={base} stroke="rgba(244,214,122,.35)" strokeDasharray="3 4" />
            <circle cx={x(hover)} cy={y(learners[hover])} r="5" fill={GOLD_L} stroke="#0A1030" strokeWidth="2" />
            <circle cx={x(hover)} cy={y(bookings[hover])} r="4.5" fill={PURPLE} stroke="#0A1030" strokeWidth="2" />
          </g>
        )}
        {learners.map((_, i) => (
          <rect
            key={i}
            x={x(i) - iw / (WEEKS - 1) / 2}
            y={T}
            width={iw / (WEEKS - 1)}
            height={ih}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      {empty && (
        <div style={{ position: 'absolute', inset: '0 0 28px 34px', display: 'grid', placeItems: 'center', pointerEvents: 'none', textAlign: 'center', color: DIM, fontSize: 13, padding: '0 24px' }}>
          No sign-ups or bookings recorded in the last 12 weeks.
        </div>
      )}
      {hover !== null && !empty && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${Math.min(86, Math.max(14, (x(hover) / W) * 100))}%`,
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            background: 'rgba(7,10,26,.96)',
            border: '1px solid rgba(212,175,55,.4)',
            borderRadius: 10,
            padding: '9px 12px',
            fontSize: 12,
            color: INK,
            boxShadow: '0 12px 30px rgba(0,0,0,.55)',
            whiteSpace: 'nowrap',
            zIndex: 3
          }}
        >
          <div style={{ color: DIM, fontSize: 11, marginBottom: 5 }}>Week ending {weekLabel(hover)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: 99, background: GOLD_L }} />New learners <b style={{ marginLeft: 'auto', paddingLeft: 14 }}>{learners[hover]}</b></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3 }}><span style={{ width: 8, height: 8, borderRadius: 99, background: PURPLE }} />Bookings <b style={{ marginLeft: 'auto', paddingLeft: 14 }}>{bookings[hover]}</b></div>
        </div>
      )}
    </div>
  )
}

// ── Booking donut ────────────────────────────────────────────────────────────
function Donut({ segments, total }: { segments: { label: string; value: number; color: string }[]; total: number }) {
  const r = 62
  const c = 2 * Math.PI * r
  const live = segments.filter(s => s.value > 0)
  const gap = live.length > 1 ? 5 : 0
  let acc = 0
  return (
    <svg viewBox="0 0 160 160" width="100%" style={{ maxWidth: 176, display: 'block' }} role="img" aria-label="Bookings by status">
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="14" strokeDasharray={total === 0 ? '2 6' : undefined} />
      {total > 0 &&
        live.map(s => {
          const len = (s.value / total) * c
          const dash = Math.max(0, len - gap)
          const el = (
            <circle key={s.label} cx="80" cy="80" r={r} fill="none" stroke={s.color} strokeWidth="14" strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-acc} transform="rotate(-90 80 80)" />
          )
          acc += len
          return el
        })}
      <text x="80" y="82" textAnchor="middle" fontFamily={SERIF} fontSize="32" fontWeight="600" fill={INK}>{total}</text>
      <text x="80" y="101" textAnchor="middle" fontSize="10.5" letterSpacing="1.5" fill={DIM}>BOOKINGS</text>
    </svg>
  )
}

// ── Geography ────────────────────────────────────────────────────────────────
type Scope = 'all' | 'learners' | 'mentors'

function GeographySection({ geo }: { geo: Metrics['geo'] }) {
  const [scope, setScope] = useState<Scope>('all')
  const rows = geo.filter(g => scope === 'all' || (scope === 'learners' ? g.role === 'learner' : g.role === 'mentor'))
  const total = rows.length
  const map = new Map<string, { name: string; learners: number; mentors: number }>()
  rows.forEach(g => {
    const c = map.get(g.country) || { name: g.country, learners: 0, mentors: 0 }
    if (g.role === 'learner') c.learners += 1
    else c.mentors += 1
    map.set(g.country, c)
  })
  const all = [...map.values()].map(c => ({ ...c, total: c.learners + c.mentors }))
  const known = all.filter(c => c.name !== 'Not specified').sort((a, b) => b.total - a.total)
  const unknown = all.find(c => c.name === 'Not specified')
  const shown = known.slice(0, 7)
  const rest = known.slice(7)
  if (rest.length) shown.push({ name: `${rest.length} other ${rest.length === 1 ? 'region' : 'regions'}`, learners: rest.reduce((s, c) => s + c.learners, 0), mentors: rest.reduce((s, c) => s + c.mentors, 0), total: rest.reduce((s, c) => s + c.total, 0) })
  const maxT = Math.max(...shown.map(s => s.total), 1)
  const specified = total - (unknown?.total || 0)
  const coverage = total ? Math.round((specified / total) * 100) : null
  const top = known[0]
  const topShare = top && total ? Math.round((top.total / total) * 100) : null

  const insight = (label: string, value: string, caption: string) => (
    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,.03)', border: `1px solid ${LINE}` }}>
      <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: DIM }}>{label}</div>
      <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: value === '—' ? FAINT : GOLD_L, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      <div style={{ fontSize: 11.5, color: DIM, marginTop: 2 }}>{caption}</div>
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18 }}>
      <Card style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 18, color: INK }}>Regional distribution</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 11.5, color: DIM }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><i style={{ width: 8, height: 8, borderRadius: 99, background: GOLD, display: 'inline-block' }} />Learners</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><i style={{ width: 8, height: 8, borderRadius: 99, background: PURPLE, display: 'inline-block' }} />Mentors</span>
            </div>
          </div>
          <Segmented<Scope>
            value={scope}
            onChange={setScope}
            options={[{ id: 'all', label: 'All users' }, { id: 'learners', label: 'Learners' }, { id: 'mentors', label: 'Mentors' }]}
          />
        </div>

        {shown.length === 0 ? (
          <Empty>No users with a recorded country yet. Regions appear here as profiles are completed.</Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {shown.map((s, i) => (
              <div key={s.name}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 7 }}>
                  <span
                    style={{
                      width: 24, height: 24, borderRadius: 7, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
                      color: i < 3 ? '#0A0E1F' : MUTED,
                      background: i < 3 ? `linear-gradient(135deg, ${GOLD_L}, ${GOLD})` : 'rgba(255,255,255,.06)'
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: INK, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                  <span style={{ fontSize: 12, color: DIM }}>{s.learners} learners · {s.mentors} mentors</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: GOLD_L, minWidth: 48, textAlign: 'right' }}>{total ? Math.round((s.total / total) * 100) : 0}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${(s.total / maxT) * 100}%`, height: '100%', display: 'flex', borderRadius: 99, overflow: 'hidden', transition: 'width .5s ease' }}>
                    <div style={{ flex: s.learners, background: `linear-gradient(90deg, #B8901F, ${GOLD_L})` }} />
                    <div style={{ flex: s.mentors, background: `linear-gradient(90deg, #8B7FD6, ${PURPLE})` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {insight('Countries represented', known.length ? String(known.length) : '—', 'With a recorded location')}
        {insight('Leading region', top ? top.name : '—', topShare !== null ? `${topShare}% of ${scope === 'all' ? 'all users' : scope}` : 'No location data yet')}
        <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,.03)', border: `1px solid ${LINE}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: DIM }}>Location coverage</div>
            <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: coverage === null ? FAINT : INK }}>{coverage === null ? '—' : `${coverage}%`}</div>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,.07)', margin: '10px 0 8px', overflow: 'hidden' }}>
            <div style={{ width: `${coverage || 0}%`, height: '100%', borderRadius: 99, background: `linear-gradient(90deg, #B8901F, ${GOLD_L})` }} />
          </div>
          <div style={{ fontSize: 11.5, color: DIM, lineHeight: 1.5 }}>
            {unknown?.total ? `${unknown.total} ${unknown.total === 1 ? 'profile has' : 'profiles have'} no country on file.` : 'Every profile in scope has a country on file.'}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
function Skeleton({ h, r = 16 }: { h: number; r?: number }) {
  return <div style={{ height: h, borderRadius: r, background: 'linear-gradient(100deg, rgba(255,255,255,.04) 30%, rgba(212,175,55,.09) 50%, rgba(255,255,255,.04) 70%)', backgroundSize: '200% 100%', animation: 'sxShimmer 1.4s linear infinite' }} />
}

export function AnalyticsDashboard() {
  const [eco, setEco] = useState<any>(null)
  const [updatedAt, setUpdatedAt] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const r = await getEcosystem()
      setEco(r)
      setUpdatedAt(Date.now())
      setFailed(false)
    } catch {
      setFailed(true)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(() => load(), 30000)
    return () => clearInterval(t)
  }, [load])

  const m = useMemo(() => (eco ? compute(eco) : null), [eco])

  const tz = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-IN', { timeZoneName: 'long' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || ''
    } catch {
      return ''
    }
  }, [])

  const refreshBtn = (
    <button
      onClick={() => load(true)}
      disabled={refreshing}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 15px', borderRadius: 10, border: '1px solid rgba(212,175,55,.3)', background: 'rgba(212,175,55,.08)', color: GOLD_L, fontSize: 12.5, fontWeight: 600, cursor: refreshing ? 'default' : 'pointer', opacity: refreshing ? 0.7 : 1 }}
    >
      <span style={{ display: 'inline-flex', animation: refreshing ? 'sxSpin 0.9s linear infinite' : 'none' }}>
        <Icon d="M21 12a9 9 0 11-3-6.7M21 4v5h-5" size={14} />
      </span>
      {refreshing ? 'Refreshing…' : 'Refresh'}
    </button>
  )

  const styles = (
    <style>{`
      @keyframes sxShimmer{from{background-position:200% 0}to{background-position:-200% 0}}
      @keyframes sxSpin{to{transform:rotate(360deg)}}
      @keyframes sxPulseDot{0%{box-shadow:0 0 0 0 rgba(74,222,128,.55)}70%{box-shadow:0 0 0 8px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}
      @media (prefers-reduced-motion:reduce){.sx-an *{animation:none!important}}
    `}</style>
  )

  if (!m) {
    return (
      <PageShell title="Analytics & Intelligence" subtitle="A clear, database-backed view of Starfix growth, engagement and mentorship activity.">
        {styles}
        <div style={{ display: 'grid', gap: 16 }}>
          <Skeleton h={300} r={20} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
            {[0, 1, 2, 3].map(i => <Skeleton key={i} h={150} />)}
          </div>
          {failed && <div style={{ color: RED, fontSize: 13 }}>Could not reach the database. Retrying automatically…</div>}
        </div>
      </PageShell>
    )
  }

  const tiles: Tile[] = [
    { icon: icons.activity, label: 'Active in 7 days', value: m.active7, caption: m.learners ? `${Math.min(100, Math.round((m.active7 / m.learners) * 100))}% of learners showed recent activity` : 'Unique users with recent progress activity', meter: m.learners ? (m.active7 / m.learners) * 100 : null },
    { icon: icons.target, label: 'Average progress', value: m.avgProgress, format: n => `${Math.round(n)}%`, caption: `Across ${int(m.progressRecords)} progress ${m.progressRecords === 1 ? 'record' : 'records'}`, meter: m.avgProgress },
    { icon: icons.award, label: 'Completed paths', value: m.completedPaths, caption: m.completionRate !== null ? `${m.completionRate}% completion rate` : 'No progress records yet', meter: m.completionRate },
    { icon: icons.sparkles, label: 'Total XP earned', value: m.totalXp, caption: 'Recorded across all progress rows' },
    { icon: icons.star, label: 'Average rating', value: m.avgRating, format: n => n.toFixed(1), caption: `${int(m.reviews)} verified ${m.reviews === 1 ? 'review' : 'reviews'}`, meter: m.avgRating !== null ? (m.avgRating / 5) * 100 : null },
    { icon: icons.tag, label: 'Saved resources', value: m.saved, caption: 'Items bookmarked by learners' },
    { icon: icons.bell, label: 'Notifications sent', value: m.notifications, caption: 'Generated by the platform' },
    { icon: icons.layers, label: 'Growth paths', value: m.pathsCount, caption: 'Learning journeys available' }
  ]

  const statusTotal = m.statusSegments.reduce((s, x) => s + x.value, 0)
  const maxBucket = Math.max(...m.buckets, 1)
  const bucketLabels = ['0–24%', '25–49%', '50–74%', '75–99%', 'Completed']
  const learnerSum = m.learnerWeekly.reduce((a, b) => a + b, 0)
  const bookingSum = m.bookingWeekly.reduce((a, b) => a + b, 0)

  return (
    <PageShell
      title="Analytics & Intelligence"
      subtitle="A clear, database-backed view of Starfix growth, engagement and mentorship activity."
      action={refreshBtn}
    >
      <div className="sx-an">
        {styles}

        {/* ── Hero: Platform Pulse ── */}
        <Card
          style={{
            padding: 0,
            overflow: 'hidden',
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(22,34,86,.94) 0%, rgba(9,13,36,.97) 62%)',
            borderColor: 'rgba(212,175,55,.3)'
          }}
        >
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(620px 260px at 92% -10%, rgba(212,175,55,.2), transparent 70%)', pointerEvents: 'none' }} />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5,
              backgroundImage: 'linear-gradient(rgba(212,175,55,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,.05) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              WebkitMaskImage: 'linear-gradient(200deg, #000 5%, transparent 65%)',
              maskImage: 'linear-gradient(200deg, #000 5%, transparent 65%)'
            }}
          />
          <div style={{ position: 'relative', padding: '30px 30px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ maxWidth: 640 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: GOLD, fontWeight: 600 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: GREEN, animation: 'sxPulseDot 2s infinite' }} />
                  Starfix platform pulse
                </div>
                <div style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 500, color: INK, marginTop: 10, lineHeight: 1.18 }}>
                  Measure what is{' '}
                  <span style={{ background: 'linear-gradient(100deg,#FFF3C4,#D4AF37)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>actually happening.</span>
                </div>
                <p style={{ margin: '12px 0 0', fontSize: 13.5, lineHeight: 1.65, color: MUTED }}>
                  Every figure is calculated from persisted Supabase records. Where data does not exist yet, Starfix shows zero or unavailable — never a placeholder.
                </p>
              </div>
              <div style={{ padding: '14px 18px', borderRadius: 14, background: 'rgba(255,255,255,.04)', border: `1px solid ${LINE}`, minWidth: 190 }}>
                <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: DIM }}>Latest calculation</div>
                <div style={{ fontFamily: SERIF, fontSize: 24, color: GOLD_L, marginTop: 4 }}>
                  {new Date(updatedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                </div>
                <div style={{ fontSize: 11.5, color: DIM, marginTop: 2 }}>{tz || 'Local time'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '20px 0 22px' }}>
              {[
                ['Source', 'Supabase · live'],
                ['Records analysed', int(m.recordsAnalysed)],
                ['Auto-refresh', 'Every 30 seconds']
              ].map(([k, v]) => (
                <span key={k} style={{ fontSize: 11.5, color: MUTED, padding: '5px 12px', borderRadius: 99, background: 'rgba(255,255,255,.04)', border: `1px solid ${LINE}` }}>
                  {k}: <b style={{ color: INK, fontWeight: 600 }}>{v}</b>
                </span>
              ))}
            </div>

            {m.recordsAnalysed === 0 && (
              <div style={{ marginBottom: 18, padding: '10px 14px', borderRadius: 10, fontSize: 12.5, color: AMBER, background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.28)' }}>
                No records were returned. If you expect data, check the Supabase connection and Row Level Security policies for the admin role.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
              <HeroStat icon={icons.users} label="Learners" value={m.learners} series={m.learnerCumulative} delta={m.learnerDelta} caption="Registered learner profiles" />
              <HeroStat icon={icons.mentors} label="Mentors" value={m.mentors} series={m.mentorWeekly} delta={m.mentorDelta} caption={`${int(m.activeMentees)} active ${m.activeMentees === 1 ? 'mentee' : 'mentees'}`} color={PURPLE} />
              <HeroStat icon={icons.calendar} label="Bookings" value={m.bookings} series={m.bookingWeekly} delta={m.bookingDelta} caption={`${int(m.recognisedCount)} confirmed or completed`} />
              <HeroStat icon={icons.dollar} label="Recognised revenue" value={m.revenue} format={inr} series={m.revenueWeekly} delta={m.revenueDelta} deltaFormat={inr} caption="Confirmed & completed bookings" color={GREEN} />
            </div>
          </div>
        </Card>

        {/* ── Engagement & quality ── */}
        <SectionHead eyebrow="Executive summary" title="Engagement & quality" hint="How learners are progressing and how the platform is perceived." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
          {tiles.map(t => <MetricTile key={t.label} t={t} />)}
        </div>

        {/* ── Momentum ── */}
        <SectionHead eyebrow="Momentum" title="Growth over the last 12 weeks" hint="New learner sign-ups and bookings created per week." />
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 18 }}>
          <Card style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 22 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: MUTED }}><i style={{ width: 9, height: 9, borderRadius: 99, background: GOLD_L, display: 'inline-block' }} />New learners</div>
                  <div style={{ fontFamily: SERIF, fontSize: 24, color: INK, marginTop: 2 }}>{int(learnerSum)}</div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: MUTED }}><i style={{ width: 9, height: 9, borderRadius: 99, background: PURPLE, display: 'inline-block' }} />Bookings</div>
                  <div style={{ fontFamily: SERIF, fontSize: 24, color: INK, marginTop: 2 }}>{int(bookingSum)}</div>
                </div>
              </div>
              <span style={{ fontSize: 11.5, color: DIM }}>Hover a week for detail</span>
            </div>
            <MomentumChart learners={m.learnerWeekly} bookings={m.bookingWeekly} />
          </Card>

          <Card style={{ padding: 24 }}>
            <div style={{ fontFamily: SERIF, fontSize: 18, color: INK }}>Booking pipeline</div>
            <div style={{ fontSize: 12, color: DIM, margin: '4px 0 16px' }}>Status of every booking on record</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <Donut segments={m.statusSegments} total={statusTotal} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {m.statusSegments.filter(s => s.label !== 'Other' || s.value > 0).map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
                  <i style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: 'inline-block' }} />
                  <span style={{ color: MUTED, flex: 1 }}>{s.label}</span>
                  <b style={{ color: INK }}>{s.value}</b>
                  <span style={{ color: DIM, minWidth: 40, textAlign: 'right' }}>{statusTotal ? Math.round((s.value / statusTotal) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Learning outcomes ── */}
        <SectionHead eyebrow="Learning outcomes" title="Progress & popular paths" hint="Where learners are on their journeys, and which growth paths attract the most enrolment." />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <Card style={{ padding: 24 }}>
            <div style={{ fontFamily: SERIF, fontSize: 18, color: INK }}>Progress distribution</div>
            <div style={{ fontSize: 12, color: DIM, margin: '4px 0 18px' }}>Learner progress records grouped by completion</div>
            {m.progressRecords === 0 ? (
              <Empty>No progress records yet. Distribution appears once learners begin a growth path.</Empty>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 190 }}>
                {m.buckets.map((v, i) => (
                  <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: v ? INK : FAINT }}>{v}</span>
                    <div
                      style={{
                        width: '100%',
                        height: `${Math.max(3, (v / maxBucket) * 78)}%`,
                        borderRadius: '8px 8px 3px 3px',
                        background: i === 4 ? `linear-gradient(180deg, ${GREEN}, #1F9D55)` : `linear-gradient(180deg, ${GOLD_L}, #9A7416)`,
                        opacity: v ? 1 : 0.25,
                        transition: 'height .6s ease'
                      }}
                    />
                    <span style={{ fontSize: 11, color: DIM, whiteSpace: 'nowrap' }}>{bucketLabels[i]}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card style={{ padding: 24 }}>
            <div style={{ fontFamily: SERIF, fontSize: 18, color: INK }}>Top growth paths</div>
            <div style={{ fontSize: 12, color: DIM, margin: '4px 0 18px' }}>Ranked by number of enrolled learners</div>
            {m.topPaths.length === 0 ? (
              <Empty>No growth paths found.</Empty>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {m.topPaths.map((p, i) => (
                  <div key={p.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 7 }}>
                      <span style={{ width: 24, height: 24, borderRadius: 7, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, color: i < 3 ? '#0A0E1F' : MUTED, background: i < 3 ? `linear-gradient(135deg, ${GOLD_L}, ${GOLD})` : 'rgba(255,255,255,.06)' }}>{i + 1}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: INK, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                      <span style={{ fontSize: 12, color: DIM }}>{p.enrolled} enrolled</span>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: GOLD_L, minWidth: 40, textAlign: 'right' }}>{p.avg}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.max(p.avg, p.enrolled ? 2 : 0)}%`, height: '100%', borderRadius: 99, background: `linear-gradient(90deg, #B8901F, ${GOLD_L})`, transition: 'width .6s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Geography ── */}
        <SectionHead eyebrow="User geography" title="Where Starfix is growing" hint="Country-level distribution of learners and mentors, based on the location stored on each profile." />
        <GeographySection geo={m.geo} />

        <div style={{ marginTop: 28, fontSize: 11.5, color: FAINT, lineHeight: 1.6, textAlign: 'center' }}>
          Revenue counts only confirmed and completed bookings. Weekly trends use each record's created date. Geography uses the country on file and is never estimated.
        </div>
      </div>
    </PageShell>
  )
}

export default AnalyticsDashboard
