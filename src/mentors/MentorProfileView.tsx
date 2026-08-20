// ── Mentor Intelligence — Full Mentor Profile Page ────────────────────────────

import { Icon, icons } from '../shared'
import { getMentor, getPath, theme } from './data'
import { BackButton, ProgressBar, RatingStars, SectionCard, StatBlock, StatusPill, Tag } from './components'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function AvailabilityCalendar({ days, hours }: { days: boolean[]; hours: string }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 12 }}>
        {DAY_LABELS.map((d, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: theme.textFaint, marginBottom: 5 }}>{d}</div>
            <div style={{
              height: 32, borderRadius: 9,
              background: days[i] ? theme.gold : theme.bg,
              border: `1px solid ${days[i] ? theme.gold : theme.border}`,
            }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: theme.textSecondary }}>
        <Icon d={icons.clock} size={13} style={{ color: theme.gold }} />
        {hours}
      </div>
    </div>
  )
}

function SessionAnalyticsChart({ data }: { data: { month: string; sessions: number }[] }) {
  const max = Math.max(...data.map(d => d.sessions)) * 1.2
  const barWidth = 56
  const gap = (620 - barWidth * data.length) / (data.length - 1)

  return (
    <div style={{ width: '100%' }}>
      <svg width="100%" height="180" viewBox="0 0 660 180" preserveAspectRatio="xMidYMid meet">
        <line x1="10" y1="150" x2="650" y2="150" stroke={theme.border} />
        {data.map((d, i) => {
          const h = (d.sessions / max) * 120
          const x = 10 + i * (barWidth + gap)
          const y = 150 - h
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={h} rx="8" fill={theme.goldBg} stroke={theme.gold} strokeWidth="1.5" />
              <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="11" fontWeight="600" fill={theme.text} fontFamily="Inter, sans-serif">
                {d.sessions}
              </text>
              <text x={x + barWidth / 2} y="168" textAnchor="middle" fontSize="11" fill={theme.textFaint} fontFamily="Inter, sans-serif">
                {d.month}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default function MentorProfileView({ mentorId, onBack }: { mentorId: string; onBack: () => void }) {
  const mentor = getMentor(mentorId)
  if (!mentor) return null
  const path = getPath(mentor.pathId)

  return (
    <div style={{ padding: '36px 40px', maxWidth: 1180, margin: '0 auto' }}>
      <BackButton onClick={onBack} label={path ? `${path.name} Mentors` : 'Back'} />

      {/* Hero */}
      <div style={{
        background: theme.white, border: `1px solid ${theme.border}`, borderRadius: 28,
        padding: 32, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img src={mentor.avatar} alt={mentor.name} style={{ width: 92, height: 92, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${theme.goldBg}` }} />
            {mentor.verified && (
              <div style={{
                position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%',
                background: theme.gold, border: `2.5px solid ${theme.white}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon d={icons.shieldCheck} size={13} style={{ color: theme.white }} />
              </div>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 25, fontWeight: 600, color: theme.text, margin: 0 }}>
                {mentor.name}
              </h1>
              {mentor.verified && (
                <span style={{ fontSize: 10.5, fontWeight: 600, color: theme.gold, background: theme.goldBg, padding: '3px 9px', borderRadius: 6 }}>
                  Verified Mentor
                </span>
              )}
            </div>
            <div style={{ fontSize: 13.5, color: theme.textMuted, marginTop: 4 }}>{mentor.title} · {mentor.company}</div>

            <div style={{ display: 'flex', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
              {mentor.expertise.map((e, i) => <Tag key={i}>{e}</Tag>)}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14, flexWrap: 'wrap' }}>
              <RatingStars rating={mentor.rating} />
              <span style={{ fontSize: 12.5, color: theme.textMuted }}>{mentor.experienceYears} yrs experience</span>
              <span style={{ fontSize: 12.5, color: theme.textMuted }}>{mentor.languages.join(', ')}</span>
              {path && <span style={{ fontSize: 12.5, color: theme.gold, fontWeight: 500 }}>{path.name}</span>}
            </div>

            <p style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.6, margin: '14px 0 0', maxWidth: 540 }}>
              {mentor.bio}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 7, background: theme.white, border: `1px solid ${theme.border}`,
            color: theme.text, borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>
            <Icon d={icons.mail} size={14} />
            Message
          </button>
          <button style={{
            background: theme.text, color: theme.white, border: 'none', borderRadius: 10,
            padding: '10px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatBlock label="Total Sessions" value={mentor.sessions.toString()} icon={icons.calendar} />
        <StatBlock label="Active Learners" value={mentor.activeClients.toString()} icon={icons.users} />
        <StatBlock label="Available Slots" value={mentor.availableSlots.toString()} icon={icons.clock} />
        <StatBlock label="Success Rate" value={`${mentor.successRate}%`} valueColor={theme.green} icon={icons.check} />
        <StatBlock label="Placement Success" value={`${mentor.placementRate}%`} valueColor={theme.green} icon={icons.award} />
        <StatBlock label="Response Time" value={mentor.responseTimeMinutes < 60 ? `${mentor.responseTimeMinutes} mins` : `${Math.round(mentor.responseTimeMinutes / 60)} hrs`} icon={icons.mail} />
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionCard title="Qualifications" icon={icons.graduationCap}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: mentor.certifications.length ? 16 : 0 }}>
              {mentor.qualifications.map((q, i) => (
                <div key={i} style={{ fontSize: 12.5, color: theme.textSecondary, display: 'flex', gap: 8 }}>
                  <Icon d={icons.check} size={13} style={{ color: theme.gold, flexShrink: 0, marginTop: 2 }} />
                  {q}
                </div>
              ))}
            </div>
            {mentor.certifications.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                  Certifications
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {mentor.certifications.map((c, i) => (
                    <div key={i} style={{ fontSize: 12.5, color: theme.textSecondary, display: 'flex', gap: 8 }}>
                      <Icon d={icons.award} size={13} style={{ color: theme.gold, flexShrink: 0, marginTop: 2 }} />
                      {c}
                    </div>
                  ))}
                </div>
              </>
            )}
          </SectionCard>

          <SectionCard title="Skills" icon={icons.target}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {mentor.skills.map((s, i) => <Tag key={i} tone="neutral">{s}</Tag>)}
            </div>
          </SectionCard>

          <SectionCard title="Career History" icon={icons.briefcase}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {mentor.careerHistory.map((c, i) => (
                <div key={i} style={{ paddingBottom: i < mentor.careerHistory.length - 1 ? 14 : 0, borderBottom: i < mentor.careerHistory.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{c.role}</div>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{c.org}</div>
                  <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 2 }}>{c.period}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Availability" subtitle="Weekly booking window" icon={icons.calendar}>
            <AvailabilityCalendar days={mentor.availableDays} hours={mentor.availableHours} />
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: theme.textMuted }}>Booking Load</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>
                  {Math.round((mentor.activeClients / (mentor.activeClients + mentor.availableSlots)) * 100)}%
                </span>
              </div>
              <ProgressBar value={(mentor.activeClients / (mentor.activeClients + mentor.availableSlots)) * 100} />
            </div>
          </SectionCard>

          <SectionCard title="Earnings" icon={icons.dollar}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Total Earnings</div>
                <div style={{ fontSize: 22, fontFamily: 'Playfair Display, serif', fontWeight: 600, color: theme.gold, marginTop: 4 }}>
                  ${mentor.earningsTotal.toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${theme.border}` }}>
                <span style={{ fontSize: 12.5, color: theme.textMuted }}>This Month</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>${mentor.earningsMonth.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, color: theme.textMuted }}>Avg. per Session</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>
                  ${Math.round(mentor.earningsTotal / mentor.sessions)}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionCard title="Session Analytics" subtitle="Sessions delivered over the last 6 months" icon={icons.barChart}>
            <SessionAnalyticsChart data={mentor.sessionAnalytics} />
          </SectionCard>

          <SectionCard title={`Active Clients (${mentor.clients.length})`} icon={icons.users}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {mentor.clients.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
                  borderBottom: i < mentor.clients.length - 1 ? `1px solid ${theme.border}` : 'none',
                }}>
                  <img src={c.avatar} alt={c.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{c.name}</div>
                    <div style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 1 }}>{c.path}</div>
                  </div>
                  <div style={{ width: 110 }}>
                    <ProgressBar value={c.progress} height={5} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, minWidth: 32, textAlign: 'right' }}>
                    {c.progress}%
                  </div>
                  <StatusPill status={c.status} />
                </div>
              ))}
              {mentor.activeClients > mentor.clients.length && (
                <div style={{ fontSize: 12, color: theme.textMuted, paddingTop: 12, textAlign: 'center' }}>
                  +{mentor.activeClients - mentor.clients.length} more active clients
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Recent Reviews" icon={icons.star}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {mentor.reviews.map((r, i) => (
                <div key={i} style={{ paddingBottom: i < mentor.reviews.length - 1 ? 14 : 0, borderBottom: i < mentor.reviews.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: theme.text }}>{r.learnerName}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <RatingStars rating={r.rating} />
                      <span style={{ fontSize: 11, color: theme.textFaint }}>{r.date}</span>
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: theme.textMuted, lineHeight: 1.5 }}>{r.text}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <SectionCard title="Recent Session Notes" icon={icons.check}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {mentor.sessionNotes.map((n, i) => (
                  <div key={i} style={{ paddingBottom: i < mentor.sessionNotes.length - 1 ? 14 : 0, borderBottom: i < mentor.sessionNotes.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: theme.text }}>{n.title}</span>
                      <span style={{ fontSize: 11, color: theme.textFaint }}>{n.date}</span>
                    </div>
                    <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.5 }}>{n.note}</div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Recent Activity" icon={icons.activity}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {mentor.activity.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12.5, lineHeight: 1.4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.gold, marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1, color: theme.textSecondary }}>
                      {a.text}
                      <div style={{ fontSize: 10.5, color: theme.textFaint, marginTop: 2 }}>{a.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  )
}
