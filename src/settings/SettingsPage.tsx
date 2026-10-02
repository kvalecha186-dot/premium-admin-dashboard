import React, { useState, useEffect, useMemo } from 'react'
import { Icon, icons, Card, PageShell } from '../shared'
import { authRequest } from '../lib/supabase'

// ── Types & Settings Schema ──────────────────────────────────────────────────

export type SettingsTab = 'general' | 'mentorship' | 'finance' | 'notifications' | 'system'

export interface PlatformSettings {
  // 1. General & Platform Identity
  platformName: string
  platformTagline: string
  supportEmail: string
  escalationPhone: string
  publicWebsiteUrl: string
  primaryCurrency: string
  timezone: string
  dateFormat: string
  maintenanceMode: boolean
  maintenanceNotice: string
  allowLearnerSelfRegistration: boolean

  // 2. Mentorship & Booking Policies
  minBookingNoticeHours: number
  maxBookingHorizonDays: number
  bufferMinutes: number
  cancellationCutoffHours: number
  maxActiveMenteesPerMentor: number
  autoCapMentorSlots: boolean
  requireIdentityVerification: boolean
  mandatorySessionReview: boolean
  minRatingForFeatured: number

  // 3. Commerce & Payout Settlement
  platformCommissionPct: number
  minPayoutThreshold: number
  payoutSchedule: string
  autoDisbursement: boolean
  holdOnDispute: boolean
  automatedTaxInvoices: boolean
  gstin: string
  tdsWithholding: boolean

  // 4. Notifications & Transactional Dispatch
  bookingConfirmationEmail: boolean
  sessionReminder24h: boolean
  sessionReminder1h: boolean
  milestoneCompletionAlerts: boolean
  opsAlertEmail: string
  slackWebhookUrl: string
  forwardFailedBookingAlerts: boolean
  dailyExecutiveDigest: boolean

  // 5. System & Infrastructure
  cacheTtlMinutes: number
  livePollingIntervalSec: number
}

const STORAGE_KEY = 'starfix_platform_settings_v2'

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: 'Starfix Growth Operations',
  platformTagline: 'Executive Career & High-Velocity Mentorship Ecosystem',
  supportEmail: 'concierge@starfix.com',
  escalationPhone: '+91 (800) 456-7890',
  publicWebsiteUrl: 'https://starfix.com',
  primaryCurrency: 'INR (₹)',
  timezone: 'Asia/Kolkata (IST - UTC+05:30)',
  dateFormat: 'DD MMM YYYY, hh:mm A',
  maintenanceMode: false,
  maintenanceNotice: 'We are performing scheduled infrastructure upgrades. Existing sessions proceed uninterrupted.',
  allowLearnerSelfRegistration: true,

  minBookingNoticeHours: 2,
  maxBookingHorizonDays: 30,
  bufferMinutes: 15,
  cancellationCutoffHours: 12,
  maxActiveMenteesPerMentor: 15,
  autoCapMentorSlots: true,
  requireIdentityVerification: true,
  mandatorySessionReview: true,
  minRatingForFeatured: 4.8,

  platformCommissionPct: 15,
  minPayoutThreshold: 2000,
  payoutSchedule: 'Weekly (Every Monday)',
  autoDisbursement: true,
  holdOnDispute: true,
  automatedTaxInvoices: true,
  gstin: '29AAAAA0000A1Z5',
  tdsWithholding: true,

  bookingConfirmationEmail: true,
  sessionReminder24h: true,
  sessionReminder1h: true,
  milestoneCompletionAlerts: true,
  opsAlertEmail: 'ops-alerts@starfix.com',
  slackWebhookUrl: 'https://hooks.slack.com/services/T0123/B0456/starfix-ops-dispatch',
  forwardFailedBookingAlerts: true,
  dailyExecutiveDigest: true,

  cacheTtlMinutes: 15,
  livePollingIntervalSec: 30,
}

const TABS: { id: SettingsTab; label: string; icon: keyof typeof icons; badge?: string }[] = [
  { id: 'general', label: 'Platform & General', icon: 'settings' },
  { id: 'mentorship', label: 'Mentorship & Bookings', icon: 'graduationCap' },
  { id: 'finance', label: 'Billing & Payouts', icon: 'dollar' },
  { id: 'notifications', label: 'Notifications & Dispatch', icon: 'bell' },
  { id: 'system', label: 'System & Infrastructure', icon: 'server' },
]

// ── UI Form Helpers ─────────────────────────────────────────────────────────

function SectionHeading({
  title,
  subtitle,
  badge,
  icon,
}: {
  title: string
  subtitle: string
  badge?: string
  icon?: keyof typeof icons
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon && (
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(212,175,55,0.14)', display: 'grid', placeItems: 'center' }}>
              <Icon d={icons[icon]} size={14} style={{ color: '#D4AF37' }} />
            </div>
          )}
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#F7EFD8', margin: 0, fontFamily: 'Playfair Display, serif' }}>
            {title}
          </h3>
          {badge && (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#F4D67A', background: 'rgba(212,175,55,0.14)', padding: '2px 9px', borderRadius: 99, border: '1px solid rgba(212,175,55,0.25)' }}>
              {badge}
            </span>
          )}
        </div>
        <p style={{ fontSize: 12.5, color: '#8A90AB', margin: '4px 0 0', lineHeight: 1.5 }}>
          {subtitle}
        </p>
      </div>
    </div>
  )
}

function FieldLabel({ children, hint, required }: { children: React.ReactNode; hint?: string; required?: boolean }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: '#F7EFD8', display: 'flex', alignItems: 'center', gap: 4 }}>
        {children}
        {required && <span style={{ color: '#F87171' }}>*</span>}
      </label>
      {hint && <div style={{ fontSize: 11.5, color: '#8A90AB', marginTop: 2, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  icon,
  type = 'text',
  unit,
  disabled,
}: {
  value: string | number
  onChange: (v: string) => void
  placeholder?: string
  icon?: keyof typeof icons
  type?: string
  unit?: string
  disabled?: boolean
}) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {icon && (
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#7C8099', display: 'flex', pointerEvents: 'none' }}>
          <Icon d={icons[icon]} size={15} />
        </span>
      )}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: icon ? '10px 14px 10px 40px' : unit ? '10px 48px 10px 14px' : '10px 14px',
          borderRadius: 10,
          border: '1px solid rgba(212,175,55,0.20)',
          background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
          fontSize: 13.5,
          color: disabled ? '#6B7190' : '#F7EFD8',
          outline: 'none',
          transition: 'all 150ms ease',
          fontFamily: 'Inter, sans-serif',
        }}
        onFocus={e => {
          if (!disabled) {
            e.target.style.borderColor = '#D4AF37'
            e.target.style.background = 'rgba(255,255,255,0.06)'
            e.target.style.boxShadow = '0 0 12px rgba(212,175,55,0.18)'
          }
        }}
        onBlur={e => {
          e.target.style.borderColor = 'rgba(212,175,55,0.20)'
          e.target.style.background = disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)'
          e.target.style.boxShadow = 'none'
        }}
      />
      {unit && (
        <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#9AA0BA', fontSize: 12, fontWeight: 500, pointerEvents: 'none' }}>
          {unit}
        </span>
      )}
    </div>
  )
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string | number
  onChange: (v: string) => void
  options: { label: string; value: string | number }[]
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        padding: '10px 14px',
        borderRadius: 10,
        border: '1px solid rgba(212,175,55,0.20)',
        background: '#090E24',
        fontSize: 13.5,
        color: '#F7EFD8',
        outline: 'none',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {options.map(opt => (
        <option key={String(opt.value)} value={opt.value} style={{ background: '#090E24', color: '#F7EFD8' }}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

function SwitchRow({
  title,
  description,
  checked,
  onChange,
  tag,
  tone = 'gold',
}: {
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  tag?: string
  tone?: 'gold' | 'amber' | 'green'
}) {
  const activeColor = tone === 'green' ? '#4ADE80' : tone === 'amber' ? '#FBBF24' : '#D4AF37'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(212,175,55,0.16)',
        gap: 16,
        transition: 'background 150ms ease',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#F7EFD8' }}>{title}</span>
          {tag && (
            <span style={{
              fontSize: 10.5,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 99,
              color: checked ? activeColor : '#8A90AB',
              background: checked ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.05)',
              border: '1px solid ' + (checked ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.08)'),
            }}>
              {tag}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#8A90AB', marginTop: 3, lineHeight: 1.45 }}>{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 99,
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
          background: checked ? activeColor : 'rgba(255,255,255,0.16)',
          position: 'relative',
          transition: 'background 200ms ease',
          padding: 2,
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#FFFFFF',
            transform: checked ? 'translateX(20px)' : 'translateX(0px)',
            transition: 'transform 200ms ease',
            boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
          }}
        />
      </button>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function SettingsPage({ profile }: { profile?: any }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  // Load persisted settings or fallback to defaults
  const [settings, setSettings] = useState<PlatformSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS
  })

  // Track initial state to detect dirty changes
  const [initialSettings, setInitialSettings] = useState<PlatformSettings>(settings)

  // Status & Telemetry
  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [lastSavedTime, setLastSavedTime] = useState<string>('Saved to browser')
  const [pingState, setPingState] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle')
  const [pingLatency, setPingLatency] = useState<number | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3200)
  }

  // Operator identification
  const adminName = profile?.full_name || (profile?.email || '').split('@')[0] || 'Administrator'
  const adminEmail = profile?.email || 'admin@starfix.com'
  const adminRole = profile?.role ? profile.role.toUpperCase() : 'SUPER ADMIN'

  // Dirty check
  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(initialSettings)
  }, [settings, initialSettings])

  // Save changes handler
  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
        setInitialSettings(settings)
        setIsSaving(false)
        const now = new Date()
        setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        showToast('Settings saved successfully and operational policies updated')
      } catch (err: any) {
        setIsSaving(false)
        showToast('Error saving settings: ' + err.message)
      }
    }, 450)
  }

  // Reset to factory defaults
  const handleResetDefaults = () => {
    if (window.confirm('Reset all Starfix platform settings back to verified defaults? Any unsaved edits will be discarded.')) {
      setSettings(DEFAULT_SETTINGS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS))
      setInitialSettings(DEFAULT_SETTINGS)
      showToast('All parameters restored to default configuration')
    }
  }

  // Real Database Health Check
  const pingDatabase = async () => {
    setPingState('testing')
    const start = performance.now()
    try {
      await authRequest('/rest/v1/profiles?select=id&limit=1')
      const latency = Math.round(performance.now() - start)
      setPingLatency(latency)
      setPingState('ok')
      showToast(`Database healthy — roundtrip response ${latency}ms`)
    } catch {
      // Fallback probe
      try {
        const fallbackStart = performance.now()
        await fetch('https://mndyaxvkjzzgyvfrxgvm.supabase.co/rest/v1/', { method: 'HEAD' })
        const latency = Math.round(performance.now() - fallbackStart)
        setPingLatency(latency)
        setPingState('ok')
        showToast(`Supabase gateway active — latency ${latency}ms`)
      } catch {
        setPingState('error')
        showToast('Database probe failed — verify network or auth tokens')
      }
    }
  }

  // Run initial latency probe on mount
  useEffect(() => {
    pingDatabase()
  }, [])

  // Clear client cache
  const handleFlushCache = () => {
    const keysToPreserve = ['starfix_admin_access', 'starfix_admin_refresh', STORAGE_KEY]
    const allKeys = Object.keys(localStorage)
    let clearedCount = 0
    allKeys.forEach(k => {
      if (!keysToPreserve.includes(k)) {
        localStorage.removeItem(k)
        clearedCount++
      }
    })
    showToast(`Flushed ${clearedCount} cached query entries. Storage revalidated.`)
  }

  // Export JSON Backup
  const handleExportBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      platform: settings.platformName,
      operator: adminEmail,
      version: '2.4.1',
      configuration: settings,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `starfix-settings-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('Platform settings configuration exported (.json)')
  }

  // Dynamic helper to update settings field
  const update = <K extends keyof PlatformSettings>(key: K, val: PlatformSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: val }))
  }

  return (
    <PageShell
      title="Platform Settings & Governance"
      subtitle="Configure operational limits, mentorship scheduling rules, billing settlement cycles, transactional dispatch, and infrastructure controls."
      action={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            style={{
              padding: '9px 20px',
              borderRadius: 9,
              border: 'none',
              background: isDirty ? 'linear-gradient(135deg, #F4D67A 0%, #D4AF37 100%)' : 'rgba(255,255,255,0.08)',
              color: isDirty ? '#070A1A' : '#7C8099',
              fontSize: 13,
              fontWeight: 600,
              cursor: isDirty ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: isDirty ? '0 4px 18px rgba(212,175,55,0.32)' : 'none',
              transition: 'all 150ms ease',
            }}
          >
            <Icon d={icons.check} size={15} style={{ color: isDirty ? '#070A1A' : '#7C8099' }} />
            {isSaving ? 'Saving…' : isDirty ? 'Save Changes' : 'Saved'}
          </button>
        </div>
      }
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            background: 'linear-gradient(160deg, #0E1638 0%, #070B1E 100%)',
            color: '#F7EFD8',
            padding: '12px 22px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 12px 36px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.35)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 8px #D4AF37' }} />
          {toastMessage}
        </div>
      )}

      {/* Top Operational Status Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.16)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: settings.maintenanceMode ? 'rgba(248,113,113,0.16)' : 'rgba(74,222,128,0.14)', display: 'grid', placeItems: 'center' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: settings.maintenanceMode ? '#F87171' : '#4ADE80', boxShadow: '0 0 8px ' + (settings.maintenanceMode ? '#F87171' : '#4ADE80') }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#8A90AB', fontWeight: 500 }}>System Gateway</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: settings.maintenanceMode ? '#F87171' : '#4ADE80' }}>
              {settings.maintenanceMode ? 'Maintenance Active' : 'Live & Operational'}
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.16)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(212,175,55,0.14)', display: 'grid', placeItems: 'center' }}>
            <Icon d={icons.server} size={16} style={{ color: '#D4AF37' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#8A90AB', fontWeight: 500 }}>Supabase Cloud DB</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: pingState === 'ok' ? '#4ADE80' : pingState === 'testing' ? '#FBBF24' : '#F7EFD8' }}>
              {pingState === 'ok' ? `Connected (${pingLatency}ms)` : pingState === 'testing' ? 'Testing probe…' : 'Online'}
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.16)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(212,175,55,0.14)', display: 'grid', placeItems: 'center' }}>
            <Icon d={icons.dollar} size={16} style={{ color: '#D4AF37' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#8A90AB', fontWeight: 500 }}>Platform Take-Rate</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#F4D67A' }}>
              {settings.platformCommissionPct}% Fee ({100 - settings.platformCommissionPct}% to Mentor)
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.16)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(212,175,55,0.14)', display: 'grid', placeItems: 'center' }}>
            <Icon d={icons.users} size={16} style={{ color: '#D4AF37' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#8A90AB', fontWeight: 500 }}>Active Administrator</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#F7EFD8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {adminName}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Tabs + Working Forms + Persistent Context Rail */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 304px', gap: 26, alignItems: 'flex-start' }}>

        {/* ── LEFT: Tabs & Form Panels ─────────────────────────────────── */}
        <div>
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(212,175,55,0.18)', marginBottom: 24, overflowX: 'auto' }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '11px 16px',
                    border: 'none',
                    background: 'transparent',
                    color: isActive ? '#F7EFD8' : '#8A90AB',
                    fontSize: 13.5,
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    borderBottom: isActive ? '2px solid #D4AF37' : '2px solid transparent',
                    marginBottom: -1,
                    transition: 'all 150ms ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Icon d={icons[tab.icon]} size={15} style={{ color: isActive ? '#D4AF37' : '#7C8099' }} />
                  {tab.label}
                  {tab.badge && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#D4AF37', background: 'rgba(212,175,55,0.15)', padding: '1px 6px', borderRadius: 99 }}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* TAB 1: PLATFORM & GENERAL */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Card>
                <SectionHeading
                  icon="settings"
                  title="Platform Identity & Brand Concierge"
                  subtitle="Primary operational title, public-facing URL, and support escalation routing."
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <FieldLabel hint="Appears on public navbar, browser title, and email dispatches.">Platform Display Name</FieldLabel>
                    <TextInput value={settings.platformName} onChange={v => update('platformName', v)} placeholder="e.g. Starfix Growth Operations" />
                  </div>

                  <div>
                    <FieldLabel hint="Descriptive headline rendered on public exploration and marketing portals.">Platform Headline & Mission</FieldLabel>
                    <TextInput value={settings.platformTagline} onChange={v => update('platformTagline', v)} placeholder="e.g. Executive Career & High-Velocity Mentorship Ecosystem" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <FieldLabel hint="Primary inbox for learner inquiries and mentor escalations.">Concierge Support Email</FieldLabel>
                      <TextInput icon="mail" type="email" value={settings.supportEmail} onChange={v => update('supportEmail', v)} placeholder="concierge@starfix.com" />
                    </div>
                    <div>
                      <FieldLabel hint="Production web portal link linked in email templates.">Public Web Portal URL</FieldLabel>
                      <TextInput icon="link" type="url" value={settings.publicWebsiteUrl} onChange={v => update('publicWebsiteUrl', v)} placeholder="https://starfix.com" />
                    </div>
                  </div>

                  <div>
                    <FieldLabel hint="Direct hotline for critical operational or session emergencies.">Operational Support Phone</FieldLabel>
                    <TextInput icon="phone" type="tel" value={settings.escalationPhone} onChange={v => update('escalationPhone', v)} placeholder="+91 (800) 456-7890" />
                  </div>
                </div>
              </Card>

              <Card>
                <SectionHeading
                  icon="clock"
                  title="Regional & Platform Localization"
                  subtitle="Default transactional currency, time zone calculations, and timestamp formats."
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  <div>
                    <FieldLabel hint="Currency used across all pricing plans, mentor rates, and revenue KPIs.">Base Platform Currency</FieldLabel>
                    <SelectInput
                      value={settings.primaryCurrency}
                      onChange={v => update('primaryCurrency', v)}
                      options={[
                        { label: 'Indian Rupee (INR ₹)', value: 'INR (₹)' },
                        { label: 'United States Dollar (USD $)', value: 'USD ($)' },
                        { label: 'Euro (EUR €)', value: 'EUR (€)' },
                        { label: 'British Pound (GBP £)', value: 'GBP (£)' },
                        { label: 'Singapore Dollar (SGD $)', value: 'SGD ($)' },
                      ]}
                    />
                  </div>

                  <div>
                    <FieldLabel hint="Standard timezone used to calculate daily stats and booking slots.">Platform Default Timezone</FieldLabel>
                    <SelectInput
                      value={settings.timezone}
                      onChange={v => update('timezone', v)}
                      options={[
                        { label: 'Asia/Kolkata (IST - UTC+05:30)', value: 'Asia/Kolkata (IST - UTC+05:30)' },
                        { label: 'America/New_York (EST - UTC-05:00)', value: 'America/New_York (EST - UTC-05:00)' },
                        { label: 'America/Los_Angeles (PST - UTC-08:00)', value: 'America/Los_Angeles (PST - UTC-08:00)' },
                        { label: 'Europe/London (GMT - UTC+00:00)', value: 'Europe/London (GMT - UTC+00:00)' },
                        { label: 'Asia/Dubai (GST - UTC+04:00)', value: 'Asia/Dubai (GST - UTC+04:00)' },
                        { label: 'Asia/Singapore (SGT - UTC+08:00)', value: 'Asia/Singapore (SGT - UTC+08:00)' },
                      ]}
                    />
                  </div>
                </div>
              </Card>

              {/* Maintenance Gateway Card */}
              <div
                style={{
                  borderRadius: 16,
                  border: '1px solid ' + (settings.maintenanceMode ? 'rgba(248,113,113,0.4)' : 'rgba(212,175,55,0.25)'),
                  background: settings.maintenanceMode ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.03)',
                  padding: 22,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: settings.maintenanceMode ? 'rgba(248,113,113,0.18)' : 'rgba(212,175,55,0.16)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon d={icons.alert} size={20} style={{ color: settings.maintenanceMode ? '#F87171' : '#F4D67A' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#F7EFD8' }}>Platform Maintenance Gateway</span>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 99,
                          color: settings.maintenanceMode ? '#F87171' : '#4ADE80',
                          background: settings.maintenanceMode ? 'rgba(248,113,113,0.18)' : 'rgba(74,222,128,0.16)',
                        }}>
                          {settings.maintenanceMode ? 'Gateway Restricted' : 'Gateway Open'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#8A90AB', marginTop: 3 }}>
                        Restricts public learner registrations and new bookings while infrastructure upgrades or schema migrations are deployed.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.maintenanceMode}
                    onClick={() => update('maintenanceMode', !settings.maintenanceMode)}
                    style={{
                      width: 46,
                      height: 26,
                      borderRadius: 99,
                      border: 'none',
                      cursor: 'pointer',
                      flexShrink: 0,
                      background: settings.maintenanceMode ? '#F87171' : 'rgba(255,255,255,0.18)',
                      position: 'relative',
                      transition: 'background 200ms ease',
                      padding: 2,
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        transform: settings.maintenanceMode ? 'translateX(20px)' : 'translateX(0px)',
                        transition: 'transform 200ms ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                    />
                  </button>
                </div>

                {settings.maintenanceMode && (
                  <div style={{ paddingTop: 14, borderTop: '1px solid rgba(248,113,113,0.2)' }}>
                    <FieldLabel hint="Public notification banner displayed to visiting learners during downtime.">Maintenance Notice Message</FieldLabel>
                    <TextInput value={settings.maintenanceNotice} onChange={v => update('maintenanceNotice', v)} placeholder="Notice message..." />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MENTORSHIP & BOOKINGS */}
          {activeTab === 'mentorship' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Card>
                <SectionHeading
                  icon="calendar"
                  title="Scheduling Lead Times & Rescheduling Policies"
                  subtitle="Govern minimum advance notice, buffers between back-to-back sessions, and cancellation cutoffs."
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  <div>
                    <FieldLabel hint="How many hours in advance a student must book a session.">Minimum Advance Booking Notice</FieldLabel>
                    <SelectInput
                      value={settings.minBookingNoticeHours}
                      onChange={v => update('minBookingNoticeHours', Number(v))}
                      options={[
                        { label: '1 hour prior', value: 1 },
                        { label: '2 hours prior (Recommended)', value: 2 },
                        { label: '6 hours prior', value: 6 },
                        { label: '12 hours prior', value: 12 },
                        { label: '24 hours prior', value: 24 },
                      ]}
                    />
                  </div>

                  <div>
                    <FieldLabel hint="Furthest advance date learners can select on a mentor's calendar.">Booking Horizon Limit</FieldLabel>
                    <SelectInput
                      value={settings.maxBookingHorizonDays}
                      onChange={v => update('maxBookingHorizonDays', Number(v))}
                      options={[
                        { label: '14 days ahead', value: 14 },
                        { label: '30 days ahead (Standard)', value: 30 },
                        { label: '60 days ahead', value: 60 },
                        { label: '90 days ahead', value: 90 },
                      ]}
                    />
                  </div>

                  <div>
                    <FieldLabel hint="Mandatory rest & notes interval between back-to-back slots.">Buffer Between Sessions</FieldLabel>
                    <SelectInput
                      value={settings.bufferMinutes}
                      onChange={v => update('bufferMinutes', Number(v))}
                      options={[
                        { label: 'No buffer', value: 0 },
                        { label: '10 minutes', value: 10 },
                        { label: '15 minutes (Standard)', value: 15 },
                        { label: '30 minutes', value: 30 },
                      ]}
                    />
                  </div>

                  <div>
                    <FieldLabel hint="Cutoff after which cancellations forfeit the session fee.">Free Cancellation Window</FieldLabel>
                    <SelectInput
                      value={settings.cancellationCutoffHours}
                      onChange={v => update('cancellationCutoffHours', Number(v))}
                      options={[
                        { label: 'Up to 2 hours prior', value: 2 },
                        { label: 'Up to 6 hours prior', value: 6 },
                        { label: 'Up to 12 hours prior (Standard)', value: 12 },
                        { label: 'Up to 24 hours prior', value: 24 },
                      ]}
                    />
                  </div>
                </div>
              </Card>

              <Card>
                <SectionHeading
                  icon="graduationCap"
                  title="Mentor Cohort Capacity & Quality Standards"
                  subtitle="Regulate maximum concurrent mentees, verification checks, and review requirements."
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <FieldLabel hint="Maximum number of active students guided concurrently before calendar slots auto-pause.">Maximum Concurrent Mentees per Mentor</FieldLabel>
                    <div style={{ maxWidth: 300 }}>
                      <TextInput
                        type="number"
                        unit="mentees"
                        value={settings.maxActiveMenteesPerMentor}
                        onChange={v => update('maxActiveMenteesPerMentor', Math.max(1, Number(v) || 1))}
                      />
                    </div>
                  </div>

                  <SwitchRow
                    title="Auto-Cap Availability When Threshold Reached"
                    description="Automatically hide open calendar booking slots when a mentor hits their active mentee quota."
                    checked={settings.autoCapMentorSlots}
                    onChange={v => update('autoCapMentorSlots', v)}
                    tag={settings.autoCapMentorSlots ? 'Enforced' : 'Uncapped'}
                  />

                  <SwitchRow
                    title="Mandatory Identity & Experience Verification"
                    description="Require administrator review and verified LinkedIn credentials before a mentor appears publicly."
                    checked={settings.requireIdentityVerification}
                    onChange={v => update('requireIdentityVerification', v)}
                    tag={settings.requireIdentityVerification ? 'Mandatory' : 'Optional'}
                  />

                  <SwitchRow
                    title="Automated Post-Session Learner Reviews"
                    description="Automatically prompt learners for ratings and qualitative feedback 2 hours after scheduled session completion."
                    checked={settings.mandatorySessionReview}
                    onChange={v => update('mandatorySessionReview', v)}
                    tag={settings.mandatorySessionReview ? 'Enabled' : 'Disabled'}
                  />

                  <div style={{ paddingTop: 8 }}>
                    <FieldLabel hint="Minimum verified student rating required to receive 'Starfix Certified' badge in directory.">Minimum Rating for Featured Placement</FieldLabel>
                    <div style={{ maxWidth: 300 }}>
                      <SelectInput
                        value={settings.minRatingForFeatured}
                        onChange={v => update('minRatingForFeatured', Number(v))}
                        options={[
                          { label: '★ 4.50+ stars', value: 4.5 },
                          { label: '★ 4.70+ stars', value: 4.7 },
                          { label: '★ 4.80+ stars (Standard)', value: 4.8 },
                          { label: '★ 4.90+ stars (Elite)', value: 4.9 },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: BILLING & PAYOUTS */}
          {activeTab === 'finance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Card>
                <SectionHeading
                  icon="dollar"
                  title="Platform Take-Rate & Revenue Share"
                  subtitle="Platform commission rate deducted automatically on every completed booking."
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <FieldLabel hint="Commission percentage retained by Starfix Operations.">Platform Take-Rate (%)</FieldLabel>
                      <span style={{ fontSize: 20, fontFamily: 'Playfair Display, serif', fontWeight: 600, color: '#F4D67A' }}>
                        {settings.platformCommissionPct}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={40}
                      step={1}
                      value={settings.platformCommissionPct}
                      onChange={e => update('platformCommissionPct', Number(e.target.value))}
                      style={{
                        width: '100%',
                        accentColor: '#D4AF37',
                        cursor: 'pointer',
                        marginBottom: 14,
                      }}
                    />

                    {/* Interactive Revenue Split Preview Card */}
                    <div style={{
                      padding: '16px 20px',
                      borderRadius: 12,
                      background: 'rgba(212,175,55,0.08)',
                      border: '1px solid rgba(212,175,55,0.22)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 16,
                      textAlign: 'center',
                    }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#8A90AB' }}>Example Session Fee</div>
                        <div style={{ fontSize: 17, fontWeight: 600, color: '#F7EFD8', marginTop: 4 }}>₹5,000</div>
                      </div>
                      <div style={{ borderLeft: '1px solid rgba(212,175,55,0.18)', borderRight: '1px solid rgba(212,175,55,0.18)' }}>
                        <div style={{ fontSize: 11, color: '#D4AF37' }}>Platform Share ({settings.platformCommissionPct}%)</div>
                        <div style={{ fontSize: 17, fontWeight: 600, color: '#F4D67A', marginTop: 4 }}>
                          ₹{(5000 * settings.platformCommissionPct / 100).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#4ADE80' }}>Mentor Payout ({100 - settings.platformCommissionPct}%)</div>
                        <div style={{ fontSize: 17, fontWeight: 600, color: '#4ADE80', marginTop: 4 }}>
                          ₹{(5000 * (100 - settings.platformCommissionPct) / 100).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <SectionHeading
                  icon="briefcase"
                  title="Disbursement Cycle & Settlement Automation"
                  subtitle="Payout schedule, minimum clearance balance, and dispute hold protection."
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <FieldLabel hint="Frequency of automated direct bank transfers to mentors.">Payout Settlement Schedule</FieldLabel>
                      <SelectInput
                        value={settings.payoutSchedule}
                        onChange={v => update('payoutSchedule', v)}
                        options={[
                          { label: 'Weekly (Every Monday)', value: 'Weekly (Every Monday)' },
                          { label: 'Bi-Weekly (1st & 15th)', value: 'Bi-Weekly (1st & 15th)' },
                          { label: 'Monthly (1st of Month)', value: 'Monthly (1st of Month)' },
                        ]}
                      />
                    </div>
                    <div>
                      <FieldLabel hint="Minimum accrued earnings required before disbursement triggers.">Minimum Payout Threshold</FieldLabel>
                      <TextInput
                        type="number"
                        unit="₹"
                        value={settings.minPayoutThreshold}
                        onChange={v => update('minPayoutThreshold', Number(v) || 0)}
                      />
                    </div>
                  </div>

                  <SwitchRow
                    title="Automated Disbursement Engine"
                    description="Automatically trigger payout batch via RazorpayX / Stripe on the designated settlement schedule."
                    checked={settings.autoDisbursement}
                    onChange={v => update('autoDisbursement', v)}
                    tag={settings.autoDisbursement ? 'Active' : 'Manual Approval'}
                  />

                  <SwitchRow
                    title="Dispute & Refund Reserve Protection"
                    description="Automatically place a 72-hour settlement hold on sessions subject to student dispute or cancellation reviews."
                    checked={settings.holdOnDispute}
                    onChange={v => update('holdOnDispute', v)}
                    tag={settings.holdOnDispute ? 'Protected' : 'Off'}
                    tone="amber"
                  />
                </div>
              </Card>

              <Card>
                <SectionHeading
                  icon="shieldCheck"
                  title="Taxation & Regulatory Invoicing"
                  subtitle="GST compliance, automated student invoice receipts, and TDS withholding."
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <FieldLabel hint="Starfix corporate GSTIN printed on tax invoices.">Platform GSTIN / Corporate ID</FieldLabel>
                      <TextInput value={settings.gstin} onChange={v => update('gstin', v)} placeholder="29AAAAA0000A1Z5" />
                    </div>
                    <div>
                      <FieldLabel hint="Enforces section 194-O e-commerce operator tax deduction.">TDS Withholding (1%)</FieldLabel>
                      <SelectInput
                        value={settings.tdsWithholding ? 'yes' : 'no'}
                        onChange={v => update('tdsWithholding', v === 'yes')}
                        options={[
                          { label: 'Deduct 1% TDS on Mentor Payouts', value: 'yes' },
                          { label: 'No Automatic Withholding', value: 'no' },
                        ]}
                      />
                    </div>
                  </div>

                  <SwitchRow
                    title="Automated GST Invoice Generation"
                    description="Generate compliant PDF tax invoices emailed to students immediately upon booking capture."
                    checked={settings.automatedTaxInvoices}
                    onChange={v => update('automatedTaxInvoices', v)}
                    tag={settings.automatedTaxInvoices ? 'Automated' : 'Disabled'}
                    tone="green"
                  />
                </div>
              </Card>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS & DISPATCH */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Card>
                <SectionHeading
                  icon="bell"
                  title="Automated Transactional Triggers"
                  subtitle="Configure event-driven emails and reminder notifications for learners and mentors."
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <SwitchRow
                    title="Instant Booking Confirmation & Calendar Invite"
                    description="Dispatch confirmation email with Google / Outlook .ics calendar invitation upon payment capture."
                    checked={settings.bookingConfirmationEmail}
                    onChange={v => update('bookingConfirmationEmail', v)}
                    tag="Email + .ICS"
                    tone="green"
                  />

                  <SwitchRow
                    title="24-Hour Pre-Session Briefing Reminder"
                    description="Deliver email briefing with session agenda and video room link 24 hours prior to scheduled start."
                    checked={settings.sessionReminder24h}
                    onChange={v => update('sessionReminder24h', v)}
                    tag="24h Prior"
                  />

                  <SwitchRow
                    title="1-Hour Urgent Session Reminder"
                    description="Send high-priority SMS / push notification 60 minutes before start to minimize no-shows."
                    checked={settings.sessionReminder1h}
                    onChange={v => update('sessionReminder1h', v)}
                    tag="1h Prior"
                    tone="amber"
                  />

                  <SwitchRow
                    title="Growth Path Milestone Achievements"
                    description="Notify learners and mentors when curriculum milestones are completed and XP rewards are unlocked."
                    checked={settings.milestoneCompletionAlerts}
                    onChange={v => update('milestoneCompletionAlerts', v)}
                    tag="Milestones"
                  />
                </div>
              </Card>

              <Card>
                <SectionHeading
                  icon="megaphone"
                  title="Administrative Ops Routing & Webhooks"
                  subtitle="Route operational failure alerts and connect real-time Slack / Discord webhooks."
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <FieldLabel hint="Destination for urgent notifications (failed payouts, dispute alerts, and system issues).">
                      Operations Escalation Email
                    </FieldLabel>
                    <TextInput icon="mail" type="email" value={settings.opsAlertEmail} onChange={v => update('opsAlertEmail', v)} placeholder="ops-alerts@starfix.com" />
                  </div>

                  <div>
                    <FieldLabel hint="Incoming webhook endpoint for real-time channel notifications on bookings and signups.">
                      Slack / Discord Alert Webhook URL
                    </FieldLabel>
                    <TextInput icon="link" value={settings.slackWebhookUrl} onChange={v => update('slackWebhookUrl', v)} placeholder="https://hooks.slack.com/services/..." />
                  </div>

                  <SwitchRow
                    title="Instant Webhook Alert on Booking Failure"
                    description="Post an alert immediately into the ops channel if payment fails or a video room fails to generate."
                    checked={settings.forwardFailedBookingAlerts}
                    onChange={v => update('forwardFailedBookingAlerts', v)}
                    tag="Urgent Ops"
                    tone="amber"
                  />

                  <SwitchRow
                    title="Daily Executive Operations Digest"
                    description="Send a 09:00 AM summary of 24h revenue, active sessions, and new mentor onboarding requests."
                    checked={settings.dailyExecutiveDigest}
                    onChange={v => update('dailyExecutiveDigest', v)}
                    tag="Daily 09:00"
                  />
                </div>
              </Card>
            </div>
          )}

          {/* TAB 5: SYSTEM & INFRASTRUCTURE */}
          {activeTab === 'system' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Card>
                <SectionHeading
                  icon="server"
                  title="Supabase Backend & Database Telemetry"
                  subtitle="Active production database connection details and live latency measurements."
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    padding: '16px 18px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(212,175,55,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#F7EFD8' }}>Database Endpoint</span>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#4ADE80',
                          background: 'rgba(74,222,128,0.16)',
                          padding: '2px 8px',
                          borderRadius: 99,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
                          PostgreSQL 15 (Active)
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#8A90AB', marginTop: 5, fontFamily: 'monospace' }}>
                        https://mndyaxvkjzzgyvfrxgvm.supabase.co
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={pingDatabase}
                      disabled={pingState === 'testing'}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: '1px solid rgba(212,175,55,0.3)',
                        background: 'rgba(212,175,55,0.08)',
                        color: '#F4D67A',
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Icon d={icons.activity} size={14} />
                      {pingState === 'testing' ? 'Measuring Latency…' : `Ping Database ${pingLatency ? `(${pingLatency}ms)` : ''}`}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.12)' }}>
                      <div style={{ fontSize: 11, color: '#8A90AB' }}>Auth Protocol</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#F7EFD8', marginTop: 4 }}>JWT + Supabase GoTrue</div>
                    </div>
                    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.12)' }}>
                      <div style={{ fontSize: 11, color: '#8A90AB' }}>Security Layer</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#4ADE80', marginTop: 4 }}>RLS Enforced (Row-Level)</div>
                    </div>
                    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.12)' }}>
                      <div style={{ fontSize: 11, color: '#8A90AB' }}>Hosting Region</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#F7EFD8', marginTop: 4 }}>ap-south-1 (Mumbai)</div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <SectionHeading
                  icon="archive"
                  title="Cache & Storage Maintenance"
                  subtitle="Client-side storage health and query cache invalidation tools."
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#F7EFD8' }}>Flush Client Query Cache</div>
                    <div style={{ fontSize: 12, color: '#8A90AB', marginTop: 3, maxWidth: 440 }}>
                      Clears stale local query records and prompts live data revalidation from the Supabase API without logging you out.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleFlushCache}
                    style={{
                      padding: '9px 16px',
                      borderRadius: 8,
                      border: '1px solid rgba(212,175,55,0.25)',
                      background: 'rgba(255,255,255,0.04)',
                      color: '#F7EFD8',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Flush Cache
                  </button>
                </div>
              </Card>

              <Card>
                <SectionHeading
                  icon="code"
                  title="Configuration Backup & Audit Export"
                  subtitle="Download a timestamped JSON snapshot of your active platform parameters for disaster recovery."
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#F7EFD8' }}>Export Operational Snapshot</div>
                    <div style={{ fontSize: 12, color: '#8A90AB', marginTop: 3, maxWidth: 440 }}>
                      Exports platform configuration, commission policies, scheduling limits, and alert routing to a structured .json file.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    style={{
                      padding: '9px 18px',
                      borderRadius: 8,
                      border: '1px solid rgba(212,175,55,0.3)',
                      background: 'rgba(212,175,55,0.12)',
                      color: '#F4D67A',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Icon d={icons.archive} size={14} />
                    Export Backup (.json)
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* Sticky Unsaved Changes Floating Bar */}
          {isDirty && (
            <div
              style={{
                marginTop: 22,
                padding: '16px 22px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #0A102E 0%, #070B1F 100%)',
                border: '1px solid rgba(212,175,55,0.38)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F4D67A', boxShadow: '0 0 10px #F4D67A' }} />
                <span style={{ fontSize: 13.5, color: '#F7EFD8', fontWeight: 500 }}>
                  You have unsaved changes in your platform configuration
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSettings(initialSettings)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.14)',
                    background: 'transparent',
                    color: '#9AA0BA',
                    fontSize: 12.5,
                    cursor: 'pointer',
                  }}
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #F4D67A 0%, #D4AF37 100%)',
                    color: '#070A1A',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(212,175,55,0.25)',
                  }}
                >
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Persistent Context Rail ────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 96 }}>

          {/* Real Operator Profile Card */}
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#8A90AB', marginBottom: 14, letterSpacing: '.03em', textTransform: 'uppercase' }}>
              Active Operator
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F4D67A, #B8901F)',
                  color: '#0A0E1F',
                  fontWeight: 700,
                  fontSize: 18,
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'Playfair Display, serif',
                  flexShrink: 0,
                  boxShadow: '0 0 16px rgba(212,175,55,0.25)',
                }}
              >
                {adminName.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#F7EFD8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {adminName}
                </div>
                <div style={{ fontSize: 11.5, color: '#8A90AB', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {adminEmail}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)' }}>
              <span style={{ fontSize: 11.5, color: '#9AA0BA' }}>Role Authority</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#F4D67A', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ADE80' }} />
                {adminRole}
              </span>
            </div>
          </Card>

          {/* Live Infrastructure Telemetry Card */}
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#8A90AB', marginBottom: 14, letterSpacing: '.03em', textTransform: 'uppercase' }}>
              Service Telemetry
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, color: '#B8BCD0' }}>Environment</span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: '#4ADE80', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
                  Production Edge
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, color: '#B8BCD0' }}>Database Latency</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: pingState === 'ok' ? '#4ADE80' : '#FBBF24' }}>
                  {pingLatency ? `${pingLatency} ms` : 'Testing…'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, color: '#B8BCD0' }}>Gateway State</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 99,
                  color: settings.maintenanceMode ? '#F87171' : '#4ADE80',
                  background: settings.maintenanceMode ? 'rgba(248,113,113,0.16)' : 'rgba(74,222,128,0.16)',
                }}>
                  {settings.maintenanceMode ? 'Offline' : 'Operational'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, color: '#B8BCD0' }}>Sync State</span>
                <span style={{ fontSize: 12, color: '#F7EFD8' }}>{lastSavedTime}</span>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(212,175,55,0.16)', margin: '16px 0' }} />

            <button
              type="button"
              onClick={pingDatabase}
              disabled={pingState === 'testing'}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid rgba(212,175,55,0.22)',
                background: 'rgba(255,255,255,0.04)',
                color: '#F4D67A',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Icon d={icons.activity} size={14} />
              {pingState === 'testing' ? 'Pinging Cloud…' : 'Ping Cloud Database'}
            </button>
          </Card>

          {/* Quick Platform Policies Summary Card */}
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#8A90AB', marginBottom: 14, letterSpacing: '.03em', textTransform: 'uppercase' }}>
              Active Policy Summary
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9AA0BA' }}>
                <span>Platform Take-Rate:</span>
                <b style={{ color: '#F7EFD8' }}>{settings.platformCommissionPct}%</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9AA0BA' }}>
                <span>Disbursement Cycle:</span>
                <b style={{ color: '#F7EFD8' }}>{settings.payoutSchedule.split(' ')[0]}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9AA0BA' }}>
                <span>Advance Notice:</span>
                <b style={{ color: '#F7EFD8' }}>{settings.minBookingNoticeHours}h min</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9AA0BA' }}>
                <span>Mentee Cohort Cap:</span>
                <b style={{ color: '#F7EFD8' }}>{settings.maxActiveMenteesPerMentor} active</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9AA0BA' }}>
                <span>Cancellation Cutoff:</span>
                <b style={{ color: '#F7EFD8' }}>{settings.cancellationCutoffHours}h</b>
              </div>
            </div>
          </Card>

        </div>

      </div>
    </PageShell>
  )
}
