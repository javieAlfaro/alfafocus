# AI usage

This project was built with AI assistance. This file is the record of it. It is
graded as the finals badge, and it is worth 100 points.

Start it in week 1 and keep it up as you go. The commit history of this file is
part of the evidence: a file written all at once the night before the deadline
looks exactly like what it is.

## 1. How I used AI

At least six entries. One per real use. Every entry needs a commit link.

### 2026-09-21 - Architecture planning and database schema

- **Tool:** Antigravity (Google DeepMind / Gemini 3.8 Flash)
- **What I asked for:** Review course requirements and my project proposal for AlfaFocus. Help me plan an MVP architecture using React, Tailwind CSS, Express, and PostgreSQL (Supabase) that can be delivered cleanly in phases.
- **What it gave back:** A full project roadmap, a normalized relational PostgreSQL schema (with self-referencing subtasks and focus sessions), and an outline for a dual-mode API setup.
- **What I kept, what I changed, and why:** Kept the database schema and general roadmap. Decided to use an app-level password gate instead of full multi-user authentication for now, because it fits the course security checklist and keeps the Week 1 sprint focused on core features.
- **Commit:** https://github.com/javieAlfaro/alfafocus/commit/e6f5c19

### 2026-09-21 - Focus Hub layout and Tailwind styling

- **Tool:** Antigravity (Google DeepMind / Gemini 3.8 Flash)
- **What I asked for:** Help generate the 3-column layout for the Today & Focus Hub page based on my wireframes and the Dark Mode design system tokens (#09090B background, #18181B cards, #10B981 emerald accent).
- **What it gave back:** A responsive React component with a navigation sidebar, today's checklist, and the right-hand active timer card, all styled with Tailwind.
- **What I kept, what I changed, and why:** Kept the component structure and colors. Adjusted the spacing, buttons, and card borders to follow the 8px grid spacing from our design system.
- **Commit:** https://github.com/javieAlfaro/alfafocus/commit/ca254ca

### 2026-09-28 - Hierarchical subtask trees and project breakdown

- **Tool:** Antigravity (Google DeepMind / Gemini 3.8 Flash)
- **What I asked for:** Help build the Project Breakdown screen where tasks belong to custom project lists, can be broken down into child subtasks, and display dynamic progress bars.
- **What it gave back:** The `ProjectBreakdown.jsx` component with expandable subtask trees, custom list folders, and dynamic progress calculation.
- **What I kept, what I changed, and why:** Kept the collapsible tree interface and list sidebar. Adjusted the progress formula so that parent tasks calculate their progress dynamically from active child subtasks instead of storing redundant percentages.
- **Commit:** https://github.com/javieAlfaro/alfafocus/commit/a08e6b6

### 2026-09-29 - Activity heat map and multi-view navigation

- **Tool:** Antigravity (Google DeepMind / Gemini 3.8 Flash)
- **What I asked for:** Build the 12-week GitHub-style activity heat map and create the persistent navigation shell in `App.jsx` to switch between all 4 application screens.
- **What it gave back:** `HabitsHeatMap.jsx` with 5-tier color intensity mapping, stat cards, and the master shell in `App.jsx`.
- **What I kept, what I changed, and why:** Kept the heat map tile grid and navigation architecture. Added date tooltip labels and an interactive daily habit routine checklist directly below the grid.
- **Commit:** https://github.com/javieAlfaro/alfafocus/commit/a08e6b6

### 2026-10-03 - Interactive calendar scheduling and view modes

- **Tool:** Antigravity (Google DeepMind / Gemini 3.8 Flash)
- **What I asked for:** Build the Month and Week interactive view modes in `CalendarPlanner.jsx`, mapping user tasks onto dynamic calendar cells by due date, with a date inspector panel that allows quick scheduling.
- **What it gave back:** A full calendar planner component with month/week toggling, date offset math, task badge rendering, and an inline inspector for adding tasks directly to a selected date.
- **What I kept, what I changed, and why:** Kept the grid algorithm and date math. Added category color coding (emerald for Work, purple for Study), functional month navigation with Previous/Next controls, and wired the inspector's task creation into the application's global task state.
- **Commit:** https://github.com/javieAlfaro/alfafocus/commit/17a3353

### 2026-10-03 - Web Audio chime synthesizer and browser notifications

- **Tool:** Antigravity (Google DeepMind / Gemini 3.8 Flash)
- **What I asked for:** Help implement an audio alert and desktop notification system in `audioAlerts.js` and `SettingsModal.jsx` so users can choose completion chimes and receive notifications even when browsing in another tab.
- **What it gave back:** A Web Audio API oscillator synthesis module generating Harmonic Bell, Deep Gong, and Digital Beep tones without external MP3 files, plus a Settings preferences modal with a volume slider and Web Notifications API integration.
- **What I kept, what I changed, and why:** Kept the Web Audio API synthesis logic because it is fully offline-resilient and never suffers from CORS or broken CDN links. Added test sound buttons, localStorage persistence, and connected it directly to `useTimer` so timer completion triggers alerts automatically.
- **Commit:** https://github.com/javieAlfaro/alfafocus/commit/9f57a85

## 2. Where the AI got it wrong

Three cases. Be specific. If you write that the AI was never wrong, this section
scores zero.

### Case 1 - Background timer drift in countdown hook

- **What it gave me:** A basic React countdown hook that used `setInterval` to decrease the remaining time by 1 every 1000ms.
- **What was wrong with it:** When you switch to another browser tab or minimize the window, modern browsers intentionally slow down timers to save CPU and battery. When I tested it in another tab, a 25-minute Pomodoro session ended up taking more than 35 real minutes because intervals were being throttled.
- **What I did instead:** Instead of subtracting 1 second on every tick, I recalculated the time by checking the real clock. When the timer starts, it calculates the target end timestamp (`Date.now() + duration`). Then it runs a quick 250ms check that calculates `(targetTime - Date.now())`. Even if the browser pauses the tab, it immediately snaps back to the exact correct second when you look at it.
- **Commit:** https://github.com/javieAlfaro/alfafocus/commit/9c3f451

### Case 2 - Foreign key constraint crash on nested subtask deletion

- **What it gave me:** A straightforward SQL deletion query for removing tasks: `DELETE FROM tasks WHERE id = $1`.
- **What was wrong with it:** When deleting a parent task that had nested subtasks attached, PostgreSQL crashed with a foreign key violation (`violates foreign key constraint "tasks_parent_task_id_fkey"`), returning a 500 server error and breaking the UI because child subtasks still pointed to the deleted ID.
- **What I did instead:** I modified the relational schema to enforce `ON DELETE CASCADE` on `parent_task_id`, so deleting a parent task automatically deletes all of its nested subtasks in a single safe query. I also mirrored this logic in our client `mockApi.js` so child tasks are cleaned up cleanly in demo mode too.
- **Commit:** https://github.com/javieAlfaro/alfafocus/commit/4d31526

### Case 3 - Database pooler password `#` URI fragment crash

- **What it gave me:** A standard PostgreSQL connection setup using `new pg.Pool({ connectionString: process.env.DATABASE_URL })`.
- **What was wrong with it:** The auto-generated database password from our cloud Supabase project contained a `#` special character. Standard Node.js `URL` parsers treat `#` as the beginning of a URL hash fragment (anchor). Consequently, the password was prematurely cut off right before `#`, and the remaining characters were discarded as a hash. This caused PostgreSQL connection attempts to fail immediately with authentication errors (`SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string` / password authentication failed).
- **What I did instead:** I wrote a defensive `normalizeDatabaseUrl` helper in `server/db/pool.js` that parses the raw connection string, extracts the user and password credentials portion, safely percent-encodes the password with `encodeURIComponent()`, and reconstructs a valid URI. This guarantees connection stability regardless of what special characters exist in the database password across both local development and cloud production deployments.
- **Commit:** https://github.com/javieAlfaro/alfafocus/commit/16dde0f

## 3. Who wrote what

At least a fifth of this project is code you wrote yourself. Name it, and explain
it in your own words.

> Group projects: give each member their own heading below, and use your GitHub
> handle as the heading. You are graded on your own section.

### Written by me

- **File:** `client/src/hooks/useTimer.js`
- **Commit:** https://github.com/javieAlfaro/alfafocus/commit/9c3f451
- **What it does and why it is built this way:**
  This is the custom hook that runs the Pomodoro, Deep Work, and Stopwatch timers. It holds the timer state (running, paused, time left, and mode) and plays a chime when time runs out. I built it to compare against `Date.now()` timestamps rather than blindly counting down seconds with `setInterval`. This ensures that even if you browse other tabs or the laptop goes to sleep briefly, the timer never drifts or loses accuracy.

- **File:** `server/utils/validators.js`
- **Commit:** https://github.com/javieAlfaro/alfafocus/commit/71ce2b2
- **What it does and why it is built this way:**
  This file validates request data on the server before anything touches PostgreSQL. It makes sure task titles are not blank, trims whitespace, and ensures priorities are only set to allowed values (`low`, `medium`, or `high`). I wrote this as clean, native JavaScript helper functions so that we do not have to rely on an external validation library, keeping our backend lightweight, safe from invalid data, and easy to debug.

- **File:** `client/src/components/ProjectBreakdown.jsx` (Dynamic Progress & Subtask Tree Traversal)
- **Commit:** https://github.com/javieAlfaro/alfafocus/commit/a08e6b6
- **What it does and why it is built this way:**
  I wrote the logic that calculates parent task progress based on its active child subtasks (`Math.round((completedChildren / totalChildren) * 100)`). Instead of storing a fixed percentage in state that easily goes out of sync when subtasks are added, toggled, or deleted, the progress is calculated dynamically in memory whenever tasks render. I also implemented the state toggle for expanding and collapsing subtask branches (`expandedTasks` Set) and the recursive indentation rendering so users can nest subtasks naturally.

- **File:** `server/db/pool.js` (Credential Normalizer & Connection Pooler Guard)
- **Commit:** https://github.com/javieAlfaro/alfafocus/commit/16dde0f
- **What it does and why it is built this way:**
  I added the defensive `normalizeDatabaseUrl` helper function in the database pool configuration. Cloud database URLs (especially from Supabase poolers) often contain special characters like `#` in user passwords or quotes added by environment loaders. Since `#` is treated by standard URI parsers as a URL hash fragment, it breaks connection parsing and throws an `Invalid URL` crash. My helper safely extracts the credentials portion and percent-encodes the password (`encodeURIComponent`) before passing it to `pg.Pool`, ensuring reliable connection across both local dev and cloud deployments.

### The AI-written part I understand best

- **File:** `client/src/api/index.js` (with `mockApi.js` and `httpApi.js`)
- **Commit:** https://github.com/javieAlfaro/alfafocus/commit/ca254ca
- **What it does and why we kept it:**
  This is the dual-mode API adapter. It looks at the environment variable `VITE_USE_MOCK_API`. If it is unset or true, it reads and writes tasks from the browser's `localStorage` with a small fake delay. If set to false, it sends real HTTP requests to our Express server. We kept this because it lets our site deploy and work immediately on GitHub Pages without needing a live backend right away, while sharing the exact same function signatures (`listTasks`, `createTask`) that our components use.

- **File:** `client/src/components/HabitsHeatMap.jsx` (12-Week Focus Intensity Grid & Emerald Color Tiering)
- **Commit:** https://github.com/javieAlfaro/alfafocus/commit/a08e6b6
- **What it does and why we kept it:**
  This component generates an 84-day (12-week × 7 days) activity heat map similar to GitHub's contribution graph. It calculates the past 84 dates, maps logged focus minutes into 5 discrete emerald intensity tiers (`bg-zinc-800` for 0m, up to `bg-emerald-400` for 60+ mins), and lays them out in a 7-row CSS grid ordered by day of the week. I understand how it groups daily timestamps and computes streak counts using date math, and we kept it because it provides an immediate visual reward loop that encourages users to maintain daily productivity habits.

- **File:** `server/tasksRepo.js` (Parameterized Relational Data Layer with Adjacency List)
- **Commit:** https://github.com/javieAlfaro/alfafocus/commit/4d31526
- **What it does and why we kept it:**
  This module executes all database operations against PostgreSQL using strict `$1, $2` parameterized queries to eliminate SQL injection risks. It models nested tasks using an Adjacency List pattern (`parent_task_id INT REFERENCES tasks(id)`). I understand how the relational queries join `task_lists` with `tasks` and leverage PostgreSQL foreign key cascades so that deleting a parent project or parent task cleans up all associated records without leaving orphan rows in the database.
