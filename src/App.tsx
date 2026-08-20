import { useState, useMemo } from 'react'
import { Icon, icons, Card, PageShell } from './shared'
import MentorsSection from './mentors/MentorsSection'
import GrowthIntelligenceView from './analytics/GrowthIntelligenceView'
import OverviewPage from './overview/OverviewPage'
import GrowthPathsPage from './growthpaths/GrowthPathsPage'
import SettingsPage from './settings/SettingsPage'
import { CATEGORIES, pathsByCategory, type Category } from './mentors/data'

// ── Types ────────────────────────────────────────────────────────────────────

type Page = 'overview' | 'users' | 'paths' | 'mentors' | 'analytics' | 'settings'

// ── Sidebar Component ─────────────────────────────────────────────────────────

interface RippleEffect {
  id: number
  x: number
  y: number
  key: string
}

function Sidebar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const [ripples, setRipples] = useState<RippleEffect[]>([])

  const handleNavClick = (e: React.MouseEvent<HTMLButtonElement>, itemPage: Page) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const rippleId = Date.now()

    setRipples(prev => [...prev, { id: rippleId, x, y, key: itemPage }])
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId))
    }, 320)

    setPage(itemPage)
  }

  const sections: {
    title: string
    items: { id: Page; label: string; icon: keyof typeof icons }[]
  }[] = [
    {
      title: 'MAIN',
      items: [
        { id: 'overview', label: 'Overview', icon: 'overview' },
        { id: 'users', label: 'Users', icon: 'users' },
        { id: 'paths', label: 'Growth Paths', icon: 'paths' },
        { id: 'mentors', label: 'Mentors', icon: 'mentors' },
      ]
    },
    {
      title: 'INSIGHTS',
      items: [
        { id: 'analytics', label: 'Analytics', icon: 'analytics' },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', icon: 'settings' },
      ]
    }
  ]

  return (
    <aside style={{
      width: 272,
      minWidth: 272,
      background: 'linear-gradient(180deg, #FFFDF8 0%, #FAF5EC 100%)',
      borderRight: '1px solid #E8D9B5',
      boxShadow: 'inset -2px 0 12px rgba(200, 155, 30, 0.03)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 20
    }}>
      {/* Brand Header */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #E8D9B5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            background: '#111111',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(17, 17, 17, 0.15)'
          }}>
            <Icon d={icons.star} size={18} style={{ color: '#C89B1E' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, fontSize: 20, color: '#111111', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              Starfix
            </div>
            <div style={{ fontSize: 11, color: '#6F6F6F', letterSpacing: '0.04em', marginTop: 2, fontWeight: 500 }}>
              Growth Operations
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '20px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {sections.map(section => (
          <div key={section.title}>
            <div style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: '#A09886',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '0 12px 6px'
            }}>
              {section.title}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {section.items.map(item => {
                const active = page === item.id
                const itemRipples = ripples.filter(r => r.key === item.id)

                return (
                  <button
                    key={item.id}
                    onClick={e => handleNavClick(e, item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      width: '100%',
                      height: 48,
                      padding: '0 14px',
                      borderRadius: 14,
                      border: 'none',
                      cursor: 'pointer',
                      background: active ? '#F7EFD8' : 'transparent',
                      color: active ? '#111111' : '#6F6F6F',
                      fontSize: 14,
                      fontWeight: active ? 600 : 500,
                      fontFamily: 'Inter, sans-serif',
                      letterSpacing: '0.01em',
                      transition: 'all 180ms ease',
                      textAlign: 'left',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: active ? '0 2px 10px rgba(200, 155, 30, 0.12)' : 'none'
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(200, 155, 30, 0.06)'
                        e.currentTarget.style.color = '#111111'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        const iconSvg = e.currentTarget.querySelector('svg')
                        if (iconSvg) iconSvg.style.transform = 'scale(1.06)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = '#6F6F6F'
                        e.currentTarget.style.transform = 'none'
                        const iconSvg = e.currentTarget.querySelector('svg')
                        if (iconSvg) iconSvg.style.transform = 'none'
                      }
                    }}
                  >
                    {/* Active left gold indicator bar */}
                    {active && (
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: '20%',
                        height: '60%',
                        width: 3.5,
                        background: '#C89B1E',
                        borderRadius: '0 4px 4px 0'
                      }} />
                    )}

                    {/* Ripple splash overlays */}
                    {itemRipples.map(r => (
                      <span
                        key={r.id}
                        style={{
                          position: 'absolute',
                          left: r.x,
                          top: r.y,
                          width: 160,
                          height: 160,
                          borderRadius: '50%',
                          background: 'radial-gradient(circle, rgba(200, 155, 30, 0.35) 0%, rgba(200, 155, 30, 0) 70%)',
                          transform: 'translate(-50%, -50%) scale(1.2)',
                          animation: 'goldRipple 300ms ease-out forwards',
                          pointerEvents: 'none'
                        }}
                      />
                    ))}

                    <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon
                        d={icons[item.icon]}
                        size={17}
                        style={{
                          color: active ? '#C89B1E' : '#8E8E93',
                          transition: 'color 180ms ease, transform 180ms ease'
                        }}
                      />
                    </span>
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Profile Card */}
      <div style={{ padding: '16px 14px', borderTop: '1px solid #E8D9B5' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            borderRadius: 16,
            background: '#FFFDF8',
            border: '1px solid #E8D9B5',
            boxShadow: '0 4px 16px rgba(200, 155, 30, 0.05)',
            cursor: 'pointer',
            transition: 'all 180ms ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(200, 155, 30, 0.12)'
            e.currentTarget.style.borderColor = '#C89B1E'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(200, 155, 30, 0.05)'
            e.currentTarget.style.borderColor = '#E8D9B5'
          }}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces"
              alt="Marcus Webb"
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #E8D9B5' }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 8,
                height: 8,
                background: '#166534',
                borderRadius: '50%',
                border: '1.5px solid #FFFDF8'
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Marcus Webb
            </div>
            <div style={{ fontSize: 11, color: '#6F6F6F', marginTop: 1 }}>Head of Platform</div>
          </div>
        </div>
      </div>
    </aside>
  )
}



// ── USERS PAGE ────────────────────────────────────────────────────────────────
// Learner roster sampled across all five Starfix ecosystem categories — Career
// & Tech, Health & Fitness, Mindset, Personal Life, Student Life — instead of
// a tech-only slice. Names/paths are generated deterministically from the
// real GROWTH_PATHS catalogue so this list never drifts out of sync with the
// rest of the dashboard.

const USER_SEED_NAMES = [
  ['Priya Sharma', 'priya@example.com', 'photo-1494790108377-be9c29b29330'],
  ['James Okonkwo', 'james@example.com', 'photo-1507003211169-0a1dd7228f2d'],
  ['Mei-Lin Chen', 'meilin@example.com', 'photo-1438761681033-6461ffad8d80'],
  ['Rafael Torres', 'rafael@example.com', 'photo-1472099645785-5658abf4ff4e'],
  ['Aisha Bello', 'aisha@example.com', 'photo-1534528741775-53994a69daeb'],
  ['Tomás Reyes', 'tomas@example.com', 'photo-1500648767791-00dcc994a43e'],
  ['Kavya Nair', 'kavya@example.com', 'photo-1524504388940-b1c1722653e1'],
  ['Daniel Whitfield', 'daniel@example.com', 'photo-1560250097-0b93528c311a'],
  ['Isha Kapoor', 'isha@example.com', 'photo-1573496359142-b8d87734a5a2'],
  ['Marcus Thorne', 'marcus@example.com', 'photo-1544005313-94ddf0286df2'],
  ['Ananya Reddy', 'ananya@example.com', 'photo-1531123897727-8f129e1688ce'],
  ['Julian Brandt', 'julian@example.com', 'photo-1580489944761-15a19d654956'],
  ['Neha Verma', 'neha@example.com', 'photo-1519345182560-3f2917c472ef'],
  ['Ryan Foster', 'ryan@example.com', 'photo-1506794778202-cad84cf45f1d'],
  ['Sofia Delgado', 'sofia@example.com', 'photo-1487412720507-e7ab37603c6f'],
  ['Vikram Joshi', 'vikram@example.com', 'photo-1517841905240-472988babdf9'],
  ['Grace Lambert', 'grace@example.com', 'photo-1500917293891-ef795e70e1f6'],
  ['Rohan Desai', 'rohan@example.com', 'photo-1552058544-f2b08422138a'],
  ['Elena Rostova', 'elena@example.com', 'photo-1544723795-3fb6469f5b39'],
  ['Kabir Malhotra', 'kabir@example.com', 'photo-1552374196-c4e7ffc6e126'],
]

function UsersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState<'All' | Category>('All')

  const users = useMemo(() => {
    const statuses: Array<'Active' | 'At risk' | 'Inactive'> = ['Active', 'Active', 'Active', 'At risk', 'Inactive']
    // Sample ~4 paths per category so every category is represented.
    const sampledPaths = CATEGORIES.flatMap(cat => pathsByCategory(cat).slice(0, 4))
    return USER_SEED_NAMES.map(([name, email, avatarId], i) => {
      const path = sampledPaths[i % sampledPaths.length]
      const status = statuses[i % statuses.length]
      const streak = status === 'Inactive' ? 0 : 3 + ((i * 17) % 90)
      const xp = status === 'Inactive' ? 200 + (i * 37) % 400 : 900 + (i * 653) % 14000
      return {
        name, email,
        path: path.name,
        category: path.category,
        streak, xp, status,
        avatar: `https://images.unsplash.com/${avatarId}?w=80&h=80&fit=crop&crop=faces`,
      }
    })
  }, [])

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || u.status === statusFilter
    const matchCategory = categoryFilter === 'All' || u.category === categoryFilter
    return matchSearch && matchStatus && matchCategory
  })

  return (
    <PageShell title="Learners Directory" subtitle="Monitor active learners across every Starfix ecosystem category — daily streaks and path enrollment.">
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFFFF', border: '1px solid #ECE7DF', borderRadius: 8, padding: '8px 14px', flex: 1, maxWidth: 320 }}>
          <Icon d={icons.search} size={15} style={{ color: '#8E8E93' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search learners by name or email…"
            style={{ border: 'none', outline: 'none', fontSize: 13, color: '#171717', background: 'transparent', width: '100%', fontFamily: 'Inter, sans-serif' }}
          />
        </div>

        {['All', 'Active', 'At risk', 'Inactive'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            style={{
              padding: '8px 14px',
              border: '1px solid #ECE7DF',
              borderRadius: 8,
              background: statusFilter === st ? '#171717' : '#FFFFFF',
              color: statusFilter === st ? '#FFFFFF' : '#525252',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            {st}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['All', ...CATEGORIES] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            style={{
              padding: '6px 12px',
              border: '1px solid #ECE7DF',
              borderRadius: 20,
              background: categoryFilter === cat ? '#F7F2E7' : '#FFFFFF',
              color: categoryFilter === cat ? '#C89B1F' : '#737373',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ECE7DF', background: '#FAF8F4' }}>
              {['Learner', 'Category', 'Active Path', 'Streak', 'XP Points', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 20px', fontSize: 11, fontWeight: 600, color: '#8E8E93', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={i} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #ECE7DF' : 'none', transition: 'background 150ms ease' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAF8F4'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#FFFFFF'}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={u.avatar} alt={u.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#171717' }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: '#8E8E93' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#C89B1F', background: '#F7F2E7', padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                    {u.category}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', fontSize: 13, color: '#525252' }}>{u.path}</td>
                <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: '#171717' }}>
                  {u.streak} 🔥
                </td>
                <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 500, color: '#171717' }}>
                  {u.xp.toLocaleString()} XP
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: u.status === 'Active' ? '#166534' : u.status === 'At risk' ? '#92400E' : '#737373',
                    background: u.status === 'Active' ? '#F0FDF4' : u.status === 'At risk' ? '#FFFBEB' : '#FAF8F4',
                    padding: '3px 8px',
                    borderRadius: 6
                  }}>
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PageShell>
  )
}



// ── MAIN APP COMPONENT ────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>('overview')

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#FAF8F4',
      color: '#171717',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Sidebar */}
      <Sidebar page={page} setPage={setPage} />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <main style={{ flex: 1 }}>
          {page === 'overview' && <OverviewPage />}
          {page === 'users' && <UsersPage />}
          {page === 'paths' && <GrowthPathsPage />}
          {page === 'mentors' && <MentorsSection />}
          {page === 'analytics' && <GrowthIntelligenceView />}
          {page === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  )
}
