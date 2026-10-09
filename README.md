# AlfaFocus

[![Made with AI](https://img.shields.io/badge/Made_with-AI_assistance-blue)](AI-USAGE.md)

> Built with the assistance of **Antigravity (Google DeepMind)**, adhering to the course AI policy with $\ge 20\%$ self-authored code. See the full disclosure and commit references in [AI-USAGE.md](AI-USAGE.md).

**Live site:** https://javiealfaro.github.io/alfafocus/  
**API:** https://alfafocus-api.onrender.com/healthz  
**Demo video:** *(Week 3 Submission)*

> **Live Authentication & Backend Active:** Demo mode is disabled. The application is connected to the live Express API on Render and PostgreSQL on Supabase, featuring user registration, JWT session management, and isolated workspaces.

---

## 1. Overview

AlfaFocus is an all-in-one productivity web application designed for students and professionals to organize daily tasks, break complex projects into nested subtasks, schedule deadlines on an interactive calendar, and drive habit consistency using customizable focus timers, streaks, and activity heat maps.

It solves the problem of productivity fragmentation—where individuals must switch between separate to-do list apps, standalone Pomodoro timers, and external calendar planners—by unifying these workflows into a single cohesive command center.

---

## 2. Setup and installation

Follow these steps in order to set up AlfaFocus from scratch:

### Prerequisites (What to install first)
* **Node.js:** v18.0.0 or higher
* **npm:** v9.0.0 or higher
* **PostgreSQL:** v15.0 or higher (or a free cloud database instance from [Supabase](https://supabase.com))
* **Git:** for version control

### Clone the repository
```bash
git clone https://github.com/javieAlfaro/alfafocus.git
cd alfafocus
```

### Install dependencies
Install dependencies for both the frontend client and the backend server:

```bash
# 1. Install client dependencies
cd client
npm install

# 2. Install server dependencies
cd ../server
npm install
cd ..
```

### Environment and configuration
Copy the example environment files in both folders. Never commit real credentials to GitHub.

```bash
# Frontend environment setup
cd client
cp .env.example .env

# Backend environment setup
cd ../server
cp .env.example .env
```

#### Environment Variables Reference

| Variable | Location | Example / Placeholder Value | Purpose |
|---|---|---|---|
| `VITE_USE_MOCK_API` | `client/.env` | `true` | When `true` (or unset), client uses browser `localStorage`. Set to `false` for live API. |
| `VITE_API_BASE_URL` | `client/.env` | `http://localhost:3000` | Base URL of the Express backend API. |
| `VITE_APP_PASSWORD` | `client/.env` | `alfa2026` | Access PIN sent in request headers to pass the server access gate. |
| `DATABASE_URL` | `server/.env` | `postgres://user:password@localhost:5432/alfafocus` | PostgreSQL connection string (Supabase URI in production). |
| `APP_PASSWORD` | `server/.env` | `alfa2026` | Master password for the app-level access gate. |
| `CORS_ORIGINS` | `server/.env` | `http://localhost:5173,https://javiealfaro.github.io` | Comma-separated list of allowed origins. |
| `PORT` | `server/.env` | `3000` | Port the Express server listens on (assigned by host in production). |

### Set up and seed the database
To create the database tables and populate sample seed data:

```bash
cd server
# Option A: Run directly using PostgreSQL psql CLI
psql -d YOUR_DATABASE_URL -f db/schema.sql
psql -d YOUR_DATABASE_URL -f db/seed.sql

# Option B: Run via the built-in template runner
npm run db:reset
```
*(If using Supabase, you can also paste the contents of `server/db/schema.sql` and `server/db/seed.sql` into the Supabase SQL Editor).*

---

## 3. How to run it

### Running in Demo Mode (Client Only, No Database Required)
Demo mode is the default and runs purely inside your browser:
```bash
cd client
npm run dev
```
* **Address to open:** [http://localhost:5173](http://localhost:5173)
* **What you should see:** The dark-themed AlfaFocus dashboard (`#09090B` background, Emerald accents), showing the sidebar navigation with a `🔥 7 Days` streak counter, today's checklist with pre-loaded sample tasks, and the active focus card displaying a `25:00` Pomodoro timer ready to start.

### Running the Full Stack (Client + Server + PostgreSQL)
```bash
# Terminal 1: Start Express API
cd server
npm run dev
# Expected output: "AlfaFocus API listening on http://localhost:3000"

# Terminal 2: Start Client connected to API
cd client
# Ensure client/.env has VITE_USE_MOCK_API=false
npm run dev
```
* **Verify API process is alive:** Open [http://localhost:3000/healthz](http://localhost:3000/healthz) $\rightarrow$ Expected response: `{"ok":true,"app":"AlfaFocus API"}`
* **Verify Database is reachable:** Open [http://localhost:3000/readyz](http://localhost:3000/readyz) $\rightarrow$ Expected response: `{"ok":true,"db":"up"}`

---

## 4. Features and usage

### Primary Flow Walkthrough
1. **Review Daily Objectives:** Open the app to view **Today's Focus**, organized with category tags (`WORK`, `PERSONAL`, `STUDY`) and progress bars.
2. **Quick-Add New Tasks:** Type a task description into the top input bar, choose a category tag, and press Enter or "Add" to immediately prepend it to today's list.
3. **Lock into Active Focus:** Click on any task card to make it the active task in the right-hand **Currently Focusing** panel.
4. **Run a Timer Session:** Select a timer mode (`Pomo` 25m, `Deep` 50m, or `Stopwatch`), and click **Start Focus**. The timer executes with drift-free timestamp math. You can pause or reset at any point.
5. **Session Completion:** When the countdown reaches zero, an audio chime plays, and the completed focus duration is automatically recorded to your session history.
6. **Track Daily Progress:** Click the check circle on finished items. The task title strikes through and the **Daily Progress** bar updates dynamically.

### REST API Endpoints

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/healthz` | Process liveness check for cloud deployment | `200` |
| `GET` | `/readyz` | Database connectivity readiness probe | `200`, `503` |
| `GET` | `/api/tasks` | Retrieve all tasks sorted by creation date | `200`, `401` |
| `POST` | `/api/tasks` | Create a new task (validated server-side) | `201`, `400`, `401` |
| `PATCH` | `/api/tasks/:id` | Update task fields (completed status, progress, title) | `200`, `400`, `401`, `404` |
| `DELETE`| `/api/tasks/:id` | Delete a task (cascades subtasks) | `204`, `401`, `404` |
| `GET` | `/api/focus/sessions` | Retrieve focus session history for the activity heat map | `200`, `401` |
| `POST` | `/api/focus/sessions` | Record a completed focus session | `201`, `400`, `401` |

> *Note: All `/api/*` endpoints require the `x-app-password` header matching the server's `APP_PASSWORD` environment variable.*

---

## 5. Project structure

```
alfafocus/
├── client/                     # Frontend React application (built with Vite)
│   ├── src/
│   │   ├── api/                # Dual-mode API adapter
│   │   │   ├── index.js        # Exports unified methods based on VITE_USE_MOCK_API
│   │   │   ├── mockApi.js      # Browser localStorage implementation with realistic latency
│   │   │   ├── httpApi.js      # Fetch client sending x-app-password headers to Express
│   │   │   └── seed.json       # Initial seed tasks for demo mode
│   │   ├── components/
│   │   │   ├── FocusHub.jsx         # Today & Focus Hub dashboard (Sidebar, List, Timer)
│   │   │   ├── ProjectBreakdown.jsx # Lists & Projects (Nested Subtask Trees, Progress)
│   │   │   ├── CalendarPlanner.jsx  # Month Calendar Grid & Day Inspector Panel
│   │   │   ├── HabitsHeatMap.jsx    # 12-Week Focus Heat Map & Habit Routine Bubbles
│   │   │   └── DemoNotice.jsx       # Course demo mode indicator banner
│   │   ├── hooks/
│   │   │   └── useTimer.js     # Self-authored drift-free countdown & stopwatch hook
│   │   ├── App.jsx             # Main application container & persistent navigation shell
│   │   └── styles.css          # Tailwind CSS layer directives & base styles
│   ├── tailwind.config.js      # Custom design tokens (Zinc 950 bg, Emerald 500 accent)
│   └── postcss.config.js       # PostCSS plugins for Tailwind
├── server/                     # Backend REST API (Node.js & Express)
│   ├── db/
│   │   ├── pool.js             # PostgreSQL connection pool with defensive URL normalizer
│   │   ├── schema.sql          # Relational tables: users, task_lists, tasks, focus_sessions
│   │   └── seed.sql            # Realistic sample seed records
│   ├── utils/
│   │   └── validators.js       # Self-authored server input sanitization & validation
│   ├── tasksRepo.js            # Parameterized database queries ($1, $2) supporting hierarchy
│   └── server.js               # Express application, routes, access gate, and error handler
├── docs/                       # Course planning documents & assets
│   └── assets/                 # Screenshots and application mockups (SVGs)
├── AI-USAGE.md                 # Detailed AI assistance record, commit links, and badge proof
├── REPORT.md                   # Weekly progress increment report
└── README.md                   # Primary documentation (this file)
```

---

## 6. Screenshots

### Figure 1: Today & Focus Hub View
![AlfaFocus Today and Focus Hub Dashboard](docs/assets/screenshot.svg)
*Featuring persistent sidebar navigation, streak stats, quick-add task checklist, and active circular Pomodoro timer.*

### Figure 2: Lists & Multi-Tier Subtask Trees
![AlfaFocus Lists and Nested Subtasks](docs/assets/screenshot-lists.svg)
*Featuring custom project folders (`AlfaFocus Redesign`, `Marketing Q1`), collapsible subtask trees, and dynamic parent progress calculation.*

### Figure 3: Calendar & Day Planner View
![AlfaFocus Calendar and Planner](docs/assets/screenshot-calendar.svg)
*Featuring interactive October 2026 month grid, scheduled focus block chips, today highlight, and right-hand daily agenda inspector.*

### Figure 4: Habits Tracker & 12-Week Focus Heat Map
![AlfaFocus Habits and Heat Map](docs/assets/screenshot-habits.svg)
*Featuring 4 productivity stat cards (Streak, Focus Time, Completed Tasks, Efficiency), 84-day (12-week) GitHub-style emerald heat map, and weekly habit routine tracker.*

---

## 7. Known issues and next steps

### Current Status (Week 2 Increment Complete)
* **Full 4-Screen Loop Delivered:** Users can seamlessly navigate between Today Focus Hub, Lists & Nested Projects, Calendar Planner, and Habits & Heat Map without page reloads.
* **Hierarchical Subtask Trees:** Parent tasks dynamically aggregate completion percentages from child subtasks (`Math.round((completed / total) * 100)`), with collapsible chevron toggles and cascading database deletion (`ON DELETE CASCADE`).
* **12-Week Focus Intensity Grid:** An 84-day GitHub-style heat map visualizing daily focus duration in 5 emerald color tiers, accompanied by live productivity stats and weekly habit bubbles.
* **Month Calendar Grid:** Interactive October 2026 grid with scheduled focus blocks and a detailed date inspector panel for deep planning.
* **Live Supabase PostgreSQL Database:** Successfully provisioned Supabase PostgreSQL via an IPv4 session pooler with parameterized queries, schema migrations, and seed data.
* **Security & Auditing:** Completed and verified all 31 checks in [`SECURITY-CHECKLIST.md`](../project/SECURITY-CHECKLIST.md) (git secret scans, CORS named origins, input sanitization, app-level password gate).

### Next Steps for Week 3 (Final Increment & Presentation)
1. Deploy the Express REST API server to **Render** with production environment variables (`DATABASE_URL`, `APP_PASSWORD`, `CORS_ORIGINS`).
2. Point the production client on GitHub Pages to the live Render API (`VITE_USE_MOCK_API=false`).
3. Record the 3–5 minute final walkthrough presentation video demonstrating core workflows, responsive UI, database persistence, and security controls.
4. Prepare the final slide deck and generate the required 1080x1080 promo square graphic for course submission.

---

## Author & License

* **Author:** Javie Alfaro (BSCS - 4th Year, 6APSI)
* **Course:** HAU 6APSI - Web Application Development
* **License:** MIT, see [LICENSE](LICENSE)
