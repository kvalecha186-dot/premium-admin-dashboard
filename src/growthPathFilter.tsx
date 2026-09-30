import React, { useState, useRef, useEffect, useMemo } from 'react'

// ── Starfix Growth Path Categories and Hierarchy (Requirement 3) ──────────────
export interface CategoryGroup {
  category: string
  paths: string[]
}

export const STARFIX_PATH_CATEGORIES: CategoryGroup[] = [
  {
    category: 'CODING & TECHNOLOGY',
    paths: [
      'Python',
      'Programming / Coding',
      'AI & Machine Learning',
      'Web Development / MERN',
      'Data Structures & Algorithms'
    ]
  },
  {
    category: 'COMMUNICATION & CAREER',
    paths: [
      'Communication Skills',
      'Public Speaking',
      'Interview Preparation',
      'Career Development'
    ]
  },
  {
    category: 'SELF-IMPROVEMENT',
    paths: [
      'Self-Confidence',
      'Discipline',
      'Productivity',
      'Time Management',
      'Personal Growth'
    ]
  },
  {
    category: 'MIND & WELLNESS',
    paths: [
      'Meditation',
      'Mental Wellness',
      'Stress Management',
      'Mindfulness'
    ]
  },
  {
    category: 'FITNESS & HEALTH',
    paths: [
      'Fitness',
      'Weight Loss',
      'Workout',
      'Healthy Lifestyle'
    ]
  },
  {
    category: 'CREATIVITY & HOBBIES',
    paths: [
      'Dance',
      'Creative Skills',
      'Other personal-interest paths'
    ]
  }
]

// All path titles flattened for quick lookups
export const ALL_GROWTH_PATHS = STARFIX_PATH_CATEGORIES.flatMap(c => c.paths)

// ── Helper to test word matches with boundaries ────────────────────────────────
function hasWord(text: string, pattern: string): boolean {
  if (!text || !pattern) return false
  const t = ' ' + text.toLowerCase().replace(/[^a-z0-9]/g, ' ') + ' '
  const p = ' ' + pattern.toLowerCase().replace(/[^a-z0-9]/g, ' ') + ' '
  return t.includes(p)
}

// ── Real database mapping rules for each Starfix growth path ───────────────────
interface PathRule {
  skills: string[]
  categories: string[]
  keywords: string[]
}

const PATH_RULES: Record<string, PathRule> = {
  'Python': {
    skills: ['python'],
    categories: [],
    keywords: ['python']
  },
  'Programming / Coding': {
    skills: ['python', 'react', 'system design', 'coding', 'software', 'programming'],
    categories: ['coding'],
    keywords: ['software engineer', 'programmer', 'developer', 'coding']
  },
  'AI & Machine Learning': {
    skills: ['pytorch', 'nlp', 'computer vision', 'machine learning', 'deep learning', 'tensorflow'],
    categories: ['ai/ml', 'ai', 'data science'],
    keywords: ['ml engineer', 'machine learning', 'artificial intelligence']
  },
  'Web Development / MERN': {
    skills: ['react', 'figma', 'design systems', 'system design', 'web', 'javascript'],
    categories: ['coding', 'ui/ux', 'webdev'],
    keywords: ['software engineer', 'ux designer', 'web developer']
  },
  'Data Structures & Algorithms': {
    skills: ['system design', 'python', 'dsa', 'algorithms'],
    categories: ['coding'],
    keywords: ['software engineer']
  },
  'Communication Skills': {
    skills: ['public speaking', 'storytelling', 'confidence', 'business english', 'ielts'],
    categories: ['communication', 'languages'],
    keywords: ['communication coach', 'ielts trainer']
  },
  'Public Speaking': {
    skills: ['public speaking', 'storytelling'],
    categories: ['communication'],
    keywords: ['communication coach', 'public speaking']
  },
  'Interview Preparation': {
    skills: ['public speaking', 'confidence', 'business english', 'ielts', 'interview'],
    categories: ['communication', 'languages'],
    keywords: ['communication coach', 'ielts trainer']
  },
  'Career Development': {
    skills: ['startup strategy', 'fundraising', 'gtm', 'brand building', 'investing', 'business english'],
    categories: ['entrepreneurship', 'finance', 'communication'],
    keywords: ['growth coach', 'financial planner']
  },
  'Self-Confidence': {
    skills: ['confidence', 'storytelling'],
    categories: ['communication'],
    keywords: ['communication coach', 'confidence']
  },
  'Discipline': {
    skills: ['strength training', 'breathwork', 'habits', 'discipline'],
    categories: ['fitness', 'meditation'],
    keywords: ['personal trainer']
  },
  'Productivity': {
    skills: ['startup strategy', 'gtm', 'productivity'],
    categories: ['entrepreneurship'],
    keywords: ['growth coach']
  },
  'Time Management': {
    skills: ['budgeting', 'startup strategy', 'time management'],
    categories: ['finance', 'entrepreneurship'],
    keywords: ['growth coach', 'financial planner']
  },
  'Personal Growth': {
    skills: ['brand building', 'confidence', 'investing', 'meditation'],
    categories: ['entrepreneurship', 'finance', 'content', 'meditation'],
    keywords: ['growth coach']
  },
  'Meditation': {
    skills: ['meditation', 'breathwork'],
    categories: ['meditation'],
    keywords: ['meditation']
  },
  'Mental Wellness': {
    skills: ['stress relief', 'breathwork', 'meditation'],
    categories: ['meditation'],
    keywords: ['mindfulness', 'wellness']
  },
  'Stress Management': {
    skills: ['stress relief', 'breathwork'],
    categories: ['meditation'],
    keywords: ['mindfulness coach', 'stress relief']
  },
  'Mindfulness': {
    skills: ['meditation', 'breathwork', 'stress relief'],
    categories: ['meditation'],
    keywords: ['mindfulness']
  },
  'Fitness': {
    skills: ['strength training', 'nutrition', 'fat loss', 'fitness'],
    categories: ['fitness'],
    keywords: ['personal trainer', 'fitness coach']
  },
  'Weight Loss': {
    skills: ['fat loss', 'nutrition', 'weight loss'],
    categories: ['fitness'],
    keywords: ['personal trainer']
  },
  'Workout': {
    skills: ['strength training', 'fat loss', 'workout'],
    categories: ['fitness'],
    keywords: ['personal trainer']
  },
  'Healthy Lifestyle': {
    skills: ['nutrition', 'strength training', 'fat loss', 'healthy'],
    categories: ['fitness'],
    keywords: ['personal trainer']
  },
  'Dance': {
    skills: ['dance', 'choreography'],
    categories: ['dance'],
    keywords: ['dance']
  },
  'Creative Skills': {
    skills: ['figma', 'design systems', 'instagram', 'youtube', 'brand building'],
    categories: ['ui/ux', 'content'],
    keywords: ['ux designer', 'content strategist']
  },
  'Other personal-interest paths': {
    skills: ['instagram', 'youtube', 'investing', 'ielts'],
    categories: ['content', 'finance', 'languages'],
    keywords: ['content strategist', 'financial planner']
  }
}

// ── Matcher: determines if a mentor is associated with a given path or category ─
export function isMentorAssociatedWithPath(mentor: any, filterValue: string): boolean {
  if (!filterValue || filterValue === 'All Growth Paths' || filterValue === 'All') {
    return true
  }

  // 1. If filterValue is a Category (e.g., 'CODING & TECHNOLOGY')
  const catGroup = STARFIX_PATH_CATEGORIES.find(
    c => c.category.toLowerCase() === filterValue.toLowerCase()
  )
  if (catGroup) {
    return catGroup.paths.some(p => isMentorAssociatedWithPath(mentor, p))
  }

  // 2. Direct attribute checks on the mentor record
  const cat = (mentor.category || '').toLowerCase()
  const hl = (mentor.headline || '').toLowerCase()
  const bio = (mentor.bio || '').toLowerCase()
  const approach = (mentor.mentoring_approach || '').toLowerCase()
  const allSkills = (mentor.skills || []).map((s: string) => s.toLowerCase())

  // Direct match with mentor.growth_path or mentor.path if present
  if (mentor.growth_path && hasWord(mentor.growth_path, filterValue)) return true
  if (mentor.path && hasWord(mentor.path, filterValue)) return true

  // Check rule table
  const rule = PATH_RULES[filterValue]
  if (rule) {
    if (rule.categories.some(c => cat === c || hasWord(cat, c))) return true
    if (rule.skills.some(rs => allSkills.some((as: string) => hasWord(as, rs) || hasWord(rs, as)))) return true
    if (rule.keywords.some(kw => hasWord(hl, kw) || hasWord(bio, kw) || hasWord(approach, kw))) return true
  }

  // Fallback: direct match on filterValue words in skills or category
  if (allSkills.some((as: string) => hasWord(as, filterValue))) return true
  if (hasWord(cat, filterValue)) return true

  return false
}

// ── Helper to resolve primary growth path title for a mentor ──────────────────
export function getMentorPrimaryPath(mentor: any): string {
  for (const group of STARFIX_PATH_CATEGORIES) {
    for (const path of group.paths) {
      const rule = PATH_RULES[path]
      if (rule) {
        const cat = (mentor.category || '').toLowerCase()
        const allSkills = (mentor.skills || []).map((s: string) => s.toLowerCase())
        if (rule.skills.some(rs => allSkills.some((as: string) => hasWord(as, rs)))) return path
        if (rule.categories.some(c => cat === c)) return path
      }
    }
  }
  return mentor.category || 'General Mentorship'
}

// ── Matcher for Learners / Users ──────────────────────────────────────────────
export function isLearnerAssociatedWithPath(user: any, filterValue: string): boolean {
  if (!filterValue || filterValue === 'All Growth Paths' || filterValue === 'All') return true

  const catGroup = STARFIX_PATH_CATEGORIES.find(
    c => c.category.toLowerCase() === filterValue.toLowerCase()
  )
  if (catGroup) {
    return catGroup.paths.some(p => isLearnerAssociatedWithPath(user, p))
  }

  const p = (user.path || '').toLowerCase()
  const c = (user.category || '').toLowerCase()
  const g = (user.goal || '').toLowerCase()

  if (hasWord(p, filterValue) || hasWord(c, filterValue) || hasWord(g, filterValue)) return true

  const rule = PATH_RULES[filterValue]
  if (rule) {
    if (rule.skills.some(rs => hasWord(p, rs) || hasWord(g, rs))) return true
    if (rule.categories.some(rc => hasWord(c, rc) || hasWord(p, rc))) return true
  }

  return false
}

// ── Matcher for Bookings ──────────────────────────────────────────────────────
export function isBookingAssociatedWithPath(booking: any, filterValue: string, mentors: any[] = []): boolean {
  if (!filterValue || filterValue === 'All Growth Paths' || filterValue === 'All') return true

  // Check matching mentor
  const mentor = mentors.find(m => m.id === booking.mentor_id || m.name === booking.mentor_name)
  if (mentor && isMentorAssociatedWithPath(mentor, filterValue)) return true

  // Check session_type, mentor_title, notes
  const text = `${booking.session_type || ''} ${booking.mentor_title || ''} ${booking.notes || ''}`
  return hasWord(text, filterValue)
}

// ── GrowthPathDropdown Component ──────────────────────────────────────────────
export interface GrowthPathDropdownProps {
  value: string
  onChange: (path: string) => void
  label?: string
  width?: number | string
  allowCategories?: boolean
}

export function GrowthPathDropdown({
  value,
  onChange,
  label = 'Select Growth Path',
  width = 280,
  allowCategories = true
}: GrowthPathDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-focus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 60)
    } else {
      setSearch('')
    }
  }, [open])

  // Filtered categories and paths based on search
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return STARFIX_PATH_CATEGORIES
    const q = search.toLowerCase()
    return STARFIX_PATH_CATEGORIES.map(group => {
      const catMatches = group.category.toLowerCase().includes(q)
      const matchingPaths = group.paths.filter(p => p.toLowerCase().includes(q))
      if (catMatches) return group
      if (matchingPaths.length) return { ...group, paths: matchingPaths }
      return null
    }).filter(Boolean) as CategoryGroup[]
  }, [search])

  const totalResults = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.paths.length, 0)
  }, [filteredGroups])

  const isAll = !value || value === 'All Growth Paths' || value === 'All'

  return (
    <div ref={containerRef} style={{ position: 'relative', width }}>
      {label && (
        <div style={{ fontSize: 11, fontWeight: 600, color: '#8A90AB', marginBottom: 6, letterSpacing: '.04em' }}>
          {label}
        </div>
      )}

      {/* Dropdown trigger button */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          height: 40,
          padding: '0 13px',
          borderRadius: 10,
          background: 'linear-gradient(160deg, rgba(22,32,72,0.85) 0%, rgba(10,15,36,0.92) 100%)',
          border: open ? '1px solid #D4AF37' : '1px solid rgba(212,175,55,0.25)',
          color: '#F7EFD8',
          fontSize: 13,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: open
            ? '0 0 0 3px rgba(212,175,55,0.18), 0 8px 24px rgba(0,0,0,0.5)'
            : '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 180ms ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, overflow: 'hidden' }}>
          <span style={{ color: isAll ? '#8A90AB' : '#F4D67A', fontSize: 14 }}>✦</span>
          <span
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: isAll ? '#9AA0BA' : '#F7EFD8',
              fontWeight: isAll ? 400 : 600
            }}
          >
            {isAll ? 'All Growth Paths' : value}
          </span>
        </div>

        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke={open ? '#F4D67A' : '#8A90AB'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
            flexShrink: 0,
            marginLeft: 8
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown Menu Popover */}
      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: Math.max(300, typeof width === 'number' ? width : 300),
            maxWidth: '90vw',
            maxHeight: 380,
            background: 'linear-gradient(180deg, #0B112C 0%, #06091A 100%)',
            border: '1px solid rgba(212,175,55,0.32)',
            borderRadius: 14,
            boxShadow: '0 20px 48px rgba(0,0,0,0.85), 0 0 30px rgba(212,175,55,0.14)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'sxRise 160ms ease-out forwards'
          }}
        >
          {/* Search box */}
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid rgba(212,175,55,0.16)',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(212,175,55,0.22)',
                borderRadius: 8,
                padding: '6px 10px'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A90AB" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search growth paths..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 0,
                  outline: 'none',
                  color: '#F7EFD8',
                  fontSize: 12.5
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    background: 'transparent',
                    border: 0,
                    color: '#8A90AB',
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: 0
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
            {/* All Growth Paths option */}
            {!search && (
              <button
                type="button"
                onClick={() => {
                  onChange('All Growth Paths')
                  setOpen(false)
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: 0,
                  background: isAll ? 'rgba(212,175,55,0.18)' : 'transparent',
                  color: isAll ? '#F4D67A' : '#F7EFD8',
                  fontSize: 13,
                  fontWeight: isAll ? 600 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginBottom: 6,
                  transition: 'background 120ms'
                }}
                onMouseEnter={e => {
                  if (!isAll) e.currentTarget.style.background = 'rgba(212,175,55,0.08)'
                }}
                onMouseLeave={e => {
                  if (!isAll) e.currentTarget.style.background = 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: isAll ? '#F4D67A' : '#8A90AB' }}>✦</span>
                  <span>All Growth Paths</span>
                </div>
                {isAll && <span style={{ color: '#F4D67A', fontSize: 13 }}>✓</span>}
              </button>
            )}

            {filteredGroups.map(group => (
              <div key={group.category} style={{ marginBottom: 12 }}>
                {/* Category header / clickable category selector */}
                <div
                  onClick={() => {
                    if (allowCategories) {
                      onChange(group.category)
                      setOpen(false)
                    }
                  }}
                  style={{
                    padding: '6px 10px',
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '.06em',
                    color: value === group.category ? '#F4D67A' : '#D4AF37',
                    background: value === group.category ? 'rgba(212,175,55,0.14)' : 'transparent',
                    borderRadius: 6,
                    cursor: allowCategories ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 4,
                    marginBottom: 3
                  }}
                  title={allowCategories ? `Filter by entire category: ${group.category}` : undefined}
                >
                  <span>{group.category}</span>
                  {allowCategories && (
                    <span style={{ fontSize: 10, color: '#8A90AB', fontWeight: 400 }}>
                      {value === group.category ? '✓ Selected' : `${group.paths.length} paths`}
                    </span>
                  )}
                </div>

                {/* Individual paths */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {group.paths.map(p => {
                    const isSelected = value === p
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          onChange(p)
                          setOpen(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 12px 7px 18px',
                          borderRadius: 7,
                          border: 0,
                          background: isSelected ? 'rgba(212,175,55,0.18)' : 'transparent',
                          color: isSelected ? '#F4D67A' : '#C7CDDF',
                          fontSize: 12.5,
                          fontWeight: isSelected ? 600 : 400,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 120ms'
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) e.currentTarget.style.background = 'rgba(212,175,55,0.08)'
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                          <span
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              background: isSelected ? '#F4D67A' : 'rgba(212,175,55,0.4)',
                              flexShrink: 0
                            }}
                          />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p}
                          </span>
                        </div>
                        {isSelected && <span style={{ color: '#F4D67A', fontSize: 12 }}>✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {totalResults === 0 && (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: '#8A90AB', fontSize: 12.5 }}>
                No growth paths found matching "{search}".
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── MentorDropdown Component (Dependent on selected growth path) ───────────────
export interface MentorDropdownProps {
  mentors: any[]
  selectedMentorId: string
  onChange: (mentorId: string) => void
  label?: string
  width?: number | string
}

export function MentorDropdown({
  mentors,
  selectedMentorId,
  onChange,
  label = 'Select Mentor',
  width = 260
}: MentorDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 60)
    } else {
      setSearch('')
    }
  }, [open])

  const selectedMentor = mentors.find(m => m.id === selectedMentorId)
  const isAll = !selectedMentorId || selectedMentorId === 'all'

  const filteredMentors = useMemo(() => {
    if (!search.trim()) return mentors
    const q = search.toLowerCase()
    return mentors.filter(m =>
      (m.name + ' ' + (m.category || '') + ' ' + (m.headline || '')).toLowerCase().includes(q)
    )
  }, [mentors, search])

  return (
    <div ref={containerRef} style={{ position: 'relative', width }}>
      {label && (
        <div style={{ fontSize: 11, fontWeight: 600, color: '#8A90AB', marginBottom: 6, letterSpacing: '.04em' }}>
          {label}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          height: 40,
          padding: '0 13px',
          borderRadius: 10,
          background: 'linear-gradient(160deg, rgba(22,32,72,0.85) 0%, rgba(10,15,36,0.92) 100%)',
          border: open ? '1px solid #D4AF37' : '1px solid rgba(212,175,55,0.25)',
          color: '#F7EFD8',
          fontSize: 13,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: open
            ? '0 0 0 3px rgba(212,175,55,0.18), 0 8px 24px rgba(0,0,0,0.5)'
            : '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 180ms ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, overflow: 'hidden' }}>
          {selectedMentor ? (
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${selectedMentor.color || '#6366F1'}, #0A0E1F)`,
                display: 'grid',
                placeItems: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0
              }}
            >
              {selectedMentor.name.charAt(0)}
            </div>
          ) : (
            <span style={{ color: '#8A90AB', fontSize: 13 }}>👥</span>
          )}
          <span
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: isAll ? '#9AA0BA' : '#F7EFD8',
              fontWeight: isAll ? 400 : 600
            }}
          >
            {selectedMentor ? selectedMentor.name : 'All Mentors'}
          </span>
        </div>

        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke={open ? '#F4D67A' : '#8A90AB'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
            flexShrink: 0,
            marginLeft: 8
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Menu Popover */}
      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: Math.max(280, typeof width === 'number' ? width : 280),
            maxWidth: '90vw',
            maxHeight: 340,
            background: 'linear-gradient(180deg, #0B112C 0%, #06091A 100%)',
            border: '1px solid rgba(212,175,55,0.32)',
            borderRadius: 14,
            boxShadow: '0 20px 48px rgba(0,0,0,0.85), 0 0 30px rgba(212,175,55,0.14)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'sxRise 160ms ease-out forwards'
          }}
        >
          {/* Search box if more than 4 mentors */}
          {mentors.length > 4 && (
            <div
              style={{
                padding: '10px 12px',
                borderBottom: '1px solid rgba(212,175,55,0.16)',
                background: 'rgba(255,255,255,0.02)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(212,175,55,0.22)',
                  borderRadius: 8,
                  padding: '6px 10px'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A90AB" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter mentor by name..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 0,
                    outline: 'none',
                    color: '#F7EFD8',
                    fontSize: 12.5
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
            {/* All Mentors option */}
            <button
              type="button"
              onClick={() => {
                onChange('all')
                setOpen(false)
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: 0,
                background: isAll ? 'rgba(212,175,55,0.18)' : 'transparent',
                color: isAll ? '#F4D67A' : '#F7EFD8',
                fontSize: 13,
                fontWeight: isAll ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: 4,
                transition: 'background 120ms'
              }}
              onMouseEnter={e => {
                if (!isAll) e.currentTarget.style.background = 'rgba(212,175,55,0.08)'
              }}
              onMouseLeave={e => {
                if (!isAll) e.currentTarget.style.background = 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span>👥</span>
                <span>All Mentors ({mentors.length})</span>
              </div>
              {isAll && <span style={{ color: '#F4D67A', fontSize: 13 }}>✓</span>}
            </button>

            {filteredMentors.map(m => {
              const isSelected = selectedMentorId === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onChange(m.id)
                    setOpen(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 0,
                    background: isSelected ? 'rgba(212,175,55,0.18)' : 'transparent',
                    color: isSelected ? '#F4D67A' : '#E2E6F2',
                    fontSize: 13,
                    fontWeight: isSelected ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginBottom: 2,
                    transition: 'background 120ms'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(212,175,55,0.08)'
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${m.color || '#6366F1'}, #0A0E1F)`,
                        border: '1px solid rgba(212,175,55,0.3)',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#fff',
                        flexShrink: 0
                      }}
                    >
                      {m.name.charAt(0)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {m.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#8A90AB' }}>
                        {m.category || getMentorPrimaryPath(m)}
                      </div>
                    </div>
                  </div>
                  {isSelected && <span style={{ color: '#F4D67A', fontSize: 13 }}>✓</span>}
                </button>
              )
            })}

            {filteredMentors.length === 0 && (
              <div style={{ padding: '20px 12px', textAlign: 'center', color: '#8A90AB', fontSize: 12 }}>
                No mentors found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
