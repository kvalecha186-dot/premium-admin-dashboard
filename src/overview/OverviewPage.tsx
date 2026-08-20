import { useMemo, useState } from 'react'
import { Icon, icons, Card, PageShell } from '../shared'
import {
  kpis, growthPaths, totalLearners, mentorGroups, totalMentors, topMentors, platformGrowth,
  learnerFunnel, placementHighlights, needsAttention,
  mentorCapacityAlert, bestPerformingPath, riskAlerts,
  cohorts, regions, placementStatuses, CATEGORY_SUMMARIES, categoryAwards,
} from './data'
import {
  Sparkline, ProgressRing, MultiLineChart, DonutChart, UtilizationBar, FunnelChart,
  GOLD, GOLD_LIGHT, INK, BORDER, MUTED, SUBTLE, GREEN, GREEN_BG, AMBER, AMBER_BG,
  RED, RED_BG, ORANGE, ORANGE_BG, donutPalette, categoryColors,
} from './charts'

type Range = '7 Days' | '30 Days' | 'Quarter' | 'Year'

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  background: '#FFFFFF',
  color: INK,
  fontSize: 12.5,
  fontFamily: 'Inter, sans-serif',
  cursor: 'pointer',
  outline: 'none',
}

function pill(text: string, color: string, bg: string) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, background: bg, borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap' }}>
      {text}
    </span>
  )
}

// ── Global Filters bar ────────────────────────────────────────────────────────
function GlobalFilters({
  growthPath, setGrowthPath, mentor, setMentor, cohort, setCohort,
  region, setRegion, placementStatus, setPlacementStatus, dateRange, setDateRange,
}: any) {
  return (
    <Card style={{ padding: '14px 18px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 6 }}>
        <Icon d={icons.filter} size={14} style={{ color: GOLD }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: INK }}>Global Filters</span>
      </div>
      <select style={selectStyle} value={dateRange} onChange={e => setDateRange(e.target.value)}>
        {['Today', 'This Week', 'This Month', 'This Quarter'].map(o => <option key={o}>{o}</option>)}
      </select>
      <select style={selectStyle} value={growthPath} onChange={e => setGrowthPath(e.target.value)}>
        <option>All Growth Paths</option>
        {growthPaths.map(p => <option key={p.name}>{p.name}</option>)}
      </select>
      <select style={selectStyle} value={mentor} onChange={e => setMentor(e.target.value)}>
        <option>All Mentors</option>
        {topMentors.map(m => <option key={m.name}>{m.name}</option>)}
      </select>
      <select style={selectStyle} value={cohort} onChange={e => setCohort(e.target.value)}>
        <option>All Cohorts</option>
        {cohorts.map(c => <option key={c}>{c}</option>)}
      </select>
      <select style={selectStyle} value={region} onChange={e => setRegion(e.target.value)}>
        {regions.map(r => <option key={r}>{r}</option>)}
      </select>
      <select style={selectStyle} value={placementStatus} onChange={e => setPlacementStatus(e.target.value)}>
        {placementStatuses.map(s => <option key={s}>{s}</option>)}
      </select>
    </Card>
  )
}

// ── Executive KPI Cards ───────────────────────────────────────────────────────
function KpiCards() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 32 }}>
      {kpis.map((k, i) => (
        <Card key={i} style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: MUTED, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>
              {k.label}
            </div>
            <ProgressRing percent={k.target} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontSize: 26, fontFamily: 'Playfair Display, serif', fontWeight: 600, color: INK, lineHeight: 1, marginBottom: 8 }}>
                {k.value}
              </div>
              <div style={{ fontSize: 12, color: GREEN, fontWeight: 500 }}>
                +{k.growth}% <span style={{ color: MUTED, fontWeight: 400 }}>vs {k.prev} last month</span>
              </div>
            </div>
            <Sparkline data={k.spark} />
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: SUBTLE }}>{k.targetLabel} · {k.target}% there</div>
        </Card>
      ))}
    </div>
  )
}

// ── Operations Intelligence Center ────────────────────────────────────────────
function OperationsIntelligence() {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, color: INK, margin: 0 }}>
          Operations Intelligence Center
        </h2>
        <span style={{ fontSize: 12, color: SUBTLE }}>4 areas requiring administrator decisions</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        <Card style={{ padding: 20 }}>
          {pill('Needs Attention', RED, RED_BG)}
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 600, color: INK, margin: '12px 0 4px' }}>
            {needsAttention.path}
          </div>
          <div style={{ fontSize: 13, color: SUBTLE, marginBottom: 8 }}>{needsAttention.issue}. {needsAttention.impact}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: INK }}>Recommended Action</div>
          <div style={{ fontSize: 12.5, color: GOLD, fontWeight: 500 }}>{needsAttention.action}</div>
        </Card>

        <Card style={{ padding: 20 }}>
          {pill('Mentor Capacity', ORANGE, ORANGE_BG)}
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 600, color: INK, margin: '12px 0 4px' }}>
            {mentorCapacityAlert.path}
          </div>
          <div style={{ fontSize: 13, color: SUBTLE, marginBottom: 8 }}>{mentorCapacityAlert.detail}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: INK }}>Recommendation</div>
          <div style={{ fontSize: 12.5, color: GOLD, fontWeight: 500 }}>{mentorCapacityAlert.recommendation}</div>
        </Card>

        <Card style={{ padding: 20 }}>
          {pill('Best Performing Path', GREEN, GREEN_BG)}
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 600, color: INK, margin: '12px 0 10px' }}>
            {bestPerformingPath.name}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12.5 }}>
            <div><span style={{ color: MUTED }}>Completion</span><br /><strong style={{ color: INK }}>{bestPerformingPath.completion}%</strong></div>
            <div><span style={{ color: MUTED }}>Placement</span><br /><strong style={{ color: INK }}>{bestPerformingPath.placement}%</strong></div>
            <div><span style={{ color: MUTED }}>Rating</span><br /><strong style={{ color: INK }}>{bestPerformingPath.rating}</strong></div>
            <div><span style={{ color: MUTED }}>Growth</span><br /><strong style={{ color: GREEN }}>+{bestPerformingPath.growth}%</strong></div>
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          {pill('Placement Highlights', GOLD, GOLD_LIGHT)}
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 600, color: INK, margin: '12px 0 2px' }}>
            {placementHighlights.placedThisMonth}
          </div>
          <div style={{ fontSize: 11.5, color: MUTED, marginBottom: 8 }}>Placed this month · Avg salary {placementHighlights.avgSalary}</div>
          <div style={{ fontSize: 11.5, color: SUBTLE, lineHeight: 1.6 }}>
            Top recruiters: <strong style={{ color: INK }}>{placementHighlights.topRecruiters.join(', ')}</strong>
          </div>
          <div style={{ fontSize: 12, color: GREEN, fontWeight: 600, marginTop: 6 }}>+{placementHighlights.growth}% MoM</div>
        </Card>
      </div>
    </div>
  )
}

// ── Platform Growth (interactive multi-metric trend chart) ───────────────────
function PlatformGrowthChart({ range, setRange }: { range: Range; setRange: (r: Range) => void }) {
  const data = platformGrowth[range]
  const metrics: { key: keyof (typeof data)[0]; label: string; color: string }[] = [
    { key: 'newLearners', label: 'New Learners', color: GOLD },
    { key: 'activeLearners', label: 'Active Learners', color: INK },
    { key: 'liveSessions', label: 'Live Sessions', color: GREEN },
    { key: 'placements', label: 'Placements', color: ORANGE },
    { key: 'revenue', label: 'Revenue', color: '#5B21B6' },
  ]
  const indexed = useMemo(() => {
    return metrics.map(m => {
      const base = data[0][m.key] as number
      const values = data.map(d => ((d[m.key] as number) / (base || 1)) * 100)
      return { label: m.label, values }
    })
  }, [range])
  const labels = data.map(d => d.label)
  const colors = metrics.map(m => m.color)

  return (
    <Card style={{ padding: 24, marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 600, color: INK }}>Platform Growth</div>
          <div style={{ fontSize: 12, color: SUBTLE, marginTop: 2 }}>
            Indexed trend across new learners, active learners, sessions, placements &amp; revenue (start of period = 100)
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['7 Days', '30 Days', 'Quarter', 'Year'] as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: '6px 12px', borderRadius: 7, border: `1px solid ${BORDER}`,
                background: range === r ? INK : '#FFFFFF', color: range === r ? '#FFFFFF' : SUBTLE,
                fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 150ms ease',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, margin: '14px 0 4px', flexWrap: 'wrap' }}>
        {metrics.map(m => {
          const last = data[data.length - 1][m.key] as number
          const display = m.key === 'revenue' ? `₹${last.toFixed(2)} Cr` : last.toLocaleString()
          return (
            <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, display: 'inline-block' }} />
              <span style={{ color: SUBTLE }}>{m.label}</span>
              <strong style={{ color: INK }}>{display}</strong>
            </div>
          )
        })}
      </div>

      <MultiLineChart labels={labels} series={indexed} colors={colors} height={220} />
    </Card>
  )
}

// ── Category Distribution + Top Performing Categories — the whole ecosystem ──
function CategoryDistribution() {
  const segments = CATEGORY_SUMMARIES.map(c => ({
    label: c.category, value: c.learners, color: categoryColors[c.category] ?? GOLD, growth: c.growth,
  }))
  const total = segments.reduce((s, seg) => s + seg.value, 0)

  return (
    <Card style={{ padding: 24 }}>
      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 600, color: INK, marginBottom: 4 }}>Category Distribution</div>
      <div style={{ fontSize: 12, color: SUBTLE, marginBottom: 18 }}>Learners across all five Starfix ecosystem categories — {totalLearners.toLocaleString()} total</div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
        <DonutChart segments={segments} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1, minWidth: 0 }}>
          {segments.map((seg, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
              <span style={{ color: INK, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{seg.label}</span>
              <span style={{ color: MUTED }}>{seg.value.toLocaleString()}</span>
              <span style={{ color: SUBTLE, width: 40, textAlign: 'right' }}>{Math.round((seg.value / total) * 1000) / 10}%</span>
              <span style={{ color: seg.growth >= 0 ? GREEN : RED, fontWeight: 600, width: 44, textAlign: 'right' }}>
                {seg.growth >= 0 ? '+' : ''}{seg.growth}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
        Top Performing Categories
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {categoryAwards.slice(0, 4).map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: SUBTLE }}>{a.title}</span>
            <span style={{ color: INK, fontWeight: 600 }}>{a.winner.category} <span style={{ color: GOLD }}>· {a.metric}</span></span>
          </div>
        ))}
      </div>
    </Card>
  )
}

const healthDot: Record<string, string> = { Healthy: '🟢', 'Needs Attention': '🟡', Critical: '🔴' }
const healthColor: Record<string, string> = { Healthy: GREEN, 'Needs Attention': AMBER, Critical: RED }

function CategoryHealth() {
  return (
    <Card style={{ padding: 24 }}>
      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 600, color: INK, marginBottom: 4 }}>Category Health</div>
      <div style={{ fontSize: 12, color: SUBTLE, marginBottom: 18 }}>Completion, retention &amp; mentor capacity across every category</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {CATEGORY_SUMMARIES.map(c => (
          <div key={c.category}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5, flexWrap: 'wrap', gap: 4 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: INK }}>{healthDot[c.health]} {c.category}</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: healthColor[c.health] }}>{c.health}</span>
            </div>
            <div style={{ fontSize: 11.5, color: SUBTLE }}>
              {c.completion}% completion · {c.retention}% retention · {c.mentors} mentors · ★ {c.rating}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Mentor Utilization by category ────────────────────────────────────────────
function MentorUtilization() {
  return (
    <Card style={{ padding: 24 }}>
      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 600, color: INK, marginBottom: 4 }}>Mentor Utilization</div>
      <div style={{ fontSize: 12, color: SUBTLE, marginBottom: 18 }}>Capacity by ecosystem category · {totalMentors} mentors total</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {mentorGroups.map(g => {
          const available = Math.max(0, g.capacity - Math.round((g.capacity * g.utilization) / 100))
          const overloaded = g.utilization >= 90
          return (
            <div key={g.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5, flexWrap: 'wrap', gap: 4 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: INK }}>{g.name}</span>
                <span style={{ fontSize: 11.5, color: SUBTLE }}>
                  {g.capacity} capacity · {available} slots open
                  {overloaded && <span style={{ color: RED, fontWeight: 600, marginLeft: 8 }}>● Overloaded</span>}
                </span>
              </div>
              <UtilizationBar percent={g.utilization} />
              <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{g.utilization}% utilized</div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function DistributionAndUtilization() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
      <CategoryDistribution />
      <CategoryHealth />
    </div>
  )
}

// ── Learner Funnel ─────────────────────────────────────────────────────────────
function FunnelsSection() {
  return (
    <div style={{ marginBottom: 32 }}>
      <Card style={{ padding: 24 }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 600, color: INK, marginBottom: 4 }}>Learner Funnel</div>
        <div style={{ fontSize: 12, color: SUBTLE, marginBottom: 18 }}>Visitor-to-placement conversion across the full learner journey</div>
        <FunnelChart stages={learnerFunnel} />
      </Card>
    </div>
  )
}

// ── Top Performing Mentors ────────────────────────────────────────────────────
function TopMentorsTable() {
  return (
    <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 32 }}>
      <div style={{ padding: '20px 24px 14px' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 600, color: INK }}>Top Performing Mentors</div>
        <div style={{ fontSize: 12, color: SUBTLE, marginTop: 2 }}>Ranked by overall performance score</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${BORDER}`, background: '#FAF8F4' }}>
            {['Mentor', 'Growth Path', 'Company', 'Rating', 'Score', 'Learners', 'Sessions'].map(h => (
              <th key={h} style={{ padding: '10px 24px', fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {topMentors.map((m, i) => (
            <tr key={m.name} style={{ borderBottom: i < topMentors.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
              <td style={{ padding: '13px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: i < 3 ? GOLD : MUTED, width: 16 }}>#{i + 1}</span>
                  <img src={m.avatar} alt={m.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: INK, whiteSpace: 'nowrap' }}>{m.name}</span>
                </div>
              </td>
              <td style={{ padding: '13px 24px', fontSize: 12.5, color: SUBTLE, whiteSpace: 'nowrap' }}>{m.path}</td>
              <td style={{ padding: '13px 24px', fontSize: 12.5, color: SUBTLE, whiteSpace: 'nowrap' }}>{m.company}</td>
              <td style={{ padding: '13px 24px', fontSize: 12.5, color: INK, fontWeight: 600 }}>★ {m.rating}</td>
              <td style={{ padding: '13px 24px', fontSize: 12.5, color: GREEN, fontWeight: 700 }}>{m.score}</td>
              <td style={{ padding: '13px 24px', fontSize: 12.5, color: INK }}>{m.learners}</td>
              <td style={{ padding: '13px 24px', fontSize: 12.5, color: INK }}>{m.sessions}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </Card>
  )
}

const severityColors: Record<string, [string, string]> = {
  Critical: [RED, RED_BG],
  High: [ORANGE, ORANGE_BG],
  Medium: [AMBER, AMBER_BG],
  Low: [GREEN, GREEN_BG],
}
const severityDot: Record<string, string> = { Critical: '🔴', High: '🟠', Medium: '🟡', Low: '🟢' }

// ── Quality & Risk Center + AI Insights ───────────────────────────────────────
function RiskAndInsights() {
  return (
    <div style={{ marginBottom: 32 }}>
      <Card style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Icon d={icons.shieldCheck} size={16} style={{ color: GOLD }} />
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 600, color: INK }}>Quality &amp; Risk Center</div>
        </div>
        <div style={{ fontSize: 12, color: SUBTLE, marginBottom: 16 }}>Operational alerts requiring administrator awareness</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {riskAlerts.map((a, i) => {
            const [color, bg] = severityColors[a.severity]
            return (
              <div key={i} style={{ padding: 14, borderRadius: 10, border: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color, background: bg, borderRadius: 6, padding: '3px 9px' }}>
                    {severityDot[a.severity]} {a.severity}
                  </span>
                  <span style={{ fontSize: 11, color: MUTED }}>{a.updated}</span>
                </div>
                <div style={{ fontSize: 13, color: INK, fontWeight: 500, marginBottom: 6 }}>{a.title}</div>
                <div style={{ fontSize: 11.5, color: SUBTLE, marginBottom: 4 }}>
                  <strong style={{ color: INK }}>{a.department}</strong> · Owner: {a.owner}
                </div>
                <div style={{ fontSize: 12, color: GOLD, fontWeight: 500 }}>{a.action}</div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// ── EXECUTIVE OVERVIEW — main assembled page ──────────────────────────────────
export default function OverviewPage() {
  const [range, setRange] = useState<Range>('7 Days')
  const [growthPath, setGrowthPath] = useState('All Growth Paths')
  const [mentor, setMentor] = useState('All Mentors')
  const [cohort, setCohort] = useState('All Cohorts')
  const [region, setRegion] = useState(regions[0])
  const [placementStatus, setPlacementStatus] = useState(placementStatuses[0])
  const [dateRange, setDateRange] = useState('This Month')

  return (
    <PageShell
      title="Executive Command Center"
      subtitle="Starfix Growth Operations · real-time platform health, learner growth, mentor performance & placement outcomes."
    >

      <GlobalFilters
        growthPath={growthPath} setGrowthPath={setGrowthPath}
        mentor={mentor} setMentor={setMentor}
        cohort={cohort} setCohort={setCohort}
        region={region} setRegion={setRegion}
        placementStatus={placementStatus} setPlacementStatus={setPlacementStatus}
        dateRange={dateRange} setDateRange={setDateRange}
      />

      <KpiCards />
      <OperationsIntelligence />
      <PlatformGrowthChart range={range} setRange={setRange} />
      <DistributionAndUtilization />
      <FunnelsSection />
      <TopMentorsTable />
      <RiskAndInsights />
    </PageShell>
  )
}
