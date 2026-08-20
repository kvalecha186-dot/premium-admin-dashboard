// ── Starfix Growth Operations — Executive Overview data layer ────────────────
// Derived from the shared mentor/growth-path data layer (../mentors/data) so
// every number on the Overview page reflects the full Starfix ecosystem —
// Career & Tech, Health & Fitness, Mindset, Personal Life, Student Life —
// instead of a hand-typed, tech-only slice.

import {
  CATEGORIES,
  CATEGORY_SUMMARIES,
  GROWTH_PATHS,
  MENTORS,
  pathCompletionRate,
  pathPlacementRate,
  type Category,
} from '../mentors/data'

export type GrowthPath = {
  name: string
  category: Category
  learners: number
  completion: number // %
  placement: number // %
  rating: number
  growth: number // % MoM
}

function avgRatingForPath(pathId: string): number {
  const mentors = MENTORS.filter(m => m.pathId === pathId)
  if (!mentors.length) return 0
  return Math.round((mentors.reduce((s, m) => s + m.rating, 0) / mentors.length) * 100) / 100
}

export const growthPaths: GrowthPath[] = GROWTH_PATHS.map(p => ({
  name: p.name,
  category: p.category,
  learners: p.totalLearners,
  completion: pathCompletionRate(p.id),
  placement: pathPlacementRate(p.id),
  rating: avgRatingForPath(p.id),
  growth: Math.round(p.trend),
})).sort((a, b) => b.learners - a.learners)

export const totalLearners = growthPaths.reduce((s, p) => s + p.learners, 0)

// Mentor capacity by ecosystem category — the five Starfix categories, not
// just technical disciplines.
export type MentorGroup = { name: string; capacity: number; utilization: number }
export const mentorGroups: MentorGroup[] = CATEGORY_SUMMARIES.map(c => {
  const mentors = MENTORS.filter(m => GROWTH_PATHS.find(p => p.id === m.pathId)?.category === c.category)
  const utilization = Math.round(
    mentors.reduce((s, m) => s + (m.activeClients / (m.activeClients + m.availableSlots)) * 100, 0) / mentors.length
  )
  return { name: `${c.category} Mentors`, capacity: c.mentors, utilization }
})
export const totalMentors = MENTORS.length

// Top performing mentors leaderboard — ranked across all five categories
export type Mentor = {
  name: string
  path: string
  category: Category
  company: string
  rating: number
  score: number
  learners: number
  sessions: number
  avatar: string
}
const PATH_NAME_BY_ID: Record<string, { name: string; category: Category }> = Object.fromEntries(
  GROWTH_PATHS.map(p => [p.id, { name: p.name, category: p.category }])
)
export const topMentors: Mentor[] = MENTORS.slice()
  .sort((a, b) => b.performanceScore - a.performanceScore)
  .slice(0, 8)
  .map(m => ({
    name: m.name,
    path: PATH_NAME_BY_ID[m.pathId]?.name ?? m.pathId,
    category: PATH_NAME_BY_ID[m.pathId]?.category ?? 'Career & Tech',
    company: m.company,
    rating: m.rating,
    score: Math.round(m.performanceScore),
    learners: m.activeClients,
    sessions: m.sessions,
    avatar: m.avatar,
  }))

export { CATEGORIES, CATEGORY_SUMMARIES }

// Executive KPI cards
export type TrendTone = 'growth' | 'stable' | 'decline'
export type Kpi = {
  label: string
  value: string
  prev: string
  growth: number
  spark: number[]
  target: number // 0-100 progress toward monthly target
  targetLabel: string
  trendTone: TrendTone
  areaOpacity: number
}

// Hand-authored trend shapes (fractions of `current`) so every KPI card tells
// a distinct visual story instead of sharing one generic upward wiggle.
// Every shape ends at exactly 1.0 so the line always lands on the real value.
function shapeSpark(current: number, shape: number[]): number[] {
  return shape.map(f => Math.round(current * f * 100) / 100)
}
const SHAPE_STEADY_GROWTH        = [0.880, 0.889, 0.899, 0.909, 0.921, 0.934, 0.949, 0.965, 0.983, 1.000] // smooth steady growth, slight acceleration near the end
const SHAPE_PLATEAU_THEN_RISE    = [0.900, 0.911, 0.921, 0.929, 0.932, 0.933, 0.935, 0.953, 0.977, 1.000] // slow growth, small mid-plateau, then a moderate rise
const SHAPE_STABLE_FLUCTUATION   = [0.975, 0.968, 0.978, 0.965, 0.972, 0.980, 0.970, 0.982, 0.991, 1.000] // mostly stable, small fluctuations, gentle rise at the end
const SHAPE_DIP_RECOVER_FINISH   = [0.900, 0.820, 0.740, 0.700, 0.780, 0.870, 0.930, 0.970, 0.985, 1.000] // volatile — dip, recovery, stronger finish
const SHAPE_INTRADAY_RISE_PEAK   = [0.800, 0.900, 0.840, 0.780, 0.880, 0.950, 0.890, 0.940, 0.990, 1.000] // dynamic intraday — rise, dip, rise, peak at the end
const SHAPE_EXPONENTIAL          = [0.500, 0.504, 0.516, 0.538, 0.573, 0.623, 0.688, 0.768, 0.878, 1.000] // exponential-style growth, steepest in the final segment

const overallCompletion = Math.round(growthPaths.reduce((s, p) => s + p.completion * p.learners, 0) / totalLearners)
const overallPlacement = Math.round(growthPaths.reduce((s, p) => s + p.placement * p.learners, 0) / totalLearners)
const totalRevenueAllCategories = CATEGORY_SUMMARIES.reduce((s, c) => s + c.revenue, 0)
const liveSessionsTodayValue = Math.round(MENTORS.length * 1.9)

export const kpis: Kpi[] = [
  {
    label: 'Total Learners', value: totalLearners.toLocaleString(), prev: Math.round(totalLearners * 0.941).toLocaleString(),
    growth: 6.3, spark: shapeSpark(totalLearners, SHAPE_STEADY_GROWTH), target: 96, targetLabel: `${Math.round(totalLearners * 1.08).toLocaleString()} target`,
    trendTone: 'growth', areaOpacity: 0.16,
  },
  {
    label: 'Active Mentors', value: totalMentors.toString(), prev: Math.round(totalMentors * 0.92).toString(),
    growth: 8.7, spark: shapeSpark(totalMentors, SHAPE_PLATEAU_THEN_RISE), target: 91, targetLabel: `${Math.round(totalMentors * 1.1)} target`,
    trendTone: 'growth', areaOpacity: 0.20,
  },
  {
    label: 'Overall Completion Rate', value: `${overallCompletion}%`, prev: `${overallCompletion - 4}%`,
    growth: 5.3, spark: shapeSpark(overallCompletion, SHAPE_STABLE_FLUCTUATION), target: 96, targetLabel: `${overallCompletion + 3}% target`,
    trendTone: 'stable', areaOpacity: 0.12,
  },
  {
    label: 'Live Sessions Today', value: liveSessionsTodayValue.toString(), prev: Math.round(liveSessionsTodayValue * 0.87).toString(),
    growth: 14.8, spark: shapeSpark(liveSessionsTodayValue, SHAPE_INTRADAY_RISE_PEAK), target: 93, targetLabel: `${Math.round(liveSessionsTodayValue * 1.15)}/day target`,
    trendTone: 'stable', areaOpacity: 0.20,
  },
  {
    label: 'Monthly Revenue', value: `₹${(totalRevenueAllCategories / 10000000).toFixed(2)} Cr`, prev: `₹${(totalRevenueAllCategories * 0.9 / 10000000).toFixed(2)} Cr`,
    growth: 10.9, spark: shapeSpark(totalRevenueAllCategories / 10000000, SHAPE_EXPONENTIAL), target: 89, targetLabel: `₹${(totalRevenueAllCategories * 1.15 / 10000000).toFixed(2)} Cr target`,
    trendTone: 'growth', areaOpacity: 0.32,
  },
]

// Platform growth — multi-series chart data for 7D / 30D / Quarter / Year
export type SeriesPoint = { label: string; newLearners: number; activeLearners: number; liveSessions: number; placements: number; revenue: number }
function buildSeries(n: number, labelFn: (i: number) => string, base: Omit<SeriesPoint, 'label'>): SeriesPoint[] {
  const pts: SeriesPoint[] = []
  for (let i = 0; i < n; i++) {
    const growth = 1 + (i / n) * 0.42
    const wobble = 1 + Math.sin(i * 1.7) * 0.06
    pts.push({
      label: labelFn(i),
      newLearners: Math.round(base.newLearners * growth * wobble),
      activeLearners: Math.round(base.activeLearners * growth * wobble),
      liveSessions: Math.round(base.liveSessions * growth * wobble),
      placements: Math.round(base.placements * growth * wobble),
      revenue: Math.round(base.revenue * growth * wobble * 100) / 100,
    })
  }
  return pts
}
const days7 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const platformGrowth = {
  '7 Days': buildSeries(7, i => days7[i], { newLearners: 55, activeLearners: 1820, liveSessions: 140, placements: 14, revenue: 0.16 }),
  '30 Days': buildSeries(10, i => `D${(i + 1) * 3}`, { newLearners: 48, activeLearners: 1650, liveSessions: 120, placements: 11, revenue: 0.14 }),
  'Quarter': buildSeries(12, i => `Wk ${i + 1}`, { newLearners: 40, activeLearners: 1500, liveSessions: 100, placements: 9, revenue: 0.12 }),
  'Year': buildSeries(12, i => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i], { newLearners: 30, activeLearners: 1100, liveSessions: 75, placements: 6, revenue: 0.08 }),
}

// Learner conversion funnel
export const learnerFunnel = [
  { stage: 'Visitors', value: 42500 },
  { stage: 'Registered', value: 16150 },
  { stage: 'Profile Completed', value: 12980 },
  { stage: 'Growth Path Selected', value: 10850 },
  { stage: 'Learning Active', value: 9200 },
  { stage: 'Course Completed', value: 5780 },
  { stage: 'Placement Ready', value: 4320 },
  { stage: 'Placed', value: 3080 },
]

// Placement hiring pipeline (this month)
export const placementPipeline = [
  { stage: 'Applications', value: 2100 },
  { stage: 'Resume Screening', value: 1240 },
  { stage: 'Technical Interview', value: 640 },
  { stage: 'HR Interview', value: 340 },
  { stage: 'Offer Released', value: 178 },
  { stage: 'Joined', value: 134 },
]

export const placementHighlights = {
  placedThisMonth: 134,
  avgSalary: '₹7.6 LPA',
  topRecruiters: ['TCS', 'Infosys', 'Accenture', 'Capgemini'],
  growth: 9,
}

// Operations Intelligence Center — the weakest and strongest growth paths,
// picked dynamically from live data so they can surface from any category.
const worstGrowthPath = [...growthPaths].sort((a, b) => a.growth - b.growth)[0]
const mostOverloadedCategory = [...CATEGORY_SUMMARIES].sort((a, b) => {
  const utilA = MENTORS.filter(m => GROWTH_PATHS.find(p => p.id === m.pathId)?.category === a.category)
    .reduce((s, m) => s + (m.activeClients / (m.activeClients + m.availableSlots)) * 100, 0) / a.mentors
  const utilB = MENTORS.filter(m => GROWTH_PATHS.find(p => p.id === m.pathId)?.category === b.category)
    .reduce((s, m) => s + (m.activeClients / (m.activeClients + m.availableSlots)) * 100, 0) / b.mentors
  return utilB - utilA
})[0]

export const needsAttention = {
  path: worstGrowthPath.name,
  issue: worstGrowthPath.growth < 0 ? `Enrollment declined ${Math.abs(worstGrowthPath.growth)}% this month` : `Completion trailing at ${worstGrowthPath.completion}%`,
  impact: `${worstGrowthPath.category} · lowest momentum path on the platform this month.`,
  action: 'Assign additional mentor office hours and review Week 2–3 module pacing.',
}
export const mentorCapacityAlert = {
  path: `${mostOverloadedCategory.category} mentors`,
  detail: `${mostOverloadedCategory.mentors} mentors serving ${mostOverloadedCategory.activeLearners.toLocaleString()} active learners across ${mostOverloadedCategory.paths} paths.`,
  recommendation: 'Onboard additional certified mentors in this category this week.',
}
export const bestPerformingPath = [...growthPaths].sort(
  (a, b) => (b.completion + b.rating * 10 + b.growth) - (a.completion + a.rating * 10 + a.growth)
)[0]

// Quality & Risk Center — one alert per Starfix category so the risk board
// always reflects the whole ecosystem, not just Career & Tech.
export type RiskAlert = {
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  title: string
  department: string
  owner: string
  action: string
  updated: string
}
export const riskAlerts: RiskAlert[] = [
  { severity: 'Critical', title: '18 learners inactive for more than 21 days across Personal Life paths.', department: 'Learner Success', owner: 'Ananya Gupta', action: 'Trigger re-engagement campaign immediately.', updated: '18 min ago' },
  { severity: 'High', title: `${mostOverloadedCategory.category} mentors above 92% capacity.`, department: 'Mentor Ops', owner: 'Vikram Rao', action: 'Onboard additional mentors in this category this week.', updated: '1 hr ago' },
  { severity: 'Medium', title: 'Student Life completion dipped 5% during exam season.', department: 'Curriculum', owner: 'Meera Iyer', action: 'Review pacing for Competitive Exam Preparation.', updated: '3 hrs ago' },
  { severity: 'Low', title: 'Health & Fitness retention improving steadily.', department: 'Learner Success', owner: 'Priya Nair', action: 'No action needed — monitor trend.', updated: '5 hrs ago' },
]

// AI Insights — spanning all five categories
export const aiInsights: string[] = [
  'Mindset category enrollments expected to grow fastest next month, led by Public Speaking & Confidence.',
  'Recommend hiring additional Health & Fitness coaches to sustain Yoga and Meditation demand.',
  `${mostOverloadedCategory.category} mentors nearing capacity — plan recruitment now.`,
  'Student Life completion improving ahead of competitive exam season.',
  'Personal Life category shows the platform’s lowest completion rate — review onboarding flow.',
  'Recommend a learner re-engagement campaign for learners inactive 14+ days.',
  'Career & Tech placement rate projected to rise as Cyber Security and AI/ML demand grows.',
]

// Recent platform activity — sampled across categories
export const platformActivity = [
  { text: '31 learners enrolled in Confidence Building (Mindset).', time: '8 min ago' },
  { text: 'A new mentor was approved for Weight Loss & Fat Loss Coaching.', time: '32 min ago' },
  { text: 'Yoga & Flexibility reached 90% completion this cohort.', time: '1 hr ago' },
  { text: '14 learners received placement offers in Career & Tech paths.', time: '2 hrs ago' },
  { text: 'Competitive Exam Preparation launched a new cohort.', time: '4 hrs ago' },
  { text: 'Personal Finance & Money Management mentor waitlist cleared.', time: '6 hrs ago' },
]

export const cohorts = Array.from({ length: 15 }, (_, i) => `Cohort ${i + 10}`)
export const regions = ['All Regions', 'North India', 'South India', 'West India', 'East India', 'International']
export const placementStatuses = ['All', 'Placed', 'Placement Ready', 'In Progress', 'Not Started']

// ── Category Health & Awards — derived from CATEGORY_SUMMARIES (../mentors/data) ─
// so this reuses the exact same numbers shown on the Mentor Intelligence and
// Analytics pages instead of a second, hand-typed data set.
export type HealthStatus = 'Healthy' | 'Needs Attention' | 'Critical'

export const categoryAwards: { title: string; icon: string; winner: (typeof CATEGORY_SUMMARIES)[number]; metric: string }[] = [
  { title: 'Fastest Growing', icon: 'trendUp', winner: [...CATEGORY_SUMMARIES].sort((a, b) => b.growth - a.growth)[0], metric: '' },
  { title: 'Highest Retention', icon: 'shieldCheck', winner: [...CATEGORY_SUMMARIES].sort((a, b) => b.retention - a.retention)[0], metric: '' },
  { title: 'Highest Revenue', icon: 'dollar', winner: [...CATEGORY_SUMMARIES].sort((a, b) => b.revenue - a.revenue)[0], metric: '' },
  { title: 'Most Active Learners', icon: 'users', winner: [...CATEGORY_SUMMARIES].sort((a, b) => b.activeLearners - a.activeLearners)[0], metric: '' },
  { title: 'Most Completed', icon: 'check', winner: [...CATEGORY_SUMMARIES].sort((a, b) => b.completion - a.completion)[0], metric: '' },
  { title: 'Highest Rated', icon: 'star', winner: [...CATEGORY_SUMMARIES].sort((a, b) => b.rating - a.rating)[0], metric: '' },
  { title: 'Most Growth Paths', icon: 'layers', winner: [...CATEGORY_SUMMARIES].sort((a, b) => b.paths - a.paths)[0], metric: '' },
].map(a => ({
  ...a,
  metric:
    a.title === 'Fastest Growing' ? `+${a.winner.growth}%` :
    a.title === 'Highest Retention' ? `${a.winner.retention}%` :
    a.title === 'Highest Revenue' ? `₹${(a.winner.revenue / 10000000).toFixed(2)} Cr` :
    a.title === 'Most Active Learners' ? a.winner.activeLearners.toLocaleString() :
    a.title === 'Most Completed' ? `${a.winner.completion}%` :
    a.title === 'Most Growth Paths' ? `${a.winner.paths} paths` :
    a.winner.rating.toFixed(2),
}))

// Alias kept for readability where "best across the whole ecosystem" is the intent
export const bestOverallPath = bestPerformingPath

