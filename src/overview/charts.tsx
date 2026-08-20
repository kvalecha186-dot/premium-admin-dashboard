// ── Lightweight SVG chart primitives for the Executive Overview ──────────────
// Hand-rolled to match the existing app's chart style (no charting library dependency).

import { useEffect, useId, useRef, useState } from 'react'

export const GOLD = '#C89B1F'
export const GOLD_BRIGHT = '#E8B923'
export const GOLD_LIGHT = '#F7F2E7'
export const INK = '#171717'
export const BORDER = '#ECE7DF'
export const MUTED = '#8E8E93'
export const SUBTLE = '#737373'
export const GREEN = '#166534'
export const GREEN_BG = '#F0FDF4'
export const AMBER = '#92400E'
export const AMBER_BG = '#FFFBEB'
export const RED = '#991B1B'
export const RED_BG = '#FEF2F2'
export const ORANGE = '#9A3412'
export const ORANGE_BG = '#FFF7ED'
export const PURPLE = '#5B21B6'
export const PURPLE_BG = '#F5F3FF'
export const BLUE = '#1E40AF'
export const BLUE_BG = '#EFF6FF'

export const donutPalette = ['#C89B1F', '#171717', '#8E8E93', '#166534', '#92400E', '#9A3412', '#5B21B6', '#ECE7DF']

// Category → brand color map used across the ecosystem-wide widgets
export const categoryColors: Record<string, string> = {
  'Career & Tech': '#C89B1F',
  'Health & Fitness': '#166534',
  'Mindset': '#5B21B6',
  'Personal Life': '#9A3412',
  'Student Life': '#1E40AF',
}

// Small inline sparkline used inside KPI cards
export function Sparkline({ data, color = GOLD, width = 108, height = 32 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  const areaPts = `0,${height} ${pts} ${width},${height}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polygon points={areaPts} fill={color} opacity={0.12} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Circular target-progress ring
export function ProgressRing({ percent, size = 34, color = GOLD }: { percent: number; size?: number; color?: string }) {
  const r = (size - 4) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(percent, 100) / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={BORDER} strokeWidth={3} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}

// Multi-series line/area chart for Platform Growth
export type MultiSeries = { label: string; values: number[] }[]
export function MultiLineChart({ labels, series, colors, width = 100, height = 220 }: { labels: string[]; series: MultiSeries; colors: string[]; width?: number; height?: number }) {
  const vw = 680
  const vh = height
  const padL = 44
  const padB = 26
  const padT = 14
  const allVals = series.flatMap(s => s.values)
  const max = Math.max(...allVals) * 1.12
  const n = labels.length
  const xFor = (i: number) => padL + (i / (n - 1)) * (vw - padL - 20)
  const yFor = (v: number) => vh - padB - (v / max) * (vh - padB - padT)

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="none">
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={padL} y1={vh - padB - f * (vh - padB - padT)} x2={vw - 10} y2={vh - padB - f * (vh - padB - padT)} stroke={BORDER} strokeDasharray="3 3" />
      ))}
      {series.map((s, si) => {
        const pts = s.values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ')
        return <polyline key={si} points={pts} fill="none" stroke={colors[si]} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      })}
      {series[0].values.map((_, i) => (
        <text key={i} x={xFor(i)} y={vh - 6} fontSize="9.5" fill={MUTED} textAnchor="middle" fontFamily="Inter, sans-serif">{labels[i]}</text>
      ))}
    </svg>
  )
}

// Donut chart for Growth Path Distribution
export function DonutChart({ segments, size = 190, thickness = 26 }: { segments: { label: string; value: number; color: string }[]; size?: number; thickness?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  const r = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={BORDER} strokeWidth={thickness} />
      {segments.map((seg, i) => {
        const frac = seg.value / total
        const dash = frac * c
        const offset = c - acc
        acc += dash
        return (
          <circle
            key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={thickness}
            strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="butt"
          />
        )
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="20" fontWeight={600} fill={INK} fontFamily="Playfair Display, serif">{total.toLocaleString()}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill={MUTED} fontFamily="Inter, sans-serif">Learners</text>
    </svg>
  )
}

// Horizontal utilization bar
export function UtilizationBar({ percent, highlight }: { percent: number; highlight?: boolean }) {
  const color = percent >= 90 ? RED : percent >= 80 ? GOLD : GREEN
  return (
    <div style={{ width: '100%', height: 8, background: '#F3EFE6', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
      <div style={{ width: `${Math.min(percent, 100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 300ms ease' }} />
    </div>
  )
}

// Vertical funnel/pipeline bar chart with conversion callouts
export function FunnelChart({ stages, colorFrom = INK, colorTo = GOLD }: { stages: { stage: string; value: number }[]; colorFrom?: string; colorTo?: string }) {
  const max = stages[0].value
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {stages.map((s, i) => {
        const widthPct = (s.value / max) * 100
        const prev = i > 0 ? stages[i - 1].value : s.value
        const conv = i === 0 ? 100 : Math.round((s.value / prev) * 1000) / 10
        const drop = 100 - conv
        const isBiggestDrop = i > 0 && drop === Math.max(...stages.slice(1).map((st, j) => 100 - Math.round((st.value / stages[j].value) * 1000) / 10))
        return (
          <div key={s.stage}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: INK }}>{s.stage}</span>
              <span style={{ fontSize: 11.5, color: MUTED }}>
                {s.value.toLocaleString()} {i > 0 && (
                  <span style={{ marginLeft: 8, fontWeight: 600, color: isBiggestDrop ? RED : SUBTLE }}>
                    {conv}% conv · {isBiggestDrop ? `−${drop.toFixed(1)}% biggest drop` : `−${drop.toFixed(1)}%`}
                  </span>
                )}
              </span>
            </div>
            <div style={{ width: '100%', height: 16, background: '#F3EFE6', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${widthPct}%`, height: '100%', borderRadius: 6,
                background: isBiggestDrop ? `linear-gradient(90deg, ${RED}, ${ORANGE})` : `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
                transition: 'width 400ms ease'
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
