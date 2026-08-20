// ── Growth Intelligence — Data Layer ──────────────────────────────────────────
// Derives every metric on the Growth Intelligence dashboard from the existing
// Mentor Intelligence data layer (20 growth paths, ~105 mentors) so the two
// modules never contradict each other. Anything not already modeled there
// (cohorts, sessions, funnels, placements, revenue, geography, risk, insights)
// is generated deterministically from seeded hashes — re-running the app
// always yields the same internally-consistent numbers.

import {
  GROWTH_PATHS,
  MENTORS,
  mentorsForPath,
  pathCapacityRate,
  pathCompletionRate,
  pathPlacementRate,
  pathsByCategory,
  CATEGORIES,
  theme,
  type GrowthPath,
  type Mentor,
  type Category,
} from '../mentors/data'

export { theme, CATEGORIES }
export type { GrowthPath, Mentor, Category }

// ── Deterministic RNG helpers ────────────────────────────────────────────────

function strHash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function rngFor(key: string) {
  return mulberry32(strHash(key))
}

function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset) % arr.length]
}

// ── Core aggregate numbers (derived from GROWTH_PATHS / MENTORS) ───────────

export const TOTAL_LEARNERS = GROWTH_PATHS.reduce((s, p) => s + p.totalLearners, 0)
export const ACTIVE_LEARNERS = GROWTH_PATHS.reduce((s, p) => s + p.activeLearners, 0)
export const ACTIVE_MENTORS = MENTORS.length
export const ACTIVE_PATHS = GROWTH_PATHS.length
export const TOTAL_SESSIONS = MENTORS.reduce((s, m) => s + m.sessions, 0)

export const OVERALL_COMPLETION_RATE = Math.round(
  GROWTH_PATHS.reduce((s, p) => s + pathCompletionRate(p.id) * p.activeLearners, 0) / ACTIVE_LEARNERS
)
export const OVERALL_PLACEMENT_RATE = Math.round(
  GROWTH_PATHS.reduce((s, p) => s + pathPlacementRate(p.id) * p.activeLearners, 0) / ACTIVE_LEARNERS
)

export const LIVE_SESSIONS_TODAY = Math.round(180 + rngFor('live-sessions-today')() * 95)

const MENTOR_PAYOUTS_MONTH = MENTORS.reduce((s, m) => s + m.earningsMonth, 0)
const REVENUE_PER_LEARNER = 210 + rngFor('revenue-per-learner')() * 70
export const MONTHLY_REVENUE = Math.round(ACTIVE_LEARNERS * REVENUE_PER_LEARNER)


// ── Executive KPI Row ────────────────────────────────────────────────────────

export type KpiFormat = 'number' | 'percent' | 'currency'
export type TrendTone = 'growth' | 'stable' | 'decline'

export interface KpiDatum {
  label: string
  format: KpiFormat
  current: number
  previous: number
  changePct: number
  sparkline: number[]
  target: number
  targetProgress: number
  trendTone: TrendTone
  areaOpacity: number
}

// Distinct, hand-authored trend shapes (as fractions of `current`) so every KPI
// card tells a different visual story instead of sharing one generic upward
// wiggle. Every array ends at 1.0 so the line always lands exactly on the KPI's
// current value.
const SPARKLINE_SHAPES: Record<string, number[]> = {
  'Total Learners':          [0.880, 0.889, 0.898, 0.908, 0.920, 0.932, 0.947, 0.962, 0.983, 1.000], // smooth steady growth, slight acceleration near the end
  'Active Mentors':          [0.900, 0.912, 0.922, 0.930, 0.933, 0.934, 0.936, 0.955, 0.978, 1.000], // slow growth, small mid-plateau, then a moderate rise
  'Overall Completion Rate': [0.975, 0.968, 0.978, 0.965, 0.972, 0.980, 0.970, 0.982, 0.991, 1.000], // mostly stable, small fluctuations around a high value, gentle rise at the end
  'Placement Rate':          [0.900, 0.820, 0.740, 0.700, 0.780, 0.870, 0.930, 0.970, 0.985, 1.000], // volatile — dip, recovery, stronger finish
  'Live Sessions Today':     [0.800, 0.900, 0.840, 0.780, 0.880, 0.950, 0.890, 0.940, 0.990, 1.000], // dynamic intraday — rise, dip, rise, peak at the end
  'Monthly Revenue':         [0.500, 0.504, 0.516, 0.538, 0.573, 0.623, 0.688, 0.768, 0.878, 1.000], // exponential-style growth, steepest in the final segment
}

// Metrics that read as "holding steady" rather than trending, even when the
// headline change is technically positive — drives the amber trend badge.
const STABLE_LABELS = new Set(['Overall Completion Rate', 'Live Sessions Today'])

// Fill intensity per metric — same warm-gold hue throughout the dashboard,
// only opacity varies, so the strongest-growth card (Revenue) reads visually fuller.
const AREA_OPACITY: Record<string, number> = {
  'Total Learners': 0.16,
  'Active Mentors': 0.20,
  'Overall Completion Rate': 0.12,
  'Placement Rate': 0.24,
  'Live Sessions Today': 0.20,
  'Monthly Revenue': 0.32,
}

function trendToneFor(label: string, changePct: number): TrendTone {
  if (changePct < 0) return 'decline'
  return STABLE_LABELS.has(label) ? 'stable' : 'growth'
}

function makeKpi(label: string, current: number, format: KpiFormat): KpiDatum {
  const rng = rngFor(label)
  const monthlyGrowth = 0.02 + rng() * 0.07
  const previous = Math.round(current / (1 + monthlyGrowth))
  const changePct = Math.round(((current - previous) / Math.max(1, previous)) * 1000) / 10

  const shape = SPARKLINE_SHAPES[label]
  let sparkline: number[]
  if (shape) {
    sparkline = shape.map(f => Math.round(current * f))
  } else {
    sparkline = []
    for (let i = 0; i < 6; i++) {
      const t = i / 5
      const noise = (rng() - 0.5) * 0.06
      sparkline.push(Math.round(previous + (current - previous) * t * (1 + noise)))
    }
    sparkline[5] = current
  }

  const target = Math.round(current * (1.04 + rng() * 0.08))
  const targetProgress = Math.min(100, Math.round((current / target) * 100))
  const trendTone = trendToneFor(label, changePct)
  const areaOpacity = AREA_OPACITY[label] ?? 0.2
  return { label, format, current, previous, changePct, sparkline, target, targetProgress, trendTone, areaOpacity }
}

export const KPIS: KpiDatum[] = [
  makeKpi('Total Learners', TOTAL_LEARNERS, 'number'),
  makeKpi('Active Learners', ACTIVE_LEARNERS, 'number'),
  makeKpi('Active Mentors', ACTIVE_MENTORS, 'number'),
  makeKpi('Active Growth Paths', ACTIVE_PATHS, 'number'),
  makeKpi('Live Sessions Today', LIVE_SESSIONS_TODAY, 'number'),
  makeKpi('Overall Completion Rate', OVERALL_COMPLETION_RATE, 'percent'),
  makeKpi('Placement Rate', OVERALL_PLACEMENT_RATE, 'percent'),
  makeKpi('Monthly Revenue', MONTHLY_REVENUE, 'currency'),
]


// ── Platform Growth (multi-series, filterable) ─────────────────────────────

export type GrowthFilter = '7D' | '30D' | 'Q' | 'Y'
export const GROWTH_FILTERS: { id: GrowthFilter; label: string }[] = [
  { id: '7D', label: '7 Days' },
  { id: '30D', label: '30 Days' },
  { id: 'Q', label: 'Quarter' },
  { id: 'Y', label: 'Year' },
]

export interface GrowthPoint {
  label: string
  newLearners: number
  activeLearners: number
  completedLearners: number
  placedLearners: number
  activeMentors: number
}

const FILTER_CONFIG: Record<GrowthFilter, { points: number; labels: string[] }> = {
  '7D': { points: 7, labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  '30D': { points: 10, labels: ['D1', 'D4', 'D7', 'D10', 'D13', 'D16', 'D19', 'D22', 'D25', 'D28'] },
  Q: { points: 12, labels: Array.from({ length: 12 }, (_, i) => `Wk ${i + 1}`) },
  Y: { points: 12, labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
}

export function generateGrowthSeries(filter: GrowthFilter): GrowthPoint[] {
  const cfg = FILTER_CONFIG[filter]
  const rng = rngFor(`growth-series-${filter}`)
  const baseNew = Math.round(ACTIVE_LEARNERS * (filter === '7D' ? 0.006 : filter === '30D' ? 0.018 : filter === 'Q' ? 0.05 : 0.16))
  const baseActive = Math.round(ACTIVE_LEARNERS * (filter === 'Y' ? 0.6 : 0.92))
  const baseMentors = Math.round(ACTIVE_MENTORS * 0.7)

  return cfg.labels.map((label, i) => {
    const progress = i / (cfg.points - 1)
    const noise = () => 0.9 + rng() * 0.22
    const newLearners = Math.round(baseNew * (0.6 + progress * 0.8) * noise())
    const activeLearners = Math.round(baseActive * (0.55 + progress * 0.5) * noise())
    const completedLearners = Math.round(activeLearners * (0.28 + progress * 0.18) * noise())
    const placedLearners = Math.round(completedLearners * (0.55 + progress * 0.15) * noise())
    const activeMentors = Math.round(baseMentors * (0.7 + progress * 0.35) * noise())
    return { label, newLearners, activeLearners, completedLearners, placedLearners, activeMentors }
  })
}


// ── Learner Journey Funnel ───────────────────────────────────────────────────

export interface FunnelStage {
  label: string
  value: number
}

export const LEARNER_FUNNEL: FunnelStage[] = (() => {
  const rng = rngFor('learner-funnel')
  const visitors = Math.round(TOTAL_LEARNERS * (2.6 + rng() * 0.4))
  const registered = Math.round(visitors * 0.38)
  const profileCompleted = Math.round(registered * 0.74)
  const pathSelected = Math.round(profileCompleted * 0.82)
  const learningActive = Math.round(pathSelected * 0.88)
  const completed = Math.round(learningActive * (OVERALL_COMPLETION_RATE / 100))
  return [
    { label: 'Visitors', value: visitors },
    { label: 'Registered', value: registered },
    { label: 'Profile Completed', value: profileCompleted },
    { label: 'Growth Path Selected', value: pathSelected },
    { label: 'Learning Active', value: learningActive },
    { label: 'Completed', value: completed },
  ]
})()

export function funnelConversion(stages: FunnelStage[], i: number): number {
  if (i === 0) return 100
  return Math.round((stages[i].value / stages[0].value) * 1000) / 10
}

export function funnelDropoff(stages: FunnelStage[], i: number): number {
  if (i === 0) return 0
  return Math.round(((stages[i - 1].value - stages[i].value) / stages[i - 1].value) * 1000) / 10
}

export function funnelEfficiency(stages: FunnelStage[]): number {
  return Math.round((stages[stages.length - 1].value / stages[0].value) * 1000) / 10
}

export const BIGGEST_DROPOFF_INDEX = (() => {
  let worst = 1
  let worstVal = -1
  for (let i = 1; i < LEARNER_FUNNEL.length; i++) {
    const d = funnelDropoff(LEARNER_FUNNEL, i)
    if (d > worstVal) { worstVal = d; worst = i }
  }
  return worst
})()


// ── Growth Path Intelligence (sortable table) ───────────────────────────────

export type RiskLevel = 'Low' | 'Medium' | 'High'

export interface PathTableRow {
  id: string
  name: string
  category: Category
  learners: number
  activeMentors: number
  capacity: number
  sessionAttendance: number
  completionRate: number
  placementRate: number
  avgRating: number
  retentionRate: number
  revenue: number
  monthlyGrowth: number
  riskLevel: RiskLevel
}

function feePerLearner(pathId: string): number {
  const rng = rngFor(`fee-${pathId}`)
  return Math.round(1400 + rng() * 2200)
}

export const PATH_TABLE: PathTableRow[] = GROWTH_PATHS.map(p => {
  const mentors = mentorsForPath(p.id)
  const capacity = pathCapacityRate(p.id)
  const completionRate = pathCompletionRate(p.id)
  const placementRate = pathPlacementRate(p.id)
  const sessionAttendance = Math.round(
    mentors.reduce((s, m) => s + (m.activeClients / (m.activeClients + m.availableSlots)) * m.successRate, 0) / mentors.length
  )
  const revenue = Math.round(p.activeLearners * feePerLearner(p.id))
  const riskLevel: RiskLevel =
    capacity >= 90 || completionRate < 68 ? 'High' : capacity >= 78 || completionRate < 78 || placementRate < 68 ? 'Medium' : 'Low'
  const avgRating = Math.round((mentors.reduce((s, m) => s + m.rating, 0) / mentors.length) * 100) / 100
  const retentionRate = Math.round(mentors.reduce((s, m) => s + m.retentionRate, 0) / mentors.length)

  return {
    id: p.id,
    name: p.name,
    category: p.category,
    learners: p.totalLearners,
    activeMentors: mentors.length,
    capacity,
    sessionAttendance: Math.min(99, sessionAttendance),
    completionRate,
    placementRate,
    avgRating,
    retentionRate,
    revenue,
    monthlyGrowth: p.trend,
    riskLevel,
  }
})

export function riskTone(risk: RiskLevel): { color: string; bg: string } {
  if (risk === 'High') return { color: theme.red, bg: theme.redBg }
  if (risk === 'Medium') return { color: theme.amber, bg: theme.amberBg }
  return { color: theme.green, bg: theme.greenBg }
}


// ── Category Intelligence — spans all five Starfix ecosystems ──────────────
// Career & Tech, Health & Fitness, Mindset, Personal Life, Student Life.
// Every number here is aggregated from PATH_TABLE, so category and path-level
// figures can never contradict each other.

export type CategoryHealth = 'Healthy' | 'Needs Attention' | 'Critical'

export interface CategoryStats {
  category: Category
  pathCount: number
  learners: number
  activeLearners: number
  activeMentors: number
  growthPct: number
  completionRate: number
  retentionRate: number
  avgRating: number
  avgCapacity: number
  revenue: number
  revenueSharePct: number
  shares: number
  communityPosts: number
  health: CategoryHealth
}

const TOTAL_CATEGORY_REVENUE = PATH_TABLE.reduce((s, p) => s + p.revenue, 0)

export const CATEGORY_TABLE: CategoryStats[] = CATEGORIES.map(category => {
  const paths = PATH_TABLE.filter(p => p.category === category)
  const learners = paths.reduce((s, p) => s + p.learners, 0)
  const activeLearners = pathsByCategory(category).reduce((s, p) => s + p.activeLearners, 0)
  const activeMentors = paths.reduce((s, p) => s + p.activeMentors, 0)
  const growthPct = Math.round((paths.reduce((s, p) => s + p.monthlyGrowth * p.learners, 0) / learners) * 10) / 10
  const completionRate = Math.round(paths.reduce((s, p) => s + p.completionRate * p.learners, 0) / learners)
  const retentionRate = Math.round(paths.reduce((s, p) => s + p.retentionRate * p.learners, 0) / learners)
  const avgRating = Math.round((paths.reduce((s, p) => s + p.avgRating * p.learners, 0) / learners) * 100) / 100
  const avgCapacity = Math.round(paths.reduce((s, p) => s + p.capacity * p.activeMentors, 0) / activeMentors)
  const revenue = paths.reduce((s, p) => s + p.revenue, 0)
  const revenueSharePct = Math.round((revenue / TOTAL_CATEGORY_REVENUE) * 1000) / 10
  const rng = rngFor(`category-social-${category}`)
  const shares = Math.round(activeLearners * (0.35 + rng() * 0.4))
  const communityPosts = Math.round(activeLearners * (0.08 + rng() * 0.12))

  const health: CategoryHealth =
    completionRate < 62 || avgCapacity >= 95 || avgRating < 4.15
      ? 'Critical'
      : completionRate < 74 || avgCapacity >= 85 || retentionRate < 62 || avgRating < 4.4
        ? 'Needs Attention'
        : 'Healthy'

  return {
    category,
    pathCount: paths.length,
    learners,
    activeLearners,
    activeMentors,
    growthPct,
    completionRate,
    retentionRate,
    avgRating,
    avgCapacity,
    revenue,
    revenueSharePct,
    shares,
    communityPosts,
    health,
  }
})

export function categoryHealthTone(h: CategoryHealth): { color: string; bg: string } {
  if (h === 'Critical') return { color: theme.red, bg: theme.redBg }
  if (h === 'Needs Attention') return { color: theme.amber, bg: theme.amberBg }
  return { color: theme.green, bg: theme.greenBg }
}

function topCategoryBy<K extends keyof CategoryStats>(key: K) {
  return CATEGORY_TABLE.slice().sort((a, b) => (b[key] as number) - (a[key] as number))[0]
}

export const CATEGORY_LEADERS = {
  fastestGrowing: topCategoryBy('growthPct'),
  highestRetention: topCategoryBy('retentionRate'),
  highestRevenue: topCategoryBy('revenue'),
  mostActiveLearners: topCategoryBy('activeLearners'),
  mostCompleted: CATEGORY_TABLE.slice().sort(
    (a, b) => Math.round((b.activeLearners * b.completionRate) / 100) - Math.round((a.activeLearners * a.completionRate) / 100)
  )[0],
  mostShared: topCategoryBy('shares'),
  highestRated: topCategoryBy('avgRating'),
}


// ── Mentor Intelligence (leaderboard across all ~105 mentors) ──────────────

export interface MentorTableRow extends Mentor {
  pathName: string
  capacityUtilization: number
}

const PATH_NAME_BY_ID: Record<string, string> = Object.fromEntries(GROWTH_PATHS.map(p => [p.id, p.name]))

export const MENTOR_TABLE: MentorTableRow[] = MENTORS.map(m => ({
  ...m,
  pathName: PATH_NAME_BY_ID[m.pathId] ?? m.pathId,
  capacityUtilization: Math.round((m.activeClients / (m.activeClients + m.availableSlots)) * 100),
})).sort((a, b) => b.performanceScore - a.performanceScore)

// ── Mentor Capacity Dashboard ────────────────────────────────────────────────

export const CAPACITY_BUCKETS = {
  underUtilized: MENTOR_TABLE.filter(m => m.capacityUtilization < 50),
  healthy: MENTOR_TABLE.filter(m => m.capacityUtilization >= 50 && m.capacityUtilization < 75),
  nearCapacity: MENTOR_TABLE.filter(m => m.capacityUtilization >= 75 && m.capacityUtilization < 90),
  overloaded: MENTOR_TABLE.filter(m => m.capacityUtilization >= 90),
}

export const OVERLOADED_MENTORS = CAPACITY_BUCKETS.overloaded.slice().sort((a, b) => b.capacityUtilization - a.capacityUtilization)


// ── Session Analytics ────────────────────────────────────────────────────────

export const SESSION_STATS = (() => {
  const rng = rngFor('session-stats')
  const booked = Math.round(TOTAL_SESSIONS * (1.08 + rng() * 0.05))
  const completed = Math.round(TOTAL_SESSIONS)
  const cancelled = Math.round(booked * (0.04 + rng() * 0.02))
  const rescheduled = Math.round(booked * (0.05 + rng() * 0.03))
  const attendance = Math.round((completed / booked) * 1000) / 10
  const avgDurationMin = Math.round(38 + rng() * 14)
  return { booked, completed, cancelled, rescheduled, attendance, avgDurationMin }
})()

function series(key: string, length: number, base: number, growth: number, labelFn: (i: number) => string) {
  const rng = rngFor(key)
  return Array.from({ length }, (_, i) => ({
    label: labelFn(i),
    value: Math.round(base * (1 + (i / length) * growth) * (0.88 + rng() * 0.24)),
  }))
}

export const DAILY_SESSIONS = series('daily-sessions', 7, LIVE_SESSIONS_TODAY * 0.82, 0.2, i =>
  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]
)
export const WEEKLY_SESSIONS = series('weekly-sessions', 8, LIVE_SESSIONS_TODAY * 5.4, 0.22, i => `Wk ${i + 1}`)
export const MONTHLY_SESSIONS = series('monthly-sessions', 12, LIVE_SESSIONS_TODAY * 23, 0.3, i =>
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]
)

// ── Learner Engagement ───────────────────────────────────────────────────────

export const ENGAGEMENT = (() => {
  const rng = rngFor('engagement')
  const dau = Math.round(ACTIVE_LEARNERS * (0.22 + rng() * 0.05))
  const wau = Math.round(ACTIVE_LEARNERS * (0.55 + rng() * 0.08))
  const mau = Math.round(ACTIVE_LEARNERS * (0.88 + rng() * 0.06))
  const learningHours = Math.round(ACTIVE_LEARNERS * (2.4 + rng() * 0.6))
  const assignmentCompletion = Math.round(70 + rng() * 18)
  const quizCompletion = Math.round(66 + rng() * 20)
  const courseProgress = Math.round(58 + rng() * 22)
  return { dau, wau, mau, learningHours, assignmentCompletion, quizCompletion, courseProgress }
})()

export const HEATMAP_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const HEATMAP_BLOCKS = ['6–9am', '9am–12pm', '12–3pm', '3–6pm', '6–9pm', '9pm–12am']

export const ENGAGEMENT_HEATMAP: number[][] = (() => {
  const rng = rngFor('engagement-heatmap')
  return HEATMAP_DAYS.map((day, di) =>
    HEATMAP_BLOCKS.map((_, bi) => {
      const isWeekend = di >= 5
      const eveningBoost = bi === 3 || bi === 4 ? 1.35 : bi === 0 ? 0.55 : 1
      const weekendBoost = isWeekend ? 1.15 : 1
      return Math.round(Math.min(100, 30 + rng() * 25 * eveningBoost * weekendBoost + eveningBoost * 18))
    })
  )
})()

export const PEAK_LEARNING = (() => {
  let best = { day: 0, block: 0, value: -1 }
  ENGAGEMENT_HEATMAP.forEach((row, di) => row.forEach((v, bi) => { if (v > best.value) best = { day: di, block: bi, value: v } }))
  return { day: HEATMAP_DAYS[best.day], block: HEATMAP_BLOCKS[best.block], value: best.value }
})()


// ── Placement Intelligence ───────────────────────────────────────────────────

export const PLACEMENT_KPIS = (() => {
  const rng = rngFor('placement-kpis')
  const placementRate = OVERALL_PLACEMENT_RATE
  const avgSalary = Math.round(62000 + rng() * 38000)
  const offersGenerated = Math.round(ACTIVE_LEARNERS * (placementRate / 100) * (1.12 + rng() * 0.1))
  const interviewSuccessRate = Math.round(48 + rng() * 20)
  const offerAcceptanceRate = Math.round(80 + rng() * 14)
  return { placementRate, avgSalary, offersGenerated, interviewSuccessRate, offerAcceptanceRate }
})()

export const PLACEMENT_PIPELINE: FunnelStage[] = (() => {
  const applied = PLACEMENT_KPIS.offersGenerated * 5
  const shortlisted = Math.round(applied * 0.42)
  const technical = Math.round(shortlisted * 0.58)
  const hr = Math.round(technical * 0.7)
  const offer = Math.round(hr * (PLACEMENT_KPIS.interviewSuccessRate / 100 + 0.35))
  const joined = Math.round(offer * (PLACEMENT_KPIS.offerAcceptanceRate / 100))
  return [
    { label: 'Applied', value: applied },
    { label: 'Resume Shortlisted', value: shortlisted },
    { label: 'Technical Interview', value: technical },
    { label: 'HR Interview', value: hr },
    { label: 'Offer', value: offer },
    { label: 'Joined', value: joined },
  ]
})()

const HIRING_COMPANIES = ['Amazon', 'Google', 'Microsoft', 'Flipkart', 'Swiggy', 'Razorpay', 'TCS', 'Infosys', 'Accenture', 'PhonePe', 'Zomato', 'Freshworks']
const HIRING_DOMAINS = ['Full Stack Development', 'Data Science', 'AI / ML Engineering', 'DevOps & Cloud', 'UI / UX Design', 'Product Management', 'Cyber Security', 'Digital Marketing']

export const TOP_HIRING_COMPANIES = (() => {
  const rng = rngFor('top-hiring-companies')
  return HIRING_COMPANIES.map(name => ({ name, hires: Math.round(30 + rng() * 180) }))
    .sort((a, b) => b.hires - a.hires)
    .slice(0, 8)
})()

export const TOP_HIRING_DOMAINS = (() => {
  const rng = rngFor('top-hiring-domains')
  return HIRING_DOMAINS.map(domain => ({ domain, hires: Math.round(80 + rng() * 260) }))
    .sort((a, b) => b.hires - a.hires)
})()

export const SALARY_BY_DOMAIN = (() => {
  const rng = rngFor('salary-by-domain')
  return HIRING_DOMAINS.map(domain => ({ domain, avgSalary: Math.round(55000 + rng() * 55000) }))
    .sort((a, b) => b.avgSalary - a.avgSalary)
})()

export const PLACEMENT_TREND = (() => {
  const rng = rngFor('placement-trend')
  const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
  const base = Math.round(PLACEMENT_KPIS.offersGenerated / 7)
  return months.map((month, i) => ({ month, placements: Math.round(base * (0.8 + i * 0.08) * (0.9 + rng() * 0.2)) }))
})()


// ── Cohort Analytics ─────────────────────────────────────────────────────────

export interface Cohort {
  id: string
  name: string
  startDate: string
  learners: number
  activeLearners: number
  completion: number
  placement: number
  activeMentors: number
  satisfaction: number
  progress: number
}

const COHORT_STARTS = [
  '2024-08-05', '2024-09-16', '2024-10-21', '2024-11-18', '2024-12-09',
  '2025-01-13', '2025-02-10', '2025-03-10', '2025-03-31', '2025-04-21',
  '2025-05-12', '2025-06-02', '2025-06-23', '2025-07-14', '2025-07-28',
]

export const COHORTS: Cohort[] = COHORT_STARTS.map((startDate, i) => {
  const rng = rngFor(`cohort-${i}`)
  const learners = Math.round(120 + rng() * 220)
  const monthsSinceStart = COHORT_STARTS.length - i
  const maturity = Math.min(1, monthsSinceStart / 11)
  const activeLearners = Math.round(learners * (0.55 + rng() * 0.3))
  const completion = Math.round(Math.min(97, 20 + maturity * 70 + rng() * 10))
  const placement = Math.round(Math.min(94, completion * (0.55 + rng() * 0.25)))
  const activeMentors = Math.round(6 + rng() * 14)
  const satisfaction = Math.round((3.6 + rng() * 1.3) * 100) / 100
  const progress = Math.round(Math.min(100, maturity * 100 * (0.85 + rng() * 0.2)))
  return {
    id: `cohort-${i}`,
    name: `Cohort ${startDate.slice(0, 7)}`,
    startDate,
    learners,
    activeLearners,
    completion,
    placement,
    activeMentors,
    satisfaction,
    progress,
  }
})

export function isLowPerformingCohort(c: Cohort): boolean {
  return c.completion < 55 || c.satisfaction < 4.0
}


// ── Revenue Analytics ────────────────────────────────────────────────────────

export const REVENUE = (() => {
  const rng = rngFor('revenue-breakdown')
  const monthly = MONTHLY_REVENUE
  const subscription = Math.round(monthly * (0.58 + rng() * 0.06))
  const enterprise = Math.round(monthly * (0.2 + rng() * 0.05))
  const other = monthly - subscription - enterprise
  const mentorPayouts = MENTOR_PAYOUTS_MONTH
  const platformCommission = Math.max(0, monthly - mentorPayouts)
  const forecastNextMonth = Math.round(monthly * (1.04 + rng() * 0.05))
  return { monthly, subscription, enterprise, other, mentorPayouts, platformCommission, forecastNextMonth }
})()

export const REVENUE_MONTHLY_TREND = (() => {
  const rng = rngFor('revenue-monthly-trend')
  const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
  const base = REVENUE.monthly / 1.32
  return months.map((month, i) => ({ month, revenue: Math.round(base * (1 + i * 0.055) * (0.94 + rng() * 0.1)) }))
})()

export const REVENUE_BY_PATH = PATH_TABLE.slice().sort((a, b) => b.revenue - a.revenue).slice(0, 8)

export const REVENUE_BY_MENTOR = MENTOR_TABLE.slice().sort((a, b) => b.earningsMonth - a.earningsMonth).slice(0, 10)

// ── Geographic Insights ──────────────────────────────────────────────────────

const CITIES = ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Kochi', 'Jaipur']
const STATES = ['Karnataka', 'Maharashtra', 'Delhi NCR', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Kerala', 'Rajasthan', 'Punjab']

function distribution(key: string, names: string[], total: number) {
  const rng = rngFor(key)
  const weights = names.map(() => 0.4 + rng())
  const sum = weights.reduce((s, w) => s + w, 0)
  return names
    .map((name, i) => ({ name, count: Math.round((weights[i] / sum) * total) }))
    .sort((a, b) => b.count - a.count)
}

export const GEO = {
  learnerDistribution: distribution('geo-learners', CITIES, ACTIVE_LEARNERS),
  mentorDistribution: distribution('geo-mentors', CITIES, ACTIVE_MENTORS),
  topStates: distribution('geo-states', STATES, ACTIVE_LEARNERS),
  hiringCompanyLocations: distribution('geo-hiring', CITIES, PLACEMENT_KPIS.offersGenerated),
  placementLocations: distribution('geo-placements', CITIES, Math.round(PLACEMENT_KPIS.offersGenerated * 0.9)),
}

export const TOP_CITIES = GEO.learnerDistribution.slice(0, 6)
export const TOP_STATES = GEO.topStates.slice(0, 6)


// ── Operational Risk Center ──────────────────────────────────────────────────

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low'

export interface RiskAlert {
  id: string
  severity: Severity
  title: string
  department: string
  owner: string
  action: string
  updated: string
}

function findPath(name: string): PathTableRow | undefined {
  return PATH_TABLE.find(p => p.name === name)
}

export const RISK_ALERTS: RiskAlert[] = (() => {
  const alerts: RiskAlert[] = []
  const overloadedCount = CAPACITY_BUCKETS.overloaded.length
  if (overloadedCount > 0) {
    alerts.push({
      id: 'risk-capacity',
      severity: 'High',
      title: `${overloadedCount} mentors are operating above 95% capacity`,
      department: 'Mentor Operations',
      owner: 'Head of Mentor Success',
      action: 'Onboard additional mentors or redistribute active learners across the affected growth paths.',
      updated: '2 hours ago',
    })
  }
  const aiPath = findPath('AI / ML Engineering')
  if (aiPath) {
    alerts.push({
      id: 'risk-aiml-dropoff',
      severity: 'High',
      title: 'AI / ML learner drop-off increased by 12% this month',
      department: 'Learner Success',
      owner: 'Director of Learning Experience',
      action: 'Audit Module 3 pacing and introduce a mid-path mentor check-in for at-risk learners.',
      updated: '5 hours ago',
    })
  }
  alerts.push({
    id: 'risk-inactive-learners',
    severity: 'Medium',
    title: '30 learners have been inactive for more than 14 days',
    department: 'Learner Success',
    owner: 'Learner Engagement Lead',
    action: 'Trigger re-engagement email sequence and offer a complimentary mentor session.',
    updated: '1 day ago',
  })
  const frontend = findPath('Frontend Development')
  if (frontend) {
    alerts.push({
      id: 'risk-frontend-attendance',
      severity: 'Medium',
      title: 'Frontend Development session attendance is below benchmark',
      department: 'Curriculum & Mentor Ops',
      owner: 'Frontend Program Lead',
      action: 'Review session scheduling overlap and send attendance nudges 24 hours before sessions.',
      updated: '6 hours ago',
    })
  }
  alerts.push({
    id: 'risk-uiux-improving',
    severity: 'Low',
    title: 'UI / UX Design placement rate is improving steadily',
    department: 'Placements',
    owner: 'Placement Partnerships Lead',
    action: 'Capture the current mentor playbook as a template for other design-adjacent paths.',
    updated: '3 days ago',
  })
  return alerts
})()

export function severityTone(s: Severity): { color: string; bg: string } {
  if (s === 'Critical') return { color: '#991B1B', bg: '#FEE2E2' }
  if (s === 'High') return { color: theme.red, bg: theme.redBg }
  if (s === 'Medium') return { color: theme.amber, bg: theme.amberBg }
  return { color: theme.green, bg: theme.greenBg }
}


// ── AI Growth Insights ───────────────────────────────────────────────────────

export interface Insight {
  id: string
  icon: string
  title: string
  detail: string
}

export const AI_INSIGHTS: Insight[] = [
  {
    id: 'insight-aiml-demand',
    icon: 'sparkles',
    title: 'AI / ML demand projected to increase 18% next quarter',
    detail: 'Enrollment velocity and waitlist growth on AI / ML Engineering outpace every other path — recommend prioritizing mentor recruitment now.',
  },
  {
    id: 'insight-aiml-hire',
    icon: 'mentors',
    title: 'Hire 4 additional AI / ML mentors',
    detail: 'Current mentor-to-learner ratio on this path will breach the healthy capacity band within 5–6 weeks at current growth rate.',
  },
  {
    id: 'insight-frontend-capacity',
    icon: 'alert',
    title: 'Frontend mentor capacity expected to exceed limits next month',
    detail: 'Utilization is trending toward the overloaded threshold; onboarding 2–3 mentors now avoids a session-availability bottleneck.',
  },
  {
    id: 'insight-cyber-placement',
    icon: 'shieldCheck',
    title: 'Cyber Security placement improving consistently',
    detail: 'Placement rate has climbed for three consecutive cohorts, driven by stronger hiring partnerships in security operations roles.',
  },
  {
    id: 'insight-datascience-completion',
    icon: 'trendUp',
    title: 'Data Science completion projected to rise 10%',
    detail: 'Recent curriculum sequencing changes correlate with higher Week 4–6 retention across the two most recent cohorts.',
  },
  {
    id: 'insight-cohort-probability',
    icon: 'target',
    title: 'Placement probability for the current cohort: 78%',
    detail: 'Modeled from historical completion pace, mentor engagement, and session attendance for learners still active in this cohort.',
  },
  {
    id: 'insight-reengage',
    icon: 'megaphone',
    title: 'Re-engage inactive learners through targeted mentoring',
    detail: 'Learners paired with a mentor within 48 hours of going inactive return to active status at a meaningfully higher rate.',
  },
]

// ── Global Filters ───────────────────────────────────────────────────────────

export const FILTER_OPTIONS = {
  dateRanges: ['Last 7 Days', 'Last 30 Days', 'This Quarter', 'This Year'],
  categories: ['All Categories', ...CATEGORIES],
  growthPaths: ['All Growth Paths', ...GROWTH_PATHS.map(p => p.name)],
  mentors: ['All Mentors', ...MENTOR_TABLE.slice(0, 25).map(m => m.name)],
  cohorts: ['All Cohorts', ...COHORTS.map(c => c.name)],
  companies: ['All Companies', ...Array.from(new Set(MENTORS.map(m => m.company))).slice(0, 20)],
  placementStatuses: ['All Statuses', 'Applied', 'Interviewing', 'Offer Extended', 'Placed', 'Not Placed'],
  locations: ['All Locations', ...TOP_CITIES.map(c => c.name)],
}


// ── Category Intelligence (items 1, 2, 3, 5 — ecosystem-wide rollups) ───────
// Reuses CATEGORY_SUMMARIES from the mentor data layer (already derived from
// GROWTH_PATHS + MENTORS) so category numbers can never contradict the path
// or mentor tables above.

import { CATEGORY_SUMMARIES as _CATEGORY_SUMMARIES, type CategorySummary } from '../mentors/data'
export const CATEGORY_SUMMARIES = _CATEGORY_SUMMARIES
export type { CategorySummary }

// "Most Shared" has no canonical source elsewhere in the app, so it's
// generated deterministically from each category's active-learner base —
// larger, higher-engagement categories produce proportionally more shares.
export const CATEGORY_SHARES: Record<Category, number> = Object.fromEntries(
  CATEGORY_SUMMARIES.map(c => {
    const rng = rngFor(`shares-${c.category}`)
    return [c.category, Math.round(c.activeLearners * (0.18 + rng() * 0.14))]
  })
) as Record<Category, number>

export interface TopCategoryAward {
  id: string
  label: string
  icon: string
  category: Category
  value: string
}

function topBy(metric: (c: CategorySummary) => number, id: string, label: string, icon: string, format: (c: CategorySummary) => string): TopCategoryAward {
  const winner = [...CATEGORY_SUMMARIES].sort((a, b) => metric(b) - metric(a))[0]
  return { id, label, icon, category: winner.category, value: format(winner) }
}

export const TOP_PERFORMING_CATEGORIES: TopCategoryAward[] = [
  topBy(c => c.growth, 'fastest-growing', 'Fastest Growing Category', 'trendUp', c => `+${c.growth}% MoM`),
  topBy(c => c.retention, 'highest-retention', 'Highest Retention', 'shieldCheck', c => `${c.retention}% retained`),
  topBy(c => c.revenue, 'highest-revenue', 'Highest Revenue', 'dollar', c => `₹${(c.revenue / 100000).toFixed(1)}L / mo`),
  topBy(c => c.activeLearners, 'most-active', 'Most Active Learners', 'activity', c => `${c.activeLearners.toLocaleString()} active`),
  topBy(c => Math.round((c.completion / 100) * c.activeLearners), 'most-completed', 'Most Completed Category', 'check', c => `${Math.round((c.completion / 100) * c.activeLearners).toLocaleString()} completions`),
  topBy(c => CATEGORY_SHARES[c.category], 'most-shared', 'Most Shared Category', 'megaphone', c => `${CATEGORY_SHARES[c.category].toLocaleString()} shares`),
  topBy(c => c.rating, 'highest-rated', 'Highest Rated Category', 'star', c => `${c.rating.toFixed(2)} ★`),
]

// ── Mentor Utilization by Category (item 5) ─────────────────────────────────

export interface CategoryMentorGroup {
  category: Category
  groupLabel: string
  mentorCount: number
  utilization: number
  availableSlots: number
  waitlist: number
  avgResponseTime: number
  avgRating: number
}

const CATEGORY_MENTOR_LABEL: Record<Category, string> = {
  'Career & Tech': 'Career & Tech Mentors',
  'Health & Fitness': 'Fitness Coaches',
  'Mindset': 'Mindset Coaches',
  'Personal Life': 'Life Coaches',
  'Student Life': 'Academic Mentors',
}

export const CATEGORY_MENTOR_UTILIZATION: CategoryMentorGroup[] = CATEGORIES.map(category => {
  const paths = pathsByCategory(category)
  const mentors = MENTORS.filter(m => paths.some(p => p.id === m.pathId))
  const utilization = Math.round(
    mentors.reduce((s, m) => s + (m.activeClients / (m.activeClients + m.availableSlots)) * 100, 0) / mentors.length
  )
  const availableSlots = mentors.reduce((s, m) => s + m.availableSlots, 0)
  const rng = rngFor(`waitlist-${category}`)
  const waitlist = Math.round(mentors.length * (utilization >= 85 ? 2.2 : utilization >= 70 ? 0.9 : 0.2) * (0.7 + rng() * 0.6))
  const avgResponseTime = Math.round(mentors.reduce((s, m) => s + m.responseTimeMinutes, 0) / mentors.length)
  const avgRating = Math.round((mentors.reduce((s, m) => s + m.rating, 0) / mentors.length) * 100) / 100
  return {
    category,
    groupLabel: CATEGORY_MENTOR_LABEL[category],
    mentorCount: mentors.length,
    utilization,
    availableSlots,
    waitlist,
    avgResponseTime,
    avgRating,
  }
})
