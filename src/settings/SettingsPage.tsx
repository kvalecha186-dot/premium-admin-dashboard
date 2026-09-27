import React, { useState } from 'react'
import { Icon, icons, Card, PageShell } from '../shared'

// ── Types & Initial State Definitions ────────────────────────────────────────

export type SettingsTab = 'general' | 'branding' | 'payments' | 'security'

interface GeneralSettings {
  platformName: string
  supportEmail: string
  publicWebsiteUrl: string
  maintenanceMode: boolean
}

interface BrandingSettings {
  logoFileName: string
  faviconFileName: string
}

interface PaymentSettings {
  payoutSchedule: string
  commissionPct: number
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  sessionTimeout: string
  loginAlertsEnabled: boolean
}

const INITIAL_GENERAL: GeneralSettings = {
  platformName: 'Starfix Growth Operations',
  supportEmail: 'concierge@starfix.com',
  publicWebsiteUrl: 'https://starfix.com',
  maintenanceMode: false,
}

const INITIAL_BRANDING: BrandingSettings = {
  logoFileName: 'starfix-logo-luxury.svg',
  faviconFileName: 'starfix-favicon-gold.png',
}

const INITIAL_PAYMENTS: PaymentSettings = {
  payoutSchedule: 'Weekly (Every Monday)',
  commissionPct: 15,
}

const INITIAL_SECURITY: SecuritySettings = {
  twoFactorEnabled: true,
  sessionTimeout: '30 minutes',
  loginAlertsEnabled: true,
}

const SUBSCRIPTION_PLANS = [
  { name: 'Starter Path', price: '₹14,999 / mo', features: '1 session/mo • Core Paths Access' },
  { name: 'Pro Growth', price: '₹34,999 / mo', features: '4 sessions/mo • All Growth Paths • Priority Support' },
  { name: 'Executive Leadership', price: '₹79,999 / mo', features: 'Unlimited sessions • Dedicated Mentor Advisor' },
]

const ADMIN_ROLES = [
  { name: 'Marcus Webb', email: 'marcus@starfix.com', role: 'Owner', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces' },
  { name: 'Elena Rostova', email: 'elena@starfix.com', role: 'Admin', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces' },
  { name: 'David Miller', email: 'david@starfix.com', role: 'Billing Admin', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces' },
]

// Read-only audit trail shown in the context rail — ties Settings back into
// the same activity-log pattern used on the Security page, rather than
// inventing a one-off list style just for this screen.
const RECENT_CHANGES: { label: string; admin: string; time: string; icon: keyof typeof icons }[] = [
  { label: 'Commission rate changed to 15%', admin: 'Marcus Webb', time: '2 days ago', icon: 'dollar' },
  { label: '2FA enforced for all admins', admin: 'Elena Rostova', time: '5 days ago', icon: 'shieldCheck' },
  { label: 'Payout schedule set to Weekly', admin: 'Marcus Webb', time: '1 week ago', icon: 'clock' },
]

const TABS: { id: SettingsTab; label: string; icon: keyof typeof icons }[] = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'branding', label: 'Branding', icon: 'star' },
  { id: 'payments', label: 'Payments', icon: 'dollar' },
  { id: 'security', label: 'Security', icon: 'shieldCheck' },
]

// A field input with a small leading icon, sized and colored to match the
// rest of the ivory/gold form language rather than a bare browser input.
function FieldInput({
  icon, type = 'text', value, onChange, placeholder,
}: {
  icon?: keyof typeof icons
  type?: string
  value: string | number
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div style={{ position: 'relative' }}>
      {icon && (
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#B8AF9E', display: 'flex' }}>
          <Icon d={icons[icon]} size={15} />
        </span>
      )}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: icon ? '11px 14px 11px 40px' : '11px 14px',
          borderRadius: 10,
          border: '1px solid #ECE7DF',
          background: '#FAF8F4',
          fontSize: 13.5,
          color: '#171717',
          outline: 'none',
          transition: 'border-color 150ms ease, background 150ms ease',
          fontFamily: 'Inter, sans-serif',
        }}
        onFocus={e => { e.target.style.borderColor = '#C89B1F'; e.target.style.background = '#FFFFFF' }}
        onBlur={e => { e.target.style.borderColor = '#ECE7DF'; e.target.style.background = '#FAF8F4' }}
      />
    </div>
  )
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: '#171717' }}>{children}</label>
      {hint && <div style={{ fontSize: 11.5, color: '#8E8E93', marginTop: 1 }}>{hint}</div>}
    </div>
  )
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer', flexShrink: 0,
        background: on ? '#C89B1F' : '#E5E5EA', position: 'relative', transition: 'background 200ms ease', padding: 2,
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: '#FFFFFF',
        transform: on ? 'translateX(20px)' : 'translateX(0px)', transition: 'transform 200ms ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      }} />
    </button>
  )
}

// A small section header used to introduce each Card — keeps every card
// grounded in what it's for, at a consistent, quiet type scale.
function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#171717' }}>{title}</div>
      <div style={{ fontSize: 12.5, color: '#8E8E93', marginTop: 3 }}>{subtitle}</div>
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  // Form states
  const [general, setGeneral] = useState<GeneralSettings>(INITIAL_GENERAL)
  const [branding, setBranding] = useState<BrandingSettings>(INITIAL_BRANDING)
  const [payments, setPayments] = useState<PaymentSettings>(INITIAL_PAYMENTS)
  const [security, setSecurity] = useState<SecuritySettings>(INITIAL_SECURITY)

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedLabel, setLastSavedLabel] = useState('No changes saved this session')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Dirty state checks per tab
  const isGeneralDirty = JSON.stringify(general) !== JSON.stringify(INITIAL_GENERAL)
  const isBrandingDirty = JSON.stringify(branding) !== JSON.stringify(INITIAL_BRANDING)
  const isPaymentsDirty = JSON.stringify(payments) !== JSON.stringify(INITIAL_PAYMENTS)
  const isSecurityDirty = JSON.stringify(security) !== JSON.stringify(INITIAL_SECURITY)

  const dirtyTabMap: Record<SettingsTab, boolean> = {
    general: isGeneralDirty,
    branding: isBrandingDirty,
    payments: isPaymentsDirty,
    security: isSecurityDirty,
  }

  const isCurrentTabDirty = dirtyTabMap[activeTab]

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setLastSavedLabel('Just now')
      showToast(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings updated successfully`)
    }, 600)
  }

  return (
    <PageShell
      title="Admin Settings"
      subtitle="Essential system parameters, brand assets, payout rules, and security controls for Starfix Operations."
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, background: '#171717', color: '#FFFFFF',
          padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 100, display: 'flex', alignItems: 'center', gap: 10,
          border: '1px solid rgba(200, 155, 31, 0.3)',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C89B1F' }} />
          {toastMessage}
        </div>
      )}

      {/* Two-zone layout: working content + a persistent context rail.
          The rail fills the space that used to sit empty next to a narrow
          centered card, and reflects the live state of the form (e.g. the
          Public Site status chip below tracks the Maintenance Mode toggle). */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 296px', gap: 28, alignItems: 'flex-start' }}>

        {/* ── LEFT: Tabs + working content ─────────────────────────────── */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #ECE7DF', marginBottom: 24 }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              const isDirty = dirtyTabMap[tab.id]
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '10px 16px', border: 'none', background: 'transparent',
                    color: isActive ? '#171717' : '#8E8E93', fontSize: 13.5,
                    fontWeight: isActive ? 600 : 500, cursor: 'pointer',
                    borderBottom: isActive ? '2px solid #C89B1F' : '2px solid transparent',
                    marginBottom: -1, transition: 'color 150ms ease',
                  }}
                >
                  <Icon d={icons[tab.icon]} size={14} style={{ color: isActive ? '#C89B1F' : '#B8AF9E' }} />
                  {tab.label}
                  {isDirty && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C89B1F', display: 'inline-block' }} />}
                </button>
              )
            })}
          </div>

          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card>
                <SectionHeading title="Platform Identity" subtitle="Public name and support channels shown to learners and mentors." />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <FieldLabel>Platform Name</FieldLabel>
                    <FieldInput value={general.platformName} onChange={v => setGeneral({ ...general, platformName: v })} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                    <div>
                      <FieldLabel>Support Email Address</FieldLabel>
                      <FieldInput icon="mail" type="email" value={general.supportEmail} onChange={v => setGeneral({ ...general, supportEmail: v })} />
                    </div>
                    <div>
                      <FieldLabel>Public Website URL</FieldLabel>
                      <FieldInput icon="link" type="url" value={general.publicWebsiteUrl} onChange={v => setGeneral({ ...general, publicWebsiteUrl: v })} />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Maintenance Mode gets its own, visually distinct card —
                  this is an operationally sensitive control, so it shouldn't
                  look identical to a routine text field. */}
              <div style={{
                borderRadius: 14, border: '1px solid #F3DFA3', background: '#FFFBEB',
                padding: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F7E7B8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon d={icons.alert} size={17} style={{ color: '#92400E' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#171717' }}>Maintenance Mode</span>
                      <span style={{
                        fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                        color: general.maintenanceMode ? '#B91C1C' : '#166534',
                        background: general.maintenanceMode ? '#FEE2E2' : '#DCFCE7',
                      }}>
                        {general.maintenanceMode ? 'Site Offline' : 'Site Is Live'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#8A6D2F', marginTop: 3, maxWidth: 380 }}>
                      Temporarily restrict public learner access to schedule core platform upgrades.
                    </div>
                  </div>
                </div>
                <Toggle on={general.maintenanceMode} onClick={() => setGeneral({ ...general, maintenanceMode: !general.maintenanceMode })} />
              </div>
            </div>
          )}

          {/* TAB 2: BRANDING */}
          {activeTab === 'branding' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card>
                <SectionHeading title="Brand Assets" subtitle="Upload high-resolution logos and favicons for the Starfix ecosystem." />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <FieldLabel>Primary Logo (SVG / PNG)</FieldLabel>
                    <div style={{
                      border: '1.5px dashed #ECE7DF', borderRadius: 14, padding: '20px 22px',
                      background: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: '#171717', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon d={icons.star} size={18} style={{ color: '#C89B1F' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#171717' }}>{branding.logoFileName}</div>
                          <div style={{ fontSize: 11, color: '#8E8E93' }}>Recommended: 400×100px vector format</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBranding({ ...branding, logoFileName: 'starfix-custom-logo-v2.svg' })}
                        style={{ fontSize: 12, fontWeight: 600, color: '#171717', background: '#FFFFFF', border: '1px solid #ECE7DF', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        Choose New File
                      </button>
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Browser Favicon (ICO / PNG 32×32)</FieldLabel>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 14, background: '#FAF8F4', border: '1px solid #ECE7DF' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#171717', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon d={icons.star} size={14} style={{ color: '#C89B1F' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#171717' }}>{branding.faviconFileName}</div>
                          <div style={{ fontSize: 11, color: '#8E8E93' }}>32×32px transparent PNG</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBranding({ ...branding, faviconFileName: 'starfix-favicon-v2.png' })}
                        style={{ fontSize: 12, fontWeight: 600, color: '#171717', background: '#FFFFFF', border: '1px solid #ECE7DF', padding: '7px 14px', borderRadius: 8, cursor: 'pointer' }}
                      >
                        Replace
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <SectionHeading title="Live Preview" subtitle="How the mark renders across the learner site and this admin panel." />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ padding: 16, borderRadius: 12, border: '1px solid #ECE7DF', background: '#FAF8F4' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', marginBottom: 10 }}>Navbar</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#FFFFFF', borderRadius: 10, border: '1px solid #ECE7DF' }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: '#171717', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon d={icons.star} size={13} style={{ color: '#C89B1F' }} />
                      </div>
                      <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, fontSize: 15, color: '#171717' }}>Starfix</span>
                    </div>
                  </div>
                  <div style={{ padding: 16, borderRadius: 12, border: '1px solid #ECE7DF', background: '#FAF8F4' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', marginBottom: 10 }}>Admin Sidebar</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#171717', borderRadius: 10 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(200, 155, 31, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon d={icons.star} size={13} style={{ color: '#C89B1F' }} />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, fontSize: 14, color: '#FFFFFF' }}>Starfix Admin</div>
                        <div style={{ fontSize: 9.5, color: '#C89B1F' }}>Growth Operations</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: PAYMENTS */}
          {activeTab === 'payments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#171717' }}>Stripe Connect</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#166534', background: '#DCFCE7', padding: '2px 8px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#166534' }} />
                        Connected
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 5 }}>
                      Account ID: <code style={{ color: '#171717', fontWeight: 600 }}>acct_1N9xStarfixLive</code>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast('Redirecting to Stripe Express Dashboard…')}
                    style={{ fontSize: 12, fontWeight: 600, color: '#171717', background: '#FFFFFF', border: '1px solid #ECE7DF', padding: '8px 16px', borderRadius: 10, cursor: 'pointer' }}
                  >
                    Manage Account
                  </button>
                </div>
              </Card>

              <Card>
                <SectionHeading title="Payout Rules" subtitle="Mentor payment frequency and Starfix's platform take rate." />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  <div>
                    <FieldLabel>Mentor Payout Schedule</FieldLabel>
                    <select
                      value={payments.payoutSchedule}
                      onChange={e => setPayments({ ...payments, payoutSchedule: e.target.value })}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #ECE7DF', background: '#FAF8F4', fontSize: 13.5, color: '#171717', outline: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                    >
                      <option value="Weekly (Every Monday)">Weekly (Every Monday)</option>
                      <option value="Bi-weekly (1st & 15th)">Bi-weekly (1st &amp; 15th)</option>
                      <option value="Monthly (1st of Month)">Monthly (1st of Month)</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Platform Commission Rate</FieldLabel>
                    <FieldInput icon="dollar" type="number" value={payments.commissionPct} onChange={v => setPayments({ ...payments, commissionPct: Number(v) })} />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 12 }}>
                  Starfix receives <strong style={{ color: '#171717' }}>{payments.commissionPct}%</strong>, mentors receive <strong style={{ color: '#171717' }}>{100 - payments.commissionPct}%</strong> of every session fee.
                </div>
              </Card>

              <Card>
                <SectionHeading title="Subscription Plans" subtitle="Current pricing tiers — read-only summary." />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {SUBSCRIPTION_PLANS.map(plan => (
                    <div key={plan.name} style={{ padding: '13px 16px', borderRadius: 12, border: '1px solid #ECE7DF', background: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#171717' }}>{plan.name}</div>
                        <div style={{ fontSize: 11.5, color: '#8E8E93', marginTop: 2 }}>{plan.features}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#C89B1F', whiteSpace: 'nowrap' }}>{plan.price}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card>
                <SectionHeading title="Authentication Policy" subtitle="Sign-in requirements enforced across every admin account." />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 12, background: '#FAF8F4', border: '1px solid #ECE7DF' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#171717' }}>Two-Factor Authentication</div>
                      <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>Require a TOTP authenticator app for every admin login.</div>
                    </div>
                    <Toggle on={security.twoFactorEnabled} onClick={() => setSecurity({ ...security, twoFactorEnabled: !security.twoFactorEnabled })} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 12, background: '#FAF8F4', border: '1px solid #ECE7DF' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#171717' }}>New Device &amp; IP Alerts</div>
                      <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>Email the admin immediately on an unrecognized login.</div>
                    </div>
                    <Toggle on={security.loginAlertsEnabled} onClick={() => setSecurity({ ...security, loginAlertsEnabled: !security.loginAlertsEnabled })} />
                  </div>

                  <div>
                    <FieldLabel>Inactivity Session Timeout</FieldLabel>
                    <select
                      value={security.sessionTimeout}
                      onChange={e => setSecurity({ ...security, sessionTimeout: e.target.value })}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #ECE7DF', background: '#FAF8F4', fontSize: 13.5, color: '#171717', outline: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                    >
                      <option value="15 minutes">15 minutes</option>
                      <option value="30 minutes">30 minutes</option>
                      <option value="1 hour">1 hour</option>
                      <option value="4 hours">4 hours</option>
                    </select>
                  </div>
                </div>
              </Card>

              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <SectionHeading title="Administrator Accounts" subtitle="Everyone with access to this panel, and their role." />
                  <button
                    type="button"
                    onClick={() => showToast('Invite modal triggered')}
                    style={{ fontSize: 12, fontWeight: 600, color: '#C89B1F', background: '#F7F2E7', border: 'none', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap', marginTop: -20 }}
                  >
                    + Invite Admin
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ADMIN_ROLES.map(adm => (
                    <div key={adm.email} style={{ padding: '11px 14px', borderRadius: 12, border: '1px solid #ECE7DF', background: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={adm.avatar} alt={adm.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#171717' }}>{adm.name}</div>
                          <div style={{ fontSize: 11, color: '#8E8E93' }}>{adm.email}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#171717', background: '#FFFFFF', border: '1px solid #ECE7DF', padding: '3px 10px', borderRadius: 99 }}>
                        {adm.role}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <a
                href="#security"
                onClick={e => e.preventDefault()}
                style={{ fontSize: 12.5, color: '#8E8E93', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Icon d={icons.eye} size={13} />
                Looking for active sessions and login history? See the <span style={{ color: '#C89B1F', fontWeight: 600 }}>Security</span> page.
              </a>
            </div>
          )}

          {/* Save Action Footer — appears only when the current tab has unsaved changes */}
          {isCurrentTabDirty && (
            <div style={{
              marginTop: 20, padding: '16px 20px', borderRadius: 14, background: '#171717',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#D4D4D4' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C89B1F' }} />
                Unsaved changes in {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  background: '#C89B1F', color: '#171717', padding: '10px 20px', borderRadius: 10,
                  fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT: Context rail — persistent across every tab ────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>

          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#8E8E93', marginBottom: 14 }}>Environment</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, color: '#525252' }}>Environment</span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: '#166534', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#166534' }} />
                  Production
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, color: '#525252' }}>Public site</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                  color: general.maintenanceMode ? '#B91C1C' : '#166534',
                  background: general.maintenanceMode ? '#FEE2E2' : '#DCFCE7',
                }}>
                  {general.maintenanceMode ? 'Offline' : 'Live'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, color: '#525252' }}>Last saved</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#171717' }}>{lastSavedLabel}</span>
              </div>
            </div>

            <div style={{ height: 1, background: '#ECE7DF', margin: '16px 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces" alt="Marcus Webb" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#171717' }}>Marcus Webb</div>
                <div style={{ fontSize: 11, color: '#8E8E93' }}>Signed in · Head of Platform</div>
              </div>
            </div>
          </Card>

          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#8E8E93', marginBottom: 14 }}>Recent Changes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {RECENT_CHANGES.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: '#F7F2E7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon d={icons[c.icon]} size={13} style={{ color: '#C89B1F' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#171717', lineHeight: 1.4 }}>{c.label}</div>
                    <div style={{ fontSize: 11, color: '#8E8E93', marginTop: 2 }}>{c.admin} · {c.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </PageShell>
  )
}
