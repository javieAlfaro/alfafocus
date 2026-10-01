# Weekly Increment Report

## Week of: September 21, 2026

## What changed this week

- Initialized the public project repository from the class template (`HAU-6APSI/final-project-template`) and verified the automated GitHub Pages workflow.
- Configured **Tailwind CSS** with design system tokens: `#09090B` (Zinc 950 page background), `#18181B` (Zinc 900 card surface), and `#10B981` (Emerald 500 accent).
- Implemented the self-authored `useTimer` custom hook in `client/src/hooks/useTimer.js` supporting Pomodoro (25m), Deep Work (50m), and Stopwatch modes with timestamp delta calculations and audio alert.
- Scaffolded the **Today & Focus Hub** screen (`client/src/components/FocusHub.jsx`) featuring a responsive 3-column layout, task completion toggles, category badges (`WORK`, `PERSONAL`, `STUDY`), active task selection, and live countdown display.
- Implemented the dual-mode API service layer (`client/src/api/`) enabling in-browser `localStorage` simulation by default so GitHub Pages runs on day one without needing a server.
- Built the Express API foundation (`server/server.js`) with `/healthz` and `/readyz` uptime probes, app-level password gate middleware (`x-app-password`), and server-side request validators (`server/utils/validators.js`).
- Designed the PostgreSQL relational schema (`server/db/schema.sql`) and sample seed dataset (`server/db/seed.sql`) modeling users, task lists, recursive tasks, and focus sessions.
- Initialized `AI-USAGE.md` documenting architecture planning, scaffolding logs, self-authored code declarations, and Case 1 timer drift debugging.

## Why

- To establish an operational MVP foundation on GitHub Pages early and prove the core loop: creating a daily task, locking it into the focus hub, and executing a countdown timer.
- To set up the dual-mode architecture so instructors and evaluators can immediately test the application live in the browser without waiting for cloud database provisioning.
- To satisfy the Week 1 requirements for the course rubric and start building verifiable commit evidence for the AI usage badge.

## What broke or what I got stuck on

- **React Timer Drift:** When testing the countdown timer in background browser tabs, the naive `setInterval(..., 1000)` tick suffered from aggressive browser throttling, making a 25-minute Pomodoro take over 35 real-world minutes to complete. We resolved this by calculating deltas against target timestamps (`expectedEndRef.current = Date.now() + timeLeft * 1000`) on a 250ms polling loop.
- **Top-Level Await Build Constraint:** Attempting to dynamically import the mock vs HTTP API inside Vite caused build errors on older targets. We resolved this by bundling both modules statically and choosing the implementation at runtime based on `import.meta.env.VITE_USE_MOCK_API`.

## What is left

- Implementing multi-tier nested subtask trees with recursive client rendering.
- Setting up the cloud PostgreSQL instance on Supabase and connecting the live Express backend.
- Storing completed focus sessions in the database to render the GitHub-style activity heat map.
- Completing the `SECURITY-CHECKLIST.md` for Week 2 submission.
- Building the interactive calendar view.
