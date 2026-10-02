# Weekly Increment Report - Week 2

## Week of: September 28, 2026

## What changed this week

- Implemented **Multi-View Shell Navigation** in `client/src/App.jsx`, allowing seamless tab switching between all four core views without page reloads: Today & Focus, Lists & Projects, Calendar & Planner, and Habits & Stats.
- Built **Lists & Project Breakdown View** (`client/src/components/ProjectBreakdown.jsx`):
  - Supports multiple custom project folders (`AlfaFocus Redesign`, `Marketing Q1`, `Personal Routines`).
  - Added recursive nested subtask trees with expandable/collapsible chevrons.
  - Dynamically calculates parent task progress percentages based on completed child subtasks.
  - Supports inline subtask creation and cascading task deletion.
- Built **Habits & Activity Heat Map View** (`client/src/components/HabitsHeatMap.jsx`):
  - Implemented an 84-day (12-week) GitHub-style focus intensity grid with 5 color tiers mapping directly to our design tokens.
  - Added real-time productivity statistics (Active Streak, Total Focus Hours, Tasks Completed, and Efficiency Score).
  - Integrated a weekly interactive habit checklist (e.g. "Drink 2L Water", "Deep Work Session") with day bubbles.
- Built **Calendar & Planner View** (`client/src/components/CalendarPlanner.jsx`):
  - Created an interactive Month calendar grid with date selection, today indicator, and scheduled task chips.
  - Added a right-hand date inspector showing scheduled focus sessions and daily tasks for any clicked date.
- Extended the **Express REST API** with `/api/lists` endpoints and updated `tasksRepo.js` with parameterized queries supporting `list_id` and recursive `parent_task_id`.
- Successfully provisioned and connected **Supabase PostgreSQL** via IPv4 Session Pooler, executing `schema.sql` and `seed.sql` for all relational models.
- Completed **`SECURITY-CHECKLIST.md`** containing 31 audited security checks with verifiable evidence.
- Updated `AI-USAGE.md` with Week 2 entries (Entries 3 & 4) and documented Case 2 (subtask foreign key cascade bug).

## Why

- To deliver the complete 4-screen loop promised in our proposal (`project/PROPOSAL.md`), transforming AlfaFocus from an MVP timer into a full-fledged productivity workstation.
- To fulfill the Week 2 documentation requirement by completing `SECURITY-CHECKLIST.md` before deploying cloud services.
- To prove advanced relational data modeling with recursive task decomposition and activity logging.

## What broke or what I got stuck on

- **Subtask Deletion Constraints:** Initially, deleting a parent task with child subtasks caused foreign key constraint violations in PostgreSQL because child tasks still pointed to the deleted `parent_task_id`. We resolved this by configuring `ON DELETE CASCADE` on `parent_task_id` in `schema.sql` and updating the client mock deletion logic to clean up child tasks simultaneously.
- **Special Characters in Database Credentials:** In standard database URIs, passwords containing unencoded reserved characters (such as `#`) cause URL parsers to fail (`Invalid URL` due to fragment hash anchor). We resolved this by percent-encoding the password in `.env` (`#` -> `%23`) and adding a defensive URL normalizer in `server/db/pool.js`.
- **Progress Bar Synchronization:** Calculating parent task completion percentages when subtasks were toggled caused state race conditions. We resolved this by deriving progress dynamically from the subtask array rather than storing stale percentages.

## What is left

- Deploying the Express API service to Render.
- Recording the 3–5 minute final walkthrough video, preparing slide deck, and generating the 1080x1080 promo square graphic.
