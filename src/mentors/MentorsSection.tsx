// ── Mentor Intelligence — Section Router ──────────────────────────────────────
// Replaces the flat mentor table with category-based mentor management:
// categories -> path analytics (mentors ranked by performance) -> full mentor profile.

import { useState } from 'react'
import CategoriesView from './CategoriesView'
import PathAnalyticsView from './PathAnalyticsView'
import MentorProfileView from './MentorProfileView'

type MentorsView =
  | { type: 'categories' }
  | { type: 'path'; pathId: string }
  | { type: 'profile'; mentorId: string; pathId: string }

export default function MentorsSection() {
  const [view, setView] = useState<MentorsView>({ type: 'categories' })

  if (view.type === 'categories') {
    return <CategoriesView onSelectPath={pathId => setView({ type: 'path', pathId })} />
  }

  if (view.type === 'path') {
    return (
      <PathAnalyticsView
        pathId={view.pathId}
        onBack={() => setView({ type: 'categories' })}
        onSelectMentor={mentorId => setView({ type: 'profile', mentorId, pathId: view.pathId })}
      />
    )
  }

  return (
    <MentorProfileView
      mentorId={view.mentorId}
      onBack={() => setView({ type: 'path', pathId: view.pathId })}
    />
  )
}
