// ── Mentor Intelligence — Path Analytics (mentors ranked by performance) ─────

import { Icon, icons } from '../shared'
import { getPath, mentorsForPath, pathCapacityDistribution, pathCapacityRate, pathCompletionRate, pathPlacementRate, theme, type Mentor } from './data'
import { BackButton, BarChart, Funnel, ProgressBar, RatingStars, SectionCard, StatBlock, Tag, TrendBadge } from './components'

function MentorRow({ mentor, rank, onSelect }: { mentor: Mentor; rank: number; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '18px 22px',
        cursor: 'pointer',
        transition: 'background 150ms ease',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = theme.bg)}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: rank === 1 ? theme.gold : theme.bg,
        border: rank === 1 ? 'none' : `1px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, color: rank === 1 ? theme.white : theme.textMuted,
      }}>
        {rank}
      </div>

      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img src={mentor.avatar} alt={mentor.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${theme.border}` }} />
        {mentor.verified && (
          <div style={{
            position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%',
            background: theme.gold, border: `2px solid ${theme.white}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon d={icons.shieldCheck} size={9} style={{ color: theme.white }} />
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: theme.text }}>{mentor.name}</div>
        <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {mentor.title}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {mentor.expertise.slice(0, 2).map((e, i) => <Tag key={i} tone="neutral">{e}</Tag>)}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexShrink: 0 }}>
        <div style={{ textAlign: 'center', minWidth: 54 }}>
          <RatingStars rating={mentor.rating} />
          <div style={{ fontSize: 10.5, color: theme.textFaint, marginTop: 2 }}>Rating</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 54 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{mentor.sessions}</div>
          <div style={{ fontSize: 10.5, color: theme.textFaint, marginTop: 2 }}>Sessions</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 54 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{mentor.activeClients}</div>
          <div style={{ fontSize: 10.5, color: theme.textFaint, marginTop: 2 }}>Clients</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 54 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.green }}>{mentor.successRate}%</div>
          <div style={{ fontSize: 10.5, color: theme.textFaint, marginTop: 2 }}>Success</div>
        </div>
        <div style={{ textAlign: 'right', minWidth: 90 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.gold, fontFamily: 'Playfair Display, serif' }}>{mentor.performanceScore}</div>
          <div style={{ marginTop: 4 }}>
            <ProgressBar value={mentor.performanceScore} height={4} />
          </div>
        </div>
        <Icon d={icons.chevronRight} size={16} style={{ color: theme.textFaint, flexShrink: 0 }} />
      </div>
    </div>
  )
}

export default function PathAnalyticsView({ pathId, onBack, onSelectMentor }: { pathId: string; onBack: () => void; onSelectMentor: (mentorId: string) => void }) {
  const path = getPath(pathId)
  const mentors = mentorsForPath(pathId)
  if (!path) return null

  const totalLearners = path.totalLearners
  const activeLearners = path.activeLearners
  const completion = pathCompletionRate(pathId)
  const placement = pathPlacementRate(pathId)
  const capacity = pathCapacityRate(pathId)
  const capacityDist = pathCapacityDistribution(pathId)

  const completedLearners = Math.round(activeLearners * (completion / 100))
  const placedLearners = Math.round(completedLearners * (placement / 100))
  const avgRating = Math.round((mentors.reduce((s, m) => s + m.rating, 0) / mentors.length) * 100) / 100

  const trendData = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((month, i) => ({
    label: month,
    value: Math.max(1, Math.round(completion - 8 + i * 1.6 + (i % 2 === 0 ? 1 : -1))),
  }))

  const flags: { text: string; tone: 'green' | 'amber' | 'red' }[] = []
  const lowRated = mentors.filter(m => m.rating < 4.7).length
  if (lowRated > 0) flags.push({ text: `${lowRated} mentor${lowRated > 1 ? 's' : ''} below 4.70 rating`, tone: 'amber' })
  if (path.trend < 0) flags.push({ text: 'Enrollment growth trending down this month', tone: 'red' })
  if (capacity >= 90) flags.push({ text: 'Mentor capacity nearing saturation — consider onboarding more mentors', tone: 'amber' })
  if (placement < 65) flags.push({ text: 'Placement rate below platform target of 65%', tone: 'red' })
  if (flags.length === 0) flags.push({ text: 'All quality metrics within target range', tone: 'green' })

  const resources = [
    `${path.name} Fundamentals — Core Curriculum`,
    `${path.name} Capstone Project Guide`,
    'Weekly Mentor Office Hours',
    'Mock Interview & Portfolio Review Pack',
  ]

  const flagTone = { green: { color: theme.green, bg: theme.greenBg }, amber: { color: theme.amber, bg: theme.amberBg }, red: { color: theme.red, bg: theme.redBg } }

  return (
    <div style={{ padding: '36px 40px', maxWidth: 1180, margin: '0 auto' }}>
      <BackButton onClick={onBack} label="All Growth Categories" />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: theme.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={icons[path.icon as keyof typeof icons]} size={17} style={{ color: theme.gold }} />
            </div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 25, fontWeight: 600, color: theme.text, margin: 0 }}>
              {path.name}
            </h1>
          </div>
          <p style={{ fontSize: 13.5, color: theme.textMuted, margin: 0, maxWidth: 560, lineHeight: 1.5 }}>{path.description}</p>
        </div>
        <TrendBadge value={path.trend} />
      </div>

      {/* Executive Summary */}
      <p style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.6, margin: '0 0 28px', maxWidth: 820, background: theme.goldBg, padding: '14px 18px', borderRadius: 14 }}>
        <strong style={{ color: theme.text }}>Executive Summary — </strong>
        {path.name} currently serves {totalLearners.toLocaleString()} learners across {mentors.length} mentors, with a {completion}% completion rate
        and {placement}% job placement rate. Mentor capacity is running at {capacity}% utilization and enrollment is {path.trend >= 0 ? 'growing' : 'contracting'} {Math.abs(path.trend).toFixed(1)}% month over month.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatBlock label="Total Learners" value={totalLearners.toLocaleString()} icon={icons.users} />
        <StatBlock label="Active Learners" value={activeLearners.toLocaleString()} icon={icons.activity} />
        <StatBlock label="Total Mentors" value={mentors.length.toString()} icon={icons.mentors} />
        <StatBlock label="Completion Rate" value={`${completion}%`} valueColor={theme.green} icon={icons.check} />
        <StatBlock label="Placement Rate" value={`${placement}%`} valueColor={theme.green} icon={icons.award} />
        <StatBlock label="Capacity Utilization" value={`${capacity}%`} icon={icons.clock} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <SectionCard title="Learner Funnel" subtitle="Joined → active → completed → placed" icon={icons.paths}>
          <Funnel stages={[
            { label: 'Joined', value: totalLearners },
            { label: 'Active', value: activeLearners },
            { label: 'Completed', value: completedLearners },
            { label: 'Placed', value: placedLearners },
          ]} />
        </SectionCard>

        <SectionCard title="Capacity Distribution" subtitle="Mentor booking-load spread" icon={icons.barChart}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10.5, color: theme.textFaint, textTransform: 'uppercase' }}>Min</div>
              <div style={{ fontSize: 18, fontFamily: 'Playfair Display, serif', fontWeight: 600, color: theme.text, marginTop: 3 }}>{capacityDist.min}%</div>
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: theme.textFaint, textTransform: 'uppercase' }}>Avg</div>
              <div style={{ fontSize: 18, fontFamily: 'Playfair Display, serif', fontWeight: 600, color: theme.gold, marginTop: 3 }}>{capacityDist.avg}%</div>
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: theme.textFaint, textTransform: 'uppercase' }}>Max</div>
              <div style={{ fontSize: 18, fontFamily: 'Playfair Display, serif', fontWeight: 600, color: theme.text, marginTop: 3 }}>{capacityDist.max}%</div>
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
            Learner Satisfaction
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RatingStars rating={avgRating} />
            <span style={{ fontSize: 12, color: theme.textMuted }}>average mentor rating across {mentors.length} mentors</span>
          </div>
        </SectionCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
        <SectionCard title="Completion Trend" subtitle="Completion rate over the last 6 months" icon={icons.barChart}>
          <BarChart data={trendData} valueKey="value" labelKey="label" />
        </SectionCard>

        <SectionCard title="Quality Flags & Top Resources" icon={icons.alert}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {flags.map((f, i) => (
              <span key={i} style={{ fontSize: 12, fontWeight: 500, color: flagTone[f.tone].color, background: flagTone[f.tone].bg, padding: '7px 12px', borderRadius: 10 }}>
                {f.text}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
            Top Resources
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resources.map((r, i) => (
              <div key={i} style={{ fontSize: 12.5, color: theme.textSecondary, display: 'flex', gap: 8 }}>
                <Icon d={icons.check} size={13} style={{ color: theme.gold, flexShrink: 0, marginTop: 2 }} />
                {r}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, color: theme.text, margin: 0 }}>
          Mentor Leaderboard
        </h2>
        <span style={{ fontSize: 12, color: theme.textMuted }}>
          Weighted by rating, completion, success, placement, retention & response time
        </span>
      </div>

      <div style={{
        background: theme.white, border: `1px solid ${theme.border}`, borderRadius: 24,
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}>
        {mentors.map((m, i) => (
          <div key={m.id} style={{ borderBottom: i < mentors.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
            <MentorRow mentor={m} rank={i + 1} onSelect={() => onSelectMentor(m.id)} />
          </div>
        ))}
      </div>
    </div>
  )
}
