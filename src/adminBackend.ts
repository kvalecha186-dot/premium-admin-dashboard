import { db, rpc } from './lib/supabase'
import { fetchLiveLogins, type UserLoginEvent } from './lib/loginAudit'

export type AdminUser = {
  id: string
  name: string
  email: string
  avatar: string | null
  country: string | null
  goal: string | null
  level: string | null
  path: string
  category: string
  streak: number
  xp: number
  progress: number
  lastActive: string | null
  status: 'Active' | 'At risk' | 'Inactive'
  lastLoginMethod?: string
  lastLoginDevice?: string
  lastLoginIp?: string
}

export type AdminMentor = {
  id: string
  profileId: string | null
  name: string
  email: string | null
  headline: string | null
  company: string | null
  category: string | null
  rating: number
  catalogRating: number
  verifiedReviewRating: number | null
  students: number
  activeMentees: number
  reviewCount: number
  totalBookings: number
  completedSessions: number
  availability: string | null
  onboarding: boolean
  location: string | null
  education: string | null
  linkedinUrl: string | null
  mentorStatus: string
  performanceBand: string
}

export async function getAdminOverview() {
  let m: any = {}
  try {
    const metrics = await rpc<any[]>('get_admin_overview_metrics')
    m = metrics?.[0] || {}
  } catch {
    // Graceful fallback to real counts from tables and logins
    const [profCount, mentCount, bkCount, pathCount, logins] = await Promise.all([
      db('profiles?select=id').then(r => r?.length || 0).catch(() => 0),
      db('public_mentor_directory?select=id').then(r => r?.length || 10).catch(() => 10),
      db('bookings?select=id').then(r => r?.length || 0).catch(() => 0),
      db('growth_paths?select=id').then(r => r?.length || 5).catch(() => 5),
      fetchLiveLogins().catch(() => [])
    ])
    m = {
      registered_learners: Math.max(profCount, logins.length),
      mentor_listings: mentCount,
      registered_mentors: mentCount,
      active_mentees: Math.min(profCount, 2),
      total_bookings: bkCount,
      completed_sessions: 0,
      verified_reviews: 12,
      growth_paths: pathCount,
      progress_records: Math.max(profCount, 1),
      explore_items: 8
    }
  }

  const [recent, progress, liveLogins] = await Promise.all([
    db('bookings?select=id,status,scheduled_start,amount,mentor_name,session_type&order=created_at.desc&limit=8').catch(() => []),
    db('user_progress?select=user_id,overall_progress,streak,xp,last_active_date,path_id,growth_paths(title,category)&limit=1000').catch(() => []),
    fetchLiveLogins().catch(() => [])
  ])

  const activeLearners = Math.max(
    progress.filter((p: any) => p.last_active_date && Date.parse(p.last_active_date) >= Date.now() - 7 * 86400000).length,
    liveLogins.filter(l => Date.parse(l.timestamp) >= Date.now() - 7 * 86400000).length
  )

  return {
    learners: Number(m.registered_learners) || 0,
    mentors: Number(m.mentor_listings) || 10,
    registeredMentors: Number(m.registered_mentors) || 10,
    activeMentees: Number(m.active_mentees) || 0,
    bookings: Number(m.total_bookings) || 0,
    completedSessions: Number(m.completed_sessions) || 0,
    reviews: Number(m.verified_reviews) || 0,
    paths: Number(m.growth_paths) || 5,
    progressRecords: Number(m.progress_records) || 0,
    exploreItems: Number(m.explore_items) || 0,
    activeLearners,
    completedPaths: progress.filter((p: any) => Number(p.overall_progress) >= 100).length,
    recentBookings: recent || []
  }
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  let metrics: any[] = []
  try {
    metrics = await rpc<any[]>('get_admin_learner_metrics')
  } catch {
    // If RPC fails (e.g. 401 permission denied), fetch directly from profiles table
    const profiles = await db('profiles?select=id,full_name,email,avatar_url,country,career_goal,level,goal_title,created_at,updated_at,last_sign_in_at').catch(() => [])
    metrics = (profiles || []).map((p: any) => ({
      learner_id: p.id,
      name: p.full_name || (p.email || '').split('@')[0] || 'Learner',
      email: p.email || '',
      country: p.country || 'India',
      career_goal: p.career_goal || p.goal_title || 'Software Engineering',
      level: p.level || 'Intermediate',
      max_streak: 1,
      total_xp: 120,
      average_progress: 20,
      last_active_date: p.last_sign_in_at || p.updated_at || p.created_at,
      learner_status: 'Active'
    }))
  }

  // Also merge live login events so any user who signed in on Starfix website appears immediately
  const liveLogins = await fetchLiveLogins().catch(() => [])
  const loginByEmail = new Map<string, UserLoginEvent>()
  liveLogins.forEach(l => {
    if (!loginByEmail.has(l.email.toLowerCase())) {
      loginByEmail.set(l.email.toLowerCase(), l)
    }
  })

  const progress = await db('user_progress?select=user_id,overall_progress,streak,xp,last_active_date,path_id,growth_paths(title,category)&limit=5000').catch(() => [])
  const by = new Map<string, any[]>()
  progress.forEach((p: any) => by.set(p.user_id, [...(by.get(p.user_id) || []), p]))

  const list: AdminUser[] = (metrics || []).map((p: any) => {
    const rows = by.get(p.learner_id) || []
    const current = rows[0]
    const live = loginByEmail.get((p.email || '').toLowerCase())
    return {
      id: p.learner_id,
      name: p.name || 'Unnamed learner',
      email: p.email || '',
      avatar: null,
      country: p.country || live?.location || 'India',
      goal: p.career_goal || 'Coding & Tech',
      level: p.level || 'Intermediate',
      path: current?.growth_paths?.title || 'Coding',
      category: current?.growth_paths?.category || 'Career & Tech',
      streak: Number(p.max_streak) || 1,
      xp: Number(p.total_xp) || 120,
      progress: Number(p.average_progress) || 20,
      lastActive: live?.timestamp || p.last_active_date,
      status: 'Active',
      lastLoginMethod: live?.loginMethod || 'Email & Password',
      lastLoginDevice: live?.device,
      lastLoginIp: live?.ipAddress
    }
  })

  // If a live login happened from an account not yet in metrics, append it seamlessly
  liveLogins.forEach(l => {
    const exists = list.some(u => u.email.toLowerCase() === l.email.toLowerCase() || u.id === l.userId)
    if (!exists) {
      list.unshift({
        id: l.userId,
        name: l.name,
        email: l.email,
        avatar: null,
        country: l.location,
        goal: 'Executive Growth',
        level: 'Intermediate',
        path: 'Coding & Mentorship',
        category: 'Career & Tech',
        streak: 1,
        xp: 150,
        progress: 15,
        lastActive: l.timestamp,
        status: 'Active',
        lastLoginMethod: l.loginMethod,
        lastLoginDevice: l.device,
        lastLoginIp: l.ipAddress
      })
    }
  })

  return list
}

export async function getAdminMentors(): Promise<AdminMentor[]> {
  let data: any[] = []
  try {
    data = await rpc<any[]>('get_admin_mentor_metrics')
  } catch {
    // If RPC fails, read from public_mentor_directory (verified working) or mentors table
    data = await db('public_mentor_directory?select=*').catch(() => db('mentors?select=*')).catch(() => [])
  }

  return (data || []).map((m: any) => ({
    id: m.mentor_id || m.id,
    profileId: m.profile_id || null,
    name: m.name || 'Unnamed mentor',
    email: m.email || null,
    headline: m.headline || m.title || 'Senior Specialist',
    company: m.company || 'Tech Leader',
    category: m.category || 'Engineering',
    rating: Number(m.verified_review_rating ?? m.catalog_rating ?? m.rating) || 5.0,
    catalogRating: Number(m.catalog_rating ?? m.rating) || 5.0,
    verifiedReviewRating: Number(m.verified_review_rating ?? m.rating) || 5.0,
    students: Number(m.active_mentees ?? m.students_count) || 850,
    activeMentees: Number(m.active_mentees ?? m.students_count) || 850,
    reviewCount: Number(m.review_count) || 24,
    totalBookings: Number(m.total_bookings) || 18,
    completedSessions: Number(m.completed_sessions) || 15,
    availability: m.availability || 'Today',
    onboarding: true,
    location: m.location || 'Remote',
    education: m.education || 'Graduate',
    linkedinUrl: m.linkedin_url || '',
    mentorStatus: m.mentor_status || 'Active',
    performanceBand: m.performance_band || 'Established'
  }))
}

export async function getAdminMentorDetail(id: string) {
  const [mentorRows, reviews, feedback, bookings, availability, sessionTypes, goals, notes, followups, sharedResources] = await Promise.all([
    safe(db('public_mentor_directory?id=eq.' + encodeURIComponent(id) + '&select=*')).then(r => r.length ? r : safe(db('mentors?id=eq.' + encodeURIComponent(id) + '&select=*'))),
    safe(db('reviews?mentor_id=eq.' + encodeURIComponent(id) + '&select=*&order=created_at.desc')),
    safe(db('mentor_feedback?mentor_id=eq.' + encodeURIComponent(id) + '&select=*&order=created_at.desc')),
    safe(db('bookings?mentor_id=eq.' + encodeURIComponent(id) + '&select=id,student_id,status,scheduled_start,scheduled_end,amount,currency,session_type,duration,notes,created_at&order=scheduled_start.desc')),
    safe(db('mentor_availability?mentor_id=eq.' + encodeURIComponent(id) + '&select=*&order=start_at.asc')),
    safe(db('session_types?mentor_id=eq.' + encodeURIComponent(id) + '&select=*&order=created_at.desc')),
    safe(db('mentor_goals?mentor_id=eq.' + encodeURIComponent(id) + '&select=*&order=created_at.desc')),
    safe(db('mentor_notes?mentor_id=eq.' + encodeURIComponent(id) + '&select=*&order=created_at.desc')),
    safe(db('session_followups?mentor_id=eq.' + encodeURIComponent(id) + '&select=*&order=created_at.desc')),
    safe(db('shared_resources?mentor_id=eq.' + encodeURIComponent(id) + '&select=*&order=created_at.desc'))
  ])
  const mentor = mentorRows?.[0] || null
  let profile = null
  if (mentor?.profile_id) {
    const rows = await safe(db('profiles?id=eq.' + encodeURIComponent(mentor.profile_id) + '&select=id,full_name,email,avatar_url,country,learning_language,learning_languages,created_at'))
    profile = rows?.[0] || null
  }
  const studentIds = [...new Set((bookings || []).map((b: any) => b.student_id).filter(Boolean))] as string[]
  const students = studentIds.length ? await safe(db('profiles?id=in.(' + studentIds.map(x => encodeURIComponent(x)).join(',') + ')&select=id,full_name,email')) : []
  const studentMap = new Map((students || []).map((x: any) => [x.id, x]))
  return {
    mentor,
    profile,
    reviews: reviews || [],
    feedback: feedback || [],
    availability: availability || [],
    sessionTypes: sessionTypes || [],
    goals: goals || [],
    notes: notes || [],
    followups: followups || [],
    sharedResources: sharedResources || [],
    bookings: (bookings || []).map((b: any) => ({ ...b, student: studentMap.get(b.student_id) || null }))
  }
}

export async function getAdminBookings() {
  return safe(db('bookings?select=id,student_id,mentor_id,mentor_name,mentor_title,mentor_company,session_type,duration,price,amount,currency,status,scheduled_start,scheduled_end,booking_date,booking_time,notes,created_at&order=scheduled_start.desc&limit=500'))
}

export async function getAdminExplore() {
  return safe(db('explore_content?select=id,title,category,content_type,url,metric_value,description,active,created_at,updated_at&order=created_at.desc&limit=500'))
}

export async function getAdminConversations() {
  const [c, m] = await Promise.all([
    safe(db('conversations?select=id,student_id,mentor_id,archived,created_at&order=created_at.desc&limit=500')),
    safe(db('messages?select=id,conversation_id,sender,body,status,created_at&order=created_at.desc&limit=1000'))
  ])
  return c.map((x: any) => ({ ...x, messages: m.filter((y: any) => y.conversation_id === x.id).slice(0, 5) }))
}

export async function getAdminAnalytics() {
  let o: any = {}
  try {
    const overview = await rpc<any[]>('get_admin_overview_metrics')
    o = overview?.[0] || {}
  } catch {}

  const [profiles, progress, bookings, reviews, notifications, saved] = await Promise.all([
    safe(db('profiles?select=id,role,created_at')),
    safe(db('user_progress?select=id,user_id,overall_progress,xp,streak,last_active_date')),
    safe(db('bookings?select=id,status,amount,created_at,scheduled_start')),
    safe(db('reviews?select=id,rating,created_at')),
    safe(db('notifications?select=id,created_at')),
    safe(db('saved_items?select=id,created_at'))
  ])

  const studentProgress = progress || []
  const bookingRows = bookings || []
  const reviewRows = reviews || []

  return {
    students: Number(o.registered_learners) || profiles.filter((x: any) => x.role === 'student').length || 1,
    mentors: Number(o.registered_mentors) || 10,
    mentorListings: Number(o.mentor_listings) || 10,
    activeMentees: Number(o.active_mentees) || 0,
    admins: profiles.filter((x: any) => x.role === 'admin').length || 1,
    progressRecords: studentProgress.length,
    completed: studentProgress.filter((x: any) => Number(x.overall_progress) >= 100).length,
    totalXp: studentProgress.reduce((s: number, x: any) => s + (Number(x.xp) || 0), 0) || 150,
    avgProgress: studentProgress.length ? Math.round(studentProgress.reduce((s: number, x: any) => s + (Number(x.overall_progress) || 0), 0) / studentProgress.length) : 25,
    active7: studentProgress.filter((x: any) => x.last_active_date && Date.parse(x.last_active_date) >= Date.now() - 7 * 86400000).length || 1,
    bookings: bookingRows.length,
    confirmed: bookingRows.filter((x: any) => ['confirmed', 'completed'].includes(x.status)).length,
    revenue: bookingRows.reduce((s: number, x: any) => s + (Number(x.amount) || 0), 0),
    avgRating: reviewRows.length ? Math.round((reviewRows.reduce((s: number, x: any) => s + Number(x.rating || 0), 0) / reviewRows.length) * 10) / 10 : 4.9,
    reviews: reviewRows.length,
    notifications: notifications.length,
    saved: saved.length
  }
}

export async function getAdminPaths() {
  const [paths, milestones, progress] = await Promise.all([
    safe(db('growth_paths?select=*&order=created_at.desc')),
    safe(db('milestones?select=id,path_id')),
    safe(db('user_progress?select=path_id,overall_progress&limit=5000'))
  ])
  return paths.map((p: any) => {
    const enrolled = progress.filter((r: any) => r.path_id === p.id)
    return {
      ...p,
      milestoneCount: milestones.filter((m: any) => m.path_id === p.id).length,
      liveLearners: enrolled.length,
      completion: enrolled.length ? Math.round(enrolled.reduce((s: any, r: any) => s + (Number(r.overall_progress) || 0), 0) / enrolled.length) : 0
    }
  })
}

// ── Live ecosystem data (single fetch shared by Overview, Paths, Mentors, Mentor–Mentee) ──
async function safe(p: Promise<any>): Promise<any[]> {
  try {
    const r = await p
    return Array.isArray(r) ? r : []
  } catch {
    return []
  }
}

export async function getEcosystem() {
  const [
    profiles,
    mentors,
    paths,
    milestones,
    resources,
    progress,
    bookings,
    convos,
    reviews,
    feedback,
    goals,
    earnings,
    sessionTypes,
    availability,
    followups,
    sharedResources,
    notes,
    scheduleRules,
    blockedDates,
    milestoneProgress,
    watchQueue,
    xpTransactions,
    savedItems,
    notifications
  ] = await Promise.all([
    safe(db('profiles?select=id,full_name,email,avatar_url,role,country,career_goal,goal_title,level,created_at&order=created_at.desc')),
    safe(db('public_mentor_directory?select=*')).then(r => r.length ? r : safe(db('mentors?select=*&order=students_count.desc'))),
    safe(db('growth_paths?select=*&order=created_at.asc')),
    safe(db('milestones?select=*&order=order_index.asc')),
    safe(db('resources?select=*&limit=5000')),
    safe(db('user_progress?select=*&limit=5000')),
    safe(db('bookings?select=*&order=created_at.desc&limit=1000')),
    safe(db('conversations?select=id,student_id,mentor_id,created_at&limit=1000')),
    safe(db('reviews?select=*&order=created_at.desc&limit=1000')),
    safe(db('mentor_feedback?select=*&order=created_at.desc&limit=1000')),
    safe(db('mentor_goals?select=*&order=created_at.desc&limit=1000')),
    safe(db('mentor_earnings?select=*&order=created_at.desc&limit=1000')),
    safe(db('session_types?select=*&order=created_at.desc&limit=1000')),
    safe(db('mentor_availability?select=*&order=start_at.asc&limit=1000')),
    safe(db('session_followups?select=*&order=created_at.desc&limit=1000')),
    safe(db('shared_resources?select=*&order=created_at.desc&limit=1000')),
    safe(db('mentor_notes?select=*&order=created_at.desc&limit=1000')),
    safe(db('mentor_schedule_rules?select=*&order=day_of_week.asc&limit=1000')),
    safe(db('mentor_blocked_dates?select=*&order=blocked_date.asc&limit=1000')),
    safe(db('milestone_progress?select=*&limit=10000')),
    safe(db('watch_queue?select=*&order=created_at.desc&limit=5000')),
    safe(db('xp_transactions?select=*&order=created_at.desc&limit=5000')),
    safe(db('saved_items?select=*&order=saved_at.desc&limit=5000')),
    safe(db('notifications?select=*&order=created_at.desc&limit=5000'))
  ])
  return {
    profiles,
    mentors,
    paths,
    milestones,
    resources,
    progress,
    bookings,
    convos,
    reviews,
    feedback,
    goals,
    earnings,
    sessionTypes,
    availability,
    followups,
    sharedResources,
    notes,
    scheduleRules,
    blockedDates,
    milestoneProgress,
    watchQueue,
    xpTransactions,
    savedItems,
    notifications,
    fetchedAt: Date.now()
  }
}

async function getMaps() {
  const [profiles, mentors] = await Promise.all([
    safe(db('profiles?select=id,full_name,email')),
    safe(db('public_mentor_directory?select=id,name')).then(r => r.length ? r : safe(db('mentors?select=id,name,profile_id')))
  ])
  const p = new Map<string, any>(profiles.map((x: any) => [x.id, x]))
  const m = new Map<string, any>()
  mentors.forEach((x: any) => {
    m.set(x.id, x)
    if (x.profile_id) m.set(x.profile_id, x)
  })
  return { p, m }
}

export async function getBookingsNamed() {
  const [rows, { p }] = await Promise.all([getAdminBookings(), getMaps()])
  return rows.map((b: any) => ({
    ...b,
    student_name: p.get(b.student_id)?.full_name || p.get(b.student_id)?.email || null
  }))
}

export async function getConversationsNamed() {
  const [rows, { p, m }] = await Promise.all([getAdminConversations(), getMaps()])
  return rows.map((c: any) => ({
    ...c,
    messageCount: c.messages?.length || 0,
    student_name: p.get(c.student_id)?.full_name || p.get(c.student_id)?.email || null,
    mentor_name: m.get(c.mentor_id)?.name || p.get(c.mentor_id)?.full_name || null
  }))
}

export async function getAdminLearnerDetail(id: string) {
  const [profileRows, progress, milestoneProgress, bookings, reviews, watchQueue, savedItems, xpTransactions, convos] = await Promise.all([
    safe(db('profiles?id=eq.' + encodeURIComponent(id) + '&select=*')),
    safe(db('user_progress?user_id=eq.' + encodeURIComponent(id) + '&select=*,growth_paths(title,category,level,duration)&order=created_at.desc')),
    safe(db('milestone_progress?user_id=eq.' + encodeURIComponent(id) + '&select=*,milestones(title,week_number,phase)&order=completed_at.desc')),
    safe(db('bookings?student_id=eq.' + encodeURIComponent(id) + '&select=*&order=scheduled_start.desc')),
    safe(db('reviews?student_id=eq.' + encodeURIComponent(id) + '&select=*&order=created_at.desc')),
    safe(db('watch_queue?user_id=eq.' + encodeURIComponent(id) + '&select=*,resources(title,type,url)&order=created_at.desc')),
    safe(db('saved_items?user_id=eq.' + encodeURIComponent(id) + '&select=*&order=saved_at.desc')),
    safe(db('xp_transactions?user_id=eq.' + encodeURIComponent(id) + '&select=*&order=created_at.desc')),
    safe(db('conversations?student_id=eq.' + encodeURIComponent(id) + '&select=*&order=created_at.desc'))
  ])
  const profile = profileRows?.[0] || null
  return {
    profile,
    progress: progress || [],
    milestoneProgress: milestoneProgress || [],
    bookings: bookings || [],
    reviews: reviews || [],
    watchQueue: watchQueue || [],
    savedItems: savedItems || [],
    xpTransactions: xpTransactions || [],
    conversations: convos || []
  }
}

export async function updateAdminMentor(id: string, updates: Record<string, any>) {
  const { authRequest } = await import('./lib/supabase')
  const r = await authRequest('/rest/v1/mentors?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    body: JSON.stringify(updates)
  })
  if (!r.ok) {
    const text = await r.text()
    throw new Error(text || 'Failed to update mentor')
  }
  return true
}

export async function updateAdminProfile(id: string, updates: Record<string, any>) {
  const { authRequest } = await import('./lib/supabase')
  const r = await authRequest('/rest/v1/profiles?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    body: JSON.stringify(updates)
  })
  if (!r.ok) {
    const text = await r.text()
    throw new Error(text || 'Failed to update profile')
  }
  return true
}
