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

  // Save handler for current active tab
  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      showToast(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings updated successfully`)
    }, 600)
  }

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'branding', label: 'Branding' },
    { id: 'payments', label: 'Payments' },
    { id: 'security', label: 'Security' },
  ]

  return (
    <PageShell
      title="Admin Settings"
      subtitle="Essential system parameters, brand assets, payout rules, and security controls for Starfix Operations."
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          background: '#171717',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 500,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          border: '1px solid rgba(200, 155, 31, 0.3)'
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C89B1F' }} />
          {toastMessage}
        </div>
      )}

      {/* Main Container - Single Column Layout with Spacious Breathing Room */}
      <div style={{ maxWidth: 740, margin: '0 auto', paddingBottom: 48 }}>
        
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid #ECE7DF',
          paddingBottom: 12,
          marginBottom: 32,
        }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id
            const isDirty = dirtyTabMap[tab.id]

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 12,
                  border: 'none',
                  background: isActive ? '#FAF8F4' : 'transparent',
                  color: isActive ? '#171717' : '#737373',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 180ms ease',
                  position: 'relative',
                  borderBottom: isActive ? '2px solid #C89B1F' : '2px solid transparent'
                }}
              >
                {tab.label}
                {isDirty && (
                  <span
                    title="Unsaved changes"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#C89B1F',
                      display: 'inline-block',
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Tab Panel Content in 24px Radius White Card */}
        <Card style={{
          padding: '36px 40px',
          borderRadius: 24,
          boxShadow: '0 8px 32px rgba(23, 23, 23, 0.03)',
          border: '1px solid #ECE7DF',
          background: '#FFFFFF'
        }}>
          
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 600, color: '#171717', margin: '0 0 4px 0' }}>
                  General Platform Parameters
                </h3>
                <p style={{ fontSize: 13, color: '#737373', margin: 0 }}>
                  Manage public identities and support channels for the Starfix ecosystem.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Platform Name */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#737373', display: 'block', marginBottom: 8, letterSpacing: '0.02em' }}>
                    Platform Name
                  </label>
                  <input
                    type="text"
                    value={general.platformName}
                    onChange={e => setGeneral({ ...general, platformName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1px solid #ECE7DF',
                      background: '#FAF8F4',
                      fontSize: 14,
                      color: '#171717',
                      outline: 'none',
                      transition: 'border-color 150ms ease'
                    }}
                    onFocus={e => (e.target.style.borderColor = '#C89B1F')}
                    onBlur={e => (e.target.style.borderColor = '#ECE7DF')}
                  />
                </div>

                {/* Support Email */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#737373', display: 'block', marginBottom: 8, letterSpacing: '0.02em' }}>
                    Support Email Address
                  </label>
                  <input
                    type="email"
                    value={general.supportEmail}
                    onChange={e => setGeneral({ ...general, supportEmail: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1px solid #ECE7DF',
                      background: '#FAF8F4',
                      fontSize: 14,
                      color: '#171717',
                      outline: 'none',
                      transition: 'border-color 150ms ease'
                    }}
                    onFocus={e => (e.target.style.borderColor = '#C89B1F')}
                    onBlur={e => (e.target.style.borderColor = '#ECE7DF')}
                  />
                </div>

                {/* Public Website URL */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#737373', display: 'block', marginBottom: 8, letterSpacing: '0.02em' }}>
                    Public Website URL
                  </label>
                  <input
                    type="url"
                    value={general.publicWebsiteUrl}
                    onChange={e => setGeneral({ ...general, publicWebsiteUrl: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1px solid #ECE7DF',
                      background: '#FAF8F4',
                      fontSize: 14,
                      color: '#171717',
                      outline: 'none',
                      transition: 'border-color 150ms ease'
                    }}
                    onFocus={e => (e.target.style.borderColor = '#C89B1F')}
                    onBlur={e => (e.target.style.borderColor = '#ECE7DF')}
                  />
                </div>

                {/* Maintenance Mode Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: 16,
                  background: '#FAF8F4',
                  border: '1px solid #ECE7DF',
                  marginTop: 8
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#171717' }}>Maintenance Mode</div>
                    <div style={{ fontSize: 12, color: '#737373', marginTop: 2 }}>
                      Temporarily restrict public learner access to schedule core platform upgrades.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setGeneral({ ...general, maintenanceMode: !general.maintenanceMode })}
                    style={{
                      width: 48,
                      height: 26,
                      borderRadius: 99,
                      background: general.maintenanceMode ? '#C89B1F' : '#E5E5EA',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 200ms ease',
                      padding: 2
                    }}
                  >
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      transform: general.maintenanceMode ? 'translateX(22px)' : 'translateX(0px)',
                      transition: 'transform 200ms ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                    }} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BRANDING */}
          {activeTab === 'branding' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 600, color: '#171717', margin: '0 0 4px 0' }}>
                  Brand Assets & Identity
                </h3>
                <p style={{ fontSize: 13, color: '#737373', margin: 0 }}>
                  Upload high-resolution logos and inspect real-time navigation previews.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Upload Logo */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#737373', display: 'block', marginBottom: 8, letterSpacing: '0.02em' }}>
                    Primary Starfix Logo (SVG / PNG)
                  </label>
                  <div style={{
                    border: '1.5px dashed #ECE7DF',
                    borderRadius: 16,
                    padding: '24px',
                    textAlign: 'center',
                    background: '#FAF8F4',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#171717', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon d={icons.star} size={20} style={{ color: '#C89B1F' }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#171717' }}>{branding.logoFileName}</div>
                    <div style={{ fontSize: 11.5, color: '#8E8E93' }}>Recommended dimensions: 400×100px vector format</div>
                    <button
                      type="button"
                      onClick={() => setBranding({ ...branding, logoFileName: 'starfix-custom-logo-v2.svg' })}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#171717',
                        background: '#FFFFFF',
                        border: '1px solid #ECE7DF',
                        padding: '6px 14px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        marginTop: 4
                      }}
                    >
                      Choose New File
                    </button>
                  </div>
                </div>

                {/* Upload Favicon */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#737373', display: 'block', marginBottom: 8, letterSpacing: '0.02em' }}>
                    Browser Favicon (ICO / PNG 32×32)
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: 16,
                    background: '#FAF8F4',
                    border: '1px solid #ECE7DF'
                  }}>
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
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#171717',
                        background: '#FFFFFF',
                        border: '1px solid #ECE7DF',
                        padding: '6px 14px',
                        borderRadius: 8,
                        cursor: 'pointer'
                      }}
                    >
                      Replace Favicon
                    </button>
                  </div>
                </div>

                {/* Previews Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
                  {/* Navbar Logo Preview */}
                  <div style={{ padding: 18, borderRadius: 16, border: '1px solid #ECE7DF', background: '#FFFFFF' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', marginBottom: 12 }}>
                      Navbar Logo Preview
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#FAF8F4', borderRadius: 10, border: '1px solid #ECE7DF' }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: '#171717', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon d={icons.star} size={13} style={{ color: '#C89B1F' }} />
                      </div>
                      <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, fontSize: 15, color: '#171717' }}>Starfix</span>
                    </div>
                  </div>

                  {/* Admin Sidebar Logo Preview */}
                  <div style={{ padding: 18, borderRadius: 16, border: '1px solid #ECE7DF', background: '#FFFFFF' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', marginBottom: 12 }}>
                      Sidebar Logo Preview
                    </div>
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
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENTS */}
          {activeTab === 'payments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 600, color: '#171717', margin: '0 0 4px 0' }}>
                  Payments & Revenue Configuration
                </h3>
                <p style={{ fontSize: 13, color: '#737373', margin: 0 }}>
                  Manage payout frequency, platform take rates, and inspect subscription plan defaults.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {/* Stripe Connection Status */}
                <div style={{
                  padding: '20px 24px',
                  borderRadius: 16,
                  background: '#FAF8F4',
                  border: '1px solid #ECE7DF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#171717' }}>Stripe Connect Integration</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#166534', background: '#DCFCE7', padding: '2px 8px', borderRadius: 99 }}>
                        ● Connected
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#737373', marginTop: 4 }}>
                      Connected Account ID: <code style={{ color: '#171717', fontWeight: 600 }}>acct_1N9xStarfixLive</code>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => showToast('Redirecting to Stripe Express Dashboard...')}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#171717',
                      background: '#FFFFFF',
                      border: '1px solid #ECE7DF',
                      padding: '8px 14px',
                      borderRadius: 10,
                      cursor: 'pointer'
                    }}
                  >
                    Manage Account
                  </button>
                </div>

                {/* Mentor Payout Schedule */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#737373', display: 'block', marginBottom: 8, letterSpacing: '0.02em' }}>
                    Mentor Payout Schedule
                  </label>
                  <select
                    value={payments.payoutSchedule}
                    onChange={e => setPayments({ ...payments, payoutSchedule: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1px solid #ECE7DF',
                      background: '#FAF8F4',
                      fontSize: 14,
                      color: '#171717',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Weekly (Every Monday)">Weekly (Every Monday)</option>
                    <option value="Bi-weekly (1st & 15th)">Bi-weekly (1st & 15th)</option>
                    <option value="Monthly (1st of Month)">Monthly (1st of Month)</option>
                  </select>
                </div>

                {/* Platform Commission % */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#737373', display: 'block', marginBottom: 8, letterSpacing: '0.02em' }}>
                    Platform Commission Take Rate (%)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={payments.commissionPct}
                      onChange={e => setPayments({ ...payments, commissionPct: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 12,
                        border: '1px solid #ECE7DF',
                        background: '#FAF8F4',
                        fontSize: 14,
                        color: '#171717',
                        outline: 'none'
                      }}
                    />
                    <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 600, color: '#8E8E93' }}>
                      %
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#8E8E93', marginTop: 4 }}>
                    Starfix receives {payments.commissionPct}%, while mentors receive {100 - payments.commissionPct}% of session fees.
                  </div>
                </div>

                {/* Subscription Plans Summary (Read-Only) */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#737373', letterSpacing: '0.02em', marginBottom: 10 }}>
                    Active Subscription Plans Summary (Read-Only)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {SUBSCRIPTION_PLANS.map(plan => (
                      <div key={plan.name} style={{ padding: '14px 18px', borderRadius: 12, border: '1px solid #ECE7DF', background: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#171717' }}>{plan.name}</div>
                          <div style={{ fontSize: 11.5, color: '#737373', marginTop: 2 }}>{plan.features}</div>
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#C89B1F' }}>{plan.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 600, color: '#171717', margin: '0 0 4px 0' }}>
                  Security & Access Controls
                </h3>
                <p style={{ fontSize: 13, color: '#737373', margin: 0 }}>
                  Enforce authentication safeguards, session expirations, and review administrator roles.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {/* Two-Factor Authentication */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: 16,
                  background: '#FAF8F4',
                  border: '1px solid #ECE7DF'
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#171717' }}>Two-Factor Authentication (2FA)</div>
                    <div style={{ fontSize: 12, color: '#737373', marginTop: 2 }}>
                      Require TOTP authenticator app verification for all admin logins.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSecurity({ ...security, twoFactorEnabled: !security.twoFactorEnabled })}
                    style={{
                      width: 48,
                      height: 26,
                      borderRadius: 99,
                      background: security.twoFactorEnabled ? '#C89B1F' : '#E5E5EA',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 200ms ease',
                      padding: 2
                    }}
                  >
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      transform: security.twoFactorEnabled ? 'translateX(22px)' : 'translateX(0px)',
                      transition: 'transform 200ms ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                    }} />
                  </button>
                </div>

                {/* Session Timeout */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#737373', display: 'block', marginBottom: 8, letterSpacing: '0.02em' }}>
                    Inactivity Session Timeout
                  </label>
                  <select
                    value={security.sessionTimeout}
                    onChange={e => setSecurity({ ...security, sessionTimeout: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1px solid #ECE7DF',
                      background: '#FAF8F4',
                      fontSize: 14,
                      color: '#171717',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="15 minutes">15 minutes</option>
                    <option value="30 minutes">30 minutes</option>
                    <option value="1 hour">1 hour</option>
                    <option value="4 hours">4 hours</option>
                  </select>
                </div>

                {/* Admin Roles List */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#737373', letterSpacing: '0.02em' }}>
                      Administrator Accounts & Roles
                    </label>
                    <button
                      type="button"
                      onClick={() => showToast('Invite modal triggered')}
                      style={{ fontSize: 11.5, fontWeight: 600, color: '#C89B1F', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      + Invite Admin
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ADMIN_ROLES.map(adm => (
                      <div key={adm.email} style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #ECE7DF', background: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                </div>

                {/* Login Alerts Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: 16,
                  background: '#FAF8F4',
                  border: '1px solid #ECE7DF'
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#171717' }}>New Device & IP Login Alerts</div>
                    <div style={{ fontSize: 12, color: '#737373', marginTop: 2 }}>
                      Dispatch immediate security alert email on unrecognized admin logins.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSecurity({ ...security, loginAlertsEnabled: !security.loginAlertsEnabled })}
                    style={{
                      width: 48,
                      height: 26,
                      borderRadius: 99,
                      background: security.loginAlertsEnabled ? '#C89B1F' : '#E5E5EA',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 200ms ease',
                      padding: 2
                    }}
                  >
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      transform: security.loginAlertsEnabled ? 'translateX(22px)' : 'translateX(0px)',
                      transition: 'transform 200ms ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                    }} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Save Action Footer - Appears ONLY when changes exist on current tab */}
          {isCurrentTabDirty && (
            <div style={{
              marginTop: 36,
              paddingTop: 20,
              borderTop: '1px solid #ECE7DF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              animation: 'fadeIn 200ms ease-in-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#737373' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C89B1F' }} />
                You have unsaved changes in {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  background: '#171717',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  borderRadius: 12,
                  fontSize: 13.5,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(23, 23, 23, 0.15)',
                  transition: 'all 150ms ease',
                  opacity: isSaving ? 0.7 : 1
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

        </Card>
      </div>
    </PageShell>
  )
}
