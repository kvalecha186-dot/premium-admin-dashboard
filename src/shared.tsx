// ── Shared UI primitives (Icon, icon set, Card, PageShell) ────────────────────
// Used across every page, including the Mentor Intelligence module.

export function Icon({ d, size = 16, className = '', style = {} }: { d: string; size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d={d} />
    </svg>
  )
}

export const icons = {
  overview: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  paths: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  mentors: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z",
  analytics: "M18 20V10M12 20V4M6 20v-6",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-5M15 17H9m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  clock: "M12 2a10 10 0 100 20A10 10 0 0012 2zM12 6v6l4 2",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
  alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  link: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  chevronRight: "M9 18l6-6-6-6",
  award: "M12 15l-2 5l2-1.5l2 1.5l-2-5M12 15a6 6 0 1 0 0-12a6 6 0 0 0 0 12z",
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  trendUp: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  trendDown: "M23 18l-9.5-9.5-5 5L1 6M17 18h6v-6",
  shieldCheck: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  graduationCap: "M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1 3 3 6 3s6-2 6-3v-5",
  target: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 6a6 6 0 100 12 6 6 0 000-12zM12 10a2 2 0 100 4 2 2 0 000-4z",
  dollar: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  briefcase: "M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM8 5h8v2H8z",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  barChart: "M12 20V10M18 20V4M6 20v-4",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  cloud: "M17.5 19a4.5 4.5 0 000-9 6 6 0 00-11.32-2A5 5 0 007 19h10.5z",
  server: "M3 3h18v6H3zM3 15h18v6H3zM7 6h.01M7 18h.01",
  code: "M16 18l6-6-6-6M8 6l-6 6 6 6",
  phone: "M17 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2zM12 18h.01",
  megaphone: "M3 11l18-6v14L3 15v-4zM11 17a3 3 0 11-6-1",
  bug: "M9 7V6a3 3 0 016 0v1M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 014-4h4a4 4 0 014 4v3c0 3.3-2.7 6-6 6zM3 13h3M18 13h3M4 8l3 2M20 8l-3 2M4 19l3-2M20 19l-3-2",
  sparkles: "M12 2l1.6 4.8L18 8l-4.4 1.7L12 14l-1.6-4.3L6 8l4.4-1.2L12 2zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z",
  plus: "M12 5v14M5 12h14",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  copy: "M20 9H11a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
  archive: "M21 8v13H3V8M1 3h22v5H1zM10 12h4",
  play: "M5 3l14 9-14 9V3z",
  tag: "M20.59 13.41L11 3.83 3.83 11l9.58 9.59a2 2 0 002.83 0l4.35-4.35a2 2 0 000-2.83zM7 7h.01",
  chevronDown: "M6 9l6 6 6-6",
}

export function Card({ children, style = {}, className = '', onClick }: { children: React.ReactNode; style?: React.CSSProperties; className?: string; onClick?: (e: React.MouseEvent<HTMLDivElement>) => void }) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: '#FFFFFF',
        border: '1px solid #ECE7DF',
        borderRadius: 14,
        padding: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 10px 24px rgba(0,0,0,0.06)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)'
      }}
    >
      {children}
    </div>
  )
}

export function PageShell({ title, subtitle, action, children }: { title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ padding: '36px 40px', maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 600, color: '#171717', margin: 0, lineHeight: 1.25 }}>
            {title}
          </h1>
          <p style={{ fontSize: 13.5, color: '#737373', margin: '6px 0 0', lineHeight: 1.5 }}>
            {subtitle}
          </p>
        </div>
        {action && <div style={{ flexShrink: 0, marginTop: 2 }}>{action}</div>}
      </div>
      {children}
    </div>
  )
}
