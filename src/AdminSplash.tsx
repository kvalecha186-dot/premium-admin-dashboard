import { useEffect, useRef, useState } from 'react'

export default function AdminSplash({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)
  const reducedMotionRef = useRef(false)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    reducedMotionRef.current = reducedMotion

    document.body.style.overflow = 'hidden'

    if (reducedMotion) {
      // Skip the animated sequence entirely; keep only a brief, static brand moment.
      const hideTimer = window.setTimeout(() => {
        setVisible(false)
        document.body.style.overflow = ''
      }, 250)
      return () => window.clearTimeout(hideTimer)
    }

    const exitTimer = window.setTimeout(() => setExiting(true), 1900)
    const hideTimer = window.setTimeout(() => {
      setVisible(false)
      document.body.style.overflow = ''
    }, 2450)
    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(hideTimer)
      document.body.style.overflow = ''
    }
  }, [])

  // The dashboard tree is always mounted so auth checks and data fetching
  // start immediately, in parallel with the splash animation. The splash is
  // just a fixed overlay on top of it until it fades away.
  return (
    <>
      {children}
      {visible && (
        <div
          className={`admin-splash ${exiting ? 'admin-splash-exit' : ''} ${reducedMotionRef.current ? 'admin-splash-static' : ''}`}
          role="status"
          aria-label="Loading Starfix Admin"
        >
          <div className="splash-glow splash-glow-one" />
          <div className="splash-glow splash-glow-two" />
          <div className="splash-logo-wrap">
            <div className="splash-mark">
              <span className="splash-s">S</span>
              <span className="splash-star">✦</span>
            </div>
            <div className="splash-name">Starfix</div>
            <div className="splash-subtitle">ADMIN</div>
            <div className="splash-loader"><span /></div>
          </div>
        </div>
      )}
    </>
  )
}
