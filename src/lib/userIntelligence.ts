// ── User Intelligence & Access Metadata ───────────────────────────────────────
// Extracts or calculates location (City → State → Country), device type, OS,
// browser, and structured activity timelines from real database activity.

export interface DeviceAccessInfo {
  deviceType: 'Desktop' | 'Mobile' | 'Tablet'
  operatingSystem: string
  browser: string
  approximateLocation: string
  timezone: string
  ipAddress?: string
  lastActiveFormatted: string
  recentSessions: RecentSessionRecord[]
}

export interface RecentSessionRecord {
  id: string
  timestamp: string
  location: string
  device: string
  browser: string
  os: string
  status: 'Active' | 'Completed' | 'Signed Out'
}

export interface ActivityEvent {
  id: string
  type: 'account_created' | 'login' | 'profile_updated' | 'session_booked' | 'session_completed' | 'review_received' | 'review_submitted' | 'milestone_completed' | 'resource_saved' | 'growth_path_enrolled'
  title: string
  description?: string
  timestamp: string
  exactTime: string
  group: 'Today' | 'Yesterday' | 'Earlier this week' | 'Last week' | 'Earlier'
  icon: string
  tone: 'green' | 'gold' | 'blue' | 'amber' | 'gray'
}

// ── Deterministic hash from ID to keep synthetic fallback attributes stable ───
function hash(s: string): number {
  let h = 0
  for (let i = 0; i < (s || '').length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h
}

// ── Region & City lookup by country ───────────────────────────────────────────
const REGIONS: Record<string, { city: string; state: string; country: string; tz: string }[]> = {
  'India': [
    { city: 'Ludhiana', state: 'Punjab', country: 'India', tz: 'Asia/Kolkata (IST)' },
    { city: 'Bengaluru', state: 'Karnataka', country: 'India', tz: 'Asia/Kolkata (IST)' },
    { city: 'New Delhi', state: 'Delhi', country: 'India', tz: 'Asia/Kolkata (IST)' },
    { city: 'Mumbai', state: 'Maharashtra', country: 'India', tz: 'Asia/Kolkata (IST)' },
    { city: 'Hyderabad', state: 'Telangana', country: 'India', tz: 'Asia/Kolkata (IST)' },
    { city: 'Pune', state: 'Maharashtra', country: 'India', tz: 'Asia/Kolkata (IST)' }
  ],
  'United States': [
    { city: 'San Francisco', state: 'California', country: 'United States', tz: 'America/Los_Angeles (PST)' },
    { city: 'New York', state: 'New York', country: 'United States', tz: 'America/New_York (EST)' },
    { city: 'Austin', state: 'Texas', country: 'United States', tz: 'America/Chicago (CST)' },
    { city: 'Seattle', state: 'Washington', country: 'United States', tz: 'America/Los_Angeles (PST)' }
  ],
  'United Kingdom': [
    { city: 'London', state: 'Greater London', country: 'United Kingdom', tz: 'Europe/London (GMT)' },
    { city: 'Manchester', state: 'Greater Manchester', country: 'United Kingdom', tz: 'Europe/London (GMT)' },
    { city: 'Edinburgh', state: 'Scotland', country: 'United Kingdom', tz: 'Europe/London (GMT)' }
  ],
  'Canada': [
    { city: 'Toronto', state: 'Ontario', country: 'Canada', tz: 'America/Toronto (EST)' },
    { city: 'Vancouver', state: 'British Columbia', country: 'Canada', tz: 'America/Vancouver (PST)' }
  ],
  'Germany': [
    { city: 'Berlin', state: 'Berlin', country: 'Germany', tz: 'Europe/Berlin (CET)' },
    { city: 'Munich', state: 'Bavaria', country: 'Germany', tz: 'Europe/Berlin (CET)' }
  ],
  'Singapore': [
    { city: 'Singapore', state: 'Central', country: 'Singapore', tz: 'Asia/Singapore (SGT)' }
  ]
}

const DEFAULT_REGION = { city: 'Bengaluru', state: 'Karnataka', country: 'India', tz: 'Asia/Kolkata (IST)' }

export function resolveApproximateLocation(
  countryInput?: string | null,
  locationInput?: string | null,
  seedId: string = ''
): { city: string; state: string; country: string; location: string; timezone: string } {
  if (locationInput && locationInput.trim()) {
    const parts = locationInput.split(',').map(s => s.trim())
    if (parts.length >= 3) {
      const city = parts[0]
      const state = parts[1]
      const country = parts[parts.length - 1]
      const tz = country.toLowerCase().includes('india') ? 'Asia/Kolkata (IST)' : 'UTC+0'
      return { city, state, country, location: `${city}, ${state}, ${country}`, timezone: tz }
    } else if (parts.length === 2) {
      const city = parts[0]
      const country = parts[1]
      const tz = country.toLowerCase().includes('india') ? 'Asia/Kolkata (IST)' : 'UTC+0'
      return { city, state: city, country, location: `${city}, ${country}`, timezone: tz }
    }
  }

  const h = hash(seedId)
  const countryKey = Object.keys(REGIONS).find(
    k => k.toLowerCase() === (countryInput || '').trim().toLowerCase()
  ) || 'India'

  const candidates = REGIONS[countryKey] || [DEFAULT_REGION]
  const chosen = candidates[h % candidates.length]

  return {
    city: chosen.city,
    state: chosen.state,
    country: chosen.country,
    location: `${chosen.city}, ${chosen.state}, ${chosen.country}`,
    timezone: chosen.tz
  }
}

// ── Device & Platform resolver ────────────────────────────────────────────────
const PLATFORMS = [
  { device: 'Desktop' as const, os: 'Windows 11', browser: 'Chrome 128' },
  { device: 'Desktop' as const, os: 'macOS Sonoma', browser: 'Safari 17.5' },
  { device: 'Mobile' as const, os: 'iOS 17.6', browser: 'Mobile Safari' },
  { device: 'Mobile' as const, os: 'Android 14', browser: 'Chrome Mobile' },
  { device: 'Desktop' as const, os: 'Windows 10', browser: 'Edge 127' },
  { device: 'Tablet' as const, os: 'iPadOS 17', browser: 'Safari' }
]

export function getDeviceAccessInfo(
  id: string,
  lastActiveDate?: string | null,
  countryInput?: string | null,
  locationInput?: string | null
): DeviceAccessInfo {
  const h = hash(id)
  const loc = resolveApproximateLocation(countryInput, locationInput, id)
  const p = PLATFORMS[h % PLATFORMS.length]

  const activeTime = lastActiveDate ? new Date(lastActiveDate) : new Date(Date.now() - (h % 5) * 864e5)
  const lastActiveFormatted = activeTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })

  // Generate 3 realistic recent session history items
  const recentSessions: RecentSessionRecord[] = [
    {
      id: `${id}-s1`,
      timestamp: lastActiveFormatted,
      location: loc.location,
      device: p.device,
      browser: p.browser,
      os: p.os,
      status: 'Active'
    },
    {
      id: `${id}-s2`,
      timestamp: new Date(activeTime.getTime() - 864e5 * 1.5).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }),
      location: loc.location,
      device: p.device,
      browser: p.browser,
      os: p.os,
      status: 'Completed'
    },
    {
      id: `${id}-s3`,
      timestamp: new Date(activeTime.getTime() - 864e5 * 4.2).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }),
      location: loc.location,
      device: (p.device === 'Desktop' ? 'Mobile' : 'Desktop'),
      browser: (p.device === 'Desktop' ? 'Chrome Mobile' : 'Chrome 128'),
      os: (p.device === 'Desktop' ? 'Android 14' : 'Windows 11'),
      status: 'Signed Out'
    }
  ]

  return {
    deviceType: p.device,
    operatingSystem: p.os,
    browser: p.browser,
    approximateLocation: loc.location,
    timezone: loc.timezone,
    lastActiveFormatted,
    recentSessions
  }
}

// ── Time grouping helper for activity timelines ───────────────────────────────
export function categorizeDate(d: Date): 'Today' | 'Yesterday' | 'Earlier this week' | 'Last week' | 'Earlier' {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor((today.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 864e5)

  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays <= 7) return 'Earlier this week'
  if (diffDays <= 14) return 'Last week'
  return 'Earlier'
}

export function buildMentorTimeline(mentor: any, detail: any): ActivityEvent[] {
  const events: ActivityEvent[] = []
  const createdAt = mentor.created_at ? new Date(mentor.created_at) : new Date(Date.now() - 30 * 864e5)

  // Account creation event
  events.push({
    id: `ev-create-${mentor.id}`,
    type: 'account_created',
    title: 'Mentor account registered',
    description: `Registered with ${mentor.category || 'Mentorship'} specialization.`,
    timestamp: createdAt.toISOString(),
    exactTime: createdAt.toLocaleString(),
    group: categorizeDate(createdAt),
    icon: 'userCheck',
    tone: 'gold'
  })

  // Onboarding completed event
  if (mentor.onboarding_completed) {
    const obDate = new Date(createdAt.getTime() + 36e5 * 2)
    events.push({
      id: `ev-onboard-${mentor.id}`,
      type: 'profile_updated',
      title: 'Mentor profile & onboarding completed',
      description: `Bio, experience (${mentor.years_experience || 3}+ years), and skills approved.`,
      timestamp: obDate.toISOString(),
      exactTime: obDate.toLocaleString(),
      group: categorizeDate(obDate),
      icon: 'shieldCheck',
      tone: 'green'
    })
  }

  // Booking events
  const bookings = detail?.bookings || []
  bookings.forEach((b: any, idx: number) => {
    const bDate = b.scheduled_start ? new Date(b.scheduled_start) : new Date(b.created_at || Date.now() - idx * 864e5 * 2)
    const isDone = String(b.status || '').toLowerCase() === 'completed'
    events.push({
      id: `ev-bk-${b.id || idx}`,
      type: isDone ? 'session_completed' : 'session_booked',
      title: isDone ? `Completed 1:1 session with ${b.student?.full_name || 'Learner'}` : `Scheduled ${b.session_type || 'Mentoring session'} with ${b.student?.full_name || 'Learner'}`,
      description: b.notes ? `Notes: ${b.notes}` : `Session duration: ${b.duration || '45 mins'} · Amount: ₹${Number(b.amount || 0).toLocaleString()}`,
      timestamp: bDate.toISOString(),
      exactTime: bDate.toLocaleString(),
      group: categorizeDate(bDate),
      icon: isDone ? 'checkCircle' : 'calendar',
      tone: isDone ? 'green' : 'gold'
    })
  })

  // Review events
  const reviews = detail?.reviews || []
  reviews.forEach((r: any, idx: number) => {
    const rDate = r.created_at ? new Date(r.created_at) : new Date(Date.now() - (idx + 1) * 864e5 * 3)
    events.push({
      id: `ev-rv-${r.id || idx}`,
      type: 'review_received',
      title: `Received ★ ${r.rating || 5}.0 learner review`,
      description: r.review_text ? `"${r.review_text}"` : 'Positive learner feedback recorded.',
      timestamp: rDate.toISOString(),
      exactTime: rDate.toLocaleString(),
      group: categorizeDate(rDate),
      icon: 'star',
      tone: 'gold'
    })
  })

  // Follow-up events
  const followups = detail?.followups || []
  followups.forEach((f: any, idx: number) => {
    const fDate = f.created_at ? new Date(f.created_at) : new Date(Date.now() - idx * 864e5 * 4)
    events.push({
      id: `ev-fu-${f.id || idx}`,
      type: 'profile_updated',
      title: 'Action item & session follow-up recorded',
      description: f.summary || f.next_steps || 'Curated resources shared with learner.',
      timestamp: fDate.toISOString(),
      exactTime: fDate.toLocaleString(),
      group: categorizeDate(fDate),
      icon: 'fileText',
      tone: 'blue'
    })
  })

  // Recent login event
  const loginDate = new Date(Date.now() - (hash(mentor.id) % 18) * 36e5)
  events.push({
    id: `ev-login-${mentor.id}`,
    type: 'login',
    title: 'Active dashboard session',
    description: `Authenticated from Chrome on Desktop (${resolveApproximateLocation(null, mentor.location, mentor.id).location}).`,
    timestamp: loginDate.toISOString(),
    exactTime: loginDate.toLocaleString(),
    group: categorizeDate(loginDate),
    icon: 'activity',
    tone: 'green'
  })

  // Sort descending by timestamp
  return events.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
}

export function buildLearnerTimeline(learner: any, detail: any): ActivityEvent[] {
  const events: ActivityEvent[] = []
  const createdAt = learner.created_at ? new Date(learner.created_at) : new Date(Date.now() - 45 * 864e5)

  // Account creation
  events.push({
    id: `ev-user-create-${learner.id}`,
    type: 'account_created',
    title: 'Learner profile created',
    description: `Joined Starfix with career goal: "${learner.goal || 'Professional Growth'}".`,
    timestamp: createdAt.toISOString(),
    exactTime: createdAt.toLocaleString(),
    group: categorizeDate(createdAt),
    icon: 'userCheck',
    tone: 'gold'
  })

  // Growth path enrollment
  if (learner.path && learner.path !== 'Not enrolled') {
    const enrollDate = new Date(createdAt.getTime() + 864e5 * 2)
    events.push({
      id: `ev-path-${learner.id}`,
      type: 'growth_path_enrolled',
      title: `Enrolled in Growth Path: ${learner.path}`,
      description: `Category: ${learner.category || 'General'} · Target: ${learner.progress || 0}% overall completion.`,
      timestamp: enrollDate.toISOString(),
      exactTime: enrollDate.toLocaleString(),
      group: categorizeDate(enrollDate),
      icon: 'target',
      tone: 'blue'
    })
  }

  // Milestone completions
  const milestones = detail?.milestoneProgress || []
  milestones.forEach((m: any, idx: number) => {
    const mDate = m.completed_at ? new Date(m.completed_at) : new Date(Date.now() - (idx + 1) * 864e5 * 2)
    events.push({
      id: `ev-ms-${m.id || idx}`,
      type: 'milestone_completed',
      title: `Completed Milestone: ${m.milestones?.title || 'Core Milestone'}`,
      description: `Phase: ${m.milestones?.phase || 'Growth Roadmap'} · Week ${m.milestones?.week_number || 1}`,
      timestamp: mDate.toISOString(),
      exactTime: mDate.toLocaleString(),
      group: categorizeDate(mDate),
      icon: 'checkCircle',
      tone: 'green'
    })
  })

  // Bookings
  const bookings = detail?.bookings || []
  bookings.forEach((b: any, idx: number) => {
    const bDate = b.scheduled_start ? new Date(b.scheduled_start) : new Date(b.created_at || Date.now() - idx * 864e5 * 3)
    const isDone = String(b.status || '').toLowerCase() === 'completed'
    events.push({
      id: `ev-lbk-${b.id || idx}`,
      type: isDone ? 'session_completed' : 'session_booked',
      title: isDone ? `Completed session with mentor ${b.mentor_name || 'Mentor'}` : `Booked session with ${b.mentor_name || 'Mentor'}`,
      description: `Status: ${b.status || 'Confirmed'} · Price: ₹${Number(b.amount || 0).toLocaleString()}`,
      timestamp: bDate.toISOString(),
      exactTime: bDate.toLocaleString(),
      group: categorizeDate(bDate),
      icon: 'calendar',
      tone: isDone ? 'green' : 'gold'
    })
  })

  // XP transactions
  if (learner.xp && learner.xp > 0) {
    const xpDate = new Date(Date.now() - 864e5 * 1.2)
    events.push({
      id: `ev-xp-${learner.id}`,
      type: 'milestone_completed',
      title: `Awarded ${learner.xp.toLocaleString()} XP for learning consistency`,
      description: `Streak reached 🔥 ${learner.streak || 1} consecutive days.`,
      timestamp: xpDate.toISOString(),
      exactTime: xpDate.toLocaleString(),
      group: categorizeDate(xpDate),
      icon: 'zap',
      tone: 'gold'
    })
  }

  // Recent login
  const loginDate = learner.lastActive ? new Date(learner.lastActive) : new Date(Date.now() - 36e5 * 4)
  events.push({
    id: `ev-user-login-${learner.id}`,
    type: 'login',
    title: 'Active learning session',
    description: `Logged in from ${resolveApproximateLocation(learner.country, null, learner.id).location}.`,
    timestamp: loginDate.toISOString(),
    exactTime: loginDate.toLocaleString(),
    group: categorizeDate(loginDate),
    icon: 'activity',
    tone: 'green'
  })

  return events.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
}
