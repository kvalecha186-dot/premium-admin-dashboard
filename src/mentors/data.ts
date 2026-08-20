// ── Mentor Intelligence — Data Layer ──────────────────────────────────────────
// Category-based mentor management: growth paths, mentors, and derived metrics
// (performance score, session analytics, active client rosters, activity feed).
//
// 20 realistic Starfix growth paths x 5-6 mentors each (~105 mentors total).
// All mentor/path records are generated deterministically from hashed seeds so
// re-running the app always yields the same, internally-consistent dataset —
// no two mentors share a name, and every derived metric (completion, placement,
// capacity) is computed from the underlying mentor roster rather than hand-typed,
// so path-level and mentor-level numbers never contradict each other.

export const theme = {
  bg: '#FAF8F4',
  white: '#FFFFFF',
  border: '#ECE7DF',
  text: '#171717',
  textSecondary: '#525252',
  textMuted: '#737373',
  textFaint: '#8E8E93',
  gold: '#C89B1F',
  goldBg: '#F7F2E7',
  green: '#166534',
  greenBg: '#F0FDF4',
  amber: '#92400E',
  amberBg: '#FFFBEB',
  red: '#B91C1C',
  redBg: '#FEF2F2',
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface GrowthPath {
  id: string
  name: string
  icon: string
  description: string
  totalLearners: number
  activeLearners: number
  trend: number // monthly growth %
  category: Category
}

export const CATEGORIES = ['Career & Tech', 'Health & Fitness', 'Mindset', 'Personal Life', 'Student Life'] as const
export type Category = typeof CATEGORIES[number]

export interface MentorClient {
  name: string
  avatar: string
  path: string
  progress: number
  status: 'On Track' | 'Needs Attention' | 'Completed'
}

export interface SessionNote {
  date: string
  title: string
  note: string
}

export interface ActivityItem {
  date: string
  text: string
}

export interface MonthlySessions {
  month: string
  sessions: number
}

export interface CareerStop {
  role: string
  org: string
  period: string
}

export interface Review {
  learnerName: string
  rating: number
  text: string
  date: string
}

export interface MentorBase {
  id: string
  name: string
  avatar: string
  pathId: string
  title: string
  company: string
  expertise: string[]
  rating: number
  sessions: number
  activeClients: number
  availableSlots: number
  successRate: number
  completionRate: number
  placementRate: number
  retentionRate: number
  responseTimeMinutes: number
  experienceYears: number
  verified: boolean
  languages: string[]
  qualifications: string[]
  certifications: string[]
  skills: string[]
  earningsTotal: number
  earningsMonth: number
  bio: string
  availableDays: boolean[] // Mon..Sun
  availableHours: string
  availabilityLabel: string
}

export interface Mentor extends MentorBase {
  performanceScore: number
  clients: MentorClient[]
  sessionNotes: SessionNote[]
  activity: ActivityItem[]
  sessionAnalytics: MonthlySessions[]
  careerHistory: CareerStop[]
  reviews: Review[]
}

// ── Deterministic hashing helpers ────────────────────────────────────────────

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset) % arr.length]
}

function range(seed: number, min: number, max: number): number {
  return min + (seed % (max - min + 1))
}

// ── Growth Path catalogue (18-20 real Starfix career paths) ─────────────────
// totalLearners / activeLearners / trend are the only hand-set numbers per path;
// completion, placement, capacity and mentor counts are all derived from the
// generated mentor roster below, so the two layers can never drift apart.

interface PathSeed {
  id: string
  name: string
  icon: string
  description: string
  totalLearners: number
  activeLearners: number
  trend: number
  mentorCount: number
  titles: string[]
  companies: string[]
  skills: string[]
  certs: string[]
  quals: string[]
  category?: Category
}

const TECH_PATH_SEEDS: PathSeed[] = [
  {
    id: 'fullstack', name: 'Full Stack Development', icon: 'layers',
    description: 'End-to-end engineering mastery — from frontend architecture to scalable backend systems.',
    totalLearners: 1840, activeLearners: 1120, trend: 8.2, mentorCount: 6,
    titles: ['Senior Full Stack Engineer', 'Full Stack Architect', 'Lead Full Stack Developer', 'Staff Software Engineer', 'Full Stack Mentor & Career Coach', 'Principal Engineer'],
    companies: ['Amazon', 'Microsoft', 'Stripe', 'Atlassian', 'Shopify', 'Flipkart', 'Razorpay', 'Freshworks'],
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'GraphQL', 'Next.js', 'AWS', 'Redis', 'System Design'],
    certs: ['AWS Solutions Architect Professional', 'Google Cloud Professional Engineer', 'Meta Full Stack Certificate', 'MongoDB Certified Developer'],
    quals: ['B.S. Computer Science', 'M.S. Software Engineering', 'B.Tech Information Technology'],
  },
  {
    id: 'frontend', name: 'Frontend Development', icon: 'code',
    description: 'Modern component architecture, performance, and pixel-perfect craft across the web platform.',
    totalLearners: 1420, activeLearners: 860, trend: 6.7, mentorCount: 5,
    titles: ['Senior Frontend Engineer', 'Frontend Architect', 'UI Engineering Lead', 'Staff Frontend Developer', 'Frontend Mentor & Performance Coach'],
    companies: ['Netflix', 'Airbnb', 'Zomato', 'Swiggy', 'Meesho', 'Canva', 'Vercel', 'Adobe'],
    skills: ['React', 'Vue', 'TypeScript', 'Tailwind CSS', 'Web Performance', 'Accessibility', 'Webpack', 'Testing Library', 'CSS Architecture'],
    certs: ['Meta Front-End Developer Certificate', 'Google UX Design Certificate', 'W3C Web Accessibility Certificate'],
    quals: ['B.S. Computer Science', 'B.A. Interactive Media', 'B.Tech Computer Engineering'],
  },
  {
    id: 'backend', name: 'Backend Development', icon: 'server',
    description: 'Reliable, high-throughput services, API design, and distributed systems fundamentals.',
    totalLearners: 1380, activeLearners: 840, trend: 7.1, mentorCount: 5,
    titles: ['Senior Backend Engineer', 'Backend Systems Architect', 'Staff Server Engineer', 'Lead API Engineer', 'Backend Mentor & Infra Coach'],
    companies: ['Uber', 'PayPal', 'Adobe', 'Salesforce', 'Zoho', 'PhonePe', 'Postman', 'Oracle'],
    skills: ['Java', 'Go', 'Node.js', 'PostgreSQL', 'Kafka', 'Microservices', 'Redis', 'gRPC', 'System Design', 'Docker'],
    certs: ['AWS Certified Developer', 'Confluent Certified Developer for Apache Kafka', 'Oracle Certified Professional'],
    quals: ['B.S. Computer Science', 'M.S. Distributed Systems', 'B.Tech Computer Science'],
  },
  {
    id: 'mern', name: 'MERN Stack', icon: 'layers',
    description: 'MongoDB, Express, React and Node — a complete modern JavaScript product stack.',
    totalLearners: 1260, activeLearners: 760, trend: 9.4, mentorCount: 5,
    titles: ['MERN Stack Lead', 'Full Stack JavaScript Engineer', 'Senior MERN Developer', 'JavaScript Product Engineer', 'MERN Mentor & Bootcamp Coach'],
    companies: ['MongoDB Inc.', 'Cred', 'Groww', 'Unacademy', 'Byju\u2019s', 'Innovaccer', 'Postman', 'Zeta'],
    skills: ['MongoDB', 'Express.js', 'React', 'Node.js', 'Redux', 'JWT Auth', 'REST APIs', 'Mongoose', 'Tailwind CSS'],
    certs: ['MongoDB Certified Developer', 'Meta Full Stack Certificate', 'Certified JavaScript Developer'],
    quals: ['B.S. Computer Science', 'B.Tech Information Technology', 'M.S. Web Engineering'],
  },
  {
    id: 'java', name: 'Java Development', icon: 'code',
    description: 'Enterprise-grade Java, Spring ecosystems, and JVM performance for large-scale systems.',
    totalLearners: 1180, activeLearners: 705, trend: 4.8, mentorCount: 5,
    titles: ['Senior Java Engineer', 'Java Platform Architect', 'Staff Backend Engineer (Java)', 'Spring Boot Lead', 'Java Mentor & Interview Coach'],
    companies: ['Infosys', 'TCS', 'Deutsche Bank', 'JPMorgan Chase', 'Wipro', 'Cognizant', 'Accenture', 'SAP'],
    skills: ['Java', 'Spring Boot', 'Hibernate', 'Microservices', 'Kafka', 'JUnit', 'Maven', 'SQL', 'Multithreading'],
    certs: ['Oracle Certified Professional Java', 'Spring Professional Certification', 'AWS Certified Developer'],
    quals: ['B.Tech Computer Science', 'M.S. Software Engineering', 'B.S. Information Systems'],
  },
  {
    id: 'python', name: 'Python Development', icon: 'code',
    description: 'Pythonic engineering across web backends, automation, and scripting at scale.',
    totalLearners: 1310, activeLearners: 790, trend: 10.1, mentorCount: 5,
    titles: ['Senior Python Engineer', 'Python Backend Architect', 'Staff Python Developer', 'Automation Engineering Lead', 'Python Mentor & Career Coach'],
    companies: ['Google', 'Dropbox', 'Instagram', 'Razorpay', 'Zerodha', 'Postman', 'Red Hat', 'Bloomberg'],
    skills: ['Python', 'Django', 'FastAPI', 'Flask', 'PostgreSQL', 'Celery', 'Pytest', 'Docker', 'AsyncIO'],
    certs: ['PCEP Certified Entry-Level Python Programmer', 'AWS Certified Developer', 'Django Certified Developer'],
    quals: ['B.S. Computer Science', 'M.S. Computer Applications', 'B.Tech Information Technology'],
  },
  {
    id: 'dsa', name: 'Data Structures & Algorithms', icon: 'target',
    description: 'Interview-grade problem solving, algorithmic thinking, and competitive programming fundamentals.',
    totalLearners: 2020, activeLearners: 1260, trend: 13.5, mentorCount: 6,
    titles: ['DSA Interview Coach', 'Competitive Programming Mentor', 'Senior SDE & Algorithms Coach', 'Ex-FAANG Interview Mentor', 'Algorithms Lead Instructor', 'Staff Engineer & DSA Coach'],
    companies: ['Google', 'Meta', 'Amazon', 'Microsoft', 'Adobe', 'Uber', 'Codeforces Grandmaster', 'ICPC Alum'],
    skills: ['Arrays & Strings', 'Dynamic Programming', 'Graphs', 'Trees', 'Greedy Algorithms', 'Binary Search', 'System Design', 'Recursion', 'Time Complexity'],
    certs: ['ICPC Regional Finalist', 'Codeforces Expert Rating', 'Google Kickstart Top 500'],
    quals: ['B.Tech Computer Science', 'M.S. Computer Science', 'B.S. Mathematics & Computing'],
  },
  {
    id: 'aiml', name: 'AI / ML Engineering', icon: 'activity',
    description: 'Applied machine learning, deep learning, and production-grade AI systems.',
    totalLearners: 1360, activeLearners: 890, trend: 14.6, mentorCount: 6,
    titles: ['Senior AI Engineer', 'ML Research Lead', 'Applied AI Scientist', 'Staff Machine Learning Engineer', 'AI Engineering Mentor', 'Principal ML Architect'],
    companies: ['Google', 'OpenAI', 'NVIDIA', 'Meta AI', 'Microsoft Research', 'DeepMind', 'Anthropic', 'Amazon Science'],
    skills: ['TensorFlow', 'PyTorch', 'LLMs', 'Python', 'MLOps', 'Transformers', 'Computer Vision', 'Feature Engineering', 'Model Deployment'],
    certs: ['TensorFlow Developer Certificate', 'AWS Machine Learning Specialty', 'Deep Learning Specialization (Stanford)'],
    quals: ['Ph.D. Machine Learning', 'M.S. Artificial Intelligence', 'B.Tech Computer Science'],
  },
  {
    id: 'datascience', name: 'Data Science', icon: 'barChart',
    description: 'Statistical rigor, experimentation, and data storytelling for high-impact decisions.',
    totalLearners: 1120, activeLearners: 705, trend: 11.3, mentorCount: 5,
    titles: ['Senior Data Scientist', 'Data Science Lead', 'Staff Data Scientist', 'Applied Statistics Mentor', 'Data Science Career Coach'],
    companies: ['Netflix', 'LinkedIn', 'Airbnb', 'Myntra', 'Ola', 'Swiggy', 'JPMorgan Chase', 'Accenture'],
    skills: ['Python', 'R', 'A/B Testing', 'Bayesian Statistics', 'SQL', 'scikit-learn', 'Experimentation', 'Data Visualization', 'Causal Inference'],
    certs: ['Certified Analytics Professional', 'Google Data Analytics Certificate', 'Precision Health Specialist'],
    quals: ['M.S. Biostatistics', 'Ph.D. Statistics', 'B.S. Data Science'],
  },
  {
    id: 'analytics', name: 'Data Analytics', icon: 'barChart',
    description: 'Dashboards, business metrics, and analytics workflows that drive day-to-day decisions.',
    totalLearners: 980, activeLearners: 610, trend: 6.9, mentorCount: 5,
    titles: ['Senior Data Analyst', 'Analytics Lead', 'BI Engineering Mentor', 'Staff Business Analyst', 'Data Analytics Career Coach'],
    companies: ['Deloitte', 'EY', 'Flipkart', 'Nykaa', 'PhonePe', 'Zomato', 'Tableau', 'PwC'],
    skills: ['SQL', 'Tableau', 'Power BI', 'Excel', 'Python', 'Data Modeling', 'ETL Pipelines', 'Dashboarding', 'Notion'],
    certs: ['Google Data Analytics Certificate', 'Tableau Desktop Specialist', 'Microsoft Power BI Data Analyst'],
    quals: ['B.S. Business Analytics', 'B.Com Statistics', 'M.S. Information Systems'],
  },
  {
    id: 'devops', name: 'DevOps & Cloud', icon: 'cloud',
    description: 'CI/CD, infrastructure as code, and reliable cloud-native operations at scale.',
    totalLearners: 1040, activeLearners: 655, trend: 12.8, mentorCount: 5,
    titles: ['Senior DevOps Engineer', 'Cloud Infrastructure Architect', 'Staff SRE', 'Platform Engineering Lead', 'DevOps Mentor & Cloud Coach'],
    companies: ['AWS', 'Google Cloud', 'HashiCorp', 'Datadog', 'GitLab', 'Freshworks', 'Red Hat', 'Cisco'],
    skills: ['Kubernetes', 'Terraform', 'AWS', 'Docker', 'CI/CD', 'Prometheus', 'Ansible', 'Linux', 'GitOps'],
    certs: ['AWS Certified DevOps Engineer', 'CKA (Certified Kubernetes Administrator)', 'HashiCorp Certified Terraform Associate'],
    quals: ['B.Tech Computer Science', 'M.S. Cloud Computing', 'B.S. Information Technology'],
  },
  {
    id: 'cybersecurity', name: 'Cyber Security', icon: 'shieldCheck',
    description: 'Offensive and defensive security practice, from threat modeling to incident response.',
    totalLearners: 890, activeLearners: 540, trend: 15.2, mentorCount: 5,
    titles: ['Senior Security Engineer', 'Penetration Testing Lead', 'Security Operations Mentor', 'Staff Security Architect', 'CISO Advisor & Mentor'],
    companies: ['CrowdStrike', 'Palo Alto Networks', 'Cisco', 'Deloitte Cyber', 'IBM Security', 'Fortinet', 'Mandiant', 'TCS Security'],
    skills: ['Penetration Testing', 'Threat Modeling', 'SIEM', 'Network Security', 'Cloud Security', 'Incident Response', 'OWASP Top 10', 'Cryptography'],
    certs: ['CISSP', 'CEH (Certified Ethical Hacker)', 'OSCP', 'CompTIA Security+'],
    quals: ['B.S. Cyber Security', 'M.S. Information Security', 'B.Tech Computer Science'],
  },
  {
    id: 'uiux', name: 'UI / UX Design', icon: 'eye',
    description: 'Human-centered design, design systems, and product craft for modern interfaces.',
    totalLearners: 1510, activeLearners: 940, trend: 5.1, mentorCount: 6,
    titles: ['Principal Product Designer', 'UX Research Lead', 'Design Systems Mentor', 'Staff Interaction Designer', 'UI Designer & Portfolio Coach', 'Senior Product Designer'],
    companies: ['Figma', 'Airbnb', 'Adobe', 'Canva', 'Swiggy', 'CRED', 'Meesho', 'IDEO'],
    skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping', 'Motion Design', 'Wireframing', 'Usability Testing', 'Visual Design'],
    certs: ['Nielsen Norman UX Certification', 'Google UX Design Certificate', 'Interaction Design Foundation Certificate'],
    quals: ['B.F.A. Interaction Design', 'M.Des Design', 'B.A. Graphic Design'],
  },
  {
    id: 'productdesign', name: 'Product Design', icon: 'layers',
    description: 'Systems-level product craft bridging design, strategy, and engineering feasibility.',
    totalLearners: 640, activeLearners: 385, trend: 7.4, mentorCount: 5,
    titles: ['Head of Product Design', 'Senior Product Designer', 'Design Strategy Mentor', 'Staff Product Designer', 'Product Design Career Coach'],
    companies: ['Notion', 'Linear', 'Razorpay', 'Zerodha', 'Postman', 'Slack', 'Atlassian', 'Freshworks'],
    skills: ['Design Strategy', 'Figma', 'Design Systems', 'Prototyping', 'Storytelling', 'Cross-functional Collaboration', 'Product Thinking'],
    certs: ['Interaction Design Foundation Certificate', 'Google UX Design Certificate', 'Certified Design Sprint Facilitator'],
    quals: ['M.Des Design', 'B.F.A. Product Design', 'B.A. Industrial Design'],
  },
  {
    id: 'productmgmt', name: 'Product Management', icon: 'target',
    description: 'Product strategy, roadmapping, and stakeholder leadership for aspiring PMs.',
    totalLearners: 860, activeLearners: 520, trend: 6.4, mentorCount: 5,
    titles: ['Senior Product Manager', 'Group Product Manager', 'Product Strategy Mentor', 'Director of Product', 'Growth PM Coach'],
    companies: ['Google', 'Meta', 'Flipkart', 'Swiggy', 'Cred', 'Zomato', 'Amazon', 'Uber'],
    skills: ['Roadmapping', 'A/B Testing', 'SQL', 'Stakeholder Management', 'Go-to-Market', 'User Research', 'Prioritization Frameworks'],
    certs: ['Certified Product Manager (AIPMM)', 'Pragmatic Institute Product Certification', 'Reforge Product Strategy'],
    quals: ['MBA', 'B.Tech Computer Science', 'B.S. Business Analytics'],
  },
  {
    id: 'marketing', name: 'Digital Marketing', icon: 'megaphone',
    description: 'Performance marketing, growth loops, and brand strategy across digital channels.',
    totalLearners: 1050, activeLearners: 615, trend: 9.8, mentorCount: 5,
    titles: ['Senior Growth Marketer', 'Performance Marketing Lead', 'Brand Strategy Mentor', 'Head of Digital Marketing', 'SEO & Content Growth Coach'],
    companies: ['Nykaa', 'Meesho', 'Byju\u2019s', 'Zomato', 'HubSpot', 'Ogilvy', 'WPP', 'Publicis'],
    skills: ['SEO', 'Performance Marketing', 'Google Ads', 'Meta Ads', 'Marketing Analytics', 'Content Strategy', 'Growth Loops', 'Email Marketing'],
    certs: ['Google Ads Certification', 'HubSpot Content Marketing Certification', 'Meta Blueprint Certification'],
    quals: ['MBA Marketing', 'B.A. Mass Communication', 'B.S. Business Analytics'],
  },
  {
    id: 'bizanalytics', name: 'Business Analytics', icon: 'barChart',
    description: 'Quantitative decision-making, forecasting, and operations analytics for modern business.',
    totalLearners: 720, activeLearners: 430, trend: 5.6, mentorCount: 5,
    titles: ['Senior Business Analyst', 'Analytics Strategy Mentor', 'Head of Business Intelligence', 'Staff Operations Analyst', 'Business Analytics Coach'],
    companies: ['McKinsey & Company', 'Bain & Company', 'Deloitte', 'Flipkart', 'Ola', 'Amazon', 'PwC', 'EXL'],
    skills: ['SQL', 'Excel', 'Forecasting', 'Power BI', 'Financial Modeling', 'Operations Analytics', 'Python', 'Statistics'],
    certs: ['Certified Analytics Professional', 'Microsoft Power BI Data Analyst', 'CFA Level I'],
    quals: ['MBA', 'B.Com Statistics', 'M.S. Business Analytics'],
  },
  {
    id: 'qa', name: 'QA Automation Testing', icon: 'bug',
    description: 'Test strategy, automation frameworks, and quality engineering for production-grade releases.',
    totalLearners: 610, activeLearners: 365, trend: 8.9, mentorCount: 5,
    titles: ['Senior QA Automation Engineer', 'SDET Lead', 'Quality Engineering Mentor', 'Staff Test Architect', 'QA Career Coach'],
    companies: ['Amazon', 'Flipkart', 'Zoho', 'Freshworks', 'Paytm', 'ThoughtWorks', 'Cognizant', 'Wipro'],
    skills: ['Selenium', 'Cypress', 'Playwright', 'API Testing', 'Test Automation Frameworks', 'CI/CD', 'JMeter', 'Java'],
    certs: ['ISTQB Certified Tester', 'Certified Selenium Professional', 'AWS Certified Developer'],
    quals: ['B.Tech Computer Science', 'B.S. Information Technology', 'M.S. Software Testing'],
  },
  {
    id: 'mobile', name: 'Mobile App Development', icon: 'phone',
    description: 'Native and cross-platform mobile engineering for iOS, Android, and beyond.',
    totalLearners: 930, activeLearners: 560, trend: 8.1, mentorCount: 5,
    titles: ['Senior Mobile Engineer', 'iOS Platform Lead', 'Android Architecture Mentor', 'Staff Flutter Developer', 'Cross-Platform Mobile Coach'],
    companies: ['Swiggy', 'PhonePe', 'Meesho', 'Uber', 'Spotify', 'Airbnb', 'Google', 'Apple'],
    skills: ['Swift', 'Kotlin', 'Flutter', 'React Native', 'Mobile Architecture', 'Firebase', 'Jetpack Compose', 'SwiftUI'],
    certs: ['Google Associate Android Developer', 'Apple Certified iOS Developer', 'Meta React Native Certificate'],
    quals: ['B.Tech Computer Science', 'M.S. Mobile Computing', 'B.S. Information Technology'],
  },
  {
    id: 'genai', name: 'Gen AI & Prompt Engineering', icon: 'sparkles',
    description: 'Applied generative AI, prompt design, and building production LLM-powered products.',
    totalLearners: 1180, activeLearners: 810, trend: 21.4, mentorCount: 6,
    titles: ['Senior Prompt Engineer', 'Gen AI Product Mentor', 'LLM Applications Lead', 'Staff AI Product Engineer', 'Applied Gen AI Coach', 'Principal Gen AI Architect'],
    companies: ['OpenAI', 'Anthropic', 'Google DeepMind', 'Perplexity', 'Cohere', 'Microsoft', 'Notion AI', 'Scale AI'],
    skills: ['Prompt Engineering', 'RAG Pipelines', 'LangChain', 'LLM Evaluation', 'Vector Databases', 'Fine-tuning', 'Python', 'Agentic Workflows'],
    certs: ['DeepLearning.AI Generative AI Certificate', 'LangChain Certified Developer', 'Prompt Engineering Professional Certificate'],
    quals: ['M.S. Artificial Intelligence', 'B.Tech Computer Science', 'Ph.D. Computational Linguistics'],
  },
]

// ── Health & Fitness growth paths ───────────────────────────────────────────

const HEALTH_FITNESS_SEEDS: PathSeed[] = [
  {
    id: 'weightloss', name: 'Weight Loss & Fat Loss Coaching', icon: 'activity', category: 'Health & Fitness',
    description: 'Sustainable fat-loss programming built around nutrition, habit change, and progressive training.',
    totalLearners: 1240, activeLearners: 760, trend: 11.4, mentorCount: 5,
    titles: ['Certified Weight Loss Coach', 'Head Fat-Loss Specialist', 'Online Fitness & Nutrition Coach', 'Metabolic Health Coach', 'Senior Transformation Coach'],
    companies: ['Cult.fit', 'HealthifyMe', 'Gold\u2019s Gym', 'F45 Training', 'Anytime Fitness', 'ClassPass', 'Fitbit Coaching', 'Noom'],
    skills: ['Calorie Deficit Planning', 'Macro Coaching', 'Habit Change', 'Progressive Overload', 'Behavioral Nutrition', 'Metabolic Adaptation'],
    certs: ['ACE Certified Personal Trainer', 'ISSA Nutrition Specialist', 'Precision Nutrition Level 1'],
    quals: ['B.S. Exercise Science', 'Diploma in Sports Nutrition', 'Certified Strength & Conditioning Specialist'],
  },
  {
    id: 'musclebuilding', name: 'Muscle Building & Strength Training', icon: 'award', category: 'Health & Fitness',
    description: 'Structured hypertrophy and strength programming for lasting muscle and performance gains.',
    totalLearners: 980, activeLearners: 610, trend: 8.9, mentorCount: 4,
    titles: ['Head Strength Coach', 'NASM-Certified Strength Coach', 'Powerlifting & Hypertrophy Mentor', 'Senior Personal Trainer'],
    companies: ['Gold\u2019s Gym', 'F45 Training', 'Cult.fit', 'Anytime Fitness', 'Onelife Fitness', 'Fitness First'],
    skills: ['Progressive Overload', 'Periodization', 'Hypertrophy Programming', 'Mobility Training', 'Injury Prevention', 'Powerlifting Fundamentals'],
    certs: ['NASM-CPT', 'CSCS (Certified Strength & Conditioning Specialist)', 'USA Weightlifting Level 1'],
    quals: ['B.S. Exercise Science', 'Diploma in Sports Science', 'Certified Personal Trainer'],
  },
  {
    id: 'yoga', name: 'Yoga & Flexibility', icon: 'sparkles', category: 'Health & Fitness',
    description: 'Breath-led movement, mobility, and flexibility practice rooted in traditional and modern yoga.',
    totalLearners: 1360, activeLearners: 870, trend: 9.7, mentorCount: 5,
    titles: ['RYT-500 Yoga Instructor', 'Senior Yoga & Mobility Coach', 'Vinyasa Flow Teacher', 'Yoga Therapy Mentor', 'Head of Yoga Programs'],
    companies: ['Cult.fit', 'The Yoga Institute', 'Art of Living', 'Isha Foundation', 'Sarva Yoga Studios', 'Down Dog', 'Peloton'],
    skills: ['Vinyasa Flow', 'Hatha Yoga', 'Pranayama', 'Mobility & Flexibility', 'Yoga Therapy', 'Alignment Cueing'],
    certs: ['RYT-500 (Yoga Alliance)', 'Yoga Therapy Certification', 'Pranayama Teacher Certificate'],
    quals: ['Diploma in Yoga Science', 'B.A. Yoga & Wellness', 'Certified Yoga Therapist'],
  },
  {
    id: 'nutrition', name: 'Nutrition & Diet Coaching', icon: 'check', category: 'Health & Fitness',
    description: 'Evidence-based nutrition coaching spanning meal planning, macros, and long-term dietary habits.',
    totalLearners: 890, activeLearners: 545, trend: 10.2, mentorCount: 4,
    titles: ['Registered Dietitian & Coach', 'Sports Nutrition Coach', 'Senior Nutrition Mentor', 'Clinical Nutrition Advisor'],
    companies: ['HealthifyMe', 'Nutrify', 'Cult.fit', 'Practo', 'Noom', 'Precision Nutrition'],
    skills: ['Macro Coaching', 'Meal Planning', 'Sports Nutrition', 'Gut Health', 'Behavioral Nutrition', 'Supplementation'],
    certs: ['Registered Dietitian (RD)', 'Precision Nutrition Level 2', 'ISSA Nutrition Specialist'],
    quals: ['B.S. Clinical Nutrition & Dietetics', 'M.S. Sports Nutrition', 'Diploma in Dietetics'],
  },
  {
    id: 'running', name: 'Running & Endurance Training', icon: 'trendUp', category: 'Health & Fitness',
    description: 'Structured endurance coaching from first 5K to marathon and ultra-distance performance.',
    totalLearners: 640, activeLearners: 395, trend: 7.6, mentorCount: 4,
    titles: ['Certified Running Coach', 'Marathon & Endurance Mentor', 'Head Track & Field Coach', 'Ultra-Distance Coach'],
    companies: ['Nike Running Club', 'Adidas Runners', 'Cult.fit', 'Strava Coaching Network', 'Reebok'],
    skills: ['Endurance Periodization', 'VO2 Max Training', 'Race Pacing Strategy', 'Injury Prevention', 'Running Gait Analysis'],
    certs: ['UESCA Certified Running Coach', 'RRCA Certified Coach', 'USATF Level 1 Coaching'],
    quals: ['B.S. Exercise Physiology', 'Diploma in Sports Science', 'Certified Endurance Coach'],
  },
  {
    id: 'meditation', name: 'Meditation & Mindful Movement', icon: 'eye', category: 'Health & Fitness',
    description: 'Guided meditation, breathwork, and mindful-movement practice for stress recovery and presence.',
    totalLearners: 1080, activeLearners: 690, trend: 13.8, mentorCount: 4,
    titles: ['Certified Meditation Teacher', 'Mindfulness & Breathwork Coach', 'Senior Meditation Mentor', 'Mind-Body Wellness Coach'],
    companies: ['Headspace', 'Calm', 'Art of Living', 'Isha Foundation', 'Insight Timer', 'Wysa'],
    skills: ['Guided Meditation', 'Breathwork', 'Body Scan Practice', 'Stress Physiology', 'Mindful Movement'],
    certs: ['Mindfulness-Based Stress Reduction (MBSR) Certificate', 'Certified Meditation Teacher (CMT)', 'Breathwork Facilitator Certificate'],
    quals: ['Diploma in Mindfulness Studies', 'B.A. Psychology', 'Certified Wellness Coach'],
  },
  {
    id: 'homeworkout', name: 'Home Workout & Bodyweight Training', icon: 'barChart', category: 'Health & Fitness',
    description: 'Equipment-light bodyweight programming designed for consistency without a gym.',
    totalLearners: 760, activeLearners: 470, trend: 9.1, mentorCount: 4,
    titles: ['Bodyweight Training Coach', 'Home Fitness Program Lead', 'Calisthenics Mentor', 'Online Fitness Coach'],
    companies: ['Cult.fit', 'Nike Training Club', 'Fitbit Coaching', 'FitOn', 'ClassPass'],
    skills: ['Calisthenics', 'Bodyweight Progressions', 'Mobility Training', 'HIIT Programming', 'Minimal-Equipment Design'],
    certs: ['ACE Certified Personal Trainer', 'Calisthenics Coach Certification', 'ISSA Fitness Nutrition Certification'],
    quals: ['B.S. Exercise Science', 'Diploma in Fitness Training', 'Certified Personal Trainer'],
  },
]

// ── Mindset growth paths ────────────────────────────────────────────────────

const MINDSET_SEEDS: PathSeed[] = [
  {
    id: 'confidence', name: 'Confidence Building', icon: 'star', category: 'Mindset',
    description: 'Structured coaching to build self-assurance, assertiveness, and a resilient self-image.',
    totalLearners: 940, activeLearners: 585, trend: 10.6, mentorCount: 4,
    titles: ['Certified Confidence Coach', 'Senior Mindset Mentor', 'Self-Esteem & Assertiveness Coach', 'Personal Growth Mentor'],
    companies: ['BetterUp', 'Mindvalley', 'Talkspace', 'Headspace Health', 'Life Coach School'],
    skills: ['Assertiveness Training', 'Cognitive Reframing', 'Self-Image Work', 'Public Presence Coaching', 'Goal Setting'],
    certs: ['ICF Certified Life Coach', 'Certified Confidence Coach (CCC)', 'NLP Practitioner Certificate'],
    quals: ['B.A. Psychology', 'Certified Life Coach (ICF)', 'M.S. Counseling Psychology'],
  },
  {
    id: 'focus', name: 'Focus & Concentration', icon: 'target', category: 'Mindset',
    description: 'Attention training and environment design to build sustained, distraction-resistant focus.',
    totalLearners: 760, activeLearners: 470, trend: 12.1, mentorCount: 4,
    titles: ['Focus & Attention Coach', 'Cognitive Performance Mentor', 'Senior Productivity Coach', 'Applied Neuroscience Coach'],
    companies: ['BetterUp', 'Mindvalley', 'Headspace Health', 'Calm for Business', 'Reclaim.ai'],
    skills: ['Attention Training', 'Environment Design', 'Digital Minimalism', 'Cognitive Load Management', 'Flow-State Coaching'],
    certs: ['Certified Productivity Coach', 'Applied Neuroscience Certificate', 'ICF Certified Coach'],
    quals: ['B.A. Cognitive Science', 'M.S. Applied Psychology', 'Certified Performance Coach'],
  },
  {
    id: 'productivity', name: 'Productivity Systems', icon: 'trendUp', category: 'Mindset',
    description: 'Personal operating systems, task architecture, and sustainable high-output habits.',
    totalLearners: 1080, activeLearners: 680, trend: 9.4, mentorCount: 5,
    titles: ['Productivity Systems Coach', 'Senior Time & Task Mentor', 'Personal Operations Coach', 'Executive Productivity Advisor', 'Workflow Design Mentor'],
    companies: ['Notion Coaching Network', 'Todoist Academy', 'BetterUp', 'Reclaim.ai', 'Sunsama'],
    skills: ['Task Architecture', 'Time Blocking', 'Weekly Review Systems', 'Priority Frameworks', 'Workflow Automation'],
    certs: ['Certified Productivity Coach', 'GTD (Getting Things Done) Certified', 'ICF Certified Coach'],
    quals: ['B.A. Business Administration', 'Certified Productivity Consultant', 'M.S. Organizational Psychology'],
  },
  {
    id: 'anxietymanagement', name: 'Anxiety Management', icon: 'shieldCheck', category: 'Mindset',
    description: 'Practical, evidence-informed coping strategies for everyday anxiety and stress regulation.',
    totalLearners: 870, activeLearners: 540, trend: 14.3, mentorCount: 4,
    titles: ['Certified Stress & Anxiety Coach', 'Mind-Body Wellness Mentor', 'Senior Resilience Coach', 'CBT-Informed Wellness Coach'],
    companies: ['Talkspace', 'Wysa', 'Calm', 'BetterHelp Coaching', 'Headspace Health'],
    skills: ['CBT-Informed Techniques', 'Breathwork Regulation', 'Stress Physiology', 'Grounding Techniques', 'Resilience Building'],
    certs: ['Certified Resilience Coach', 'Mindfulness-Based Stress Reduction (MBSR)', 'ICF Certified Coach'],
    quals: ['B.A. Psychology', 'M.S. Counseling', 'Certified Wellness Coach'],
  },
  {
    id: 'emotionalintelligence', name: 'Emotional Intelligence', icon: 'eye', category: 'Mindset',
    description: 'Self-awareness, empathy, and emotional regulation skills for work and relationships.',
    totalLearners: 690, activeLearners: 420, trend: 8.7, mentorCount: 4,
    titles: ['Emotional Intelligence Coach', 'Senior EQ Mentor', 'Leadership & EQ Coach', 'Interpersonal Skills Mentor'],
    companies: ['BetterUp', 'Six Seconds EQ Network', 'Mindvalley', 'TalentSmartEQ'],
    skills: ['Self-Awareness Coaching', 'Empathic Communication', 'Emotional Regulation', 'Conflict De-escalation', 'Relationship Repair'],
    certs: ['Six Seconds EQ Certification', 'ICF Certified Coach', 'EQ-i 2.0 Certified Practitioner'],
    quals: ['B.A. Psychology', 'M.S. Organizational Behavior', 'Certified EQ Practitioner'],
  },
  {
    id: 'publicspeaking', name: 'Public Speaking & Communication Confidence', icon: 'megaphone', category: 'Mindset',
    description: 'Voice, structure, and stage presence coaching for confident public communication.',
    totalLearners: 1020, activeLearners: 640, trend: 11.9, mentorCount: 5,
    titles: ['Certified Public Speaking Coach', 'Executive Communication Mentor', 'Senior Voice & Presence Coach', 'TEDx Speaker Coach', 'Storytelling & Stage Presence Mentor'],
    companies: ['Toastmasters International', 'Dale Carnegie Training', 'BetterUp', 'TEDx Speaker Coaching Network'],
    skills: ['Speech Structure', 'Vocal Delivery', 'Stage Presence', 'Storytelling', 'Handling Q&A Under Pressure'],
    certs: ['Toastmasters Distinguished Toastmaster (DTM)', 'Dale Carnegie Certified Coach', 'ICF Certified Coach'],
    quals: ['B.A. Communications', 'M.A. Rhetoric & Public Address', 'Certified Speech Coach'],
  },
  {
    id: 'deepwork', name: 'Deep Work & Flow States', icon: 'clock', category: 'Mindset',
    description: 'Protocols for entering and sustaining deep, distraction-free cognitive work.',
    totalLearners: 580, activeLearners: 355, trend: 7.9, mentorCount: 3,
    titles: ['Deep Work Coach', 'Flow-State Performance Mentor', 'Cognitive Performance Coach'],
    companies: ['BetterUp', 'Reclaim.ai', 'Mindvalley'],
    skills: ['Deep Work Blocks', 'Flow-State Triggers', 'Digital Minimalism', 'Cognitive Recovery', 'Environment Design'],
    certs: ['Applied Neuroscience Certificate', 'Certified Performance Coach', 'ICF Certified Coach'],
    quals: ['M.S. Applied Psychology', 'B.A. Cognitive Science', 'Certified Productivity Coach'],
  },
]

// ── Personal Life growth paths ──────────────────────────────────────────────

const PERSONAL_LIFE_SEEDS: PathSeed[] = [
  {
    id: 'relationships', name: 'Relationships & Dating Coaching', icon: 'users', category: 'Personal Life',
    description: 'Communication, boundaries, and connection-building for dating and long-term relationships.',
    totalLearners: 860, activeLearners: 530, trend: 9.8, mentorCount: 4,
    titles: ['Certified Relationship Coach', 'Senior Dating & Connection Mentor', 'Couples Communication Coach', 'Relationship Systems Mentor'],
    companies: ['Relish Coaching', 'BetterHelp Coaching', 'Gottman Institute Network', 'Talkspace'],
    skills: ['Attachment Styles', 'Boundary Setting', 'Conflict Repair', 'Active Listening', 'Vulnerability Coaching'],
    certs: ['Gottman Method Certified', 'ICF Certified Relationship Coach', 'Certified Attachment-Based Coach'],
    quals: ['B.A. Psychology', 'M.S. Marriage & Family Therapy', 'Certified Relationship Coach'],
  },
  {
    id: 'communication', name: 'Communication Skills', icon: 'mail', category: 'Personal Life',
    description: 'Clear, confident interpersonal and written communication for work and everyday life.',
    totalLearners: 720, activeLearners: 445, trend: 8.4, mentorCount: 4,
    titles: ['Communication Skills Coach', 'Senior Interpersonal Effectiveness Mentor', 'Executive Communication Coach', 'Assertive Communication Mentor'],
    companies: ['Dale Carnegie Training', 'Toastmasters International', 'BetterUp', 'LinkedIn Learning Coaching'],
    skills: ['Active Listening', 'Assertive Communication', 'Nonviolent Communication', 'Written Clarity', 'Difficult Conversations'],
    certs: ['Dale Carnegie Certified Coach', 'Nonviolent Communication (NVC) Certificate', 'ICF Certified Coach'],
    quals: ['B.A. Communications', 'M.A. Organizational Communication', 'Certified Communication Coach'],
  },
  {
    id: 'finance', name: 'Personal Finance & Money Management', icon: 'dollar', category: 'Personal Life',
    description: 'Budgeting, saving, investing fundamentals, and long-term financial habit design.',
    totalLearners: 1140, activeLearners: 705, trend: 13.2, mentorCount: 5,
    titles: ['Certified Financial Coach', 'Senior Personal Finance Mentor', 'Wealth-Building Coach', 'Financial Literacy Mentor', 'Investment Fundamentals Coach'],
    companies: ['Groww', 'Zerodha Varsity', 'ClearTax', 'INDmoney', 'Scripbox', 'ET Money'],
    skills: ['Budgeting Systems', 'Debt Payoff Strategy', 'Investing Fundamentals', 'Tax Planning Basics', 'Financial Goal Design'],
    certs: ['Certified Financial Planner (CFP) — Associate Track', 'AFC (Accredited Financial Counselor)', 'NISM Certified'],
    quals: ['B.Com Finance', 'MBA Finance', 'Certified Financial Coach'],
  },
  {
    id: 'habits', name: 'Habit Building & Behavior Change', icon: 'calendar', category: 'Personal Life',
    description: 'Applied behavior science for building habits that stick and breaking ones that don\u2019t serve you.',
    totalLearners: 980, activeLearners: 610, trend: 10.9, mentorCount: 4,
    titles: ['Certified Habit Coach', 'Behavior Change Mentor', 'Senior Habit Design Coach', 'Applied Behavior Science Mentor'],
    companies: ['Atomic Habits Coaching Network', 'BetterUp', 'Fabulous App Coaching', 'Mindvalley'],
    skills: ['Habit Stacking', 'Cue-Routine-Reward Design', 'Identity-Based Change', 'Environment Design', 'Accountability Systems'],
    certs: ['Certified Behavior Change Specialist', 'ICF Certified Coach', 'Applied Behavioral Science Certificate'],
    quals: ['B.A. Behavioral Psychology', 'M.S. Behavioral Science', 'Certified Habit Coach'],
  },
  {
    id: 'timemanagement', name: 'Time Management', icon: 'clock', category: 'Personal Life',
    description: 'Practical scheduling, prioritization, and boundary-setting for a sustainable calendar.',
    totalLearners: 640, activeLearners: 395, trend: 7.2, mentorCount: 3,
    titles: ['Time Management Coach', 'Senior Scheduling & Priorities Mentor', 'Work-Life Balance Coach'],
    companies: ['Reclaim.ai', 'Sunsama', 'BetterUp'],
    skills: ['Priority Frameworks', 'Calendar Design', 'Boundary Setting', 'Energy Management', 'Delegation Skills'],
    certs: ['Certified Time Management Coach', 'ICF Certified Coach', 'Certified Productivity Consultant'],
    quals: ['B.A. Business Administration', 'Certified Life Coach', 'M.S. Organizational Psychology'],
  },
  {
    id: 'parenting', name: 'Parenting & Family Coaching', icon: 'shieldCheck', category: 'Personal Life',
    description: 'Evidence-informed parenting strategies for connection, discipline, and family communication.',
    totalLearners: 760, activeLearners: 465, trend: 8.1, mentorCount: 4,
    titles: ['Certified Parenting Coach', 'Family Systems Mentor', 'Positive Discipline Coach', 'Senior Parent-Child Communication Mentor'],
    companies: ['ParentCircle', 'Positive Parenting Solutions', 'Talkspace Family Coaching', 'Gottman Institute Network'],
    skills: ['Positive Discipline', 'Age-Appropriate Communication', 'Conflict De-escalation', 'Routine Design', 'Emotional Coaching for Kids'],
    certs: ['Positive Discipline Certified Educator', 'Certified Parent Coach (CPC)', 'ICF Certified Coach'],
    quals: ['B.A. Child Psychology', 'M.S. Family Studies', 'Certified Parenting Coach'],
  },
]

// ── Student Life growth paths ───────────────────────────────────────────────

const STUDENT_LIFE_SEEDS: PathSeed[] = [
  {
    id: 'studytechniques', name: 'Study Techniques & Learning Skills', icon: 'graduationCap', category: 'Student Life',
    description: 'Evidence-based study methods — spaced repetition, active recall, and exam strategy.',
    totalLearners: 1160, activeLearners: 730, trend: 12.6, mentorCount: 5,
    titles: ['Learning Skills Coach', 'Senior Study Strategy Mentor', 'Academic Performance Coach', 'Applied Learning Science Mentor', 'Exam Strategy Coach'],
    companies: ['Vedantu', 'BYJU\u2019S', 'Unacademy', 'Khan Academy Coaching', 'Physics Wallah'],
    skills: ['Active Recall', 'Spaced Repetition', 'Note-Taking Systems', 'Exam Strategy', 'Study Scheduling'],
    certs: ['Certified Academic Coach', 'Learning Science Certificate', 'ICF Certified Coach'],
    quals: ['B.Ed Education', 'M.A. Educational Psychology', 'Certified Study Skills Coach'],
  },
  {
    id: 'competitiveexams', name: 'Competitive Exam Preparation', icon: 'award', category: 'Student Life',
    description: 'Structured, high-stakes preparation coaching for major competitive and entrance exams.',
    totalLearners: 1480, activeLearners: 940, trend: 15.7, mentorCount: 6,
    titles: ['Senior Exam Prep Mentor', 'Competitive Exam Strategy Coach', 'Ex-Topper Mentor', 'Head of Exam Coaching', 'Mock Test Analysis Coach', 'Subject Matter Mentor'],
    companies: ['Unacademy', 'BYJU\u2019S', 'Physics Wallah', 'Vedantu', 'Career Launcher', 'Aakash Institute'],
    skills: ['Mock Test Strategy', 'Time-Bound Problem Solving', 'Syllabus Prioritization', 'Revision Cycles', 'Error Analysis'],
    certs: ['Certified Exam Coach', 'Subject Expert Certification', 'Test Prep Instructor Certificate'],
    quals: ['M.Sc. Subject Specialization', 'B.Ed Education', 'Postgraduate Rank Holder'],
  },
  {
    id: 'collegeprep', name: 'College & Admissions Preparation', icon: 'graduationCap', category: 'Student Life',
    description: 'Application strategy, essays, and interview coaching for college and university admissions.',
    totalLearners: 640, activeLearners: 390, trend: 9.3, mentorCount: 4,
    titles: ['College Admissions Coach', 'Senior Application Strategy Mentor', 'Essay & Interview Coach', 'University Admissions Mentor'],
    companies: ['The Princeton Review', 'Kaplan', 'IvyWise', 'Leverage Edu', 'CollegeVine'],
    skills: ['Application Strategy', 'Essay Coaching', 'Interview Preparation', 'Extracurricular Positioning', 'Scholarship Planning'],
    certs: ['Certified Educational Planner', 'IECA Member Certification', 'Certified College Admissions Coach'],
    quals: ['M.A. Education Counseling', 'B.A. Liberal Arts', 'Certified Admissions Consultant'],
  },
  {
    id: 'notetaking', name: 'Note-Taking & Organization Systems', icon: 'layers', category: 'Student Life',
    description: 'Structured note-taking and personal knowledge systems for retention and recall.',
    totalLearners: 520, activeLearners: 320, trend: 8.8, mentorCount: 3,
    titles: ['Note-Taking Systems Coach', 'Personal Knowledge Management Mentor', 'Academic Organization Coach'],
    companies: ['Notion Coaching Network', 'Obsidian Community Mentors', 'Vedantu'],
    skills: ['Cornell Note System', 'Mind Mapping', 'Digital Knowledge Systems', 'Summarization Techniques', 'Review Scheduling'],
    certs: ['Certified Academic Coach', 'Personal Knowledge Management Certificate', 'ICF Certified Coach'],
    quals: ['B.Ed Education', 'M.A. Educational Psychology', 'Certified Study Skills Coach'],
  },
  {
    id: 'memory', name: 'Memory Techniques & Retention', icon: 'sparkles', category: 'Student Life',
    description: 'Mnemonic systems, memory palaces, and retention techniques for fast, durable learning.',
    totalLearners: 460, activeLearners: 285, trend: 11.2, mentorCount: 3,
    titles: ['Memory Techniques Coach', 'Certified Memory Athlete Mentor', 'Applied Mnemonics Coach'],
    companies: ['Memory League Coaching', 'Art of Memory Community', 'Unacademy'],
    skills: ['Memory Palace Method', 'Mnemonic Systems', 'Spaced Repetition', 'Chunking Techniques', 'Rapid Recall Training'],
    certs: ['Certified Memory Coach', 'Learning Science Certificate', 'ICF Certified Coach'],
    quals: ['B.A. Cognitive Science', 'M.A. Educational Psychology', 'Competitive Memory Athlete'],
  },
  {
    id: 'careerplanning', name: 'Career Planning for Students', icon: 'briefcase', category: 'Student Life',
    description: 'Early career exploration, internship strategy, and first-job readiness for students.',
    totalLearners: 820, activeLearners: 505, trend: 10.4, mentorCount: 4,
    titles: ['Student Career Coach', 'Early-Career Mentor', 'Internship Strategy Coach', 'Senior Career Readiness Mentor'],
    companies: ['LinkedIn Learning Coaching', 'Leverage Edu', 'Internshala', 'Career Launcher'],
    skills: ['Resume Building', 'Internship Strategy', 'Networking Fundamentals', 'Career Exploration', 'Interview Readiness'],
    certs: ['Certified Career Coach', 'ICF Certified Coach', 'Certified Career Services Provider'],
    quals: ['M.A. Career Counseling', 'B.A. Psychology', 'Certified Career Development Facilitator'],
  },
]

const PATH_SEEDS: PathSeed[] = [...TECH_PATH_SEEDS, ...HEALTH_FITNESS_SEEDS, ...MINDSET_SEEDS, ...PERSONAL_LIFE_SEEDS, ...STUDENT_LIFE_SEEDS]

// ── Growth Paths — the single source of truth spanning all five Starfix
// ecosystem categories (Career & Tech, Health & Fitness, Mindset, Personal
// Life, Student Life). Every dashboard widget reads from this array so no
// view can silently drift back to showing tech-only data.
export const GROWTH_PATHS: GrowthPath[] = PATH_SEEDS.map(p => ({
  id: p.id,
  name: p.name,
  icon: p.icon,
  description: p.description,
  totalLearners: p.totalLearners,
  activeLearners: p.activeLearners,
  trend: p.trend,
  category: p.category ?? 'Career & Tech',
}))

export function pathsByCategory(category: Category): GrowthPath[] {
  return GROWTH_PATHS.filter(p => p.category === category)
}

// ── Shared name / avatar / language pools ───────────────────────────────────

const FIRST_NAMES = [
  'Ryan', 'Priya', 'Wen', 'Daniel', 'Isabella', 'Noah', 'Marcus', 'Elena', 'Sofia', 'Grace',
  'Julian', 'Aisha', 'Arjun', 'Meera', 'Kabir', 'Ananya', 'Rohan', 'Divya', 'Vikram', 'Neha',
  'Liam', 'Emma', 'Ethan', 'Olivia', 'Mason', 'Ava', 'Lucas', 'Mia', 'Jackson', 'Amara',
  'Elijah', 'Zara', 'Benjamin', 'Layla', 'Nathan', 'Chloe', 'Adrian', 'Naomi', 'Felix', 'Ines',
  'Omar', 'Leah', 'Sanjay', 'Kavya', 'Rahul', 'Ishita', 'Dev', 'Tara', 'Aditya', 'Simran',
  'Wei', 'Yuki', 'Hana', 'Jun', 'Mei', 'Kenji', 'Sara', 'Adam', 'Nora', 'Victor',
  'Carlos', 'Lucia', 'Diego', 'Valentina', 'Mateo', 'Camila', 'Andres', 'Paula', 'Ravi', 'Pooja',
  'Karan', 'Nisha', 'Yusuf', 'Amir', 'Farah', 'Hassan', 'Ingrid', 'Lars', 'Freya', 'Magnus',
  'Chinedu', 'Amaka', 'Kwame', 'Zainab', 'Tunde', 'Fatima', 'Emeka', 'Adaeze', 'Nadia', 'Samuel',
  'Rebecca', 'Jonas', 'Clara', 'Henrik', 'Anika', 'Tomas', 'Petra', 'Milan', 'Katarina', 'Stefan',
]

const LAST_NAMES = [
  'Whitfield', 'Kapoor', 'Zhao', 'Osei', 'Marchetti', 'Bennett', 'Vance', 'Rostova', 'Chen', 'Okafor',
  'Thorne', 'Patel', 'Mehta', 'Nair', 'Sharma', 'Iyer', 'Gupta', 'Reddy', 'Rao', 'Chopra',
  'Foster', 'Torres', 'Brandt', 'Kowalski', 'Whitmore', 'Delgado', 'Reyes', 'Sorensen', 'Idowu', 'Cho',
  'Malik', 'Cruz', 'Haddad', 'Hoffman', 'Lambert', 'Voss', 'Delacroix', 'Kessler', 'Baptiste', 'Aoki',
  'Tanaka', 'Suzuki', 'Nakamura', 'Yamada', 'Kim', 'Park', 'Choi', 'Silva', 'Costa', 'Almeida',
  'Ferreira', 'Novak', 'Hansen', 'Berg', 'Eriksson', 'Larsen', 'Adeyemi', 'Okonkwo', 'Balogun', 'Abara',
  'Farsi', 'Haddad', 'Karim', 'Siddiqui', 'Rahman', 'Bose', 'Banerjee', 'Krishnan', 'Pillai', 'Desai',
  'Verma', 'Kaur', 'Singh', 'Joshi', 'Bhatt', 'Trivedi', 'Sethi', 'Khanna', 'Arora', 'Bhatia',
  'Novakovic', 'Kowalczyk', 'Dubois', 'Moreau', 'Lefevre', 'Rousseau', 'Fontaine', 'Girard', 'Bertrand', 'Marchal',
  'Castellano', 'Romano', 'Ferrara', 'Greco', 'Bruno', 'Conti', 'Moretti', 'Ricci', 'Colombo', 'Barbieri',
]

// Pool of real, working unsplash portrait crops — reused across mentors (a
// production app would host unique headshots; here we cycle a broad pool).
const AVATAR_POOL = [
  'photo-1507003211169-0a1dd7228f2d', 'photo-1494790108377-be9c29b29330', 'photo-1438761681033-6461ffad8d80',
  'photo-1472099645785-5658abf4ff4e', 'photo-1524504388940-b1c1722653e1', 'photo-1500648767791-00dcc994a43e',
  'photo-1560250097-0b93528c311a', 'photo-1573496359142-b8d87734a5a2', 'photo-1544005313-94ddf0286df2',
  'photo-1531123897727-8f129e1688ce', 'photo-1534528741775-53994a69daeb', 'photo-1580489944761-15a19d654956',
  'photo-1519345182560-3f2917c472ef', 'photo-1506794778202-cad84cf45f1d', 'photo-1487412720507-e7ab37603c6f',
  'photo-1517841905240-472988babdf9', 'photo-1500917293891-ef795e70e1f6', 'photo-1552058544-f2b08422138a',
  'photo-1544723795-3fb6469f5b39', 'photo-1552374196-c4e7ffc6e126', 'photo-1546456073-92b9f0a8d413',
  'photo-1522075469751-3a6694fb2f61', 'photo-1508214751196-bcfd4ca60f91', 'photo-1531427186611-ecfd6d936c79',
  'photo-1489980557514-251d61e3eeb6', 'photo-1502685104226-ee32379fefbe', 'photo-1524250502761-1ac6f2e30d43',
  'photo-1541823709867-1b206113eafd', 'photo-1607990281513-2c110a25bd8c',
]

const LANGUAGE_POOL = ['Hindi', 'Mandarin', 'Spanish', 'French', 'German', 'Japanese', 'Portuguese', 'Arabic', 'Korean']
const HOURS_POOL = ['9:00 AM – 1:00 PM EST', '10:00 AM – 4:00 PM EST', '11:00 AM – 5:00 PM EST', '2:00 PM – 6:00 PM EST', '4:00 PM – 8:00 PM EST', '6:00 PM – 9:00 PM EST']

function availabilityLabelFor(days: boolean[]): string {
  const weekday = days.slice(0, 5).some(Boolean)
  const weekend = days.slice(5).some(Boolean)
  if (weekday && weekend) return 'Flexible'
  if (weekend) return 'Weekends'
  return 'Weekdays'
}

// ── Unique name allocation (guarantees no two mentors share a full name) ────

const usedNames = new Set<string>()
function uniqueName(seed: number): string {
  let i = 0
  while (i < 500) {
    const first = pick(FIRST_NAMES, seed, i)
    const last = pick(LAST_NAMES, seed, i * 3 + 7)
    const full = `${first} ${last}`
    if (!usedNames.has(full)) {
      usedNames.add(full)
      return full
    }
    i++
  }
  return `Mentor ${seed}`
}

// ── Bio + career history + review templates ─────────────────────────────────

function buildBio(name: string, title: string, company: string, years: number, skill: string, pathName: string): string {
  const first = name.split(' ')[0]
  const templates = [
    `${first} spent ${years} years as a ${title.toLowerCase()} at ${company} before turning to mentorship, and now helps learners break into ${pathName} with hands-on, project-driven coaching.`,
    `Formerly of ${company}, ${first} brings ${years} years of production experience to every session, specializing in ${skill} and the practical realities of shipping real ${pathName} work.`,
    `${first} built their career at ${company} over ${years} years and now mentors the next generation of ${pathName} talent, with a focus on ${skill} and interview-ready fundamentals.`,
    `With ${years} years at companies like ${company}, ${first} mentors learners on ${pathName}, drawing on deep expertise in ${skill} and a structured, outcomes-first coaching style.`,
  ]
  return pick(templates, hash(name), hash(title))
}

function buildCareerHistory(title: string, company: string, years: number, seed: number): CareerStop[] {
  const earlierCompanies = ['Infosys', 'Cognizant', 'TCS', 'a Series A startup', 'a regional tech consultancy', 'Accenture', 'Capgemini']
  const juniorTitles = ['Software Engineer', 'Associate Engineer', 'Engineering Intern → Full-time Hire', 'Junior Developer']
  const midYears = Math.max(1, Math.floor(years * 0.4))
  return [
    { role: title, org: company, period: `${Math.max(1, years - midYears - 1)}–Present` },
    { role: pick(juniorTitles, seed, 2), org: pick(earlierCompanies, seed, 5), period: `${Math.max(0, years - midYears - 3)}–${Math.max(1, years - midYears - 1)}` },
  ]
}

const REVIEW_TEMPLATES = [
  (skill: string) => `Sessions were incredibly practical — we went deep on ${skill} instead of just theory. I felt ready for real interviews within weeks.`,
  (skill: string) => `Patient, structured, and clearly cares about outcomes. The ${skill} feedback alone was worth the whole program.`,
  (skill: string) => `Helped me untangle a confusing ${skill} problem I'd been stuck on for a month. Would recommend to anyone serious about this path.`,
  (skill: string) => `Direct, honest feedback on my ${skill} work — exactly what I needed to level up quickly.`,
  (skill: string) => `The mock reviews and ${skill} deep-dives gave me real confidence going into interviews.`,
]

function buildReviews(skills: string[], seed: number): Review[] {
  const reviewerPool = ['Aarav', 'Jenny', 'Michael', 'Sneha', 'Tom', 'Fatima', 'Alex', 'Priyanka', 'David', 'Meghna']
  return [0, 1, 2].map(i => ({
    learnerName: pick(reviewerPool, seed, i * 4),
    rating: Math.round((4.5 + ((seed + i * 9) % 50) / 100) * 100) / 100,
    text: pick(REVIEW_TEMPLATES, seed, i * 6)(pick(skills, seed, i * 2)),
    date: pick(['3 days ago', '1 week ago', '2 weeks ago', '3 weeks ago', '1 month ago'], seed, i * 3),
  }))
}

const NOTE_TITLES = ['Progress Check-in', 'Goal Realignment', 'Milestone Review', 'Strategy Session', 'Momentum Review']
const NOTE_BODIES = [
  'Reviewed recent progress against quarterly goals; adjusted focus areas for the next two weeks.',
  'Worked through a blocking challenge and mapped a clearer path to the next milestone.',
  'Celebrated a recent win and recalibrated pacing to avoid burnout going into next month.',
  'Deep-dived into a specific skill gap with hands-on practice and follow-up resources.',
  'Reset priorities after a shift in the client\u2019s goals and outlined a revised roadmap.',
]
const ACTIVITY_TEMPLATES = [
  (n: string) => `Completed a mentorship session with ${n}`,
  (n: string) => `Received a 5-star review from ${n}`,
  () => 'Updated weekly availability window',
  (n: string) => `${n} reached a new milestone in their track`,
  () => 'Uploaded a new resource to the shared library',
]
const RELATIVE_TIMES = ['2 hrs ago', '1 day ago', '2 days ago', '4 days ago', '1 week ago']
const MONTH_LABELS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
const CLIENT_NAMES = [
  'Liam Foster', 'Emma Torres', 'Noah Patel', 'Olivia Brandt', 'Ethan Kowalski',
  'Ava Whitmore', 'Mason Delgado', 'Sophia Reyes', 'Lucas Bennett', 'Mia Sorensen',
  'Jackson Idowu', 'Amara Osei', 'Elijah Cho', 'Zara Malik', 'Benjamin Cruz', 'Layla Haddad',
]
const CLIENT_AVATAR_IDS = [
  'photo-1519345182560-3f2917c472ef', 'photo-1506794778202-cad84cf45f1d', 'photo-1487412720507-e7ab37603c6f',
  'photo-1517841905240-472988babdf9', 'photo-1500917293891-ef795e70e1f6', 'photo-1552058544-f2b08422138a',
]

function avatarUrl(id: string, size = 200): string {
  return `https://images.unsplash.com/${id}?w=${size}&h=${size}&fit=crop&crop=faces`
}

// ── Mentor generation ────────────────────────────────────────────────────────

function generateMentor(path: PathSeed, index: number): MentorBase {
  const idSeed = `${path.id}-${index}`
  const h = hash(idSeed)
  const name = uniqueName(h + index * 97)

  const title = pick(path.titles, h, index)
  const company = pick(path.companies, h, index * 5 + 2)
  const experienceYears = range(h, 3, 16)

  const skillSet: string[] = []
  for (let i = 0; i < 8 && skillSet.length < 6; i++) {
    const s = pick(path.skills, h, index * 3 + i * 7)
    if (!skillSet.includes(s)) skillSet.push(s)
  }
  const skills = skillSet.slice(0, 6)
  const expertise = skills.slice(0, 3)
  const certifications = Array.from(new Set([0, 1].map(i => pick(path.certs, h, index * 4 + i * 3))))
  const qualifications = [pick(path.quals, h, index * 2)]

  const rating = Math.round((4.55 + range(h, 0, 44) / 100) * 100) / 100
  const sessions = range(h + 11, 95, 640)
  const activeClients = range(h + 22, 6, 30)
  const availableSlots = range(h + 33, 1, 9)
  const successRate = range(h + 44, 74, 99)
  const completionRate = range(h + 55, 72, 98)
  const placementRate = range(h + 66, 58, 92)
  const retentionRate = range(h + 77, 68, 95)
  const responseTimeMinutes = range(h + 88, 12, 260)
  const verified = rating >= 4.78 || h % 3 === 0

  const languages = ['English', ...(h % 4 === 0 ? [pick(LANGUAGE_POOL, h, 3)] : [])]
  const earningsPerSession = 90 + experienceYears * 14 + (h % 60)
  const earningsTotal = Math.round(sessions * earningsPerSession)
  const earningsMonth = Math.round(earningsTotal / Math.max(6, Math.round(sessions / 24)))

  const availableDays = [0, 1, 2, 3, 4, 5, 6].map(d => ((h >> d) & 1) === 1 || (d < 5 && (h + d) % 3 !== 0 && (h % 2 === d % 2)))
  if (availableDays.filter(Boolean).length < 2) { availableDays[1] = true; availableDays[3] = true }

  const bio = buildBio(name, title, company, experienceYears, skills[0], path.name)

  return {
    id: `m-${idSeed}`,
    name,
    avatar: avatarUrl(pick(AVATAR_POOL, h, index)),
    pathId: path.id,
    title,
    company,
    expertise,
    rating,
    sessions,
    activeClients,
    availableSlots,
    successRate,
    completionRate,
    placementRate,
    retentionRate,
    responseTimeMinutes,
    experienceYears,
    verified,
    languages,
    qualifications,
    certifications,
    skills,
    earningsTotal,
    earningsMonth,
    bio,
    availableDays,
    availableHours: pick(HOURS_POOL, h, index),
    availabilityLabel: availabilityLabelFor(availableDays),
  }
}

const MENTORS_BASE: MentorBase[] = PATH_SEEDS.flatMap(path =>
  Array.from({ length: path.mentorCount }, (_, i) => generateMentor(path, i))
)

// ── Derived data generators (deterministic — no external randomness) ───────

function generateClients(m: MentorBase): MentorClient[] {
  const h = hash(m.id)
  const n = Math.min(m.activeClients, 6)
  const out: MentorClient[] = []
  for (let i = 0; i < n; i++) {
    const nameIdx = (h + i * 7) % CLIENT_NAMES.length
    const progress = 28 + ((h + i * 13) % 68)
    const status: MentorClient['status'] = progress >= 88 ? 'Completed' : progress < 45 ? 'Needs Attention' : 'On Track'
    out.push({
      name: CLIENT_NAMES[nameIdx],
      avatar: avatarUrl(pick(CLIENT_AVATAR_IDS, h, i * 3), 100),
      path: m.expertise[i % m.expertise.length],
      progress,
      status,
    })
  }
  return out
}

function generateSessionNotes(m: MentorBase, clients: MentorClient[]): SessionNote[] {
  const h = hash(m.id)
  return [0, 1, 2].map(i => {
    const client = clients.length ? clients[(h + i) % clients.length] : null
    return {
      date: RELATIVE_TIMES[(h + i * 3) % RELATIVE_TIMES.length],
      title: NOTE_TITLES[(h + i * 5) % NOTE_TITLES.length],
      note: (client ? `With ${client.name}: ` : '') + NOTE_BODIES[(h + i * 2) % NOTE_BODIES.length],
    }
  })
}

function generateActivity(m: MentorBase, clients: MentorClient[]): ActivityItem[] {
  const h = hash(m.id)
  return [0, 1, 2, 3, 4].map(i => {
    const client = clients.length ? clients[(h + i * 2) % clients.length] : null
    const template = ACTIVITY_TEMPLATES[(h + i * 4) % ACTIVITY_TEMPLATES.length]
    return {
      date: RELATIVE_TIMES[(h + i) % RELATIVE_TIMES.length],
      text: template(client?.name ?? 'a client'),
    }
  })
}

function generateSessionAnalytics(m: MentorBase): MonthlySessions[] {
  const h = hash(m.id)
  const base = Math.max(4, Math.round(m.sessions / 14))
  return MONTH_LABELS.map((month, i) => ({
    month,
    sessions: Math.max(2, base + ((h + i * 17) % 9) - 4 + i),
  }))
}

export function performanceScore(m: MentorBase): number {
  const ratingScore = (m.rating / 5) * 100 * 0.30
  const completionScore = m.completionRate * 0.20
  const successScore = m.successRate * 0.20
  const placementScore = m.placementRate * 0.15
  const retentionScore = m.retentionRate * 0.10
  const responseScore = Math.max(0, 100 - m.responseTimeMinutes / 3) * 0.05
  return Math.round((ratingScore + completionScore + successScore + placementScore + retentionScore + responseScore) * 10) / 10
}

export const MENTORS: Mentor[] = MENTORS_BASE.map(m => {
  const clients = generateClients(m)
  const h = hash(m.id)
  return {
    ...m,
    performanceScore: performanceScore(m),
    clients,
    sessionNotes: generateSessionNotes(m, clients),
    activity: generateActivity(m, clients),
    sessionAnalytics: generateSessionAnalytics(m),
    careerHistory: buildCareerHistory(m.title, m.company, m.experienceYears, h),
    reviews: buildReviews(m.skills, h),
  }
})

export function mentorsForPath(pathId: string): Mentor[] {
  return MENTORS.filter(m => m.pathId === pathId).sort((a, b) => b.performanceScore - a.performanceScore)
}

export function pathCompletionRate(pathId: string): number {
  const mentors = MENTORS.filter(m => m.pathId === pathId)
  if (!mentors.length) return 0
  return Math.round(mentors.reduce((s, m) => s + m.completionRate, 0) / mentors.length)
}

export function pathPlacementRate(pathId: string): number {
  const mentors = MENTORS.filter(m => m.pathId === pathId)
  if (!mentors.length) return 0
  return Math.round(mentors.reduce((s, m) => s + m.placementRate, 0) / mentors.length)
}

export function pathCapacityRate(pathId: string): number {
  const mentors = MENTORS.filter(m => m.pathId === pathId)
  if (!mentors.length) return 0
  const utilizations = mentors.map(m => (m.activeClients / (m.activeClients + m.availableSlots)) * 100)
  return Math.round(utilizations.reduce((s, v) => s + v, 0) / utilizations.length)
}

export function pathCapacityDistribution(pathId: string): { min: number; avg: number; max: number } {
  const mentors = MENTORS.filter(m => m.pathId === pathId)
  if (!mentors.length) return { min: 0, avg: 0, max: 0 }
  const utilizations = mentors.map(m => Math.round((m.activeClients / (m.activeClients + m.availableSlots)) * 100))
  return {
    min: Math.min(...utilizations),
    max: Math.max(...utilizations),
    avg: Math.round(utilizations.reduce((s, v) => s + v, 0) / utilizations.length),
  }
}

// ── Category-level rollups (powers Overview & the ecosystem-wide dashboard) ─

export interface CategorySummary {
  category: Category
  paths: number
  mentors: number
  learners: number
  activeLearners: number
  completion: number
  placement: number
  retention: number
  rating: number
  growth: number
  revenue: number
  health: 'Healthy' | 'Needs Attention' | 'Critical'
}

function feePerLearnerForCategory(category: Category): number {
  const base: Record<Category, number> = {
    'Career & Tech': 2600,
    'Health & Fitness': 1450,
    'Mindset': 1150,
    'Personal Life': 1050,
    'Student Life': 1350,
  }
  return base[category]
}

export const CATEGORY_SUMMARIES: CategorySummary[] = CATEGORIES.map(category => {
  const paths = pathsByCategory(category)
  const mentors = MENTORS.filter(m => paths.some(p => p.id === m.pathId))
  const learners = paths.reduce((s, p) => s + p.totalLearners, 0)
  const activeLearners = paths.reduce((s, p) => s + p.activeLearners, 0)
  const completion = Math.round(paths.reduce((s, p) => s + pathCompletionRate(p.id) * p.activeLearners, 0) / activeLearners)
  const placement = Math.round(paths.reduce((s, p) => s + pathPlacementRate(p.id) * p.activeLearners, 0) / activeLearners)
  const retention = Math.round(mentors.reduce((s, m) => s + m.retentionRate, 0) / mentors.length)
  const rating = Math.round((mentors.reduce((s, m) => s + m.rating, 0) / mentors.length) * 100) / 100
  const growth = Math.round((paths.reduce((s, p) => s + p.trend * p.activeLearners, 0) / activeLearners) * 10) / 10
  const revenue = Math.round(activeLearners * feePerLearnerForCategory(category))
  const capacity = Math.round(
    mentors.reduce((s, m) => s + (m.activeClients / (m.activeClients + m.availableSlots)) * 100, 0) / mentors.length
  )
  const health: CategorySummary['health'] =
    capacity >= 92 || completion < 66 || retention < 66 ? 'Critical' : capacity >= 82 || completion < 76 || retention < 76 ? 'Needs Attention' : 'Healthy'
  return { category, paths: paths.length, mentors: mentors.length, learners, activeLearners, completion, placement, retention, rating, growth, revenue, health }
})

export function getPath(pathId: string): GrowthPath | undefined {
  return GROWTH_PATHS.find(p => p.id === pathId)
}

export function getMentor(mentorId: string): Mentor | undefined {
  return MENTORS.find(m => m.id === mentorId)
}
