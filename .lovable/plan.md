

# DCS ATS — Exact Replica Build

Complete rebuild of the Daruwallas Consultancy Services ATS on Lovable Cloud (React + Supabase), replicating all 30+ pages and features.

---

## Phase 1: Foundation & Authentication

### App Shell & Layout
- Main sidebar layout with collapsible navigation matching the original
- Header with user info, notifications, and theme toggle (dark/light mode via ThemeContext)
- Idle detection modal and logout-blocked modal
- Todo navigation guard (prevents navigation with incomplete todos)

### Authentication
- Login page with dual mode: **OTP (phone)** and **email/password**
- OTP flow: enter phone → receive 6-digit code → verify
- Role-based access control with 4 roles: Super Admin, Admin, HR Manager, Recruiter
- Protected routes with minimum role requirements
- Session management with auto-redirect

### Database Setup
- Full PostgreSQL schema in Supabase replacing MongoDB
- Tables: users, user_roles, candidates, jobs, companies, matches, interviews, todos, email_queue, verifications, activity_logs, settings, hired_candidates, company_contacts, hr_pipeline, money_alerts
- Row-Level Security policies enforcing role-based access

---

## Phase 2: Public-Facing Pages

### Candidate Portal (public, no auth)
- **Portal Home Page** — Landing page for candidates
- **Portal Onboarding Page** — Candidate onboarding flow (`/onboarding/:candidateId`)
- **Public CV Submit Page** — Public form for candidates to submit their CVs (`/submit-cv`)

### HR Pipeline Public Pages (token-based access)
- **HR Review Page** — HR reviews candidates via secure token link
- **HR Swipe Review Page** — Tinder-style swipe interface for reviewing candidates
- **Interview Schedule Page** — Candidates view and confirm interview slots
- **Interview Select Page** — Candidates select preferred interview time
- **HR Opt-Out Page** — HR can opt out of pipeline via token
- **HR Reopen Page** — HR can reopen a closed pipeline via token

---

## Phase 3: Core ATS Admin Pages

### Dashboard
- Stats cards: total candidates, active jobs, matches, interviews
- Charts (bar + pie) for candidate statuses, job priorities, matching trends
- Time-based greeting (morning/afternoon/evening)
- Quick action buttons and recent activity feed
- Match percentage filter and score rings
- Pipeline stats and hired stats widgets
- Verification stats widget

### Jobs Management
- **Jobs List Page** — Table/grid with search, filters (status, priority), sort
- **Job Detail Page** — Full job info, requirements, matched candidates, interview history
- Add/edit job forms with all fields
- Job status workflow: Draft → Open → On Hold → Closed → Filled

### Candidates Management
- **Candidates List Page** — Advanced search, filters (skills, experience, location, status)
- **Candidate Detail Page** — Parsed CV data, documents, work history, verification status, timeline
- CV upload with AI-powered parsing
- Candidate pipeline: New → Screening → Shortlisted → Interview → Offered → Hired/Rejected

### Companies Management
- **Companies List Page** — Search, filter, and sort companies
- **Company Detail Page** — Contact persons, linked jobs, former employees, verification contacts

---

## Phase 4: Matching & Intelligence

### Power Match
- **Matches Page** — All matches with score breakdowns, status filters
- **Match Detail Page** — Full score analysis (skills, experience, education, location, salary), strengths/gaps, recommendation
- Match status tracking: New → Reviewed → Shortlisted → Rejected → Hired

### Matching Resumes
- **Matching Resumes Page** — Upload a JD and find matching candidates from the database

### Reverse Matching
- **Reverse Matching Page** — Select a candidate and find matching jobs across all companies

### AI-Powered Parsing
- CV parsing via Lovable AI edge function to extract structured candidate data
- JD parsing to extract job requirements automatically

---

## Phase 5: Workflows & Communication

### Calendar & Interviews
- **Calendar Page** — Monthly/weekly view of all scheduled interviews
- Interview scheduling with candidate, job, date/time, interviewers
- Status tracking: Scheduled → Completed → Cancelled → No Show

### Todos
- **Todos Page** — Full task management with priority and status filters
- Todo types: General, Interview Docs, Company Contacts, Background Verification
- Checklist items within todos, notes/comments
- Sequential task dependencies
- Navigation guard preventing leaving with incomplete required todos

### Emails
- **Emails Page** — Email approval queue (HR Manager+ access)
- Draft → Pending Approval → Approved/Rejected → Sent workflow
- Email templates for verification requests
- Auto-triggered emails from workflow actions

### Verifications
- **Verifications Page** — Background verification workflow
- Employment verification per candidate with company contact tracking
- Status: Pending → Email Sent → Verified → Rejected

### HR Pipeline
- **HR Pipeline Page** — Internal view of the HR review pipeline
- Track which HR contacts have reviewed, accepted, or rejected candidates

---

## Phase 6: Advanced Features

### Deal Closer
- **Deal Closer Page** — Track and manage candidate offers and negotiations

### Money Alerts
- **Money Alerts Page** — Financial tracking for placements, fees, and payment alerts

### Insights
- **Insights Page** — Advanced analytics and reporting across all ATS data

### Hired Candidates
- **Hired Candidates Page** — Dedicated view of all successfully placed candidates

### Master Database
- **Master Database Page** — Admin-only unified view of all system data (Admin+ access)

---

## Phase 7: Productivity & Admin

### Productivity Center
- **Productivity Center Page** — Activity tracking, daily reports, idle detection stats (Admin+ access)

### Activity Logs
- **Activity Page** — Audit trail of all user actions in the system (Admin+ access)

### User Management
- **Users Page** — Create, edit, deactivate users and assign roles (Admin+ access)

### Settings
- **Settings Page** — AI provider config, SMTP settings, verification rules, system config (Super Admin only)

---

## Technical Architecture

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth + Storage)
- **AI**: Lovable AI for CV/JD parsing via edge functions
- **Auth**: Supabase Auth with OTP + email/password, roles in separate user_roles table
- **File Storage**: Supabase Storage for CVs, documents, attachments

## Build Approach
This is a large application (~30 pages). We'll build it incrementally, phase by phase, testing each phase before moving to the next. **Please upload screenshots** of your existing app so the UI can be matched exactly.

