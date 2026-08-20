// ── Platform Ecosystem Analytics — Data Layer ───────────────────────────────
// Covers the domains that sit outside the mentor/growth-path model: users,
// content, community, AI recommendations, goals, habits, and search. Anchored
// wherever possible to TOTAL_LEARNERS / ACTIVE_LEARNERS / CATEGORY_SUMMARIES /
// GROWTH_PATHS / MENTORS so figures can't drift from the rest of the
// dashboard; everything else is generated deterministically from seeded
// hashes so re-running the app always yields the same numbers.

import { GROWTH_PATHS, MENTORS, CATEGORIES, pathsByCategory, type Category } from '../mentors/data'
import { TOTAL_LEARNERS, ACTIVE_LEARNERS, OVERALL_COMPLETION_RATE, CATEGORY_SUMMARIES } from './data'

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

// ── 6. USER ANALYTICS ────────────────────────────────────────────────────────

export interface AgeBracket { label: string; pct: number; users: number }
export interface CountryShare { name: string; pct: number; users: number }
export interface CategoryUserShare { category: Category; users: number }

const AGE_WEIGHTS: [string, number][] = [
  ['13–17', 0.04], ['18–24', 0.34], ['25–34', 0.36], ['35–44', 0.17], ['45–54', 0.07], ['55+', 0.02],
]
export const USERS_BY_AGE: AgeBracket[] = AGE_WEIGHTS.map(([label, pct]) => ({
  label, pct: Math.round(pct * 1000) / 10, users: Math.round(TOTAL_LEARNERS * pct),
}))

const COUNTRY_WEIGHTS: [string, number][] = [
  ['India', 0.74], ['United States', 0.07], ['United Arab Emirates', 0.05], ['United Kingdom', 0.04],
  ['Canada', 0.03], ['Singapore', 0.02], ['Australia', 0.02], ['Other', 0.03],
]
export const USERS_BY_COUNTRY: CountryShare[] = COUNTRY_WEIGHTS.map(([name, pct]) => ({
  name, pct: Math.round(pct * 1000) / 10, users: Math.round(TOTAL_LEARNERS * pct),
}))

export const USERS_BY_CATEGORY: CategoryUserShare[] = CATEGORY_SUMMARIES.map(c => ({ category: c.category, users: c.learners }))

export const USER_ANALYTICS = (() => {
  const rng = rngFor('user-analytics')
  const dau = Math.round(ACTIVE_LEARNERS * 0.34)
  const wau = Math.round(ACTIVE_LEARNERS * 0.61)
  const mau = Math.round(ACTIVE_LEARNERS * 0.89)
  const returningUsersPct = Math.round((0.58 + rng() * 0.08) * 1000) / 10
  const premiumPct = Math.round((0.35 + rng() * 0.08) * 1000) / 10
  const freePct = Math.round((100 - premiumPct) * 10) / 10
  const conversionRate = Math.round((0.08 + rng() * 0.04) * 1000) / 10
  const avgSessionDurationMin = Math.round((22 + rng() * 12) * 10) / 10
  const avgStreakDays = Math.round((9 + rng() * 8) * 10) / 10
  const dailyCheckIns = Math.round(ACTIVE_LEARNERS * (0.38 + rng() * 0.08))
  return {
    dau, wau, mau,
    returningUsersPct, premiumPct, freePct, conversionRate,
    avgSessionDurationMin, completionRate: OVERALL_COMPLETION_RATE,
    avgStreakDays, dailyCheckIns,
  }
})()

// ── 7. CONTENT ANALYTICS ─────────────────────────────────────────────────────

export interface LessonMetric {
  id: string
  title: string
  pathName: string
  category: Category
  views: number
  completions: number
  skips: number
  bookmarks: number
  replays: number
  downloads: number
  rating: number
}

const LESSON_TEMPLATES: Record<Category, string[]> = {
  'Career & Tech': ['System Design Fundamentals', 'React Hooks Deep Dive', 'Mock Interview Walkthrough', 'Building a REST API', 'Debugging Production Incidents'],
  'Health & Fitness': ['Macro Coaching Fundamentals', 'Progressive Overload Explained', 'Vinyasa Flow for Beginners', 'Marathon Taper Week Guide', 'Breathwork for Recovery'],
  'Mindset': ['Building Unshakeable Confidence', 'The Focus Protocol', 'Reframing Negative Self-Talk', 'Public Speaking Warm-Ups', 'Entering Deep Work States'],
  'Personal Life': ['Setting Healthy Boundaries', 'Budgeting for Beginners', 'Active Listening in Practice', 'Habit Stacking Walkthrough', 'Positive Discipline Basics'],
  'Student Life': ['Active Recall Techniques', 'Mock Test Analysis Framework', 'Cornell Note-Taking System', 'Memory Palace Method', 'Internship Application Strategy'],
}

export const LESSON_LIBRARY: LessonMetric[] = CATEGORIES.flatMap(category => {
  const paths = pathsByCategory(category)
  return LESSON_TEMPLATES[category].map((title, i) => {
    const path = paths[i % paths.length]
    const id = `lesson-${category}-${i}`
    const rng = rngFor(id)
    const views = Math.round(1200 + rng() * 6800)
    const completions = Math.round(views * (0.42 + rng() * 0.32))
    const skips = Math.round(views * (0.06 + rng() * 0.14))
    const bookmarks = Math.round(views * (0.08 + rng() * 0.18))
    const replays = Math.round(views * (0.04 + rng() * 0.16))
    const downloads = Math.round(views * (0.05 + rng() * 0.2))
    const rating = Math.round((3.4 + rng() * 1.6) * 10) / 10
    return { id, title, pathName: path.name, category, views, completions, skips, bookmarks, replays, downloads, rating: Math.min(5, rating) }
  })
})

function topLessonsBy(metric: keyof LessonMetric, n = 5) {
  return [...LESSON_LIBRARY].sort((a, b) => (b[metric] as number) - (a[metric] as number)).slice(0, n)
}

export const CONTENT_ANALYTICS = {
  mostWatched: topLessonsBy('views'),
  mostCompleted: topLessonsBy('completions'),
  mostSkipped: topLessonsBy('skips'),
  mostBookmarked: topLessonsBy('bookmarks'),
  mostReplayed: topLessonsBy('replays'),
  mostDownloaded: topLessonsBy('downloads'),
  highestRated: [...LESSON_LIBRARY].sort((a, b) => b.rating - a.rating).slice(0, 5),
  lowestRated: [...LESSON_LIBRARY].sort((a, b) => a.rating - b.rating).slice(0, 5),
}

// ── 8. COMMUNITY ANALYTICS ───────────────────────────────────────────────────

export interface CommunityMetric {
  pathId: string
  pathName: string
  category: Category
  members: number
  posts: number
  comments: number
  likes: number
  shares: number
}

export const COMMUNITIES: CommunityMetric[] = GROWTH_PATHS.map(p => {
  const rng = rngFor(`community-${p.id}`)
  const members = Math.round(p.activeLearners * (0.3 + rng() * 0.35))
  const posts = Math.round(members * (0.08 + rng() * 0.12))
  const comments = Math.round(posts * (2.5 + rng() * 3))
  const likes = Math.round(comments * (2 + rng() * 2.5))
  const shares = Math.round(posts * (0.15 + rng() * 0.35))
  return { pathId: p.id, pathName: p.name, category: p.category, members, posts, comments, likes, shares }
})

const CONTRIBUTOR_NAMES = [
  'Ananya R.', 'Marcus T.', 'Priya S.', 'Daniel W.', 'Isha K.', 'Ryan F.', 'Meera V.', 'Julian B.',
  'Kavya N.', 'Ethan C.', 'Rohan D.', 'Sofia M.', 'Arjun P.', 'Grace L.', 'Vikram J.',
]

export const TOP_CONTRIBUTORS = CONTRIBUTOR_NAMES.slice(0, 8).map((name, i) => {
  const rng = rngFor(`contributor-${name}`)
  return { name, posts: Math.round(40 + rng() * 220), rank: i + 1 }
}).sort((a, b) => b.posts - a.posts)

export const DAILY_DISCUSSIONS = Array.from({ length: 7 }, (_, i) => {
  const rng = rngFor(`discussions-${i}`)
  const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]
  return { day, count: Math.round(180 + rng() * 260) }
})

export const COMMUNITY_ANALYTICS = {
  totalPosts: COMMUNITIES.reduce((s, c) => s + c.posts, 0),
  totalComments: COMMUNITIES.reduce((s, c) => s + c.comments, 0),
  totalLikes: COMMUNITIES.reduce((s, c) => s + c.likes, 0),
  totalShares: COMMUNITIES.reduce((s, c) => s + c.shares, 0),
  mentions: Math.round(COMMUNITIES.reduce((s, c) => s + c.comments, 0) * 0.18),
  communitiesCreated: COMMUNITIES.length,
  mostActiveCommunity: [...COMMUNITIES].sort((a, b) => (b.posts + b.comments) - (a.posts + a.comments))[0],
  topContributors: TOP_CONTRIBUTORS,
  dailyDiscussions: DAILY_DISCUSSIONS,
}

// ── 9. AI ANALYTICS (in-app recommendation engine) ──────────────────────────

export const AI_RECOMMENDATION_ANALYTICS = (() => {
  const rng = rngFor('ai-recommendations')
  const recommendationsServed = Math.round(ACTIVE_LEARNERS * (3.6 + rng() * 1.2))
  const acceptanceRate = Math.round((0.31 + rng() * 0.09) * 1000) / 10
  const dismissalRate = Math.round((0.42 + rng() * 0.08) * 1000) / 10
  const ctr = Math.round((0.18 + rng() * 0.06) * 1000) / 10
  const personalizationAccuracy = Math.round((0.74 + rng() * 0.12) * 1000) / 10
  const topRecommendedPaths = [...GROWTH_PATHS].sort((a, b) => b.trend - a.trend).slice(0, 6)
  return { recommendationsServed, acceptanceRate, dismissalRate, ctr, personalizationAccuracy, topRecommendedPaths }
})()

// ── 10. GOAL TRACKING ─────────────────────────────────────────────────────────

export interface GoalTemplate { name: string; category: Category }

const GOAL_TEMPLATES: GoalTemplate[] = [
  { name: 'Complete Full Stack Development Path', category: 'Career & Tech' },
  { name: 'Land a Software Engineering Offer', category: 'Career & Tech' },
  { name: 'Lose 5kg in 12 Weeks', category: 'Health & Fitness' },
  { name: 'Run a Sub-30-Minute 5K', category: 'Health & Fitness' },
  { name: 'Build a 30-Day Meditation Streak', category: 'Mindset' },
  { name: 'Deliver a Confident Public Talk', category: 'Mindset' },
  { name: 'Save 3 Months of Expenses', category: 'Personal Life' },
  { name: 'Build a Consistent Morning Routine', category: 'Personal Life' },
  { name: 'Crack a Competitive Entrance Exam', category: 'Student Life' },
  { name: 'Improve Study Recall by 25%', category: 'Student Life' },
]

export const GOAL_ANALYTICS = (() => {
  const rng = rngFor('goal-tracking')
  const goalsCreated = Math.round(ACTIVE_LEARNERS * (0.9 + rng() * 0.4))
  const goalsCompleted = Math.round(goalsCreated * (0.38 + rng() * 0.12))
  const avgCompletionDays = Math.round(28 + rng() * 34)
  const abandonmentRate = Math.round(((goalsCreated - goalsCompleted) / goalsCreated) * 400) / 10 // partial abandonment vs still-in-progress split
  const mostPopular = GOAL_TEMPLATES.map(g => {
    const r = rngFor(`goal-${g.name}`)
    return { ...g, count: Math.round(400 + r() * 2600) }
  }).sort((a, b) => b.count - a.count)
  const byCategory = CATEGORY_SUMMARIES.map(c => ({
    category: c.category,
    goals: Math.round(goalsCreated * (c.activeLearners / ACTIVE_LEARNERS)),
  }))
  return { goalsCreated, goalsCompleted, avgCompletionDays, abandonmentRate, mostPopular: mostPopular.slice(0, 6), byCategory }
})()

// ── 11. HABIT ANALYTICS ───────────────────────────────────────────────────────

const HABIT_TEMPLATES = [
  'Daily Study Session', 'Morning Workout', 'Meditation Streak', 'Daily Vocabulary Review',
  'Gratitude Journaling', 'No-Snooze Wake-Up', 'Evening Planning Review', 'Weekly Mentor Check-In',
]

export const HABIT_ANALYTICS = (() => {
  const rng = rngFor('habit-analytics')
  const habitsCreated = Math.round(ACTIVE_LEARNERS * (0.55 + rng() * 0.25))
  const longestStreak = Math.round(140 + rng() * 90)
  const brokenStreaks = Math.round(habitsCreated * (0.22 + rng() * 0.1))
  const completionRate = Math.round((0.61 + rng() * 0.14) * 1000) / 10
  const weeklyConsistency = Math.round((0.68 + rng() * 0.12) * 1000) / 10
  const topHabits = HABIT_TEMPLATES.map(name => {
    const r = rngFor(`habit-${name}`)
    return { name, activeStreaks: Math.round(300 + r() * 1800), avgStreakDays: Math.round(8 + r() * 22) }
  }).sort((a, b) => b.activeStreaks - a.activeStreaks)
  return { habitsCreated, longestStreak, brokenStreaks, completionRate, weeklyConsistency, topHabits }
})()

// ── 12. SEARCH ANALYTICS ──────────────────────────────────────────────────────

const ZERO_RESULT_QUERIES = [
  'crypto trading mentor', 'IELTS speaking coach', 'chess coaching', 'classical guitar lessons',
  'resume writing service only', 'free 1:1 mentorship',
]

export const SEARCH_ANALYTICS = (() => {
  const topSearches = [...GROWTH_PATHS]
    .sort((a, b) => b.activeLearners - a.activeLearners)
    .slice(0, 8)
    .map(p => {
      const r = rngFor(`search-${p.id}`)
      return { query: p.name, count: Math.round(p.activeLearners * (0.6 + r() * 0.5)) }
    })

  const trending = [...GROWTH_PATHS]
    .sort((a, b) => b.trend - a.trend)
    .slice(0, 6)
    .map(p => ({ query: p.name, trend: p.trend }))

  const zeroResult = ZERO_RESULT_QUERIES.map(q => {
    const r = rngFor(`zero-${q}`)
    return { query: q, count: Math.round(20 + r() * 180) }
  }).sort((a, b) => b.count - a.count)

  const mostSearchedMentors = [...MENTORS]
    .sort((a, b) => b.rating - a.rating || b.performanceScore - a.performanceScore)
    .slice(0, 6)
    .map(m => {
      const r = rngFor(`search-mentor-${m.id}`)
      return { name: m.name, pathId: m.pathId, count: Math.round(120 + r() * 680) }
    })

  const mostSearchedPaths = [...GROWTH_PATHS]
    .sort((a, b) => b.activeLearners - a.activeLearners)
    .slice(0, 6)
    .map(p => ({ name: p.name, count: topSearches.find(s => s.query === p.name)?.count ?? p.activeLearners }))

  return { topSearches, trending, zeroResult, mostSearchedMentors, mostSearchedPaths }
})()
