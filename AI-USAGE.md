# AI Usage Log & Disclosure

[![Made with AI](https://img.shields.io/badge/Made_with-AI_assistance-blue)](AI-USAGE.md)

This project was built with the assistance of **Antigravity (Google DeepMind)**, adhering to the 80/20 rule: at least 20% of the codebase is manually authored and deeply understood, with all architectural decisions, debugging, and integrations actively verified.

---

## 1. How I Used AI (Entries)

### Entry 1: Architecture Planning, Schema Design & Deliverable Breakdown
* **Date:** 2026-09-21
* **Tool:** Antigravity (Google DeepMind / Gemini 3.8 Flash)
* **What I asked for:** Analyze the course guidelines (`finals/`), badging rubrics (`finals-badge/`), and my proposal (`project/PROPOSAL.md`). Propose an architecture fitting the 3-day Week 1 sprint with Supabase and Tailwind CSS.
* **What it gave back:** A full architectural plan, normalized relational PostgreSQL schema (with self-referencing subtasks), dual-mode client adapter strategy, and a prioritized 3-week roadmap.
* **What I kept, what I changed, and why:** Kept the database schema and dual-mode architecture. Changed the auth strategy from full JWT to an app-level password gate (`alfa2026`) as permitted by the course security checklist (item 18/20) to maintain rapid delivery during the 3-day sprint.
* **Commit link:** `e6f5c19` (docs: initialize AI-USAGE.md with architectural plan and disclosure)

### Entry 2: Scaffolding the Focus Hub UI Layout & Tailwind Tokens
* **Date:** 2026-09-21
* **Tool:** Antigravity (Google DeepMind / Gemini 3.8 Flash)
* **What I asked for:** Generate the React and Tailwind component layout for the Today & Focus Hub screen matching the Dark Mode theme and tokens from `Design_System.pdf` (#09090B background, #18181B surface, #10B981 accent).
* **What it gave back:** A modular 3-column layout (Sidebar navigation, Today's Focus checklist with progress bars, and the active task focus timer card) connected to a dual-mode API adapter.
* **What I kept, what I changed, and why:** Kept the responsive layout and Tailwind color tokens. Adjusted the card spacing and button typography to strictly match the 8px spatial rhythm specified in the design system.
* **Commit link:** `ca254ca` (feat(ui): configure Tailwind CSS and scaffold Focus Hub view with dark mode and emerald tokens)

---

## 2. Where the AI Got It Wrong

### Case 1: Browser Background Throttling & Timer Drift in Countdown Hook
* **Date / Phase:** Week 1 (2026-09-21)
* **What it gave back:** An initial `useTimer` implementation relying on standard React `useEffect` with `setInterval(() => setTimeLeft(t => t - 1), 1000)`.
* **What was wrong with it:** In modern browsers (Chrome/Edge/Brave), background tabs or inactive windows aggressively throttle `setInterval` executions to once every 60 seconds (or pause them entirely to conserve CPU/battery). During testing, switching tabs caused a 25-minute Pomodoro timer to take over 35 real-world minutes to elapse, completely breaking productivity timing.
* **What I did instead:** Rewrote the countdown engine to rely on timestamp delta math rather than consecutive 1-second ticks. I saved the target completion timestamp (`expectedEndRef.current = Date.now() + timeLeft * 1000`) and polled remaining time via delta calculation (`Math.round((expectedEnd - Date.now()) / 1000)`) on a 250ms polling loop. When tabs wake from throttling, the timer instantly recalculates the true remaining seconds accurately with zero accumulated drift.
* **Commit link:** `9c3f451` (feat(timer): implement self-authored useTimer hook with drift prevention and modes)

### Case 2: [Week 2 Planned - e.g. Recursive Subtask Cascades / State Sync]
* **What it gave back:**
* **What was wrong with it:**
* **What I did instead:**
* **Commit link:**

### Case 3: [Week 3 Planned - e.g. Deployment / Environment / Cloud Database Connection]
* **What it gave back:**
* **What was wrong with it:**
* **What I did instead:**
* **Commit link:**

---

## 3. Who Wrote What

### Code I Wrote Myself ($\ge 20\%$ of the project)

1. **`useTimer` Custom Hook (`client/src/hooks/useTimer.js`)**
   * **Commit:** `9c3f451` (feat(timer): implement self-authored useTimer hook with drift prevention and modes)
   * **Explanation:** I wrote the timer logic from scratch rather than relying on naive `setInterval(..., 1000)` calls that suffer from browser throttling in background tabs. I used timestamp deltas to calculate precise remaining time, handled mode switches (25m Pomodoro, 50m Deep Work, untimed Stopwatch), and integrated the HTML5 audio chime trigger on completion.

2. **Input Validation Logic (`server/utils/validators.js`)**
   * **Commit:** `71ce2b2` (feat(server): add task and session endpoints, password gate, validation, and PostgreSQL schema/seed)
   * **Explanation:** I wrote the server-side validation functions to sanitize task titles, validate ISO date formats for due dates, and enforce allowed priority enumerations (`low`, `medium`, `high`) before executing SQL queries.

### AI-Written Code I Understand Deeply

1. **Dual-Mode API Adapter (`client/src/api/index.js`, `mockApi.js`, `httpApi.js`)**
   * **Commit:** `ca254ca` (feat(ui): configure Tailwind CSS and scaffold Focus Hub view with dark mode and emerald tokens)
   * **Explanation:** The AI generated the abstraction layer that checks `import.meta.env.VITE_USE_MOCK_API`. If true (the default in development and on GitHub Pages), all CRUD operations read and write to `localStorage` simulating latency with promises. If false, it delegates requests to the Express backend. This allows the GitHub Pages deployment to work without a server while sharing the exact same method signatures used by the production API.
