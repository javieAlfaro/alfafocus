import React, { useState } from 'react';
import { Flame, Clock, CheckCircle2, TrendingUp, Droplets, BookOpen, Award } from 'lucide-react';

export default function HabitsHeatMap({ sessions = [], tasks = [] }) {
  const [habits, setHabits] = useState([
    { id: 1, title: 'Drink 2L Water', icon: 'water', streak: 3, history: [true, true, true, false, false, false, false] },
    { id: 2, title: 'Deep Work Session (45m+)', icon: 'focus', streak: 7, history: [true, true, true, true, true, true, false] },
    { id: 3, title: 'Technical Reading', icon: 'book', streak: 5, history: [true, true, true, true, true, false, false] },
  ]);

  const toggleTodayHabit = (habitId) => {
    setHabits(habits.map(h => {
      if (h.id === habitId) {
        const nextHist = [...h.history];
        nextHist[2] = !nextHist[2]; // Today is index 2 (Wednesday) in week view
        return { ...h, history: nextHist, streak: nextHist[2] ? h.streak + 1 : Math.max(0, h.streak - 1) };
      }
      return h;
    }));
  };

  // Generate 12 weeks of heatmap data (84 days)
  const today = new Date();
  const heatMapDays = Array.from({ length: 84 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (83 - i));
    const dateStr = d.toISOString().split('T')[0];
    
    // Check sessions for this date
    const daySessions = sessions.filter(s => s.completed_at?.startsWith(dateStr));
    const minutes = daySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    
    // Fallback pseudo-history for realistic demonstration
    const seedDensity = (i % 7 === 1 || i % 7 === 3 || i % 7 === 4 || i > 70) ? ((i * 17) % 75) : 0;
    const finalMinutes = minutes > 0 ? minutes : seedDensity;

    let level = 0;
    if (finalMinutes > 60) level = 4;
    else if (finalMinutes > 40) level = 3;
    else if (finalMinutes > 20) level = 2;
    else if (finalMinutes > 0) level = 1;

    return { date: dateStr, minutes: finalMinutes, level };
  });

  const getTileColor = (level) => {
    switch (level) {
      case 4: return 'bg-[#22C55E]'; // Green 500
      case 3: return 'bg-[#10B981]'; // Emerald 500
      case 2: return 'bg-[#059669]'; // Emerald 600
      case 1: return 'bg-[#064E3B]'; // Emerald 900
      default: return 'bg-[#18181B] border border-zinc-800/80'; // Empty
    }
  };

  const totalFocusMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) + 128.5 * 60;
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);
  const completedCount = tasks.filter(t => t.completed).length + 342;

  const daysLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#09090B] text-[#FAFAFA]">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">Habits & Analytics</h1>
        <p className="text-sm text-zinc-400 mt-1">Track your daily focus intensity, consistency streaks, and habit routines.</p>
      </header>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-[#18181B] border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">
            <span>Active Streak</span>
            <Flame className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">7 <span className="text-sm font-normal text-zinc-400">Days</span></p>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '70%' }}></div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#18181B] border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">
            <span>Focus Hours</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">{totalFocusHours} <span className="text-sm font-normal text-zinc-400">hrs</span></p>
          <p className="text-[11px] text-emerald-400 mt-2 font-medium">+12% from last month</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#18181B] border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">
            <span>Tasks Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">{completedCount} <span className="text-sm font-normal text-zinc-400">Total</span></p>
          <p className="text-[11px] text-zinc-500 mt-2">Avg 8.4 tasks / day</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-900/40 shadow-sm">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-2">
            <span>Efficiency Score</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">92%</p>
          <p className="text-[11px] text-emerald-400/90 mt-2 font-medium">Ranked Top 5% of focus sessions</p>
        </div>
      </div>

      {/* GitHub-Style Focus Intensity Heat Map Card */}
      <div className="p-6 rounded-2xl bg-[#18181B] border border-zinc-800 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-base font-semibold text-white">Focus Intensity</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Last 12 Weeks (84 Days of Activity)</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>Less</span>
            <div className="flex gap-1">
              <span className="w-3 h-3 rounded-sm bg-[#18181B] border border-zinc-800"></span>
              <span className="w-3 h-3 rounded-sm bg-[#064E3B]"></span>
              <span className="w-3 h-3 rounded-sm bg-[#059669]"></span>
              <span className="w-3 h-3 rounded-sm bg-[#10B981]"></span>
              <span className="w-3 h-3 rounded-sm bg-[#22C55E]"></span>
            </div>
            <span>More</span>
          </div>
        </div>

        {/* The 12-Week Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-1.5 items-start">
            <div className="grid grid-rows-7 gap-1.5 text-[10px] text-zinc-500 pr-2 pt-0.5">
              <span>Mon</span>
              <span></span>
              <span>Wed</span>
              <span></span>
              <span>Fri</span>
              <span></span>
              <span>Sun</span>
            </div>

            <div className="grid grid-flow-col grid-rows-7 gap-1.5">
              {heatMapDays.map((day, idx) => (
                <div
                  key={idx}
                  title={`${day.date}: ${day.minutes}m focus`}
                  className={`w-3.5 h-3.5 rounded-sm transition-transform hover:scale-125 cursor-pointer ${getTileColor(day.level)}`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Habits Tracker (Wireframe Page 4) */}
      <div className="p-6 rounded-2xl bg-[#18181B] border border-zinc-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-white">Daily Habit Routines</h2>
          <span className="text-xs text-zinc-400">This Week</span>
        </div>

        <div className="space-y-3">
          {habits.map((habit) => (
            <div key={habit.id} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                  {habit.icon === 'water' ? <Droplets className="w-4 h-4" /> : habit.icon === 'book' ? <BookOpen className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{habit.title}</p>
                  <p className="text-xs text-emerald-400 font-medium">{habit.streak} day streak</p>
                </div>
              </div>

              {/* Weekly Bubbles */}
              <div className="flex items-center gap-2">
                {habit.history.map((done, dIdx) => (
                  <button
                    key={dIdx}
                    onClick={() => dIdx === 2 && toggleTodayHabit(habit.id)}
                    className={`w-7 h-7 rounded-lg flex flex-col items-center justify-center text-[10px] font-semibold transition ${
                      done 
                        ? 'bg-emerald-600 text-white font-bold' 
                        : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                    } ${dIdx === 2 ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-900 cursor-pointer' : 'cursor-default'}`}
                    title={`${daysLabels[dIdx]} - ${done ? 'Completed' : 'Missed'}`}
                  >
                    {daysLabels[dIdx]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
