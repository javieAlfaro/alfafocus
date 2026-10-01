# AlfaFocus

[![Made with AI](https://img.shields.io/badge/Made_with-AI_assistance-blue)](AI-USAGE.md)

> Built with the assistance of **Antigravity (Google DeepMind)**, adhering to the course AI policy with $\ge 20\%$ self-authored code. See the full disclosure and commit references in [AI-USAGE.md](AI-USAGE.md).

AlfaFocus is an all-in-one productivity web application designed to help users organize daily tasks, decompose complex projects into nested subtasks, schedule deadlines on an interactive calendar, and build habit consistency through customizable focus timers, streaks, and activity heat maps.

* **Live site (GitHub Pages):** https://javiealfaro.github.io/alfafocus/
* **API (Week 3 Live):** https://alfafocus-api.onrender.com/healthz
* **Demo video:** *(Week 3 Submission)*

> **This deployment is running in demo mode.** The interface is fully functional; the backend is simulated in your browser using `localStorage` so the site works without a server. Once the cloud API is live, setting `VITE_USE_MOCK_API=false` seamlessly routes all calls to the Express and PostgreSQL backend.

---

## What it does

* **Focus Hub & Hybrid Timer:** Run 25m Pomodoro, 50m Deep Work, or untimed Stopwatch focus sessions with drift-free tracking and completion alerts.
* **Daily Smart Checklist:** Rapidly create tasks, toggle completion status, monitor subtask progress bars, and filter by category (`WORK`, `PERSONAL`, `STUDY`).
* **Active Task Locking:** Pin any daily task directly into the active timer card to stay locked into high-priority objectives.
* **Dual-Mode Data Layer:** Seamlessly switches between in-browser `localStorage` simulation and live Express + PostgreSQL database.

---

## Built with

* **Frontend:** React 18, Vite, **Tailwind CSS**, `lucide-react` icons. Deployed to **GitHub Pages**.
* **Backend:** Node.js, Express, `cors`, `pg` (node-postgres with strictly parameterized queries).
* **Database:** PostgreSQL (hosted on **Supabase**), relational schema supporting recursive tasks and focus sessions.
* **Access Gate:** App-level password protection (`x-app-password`) satisfying course security guidelines.

---

## Running it yourself

### 1. The client only (Demo Mode, no database required)

```bash
cd client
npm install
cp .env.example .env        # VITE_USE_MOCK_API stays true by default
npm run dev                 # http://localhost:5173
```

### 2. The full stack (Client + Express + PostgreSQL)

```bash
# Step 1: Start the API
cd server
npm install
cp .env.example .env        # Set your DATABASE_URL and APP_PASSWORD
npm run dev                 # http://localhost:3000

# Step 2: In a separate terminal, start the client with live API enabled
cd client
# Ensure client/.env has VITE_USE_MOCK_API=false and VITE_API_BASE_URL=http://localhost:3000
npm run dev
```

### API Health Check Verification:
```bash
curl http://localhost:3000/healthz     # Verify server process is alive
curl http://localhost:3000/readyz      # Verify PostgreSQL connection is up
```

---

## Project Structure

```
alfafocus/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── api/                # Unified API interface (mockApi.js & httpApi.js)
│   │   ├── components/         # FocusHub, DemoNotice, and UI components
│   │   ├── hooks/              # Self-authored useTimer.js custom hook
│   │   └── styles.css          # Tailwind CSS layer directives
│   └── tailwind.config.js      # Design system color tokens (Zinc & Emerald)
├── server/                     # Express.js REST API
│   ├── db/                     # pool.js, schema.sql, and seed.sql
│   ├── utils/                  # Server-side input validators
│   ├── tasksRepo.js            # Parameterized PostgreSQL queries ($1, $2)
│   └── server.js               # Express app, security gate, and route handlers
├── AI-USAGE.md                 # Detailed AI assistance log and commit evidence
└── README.md                   # Project documentation
```

---

## Environment Variables

| Name | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | `server/.env` | PostgreSQL connection string (Supabase) |
| `APP_PASSWORD` | `server/.env` | Access gate password protecting API routes |
| `CORS_ORIGINS` | `server/.env` | Allowed client origins (e.g., `http://localhost:5173`) |
| `VITE_USE_MOCK_API` | `client/.env` | Set to `false` for live API; unset/true for browser demo mode |
| `VITE_API_BASE_URL` | `client/.env` | URL of the live Express API |

---

## Known Issues and Next Steps

* **Current Status (Week 1):** Focus Hub, Today Checklist, and drift-free `useTimer` countdown hook are fully functional in Demo Mode.
* **Next Steps for Week 2:**
  1. Implement multi-tier nested subtask trees with recursive client rendering.
  2. Log completed focus sessions to generate the GitHub-style activity heat map.
  3. Complete and submit `SECURITY-CHECKLIST.md`.

---

## Author & License

* **Developer:** Javier Alfaro (BSCS - 4th Year, 6APSI)
* **License:** MIT, see [LICENSE](LICENSE)
