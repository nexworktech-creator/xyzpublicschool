# XYZ Public School — Management & Public Portal

A full-stack school website and management system built with **Next.js 14 (App
Router)**, **MongoDB / Mongoose**, and **Cloudinary** for media hosting.

## What's built

### Public website
- Header with logo, nav, and **Admin Login** / **Teacher Login** buttons
- Hero section with mission statement and a manual banner slider
- **Admission Inquiry** modal (Class dropdown Nursery–12, name, mobile, area) →
  saved to MongoDB via `POST /api/inquiry`
- **Topper's Corner** — honor-roll grid pulling live data from MongoDB
- **Activities & Events** gallery — supports uploaded photos (via Cloudinary)
  and embedded videos (e.g. YouTube)
- Footer with address, contact, social links, and the
  "Designed & Developed by Nexwork Tech" attribution

### Role-based system (Admin / Teacher)
- JWT session in an httpOnly cookie, checked both in `middleware.js` (edge,
  fast redirect) and again on each server-rendered page (defense in depth)
- **Admin login**: email/password, or a quick **PIN** (default `12345`,
  configurable via `SEED_ADMIN_PIN`)
- **Admin dashboard**: real-time metric cards (Teachers/Students present &
  absent today), Inquiries, Topper's Corner manager, Events manager,
  Students & Attendance, Results & Grading viewer (Excel/PDF export), Exam
  Configuration & Custom Grading, Fee Defaults, Copy Unchecked Audit, Teacher
  Attendance & Logs, Staff Accounts
- **Teacher dashboard**: Mark Attendance (daily, per class/section), Enter
  Results (auto-graded + auto-ranked against a configurable Grade Scale,
  respecting per-subject Mark Lock), Copy Checking (per-subject checking
  cycles with a per-student checklist)

### Admin Module — Teacher Management
- Add Teacher: name, role type (Teacher / Accountant / Principal), Class
  Teacher designation, Subject Teacher assignments (subject → class
  mapping), system password, quick-login PIN, a unique auto-generated
  `teacherId` (e.g. `T-0001`), and an optional webcam face-data capture
  saved against the record
- List, edit, deactivate (soft-delete) or permanently delete (hard-delete)
  staff records from **Admin → Staff Accounts**

### Admin Module — Students & Attendance
- **Admin → Students & Attendance**: full student list filterable by class,
  with each student's live daily attendance status (Present/Absent/etc.)

### Admin Module — Teacher Attendance & Logs
- **Admin → Teacher Attendance & Logs**: synchronized daily check-in/
  check-out timestamps per teacher, plus a "Download Attendance (Excel)"
  button that exports the selected month's log

### Admin Module — Fee Defaulter Tracking
- **Admin → Fee Defaults**: students with pending fees, showing name, class,
  and the number of months' installments overdue (`pendingMonths`)

### Admin Module — Copy Unchecked Audit
- **Admin → Copy Unchecked Audit**: pick a class to see every notebook
  still flagged as unchecked — student name, roll number, subject, and the
  reporting Subject Teacher

### Admin Module — Exam Configuration & Custom Grading
- **Admin → Exam Configuration & Grading**:
  - Per-subject mark distribution (e.g. PA-1: 15, Notebook/Copy: 5,
    Half-Yearly Exam: 80), or non-academic grading options (e.g. A+, B+, C+)
    for subjects that aren't marked numerically
  - Admin Grading Scale Setup — editable mark-range → grade bands (seeded
    with the example scale: 33–45 → C2, 46–60 → B1, 80–90 → A2, 91–100 → A1)
  - Dynamic report-card layout builder — toggle overall attendance, rank,
    remarks, grading-scale key and custom notes on/off for the final PDFs
  - **Mark Lock Logic**: Subject Teachers enter and save marks for their own
    subjects only; Class Teachers can view every subject on the student's
    report-card sheet but cannot edit or overwrite another teacher's saved
    marks (enforced server-side in `/api/results`)

### Accountant Module
- **Accountant login** (`/accountant/login`) — separate portal role
- **Accountant → Fee Status & Records**: pick a class, see every student's fee
  status, and Mark Paid / Mark Unpaid for any month or term
  (`PATCH /api/fees/mark`); a school-wide Fee Defaulters list sits below it,
  and every update reflects immediately on the Admin and Principal dashboards
  since they all read the same `FeeRecord` data

### Principal Module
- **Principal login** (`/principal/login`) — separate, read-only portal role
- **Principal Dashboard**: the same real-time metric cards as Admin, plus:
  - **Unchecked Notebook Tracker** — class-wise flagged notebooks (student,
    roll number, subject, reporting Subject Teacher)
  - **Fee Defaulters** — school-wide, read-only
  - **Staff Attendance** — every teacher's check-in/check-out logs, with
    Excel export
  - **Academic Performance** — class-wise results, ranks and grades

### Class Teacher (CT) additions to the Teacher Module
A teacher whose `classTeacherOf` is set sees three extra dashboard tiles:
- **Class Roster** (`/teacher/students`) — add new students directly to
  their own class (`POST /api/students` now allows a CT for their class,
  in addition to Admin) and view the full roster
- **Smart Attendance (2 modes)** — built into the existing Mark Attendance
  screen: Mode A (enter Absent roll numbers → everyone else auto-Present) or
  Mode B (enter Present roll numbers → everyone else auto-Absent)
- **Attendance Sheet** (`/teacher/attendance-sheet`) — a monthly grid, green
  **P** / red **A** per student per day, with a Download Excel button
  (`GET /api/attendance/monthly`, `GET /api/attendance/export/excel`)
- **Report Cards** (`/teacher/report-cards`) — the CT's class roster with a
  **Generate Result (PDF)** button per student; the PDF now also computes
  and prints the student's overall attendance percentage alongside marks,
  grade and a school-branded header (`GET /api/results/export/pdf`)

### Data model
`User`, `Student`, `Inquiry`, `Topper`, `Event`, `Attendance`,
`TeacherAttendance`, `GradeScale`, `ExamConfig`, `ReportCardConfig`,
`Result`, `FeeRecord`, `CopyCheck` — see `/models`.

### Exports
- `GET /api/results/export/excel` — class mark-sheet as `.xlsx` (ExcelJS)
- `GET /api/results/export/pdf` — single-student report card as `.pdf`
  (PDFKit), including attendance % and school branding
- `GET /api/attendance/export/excel` — class monthly attendance grid as
  `.xlsx`, colored green (Present) / red (Absent)
- `GET /api/teacher-attendance/export` — staff monthly check-in/out log as
  `.xlsx`

## Setup

```bash
cd xyz-school
npm install
cp .env.example .env.local   # then fill in MongoDB URI, JWT secret, Cloudinary keys
npm run seed                 # creates the first Super Admin + a default grade scale
npm run dev
```

Open http://localhost:3000. Sign in at `/admin/login` with the email/password
printed by the seed script (from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in
your `.env.local`), then create teacher accounts from **Admin → Staff
Accounts**. Give a teacher a **Class Teacher designation** there to unlock
their CT-only tiles (Class Roster, Attendance Sheet, Report Cards), and set
their **Portal role** to Accountant or Principal to create logins for those
new portals (`/accountant/login`, `/principal/login`).

> Note: `classTeacherOf` is carried on the teacher's session token, so if you
> change someone's Class Teacher designation while they're already logged
> in, they'll need to log out and back in for the new CT tiles to appear.

### Cloudinary
Create a free account at cloudinary.com, then copy your Cloud Name, API Key
and API Secret into `.env.local`. Photo uploads (toppers, events) go through
the server (`lib/cloudinary.js`) so your API secret never reaches the browser.

### MongoDB
Any MongoDB instance works — MongoDB Atlas's free tier is the fastest way to
get a `MONGODB_URI`.

## Adding real data

- Add students first (`POST /api/students`, or wire up an Admin → Students
  screen using the same pattern as Staff Accounts)
- Attendance, Results and Copy-Checks all look students up by `className` +
  `section`, so make sure those match exactly across screens
- The homepage caches public data for 60 seconds (`revalidate = 60` in
  `app/page.js`) — new toppers/events appear within a minute without a
  redeploy

## What to build next

This scaffold prioritized a fully working public portal plus a real
foundation for the school-management side. Natural next additions, following
the same patterns already in the codebase:

- Admin **Students** screen (bulk add/import, matching the Staff Accounts
  pattern)
- Admin **Grade Scales** screen (the API and model already support multiple
  named scales per class group)
- Attendance **monthly summary** export (per-student % present) reusing
  `lib` export helpers
- Fee **installment recording** UI (the model already supports partial
  payments and due dates — only the payment-entry screen is missing)
- Parent-facing result/fee lookup by admission number (public, read-only)

## Tech stack

- Next.js 14 (App Router), React 18, Tailwind CSS
- MongoDB + Mongoose
- Cloudinary (media hosting)
- JWT (`jsonwebtoken` server-side, `jose` in edge middleware) + bcrypt
- ExcelJS (Excel export), PDFKit (PDF export), Zod (input validation)

## Design notes

The visual identity is deliberately not a generic SaaS look: a navy/brass/
ivory academic palette, Fraunces (serif, headings) paired with Inter (sans,
body), plaque-style topper cards with a ribbon rank, and a ruled-notebook
background texture on the hero — meant to read as a school prospectus rather
than a dashboard template.
