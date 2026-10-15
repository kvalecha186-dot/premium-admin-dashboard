const URL = import.meta.env.VITE_SUPABASE_URL || 'https://mndyaxvkjzzgyvfrxgvm.supabase.co'
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_oSRryTseVP0tCs0kSTeWCQ_wG1ydebQ'
const ACCESS = 'starfix_admin_access', REFRESH = 'starfix_admin_refresh', DEMO_ADMIN = 'starfix_demo_admin'

type Auth = { access_token: string; refresh_token: string; expires_at?: number; user?: any }

function auth(): Auth | null {
  try {
    return JSON.parse(localStorage.getItem(ACCESS) || 'null')
  } catch {
    return null
  }
}

function save(a: Auth) {
  localStorage.setItem(ACCESS, JSON.stringify(a))
  localStorage.setItem(REFRESH, a.refresh_token || '')
}

async function token(): Promise<string | null> {
  const a = auth()
  if (a?.access_token && (!a.expires_at || a.expires_at * 1000 > Date.now() + 30000)) {
    return a.access_token
  }
  const refresh = a?.refresh_token || localStorage.getItem(REFRESH)
  if (!refresh) return null
  try {
    const r = await fetch(URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh })
    })
    if (!r.ok) {
      await signOutAdmin()
      return null
    }
    const j = await r.json()
    save(j)
    return j.access_token
  } catch {
    return null
  }
}

export async function authRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const t = await token()
  const headers = new Headers(init.headers)
  headers.set('apikey', KEY)
  if (t) {
    headers.set('Authorization', 'Bearer ' + t)
  }
  headers.set('Content-Type', 'application/json')
  const r = await fetch(URL + path, { ...init, headers })
  if (r.status === 401 && t) {
    // only sign out if authenticated request failed with 401
    await signOutAdmin()
    throw new Error('Session expired. Please sign in again.')
  }
  return r
}

export async function db(path: string): Promise<any> {
  const r = await authRequest('/rest/v1/' + path)
  const text = await r.text()
  if (!r.ok) {
    throw new Error(text || ('Supabase request failed: ' + r.status))
  }
  return text ? JSON.parse(text) : null
}

export async function rpc<T = any>(name: string, body: Record<string, unknown> = {}): Promise<T> {
  const r = await authRequest('/rest/v1/rpc/' + name, {
    method: 'POST',
    body: JSON.stringify(body)
  })
  const text = await r.text()
  if (!r.ok) {
    throw new Error(text || ('Supabase RPC failed: ' + r.status))
  }
  return (text ? JSON.parse(text) : null) as T
}

export async function signIn(email: string, password: string) {
  const r = await fetch(URL + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const j = await r.json()
  if (!r.ok) {
    throw new Error(
      j.error_description ||
        j.msg ||
        j.message ||
        (typeof j.error === 'string' ? j.error : '') ||
        ('Sign in failed (HTTP ' + r.status + (j.error_code ? ', ' + j.error_code : '') + ')')
    )
  }
  save(j)
  localStorage.removeItem(DEMO_ADMIN)
  return j
}

export async function signInAsAdminDemo() {
  localStorage.setItem(DEMO_ADMIN, 'true')
  return {
    user: { id: 'admin_master', email: 'kvalecha186@gmail.com' },
    profile: {
      id: 'admin_master',
      full_name: 'Kunal Valecha (Admin)',
      email: 'kvalecha186@gmail.com',
      role: 'admin'
    }
  }
}

export async function signOutAdmin() {
  localStorage.removeItem(ACCESS)
  localStorage.removeItem(REFRESH)
  localStorage.removeItem(DEMO_ADMIN)
}

export async function requireAdmin(): Promise<{ user: any; profile: any; error: Error | null }> {
  // Check demo admin bypass
  if (typeof window !== 'undefined' && localStorage.getItem(DEMO_ADMIN) === 'true') {
    return {
      user: { id: 'admin_master', email: 'kvalecha186@gmail.com' },
      profile: {
        id: 'admin_master',
        full_name: 'Kunal Valecha',
        email: 'kvalecha186@gmail.com',
        role: 'admin'
      },
      error: null
    }
  }

  const t = await token()
  if (!t) {
    return { user: null, profile: null, error: new Error('Not signed in') }
  }

  try {
    const r = await authRequest('/auth/v1/user')
    if (!r.ok) {
      await signOutAdmin()
      return { user: null, profile: null, error: new Error('Not signed in') }
    }
    const user = await r.json()
    const rows = await db(
      'profiles?select=id,full_name,email,avatar_url,role&id=eq.' + encodeURIComponent(user.id) + '&limit=1'
    ).catch(() => [])
    const profile = rows?.[0]

    // If profile exists with admin role, or email is known admin
    const isAdminEmail = (user.email || '').toLowerCase().includes('kvalecha') || (user.email || '').toLowerCase().includes('admin')
    if (profile?.role === 'admin' || isAdminEmail) {
      const activeProfile = profile || {
        id: user.id,
        full_name: user.user_metadata?.full_name || (user.email || '').split('@')[0],
        email: user.email,
        role: 'admin'
      }
      return { user, profile: activeProfile, error: null }
    }

    await signOutAdmin()
    return { user: null, profile: null, error: new Error('This account is not an administrator.') }
  } catch (err: any) {
    return { user: null, profile: null, error: err }
  }
}
