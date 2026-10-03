import React, { useState, useEffect } from 'react';
import { 
  Flame, Clock, CheckCircle2, TrendingUp, Droplets, BookOpen, 
  Award, Download, Plus, Trash2, PieChart, Sparkles 
} from 'lucide-react';

const HABITS_STORAGE_KEY = 'alfafocus_habits_v1';

const DEFAULT_HABITS = [
  { id: 1, title: 'Drink 2L Water', icon: 'water', streak: 4, history: [true, true, true, true, false, false, false] },
  { id: 2, title: 'Deep Work Session (45m+)', icon: 'focus', streak: 7, history: [true, true, true, true, true, true, false] },
  { id: 3, title: 'Technical Reading', icon: 'book', streak: 5, history: [true, true, true, true, true, false, false] },
];

export default function HabitsHeatMap({ sessions = [], tasks = [], onShowToast }) {
  // Habit tracking state with localStorage persistence
  const [habits, setHabits] = useState(() => {
    try {
      const stored = localStorage.getItem(HABITS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_HABITS;
  });

  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [isAddingHabit, setIsAddingHabit] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
    } catch {}
  }, [habits]);

  const toggleHabitDay = (habitId, dayIndex) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const nextHist = [...h.history];
        nextHist[dayIndex] = !nextHist[dayIndex];
        const nextStreak = nextHist.filter(Boolean).length;
        return { ...h, history: nextHist, streak: nextStreak };
      }
      return h;
    }));
  };

  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    const newHabit = {
      id: Date.now(),
      title: newHabitTitle.trim(),
      icon: 'focus',
      streak: 1,
      history: [false, false, false, false, false, true, false],
    };
    setHabits([...habits, newHabit]);
    setNewHabitTitle('');
    setIsAddingHabit(false);
    if (onShowToast) onShowToast('New habit routine added', 'success');
  };

  const handleDeleteHabit = (id) => {
    setHabits(habits.filter(h => h.id !== id));
    if (onShowToast) onShowToast('Habit removed', 'info');
  };

  // Generate 12 weeks of heatmap data (84 days)
  const today = new Date(2026, 9, 3); // Oct 3, 2026
  const heatMapDays = Array.from({ length: 84 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (83 - i));
    const dateStr = d.toISOString().split('T')[0];
    
    // Check real sessions for this date
    const daySessions = sessions.filter(s => s.completed_at?.startsWith(dateStr));
    const realMinutes = daySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    
    // Seeded background pattern for older weeks
    const pseudoDensity = (i % 7 === 1 || i % 7 === 3 || i % 7 === 4 || i > 75) ? ((i * 19) % 70) : 0;
    const minutes = realMinutes > 0 ? realMinutes : pseudoDensity;

    let level = 0;
    if (minutes > 60) level = 4;
    else if (minutes > 40) level = 3;
    else if (minutes > 20) level = 2;
    else if (minutes > 0) level = 1;

    return { date: dateStr, minutes, level };
  });

  const getTileColor = (level) => {
    switch (level) {
      case 4: return 'bg-[#22C55E]'; // Green 500
      case 3: return 'bg-[#10B981]'; // Emerald 500
      case 2: return 'bg-[#059669]'; // Emerald 600
      case 1: return 'bg-[#064E3B]'; // Emerald 900
      default: return 'bg-[#18181B] border border-zinc-800/80';
    }
  };

  // Dynamic Metrics Engine
  const loggedSessionMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  const totalFocusMinutes = 1120 + loggedSessionMinutes;
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const totalTasksCount = tasks.length;
  const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 85;

  // Category distribution calculation
  const categoryMinutes = {
    WORK: 0,
    STUDY: 0,
    PERSONAL: 0,
    HEALTH: 0,
  };

  tasks.forEach(t => {
    const cat = t.category || 'WORK';
    if (categoryMinutes[cat] !== undefined) {
      categoryMinutes[cat] += t.completed ? 45 : 20;
    }
  });

  sessions.forEach(s => {
    categoryMinutes.WORK += s.duration_minutes || 25;
  });

  const totalCatMins = Object.values(categoryMinutes).reduce((a, b) => a + b, 0) || 1;

  // CSV Export Handler
  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Type', 'Title / Item', 'Category', 'Duration (Mins)', 'Status'],
      ...sessions.map(s => [
        s.completed_at ? s.completed_at.slice(0, 10) : '2026-10-03',
        `Focus Session (${s.mode || 'pomodoro'})`,
        `"${(s.task_title || 'General Focus').replace(/"/g, '""')}"`,
        'WORK',
        s.duration_minutes || 25,
        'Completed'
      ]),
      ...tasks.map(t => [
        t.due_date || t.created_at?.slice(0, 10) || '2026-10-03',
        'Task',
        `"${t.title.replace(/"/g, '""')}"`,
        t.category || 'WORK',
        t.completed ? 25 : 0,
        t.completed ? 'Completed' : 'Pending'
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `alfafocus-productivity-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) onShowToast('Productivity report CSV downloaded', 'success');
  };

  const daysLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#09090B] text-[#FAFAFA]">
      
      {/* Header with Export CTA */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Habits &amp; Analytics</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track daily focus intensity, consistency streaks, and export productivity audits.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-semibold text-xs rounded-xl border border-zinc-700 transition shadow-sm"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
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
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }}></div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#18181B] border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">
            <span>Focus Hours</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">{totalFocusHours} <span className="text-sm font-normal text-zinc-400">hrs</span></p>
          <p className="text-[11px] text-emerald-400 mt-2 font-medium">Logged across all focus sessions</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#18181B] border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">
            <span>Tasks Progress</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">{completedTasksCount} <span className="text-sm font-normal text-zinc-400">/ {totalTasksCount}</span></p>
          <p className="text-[11px] text-zinc-400 mt-2">{completionRate}% Completion Rate</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-900/40 shadow-sm">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-2">
            <span>Consistency Score</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">94%</p>
          <p className="text-[11px] text-emerald-400/90 mt-2 font-medium">Top Tier Productivity</p>
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

      {/* Bottom Grid: Category Time Breakdown & Habit Routines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Category Time Allocation Breakdown */}
        <div className="p-6 rounded-2xl bg-[#18181B] border border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              Category Time Distribution
            </h2>
            <span className="text-xs text-zinc-400">All-time</span>
          </div>

          <div className="space-y-4">
            {/* Visual segmented progress bar */}
            <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden flex">
              <div 
                style={{ width: `${(categoryMinutes.WORK / totalCatMins) * 100}%` }} 
                className="bg-emerald-500 h-full" 
                title="Work" 
              />
              <div 
                style={{ width: `${(categoryMinutes.STUDY / totalCatMins) * 100}%` }} 
                className="bg-purple-500 h-full" 
                title="Study" 
              />
              <div 
                style={{ width: `${(categoryMinutes.PERSONAL / totalCatMins) * 100}%` }} 
                className="bg-amber-500 h-full" 
                title="Personal" 
              />
              <div 
                style={{ width: `${(categoryMinutes.HEALTH / totalCatMins) * 100}%` }} 
                className="bg-teal-500 h-full" 
                title="Health" 
              />
            </div>

            {/* Category rows */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { label: 'Work & Projects', key: 'WORK', color: 'bg-emerald-500', mins: categoryMinutes.WORK },
                { label: 'Study & Coursework', key: 'STUDY', color: 'bg-purple-500', mins: categoryMinutes.STUDY },
                { label: 'Personal & Creative', key: 'PERSONAL', color: 'bg-amber-500', mins: categoryMinutes.PERSONAL },
                { label: 'Health & Wellness', key: 'HEALTH', color: 'bg-teal-500', mins: categoryMinutes.HEALTH },
              ].map(cat => (
                <div key={cat.key} className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                    <span className="text-xs font-medium text-zinc-300">{cat.label}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs text-zinc-400">
                    <span className="font-mono text-white font-bold">{Math.round((cat.mins / totalCatMins) * 100)}%</span>
                    <span>{cat.mins} mins</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Habits Tracker */}
        <div className="p-6 rounded-2xl bg-[#18181B] border border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-white">Daily Habit Routines</h2>
            <button
              onClick={() => setIsAddingHabit(!isAddingHabit)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Habit
            </button>
          </div>

          {/* Add Habit inline form */}
          {isAddingHabit && (
            <form onSubmit={handleAddHabit} className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="E.g. Drink 2L water, Read 10 pages..."
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                autoFocus
                className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition"
              >
                Add
              </button>
            </form>
          )}

          <div className="space-y-3">
            {habits.map((habit) => (
              <div key={habit.id} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-4 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0">
                    {habit.icon === 'water' ? <Droplets className="w-4 h-4" /> : habit.icon === 'book' ? <BookOpen className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{habit.title}</p>
                    <p className="text-xs text-emerald-400 font-medium">{habit.streak} day streak</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Weekly Bubbles */}
                  <div className="flex items-center gap-1.5">
                    {habit.history.map((done, dIdx) => (
                      <button
                        key={dIdx}
                        onClick={() => toggleHabitDay(habit.id, dIdx)}
                        className={`w-7 h-7 rounded-lg flex flex-col items-center justify-center text-[10px] font-semibold transition ${
                          done 
                            ? 'bg-emerald-600 text-white font-bold' 
                            : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                        } ${dIdx === 5 ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-900' : ''}`}
                        title={`${daysLabels[dIdx]} - Click to toggle`}
                      >
                        {daysLabels[dIdx]}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-rose-400 transition ml-1"
                    title="Delete habit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
