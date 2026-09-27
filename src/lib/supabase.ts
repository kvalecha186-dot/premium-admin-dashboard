import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mndyaxvkjzzgyvfrxgvm.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_oSRryTseVP0tCs0kSTeWCQ_wG1ydeb'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export async function requireAdmin() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { user: null, profile: null, error: error || new Error('Not signed in') }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,full_name,email,avatar_url,role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    await supabase.auth.signOut()
    return { user: null, profile: null, error: new Error('This account is not an administrator.') }
  }
  return { user, profile, error: null }
}
