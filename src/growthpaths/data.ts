// ── Growth Paths — Data Layer ─────────────────────────────────────────────────
// All 58 Starfix growth paths across the five life categories, plus deterministic
// generators for the richer drawer content (roadmap, mentors, resources, analytics).

export type CategoryId = 'career' | 'health' | 'mindset' | 'personal' | 'student'

export const CATEGORIES: { id: CategoryId; name: string; icon: string }[] = [
  { id: 'career', name: 'Career & Tech', icon: 'briefcase' },
  { id: 'health', name: 'Health & Fitness', icon: 'activity' },
  { id: 'mindset', name: 'Mindset', icon: 'target' },
  { id: 'personal', name: 'Personal Life', icon: 'users' },
  { id: 'student', name: 'Student Life', icon: 'graduationCap' },
]

export function categoryName(id: CategoryId): string {
  return CATEGORIES.find(c => c.id === id)?.name ?? id
}
export function categoryIcon(id: CategoryId): string {
  return CATEGORIES.find(c => c.id === id)?.icon ?? 'layers'
}

type PathSeed = { name: string; categoryId: CategoryId; description: string }

const PATH_SEEDS: PathSeed[] = [
  // ── Career & Tech (15) ──
  { name: 'Coding', categoryId: 'career', description: 'Learn programming fundamentals and build real projects from scratch.' },
  { name: 'Web Development', categoryId: 'career', description: 'Design and build modern, responsive websites end to end.' },
  { name: 'App Development', categoryId: 'career', description: 'Build and ship native and cross-platform mobile apps.' },
  { name: 'AI & Machine Learning', categoryId: 'career', description: 'Master machine learning models and deploy real AI systems.' },
  { name: 'Data Science', categoryId: 'career', description: 'Turn raw data into insights with statistics and Python.' },
  { name: 'Cyber Security', categoryId: 'career', description: 'Defend systems and networks against real-world threats.' },
  { name: 'Cloud Computing', categoryId: 'career', description: 'Architect and deploy scalable infrastructure on the cloud.' },
  { name: 'DevOps', categoryId: 'career', description: 'Automate deployment pipelines and manage production systems.' },
  { name: 'UI/UX Design', categoryId: 'career', description: 'Craft intuitive, beautiful digital product experiences.' },
  { name: 'System Design', categoryId: 'career', description: 'Design large-scale systems that scale to millions of users.' },
  { name: 'DSA', categoryId: 'career', description: 'Master data structures and algorithms for technical interviews.' },
  { name: 'Product Management', categoryId: 'career', description: 'Lead product strategy from idea to successful launch.' },
  { name: 'Digital Marketing', categoryId: 'career', description: 'Grow brands with performance marketing and analytics.' },
  { name: 'Content Creation', categoryId: 'career', description: 'Build an audience with compelling video and written content.' },
  { name: 'Freelancing', categoryId: 'career', description: 'Turn your skills into a thriving independent career.' },
  // ── Health & Fitness (12) ──
  { name: 'Weight Loss', categoryId: 'health', description: 'Sustainable fat loss through nutrition and smart training.' },
  { name: 'Muscle Gain', categoryId: 'health', description: 'Build lean muscle with structured progressive overload.' },
  { name: 'Home Workout', categoryId: 'health', description: 'Full-body training routines with zero equipment needed.' },
  { name: 'Gym Training', categoryId: 'health', description: 'Structured strength programming for the gym floor.' },
  { name: 'Yoga', categoryId: 'health', description: 'Build flexibility, breath control, and inner calm.' },
  { name: 'Flexibility & Mobility', categoryId: 'health', description: 'Restore range of motion and prevent injury.' },
  { name: 'Running', categoryId: 'health', description: 'Train for your first 5K through to marathon distance.' },
  { name: 'Nutrition Basics', categoryId: 'health', description: 'Understand macros, calories, and eating for your goals.' },
  { name: 'Healthy Eating', categoryId: 'health', description: 'Build sustainable, enjoyable everyday eating habits.' },
  { name: 'Sleep Optimization', categoryId: 'health', description: 'Improve sleep quality for better recovery and focus.' },
  { name: 'Posture Improvement', categoryId: 'health', description: 'Correct posture imbalances from daily desk work.' },
  { name: 'Energy & Stamina', categoryId: 'health', description: 'Build lasting daily energy through movement and habits.' },
  // ── Mindset (10) ──
  { name: 'Meditation', categoryId: 'mindset', description: 'Build a daily practice for calm, clarity, and presence.' },
  { name: 'Mental Wellness', categoryId: 'mindset', description: 'Practical tools for everyday emotional wellbeing.' },
  { name: 'Stress Management', categoryId: 'mindset', description: 'Techniques to regulate stress in high-pressure moments.' },
  { name: 'Confidence Building', categoryId: 'mindset', description: 'Develop unshakable self-belief in any situation.' },
  { name: 'Self Discipline', categoryId: 'mindset', description: 'Build the willpower to follow through on your goals.' },
  { name: 'Deep Work', categoryId: 'mindset', description: 'Train sustained, distraction-free focus for real output.' },
  { name: 'Focus Improvement', categoryId: 'mindset', description: 'Sharpen attention and reduce mental scatter daily.' },
  { name: 'Habit Building', categoryId: 'mindset', description: 'Design habits that stick using proven behavior science.' },
  { name: 'Overthinking Control', categoryId: 'mindset', description: 'Quiet the noise and think with more clarity.' },
  { name: 'Emotional Intelligence', categoryId: 'mindset', description: 'Understand and manage emotions in yourself and others.' },
  // ── Personal Life (11) ──
  { name: 'Communication Skills', categoryId: 'personal', description: 'Speak clearly and connect in any conversation.' },
  { name: 'Public Speaking', categoryId: 'personal', description: 'Present with confidence in front of any audience.' },
  { name: 'English Fluency', categoryId: 'personal', description: 'Speak fluent, natural English with real confidence.' },
  { name: 'Storytelling', categoryId: 'personal', description: 'Craft stories that captivate and persuade any audience.' },
  { name: 'Relationship Skills', categoryId: 'personal', description: 'Build deeper, healthier relationships in your life.' },
  { name: 'Social Confidence', categoryId: 'personal', description: 'Feel at ease and confident in any social setting.' },
  { name: 'Personal Branding', categoryId: 'personal', description: 'Build a personal brand that opens real opportunities.' },
  { name: 'Financial Basics', categoryId: 'personal', description: 'Master budgeting, saving, and everyday money decisions.' },
  { name: 'Time Management', categoryId: 'personal', description: 'Take control of your schedule and priorities.' },
  { name: 'Productivity Systems', categoryId: 'personal', description: 'Design a personal system that actually gets things done.' },
  { name: 'Life Planning', categoryId: 'personal', description: 'Map out a clear, intentional path for your future.' },
  // ── Student Life (10) ──
  { name: 'Exam Preparation', categoryId: 'student', description: 'Structured strategies to prepare for major exams.' },
  { name: 'Study Techniques', categoryId: 'student', description: 'Learn faster and retain more with proven methods.' },
  { name: 'Note Taking', categoryId: 'student', description: 'Capture and organize information that sticks.' },
  { name: 'College Success', categoryId: 'student', description: 'Navigate college academics and life with confidence.' },
  { name: 'Internship Preparation', categoryId: 'student', description: 'Land and excel in your first internship.' },
  { name: 'Resume Building', categoryId: 'student', description: 'Craft a resume that gets you noticed.' },
  { name: 'Interview Preparation', categoryId: 'student', description: 'Ace interviews with structured practice and feedback.' },
  { name: 'Scholarship Preparation', categoryId: 'student', description: 'Build a standout scholarship application.' },
  { name: 'Hackathon Preparation', categoryId: 'student', description: 'Prepare to build and pitch under pressure.' },
  { name: 'Career Exploration', categoryId: 'student', description: 'Discover the right career path for you.' },
]

export const FLAGSHIP_NAMES = new Set([
  'Coding', 'AI & Machine Learning', 'Communication Skills', 'Weight Loss', 'Meditation',
  'Self Discipline', 'English Fluency', 'Interview Preparation', 'UI/UX Design',
  'Time Management', 'Deep Work', 'Study Techniques',
])

// ── Deterministic derived data (no external randomness) ────────────────────

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'
const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced']
const DURATIONS = ['4 Weeks', '6 Weeks', '8 Weeks', '10 Weeks', '12 Weeks']
const DURATION_WEEKS = [4, 6, 8, 10, 12]

const MENTOR_POOL = [
  { name: 'Ryan Whitfield', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces', rating: 4.93 },
  { name: 'Priya Kapoor', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces', rating: 4.81 },
  { name: 'Dr. Wen Zhao', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces', rating: 4.97 },
  { name: 'Daniel Osei', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces', rating: 4.74 },
  { name: 'Isabella Marchetti', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=faces', rating: 4.95 },
  { name: 'Noah Bennett', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces', rating: 4.68 },
  { name: 'Marcus Vance', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=faces', rating: 4.91 },
  { name: 'Dr. Elena Rostova', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces', rating: 4.86 },
  { name: 'Sofia Chen', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces', rating: 4.82 },
  { name: 'Grace Okafor', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop&crop=faces', rating: 4.77 },
  { name: 'Dr. Julian Thorne', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', rating: 4.98 },
  { name: 'Aisha Patel', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=faces', rating: 4.88 },
]

const SKILL_TEMPLATES = ['Core Fundamentals', 'Practical Application', 'Daily Consistency', 'Progress Tracking', 'Advanced Technique', 'Real-World Practice']
const CHALLENGE_TEMPLATES = ['7-Day Kickstart Challenge', '30-Day Consistency Challenge', 'Community Accountability Sprint']
const RESOURCE_CHANNELS = ['Starfix Learning', 'The Skill Lab', 'Growth Weekly', 'Mastery Hub', 'Practical Path']
const RESOURCE_TITLES = ['Getting Started Guide', 'Common Mistakes to Avoid', 'Deep Dive Masterclass', 'Beginner to Confident in 30 Days']
const TAG_POOL = ['Beginner Friendly', 'Self-Paced', 'Mentor Led', 'High Demand', 'Community Driven', 'Certificate Included']

export type GrowthPath = {
  id: string
  name: string
  categoryId: CategoryId
  category: string
  description: string
  flagship: boolean
  icon: string
  difficulty: Difficulty
  duration: string
  durationWeeks: number
  learners: number
  completionRate: number
  mentorsCount: number
  published: boolean
  updatedThisMonth: boolean
  updatedLabel: string
  // Drawer content
  fullDescription: string
  roadmap: { week: number; title: string; focus: string }[]
  skills: string[]
  linkedMentors: { name: string; avatar: string; rating: number }[]
  resources: { title: string; channel: string; duration: string }[]
  challenges: { title: string; participants: number }[]
  completionTrend: number[]
  tags: string[]
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const RAW_PATHS: Omit<GrowthPath, 'updatedThisMonth' | 'updatedLabel' | 'published'>[] = PATH_SEEDS.map((seed, idx) => {
  const h = hash(seed.name)
  const difficulty = DIFFICULTIES[h % 3]
  const durationIdx = h % DURATIONS.length
  const duration = DURATIONS[durationIdx]
  const durationWeeks = DURATION_WEEKS[durationIdx]
  const learners = 150 + (h % 2050)
  const completionRate = 52 + (h % 44)
  const mentorsCount = 1 + (h % 9)
  const flagship = FLAGSHIP_NAMES.has(seed.name)

  const skills = [0, 1, 2, 3].map(i => `${SKILL_TEMPLATES[(h + i * 7) % SKILL_TEMPLATES.length]} in ${seed.name}`)
  const linkedMentors = [0, 1, 2].map(i => MENTOR_POOL[(h + i * 5) % MENTOR_POOL.length])
  const resources = [0, 1, 2].map(i => ({
    title: `${seed.name}: ${RESOURCE_TITLES[(h + i * 3) % RESOURCE_TITLES.length]}`,
    channel: RESOURCE_CHANNELS[(h + i * 11) % RESOURCE_CHANNELS.length],
    duration: `${6 + ((h + i * 4) % 24)} min`,
  }))
  const challenges = [0, 1].map(i => ({
    title: CHALLENGE_TEMPLATES[(h + i * 9) % CHALLENGE_TEMPLATES.length],
    participants: 40 + ((h + i * 17) % 900),
  }))
  const completionTrend = [0, 1, 2, 3, 4, 5].map(i =>
    Math.max(10, Math.min(100, Math.round(completionRate - 18 + i * 4 + ((h + i * 13) % 9))))
  )
  const roadmap = Array.from({ length: Math.min(durationWeeks, 8) }, (_, i) => ({
    week: i + 1,
    title: i === 0 ? `Week 1: ${seed.name} Foundations` : i === durationWeeks - 1 || i === Math.min(durationWeeks, 8) - 1
      ? `Week ${i + 1}: Capstone & Review`
      : `Week ${i + 1}: ${SKILL_TEMPLATES[(h + i * 6) % SKILL_TEMPLATES.length]}`,
    focus: i === 0
      ? `Build core understanding and set up your ${seed.name.toLowerCase()} practice.`
      : `Layer in ${SKILL_TEMPLATES[(h + i * 6) % SKILL_TEMPLATES.length].toLowerCase()} with guided mentor feedback.`,
  }))
  const tags = [0, 1, 2].map(i => TAG_POOL[(h + i * 5) % TAG_POOL.length]).filter((t, i, arr) => arr.indexOf(t) === i)

  return {
    id: `gp-${slugify(seed.name)}`,
    name: seed.name,
    categoryId: seed.categoryId,
    category: categoryName(seed.categoryId),
    description: seed.description,
    flagship,
    icon: categoryIcon(seed.categoryId),
    difficulty,
    duration,
    durationWeeks,
    learners,
    completionRate,
    mentorsCount,
    fullDescription: `${seed.description} This path blends structured lessons, hands-on practice, and live mentor support so you build real, lasting capability in ${seed.name.toLowerCase()} — not just theory.`,
    roadmap,
    skills,
    linkedMentors,
    resources,
    challenges,
    completionTrend,
    tags: tags.length ? tags : [TAG_POOL[h % TAG_POOL.length]],
  }
})

// Mark exactly 18 paths as "updated this month" (deterministic, lowest hash values)
const sortedByHash = [...RAW_PATHS].sort((a, b) => hash(a.name) - hash(b.name))
const updatedThisMonthIds = new Set(sortedByHash.slice(0, 18).map(p => p.id))
const RECENT_LABELS = ['Updated today', 'Updated 2 days ago', 'Updated 5 days ago', 'Updated 1 week ago']
const OLDER_LABELS = ['Updated 3 weeks ago', 'Updated 1 month ago', 'Updated 2 months ago', 'Updated 3 months ago']

export const GROWTH_PATHS: GrowthPath[] = RAW_PATHS.map((p, i) => {
  const h = hash(p.name)
  const updatedThisMonth = updatedThisMonthIds.has(p.id)
  return {
    ...p,
    updatedThisMonth,
    updatedLabel: updatedThisMonth ? RECENT_LABELS[h % RECENT_LABELS.length] : OLDER_LABELS[h % OLDER_LABELS.length],
    published: h % 11 !== 0, // a small handful start unpublished
  }
})

export const SUMMARY = {
  totalPaths: GROWTH_PATHS.length,
  flagshipPaths: GROWTH_PATHS.filter(p => p.flagship).length,
  activeMentors: 41,
  avgCompletion: 67,
  updatedThisMonth: GROWTH_PATHS.filter(p => p.updatedThisMonth).length,
}

export function getPath(id: string): GrowthPath | undefined {
  return GROWTH_PATHS.find(p => p.id === id)
}
