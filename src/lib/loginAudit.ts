const URL = import.meta.env.VITE_SUPABASE_URL || 'https://mndyaxvkjzzgyvfrxgvm.supabase.co'
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_oSRryTseVP0tCs0kSTeWCQ_wG1ydebQ'

export interface UserLoginEvent {
  id: string
  userId: string
  email: string
  name: string
  role: 'student' | 'mentor' | 'admin'
  loginMethod: string
  device: string
  browser: string
  os: string
  ipAddress: string
  location: string
  timestamp: string
  status: 'Active' | 'Signed Out'
}

const STORAGE_KEY = 'starfix:live_logins'
const BROADCAST_CHANNEL = 'starfix_audit_channel'

export async function fetchLiveLogins(): Promise<UserLoginEvent[]> {
  const localList: UserLoginEvent[] = []
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) localList.push(...JSON.parse(raw))
    } catch {}
  }

  try {
    const res = await fetch(`${URL}/rest/v1/user_logins?select=*&order=created_at.desc&limit=50`, {
      headers: { apikey: KEY }
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const dbList: UserLoginEvent[] = data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          email: d.email,
          name: d.name || (d.email || '').split('@')[0],
          role: d.role || 'student',
          loginMethod: d.login_method || 'Email & Password',
          device: d.device || 'Desktop',
          browser: d.browser || 'Chrome',
          os: d.os || 'Windows',
          ipAddress: d.ip_address || '127.0.0.1',
          location: d.location || 'India',
          timestamp: d.created_at,
          status: d.status || 'Active'
        }))

        const combined = [...dbList]
        for (const loc of localList) {
          if (!combined.some(c => c.id === loc.id || (c.email === loc.email && Math.abs(Date.parse(c.timestamp) - Date.parse(loc.timestamp)) < 2000))) {
            combined.push(loc)
          }
        }
        return combined.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      }
    }
  } catch {}

  return localList.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
}

export function subscribeToLiveLogins(onNewLogin: (event: UserLoginEvent) => void) {
  if (typeof window === 'undefined') return () => {}

  // 1. Listen via BroadcastChannel across browser tabs
  let bc: BroadcastChannel | null = null
  if ('BroadcastChannel' in window) {
    bc = new BroadcastChannel(BROADCAST_CHANNEL)
    bc.onmessage = (msg) => {
      if (msg.data?.type === 'STARFIX_USER_LOGIN' && msg.data?.payload) {
        onNewLogin(msg.data.payload)
      }
    }
  }

  // 2. Listen via storage event (when other windows write to localStorage)
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const list: UserLoginEvent[] = JSON.parse(e.newValue)
        if (list.length > 0) onNewLogin(list[0])
      } catch {}
    }
  }
  window.addEventListener('storage', storageHandler)

  // 3. Periodic polling every 5 seconds for fresh logins from DB
  const interval = setInterval(async () => {
    try {
      const logins = await fetchLiveLogins()
      if (logins.length > 0) {
        // notify top login
        onNewLogin(logins[0])
      }
    } catch {}
  }, 5000)

  return () => {
    if (bc) bc.close()
    window.removeEventListener('storage', storageHandler)
    clearInterval(interval)
  }
}
