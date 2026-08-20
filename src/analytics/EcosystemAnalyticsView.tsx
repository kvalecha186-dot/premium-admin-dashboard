// ── Platform Ecosystem Analytics — View ─────────────────────────────────────
// Renders items 6–12: User, Content, Community, AI Recommendation, Goal,
// Habit, and Search analytics. Designed as a self-contained block that
// GrowthIntelligenceView mounts inside its existing tab/filter shell, so it
// inherits the same premium ivory/gold design language without redefining it.

import React from 'react'
import { Card } from '../shared'
import { theme } from './data'
import {
  USER_ANALYTICS,
  USERS_BY_AGE,
  USERS_BY_COUNTRY,
  USERS_BY_CATEGORY,
  GOAL_ANALYTICS,
  HABIT_ANALYTICS,
  SEARCH_ANALYTICS,
} from './ecosystemData'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
      {children}
    </div>
  )
}

function StatTile({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div style={{ background: '#FAF8F4', border: '1px solid #ECE7DF', borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 10.5, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: tone || '#171717', marginTop: 2 }}>{value}</div>
    </div>
  )
}

function MiniBar({ pct, color = theme.gold }: { pct: number; color?: string }) {
  return (
    <div style={{ width: '100%', height: 5, background: '#FAF8F4', borderRadius: 99, border: '1px solid #ECE7DF' }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 99 }} />
    </div>
  )
}

export default function EcosystemAnalyticsView() {
  return (
    <div>
      {/* ── 6. USER ANALYTICS ── */}
      <div style={{ marginBottom: 32 }}>
        <SectionLabel>User Analytics</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
          <Card style={{ padding: 22 }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 600, color: '#171717', marginBottom: 14 }}>
              Platform Activity
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
              <StatTile label="Daily Active" value={USER_ANALYTICS.dau.toLocaleString()} />
              <StatTile label="Weekly Active" value={USER_ANALYTICS.wau.toLocaleString()} />
              <StatTile label="Monthly Active" value={USER_ANALYTICS.mau.toLocaleString()} />
              <StatTile label="Returning Users" value={`${USER_ANALYTICS.returningUsersPct}%`} tone={theme.green} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              <StatTile label="Premium Users" value={`${USER_ANALYTICS.premiumPct}%`} tone={theme.gold} />
              <StatTile label="Free Users" value={`${USER_ANALYTICS.freePct}%`} />
              <StatTile label="Conversion Rate" value={`${USER_ANALYTICS.conversionRate}%`} tone={theme.green} />
              <StatTile label="Avg Session" value={`${USER_ANALYTICS.avgSessionDurationMin}m`} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 10 }}>
              <StatTile label="Completion Rate" value={`${USER_ANALYTICS.completionRate}%`} />
              <StatTile label="Avg Streak" value={`${USER_ANALYTICS.avgStreakDays}d`} />
              <StatTile label="Daily Check-Ins" value={USER_ANALYTICS.dailyCheckIns.toLocaleString()} />
            </div>
          </Card>

          <Card style={{ padding: 22 }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 600, color: '#171717', marginBottom: 14 }}>
              Users by Category
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {USERS_BY_CATEGORY.map(c => {
                const max = Math.max(...USERS_BY_CATEGORY.map(x => x.users))
                return (
                  <div key={c.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 3 }}>
                      <span style={{ color: '#171717' }}>{c.category}</span>
                      <span style={{ fontWeight: 600, color: theme.gold }}>{c.users.toLocaleString()}</span>
                    </div>
                    <MiniBar pct={(c.users / max) * 100} />
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
          <Card style={{ padding: 22 }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 600, color: '#171717', marginBottom: 14 }}>
              Users by Age
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {USERS_BY_AGE.map(a => (
                <div key={a.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 3 }}>
                    <span style={{ color: '#171717' }}>{a.label}</span>
                    <span style={{ fontWeight: 600, color: '#525252' }}>{a.pct}% · {a.users.toLocaleString()}</span>
                  </div>
                  <MiniBar pct={a.pct * 2.6} color="#171717" />
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ padding: 22 }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 600, color: '#171717', marginBottom: 14 }}>
              Users by Country
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {USERS_BY_COUNTRY.map(c => (
                <div key={c.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 3 }}>
                    <span style={{ color: '#171717' }}>{c.name}</span>
                    <span style={{ fontWeight: 600, color: '#525252' }}>{c.pct}% · {c.users.toLocaleString()}</span>
                  </div>
                  <MiniBar pct={c.pct * 1.35} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── 10 & 11. GOAL + HABIT ANALYTICS ── */}
      <div style={{ marginBottom: 32 }}>
        <SectionLabel>Goal & Habit Analytics</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Card style={{ padding: 22 }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 600, color: '#171717', marginBottom: 14 }}>
              Goal Tracking
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
              <StatTile label="Goals Created" value={GOAL_ANALYTICS.goalsCreated.toLocaleString()} />
              <StatTile label="Goals Completed" value={GOAL_ANALYTICS.goalsCompleted.toLocaleString()} tone={theme.green} />
              <StatTile label="Avg Completion Time" value={`${GOAL_ANALYTICS.avgCompletionDays}d`} />
              <StatTile label="Abandonment Rate" value={`${GOAL_ANALYTICS.abandonmentRate}%`} tone={theme.red} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#171717', marginBottom: 8 }}>Most Popular Goals</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {GOAL_ANALYTICS.mostPopular.map(g => (
                <div key={g.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 7, background: '#FAF8F4', border: '1px solid #ECE7DF' }}>
                  <span style={{ fontSize: 11.5, color: '#171717' }}>{g.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: theme.gold }}>{g.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ padding: 22 }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 600, color: '#171717', marginBottom: 14 }}>
              Habit Analytics
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
              <StatTile label="Habits Created" value={HABIT_ANALYTICS.habitsCreated.toLocaleString()} />
              <StatTile label="Longest Streak" value={`${HABIT_ANALYTICS.longestStreak}d`} tone={theme.gold} />
              <StatTile label="Broken Streaks" value={HABIT_ANALYTICS.brokenStreaks.toLocaleString()} tone={theme.red} />
              <StatTile label="Weekly Consistency" value={`${HABIT_ANALYTICS.weeklyConsistency}%`} tone={theme.green} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#171717', marginBottom: 8 }}>Top Habits ({HABIT_ANALYTICS.completionRate}% overall completion)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {HABIT_ANALYTICS.topHabits.map(h => (
                <div key={h.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 7, background: '#FAF8F4', border: '1px solid #ECE7DF' }}>
                  <span style={{ fontSize: 11.5, color: '#171717' }}>{h.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#525252' }}>{h.activeStreaks.toLocaleString()} active · {h.avgStreakDays}d avg</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── 12. SEARCH ANALYTICS ── */}
      <div>
        <SectionLabel>Search Analytics</SectionLabel>
        <Card style={{ padding: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#171717', marginBottom: 8 }}>Top Searches</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SEARCH_ANALYTICS.topSearches.map(s => (
                  <div key={s.query} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 7, background: '#FAF8F4', border: '1px solid #ECE7DF' }}>
                    <span style={{ fontSize: 11.5, color: '#171717' }}>{s.query}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: theme.gold }}>{s.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#171717', marginBottom: 8 }}>Trending Searches</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SEARCH_ANALYTICS.trending.map(t => (
                  <div key={t.query} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 7, background: '#FAF8F4', border: '1px solid #ECE7DF' }}>
                    <span style={{ fontSize: 11.5, color: '#171717' }}>{t.query}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: theme.green }}>+{t.trend}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#171717', marginBottom: 8 }}>Zero-Result Searches</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SEARCH_ANALYTICS.zeroResult.map(z => (
                  <div key={z.query} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 7, background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
                    <span style={{ fontSize: 11.5, color: theme.red }}>{z.query}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: theme.red }}>{z.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#171717', marginBottom: 8 }}>Most Searched Mentors</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SEARCH_ANALYTICS.mostSearchedMentors.map(m => (
                  <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 7, background: '#FAF8F4', border: '1px solid #ECE7DF' }}>
                    <span style={{ fontSize: 11.5, color: '#171717' }}>{m.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: theme.gold }}>{m.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#171717', marginBottom: 8 }}>Most Searched Growth Paths</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SEARCH_ANALYTICS.mostSearchedPaths.map(p => (
                  <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 7, background: '#FAF8F4', border: '1px solid #ECE7DF' }}>
                    <span style={{ fontSize: 11.5, color: '#171717' }}>{p.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: theme.gold }}>{p.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
