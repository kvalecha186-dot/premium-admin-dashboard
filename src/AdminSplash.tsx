import { useEffect, useState } from 'react'

export default function AdminSplash({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setExiting(true), 1900)
    const hideTimer = window.setTimeout(() => setVisible(false), 2450)
    return () => { window.clearTimeout(exitTimer); window.clearTimeout(hideTimer) }
  }, [])

  if (!visible) return <>{children}</>

  return (
    <div className={`admin-splash ${exiting ? 'admin-splash-exit' : ''}`}>
      <div className="splash-glow splash-glow-one" />
      <div className="splash-glow splash-glow-two" />
      <div className="splash-logo-wrap">
        <div className="splash-mark">
          <span className="splash-s">S</span>
          <span className="splash-star">✦</span>
        </div>
        <div className="splash-name">Starfix</div>
        <div className="splash-subtitle">GROWTH OPERATIONS</div>
        <div className="splash-loader"><span /></div>
      </div>
    </div>
  )
}
