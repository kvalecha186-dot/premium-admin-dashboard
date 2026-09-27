import { supabase } from './lib/supabase'

export type AdminUser = {
  id: string; name: string; email: string; avatar: string | null
  country: string | null; goal: string | null; level: string | null
  path: string; category: string; streak: number; xp: number; progress: number
  lastActive: string | null; status: 'Active' | 'At risk' | 'Inactive'
}
export type AdminMentor = {
  id: string; profileId: string | null; name: string; email: string | null
  headline: string | null; company: string | null; category: string | null
  rating: number; students: number; availability: string | null
  onboarding: boolean; location: string | null
}

export async function getAdminOverview() {
  const [{ count: learners }, { count: mentors }, { count: bookings }, { count: paths }, { data: recentBookings }, { data: progress }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('mentors').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('growth_paths').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('id,status,scheduled_start,amount,mentor_name,student_id,session_type').order('created_at', { ascending: false }).limit(8),
    supabase.from('user_progress').select('user_id,overall_progress,streak,xp,last_active_date,path_id,growth_paths(title,category)').limit(1000),
  ])
  const active = (progress || []).filter((p: any) => p.last_active_date && Date.parse(p.last_active_date) >= Date.now() - 7 * 86400000).length
  const completed = (progress || []).filter((p: any) => Number(p.overall_progress) >= 100).length
  return { learners: learners || 0, mentors: mentors || 0, bookings: bookings || 0, paths: paths || 0, activeLearners: active, completedPaths: completed, recentBookings: recentBookings || [] }
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const [{ data: profiles, error }, { data: progress }] = await Promise.all([
    supabase.from('profiles').select('id,full_name,email,avatar_url,country,career_goal,goal_title,level,role,created_at').eq('role','student').order('created_at',{ascending:false}),
    supabase.from('user_progress').select('user_id,overall_progress,streak,xp,last_active_date,path_id,growth_paths(title,category)').limit(5000),
  ])
  if (error) throw error
  const byUser = new Map<string, any[]>()
  ;(progress || []).forEach((p: any) => byUser.set(p.user_id, [...(byUser.get(p.user_id) || []), p]))
  return (profiles || []).map((p: any) => {
    const rows = byUser.get(p.id) || []
    const current = rows[0]
    const last = rows.map(r => r.last_active_date).filter(Boolean).sort().at(-1) || null
    const days = last ? Math.floor((Date.now() - Date.parse(last)) / 86400000) : 999
    return {
      id:p.id, name:p.full_name || 'Unnamed learner', email:p.email || '', avatar:p.avatar_url,
      country:p.country, goal:p.goal_title || p.career_goal, level:p.level,
      path:current?.growth_paths?.title || 'Not enrolled', category:current?.growth_paths?.category || '—',
      streak:rows.reduce((m,r)=>Math.max(m,Number(r.streak)||0),0),
      xp:rows.reduce((s,r)=>s+(Number(r.xp)||0),0),
      progress: rows.length ? Math.round(rows.reduce((s,r)=>s+(Number(r.overall_progress)||0),0)/rows.length) : 0,
      lastActive:last, status: days <= 7 ? 'Active' : days <= 21 ? 'At risk' : 'Inactive'
    }
  })
}

export async function getAdminMentors(): Promise<AdminMentor[]> {
  const { data, error } = await supabase.from('mentors').select('id,profile_id,name,email,headline,company,category,rating,students_count,availability,onboarding_completed,location').order('created_at',{ascending:false})
  if (error) throw error
  return (data || []).map((m:any)=>({id:m.id,profileId:m.profile_id,name:m.name || 'Unnamed mentor',email:m.email,headline:m.headline,company:m.company,category:m.category,rating:Number(m.rating)||0,students:Number(m.students_count)||0,availability:m.availability,onboarding:!!m.onboarding_completed,location:m.location}))
}

export async function getAdminPaths() {
  const [{ data: paths, error }, { data: milestones }, { data: progress }] = await Promise.all([
    supabase.from('growth_paths').select('*').order('created_at',{ascending:false}),
    supabase.from('milestones').select('id,path_id'),
    supabase.from('user_progress').select('path_id,overall_progress').limit(5000),
  ])
  if (error) throw error
  return (paths||[]).map((p:any)=>{
    const enrolled=(progress||[]).filter((r:any)=>r.path_id===p.id)
    const ms=(milestones||[]).filter((m:any)=>m.path_id===p.id).length
    return {...p, milestoneCount:ms, liveLearners:enrolled.length, completion:enrolled.length ? Math.round(enrolled.reduce((s:any,r:any)=>s+(Number(r.overall_progress)||0),0)/enrolled.length):0}
  })
}

export async function signOutAdmin(){ await supabase.auth.signOut() }
