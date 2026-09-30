import React, { useState, useMemo, useEffect } from 'react'
import { Card } from '../shared'
import { getEcosystem } from '../adminBackend'
import { resolveApproximateLocation } from '../lib/userIntelligence'

interface GeographyAnalyticsViewProps {
  ecosystem?: any
}

type ScopeType = 'all' | 'learners' | 'mentors'
type GranularityType = 'country' | 'state' | 'city'
type DateFilterType = 'today' | '7d' | '30d' | '90d' | '1y' | 'all'

export function GeographyAnalyticsView({ ecosystem }: GeographyAnalyticsViewProps) {
  const [liveData, setLiveData] = useState<any>(ecosystem || null)
  const [loading, setLoading] = useState(!ecosystem)
  const [scope, setScope] = useState<ScopeType>('all')
  const [granularity, setGranularity] = useState<GranularityType>('country')
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (ecosystem) {
      setLiveData(ecosystem)
      setLoading(false)
      return
    }
    let isMounted = true
    setLoading(true)
    getEcosystem()
      .then(res => {
        if (isMounted) {
          setLiveData(res)
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false)
      })
    return () => { isMounted = false }
  }, [ecosystem])

  // Filter window timestamp calculation
  const cutoffTime = useMemo(() => {
    const now = Date.now()
    const DAY = 86400000
    switch (dateFilter) {
      case 'today': return now - DAY
      case '7d': return now - 7 * DAY
      case '30d': return now - 30 * DAY
      case '90d': return now - 90 * DAY
      case '1y': return now - 365 * DAY
      case 'all': default: return 0
    }
  }, [dateFilter])

  // Compile individual resolved user locations
  const resolvedUsers = useMemo(() => {
    if (!liveData) return []
    const profiles: any[] = liveData.profiles || []
    const mentors: any[] = liveData.mentors || []
    const progress: any[] = liveData.progress || []
    const bookings: any[] = liveData.bookings || []

    const mentorProfileIds = new Set(mentors.map(m => m.profile_id).filter(Boolean))
    const userLastActivityMap = new Map<string, number>()

    progress.forEach(p => {
      const t = p.last_active_date ? Date.parse(p.last_active_date) : 0
      const cur = userLastActivityMap.get(p.user_id) || 0
      if (t > cur) userLastActivityMap.set(p.user_id, t)
    })
    bookings.forEach(b => {
      const t = b.created_at ? Date.parse(b.created_at) : 0
      if (b.student_id) {
        const cur = userLastActivityMap.get(b.student_id) || 0
        if (t > cur) userLastActivityMap.set(b.student_id, t)
      }
    })

    const results: Array<{
      id: string
      name: string
      role: 'mentor' | 'learner'
      country: string
      state: string
      city: string
      locationLabel: string
      createdAt: number
      lastActive: number
    }> = []

    // 1. Process Mentors (both from mentor table and profile)
    mentors.forEach(m => {
      const p = profiles.find(pr => pr.id === m.profile_id)
      const loc = resolveApproximateLocation(p?.country, m.location, m.id)
      const createdAt = m.created_at ? Date.parse(m.created_at) : (p?.created_at ? Date.parse(p.created_at) : 0)
      const lastActive = Math.max(
        createdAt,
        userLastActivityMap.get(m.id) || 0,
        userLastActivityMap.get(m.profile_id) || 0
      )
      results.push({
        id: m.id,
        name: m.name || 'Mentor',
        role: 'mentor',
        country: loc.country,
        state: loc.state,
        city: loc.city,
        locationLabel: loc.location,
        createdAt,
        lastActive
      })
    })

    // 2. Process Learners / Profiles (excluding those who are mentors)
    profiles.forEach(p => {
      if (mentorProfileIds.has(p.id) || p.role === 'admin') return
      const loc = resolveApproximateLocation(p.country, null, p.id)
      const createdAt = p.created_at ? Date.parse(p.created_at) : 0
      const lastActive = Math.max(createdAt, userLastActivityMap.get(p.id) || 0)
      results.push({
        id: p.id,
        name: p.full_name || p.email || 'Learner',
        role: 'learner',
        country: loc.country,
        state: loc.state,
        city: loc.city,
        locationLabel: loc.location,
        createdAt,
        lastActive
      })
    })

    return results
  }, [liveData])

  // Filter based on scope and dateFilter
  const filteredUsers = useMemo(() => {
    return resolvedUsers.filter(u => {
      if (scope === 'learners' && u.role !== 'learner') return false
      if (scope === 'mentors' && u.role !== 'mentor') return false
      if (cutoffTime > 0) {
        // Active or created within time window
        const touched = Math.max(u.createdAt, u.lastActive)
        if (touched < cutoffTime) return false
      }
      return true
    })
  }, [resolvedUsers, scope, cutoffTime])

  // Aggregate by chosen granularity
  const aggregatedStats = useMemo(() => {
    const counts = new Map<string, { key: string; country: string; total: number; learners: number; mentors: number; recentActive: number }>()

    filteredUsers.forEach(u => {
      let key = ''
      if (granularity === 'country') key = u.country || 'Unknown'
      else if (granularity === 'state') key = `${u.state || u.city || 'State'}, ${u.country}`
      else key = `${u.city || 'Metro'}, ${u.country}`

      const cur = counts.get(key) || { key, country: u.country, total: 0, learners: 0, mentors: 0, recentActive: 0 }
      cur.total += 1
      if (u.role === 'learner') cur.learners += 1
      if (u.role === 'mentor') cur.mentors += 1
      const isRecent = u.lastActive >= Date.now() - 7 * 86400000
      if (isRecent) cur.recentActive += 1
      counts.set(key, cur)
    })

    const total = filteredUsers.length || 1
    const list = Array.from(counts.values()).map(item => ({
      ...item,
      percentage: (item.total / total) * 100
    }))

    // Sort descending by total count
    list.sort((a, b) => b.total - a.total)
    return list
  }, [filteredUsers, granularity])

  // Searched items
  const displayedAggregates = useMemo(() => {
    if (!search.trim()) return aggregatedStats
    const q = search.toLowerCase()
    return aggregatedStats.filter(item => item.key.toLowerCase().includes(q))
  }, [aggregatedStats, search])

  // High-level KPIs
  const totalInScope = filteredUsers.length
  const topRegion = aggregatedStats[0]?.key || '—'
  const topRegionShare = aggregatedStats[0]?.percentage.toFixed(1) || '0'
  const uniqueCountriesCount = new Set(filteredUsers.map(u => u.country)).size
  const uniqueCitiesCount = new Set(filteredUsers.map(u => u.city)).size
  const topThreeConcentration = aggregatedStats.slice(0, 3).reduce((sum, item) => sum + item.percentage, 0).toFixed(1)

  const dateFilterLabels: Record<DateFilterType, string> = {
    today: 'Today',
    '7d': '7 Days',
    '30d': '30 Days',
    '90d': '90 Days',
    '1y': '1 Year',
    all: 'All Time'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22, color: '#F4D67A' }}>🌍</span>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 600, color: '#F7EFD8', margin: 0 }}>
              User Geography & Regional Distribution
            </h2>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#9AA0BA' }}>
            Geographical dispersion of Starfix learners and mentors with ranked regional densities and timeframe analysis.
          </p>
        </div>

        {/* Date Filter Badges */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 10, border: '1px solid rgba(212,175,55,0.16)' }}>
          {(['today', '7d', '30d', '90d', '1y', 'all'] as DateFilterType[]).map(df => (
            <button
              key={df}
              onClick={() => setDateFilter(df)}
              style={{
                padding: '6px 12px',
                borderRadius: 7,
                border: 0,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: dateFilter === df ? 600 : 400,
                color: dateFilter === df ? '#070A1A' : '#9AA0BA',
                background: dateFilter === df ? 'linear-gradient(135deg, #F4D67A, #D4AF37)' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              {dateFilterLabels[df]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.14)' }}>
          <div style={{ fontSize: 11.5, color: '#8A90AB', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Filtered Population</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 600, color: '#F4D67A', marginTop: 4 }}>
            {totalInScope}
          </div>
          <div style={{ fontSize: 11.5, color: '#9AA0BA', marginTop: 4 }}>
            {scope === 'all' ? 'All learners & mentors' : scope === 'learners' ? 'Active & enrolled learners' : 'Listed & active mentors'}
          </div>
        </div>

        <div style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.14)' }}>
          <div style={{ fontSize: 11.5, color: '#8A90AB', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Primary Geographic Hub</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 600, color: '#F7EFD8', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {topRegion}
          </div>
          <div style={{ fontSize: 11.5, color: '#4ADE80', marginTop: 4 }}>
            {topRegionShare}% of total active users
          </div>
        </div>

        <div style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.14)' }}>
          <div style={{ fontSize: 11.5, color: '#8A90AB', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Global Footprint</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 600, color: '#F4D67A', marginTop: 4 }}>
            {uniqueCountriesCount} <span style={{ fontSize: 14, color: '#8A90AB', fontFamily: 'Inter, sans-serif' }}>countries · {uniqueCitiesCount} hubs</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#9AA0BA', marginTop: 4 }}>
            Approximate City/State density
          </div>
        </div>

        <div style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.14)' }}>
          <div style={{ fontSize: 11.5, color: '#8A90AB', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Top 3 Hub Concentration</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 600, color: '#F7EFD8', marginTop: 4 }}>
            {topThreeConcentration}%
          </div>
          <div style={{ fontSize: 11.5, color: '#9AA0BA', marginTop: 4 }}>
            Combined share in leading regions
          </div>
        </div>
      </div>

      {/* Control Bar: Scope Filter + Granularity Switcher + Search */}
      <Card style={{ padding: 18, background: 'rgba(10,16,48,0.5)', borderColor: 'rgba(212,175,55,0.16)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          {/* User Scope Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#8A90AB', fontWeight: 600 }}>Scope:</span>
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', padding: 3, borderRadius: 8, border: '1px solid rgba(212,175,55,0.12)' }}>
              {[
                { id: 'all', label: 'All Users' },
                { id: 'learners', label: 'Learners' },
                { id: 'mentors', label: 'Mentors' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setScope(s.id as ScopeType)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: 0,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: scope === s.id ? 600 : 400,
                    color: scope === s.id ? '#070A1A' : '#9AA0BA',
                    background: scope === s.id ? 'linear-gradient(135deg, #F4D67A, #D4AF37)' : 'transparent'
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Granularity Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#8A90AB', fontWeight: 600 }}>Granularity:</span>
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', padding: 3, borderRadius: 8, border: '1px solid rgba(212,175,55,0.12)' }}>
              {[
                { id: 'country', label: 'Country' },
                { id: 'state', label: 'State / Region' },
                { id: 'city', label: 'City' }
              ].map(g => (
                <button
                  key={g.id}
                  onClick={() => setGranularity(g.id as GranularityType)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: 0,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: granularity === g.id ? 600 : 400,
                    color: granularity === g.id ? '#070A1A' : '#9AA0BA',
                    background: granularity === g.id ? 'linear-gradient(135deg, #F4D67A, #D4AF37)' : 'transparent'
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Search */}
          <div style={{ flex: 1, minWidth: 200, maxWidth: 280, marginLeft: 'auto' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${granularity}…`}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                height: 36,
                padding: '0 12px',
                borderRadius: 8,
                border: '1px solid rgba(212,175,55,0.22)',
                background: 'rgba(255,255,255,0.04)',
                color: '#fff',
                fontSize: 12.5
              }}
            />
          </div>
        </div>
      </Card>

      {/* Ranked Regional Distribution Bar Chart */}
      <Card style={{ padding: 22, background: 'linear-gradient(180deg, rgba(14,22,56,0.6) 0%, rgba(7,10,26,0.7) 100%)', borderColor: 'rgba(212,175,55,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#F7EFD8', margin: 0 }}>
              Ranked Regional Density ({granularity.toUpperCase()})
            </h3>
            <div style={{ fontSize: 12, color: '#8A90AB', marginTop: 3 }}>
              Relative concentration of users across identified geographies
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#F4D67A', background: 'rgba(212,175,55,0.1)', padding: '4px 10px', borderRadius: 99, border: '1px solid rgba(212,175,55,0.25)' }}>
            {displayedAggregates.length} {granularity}s recorded
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '36px 0', textAlign: 'center', color: '#8A90AB', fontSize: 13 }}>
            Calculating regional metrics from Supabase database…
          </div>
        ) : displayedAggregates.length === 0 ? (
          <div style={{ padding: '36px 0', textAlign: 'center', color: '#8A90AB', fontSize: 13 }}>
            No geographic records match this filter combination.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {displayedAggregates.map((item, idx) => {
              const rank = idx + 1
              const isTopThree = rank <= 3
              return (
                <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* Label Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                          color: isTopThree ? '#0A0E1F' : '#9AA0BA',
                          background: isTopThree ? 'linear-gradient(135deg, #F4D67A, #D4AF37)' : 'rgba(255,255,255,0.06)'
                        }}
                      >
                        {rank}
                      </span>
                      <span style={{ fontWeight: 600, color: '#F7EFD8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.key}
                      </span>
                      <span style={{ fontSize: 11, color: '#8A90AB', flexShrink: 0 }}>
                        ({item.learners} {item.learners === 1 ? 'learner' : 'learners'} · {item.mentors} {item.mentors === 1 ? 'mentor' : 'mentors'})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <span style={{ color: '#4ADE80', fontSize: 11, fontWeight: 500 }}>
                        {item.recentActive} active 7d
                      </span>
                      <span style={{ fontWeight: 600, color: '#F4D67A', minWidth: 44, textAlign: 'right' }}>
                        {item.total} <span style={{ fontSize: 11, color: '#8A90AB', fontWeight: 400 }}>({item.percentage.toFixed(1)}%)</span>
                      </span>
                    </div>
                  </div>

                  {/* Percentage Bar */}
                  <div
                    style={{
                      height: 8,
                      width: '100%',
                      borderRadius: 99,
                      background: 'rgba(255,255,255,0.06)',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(item.percentage, 2)}%`,
                        borderRadius: 99,
                        background: isTopThree
                          ? 'linear-gradient(90deg, #D4AF37 0%, #F4D67A 100%)'
                          : 'linear-gradient(90deg, #8A90AB 0%, #B8901F 100%)',
                        boxShadow: isTopThree ? '0 0 10px rgba(244,214,122,0.3)' : 'none',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Geographic Breakdown Detail Table */}
      <Card style={{ padding: 0, overflow: 'hidden', borderColor: 'rgba(212,175,55,0.16)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(212,175,55,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#F7EFD8', fontSize: 14 }}>Geographic Density Breakdown</div>
            <div style={{ fontSize: 11.5, color: '#8A90AB', marginTop: 2 }}>Approximate regional distribution based on registered country and mentor profile signals</div>
          </div>
          <div style={{ fontSize: 11, color: '#8A90AB' }}>
            Data privacy: City and country approximate hubs only
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: 'rgba(212,175,55,0.07)', color: '#D4AF37', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Rank</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>{granularity.toUpperCase()}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Learners</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Mentors</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Total Users</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Active (7d)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Share of Total</th>
              </tr>
            </thead>
            <tbody>
              {displayedAggregates.map((item, idx) => (
                <tr key={item.key} style={{ borderTop: '1px solid rgba(212,175,55,0.1)' }}>
                  <td style={{ padding: '12px 16px', color: '#8A90AB' }}>#{idx + 1}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#F7EFD8' }}>{item.key}</td>
                  <td style={{ padding: '12px 16px', color: '#9AA0BA' }}>{item.learners}</td>
                  <td style={{ padding: '12px 16px', color: '#9AA0BA' }}>{item.mentors}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#F4D67A' }}>{item.total}</td>
                  <td style={{ padding: '12px 16px', color: '#4ADE80' }}>{item.recentActive}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#F7EFD8', fontWeight: 600 }}>{item.percentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
