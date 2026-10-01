# AI Usage Log & Disclosure

[![Made with AI](https://img.shields.io/badge/Made_with-AI_assistance-blue)](AI-USAGE.md)

This project was built with the assistance of **Antigravity (Google DeepMind)**, adhering to the 80/20 rule: at least 20% of the codebase is manually authored and deeply understood, with all architectural decisions, debugging, and integrations actively verified.

---

## 1. How I Used AI (Entries)

### Entry 1: Architecture Planning, Schema Design & Deliverable Breakdown
* **Date:** 2026-10-01
* **Tool:** Antigravity (Google DeepMind / Gemini 3.8 Flash)
* **What I asked for:** Analyze the course guidelines (`finals/`), badging rubrics (`finals-badge/`), and my proposal (`project/PROPOSAL.md`). Propose an architecture fitting the 3-day Week 1 sprint with Supabase and Tailwind CSS.
* **What it gave back:** A full architectural plan, normalized relational PostgreSQL schema (with self-referencing subtasks), dual-mode client adapter strategy, and a prioritized 3-week roadmap.
* **What I kept, what I changed, and why:** Kept the database schema and dual-mode architecture. Changed the auth strategy from full JWT to an app-level password gate (`alfa2026`) as permitted by the course security checklist (item 18/20) to maintain rapid delivery during the 3-day sprint.
* **Commit link:** `e6f5c19` (docs: initialize AI-USAGE.md with architectural plan and disclosure)

### Entry 2: Scaffolding the Focus Hub UI Layout & Tailwind Tokens
* **Date:** 2026-10-01
* **Tool:** Antigravity (Google DeepMind / Gemini 3.8 Flash)
* **What I asked for:** Generate the React and Tailwind component layout for the Today & Focus Hub screen matching the Dark Mode theme and tokens from `Design_System.pdf` (#09090B background, #18181B surface, #10B981 accent).
* **What it gave back:** A modular 3-column layout (Sidebar navigation, Today's Focus checklist with progress bars, and the active task focus timer card) connected to a dual-mode API adapter.
* **What I kept, what I changed, and why:** Kept the responsive layout and Tailwind color tokens. Adjusted the card spacing and button typography to strictly match the 8px spatial rhythm specified in the design system.
* **Commit link:** `ca254ca` (feat(ui): configure Tailwind CSS and scaffold Focus Hub view with dark mode and emerald tokens)

---

## 2. Where the AI Got It Wrong

*(To be filled during development when catching real edge cases, e.g. timer drift, recursive subtask deletion bugs, or mock API sync errors. 3 real cases required before final submission).*

### Case 1: [Placeholder - e.g. React `setInterval` Timer Drift]
* **What it gave back:**
* **What was wrong with it:**
* **What I did instead:**
* **Commit link:**

### Case 2: [Placeholder - e.g. PostgreSQL Cascade vs Set Null on Parent Subtasks]
* **What it gave back:**
* **What was wrong with it:**
* **What I did instead:**
* **Commit link:**

### Case 3: [Placeholder - e.g. CORS / Environment variable mismatch in Demo Mode]
* **What it gave back:**
* **What was wrong with it:**
* **What I did instead:**
* **Commit link:**

---

## 3. Who Wrote What

### Code I Wrote Myself ($\ge 20\%$ of the project)

1. **`useTimer` Custom Hook (`client/src/hooks/useTimer.js`)**
   * **Commit:** `9c3f451` (feat(timer): implement self-authored useTimer hook with drift prevention and modes)
   * **Explanation:** I wrote the timer logic from scratch rather than relying on naive `setInterval(..., 1000)` calls that suffer from browser throttling in background tabs. I used `performance.now()` / timestamp deltas to calculate precise remaining time, handled mode switches (25m Pomodoro, 50m Deep Work, untimed Stopwatch), and integrated the HTML5 audio chime trigger on completion.

2. **Input Validation Logic (`server/utils/validators.js`)**
   * **Commit:** `71ce2b2` (feat(server): add task and session endpoints, password gate, validation, and PostgreSQL schema/seed)
   * **Explanation:** I wrote the server-side validation functions to sanitize task titles, validate ISO date formats for due dates, and enforce allowed priority enumerations (`low`, `medium`, `high`) before executing SQL queries.

### AI-Written Code I Understand Deeply

1. **Dual-Mode API Adapter (`client/src/services/api.js`)**
   * **Commit:** `(Commit SHA)`
   * **Explanation:** The AI generated the abstraction layer that checks `import.meta.env.VITE_USE_MOCK_API`. If true, all CRUD operations read and write to `localStorage` simulating latency with promises. If false, it delegates requests to Axios hitting the Express backend. This allows the GitHub Pages deployment to work without a database while sharing the exact same method signatures used by the production API.
