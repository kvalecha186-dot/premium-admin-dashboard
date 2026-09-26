import React, { useState, useMemo } from 'react'
import { Icon, icons, Card } from '../shared'
import EcosystemAnalyticsView from './EcosystemAnalyticsView'
import {
  theme,
  KPIS,
  GROWTH_FILTERS,
  generateGrowthSeries,
  LEARNER_FUNNEL,
  funnelConversion,
  funnelDropoff,
  funnelEfficiency,
  BIGGEST_DROPOFF_INDEX,
  PATH_TABLE,
  riskTone,
  MENTOR_TABLE,
  CAPACITY_BUCKETS,
  OVERLOADED_MENTORS,
  SESSION_STATS,
  DAILY_SESSIONS,
  WEEKLY_SESSIONS,
  MONTHLY_SESSIONS,
  ENGAGEMENT,
  HEATMAP_DAYS,
  HEATMAP_BLOCKS,
  ENGAGEMENT_HEATMAP,
  PEAK_LEARNING,
  PLACEMENT_KPIS,
  PLACEMENT_PIPELINE,
  TOP_HIRING_COMPANIES,
  TOP_HIRING_DOMAINS,
  SALARY_BY_DOMAIN,
  PLACEMENT_TREND,
  REVENUE,
  REVENUE_MONTHLY_TREND,
  REVENUE_BY_PATH,
  REVENUE_BY_MENTOR,
  GEO,
  TOP_CITIES,
  TOP_STATES,
  RISK_ALERTS,
  severityTone,
  AI_INSIGHTS,
  FILTER_OPTIONS,
  CATEGORY_SUMMARIES,
  TOP_PERFORMING_CATEGORIES,
  CATEGORY_MENTOR_UTILIZATION,
  categoryHealthTone,
  type GrowthFilter,
  type RiskLevel,
  type Severity,
  type PathTableRow,
  type MentorTableRow,
} from './data'

// ── Sparkline SVG Helper ──────────────────────────────────────────────────────
function Sparkline({ data, color = theme.gold, width = 90, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((val - min) / range) * (height - 6) - 3
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `${points} ${width},${height} 0,${height}`

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${data.join('-')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#sg-${data.join('-')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* End dot */}
      {data.length > 0 && (
        <circle
          cx={width}
          cy={height - ((data[data.length - 1] - min) / range) * (height - 6) - 3}
          r="3"
          fill={color}
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
      )}
    </svg>
  )
}

// ── Main Growth Intelligence Component ─────────────────────────────────────────
export default function GrowthIntelligenceView() {
  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Active View Sub-tab
  const [activeTab, setActiveTab] = useState<'all' | 'overview' | 'paths' | 'engagement' | 'cohorts' | 'revenue'>('all')

  // Global Filters
  const [dateRange, setDateRange] = useState(FILTER_OPTIONS.dateRanges[1])
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All Categories')
  const [selectedPathFilter, setSelectedPathFilter] = useState('All Growth Paths')
  const [selectedMentorFilter, setSelectedMentorFilter] = useState('All Mentors')
  const [selectedCohortFilter, setSelectedCohortFilter] = useState('All Cohorts')
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('All Companies')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Statuses')
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('All Locations')

  // Section 2: Growth Chart State
  const [growthTimeframe, setGrowthTimeframe] = useState<GrowthFilter>('30D')
  const [visibleSeries, setVisibleSeries] = useState({
    newLearners: true,
    activeLearners: true,
    completedLearners: true,
    placedLearners: true,
    activeMentors: true,
  })

  const growthSeriesData = useMemo(() => generateGrowthSeries(growthTimeframe), [growthTimeframe])

  // Section 4: Growth Path Table State
  const [pathSearch, setPathSearch] = useState('')
  const [pathRiskFilter, setPathRiskFilter] = useState<'All' | RiskLevel>('All')
  const [pathSortField, setPathSortField] = useState<keyof PathTableRow>('revenue')
  const [pathSortAsc, setPathSortAsc] = useState(false)

  const filteredPaths = useMemo(() => {
    return PATH_TABLE.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(pathSearch.toLowerCase())
      const matchRisk = pathRiskFilter === 'All' || p.riskLevel === pathRiskFilter
      const matchFilter = selectedPathFilter === 'All Growth Paths' || p.name === selectedPathFilter
      const matchCategory = selectedCategoryFilter === 'All Categories' || p.category === selectedCategoryFilter
      return matchSearch && matchRisk && matchFilter && matchCategory
    }).sort((a, b) => {
      const valA = a[pathSortField]
      const valB = b[pathSortField]
      if (typeof valA === 'number' && typeof valB === 'number') {
        return pathSortAsc ? valA - valB : valB - valA
      }
      return pathSortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA))
    })
  }, [pathSearch, pathRiskFilter, pathSortField, pathSortAsc, selectedPathFilter, selectedCategoryFilter])

  // Section 5: Mentor Leaderboard State
  const [mentorSearch, setMentorSearch] = useState('')
  const [mentorPathFilter, setMentorPathFilter] = useState('All')
  const [mentorSortField, setMentorSortField] = useState<keyof MentorTableRow>('performanceScore')
  const [mentorSortAsc, setMentorSortAsc] = useState(false)
  const [mentorPage, setMentorPage] = useState(1)
  const mentorsPerPage = 10

  const filteredMentors = useMemo(() => {
    return MENTOR_TABLE.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(mentorSearch.toLowerCase()) || m.company.toLowerCase().includes(mentorSearch.toLowerCase())
      const matchPath = mentorPathFilter === 'All' || m.pathName === mentorPathFilter
      const matchGlobalMentor = selectedMentorFilter === 'All Mentors' || m.name === selectedMentorFilter
      const matchGlobalCompany = selectedCompanyFilter === 'All Companies' || m.company === selectedCompanyFilter
      const matchCategory = selectedCategoryFilter === 'All Categories' || PATH_TABLE.find(p => p.id === m.pathId)?.category === selectedCategoryFilter
      return matchSearch && matchPath && matchGlobalMentor && matchGlobalCompany && matchCategory
    }).sort((a, b) => {
      const valA = a[mentorSortField]
      const valB = b[mentorSortField]
      if (typeof valA === 'number' && typeof valB === 'number') {
        return mentorSortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number)
      }
      return mentorSortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA))
    })
  }, [mentorSearch, mentorPathFilter, mentorSortField, mentorSortAsc, selectedMentorFilter, selectedCompanyFilter, selectedCategoryFilter])

  const totalMentorPages = Math.ceil(filteredMentors.length / mentorsPerPage) || 1
  const paginatedMentors = useMemo(() => {
    const start = (mentorPage - 1) * mentorsPerPage
    return filteredMentors.slice(start, start + mentorsPerPage)
  }, [filteredMentors, mentorPage])

  // Section 6: Session Analytics Timeframe
  const [sessionTimeframe, setSessionTimeframe] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly')
  const currentSessionSeries = sessionTimeframe === 'Daily' ? DAILY_SESSIONS : sessionTimeframe === 'Weekly' ? WEEKLY_SESSIONS : MONTHLY_SESSIONS

  // Schedule Report Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleEmail, setScheduleEmail] = useState('executive-team@starfix.com')
  const [scheduleFreq, setScheduleFreq] = useState('Weekly (Every Monday)')

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1440, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Toast Popup */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 28,
          right: 32,
          zIndex: 9999,
          background: '#171717',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 10,
          fontSize: 13.5,
          fontWeight: 500,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          border: '1px solid #C89B1F',
          animation: 'fadeIn 200ms ease'
        }}>
          <Icon d={icons.check} size={16} style={{ color: '#C89B1F' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(3px)',
          zIndex: 9990,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            width: '100%',
            maxWidth: 480,
            padding: 28,
            border: '1px solid #ECE7DF',
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 600, color: '#171717' }}>
                Schedule Growth Intelligence Report
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#8E8E93' }}
              >
                <Icon d={icons.x} size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#737373', marginBottom: 20, lineHeight: 1.5 }}>
              Automate weekly executive delivery of Starfix Growth Intelligence metrics directly to leadership inboxes.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#171717', display: 'block', marginBottom: 6 }}>
                  Recipient Email(s)
                </label>
                <input
                  type="email"
                  value={scheduleEmail}
                  onChange={e => setScheduleEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #ECE7DF', fontSize: 13, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#171717', display: 'block', marginBottom: 6 }}>
                  Frequency & Time
                </label>
                <select
                  value={scheduleFreq}
                  onChange={e => setScheduleFreq(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #ECE7DF', fontSize: 13, background: '#FFFFFF', outline: 'none' }}
                >
                  <option>Weekly (Every Monday 8:00 AM)</option>
                  <option>Bi-weekly (1st & 15th of month)</option>
                  <option>Monthly (1st of every month)</option>
                  <option>Daily Executive Digest (7:30 AM)</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #ECE7DF', background: '#FFFFFF', color: '#525252', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowScheduleModal(false)
                  showToast(`Report schedule activated for ${scheduleEmail}`)
                }}
                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#171717', color: '#FFFFFF', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER ROW */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 600, color: '#171717', margin: 0, lineHeight: 1.2 }}>
                Growth Intelligence
              </h1>
            </div>
            <p style={{ fontSize: 13.5, color: '#737373', margin: '6px 0 0', lineHeight: 1.5, maxWidth: 880 }}>
              Monitor learner growth, mentor effectiveness, engagement, placement outcomes, operational health, and business performance across the Starfix ecosystem.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => showToast('Exporting Growth Intelligence Report as PDF…')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
                border: '1px solid #ECE7DF', background: '#FFFFFF', color: '#171717', fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = theme.gold)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#ECE7DF')}
            >
              <Icon d={icons.barChart} size={14} style={{ color: theme.gold }} />
              Export PDF
            </button>
            <button
              onClick={() => showToast('Downloading complete Excel dataset (2,500+ records)…')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
                border: '1px solid #ECE7DF', background: '#FFFFFF', color: '#171717', fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = theme.gold)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#ECE7DF')}
            >
              <Icon d={icons.code} size={14} style={{ color: theme.gold }} />
              Export Excel
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                showToast('Dashboard URL copied to clipboard')
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
                border: '1px solid #ECE7DF', background: '#FFFFFF', color: '#171717', fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = theme.gold)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#ECE7DF')}
            >
              <Icon d={icons.link} size={14} style={{ color: theme.gold }} />
              Share Dashboard
            </button>
            <button
              onClick={() => setShowScheduleModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                border: 'none', background: '#171717', color: '#FFFFFF', fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
              }}
            >
              <Icon d={icons.calendar} size={14} style={{ color: theme.gold }} />
              Schedule Weekly Report
            </button>
          </div>
        </div>

        {/* GLOBAL FILTERS BAR */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #ECE7DF',
          borderRadius: 12,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#171717', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 4 }}>
            <Icon d={icons.filter} size={14} style={{ color: theme.gold }} />
            Global Filters:
          </div>

          {/* Date Range */}
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ECE7DF', background: '#FAF8F4', fontSize: 12.5, color: '#171717', outline: 'none', cursor: 'pointer' }}
          >
            {FILTER_OPTIONS.dateRanges.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Category */}
          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ECE7DF', background: '#FAF8F4', fontSize: 12.5, color: '#171717', outline: 'none', cursor: 'pointer', maxWidth: 170 }}
          >
            {FILTER_OPTIONS.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Growth Path */}
          <select
            value={selectedPathFilter}
            onChange={e => setSelectedPathFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ECE7DF', background: '#FAF8F4', fontSize: 12.5, color: '#171717', outline: 'none', cursor: 'pointer', maxWidth: 180 }}
          >
            {FILTER_OPTIONS.growthPaths.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* Cohort */}
          <select
            value={selectedCohortFilter}
            onChange={e => setSelectedCohortFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ECE7DF', background: '#FAF8F4', fontSize: 12.5, color: '#171717', outline: 'none', cursor: 'pointer', maxWidth: 150 }}
          >
            {FILTER_OPTIONS.cohorts.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Location */}
          <select
            value={selectedLocationFilter}
            onChange={e => setSelectedLocationFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ECE7DF', background: '#FAF8F4', fontSize: 12.5, color: '#171717', outline: 'none', cursor: 'pointer' }}
          >
            {FILTER_OPTIONS.locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          {(selectedCategoryFilter !== 'All Categories' || selectedPathFilter !== 'All Growth Paths' || selectedCohortFilter !== 'All Cohorts' || selectedLocationFilter !== 'All Locations') && (
            <button
              onClick={() => {
                setSelectedCategoryFilter('All Categories')
                setSelectedPathFilter('All Growth Paths')
                setSelectedCohortFilter('All Cohorts')
                setSelectedLocationFilter('All Locations')
                showToast('All global filters reset to default')
              }}
              style={{ fontSize: 11.5, color: theme.gold, border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* SUB-NAV TABS */}
        <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #ECE7DF', paddingBottom: 10, overflowX: 'auto' }}>
          {[
            { id: 'all', label: 'All Intelligence Views' },
            { id: 'overview', label: 'Executive & Growth' },
            { id: 'paths', label: 'Path & Mentor Tables' },
            { id: 'engagement', label: 'Engagement & Sessions' },
            { id: 'cohorts', label: 'Cohorts Analytics' },
            { id: 'revenue', label: 'Revenue & Geography' },
          ].map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: active ? '#171717' : 'transparent',
                  color: active ? '#FFFFFF' : '#525252',
                  fontSize: 12.5,
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 150ms ease'
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>


      {/* SECTION 2 & 3: PLATFORM GROWTH CHART & LEARNER FUNNEL */}
      {(activeTab === 'all' || activeTab === 'overview') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginBottom: 32 }}>

          {/* Platform Growth Chart */}
          <Card style={{ padding: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, color: '#171717' }}>
                  Platform Growth Dynamics
                </div>
                <div style={{ fontSize: 12, color: '#737373', marginTop: 2 }}>
                  Interactive multi-metric learner acquisition and outcome trends
                </div>
              </div>

              {/* Timeframe Filter Buttons */}
              <div style={{ display: 'flex', background: '#FAF8F4', border: '1px solid #ECE7DF', borderRadius: 8, padding: 3, gap: 2 }}>
                {GROWTH_FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setGrowthTimeframe(f.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: 'none',
                      background: growthTimeframe === f.id ? '#FFFFFF' : 'transparent',
                      color: growthTimeframe === f.id ? '#171717' : '#737373',
                      fontSize: 11.5,
                      fontWeight: growthTimeframe === f.id ? 600 : 450,
                      cursor: 'pointer',
                      boxShadow: growthTimeframe === f.id ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Series Toggles */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20, fontSize: 12 }}>
              {[
                { key: 'newLearners', label: 'New Learners', color: theme.gold },
                { key: 'activeLearners', label: 'Active Learners', color: '#171717' },
                { key: 'completedLearners', label: 'Completed', color: theme.green },
                { key: 'placedLearners', label: 'Placed', color: '#2563EB' },
                { key: 'activeMentors', label: 'Active Mentors', color: '#9333EA' },
              ].map(s => (
                <label key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={visibleSeries[s.key as keyof typeof visibleSeries]}
                    onChange={e => setVisibleSeries(prev => ({ ...prev, [s.key]: e.target.checked }))}
                    style={{ accentColor: s.color }}
                  />
                  <span style={{ color: visibleSeries[s.key as keyof typeof visibleSeries] ? '#171717' : '#A1A1AA', fontWeight: 500 }}>
                    {s.label}
                  </span>
                </label>
              ))}
            </div>

            {/* SVG Interactive Line / Area Chart */}
            <div style={{ height: 260, position: 'relative', width: '100%' }}>
              <svg width="100%" height="100%" viewBox="0 0 600 240" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                {/* Horizontal Grid lines */}
                {[0, 60, 120, 180, 240].map((y, i) => (
                  <line key={i} x1="0" y1={y} x2="600" y2={y} stroke="#ECE7DF" strokeDasharray="3 3" strokeWidth="1" />
                ))}

                {/* Render Lines for Active Series */}
                {(() => {
                  const maxVal = Math.max(
                    ...growthSeriesData.flatMap(d => [
                      visibleSeries.newLearners ? d.newLearners : 0,
                      visibleSeries.activeLearners ? d.activeLearners : 0,
                      visibleSeries.completedLearners ? d.completedLearners : 0,
                      visibleSeries.placedLearners ? d.placedLearners : 0,
                      visibleSeries.activeMentors ? d.activeMentors * 10 : 0,
                    ])
                  ) || 1

                  const seriesKeys: Array<{ key: keyof typeof visibleSeries; color: string }> = [
                    { key: 'activeLearners', color: '#171717' },
                    { key: 'newLearners', color: theme.gold },
                    { key: 'completedLearners', color: theme.green },
                    { key: 'placedLearners', color: '#2563EB' },
                  ]

                  return seriesKeys.map(({ key, color }) => {
                    if (!visibleSeries[key]) return null
                    const pts = growthSeriesData.map((d, i) => {
                      const x = (i / (growthSeriesData.length - 1)) * 600
                      const val = d[key] as number
                      const y = 220 - (val / maxVal) * 190
                      return `${x},${y}`
                    }).join(' ')

                    return (
                      <g key={key}>
                        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        {growthSeriesData.map((d, i) => {
                          const x = (i / (growthSeriesData.length - 1)) * 600
                          const val = d[key] as number
                          const y = 220 - (val / maxVal) * 190
                          return (
                            <circle key={i} cx={x} cy={y} r="3.5" fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
                          )
                        })}
                      </g>
                    )
                  })
                })()}
              </svg>

              {/* X Axis Labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: '#8E8E93' }}>
                {growthSeriesData.map((d, i) => (
                  <span key={i}>{d.label}</span>
                ))}
              </div>
            </div>
          </Card>


          {/* Learner Journey Funnel */}
          <Card style={{ padding: 26, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, color: '#171717' }}>
                  Learner Journey Funnel
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: theme.gold, background: theme.goldBg, padding: '2px 8px', borderRadius: 99 }}>
                  Efficiency: {funnelEfficiency(LEARNER_FUNNEL)}%
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#737373', margin: '0 0 16px' }}>
                Stage conversion rates & drop-off metrics across learner lifecycle
              </p>

              {/* Funnel Stage Stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {LEARNER_FUNNEL.map((stage, idx) => {
                  const conv = funnelConversion(LEARNER_FUNNEL, idx)
                  const drop = funnelDropoff(LEARNER_FUNNEL, idx)
                  const isWorst = idx === BIGGEST_DROPOFF_INDEX

                  return (
                    <div
                      key={stage.label}
                      style={{
                        background: isWorst ? '#FEF2F2' : '#FAF8F4',
                        border: isWorst ? '1px solid #FCA5A5' : '1px solid #ECE7DF',
                        borderRadius: 8,
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isWorst ? theme.red : '#8E8E93', width: 16 }}>
                          {idx + 1}.
                        </span>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: isWorst ? theme.red : '#171717' }}>
                            {stage.label}
                          </div>
                          <div style={{ fontSize: 11, color: '#737373' }}>
                            {stage.value.toLocaleString()} learners
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'right' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#171717' }}>
                            {conv}%
                          </div>
                          <div style={{ fontSize: 10.5, color: '#8E8E93' }}>
                            conv
                          </div>
                        </div>
                        {idx > 0 && (
                          <div style={{ minWidth: 50, textAlign: 'right' }}>
                            <div style={{ fontSize: 11.5, fontWeight: 600, color: isWorst ? theme.red : theme.amber }}>
                              -{drop}%
                            </div>
                            <div style={{ fontSize: 10, color: isWorst ? theme.red : '#8E8E93' }}>
                              drop-off
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        </div>
      )}


      {/* SECTION 4: GROWTH PATH INTELLIGENCE (SORTABLE TABLE) */}
      {(activeTab === 'all' || activeTab === 'paths') && (
        <Card style={{ padding: 26, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 19, fontWeight: 600, color: '#171717' }}>
                Growth Path Intelligence
              </div>
              <div style={{ fontSize: 12.5, color: '#737373', marginTop: 2 }}>
                Comprehensive performance, capacity, attendance, placement, and revenue analytics across all {PATH_TABLE.length} Starfix growth paths — Career & Tech, Health & Fitness, Mindset, Personal Life, and Student Life
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search growth path…"
                  value={pathSearch}
                  onChange={e => setPathSearch(e.target.value)}
                  style={{
                    padding: '7px 12px 7px 32px', borderRadius: 8, border: '1px solid #ECE7DF', background: '#FAF8F4',
                    fontSize: 12.5, outline: 'none', width: 200
                  }}
                />
                <Icon d={icons.search} size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#8E8E93' }} />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #ECE7DF', background: '#FAF8F4', fontSize: 12, color: '#171717', outline: 'none', cursor: 'pointer' }}
              >
                {FILTER_OPTIONS.categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Risk Filter */}
              <div style={{ display: 'flex', gap: 4, background: '#FAF8F4', border: '1px solid #ECE7DF', borderRadius: 8, padding: 3 }}>
                {(['All', 'Low', 'Medium', 'High'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setPathRiskFilter(r)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, border: 'none',
                      background: pathRiskFilter === r ? '#FFFFFF' : 'transparent',
                      color: pathRiskFilter === r ? '#171717' : '#737373',
                      fontSize: 11.5, fontWeight: pathRiskFilter === r ? 600 : 450, cursor: 'pointer'
                    }}
                  >
                    {r} {r !== 'All' ? 'Risk' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ECE7DF', background: '#FAF8F4' }}>
                  {[
                    { key: 'name', label: 'Growth Path' },
                    { key: 'category', label: 'Category' },
                    { key: 'learners', label: 'Learners' },
                    { key: 'completionRate', label: 'Completion' },
                    { key: 'monthlyGrowth', label: 'Growth' },
                    { key: 'retentionRate', label: 'Retention' },
                    { key: 'activeMentors', label: 'Mentors' },
                    { key: 'revenue', label: 'Revenue' },
                    { key: 'avgRating', label: 'Avg Rating' },
                    { key: 'riskLevel', label: 'Risk' },
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => {
                        if (pathSortField === col.key) setPathSortAsc(!pathSortAsc)
                        else { setPathSortField(col.key as keyof PathTableRow); setPathSortAsc(false) }
                      }}
                      style={{
                        padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#737373', textTransform: 'uppercase',
                        letterSpacing: '0.04em', cursor: 'pointer', userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {col.label}
                        {pathSortField === col.key && (
                          <span style={{ color: theme.gold }}>{pathSortAsc ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPaths.map(row => {
                  const rTone = riskTone(row.riskLevel)
                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid #ECE7DF', transition: 'background 100ms ease' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAF8F4')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#171717' }}>
                        {row.name}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: theme.gold, background: theme.goldBg, padding: '3px 9px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                          {row.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#525252' }}>
                        {row.learners.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#171717', fontWeight: 500 }}>
                        {row.completionRate}%
                      </td>
                      <td style={{ padding: '12px 14px', color: row.monthlyGrowth >= 0 ? theme.green : theme.red, fontWeight: 600 }}>
                        {row.monthlyGrowth >= 0 ? '+' : ''}{row.monthlyGrowth}%
                      </td>
                      <td style={{ padding: '12px 14px', color: '#525252' }}>
                        {row.retentionRate}%
                      </td>
                      <td style={{ padding: '12px 14px', color: '#525252' }}>
                        {row.activeMentors}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#171717' }}>
                        ₹{row.revenue.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#171717', fontWeight: 500 }}>
                        {row.avgRating.toFixed(2)} ★
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: rTone.color, background: rTone.bg, padding: '3px 9px', borderRadius: 99 }}>
                          {row.riskLevel}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}




      {/* SECTION 7: SESSION ANALYTICS */}
      {(activeTab === 'all' || activeTab === 'engagement') && (
        <div style={{ marginBottom: 32 }}>

          {/* Session Analytics */}
          <Card style={{ padding: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, color: '#171717' }}>
                  Session Analytics
                </div>
                <div style={{ fontSize: 12, color: '#737373', marginTop: 2 }}>
                  Booking, completion, and attendance volume
                </div>
              </div>

              <div style={{ display: 'flex', background: '#FAF8F4', border: '1px solid #ECE7DF', borderRadius: 8, padding: 3, gap: 2 }}>
                {(['Daily', 'Weekly', 'Monthly'] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setSessionTimeframe(tf)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, border: 'none',
                      background: sessionTimeframe === tf ? '#FFFFFF' : 'transparent',
                      color: sessionTimeframe === tf ? '#171717' : '#737373',
                      fontSize: 11.5, fontWeight: sessionTimeframe === tf ? 600 : 450, cursor: 'pointer'
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              <div style={{ background: '#FAF8F4', border: '1px solid #ECE7DF', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10.5, color: '#737373', textTransform: 'uppercase' }}>Booked</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#171717', marginTop: 2 }}>{SESSION_STATS.booked.toLocaleString()}</div>
              </div>
              <div style={{ background: '#FAF8F4', border: '1px solid #ECE7DF', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10.5, color: '#737373', textTransform: 'uppercase' }}>Completed</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: theme.green, marginTop: 2 }}>{SESSION_STATS.completed.toLocaleString()}</div>
              </div>
              <div style={{ background: '#FAF8F4', border: '1px solid #ECE7DF', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10.5, color: '#737373', textTransform: 'uppercase' }}>Attendance</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: theme.gold, marginTop: 2 }}>{SESSION_STATS.attendance}%</div>
              </div>
            </div>

            {/* Bar Chart */}
            <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: 12, paddingBottom: 24, borderBottom: '1px solid #ECE7DF' }}>
              {currentSessionSeries.map((item, i) => {
                const maxVal = Math.max(...currentSessionSeries.map(s => s.value)) || 1
                const heightPct = (item.value / maxVal) * 100
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: '#171717' }}>{item.value}</div>
                    <div style={{ width: '100%', height: `${heightPct}%`, background: theme.gold, borderRadius: '4px 4px 0 0', transition: 'height 300ms ease' }} />
                    <span style={{ fontSize: 10.5, color: '#8E8E93', marginTop: 4 }}>{item.label}</span>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#737373', marginTop: 14 }}>
              <span>Cancelled: <strong style={{ color: theme.red }}>{SESSION_STATS.cancelled}</strong></span>
              <span>Rescheduled: <strong style={{ color: theme.amber }}>{SESSION_STATS.rescheduled}</strong></span>
              <span>Avg Duration: <strong style={{ color: '#171717' }}>{SESSION_STATS.avgDurationMin} min</strong></span>
            </div>
          </Card>

        </div>
      )}


      {/* SECTION 11: REVENUE ANALYTICS & GEOGRAPHY */}
      {(activeTab === 'all' || activeTab === 'revenue') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 32 }}>

          {/* Revenue Analytics */}
          <Card style={{ padding: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, color: '#171717' }}>
                  Revenue Analytics & Payout Breakdown
                </div>
                <div style={{ fontSize: 12, color: '#737373', marginTop: 2 }}>
                  Monthly Recurring Revenue (MRR), mentor payouts, platform commission, and forecasts
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontFamily: 'Playfair Display, serif', fontWeight: 600, color: theme.gold }}>
                  ${REVENUE.monthly.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: '#8E8E93' }}>Monthly Revenue</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              <div style={{ background: '#FAF8F4', padding: 12, borderRadius: 8, border: '1px solid #ECE7DF' }}>
                <div style={{ fontSize: 10.5, color: '#737373', textTransform: 'uppercase' }}>Subscriptions</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#171717', marginTop: 2 }}>${REVENUE.subscription.toLocaleString()}</div>
              </div>
              <div style={{ background: '#FAF8F4', padding: 12, borderRadius: 8, border: '1px solid #ECE7DF' }}>
                <div style={{ fontSize: 10.5, color: '#737373', textTransform: 'uppercase' }}>Enterprise</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#171717', marginTop: 2 }}>${REVENUE.enterprise.toLocaleString()}</div>
              </div>
              <div style={{ background: '#FAF8F4', padding: 12, borderRadius: 8, border: '1px solid #ECE7DF' }}>
                <div style={{ fontSize: 10.5, color: '#737373', textTransform: 'uppercase' }}>Mentor Payouts</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: theme.red, marginTop: 2 }}>${REVENUE.mentorPayouts.toLocaleString()}</div>
              </div>
              <div style={{ background: '#FAF8F4', padding: 12, borderRadius: 8, border: '1px solid #ECE7DF' }}>
                <div style={{ fontSize: 10.5, color: '#737373', textTransform: 'uppercase' }}>Commission</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: theme.green, marginTop: 2 }}>${REVENUE.platformCommission.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, color: '#171717', marginBottom: 10 }}>Top Revenue Generating Growth Paths</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {REVENUE_BY_PATH.slice(0, 4).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12.5, color: '#171717', fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: theme.gold }}>${p.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>


          {/* Geographic Insights */}
          <Card style={{ padding: 26 }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, color: '#171717', marginBottom: 6 }}>
              Geographic Ecosystem Distribution
            </div>
            <div style={{ fontSize: 12, color: '#737373', marginBottom: 20 }}>
              Top metropolitan hubs for learners, mentors, and hiring partner hubs
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#171717' }}>Top Learner Cities</div>
              {TOP_CITIES.slice(0, 4).map(c => (
                <div key={c.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: '#171717' }}>{c.name}</span>
                    <span style={{ fontWeight: 600, color: theme.gold }}>{c.count.toLocaleString()} learners</span>
                  </div>
                  <div style={{ width: '100%', height: 4, background: '#FAF8F4', borderRadius: 99, border: '1px solid #ECE7DF' }}>
                    <div style={{ width: `${(c.count / TOP_CITIES[0].count) * 100}%`, height: '100%', background: theme.gold, borderRadius: 99 }} />
                  </div>
                </div>
              ))}

            </div>
          </Card>
        </div>
      )}

    </div>
  )
}
