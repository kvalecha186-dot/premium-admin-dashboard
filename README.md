# Starfix Admin Dashboard

This is the admin side of **Starfix**, my mentorship and personal-growth platform.

Starfix has separate experiences for learners and mentors. The admin dashboard is where platform-level information can be reviewed in one place — users, mentors, growth paths, bookings and activity. I built it as a separate application so the administrative experience can be developed and deployed independently from the main website.

**Live preview:** [premium-admin-dashboard.vercel.app](https://premium-admin-dashboard.vercel.app)  
**Main application:** [Starfix Website](https://github.com/kvalecha186-dot/Starfix-Website)

## What the dashboard covers

- **Overview:** A high-level view of learners, mentors, bookings, sessions and platform activity.
- **Learner management:** Browse learner records and open a more detailed learner view.
- **Mentor management:** Review mentor profiles, categories, activity and related information.
- **Growth paths:** Review the paths available on Starfix and how learners are progressing through them.
- **Bookings and conversations:** View booking-related information and platform communication data where available.
- **Analytics:** Explore engagement, growth and platform metrics.
- **Growth intelligence:** Bring progress and activity information together to make platform trends easier to understand.
- **Live activity:** The application includes data-refresh and login-audit flows intended to keep the admin view in sync with activity on the main platform.

The dashboard is designed around the data and workflows of Starfix rather than being a generic admin template.

## Tech stack

| Part | Technology |
|---|---|
| UI | React 19 |
| Language | TypeScript |
| Build tool | Vite 8 |
| Styling | Tailwind CSS 4 and custom styles |
| Data access | Starfix backend / Supabase data layer |
| Charts | Dashboard analytics components |
| Hosting | Vercel |
| Version control | Git and GitHub |

## How it fits into Starfix

\`\`\`text
                 Starfix Platform
                        |
             +----------+----------+
             |                     |
             v                     v
      Starfix Website        Starfix Admin
      Learner / Mentor       Admin interface
             |                     |
             +----------+----------+
                        |
                 Shared platform data
                   and backend APIs
\`\`\`

The admin app reads platform information through its data-access layer. The code includes database-backed queries and RPC calls for overview, learner and mentor information, along with login-audit data.

A note on the current state: some analytics modules also contain generated/sample datasets and some fallback values for cases where data is unavailable. Those values are useful while building and previewing the interface, but they should not be treated as verified live business metrics. The data source for each metric needs to be checked before using the dashboard for real operational decisions.

## Run locally

### Requirements
- Node.js
- npm

### Setup

\`\`\`bash
git clone https://github.com/kvalecha186-dot/premium-admin-dashboard.git
cd premium-admin-dashboard
npm install
npm run dev
\`\`\`

Create a production build:

\`\`\`bash
npm run build
\`\`\`

The application uses the configuration in its data-access layer to connect to the Starfix backend. Check the files under \`src/lib/\` before setting up a local environment. Keep private keys and service credentials out of the repository.

## Project structure

A few useful areas of the codebase:

- \`src/adminBackend.ts\` — admin-facing data operations and platform queries.
- \`src/liveAdmin.tsx\` — live admin views, refresh logic and access gate.
- \`src/analytics/\` — analytics dashboard and visualisation modules.
- \`src/users/\` — learner list and detail views.
- \`src/mentors/\` — mentor management views.
- \`src/lib/\` — backend access, authentication and login-audit helpers.

## Current development priorities

- Make every production metric use a clearly identified, verified data source.
- Remove demo authentication paths from production use.
- Enforce admin permissions on the backend, not only in the UI.
- Check that admin queries respect database access policies.
- Add tests for access control, data loading and important admin actions.
- Improve empty, loading and error states so missing data is never mistaken for a real zero or a real metric.

## Why this is a separate repository

Keeping the admin dashboard separate makes it easier to work on the internal platform experience without coupling every change to the learner and mentor application. It also gives the project a clearer structure: one app for using Starfix, and another for operating it.
