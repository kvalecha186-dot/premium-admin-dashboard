import {db,rpc} from './lib/supabase'
export type AdminUser={id:string;name:string;email:string;avatar:string|null;country:string|null;goal:string|null;level:string|null;path:string;category:string;streak:number;xp:number;progress:number;lastActive:string|null;status:'Active'|'At risk'|'Inactive'}
export type AdminMentor={id:string;profileId:string|null;name:string;email:string|null;headline:string|null;company:string|null;category:string|null;rating:number;catalogRating:number;verifiedReviewRating:number|null;students:number;activeMentees:number;reviewCount:number;totalBookings:number;completedSessions:number;availability:string|null;onboarding:boolean;location:string|null;education:string|null;linkedinUrl:string|null;mentorStatus:string;performanceBand:string}
export async function getAdminOverview(){
  const [metrics,recent,progress]=await Promise.all([
    rpc<any[]>('get_admin_overview_metrics'),
    db('bookings?select=id,status,scheduled_start,amount,mentor_name,session_type&order=created_at.desc&limit=8'),
    db('user_progress?select=user_id,overall_progress,streak,xp,last_active_date,path_id,growth_paths(title,category)&limit=1000')
  ]);
  const m=metrics?.[0]||{};
  return {
    learners:Number(m.registered_learners)||0,
    mentors:Number(m.mentor_listings)||0,
    registeredMentors:Number(m.registered_mentors)||0,
    activeMentees:Number(m.active_mentees)||0,
    bookings:Number(m.total_bookings)||0,
    completedSessions:Number(m.completed_sessions)||0,
    reviews:Number(m.verified_reviews)||0,
    paths:Number(m.growth_paths)||0,
    progressRecords:Number(m.progress_records)||0,
    exploreItems:Number(m.explore_items)||0,
    activeLearners:progress.filter((p:any)=>p.last_active_date&&Date.parse(p.last_active_date)>=Date.now()-7*86400000).length,
    completedPaths:progress.filter((p:any)=>Number(p.overall_progress)>=100).length,
    recentBookings:recent
  }
}
export async function getAdminUsers():Promise<AdminUser[]>{
  const [metrics,progress]=await Promise.all([
    rpc<any[]>('get_admin_learner_metrics'),
    db('user_progress?select=user_id,overall_progress,streak,xp,last_active_date,path_id,growth_paths(title,category)&limit=5000')
  ]);
  const by=new Map<string,any[]>();
  progress.forEach((p:any)=>by.set(p.user_id,[...(by.get(p.user_id)||[]),p]));
  return (metrics||[]).map((p:any)=>{
    const rows=by.get(p.learner_id)||[];
    const current=rows[0];
    return {
      id:p.learner_id,name:p.name||'Unnamed learner',email:p.email||'',avatar:null,country:p.country,goal:p.career_goal,
      level:p.level,path:current?.growth_paths?.title||'Not enrolled',category:current?.growth_paths?.category||'—',
      streak:Number(p.max_streak)||0,xp:Number(p.total_xp)||0,progress:Number(p.average_progress)||0,lastActive:p.last_active_date,
      status:p.learner_status==='Active'?'Active':p.learner_status==='At risk'?'At risk':'Inactive'
    };
  })
}
export async function getAdminMentorDetail(id:string){
  const [mentorRows,reviews,feedback,bookings,availability,sessionTypes,goals,notes,followups,sharedResources]=await Promise.all([
    db('mentors?id=eq.'+encodeURIComponent(id)+'&select=*'),
    db('reviews?mentor_id=eq.'+encodeURIComponent(id)+'&select=*&order=created_at.desc'),
    db('mentor_feedback?mentor_id=eq.'+encodeURIComponent(id)+'&select=*&order=created_at.desc'),
    db('bookings?mentor_id=eq.'+encodeURIComponent(id)+'&select=id,student_id,status,scheduled_start,scheduled_end,amount,currency,session_type,duration,notes,created_at&order=scheduled_start.desc'),
    db('mentor_availability?mentor_id=eq.'+encodeURIComponent(id)+'&select=*&order=start_at.asc'),
    db('session_types?mentor_id=eq.'+encodeURIComponent(id)+'&select=*&order=created_at.desc'),
    db('mentor_goals?mentor_id=eq.'+encodeURIComponent(id)+'&select=*&order=created_at.desc'),
    db('mentor_notes?mentor_id=eq.'+encodeURIComponent(id)+'&select=*&order=created_at.desc'),
    db('session_followups?mentor_id=eq.'+encodeURIComponent(id)+'&select=*&order=created_at.desc'),
    db('shared_resources?mentor_id=eq.'+encodeURIComponent(id)+'&select=*&order=created_at.desc')
  ]);
  const mentor=mentorRows?.[0]||null;
  let profile=null;
  if(mentor?.profile_id){const rows=await db('profiles?id=eq.'+encodeURIComponent(mentor.profile_id)+'&select=id,full_name,email,avatar_url,country,learning_language,learning_languages,created_at');profile=rows?.[0]||null;}
  const studentIds=[...new Set((bookings||[]).map((b:any)=>b.student_id).filter(Boolean))] as string[];
  const students=studentIds.length?await db('profiles?id=in.('+studentIds.map(x=>encodeURIComponent(x)).join(',')+')&select=id,full_name,email'):[];
  const studentMap=new Map((students||[]).map((x:any)=>[x.id,x]));
  return {mentor,profile,reviews:reviews||[],feedback:feedback||[],availability:availability||[],sessionTypes:sessionTypes||[],goals:goals||[],notes:notes||[],followups:followups||[],sharedResources:sharedResources||[],bookings:(bookings||[]).map((b:any)=>({...b,student:studentMap.get(b.student_id)||null}))};
}
export async function getAdminMentors():Promise<AdminMentor[]>{
  const data=await rpc<any[]>('get_admin_mentor_metrics');
  return (data||[]).map((m:any)=>({
    id:m.mentor_id,profileId:m.profile_id,name:m.name||'Unnamed mentor',email:m.email,headline:m.headline,company:m.company,category:m.category,
    rating:m.verified_review_rating!==null?Number(m.verified_review_rating):Number(m.catalog_rating)||0,
    catalogRating:Number(m.catalog_rating)||0,verifiedReviewRating:m.verified_review_rating===null?null:Number(m.verified_review_rating),
    students:Number(m.active_mentees)||0,activeMentees:Number(m.active_mentees)||0,reviewCount:Number(m.review_count)||0,
    totalBookings:Number(m.total_bookings)||0,completedSessions:Number(m.completed_sessions)||0,
    availability:Number(m.future_available_slots)>0?`${Number(m.future_available_slots)} live slots`:null,
    onboarding:!!m.onboarding_completed,location:m.location,education:m.education,linkedinUrl:m.linkedin_url,
    mentorStatus:m.mentor_status,performanceBand:m.performance_band
  }));
}
export async function getAdminBookings(){const data=await db('bookings?select=id,student_id,mentor_id,mentor_name,mentor_title,mentor_company,session_type,duration,price,amount,currency,status,scheduled_start,scheduled_end,booking_date,booking_time,notes,created_at&order=scheduled_start.desc&limit=500');return data}
export async function getAdminExplore(){return db('explore_content?select=id,title,category,content_type,url,metric_value,description,active,created_at,updated_at&order=created_at.desc&limit=500')}
export async function getAdminConversations(){const [c,m]=await Promise.all([db('conversations?select=id,student_id,mentor_id,archived,created_at&order=created_at.desc&limit=500'),db('messages?select=id,conversation_id,sender,body,status,created_at&order=created_at.desc&limit=1000')]);return c.map((x:any)=>({...x,messages:m.filter((y:any)=>y.conversation_id===x.id).slice(0,5)}))}
export async function getAdminAnalytics(){
  const [overview,profiles,progress,bookings,reviews,notifications,saved]=await Promise.all([
    rpc<any[]>('get_admin_overview_metrics'),
    db('profiles?select=id,role,created_at'),
    db('user_progress?select=id,user_id,overall_progress,xp,streak,last_active_date'),
    db('bookings?select=id,status,amount,created_at,scheduled_start'),
    db('reviews?select=id,rating,created_at'),
    db('notifications?select=id,created_at'),
    db('saved_items?select=id,created_at')
  ]);
  const o=overview?.[0]||{};
  const studentProgress=progress||[];
  const bookingRows=bookings||[];
  const reviewRows=reviews||[];
  return {
    students:Number(o.registered_learners)||profiles.filter((x:any)=>x.role==='student').length,
    mentors:Number(o.registered_mentors)||0,
    mentorListings:Number(o.mentor_listings)||0,
    activeMentees:Number(o.active_mentees)||0,
    admins:profiles.filter((x:any)=>x.role==='admin').length,
    progressRecords:studentProgress.length,
    completed:studentProgress.filter((x:any)=>Number(x.overall_progress)>=100).length,
    totalXp:studentProgress.reduce((s:number,x:any)=>s+(Number(x.xp)||0),0),
    avgProgress:studentProgress.length?Math.round(studentProgress.reduce((s:number,x:any)=>s+(Number(x.overall_progress)||0),0)/studentProgress.length):0,
    active7:studentProgress.filter((x:any)=>x.last_active_date&&Date.parse(x.last_active_date)>=Date.now()-7*86400000).length,
    bookings:bookingRows.length,
    confirmed:bookingRows.filter((x:any)=>['confirmed','completed'].includes(x.status)).length,
    revenue:bookingRows.reduce((s:number,x:any)=>s+(Number(x.amount)||0),0),
    avgRating:reviewRows.length?Math.round(reviewRows.reduce((s:number,x:any)=>s+Number(x.rating||0),0)/reviewRows.length*10)/10:0,
    reviews:reviewRows.length,
    notifications:notifications.length,
    saved:saved.length
  }
}
export async function getAdminPaths(){const[paths,milestones,progress]=await Promise.all([db('growth_paths?select=*&order=created_at.desc'),db('milestones?select=id,path_id'),db('user_progress?select=path_id,overall_progress&limit=5000')]);return paths.map((p:any)=>{const enrolled=progress.filter((r:any)=>r.path_id===p.id);return{...p,milestoneCount:milestones.filter((m:any)=>m.path_id===p.id).length,liveLearners:enrolled.length,completion:enrolled.length?Math.round(enrolled.reduce((s:any,r:any)=>s+(Number(r.overall_progress)||0),0)/enrolled.length):0}})}


// ── Live ecosystem data (single fetch shared by Overview, Paths, Mentors, Mentor–Mentee) ──
async function safe(p:Promise<any>):Promise<any[]>{try{const r=await p;return Array.isArray(r)?r:[]}catch{return []}}
export async function getEcosystem(){
  const[profiles,mentors,paths,milestones,resources,progress,bookings,convos,reviews,feedback,goals,earnings,sessionTypes,availability,followups,sharedResources,notes,scheduleRules,blockedDates,milestoneProgress,watchQueue,xpTransactions,savedItems,notifications]=await Promise.all([
    safe(db('profiles?select=id,full_name,email,avatar_url,role,country,career_goal,goal_title,level,created_at&order=created_at.desc')),
    safe(db('mentors?select=*&order=students_count.desc')),
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
    safe(db('notifications?select=*&order=created_at.desc&limit=5000')),
  ])
  return{profiles,mentors,paths,milestones,resources,progress,bookings,convos,reviews,feedback,goals,earnings,sessionTypes,availability,followups,sharedResources,notes,scheduleRules,blockedDates,milestoneProgress,watchQueue,xpTransactions,savedItems,notifications,fetchedAt:Date.now()}
}

// ── Name lookups so tables show people, not UUIDs ──
async function getMaps(){
  const[profiles,mentors]=await Promise.all([safe(db('profiles?select=id,full_name,email')),safe(db('mentors?select=id,name,profile_id'))])
  const p=new Map<string,any>(profiles.map((x:any)=>[x.id,x]))
  const m=new Map<string,any>()
  mentors.forEach((x:any)=>{m.set(x.id,x);if(x.profile_id)m.set(x.profile_id,x)})
  return{p,m}
}
export async function getBookingsNamed(){
  const[rows,{p}]=await Promise.all([getAdminBookings(),getMaps()])
  return rows.map((b:any)=>({...b,student_name:p.get(b.student_id)?.full_name||p.get(b.student_id)?.email||null}))
}
export async function getConversationsNamed(){
  const[rows,{p,m}]=await Promise.all([getAdminConversations(),getMaps()])
  return rows.map((c:any)=>({...c,messageCount:c.messages?.length||0,student_name:p.get(c.student_id)?.full_name||p.get(c.student_id)?.email||null,mentor_name:m.get(c.mentor_id)?.name||p.get(c.mentor_id)?.full_name||null}))
}

export async function getAdminLearnerDetail(id: string) {
  const [profileRows, progress, milestoneProgress, bookings, reviews, watchQueue, savedItems, xpTransactions, convos] = await Promise.all([
    safe(db('profiles?id=eq.'+encodeURIComponent(id)+'&select=*')),
    safe(db('user_progress?user_id=eq.'+encodeURIComponent(id)+'&select=*,growth_paths(title,category,level,duration)&order=created_at.desc')),
    safe(db('milestone_progress?user_id=eq.'+encodeURIComponent(id)+'&select=*,milestones(title,week_number,phase)&order=completed_at.desc')),
    safe(db('bookings?student_id=eq.'+encodeURIComponent(id)+'&select=*&order=scheduled_start.desc')),
    safe(db('reviews?student_id=eq.'+encodeURIComponent(id)+'&select=*&order=created_at.desc')),
    safe(db('watch_queue?user_id=eq.'+encodeURIComponent(id)+'&select=*,resources(title,type,url)&order=created_at.desc')),
    safe(db('saved_items?user_id=eq.'+encodeURIComponent(id)+'&select=*&order=saved_at.desc')),
    safe(db('xp_transactions?user_id=eq.'+encodeURIComponent(id)+'&select=*&order=created_at.desc')),
    safe(db('conversations?student_id=eq.'+encodeURIComponent(id)+'&select=*&order=created_at.desc'))
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

