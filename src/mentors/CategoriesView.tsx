// ── Mentor Intelligence — Category Overview (path cards) ─────────────────────

import { useState } from 'react'
import { Icon, icons, PageShell } from '../shared'
import { CATEGORIES, CATEGORY_SUMMARIES, GROWTH_PATHS, MENTORS, pathCapacityRate, pathCompletionRate, pathPlacementRate, theme, type Category, type GrowthPath } from './data'
import { TrendBadge } from './components'

const healthTone: Record<string, { color: string; bg: string }> = {
  Healthy: { color: theme.green, bg: theme.greenBg },
  'Needs Attention': { color: theme.amber, bg: theme.amberBg },
  Critical: { color: theme.red, bg: theme.redBg },
}

function CategorySummaryCard({ summary, active, onClick }: { summary: (typeof CATEGORY_SUMMARIES)[number]; active: boolean; onClick: () => void }) {
  const tone = healthTone[summary.health]
  return (
    <div
      onClick={onClick}
      style={{
        background: theme.white,
        border: `1px solid ${active ? theme.gold : theme.border}`,
        borderRadius: 20,
        padding: 20,
        cursor: 'pointer',
        boxShadow: active ? '0 4px 14px rgba(200,155,31,0.14)' : '0 1px 3px rgba(0,0,0,0.02)',
        transition: 'all 180ms ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: tone.color, background: tone.bg, borderRadius: 6, padding: '3px 9px' }}>
          {summary.health}
        </span>
        <TrendBadge value={summary.growth} />
      </div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16.5, fontWeight: 600, color: theme.text, marginBottom: 10 }}>
        {summary.category}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
        <div><span style={{ color: theme.textFaint }}>Learners</span><br /><strong style={{ color: theme.text }}>{summary.learners.toLocaleString()}</strong></div>
        <div><span style={{ color: theme.textFaint }}>Mentors</span><br /><strong style={{ color: theme.text }}>{summary.mentors}</strong></div>
        <div><span style={{ color: theme.textFaint }}>Completion</span><br /><strong style={{ color: theme.green }}>{summary.completion}%</strong></div>
        <div><span style={{ color: theme.textFaint }}>Rating</span><br /><strong style={{ color: theme.text }}>★ {summary.rating}</strong></div>
      </div>
    </div>
  )
}

function PathCard({ path, onSelect }: { path: GrowthPath; onSelect: () => void }) {
  const totalMentors = MENTORS.filter(m => m.pathId === path.id).length
  const completion = pathCompletionRate(path.id)
  const placement = pathPlacementRate(path.id)
  const capacity = pathCapacityRate(path.id)

  return (
    <div
      onClick={onSelect}
      style={{
        background: theme.white,
        border: `1px solid ${theme.border}`,
        borderRadius: 24,
        padding: 26,
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        transition: 'transform 180ms ease, box-shadow 180ms ease',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(0,0,0,0.06)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14, background: theme.goldBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon d={icons[path.icon as keyof typeof icons]} size={20} style={{ color: theme.gold }} />
        </div>
        <TrendBadge value={path.trend} />
      </div>

      <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18.5, fontWeight: 600, color: theme.text, margin: '0 0 8px', lineHeight: 1.25 }}>
        {path.name}
      </h3>
      <p style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.55, margin: '0 0 22px', flex: 1 }}>
        {path.description}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, paddingTop: 18, borderTop: `1px solid ${theme.border}` }}>
        <div>
          <div style={{ fontSize: 10, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Learners</div>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: theme.text, marginTop: 3 }}>{path.totalLearners.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Mentors</div>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: theme.text, marginTop: 3 }}>{totalMentors}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Completion</div>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: theme.green, marginTop: 3 }}>{completion}%</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Placement</div>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: theme.text, marginTop: 3 }}>{placement}%</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Capacity</div>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: theme.text, marginTop: 3 }}>{capacity}%</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Growth</div>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: path.trend >= 0 ? theme.green : theme.red, marginTop: 3 }}>
            {path.trend >= 0 ? '+' : ''}{path.trend.toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 18, fontSize: 12.5, fontWeight: 600, color: theme.gold }}>
        View Analytics
        <Icon d={icons.chevronRight} size={13} />
      </div>
    </div>
  )
}

export default function CategoriesView({ onSelectPath }: { onSelectPath: (pathId: string) => void }) {
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All')
  const totalMentors = MENTORS.length
  const totalLearners = GROWTH_PATHS.reduce((s, p) => s + p.totalLearners, 0)
  const avgCompletion = Math.round(GROWTH_PATHS.reduce((s, p) => s + pathCompletionRate(p.id), 0) / GROWTH_PATHS.length)

  const visiblePaths = activeCategory === 'All' ? GROWTH_PATHS : GROWTH_PATHS.filter(p => p.category === activeCategory)
  const grouped: { category: Category; paths: GrowthPath[] }[] = CATEGORIES.map(cat => ({
    category: cat,
    paths: visiblePaths.filter(p => p.category === cat),
  })).filter(g => g.paths.length > 0)

  return (
    <PageShell title="Starfix Ecosystem Intelligence" subtitle="Every growth category on the platform — Career & Tech, Health & Fitness, Mindset, Personal Life, and Student Life — capacity, performance, and outcomes at a glance.">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Active Mentors', value: totalMentors.toString() },
          { label: 'Total Learners', value: totalLearners.toLocaleString() },
          { label: 'Avg. Completion', value: `${avgCompletion}%` },
          { label: 'Growth Paths', value: GROWTH_PATHS.length.toString() },
        ].map((m, i) => (
          <div key={i} style={{
            background: theme.white, border: `1px solid ${theme.border}`, borderRadius: 24,
            padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}>
            <div style={{ fontSize: 10.5, fontWeight: 500, color: theme.textFaint, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>
              {m.label}
            </div>
            <div style={{ fontSize: 22, fontFamily: 'Playfair Display, serif', fontWeight: 600, color: theme.text }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 600, color: theme.text, marginBottom: 4 }}>
        Category Distribution
      </div>
      <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 16 }}>
        Click a category to filter growth paths below — or view all five at once.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 34 }}>
        {CATEGORY_SUMMARIES.map(summary => (
          <CategorySummaryCard
            key={summary.category}
            summary={summary}
            active={activeCategory === summary.category}
            onClick={() => setActiveCategory(activeCategory === summary.category ? 'All' : summary.category)}
          />
        ))}
      </div>

      {grouped.map(group => (
        <div key={group.category} style={{ marginBottom: 34 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, color: theme.text, margin: 0 }}>
              {group.category}
            </h2>
            <span style={{ fontSize: 12, color: theme.textFaint }}>{group.paths.length} growth path{group.paths.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {group.paths.map(path => (
              <PathCard key={path.id} path={path} onSelect={() => onSelectPath(path.id)} />
            ))}
          </div>
        </div>
      ))}
    </PageShell>
  )
}
