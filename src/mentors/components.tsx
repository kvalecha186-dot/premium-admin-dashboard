// ── Mentor Intelligence — Shared UI primitives ────────────────────────────────

import { Icon, icons } from '../shared'
import { theme } from './data'

export function TrendBadge({ value }: { value: number }) {
  const up = value >= 0
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 11,
      fontWeight: 600,
      color: up ? theme.green : theme.red,
      background: up ? theme.greenBg : theme.redBg,
      padding: '4px 9px',
      borderRadius: 99,
      whiteSpace: 'nowrap',
    }}>
      <Icon d={up ? icons.trendUp : icons.trendDown} size={11} />
      {up ? '+' : ''}{value.toFixed(1)}%
    </span>
  )
}

export function Tag({ children, tone = 'gold' }: { children: React.ReactNode; tone?: 'gold' | 'neutral' }) {
  return (
    <span style={{
      fontSize: 11.5,
      fontWeight: 500,
      color: tone === 'gold' ? theme.gold : theme.textSecondary,
      background: tone === 'gold' ? theme.goldBg : theme.bg,
      border: tone === 'neutral' ? `1px solid ${theme.border}` : 'none',
      padding: '4px 10px',
      borderRadius: 99,
    }}>
      {children}
    </span>
  )
}

export function ProgressBar({ value, color = theme.gold, track = theme.bg, height = 6 }: { value: number; color?: string; track?: string; height?: number }) {
  return (
    <div style={{ width: '100%', height, background: track, borderRadius: 99, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 300ms ease' }} />
    </div>
  )
}

export function StatBlock({ label, value, valueColor = theme.text, icon }: { label: string; value: string; valueColor?: string; icon?: string }) {
  return (
    <div style={{
      background: theme.white,
      border: `1px solid ${theme.border}`,
      borderRadius: 24,
      padding: '20px 22px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: theme.textFaint, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </span>
        {icon && (
          <div style={{ width: 26, height: 26, borderRadius: 8, background: theme.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={icon} size={13} style={{ color: theme.gold }} />
          </div>
        )}
      </div>
      <div style={{ fontSize: 26, fontFamily: 'Playfair Display, serif', fontWeight: 600, color: valueColor, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  )
}

export function SectionCard({ title, subtitle, icon, children, style = {} }: { title: string; subtitle?: string; icon?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: theme.white,
      border: `1px solid ${theme.border}`,
      borderRadius: 24,
      padding: 26,
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: subtitle ? 4 : 18 }}>
        {icon && (
          <div style={{ width: 28, height: 28, borderRadius: 8, background: theme.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon d={icon} size={14} style={{ color: theme.gold }} />
          </div>
        )}
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16.5, fontWeight: 600, color: theme.text }}>
          {title}
        </div>
      </div>
      {subtitle && <div style={{ fontSize: 12.5, color: theme.textMuted, marginBottom: 18, marginLeft: icon ? 38 : 0 }}>{subtitle}</div>}
      {children}
    </div>
  )
}

export function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: theme.textMuted,
        fontSize: 13,
        fontWeight: 500,
        padding: '6px 0',
        marginBottom: 14,
        fontFamily: 'Inter, sans-serif',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = theme.gold)}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = theme.textMuted)}
    >
      <Icon d={icons.arrowLeft} size={14} />
      {label}
    </button>
  )
}

export function StatusPill({ status }: { status: 'On Track' | 'Needs Attention' | 'Completed' }) {
  const map = {
    'On Track': { color: theme.gold, bg: theme.goldBg },
    'Needs Attention': { color: theme.amber, bg: theme.amberBg },
    'Completed': { color: theme.green, bg: theme.greenBg },
  } as const
  const s = map[status]
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  )
}

export function RatingStars({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: theme.text }}>
      <Icon d={icons.star} size={13} style={{ color: theme.gold }} />
      {rating.toFixed(2)}
    </span>
  )
}

export function BarChart({ data, valueKey = 'value', labelKey = 'label', color = theme.gold, bg = theme.goldBg }: {
  data: Record<string, any>[]; valueKey?: string; labelKey?: string; color?: string; bg?: string
}) {
  const max = Math.max(...data.map(d => d[valueKey])) * 1.2 || 1
  const barWidth = 56
  const gap = data.length > 1 ? (620 - barWidth * data.length) / (data.length - 1) : 0

  return (
    <div style={{ width: '100%' }}>
      <svg width="100%" height="180" viewBox="0 0 660 180" preserveAspectRatio="xMidYMid meet">
        <line x1="10" y1="150" x2="650" y2="150" stroke={theme.border} />
        {data.map((d, i) => {
          const h = (d[valueKey] / max) * 120
          const x = 10 + i * (barWidth + gap)
          const y = 150 - h
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={h} rx="8" fill={bg} stroke={color} strokeWidth="1.5" />
              <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="11" fontWeight="600" fill={theme.text} fontFamily="Inter, sans-serif">
                {d[valueKey]}
              </text>
              <text x={x + barWidth / 2} y="168" textAnchor="middle" fontSize="11" fill={theme.textFaint} fontFamily="Inter, sans-serif">
                {d[labelKey]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function Funnel({ stages }: { stages: { label: string; value: number }[] }) {
  const max = stages[0]?.value || 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {stages.map((s, i) => {
        const pct = Math.round((s.value / max) * 100)
        const dropoff = i > 0 ? Math.round(((stages[i - 1].value - s.value) / stages[i - 1].value) * 100) : null
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: theme.text }}>{s.label}</span>
              <span style={{ fontSize: 12.5, color: theme.textMuted }}>
                {s.value.toLocaleString()} {dropoff !== null && dropoff > 0 && (
                  <span style={{ color: theme.red, marginLeft: 6 }}>−{dropoff}%</span>
                )}
              </span>
            </div>
            <ProgressBar value={pct} height={10} />
          </div>
        )
      })}
    </div>
  )
}
