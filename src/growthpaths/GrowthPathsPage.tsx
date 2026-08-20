// ── Growth Paths Page ──────────────────────────────────────────────────────────
// Catalog of all 58 Starfix growth paths with search, category tabs, sort,
// premium cards, and a right-side detail drawer.

import { useState } from 'react'
import { Icon, icons, Card, PageShell } from '../shared'
import { CATEGORIES, GROWTH_PATHS, SUMMARY, getPath } from './data'
import type { GrowthPath, CategoryId, Difficulty } from './data'

const DIFFICULTY_TONE: Record<Difficulty, { color: string; bg: string }> = {
  Beginner: { color: '#166534', bg: '#F0FDF4' },
  Intermediate: { color: '#92400E', bg: '#FFFBEB' },
  Advanced: { color: '#991B1B', bg: '#FEF2F2' },
}

const RECENCY_ORDER: Record<string, number> = {
  'Updated today': 0, 'Updated 2 days ago': 1, 'Updated 5 days ago': 2, 'Updated 1 week ago': 3,
  'Updated 3 weeks ago': 4, 'Updated 1 month ago': 5, 'Updated 2 months ago': 6, 'Updated 3 months ago': 7,
}

type SortBy = 'popularity' | 'completion' | 'newest'

// ── Summary Strip ──────────────────────────────────────────────────────────────

function SummaryStrip({ totalPaths, archivedCount }: { totalPaths: number; archivedCount: number }) {
  const stats = [
    { label: 'Total Paths', value: String(totalPaths), icon: 'paths' as const },
    { label: 'Flagship Paths', value: String(SUMMARY.flagshipPaths), icon: 'star' as const },
    { label: 'Active Mentors', value: String(SUMMARY.activeMentors), icon: 'mentors' as const },
    { label: 'Avg. Completion', value: `${SUMMARY.avgCompletion}%`, icon: 'trendUp' as const },
    { label: 'Updated This Month', value: String(SUMMARY.updatedThisMonth), icon: 'clock' as const },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
      {stats.map((s, i) => (
        <Card key={i} style={{ padding: '18px 20px', borderRadius: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: '#F7F2E7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon d={icons[s.icon]} size={17} style={{ color: '#C89B1F' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 19, fontFamily: 'Playfair Display, serif', fontWeight: 600, color: '#171717', lineHeight: 1.1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#8E8E93', marginTop: 3, whiteSpace: 'nowrap' }}>{s.label}</div>
          </div>
        </Card>
      ))}
      {archivedCount > 0 && (
        <div style={{ gridColumn: '1 / -1', fontSize: 11.5, color: '#A1A1AA' }}>
          {archivedCount} path{archivedCount === 1 ? '' : 's'} archived this session
        </div>
      )}
    </div>
  )
}

// ── Path Card ──────────────────────────────────────────────────────────────────

function PathCard({ path, onOpen, onEdit, onDuplicate, onArchive }: {
  path: GrowthPath
  onOpen: () => void
  onEdit: () => void
  onDuplicate: () => void
  onArchive: () => void
}) {
  const [glow, setGlow] = useState({ x: 50, y: 0, active: false })
  const tone = DIFFICULTY_TONE[path.difficulty]

  const actionBtn = (icon: keyof typeof icons, label: string, onClick: () => void) => (
    <button
      title={label}
      onClick={e => { e.stopPropagation(); onClick() }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, borderRadius: 8, border: '1px solid #ECE7DF',
        background: '#FFFFFF', color: '#737373', cursor: 'pointer', transition: 'all 150ms ease',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F7F2E7'; (e.currentTarget as HTMLElement).style.color = '#C89B1F' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FFFFFF'; (e.currentTarget as HTMLElement).style.color = '#737373' }}
    >
      <Icon d={icons[icon]} size={13} />
    </button>
  )

  return (
    <div
      onClick={onOpen}
      onMouseMove={e => {
        const rect = e.currentTarget.getBoundingClientRect()
        setGlow({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100, active: true })
      }}
      onMouseLeave={() => setGlow(g => ({ ...g, active: false }))}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 24,
        border: '1px solid #ECE7DF',
        background: '#FFFFFF',
        padding: 22,
        cursor: 'pointer',
        opacity: path.published ? 1 : 0.62,
        boxShadow: glow.active ? '0 14px 30px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
        transform: glow.active ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
      }}
    >
      {/* cursor glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        opacity: glow.active ? 1 : 0, transition: 'opacity 200ms ease',
        background: `radial-gradient(220px circle at ${glow.x}% ${glow.y}%, rgba(200,155,31,0.08), transparent 65%)`,
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 13, background: '#F7F2E7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d={icons[path.icon as keyof typeof icons] ?? icons.paths} size={19} style={{ color: '#C89B1F' }} />
        </div>
        {path.flagship && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, color: '#8A6A0E', background: '#F7F2E7', border: '1px solid #EAD9A8', padding: '3px 9px', borderRadius: 99, letterSpacing: '0.02em' }}>
            <Icon d={icons.star} size={10} style={{ color: '#C89B1F' }} /> Flagship
          </span>
        )}
      </div>

      <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 600, color: '#171717', margin: '0 0 5px' }}>
        {path.name}
      </h3>
      <p style={{ fontSize: 12.5, color: '#8E8E93', margin: '0 0 14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {path.description}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: tone.color, background: tone.bg, padding: '3px 9px', borderRadius: 6 }}>{path.difficulty}</span>
        <span style={{ fontSize: 10.5, fontWeight: 500, color: '#525252', background: '#FAF8F4', border: '1px solid #ECE7DF', padding: '3px 9px', borderRadius: 6 }}>{path.duration}</span>
        {!path.published && (
          <span style={{ fontSize: 10.5, fontWeight: 600, color: '#737373', background: '#F4F4F5', padding: '3px 9px', borderRadius: 6 }}>Unpublished</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, paddingTop: 14, borderTop: '1px solid #ECE7DF', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 9.5, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Learners</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#171717', marginTop: 2 }}>{path.learners.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: 9.5, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Completion</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#166534', marginTop: 2 }}>{path.completionRate}%</div>
        </div>
        <div>
          <div style={{ fontSize: 9.5, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Mentors</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#171717', marginTop: 2 }}>{path.mentorsCount}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: '#A1A1AA' }}>{path.updatedLabel}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {actionBtn('eye', 'View', onOpen)}
          {actionBtn('edit', 'Edit', onEdit)}
          {actionBtn('copy', 'Duplicate', onDuplicate)}
          {actionBtn('archive', 'Archive', onArchive)}
        </div>
      </div>
    </div>
  )
}

// ── Detail Drawer ──────────────────────────────────────────────────────────────

function PathDrawer({ path, onClose, onTogglePublish }: { path: GrowthPath; onClose: () => void; onTogglePublish: () => void }) {
  const maxTrend = Math.max(...path.completionTrend, 1)
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(23,23,23,0.32)', backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 500, maxWidth: '92vw',
        background: '#FFFFFF', borderLeft: '1px solid #ECE7DF', boxShadow: '-16px 0 40px rgba(0,0,0,0.10)',
        display: 'flex', flexDirection: 'column', animation: 'sfxDrawerIn 260ms cubic-bezier(0.22,1,0.36,1)',
      }}>
        <style>{`@keyframes sfxDrawerIn { from { transform: translateX(24px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>

        {/* Header */}
        <div style={{ padding: '22px 26px', borderBottom: '1px solid #ECE7DF', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: '#F7F2E7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon d={icons[path.icon as keyof typeof icons] ?? icons.paths} size={20} style={{ color: '#C89B1F' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 19, fontWeight: 600, color: '#171717', margin: 0 }}>{path.name}</h2>
                {path.flagship && <Icon d={icons.star} size={13} style={{ color: '#C89B1F' }} />}
              </div>
              <div style={{ fontSize: 12, color: '#8E8E93' }}>{path.category} · {path.difficulty} · {path.duration}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#8E8E93', padding: 4 }}>
            <Icon d={icons.x} size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Publish toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAF8F4', border: '1px solid #ECE7DF', borderRadius: 12, padding: '12px 16px' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#171717' }}>{path.published ? 'Published' : 'Unpublished'}</div>
              <div style={{ fontSize: 11.5, color: '#8E8E93' }}>{path.published ? 'Visible to learners on the platform' : 'Hidden from learners'}</div>
            </div>
            <button
              onClick={onTogglePublish}
              style={{
                width: 44, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer', position: 'relative',
                background: path.published ? '#C89B1F' : '#D4D4D8', transition: 'background 150ms ease', flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute', top: 3, left: path.published ? 21 : 3, width: 20, height: 20, borderRadius: '50%',
                background: '#FFFFFF', transition: 'left 150ms ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          {/* Description */}
          <div>
            <SectionLabel>Full Description</SectionLabel>
            <p style={{ fontSize: 13.5, color: '#404040', lineHeight: 1.65, margin: 0 }}>{path.fullDescription}</p>
          </div>

          {/* Roadmap */}
          <div>
            <SectionLabel>Weekly Roadmap</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {path.roadmap.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#F7F2E7', color: '#C89B1F', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.week}</div>
                    {i < path.roadmap.length - 1 && <div style={{ width: 1.5, flex: 1, background: '#ECE7DF', minHeight: 18 }} />}
                  </div>
                  <div style={{ paddingBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#171717' }}>{r.title}</div>
                    <div style={{ fontSize: 12.5, color: '#737373', marginTop: 2, lineHeight: 1.5 }}>{r.focus}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills gained */}
          <div>
            <SectionLabel>Skills Gained</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {path.skills.map((s, i) => (
                <span key={i} style={{ fontSize: 11.5, fontWeight: 500, color: '#171717', background: '#F3F1EB', borderRadius: 7, padding: '5px 10px' }}>{s}</span>
              ))}
            </div>
          </div>

          {/* Linked mentors */}
          <div>
            <SectionLabel>Linked Mentors ({path.linkedMentors.length})</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {path.linkedMentors.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={m.avatar} alt={m.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#171717' }}>{m.name}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#171717' }}>★ {m.rating}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <SectionLabel>Curated Resources</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {path.resources.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#FAF8F4', border: '1px solid #ECE7DF', borderRadius: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: '#FFFFFF', border: '1px solid #ECE7DF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon d={icons.play} size={11} style={{ color: '#C89B1F' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: '#171717', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: '#8E8E93' }}>{r.channel} · {r.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Challenges */}
          <div>
            <SectionLabel>Challenges</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {path.challenges.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span style={{ color: '#404040' }}>{c.title}</span>
                  <span style={{ color: '#8E8E93', fontSize: 11.5 }}>{c.participants} joined</span>
                </div>
              ))}
            </div>
          </div>

          {/* Completion analytics */}
          <div>
            <SectionLabel>Completion Analytics</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
              {path.completionTrend.map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', height: `${(v / maxTrend) * 44}px`, background: i === path.completionTrend.length - 1 ? '#C89B1F' : '#EAD9A8', borderRadius: 4 }} />
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#8E8E93', marginTop: 6 }}>6-month completion trend · currently {path.completionRate}%</div>
          </div>

          {/* Tags */}
          <div>
            <SectionLabel>Explore Tags</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {path.tags.map((t, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#525252', border: '1px solid #ECE7DF', padding: '4px 10px', borderRadius: 99 }}>
                  <Icon d={icons.tag} size={10} /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>{children}</div>
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function GrowthPathsPage() {
  const [paths, setPaths] = useState<GrowthPath[]>(GROWTH_PATHS)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortBy>('popularity')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [archivedCount, setArchivedCount] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const selectedPath = selectedId ? paths.find(p => p.id === selectedId) ?? null : null

  const filtered = paths
    .filter(p => category === 'all' || p.categoryId === category)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'popularity') return b.learners - a.learners
      if (sortBy === 'completion') return b.completionRate - a.completionRate
      return (RECENCY_ORDER[a.updatedLabel] ?? 99) - (RECENCY_ORDER[b.updatedLabel] ?? 99)
    })

  const handleDuplicate = (p: GrowthPath) => {
    const copy: GrowthPath = { ...p, id: `${p.id}-copy-${Date.now()}`, name: `${p.name} (Copy)`, flagship: false, updatedLabel: 'Updated today', updatedThisMonth: true }
    setPaths(prev => [copy, ...prev])
    showToast(`Duplicated "${p.name}"`)
  }
  const handleArchive = (p: GrowthPath) => {
    setPaths(prev => prev.filter(x => x.id !== p.id))
    setArchivedCount(c => c + 1)
    if (selectedId === p.id) setSelectedId(null)
    showToast(`Archived "${p.name}"`)
  }
  const handleTogglePublish = (p: GrowthPath) => {
    setPaths(prev => prev.map(x => x.id === p.id ? { ...x, published: !x.published } : x))
  }

  return (
    <PageShell
      title="Growth Paths"
      subtitle="Manage all transformation paths, mentors, resources, and progress."
      action={
        <button
          onClick={() => showToast('Opening new path builder…')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, background: '#C89B1F', color: '#FFFFFF',
            border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(200,155,31,0.28)', transition: 'transform 150ms ease',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
        >
          <Icon d={icons.plus} size={14} /> Add New Path
        </button>
      }
    >
      <SummaryStrip totalPaths={paths.length} archivedCount={archivedCount} />

      {/* Toolbar: search + sort */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFFFF', border: '1px solid #ECE7DF', borderRadius: 10, padding: '9px 14px', flex: 1, maxWidth: 360 }}>
          <Icon d={icons.search} size={15} style={{ color: '#8E8E93' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search growth paths…"
            style={{ border: 'none', outline: 'none', fontSize: 13, color: '#171717', background: 'transparent', width: '100%', fontFamily: 'Inter, sans-serif' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFFFF', border: '1px solid #ECE7DF', borderRadius: 10, padding: '0 6px 0 14px' }}>
          <span style={{ fontSize: 12, color: '#8E8E93' }}>Sort by</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortBy)}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontWeight: 500, color: '#171717', padding: '9px 8px', cursor: 'pointer' }}
          >
            <option value="popularity">Popularity</option>
            <option value="completion">Completion</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12.5, color: '#8E8E93', display: 'flex', alignItems: 'center' }}>
          {filtered.length} path{filtered.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {(['all', ...CATEGORIES.map(c => c.id)] as (CategoryId | 'all')[]).map(catId => {
          const active = category === catId
          const label = catId === 'all' ? 'All Paths' : CATEGORIES.find(c => c.id === catId)!.name
          const count = catId === 'all' ? paths.length : paths.filter(p => p.categoryId === catId).length
          return (
            <button
              key={catId}
              onClick={() => setCategory(catId)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10,
                border: active ? '1px solid #C89B1F' : '1px solid #ECE7DF',
                background: active ? '#F7F2E7' : '#FFFFFF',
                color: active ? '#8A6A0E' : '#525252',
                fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer', transition: 'all 150ms ease',
              }}
            >
              {label}
              <span style={{ fontSize: 11, fontWeight: 600, color: active ? '#C89B1F' : '#A1A1AA', background: active ? '#FFFFFF' : '#FAF8F4', borderRadius: 99, padding: '1px 7px' }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8E8E93', fontSize: 13.5 }}>
          No growth paths match your filters.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
          {filtered.map(p => (
            <PathCard
              key={p.id}
              path={p}
              onOpen={() => setSelectedId(p.id)}
              onEdit={() => { setSelectedId(p.id); showToast(`Editing "${p.name}"`) }}
              onDuplicate={() => handleDuplicate(p)}
              onArchive={() => handleArchive(p)}
            />
          ))}
        </div>
      )}

      {selectedPath && (
        <PathDrawer
          path={selectedPath}
          onClose={() => setSelectedId(null)}
          onTogglePublish={() => handleTogglePublish(selectedPath)}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: '#171717', color: '#FFFFFF', padding: '11px 20px', borderRadius: 10,
          fontSize: 13, fontWeight: 500, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', zIndex: 400,
        }}>
          {toast}
        </div>
      )}
    </PageShell>
  )
}
