import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, Plus } from 'lucide-react';

export default function CalendarPlanner({ tasks = [], sessions = [] }) {
  const [selectedDay, setSelectedDay] = useState(2); // Default to day 2 (October 2)
  const currentMonthName = 'October 2026';

  // October 2026 starts on Thursday (index 4 in Sun-first or index 3 in Mon-first)
  // Let's use standard Sun-Sat (0-6). Oct 1, 2026 was Thursday (index 4).
  const daysInMonth = 31;
  const startDayOffset = 4; // Thursday

  const calendarCells = [];
  // Leading empty padding
  for (let i = 0; i < startDayOffset; i++) {
    calendarCells.push({ empty: true, key: `pad-${i}` });
  }
  // Days 1..31
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `2026-10-${String(day).padStart(2, '0')}`;
    const dayTasks = tasks.filter(t => t.due_date === dateStr || (day === 2 && !t.due_date));
    const daySessions = sessions.filter(s => s.completed_at?.startsWith(dateStr) || (day === 2 && s.mode));
    calendarCells.push({
      empty: false,
      day,
      dateStr,
      tasks: dayTasks,
      sessions: daySessions,
      isToday: day === 2,
      key: `day-${day}`
    });
  }

  const selectedCell = calendarCells.find(c => !c.empty && c.day === selectedDay) || calendarCells[startDayOffset + 1];

  return (
    <div className="flex-1 flex overflow-hidden bg-[#09090B] text-[#FAFAFA]">
      
      {/* Main Month Calendar Grid */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-white">{currentMonthName}</h1>
            <div className="flex items-center gap-1 bg-[#18181B] border border-zinc-800 rounded-lg p-1">
              <button className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={() => setSelectedDay(2)}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-lg text-emerald-400 border border-zinc-700"
            >
              Today
            </button>
          </div>

          <div className="flex gap-1 p-1 bg-[#18181B] border border-zinc-800 rounded-xl text-xs">
            <button className="px-3 py-1 bg-emerald-600 text-white font-semibold rounded-lg">Month</button>
            <button className="px-3 py-1 text-zinc-400 hover:text-white rounded-lg">Week</button>
            <button className="px-3 py-1 text-zinc-400 hover:text-white rounded-lg">Day</button>
          </div>
        </header>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* 7-column Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarCells.map((cell) => {
            if (cell.empty) {
              return <div key={cell.key} className="h-28 bg-zinc-950/40 rounded-xl border border-zinc-900/60"></div>;
            }

            const isSelected = selectedDay === cell.day;

            return (
              <div
                key={cell.key}
                onClick={() => setSelectedDay(cell.day)}
                className={`h-28 p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-zinc-800/80 border-emerald-500 shadow-md ring-1 ring-emerald-500/50' 
                    : cell.isToday 
                      ? 'bg-[#18181B] border-emerald-800/60 hover:border-emerald-700' 
                      : 'bg-[#18181B] border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-semibold ${cell.isToday ? 'text-emerald-400 font-bold' : 'text-zinc-400'}`}>
                    {cell.day}
                  </span>
                  {cell.isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  )}
                </div>

                {/* Event Tags inside cell */}
                <div className="space-y-1 overflow-hidden">
                  {cell.day === 2 && (
                    <>
                      <div className="truncate px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950/90 text-emerald-300 border border-emerald-800/60">
                        9:00 Focus Block
                      </div>
                      <div className="truncate px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300">
                        Finalize Wireframes
                      </div>
                    </>
                  )}
                  {cell.day === 6 && (
                    <div className="truncate px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-950/90 text-blue-300 border border-blue-800/60">
                      Project Alpha Review
                    </div>
                  )}
                  {cell.day === 12 && (
                    <div className="truncate px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-950/90 text-purple-300 border border-purple-800/60">
                      Client Meeting
                    </div>
                  )}
                </div>

                <div></div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Right Selected Date Inspector Panel (Wireframe Page 6) */}
      <aside className="w-80 border-l border-zinc-800 bg-[#09090B] p-6 flex flex-col justify-between">
        <div>
          <div className="mb-6">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
              Selected Date
            </span>
            <h2 className="text-xl font-bold text-white">October {selectedDay}, 2026</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Scheduled Sessions &amp; Deadlines</p>
          </div>

          {/* Focus Sessions list */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Focus Sessions</h3>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-[#18181B] border border-zinc-800">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-zinc-400 font-mono">09:00 AM - 11:30 AM</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[9px] font-bold">DEEP WORK</span>
                </div>
                <p className="text-xs font-semibold text-zinc-100">AlfaFocus Redesign</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Wireframe Homepage &amp; Navigation</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-emerald-500/50">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-emerald-400 font-mono">04:30 PM - 05:30 PM</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold">ACTIVE</span>
                </div>
                <p className="text-xs font-semibold text-white">Project Cleanup</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Express API &amp; PostgreSQL Migrations</p>
              </div>
            </div>
          </div>

          {/* Tasks Scheduled */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Tasks for this day</h3>
            <div className="space-y-2">
              {tasks.slice(0, 3).map((task) => (
                <div key={task.id} className="p-2.5 rounded-lg bg-[#18181B] border border-zinc-800 flex items-center gap-2.5">
                  <CheckCircle2 className={`w-4 h-4 ${task.completed ? 'text-emerald-500' : 'text-zinc-600'}`} />
                  <span className={`text-xs ${task.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule Task Button */}
        <button className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-semibold text-xs rounded-xl border border-zinc-700 flex items-center justify-center gap-2 transition">
          <Plus className="w-4 h-4" /> Schedule New Session
        </button>
      </aside>

    </div>
  );
}
